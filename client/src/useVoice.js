import { useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const E = import.meta.env;
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, ...(E.VITE_TURN_URL ? [{ urls: E.VITE_TURN_URL, username: E.VITE_TURN_USER, credential: E.VITE_TURN_PASS }] : [])] };

// Socket presence + WebRTC mesh + Web Audio (GainNode for distance volume, PannerNode for direction)
export function useVoice() {
  const R = useRef({ peers: {}, radius: 250, dir: false }).current;
  const [members, setMembers] = useState([]);
  const [conn, setConn] = useState({});
  const [muted, setMuted] = useState(false);

  const audio = p => {
    if (!p.gain) return;
    p.gain.gain.value = Math.max(0.08, 1 - p.d / R.radius);
    p.pan.positionX.value = R.dir ? p.dx / 100 : 0;
    p.pan.positionZ.value = R.dir ? p.dy / 100 : 0; // listener faces -z, so "up" on the canvas is in front
  };
  const drop = id => { R.peers[id]?.pc.close(); delete R.peers[id]; setConn(c => { const n = { ...c }; delete n[id]; return n; }); };

  const mk = (id, init) => {
    const pc = new RTCPeerConnection(ICE), p = (R.peers[id] = { pc, d: 0, dx: 0, dy: 0 });
    if (init) pc.onnegotiationneeded = async () => {
      await pc.setLocalDescription(await pc.createOffer());
      R.socket.emit('sig', { to: id, data: { sdp: pc.localDescription } });
    };
    pc.onicecandidate = e => e.candidate && R.socket.emit('sig', { to: id, data: { ice: e.candidate } });
    pc.onconnectionstatechange = () => setConn(c => ({ ...c, [id]: pc.connectionState }));
    pc.ontrack = e => {
      const st = e.streams[0];
      p.audio = new Audio(); p.audio.srcObject = st; p.audio.muted = true; // keeps the stream flowing in Chrome
      p.gain = R.ctx.createGain();
      p.pan = R.ctx.createPanner(); p.pan.panningModel = 'equalpower'; p.pan.rolloffFactor = 0; // volume handled by the GainNode
      R.ctx.createMediaStreamSource(st).connect(p.gain).connect(p.pan).connect(R.ctx.destination);
      audio(p);
    };
    R.stream.getTracks().forEach(t => pc.addTrack(t, R.stream));
    return p;
  };

  const onSig = async ({ from, data }) => {
    const pc = (R.peers[from] || mk(from, false)).pc;
    if (data.sdp) {
      await pc.setRemoteDescription(data.sdp);
      if (data.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); R.socket.emit('sig', { to: from, data: { sdp: pc.localDescription } }); }
    } else if (data.ice) { try { await pc.addIceCandidate(data.ice); } catch {} }
  };

  // Every position update: connect to people inside the room radius, disconnect from people who left it
  const onState = list => {
    setMembers(list);
    const me = list.find(m => m.id === R.socket.id);
    if (!me) return;
    const ids = new Set(list.map(m => m.id));
    Object.keys(R.peers).forEach(id => !ids.has(id) && drop(id));
    list.forEach(o => {
      if (o.id === me.id) return;
      const dx = o.x - me.x, dy = o.y - me.y, d = Math.hypot(dx, dy);
      if (d <= R.radius && !R.peers[o.id]) mk(o.id, me.id < o.id);
      else if (d > R.radius * 1.08 && R.peers[o.id]) return drop(o.id);
      const p = R.peers[o.id];
      if (p) { p.d = d; p.dx = dx; p.dy = dy; audio(p); }
    });
  };

  const join = useCallback(async (roomId, name) => {
    R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    R.ctx = new AudioContext(); await R.ctx.resume();
    R.socket = io();
    R.socket.on('state', onState); R.socket.on('sig', onSig);
    const info = await new Promise((ok, no) => R.socket.emit('join', { roomId, name }, r => (r.error ? no(new Error(r.error)) : ok(r))));
    R.radius = info.radius; setMuted(false);
    return info;
  }, []);

  const leave = useCallback(() => {
    Object.keys(R.peers).forEach(drop);
    R.stream?.getTracks().forEach(t => t.stop()); R.socket?.disconnect(); R.ctx?.close();
    setMembers([]); setConn({});
  }, []);

  return {
    members, conn, muted, join, leave,
    move: (x, y) => R.socket?.emit('move', { x, y }),
    toggleMute: () => { const m = !muted; R.stream.getAudioTracks().forEach(t => (t.enabled = !m)); setMuted(m); },
    setDirectional: v => { R.dir = v; Object.values(R.peers).forEach(audio); },
  };
}
