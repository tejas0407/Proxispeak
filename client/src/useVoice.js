import { useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const E = import.meta.env;
const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(E.VITE_TURN_URL ? [{ urls: E.VITE_TURN_URL, username: E.VITE_TURN_USER, credential: E.VITE_TURN_PASS }] : [])
  ]
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function useVoice() {
  const R = useRef({ peers: {}, radius: 250, dir: false, socket: null, stream: null, ctx: null, joinRequest: null }).current;
  const [members, setMembers] = useState([]);
  const [conn, setConn] = useState({});
  const [muted, setMuted] = useState(false);

  const calcGain = (distance, maxDistance) => {
    const dMin = Math.min(maxDistance, Math.max(30, Math.round(maxDistance * 0.2)));
    if (distance <= dMin) return 1;
    if (distance >= maxDistance) return 0;
    return clamp(1 - (distance - dMin) / (maxDistance - dMin), 0, 1);
  };

  const updateAudio = (peer) => {
    if (!peer.gain || !peer.pan || !R.ctx) return;
    const now = R.ctx.currentTime;
    peer.gain.gain.cancelScheduledValues(now);
    peer.gain.gain.setTargetAtTime(calcGain(peer.d, R.radius), now, 0.05);
    const radius = Math.max(1, R.radius);
    const panX = R.dir ? clamp(peer.dx / radius, -1, 1) : 0;
    const panZ = R.dir ? clamp(peer.dy / radius, -1, 1) : 0;
    if (peer.pan.positionX?.setTargetAtTime) {
      peer.pan.positionX.cancelScheduledValues(now);
      peer.pan.positionZ.cancelScheduledValues(now);
      peer.pan.positionX.setTargetAtTime(panX, now, 0.05);
      peer.pan.positionZ.setTargetAtTime(panZ, now, 0.05);
    } else {
      peer.pan.setPosition(panX, 0, panZ);
    }
  };

  const drop = (id) => {
    const peer = R.peers[id];
    if (!peer) return;
    peer.pc.close();
    peer.source?.disconnect();
    peer.gain?.disconnect();
    peer.pan?.disconnect();
    delete R.peers[id];
    setConn((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const clearPeers = () => {
    Object.keys(R.peers).forEach(drop);
    setConn({});
  };

  const makePeer = (id, initiator) => {
    const pc = new RTCPeerConnection(ICE);
    const peer = R.peers[id] = { pc, d: Infinity, dx: 0, dy: 0, pendingIce: [] };

    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          await pc.setLocalDescription(await pc.createOffer());
          R.socket?.emit('sig', { to: id, data: { sdp: pc.localDescription } });
        } catch (error) {
          console.error('Could not create WebRTC offer:', error);
        }
      };
    }
    pc.onicecandidate = (event) => {
      if (event.candidate) R.socket?.emit('sig', { to: id, data: { ice: event.candidate } });
    };
    pc.onconnectionstatechange = () => setConn((current) => ({ ...current, [id]: pc.connectionState }));
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      peer.source?.disconnect();
      peer.source = R.ctx.createMediaStreamSource(stream);
      peer.gain = R.ctx.createGain();
      peer.pan = R.ctx.createPanner();
      peer.pan.panningModel = 'equalpower';
      peer.pan.distanceModel = 'linear';
      peer.pan.maxDistance = 1;
      peer.pan.rolloffFactor = 0;
      peer.source.connect(peer.gain).connect(peer.pan).connect(R.ctx.destination);
      updateAudio(peer);
    };
    R.stream.getTracks().forEach((track) => pc.addTrack(track, R.stream));
    return peer;
  };

  const onSignal = async ({ from, data }) => {
    try {
      const peer = R.peers[from] || makePeer(from, false);
      const pc = peer.pc;
      if (data.sdp) {
        await pc.setRemoteDescription(data.sdp);
        if (data.sdp.type === 'offer') {
          await pc.setLocalDescription(await pc.createAnswer());
          R.socket?.emit('sig', { to: from, data: { sdp: pc.localDescription } });
        }
        for (const candidate of peer.pendingIce.splice(0)) await pc.addIceCandidate(candidate);
      } else if (data.ice) {
        if (pc.remoteDescription) await pc.addIceCandidate(data.ice);
        else peer.pendingIce.push(data.ice);
      }
    } catch (error) {
      console.error('WebRTC signaling failed:', error);
    }
  };

  const onState = (list) => {
    setMembers(list);
    const me = list.find((member) => member.id === R.socket?.id);
    if (!me) return;
    const ids = new Set(list.map((member) => member.id));
    Object.keys(R.peers).forEach((id) => {
      if (!ids.has(id)) drop(id);
    });

    list.forEach((other) => {
      if (other.id === me.id) return;
      const dx = other.x - me.x;
      const dy = other.y - me.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= R.radius && !R.peers[other.id]) makePeer(other.id, me.id < other.id);
      else if (distance > R.radius * 1.08 && R.peers[other.id]) return drop(other.id);

      const peer = R.peers[other.id];
      if (peer) {
        peer.d = distance;
        peer.dx = dx;
        peer.dy = dy;
        updateAudio(peer);
      }
    });
  };

  const cleanup = () => {
    clearPeers();
    R.stream?.getTracks().forEach((track) => track.stop());
    R.socket?.removeAllListeners();
    R.socket?.disconnect();
    R.ctx?.close();
    R.stream = null;
    R.socket = null;
    R.ctx = null;
    R.joinRequest = null;
  };

  const join = useCallback(async (roomId, name) => {
    cleanup();
    try {
      R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      R.ctx = new AudioContext();
      await R.ctx.resume();
      R.joinRequest = { roomId, name };
      R.socket = io({ autoConnect: false });
      R.socket.on('state', onState);
      R.socket.on('sig', onSignal);
      R.socket.on('disconnect', () => {
        clearPeers();
        setMembers([]);
      });

      const info = await new Promise((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error('The room server did not respond. Try again.'));
          }
        }, 10000);

        R.socket.on('connect', () => {
          R.socket.emit('join', R.joinRequest, (result) => {
            if (result?.error) {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                reject(new Error(result.error));
              } else {
                console.error('Could not rejoin room:', result.error);
              }
              return;
            }
            R.radius = result.radius;
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(result);
            }
          });
        });
        R.socket.on('connect_error', (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          }
        });
        R.socket.connect();
      });
      setMuted(false);
      return info;
    } catch (error) {
      cleanup();
      throw error;
    }
  }, []);

  const leave = useCallback(() => {
    cleanup();
    setMembers([]);
    setConn({});
  }, []);

  return {
    members, conn, muted, join, leave,
    move: (x, y) => R.socket?.emit('move', { x, y }),
    toggleMute: () => {
      const nextMuted = !muted;
      R.stream?.getAudioTracks().forEach((track) => (track.enabled = !nextMuted));
      setMuted(nextMuted);
    },
    setDirectional: (value) => {
      R.dir = value;
      Object.values(R.peers).forEach(updateAudio);
    }
  };
}
