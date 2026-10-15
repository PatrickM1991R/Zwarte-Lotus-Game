import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const phases = ['START','ALARM','CAMERA','KIST_OPEN','DOSSIER','ORIGINELE_CONTAINER','ROTJE_KNOR','JOHNNY_ONTMASKERD','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','EINDE'];

const phaseLabels = {
  START: 'Introductie', ALARM: 'Alarmreconstructie', CAMERA: 'Camerafeeds', KIST_OPEN: 'Kistcode', DOSSIER: 'Dossier',
  ORIGINELE_CONTAINER: 'Originele container', ROTJE_KNOR: 'Rotje Knor', JOHNNY_ONTMASKERD: 'Johnny ontmaskerd', NIEUWE_CONTAINER: 'Nieuwe container', KEUZE: 'Keuze', JOHNNY_ROUTE: 'Johnny-route', KLUIS: 'Kluis', LOTUS_GEVONDEN: 'Lotus gevonden', EINDE: 'Einde'
};

function App() {
  const [mode, setMode] = useState('login');
  const [team, setTeam] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const loginTeam = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${API}/api/team-login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ teamName: form.get('teamName'), code: form.get('code') }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Inloggen mislukt');
      setTeam(j.team); setMode('game');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const loadDashboard = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/facilitator/location/1`); const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Dashboard niet beschikbaar');
      setDashboard(j); setMode('facilitator');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const startGame = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/start`, { method: 'POST' });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Starten mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const submitAnswer = async (phase, answer) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/answer`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phase, answer }) });
      const j = await r.json();
      if (!r.ok) { setFeedback(j.error || 'Dat antwoord klopt nog niet.'); return false; }
      setTeam(j.team); setFeedback(''); return true;
    } catch (err) { setFeedback('Verbinding met het spelsysteem mislukt.'); return false; }
    finally { setLoading(false); }
  };

  const requestHint = async (text) => {
    setFeedback(text);
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/hint`, { method:'POST' });
      const j = await r.json(); if (r.ok) setTeam(j.team);
    } catch {}
  };

  if (mode === 'game' && team) {
    const idx = Math.max(0, phases.indexOf(team.currentPhase));
    return <main className="app-shell game-shell">
      <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Uitloggen</button><div className="eyebrow">DE ZWARTE LOTUS</div></section>
      <section className="hero compact"><div><span className="chip">{team.locationName}</span><h1>{team.teamName}</h1><p>Spelronde: {team.eventName}</p></div><div className="progress-ring">{Math.round((idx/(phases.length-1))*100)}%</div></section>
      <GamePhase team={team} loading={loading} feedback={feedback} startGame={startGame} submitAnswer={submitAnswer} requestHint={requestHint}/>
      <section className="stats"><div><strong>{team.hintCount}</strong><span>Hints</span></div><div><strong>{idx+1}/{phases.length}</strong><span>{phaseLabels[team.currentPhase] || 'Fase'}</span></div><div><strong>{team.chosenRoute || '—'}</strong><span>Route</span></div></section>
    </main>;
  }

  if (mode === 'facilitator' && dashboard) {
    return <main className="app-shell wide">
      <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Terug</button><div className="eyebrow">SPELBEGELEIDER</div></section>
      <section className="hero compact"><div><span className="chip">LOCATIE</span><h1>{dashboard.location.name}</h1><p>{dashboard.event.name} · {dashboard.teams.length} teams actief</p></div><button className="secondary" onClick={loadDashboard}>Vernieuwen</button></section>
      <section className="table-card"><table><thead><tr><th>Team</th><th>Fase</th><th>Tijd</th><th>Hints</th><th>Route</th><th>Status</th></tr></thead><tbody>{dashboard.teams.map(t=><tr key={t.id}><td><strong>{t.teamName}</strong></td><td>{phaseLabels[t.currentPhase] || t.currentPhase.replaceAll('_',' ')}</td><td>{t.elapsedMinutes} min</td><td>{t.hintCount}</td><td>{t.chosenRoute||'—'}</td><td><span className={`status ${t.status}`}>{t.status}</span></td></tr>)}</tbody></table></section>
    </main>;
  }

  return <main className="login-wrap">
    <section className="brand"><div className="lotus-mark">✦</div><div className="eyebrow">MAISON BEAUMONT</div><h1>DE ZWARTE LOTUS</h1><p>Een interactief onderzoek naar de verdwenen zwarte diamant.</p></section>
    <section className="login-card">
      <form onSubmit={loginTeam}><label>Teamnaam<input name="teamName" placeholder="Bijv. Team Nacht" required/></label><label>Spelcode<input name="code" placeholder="LOTUS-4171" autoCapitalize="characters" required/></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={loading}>{loading?'Controleren...':'Start het onderzoek'}</button></form>
      <div className="divider"><span>spelbegeleider</span></div>
      <button className="secondary full" onClick={loadDashboard} disabled={loading}>Open locatiedashboard</button>
      <p className="demo">Demo teamcode: <strong>LOTUS-4171</strong></p>
    </section>
  </main>;
}

function GamePhase({ team, loading, feedback, startGame, submitAnswer, requestHint }) {
  const phase = team.currentPhase;
  if (phase === 'START') return <section className="panel cinematic intro-panel">
    <div className="section-label">MAISON BEAUMONT · VERTROUWELIJK</div>
    <h2>Een diner. Een diamant. Een verdwenen spoor.</h2>
    <p>Vanavond presenteert Maison Beaumont één van de zeldzaamste stenen ter wereld: <strong>De Zwarte Lotus</strong>. Een zwarte diamant met een waarde waar mensen voor liegen, verdwijnen — en erger.</p>
    <p>Voor jullie staat een afgesloten kist. Open hem pas wanneer het spelsysteem daar opdracht voor geeft. Alles wat jullie nodig hebben, zit in de ruimte, in de dossiers of op dit scherm.</p>
    <div className="mission-card"><span>MISSIE 01</span><strong>Reconstrueer het alarm en achterhaal de code van de kist.</strong></div>
    <button className="primary" onClick={startGame} disabled={loading}>{loading?'Starten...':'Start het onderzoek'}</button>
  </section>;

  if (phase === 'ALARM') return <PuzzleCard label="PUZZEL 1 · ALARMRECONSTRUCTIE" title="Wanneer werd de vitrine geopend?" feedback={feedback}>
    <p>Luister naar het beveiligingsbericht van Maison Beaumont. Noteer het tijdstip waarop het <strong>vitrinecontact</strong> werd verbroken.</p>
    <audio className="audio-player" controls preload="metadata" src="/assets/alarmfragment.mp3" />
    <AnswerForm loading={loading} placeholder="Bijv. 14" maxLength={5} button="Controleer tijdstip" onSubmit={(v)=>submitAnswer('ALARM',v)} />
    <button className="hint-link" onClick={()=>requestHint('Hint: het hoofdalarm ging om 20:17 af. De vitrine werd drie minuten eerder geopend.')}>Hint aanvragen</button>
  </PuzzleCard>;

  if (phase === 'CAMERA') return <PuzzleCard label="PUZZEL 2 · CAMERAFEEDS" title="Welke camera valt uit?" feedback={feedback}>
    <p>Je weet nu wanneer het vitrinecontact werd verbroken. Analyseer de vier feeds en bepaal welke camera <strong>één minuut later</strong> uitvalt.</p>
    <img className="evidence-image" src="/assets/camera-dashboard.png" alt="Vier beveiligingscamera's van Maison Beaumont" />
    <AnswerForm loading={loading} placeholder="Cameranummer, bijv. 03" maxLength={9} button="Controleer camera" onSubmit={(v)=>submitAnswer('CAMERA',v)} />
    <button className="hint-link" onClick={()=>requestHint('Hint: vergelijk 20:14 met de tijdstempels op de camerafeeds. Zoek exact één minuut later.')}>Hint aanvragen</button>
  </PuzzleCard>;

  if (phase === 'KIST_OPEN') return <PuzzleCard label="KISTCODE · 4 CIJFERS" title="Combineer beide antwoorden" feedback={feedback}>
    <p>Je hebt nu twee antwoorden verzameld. Zet ze direct achter elkaar:</p>
    <div className="code-combine"><span>PUZZEL 1</span><b>••</b><em>+</em><span>PUZZEL 2</span><b>••</b></div>
    <p>Voer de vier cijfers in. Bij een correcte code mag de fysieke kist op tafel worden geopend.</p>
    <AnswerForm loading={loading} placeholder="••••" inputMode="numeric" maxLength={4} button="Ontgrendel kist" onSubmit={(v)=>submitAnswer('KIST_OPEN',v)} />
    <button className="hint-link" onClick={()=>requestHint('Hint: gebruik de twee cijfers uit de alarmreconstructie gevolgd door het tweecijferige cameranummer.')}>Hint aanvragen</button>
  </PuzzleCard>;

  if (phase === 'DOSSIER') return <DossierPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;

  return <section className="panel"><div className="section-label">HUIDIGE FASE</div><h2>{phaseLabels[phase] || phase.replaceAll('_',' ')}</h2><p>Deze fase bouwen we in de volgende stap verder uit.</p></section>;
}


const suspects = [
  { id:'johnny', name:'Johnny Jatwerk', alias:'De Wegbrenger' },
  { id:'don', name:'Don Diamantini', alias:'De Koning van de Karaat' },
  { id:'freddy', name:'Freddy Flessentrekker', alias:'De Bonnenkoning' },
  { id:'carla', name:'Carla Kraak', alias:'De Slotfluisteraar' },
  { id:'rita', name:'Rita Ratel', alias:'De Fluwelen Hand' },
  { id:'boris', name:'Boris Breekijzer', alias:'De Man met de Koevoet' },
  { id:'vera', name:'Valse Vera', alias:'De Vrouw met Zeven Namen' },
  { id:'max', name:'Max Muntwasser', alias:'De Schone Boekhouder' }
];

function DossierPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [selected,setSelected]=useState([]);
  const toggle=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):(prev.length<4?[...prev,id]:prev));
  const submit=async()=>{
    if(selected.length!==4) return;
    await submitAnswer('DOSSIER', selected);
  };
  return <section className="panel dossier-ready">
    <div className="success-seal">KIST ONTGRENDELD</div>
    <div className="section-label">FASE 2 · HET DOSSIER</div>
    <h2>Wie vormden samen het heist-team?</h2>
    <p>Leg de acht fysieke dossierkaarten voor jullie neer. Gebruik de bewijsstukken uit de kist en bepaal welke <strong>vier personen noodzakelijk waren voor de oorspronkelijke roof</strong>.</p>
    <div className="mission-card"><span>OPDRACHT</span><strong>Selecteer precies vier verdachten.</strong></div>
    <div className="suspect-grid">{suspects.map(s=>{
      const active=selected.includes(s.id);
      return <button type="button" key={s.id} className={`suspect-card ${active?'selected':''}`} onClick={()=>toggle(s.id)} aria-pressed={active}>
        <span className="suspect-check">{active?'✓':'○'}</span>
        <strong>{s.name}</strong>
        <small>{s.alias}</small>
      </button>
    })}</div>
    <div className="selection-footer"><span><strong>{selected.length}/4</strong> geselecteerd</span><button className="primary" type="button" disabled={loading||selected.length!==4} onClick={submit}>{loading?'Controleren...':'Controleer verdachten'}</button></div>
    <button className="hint-link" onClick={()=>requestHint('Hint: denk niet alleen aan wie verdacht is. Welke vier functies waren noodzakelijk om de vitrine te openen, papieren te regelen, een koper te hebben en de diamant te vervoeren?')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function PuzzleCard({label,title,feedback,children}) {
  return <section className="panel puzzle-card"><div className="section-label">{label}</div><h2>{title}</h2>{children}{feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}</section>;
}

function AnswerForm({onSubmit,loading,placeholder,button,maxLength=12,inputMode='text'}) {
  const [value,setValue]=useState('');
  const submit = async (e)=>{ e.preventDefault(); const ok=await onSubmit(value); if(!ok) setValue(value); };
  return <form className="answer-form" onSubmit={submit}><input value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} autoComplete="off" required/><button className="primary" disabled={loading}>{loading?'Controleren...':button}</button></form>;
}

createRoot(document.getElementById('root')).render(<App/>);
