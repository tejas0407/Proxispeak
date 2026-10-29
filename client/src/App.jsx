import { useEffect, useState } from 'react';
import { useVoice } from './useVoice';
import Stage from './Stage';

const api = async (p, body) => {
  const r = await fetch(p, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

export default function App() {
  const v = useVoice();
  const [rooms, setRooms] = useState([]), [name, setName] = useState(''), [rn, setRn] = useState(''), [rr, setRr] = useState(250);
  const [err, setErr] = useState(''), [info, setInfo] = useState(null), [dir, setDir] = useState(false);

  const load = () => api('/api/rooms').then(setRooms).catch(() => setErr('Cannot reach the server. Is it running?'));
  useEffect(() => { load(); }, []);

  const enter = async id => {
    if (!name.trim()) return setErr('Enter your name first.');
    try { setErr(''); setInfo(await v.join(id, name.trim())); }
    catch (e) { setErr(e.name === 'NotAllowedError' ? 'Microphone blocked. Allow it in the address bar and try again.' : e.message); }
  };
  const create = async () => { try { setErr(''); await api('/api/rooms', { name: rn, radius: +rr }); setRn(''); load(); } catch (e) { setErr(e.message); } };
  const leave = () => { v.leave(); setInfo(null); setDir(false); load(); };

  if (!info) return (
    <div className="relative grid h-screen place-items-center overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
        <i className="ring-i" /><i className="ring-i [animation-delay:1.5s] !border-mint" /><i className="ring-i [animation-delay:3s]" /><i className="ring-i [animation-delay:4.5s] !border-mint" />
      </div>
      <div className="relative grid w-[min(480px,90vw)] gap-4 py-8">
        <h1 className="text-[clamp(44px,10vw,76px)] font-extrabold leading-[.92] tracking-[-3px]">Talk to whoever is near.</h1>
        <p className="leading-relaxed text-dim">Step into a room, move around, and hear people by how close they are. Walk away and their voice fades out. Use headphones when testing on one device.</p>
        <input className="field" value={name} onChange={e => setName(e.target.value)} maxLength={20} placeholder="Your name" aria-label="Your name" />
        <div className="grid gap-2">
          {rooms.map(r => (
            <button key={r._id} onClick={() => enter(r._id)} className="btn btn-alt flex items-center justify-between text-left">
              <span>{r.name}</span><span className="text-sm font-normal text-dim">{r.online} here, range {r.radius} m</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="field" value={rn} onChange={e => setRn(e.target.value)} placeholder="New room name" aria-label="New room name" />
          <input className="field !w-24" type="number" min="80" max="600" value={rr} onChange={e => setRr(e.target.value)} aria-label="Hearing radius in metres" />
          <button className="btn !flex-none" onClick={create}>Create</button>
        </div>
        <div className="min-h-5 text-sm text-tan">{err}</div>
      </div>
    </div>
  );

  const me = v.members.find(m => m.id === info.id);
  const others = v.members.filter(m => m.id !== info.id).map(o => ({ ...o, d: me ? Math.round(Math.hypot(o.x - me.x, o.y - me.y)) : 0 })).sort((a, b) => a.d - b.d);
  return (
    <div className="flex h-screen flex-col-reverse md:flex-row">
      <aside className="z-10 flex h-1/2 w-full flex-col gap-4 overflow-y-auto border-line bg-plum2 p-5 md:h-full md:w-[350px] md:border-r-2">
        <h1 className="text-[28px] font-extrabold tracking-tight">ProxiSpeak</h1>
        <div className="flex items-center gap-2 text-sm text-dim"><i className="h-2.5 w-2.5 flex-none rounded-full bg-mint" />In {info.room}, hearing range {info.radius} m</div>
        <div className="flex gap-2.5">
          <button className={'btn btn-alt ' + (v.muted ? 'btn-on' : '')} onClick={v.toggleMute}>{v.muted ? 'Muted' : 'Mic on'}</button>
          <button className="btn btn-alt" onClick={leave}>Leave room</button>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-dim">
          <input type="checkbox" className="accent-tan" checked={dir} onChange={e => { setDir(e.target.checked); v.setDirectional(e.target.checked); }} />
          Directional audio (hear left and right)
        </label>
        <h2 className="text-[15px] font-semibold text-dim">{others.length ? `In this room (${others.length})` : 'In this room'}</h2>
        <div className="grid gap-2.5">
          {others.map(o => {
            const inR = o.d <= info.radius, st = v.conn[o.id];
            const dMin = Math.max(30, Math.round(info.radius * 0.2));
            const pct = !inR ? 0 : o.d <= dMin ? 100 : Math.round(Math.max(0, 1 - (o.d - dMin) / (info.radius - dMin)) * 100);
            const lbl = !inR ? 'out of range' : st === 'connected' ? 'talking' : st === 'failed' ? 'blocked by network' : 'connecting';
            return (
              <div key={o.id} className={'grid grid-cols-[14px_1fr_54px] items-center gap-3 rounded-2xl bg-plum px-3.5 py-3 ' + (inR ? '' : 'opacity-50')}>
                <i className="h-3.5 w-3.5 rounded-full" style={{ background: o.color }} />
                <div><b className="block font-semibold">{o.name}</b><small className="text-dim">{o.d} m away, {lbl}</small></div>
                <div className="h-2 overflow-hidden rounded bg-line" title={`Volume: ${pct}%`}><span className="block h-full transition-all duration-150" style={{ width: pct + '%', background: o.color }} /></div>
              </div>
            );
          })}
          {!others.length && <p className="text-sm leading-relaxed text-dim">You are alone. Open this page in another browser window, join the same room, and walk the two avatars close together.</p>}
        </div>
        <p className="mt-auto text-sm text-dim">Move with WASD or arrow keys, or click the floor.</p>
      </aside>
      <main className="min-h-0 flex-1"><Stage info={info} members={v.members} onMove={v.move} /></main>
    </div>
  );
}
