import { useEffect, useState } from 'react';
import { useVoice } from './useVoice';
import Stage from './Stage';

const api = async (p, body) => {
  const r = await fetch(p, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

function Brand({ compact = false }) {
  return <div className="flex items-center gap-3"><div className="brand-mark"><span /><span /><span /></div><div><div className="text-lg font-bold tracking-tight text-ink">ProxiSpeak</div>{!compact && <div className="text-xs text-muted">Spatial voice rooms</div>}</div></div>;
}

export default function App() {
  const v = useVoice();
  const [rooms, setRooms] = useState([]), [name, setName] = useState(''), [rn, setRn] = useState(''), [rr, setRr] = useState(250);
  const [err, setErr] = useState(''), [info, setInfo] = useState(null), [dir, setDir] = useState(false), [loading, setLoading] = useState(true);

  const load = () => api('/api/rooms').then(setRooms).catch(() => setErr('Could not connect to ProxiSpeak. Please check that the server is running.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const enter = async id => {
    if (!name.trim()) return setErr('Add your display name before joining a room.');
    try { setErr(''); setInfo(await v.join(id, name.trim())); }
    catch (e) { setErr(e.name === 'NotAllowedError' ? 'Microphone access is blocked. Allow it in your browser settings and try again.' : e.message); }
  };
  const create = async () => { try { setErr(''); await api('/api/rooms', { name: rn, radius: +rr }); setRn(''); load(); } catch (e) { setErr(e.message); } };
  const leave = () => { v.leave(); setInfo(null); setDir(false); load(); };

  if (!info) return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Brand /><span className="hidden rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex"><i className="mr-2 mt-1 h-2 w-2 rounded-full bg-green-500" />Live spatial audio</span></header>
      <main className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-12 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-20 lg:pt-12">
        <section className="max-w-2xl">
          <div className="eyebrow"><span className="mr-2 text-brand">✳</span>VOICE THAT MOVES WITH YOU</div>
          <h1 className="mt-5 text-5xl font-bold leading-[1.04] tracking-[-.045em] sm:text-6xl lg:text-7xl">The closer you are,<br /><span className="text-brand">the clearer it gets.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">Drop into a shared space and talk naturally. Voices grow softer as people move away, so distance becomes part of the conversation.</p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3"><div className="feature"><b>01</b><span>Choose a room</span></div><div className="feature"><b>02</b><span>Allow your mic</span></div><div className="feature"><b>03</b><span>Move to explore</span></div></div>
          <div className="mt-10 rounded-3xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4"><h2 className="text-lg font-bold">Join the conversation</h2><p className="mt-1 text-sm text-muted">Choose a name, then join a space or start one.</p></div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted" htmlFor="display-name">Your display name</label>
            <input id="display-name" className="field" value={name} onChange={e => setName(e.target.value)} maxLength={20} placeholder="e.g. Alex" />
            <div className="mt-5 flex items-center justify-between"><h3 className="font-bold">Available rooms</h3><span className="text-xs text-muted">{rooms.length} {rooms.length === 1 ? 'space' : 'spaces'}</span></div>
            <div className="mt-3 grid gap-2">
              {loading && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted">Finding rooms…</p>}
              {!loading && rooms.map(r => <button key={r._id} onClick={() => enter(r._id)} className="room-choice"><span className="flex min-w-0 items-center gap-3"><span className="room-dot" /><span className="truncate font-semibold">{r.name}</span></span><span className="shrink-0 text-xs text-muted">{r.online} online <span className="mx-1 text-border">·</span> {r.radius}m range</span></button>)}
              {!loading && !rooms.length && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted">No rooms yet. Create the first one below.</p>}
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_116px_auto]">
              <input className="field" value={rn} onChange={e => setRn(e.target.value)} placeholder="New room name" aria-label="New room name" maxLength={40} />
              <label className="field flex items-center gap-2 !px-3"><input className="w-full min-w-0 bg-transparent font-semibold outline-none" type="number" min="80" max="600" value={rr} onChange={e => setRr(e.target.value)} aria-label="Hearing radius in metres" /><span className="text-xs text-muted">metres</span></label>
              <button className="btn" onClick={create}>Create room <span aria-hidden="true">→</span></button>
            </div>
            <div role="status" className="mt-3 min-h-5 text-sm font-medium text-red-700">{err}</div>
          </div>
        </section>
        <section className="relative hidden min-h-[620px] overflow-hidden rounded-[2rem] border border-border bg-white p-8 shadow-card lg:block" aria-label="Illustration of how distance changes volume">
          <div className="absolute inset-0 bg-[radial-gradient(#dce4ed_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative flex items-center justify-between"><div><div className="eyebrow">A MORE NATURAL WAY TO TALK</div><h2 className="mt-2 text-2xl font-bold">Sound has a sense of place.</h2></div><span className="rounded-full bg-brandSoft px-3 py-1.5 text-xs font-bold text-brand">LIVE SPACE</span></div>
          <div className="hero-map absolute inset-x-8 bottom-24 top-36"><div className="map-line map-line-a"/><div className="map-line map-line-b"/><div className="range range-outer"/><div className="range range-inner"/><div className="map-person map-you"><i>Y</i><span>You</span></div><div className="map-person map-guest"><i>A</i><span>Alex <small>Near</small></span></div><div className="map-person map-far"><i>M</i><span>Morgan <small>Fading</small></span></div><div className="map-label">YOUR HEARING RANGE</div></div>
          <div className="absolute inset-x-8 bottom-7 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white/90 py-3 text-center"><div><b className="block text-sm">Nearby</b><span className="text-xs text-muted">Full volume</span></div><div><b className="block text-sm">Further away</b><span className="text-xs text-muted">Fades gently</span></div><div><b className="block text-sm">Out of range</b><span className="text-xs text-muted">Quiet</span></div></div>
        </section>
      </main>
      <footer className="border-t border-border bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10"><span>ProxiSpeak · Spatial audio for shared spaces</span><span>Tip: Use headphones when testing with multiple browser windows.</span></div></footer>
    </div>
  );

  const me = v.members.find(m => m.id === info.id);
  const others = v.members.filter(m => m.id !== info.id).map(o => ({ ...o, d: me ? Math.round(Math.hypot(o.x - me.x, o.y - me.y)) : 0 })).sort((a, b) => a.d - b.d);
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink md:h-screen md:flex-row md:overflow-hidden">
      <aside className="z-10 flex w-full shrink-0 flex-col gap-5 border-b border-border bg-white p-5 md:h-full md:w-[350px] md:overflow-y-auto md:border-b-0 md:border-r md:p-6">
        <div className="flex items-center justify-between"><Brand compact /><span className="flex items-center gap-2 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"><i className="h-2 w-2 rounded-full bg-green-500"/>Room active</span></div>
        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-[.12em] text-muted">You are in</div><div className="mt-1 text-xl font-bold">{info.room}</div><div className="mt-2 flex items-center gap-2 text-sm text-muted"><span className="h-2 w-2 rounded-full bg-brand"/>Hearing radius <b className="text-ink">{info.radius} m</b></div></div>
        <div className="grid grid-cols-2 gap-2"><button className={'btn ' + (v.muted ? 'btn-muted' : 'btn-secondary')} onClick={v.toggleMute}>{v.muted ? 'Unmute mic' : 'Mute mic'}</button><button className="btn btn-secondary" onClick={leave}>Leave room</button></div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3.5"><input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={dir} onChange={e => { setDir(e.target.checked); v.setDirectional(e.target.checked); }} /><span><b className="block text-sm">Directional audio</b><small className="text-xs text-muted">Hear where a voice is coming from</small></span></label>
        <div><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">People nearby</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">{others.length}</span></div>
          <div className="grid gap-2.5">
            {others.map(o => { const inR = o.d <= info.radius, st = v.conn[o.id], dMin = Math.max(30, Math.round(info.radius * 0.2)); const pct = !inR ? 0 : o.d <= dMin ? 100 : Math.round(Math.max(0, 1 - (o.d - dMin) / (info.radius - dMin)) * 100); const lbl = !inR ? 'Out of range' : st === 'connected' ? 'Connected' : st === 'failed' ? 'Network issue' : 'Connecting'; return <div key={o.id} className={'flex items-center gap-3 rounded-2xl border border-border p-3 ' + (!inR ? 'opacity-55' : '')}><span className="h-9 w-9 shrink-0 rounded-full ring-4 ring-white" style={{ background: o.color }}/><div className="min-w-0 flex-1"><b className="block truncate text-sm">{o.name}</b><small className="text-xs text-muted">{o.d} m · {lbl}</small></div><div className="w-12"><div className="h-1.5 overflow-hidden rounded-full bg-slate-100" title={`Approximate volume: ${pct}%`}><span className="block h-full rounded-full bg-brand transition-all duration-150" style={{ width: pct + '%' }}/></div><small className="mt-1 block text-right text-[10px] text-muted">{pct}%</small></div></div>; })}
            {!others.length && <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted">You are the first here. Open ProxiSpeak in another browser window and join this same room to try spatial audio.</p>}
          </div>
        </div>
        <div className="mt-auto rounded-2xl bg-brandSoft p-4"><b className="text-sm">Move around the space</b><p className="mt-1 text-xs leading-5 text-muted">Use WASD or arrow keys, or click anywhere on the map. Voices fade as distance increases.</p></div>
      </aside>
      <main className="relative min-h-[55vh] flex-1 md:min-h-0"><div className="absolute left-4 top-4 z-[1] rounded-full border border-border bg-white/95 px-3 py-2 text-xs font-semibold text-muted shadow-sm sm:left-6 sm:top-6"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500"/>Shared room map</div><Stage info={info} members={v.members} onMove={v.move} /></main>
    </div>
  );
}
