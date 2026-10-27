import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ROTJE_PHONE = import.meta.env.VITE_ROTJE_PHONE || '';
const JOHNNY_COORDS = import.meta.env.VITE_JOHNNY_COORDS || 'Wordt door de spelbegeleider ingesteld';
const phases = ['START','ALARM','DOSSIER','ORIGINELE_CONTAINER','ROTJE_KNOR','JOHNNY_ONTMASKERD','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','EINDOPERATIE','RESULTAAT'];

const phaseLabels = {
  START: 'Introductie', ALARM: 'Open de kist', CAMERA: 'Open de kist', KIST_OPEN: 'Open de kist', DOSSIER: 'Dossier',
  ORIGINELE_CONTAINER: 'Originele container', ROTJE_KNOR: 'Rotje Knor', JOHNNY_ONTMASKERD: 'Johnny ontmaskerd', NIEUWE_CONTAINER: 'Nieuwe container', KEUZE: 'Keuze', JOHNNY_ROUTE: 'Naar de kluis', KLUIS: 'Kluiscode', LOTUS_GEVONDEN: 'Lotus gevonden', EINDOPERATIE: 'Eindoperatie', RESULTAAT: 'Zaak afgerond'
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

  const startCountdown = async () => {
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/timer-start`, { method:'POST' });
      const j = await r.json();
      if (r.ok) setTeam(j.team);
    } catch {}
  };

  const submitOpening = async (answers) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/opening`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(answers) });
      const j = await r.json();
      if (!r.ok) { setFeedback(j.error || 'Nog niet alle antwoorden kloppen.'); return false; }
      setTeam(j.team); setFeedback(''); return true;
    } catch (err) { setFeedback('Verbinding met het spelsysteem mislukt.'); return false; }
    finally { setLoading(false); }
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

  const chooseRoute = async (route) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/route`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ route }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Keuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const chooseFinal = async (choice) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/final-choice`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ choice }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Eindkeuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  if (mode === 'game' && team) {
    const idx = Math.max(0, phases.indexOf(team.currentPhase));
    return <main className="scene-page">
      <div className="scene-backdrop" aria-hidden="true"></div>
      <div className="scene-vignette" aria-hidden="true"></div>
      <div className="app-shell game-shell scene-inner">
        <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Uitloggen</button><GameCountdown timerStartedAt={team.timerStartedAt}/><div className="eyebrow">DE ZWARTE LOTUS</div></section>
        <section className="hero compact"><div><span className="chip">{team.locationName}</span><h1>{team.teamName}</h1><p>Spelronde: {team.eventName}</p></div><div className="progress-ring">{Math.round((idx/(phases.length-1))*100)}%</div></section>
        <GamePhase team={team} loading={loading} feedback={feedback} startGame={startGame} submitOpening={submitOpening} startCountdown={startCountdown} submitAnswer={submitAnswer} requestHint={requestHint} chooseRoute={chooseRoute} chooseFinal={chooseFinal}/>
        <section className="stats"><div><strong>{team.hintCount}</strong><span>Hints</span></div><div><strong>{idx+1}/{phases.length}</strong><span>{phaseLabels[team.currentPhase] || 'Fase'}</span></div><div><strong>{team.chosenRoute || '—'}</strong><span>Route</span></div></section>
      </div>
    </main>;
  }

  if (mode === 'facilitator' && dashboard) {
    return <main className="scene-page">
      <div className="scene-backdrop" aria-hidden="true"></div>
      <div className="scene-vignette" aria-hidden="true"></div>
      <div className="app-shell wide scene-inner">
        <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Terug</button><div className="eyebrow">SPELBEGELEIDER</div></section>
        <section className="hero compact"><div><span className="chip">LOCATIE</span><h1>{dashboard.location.name}</h1><p>{dashboard.event.name} · {dashboard.teams.length} teams actief</p></div><button className="secondary" onClick={loadDashboard}>Vernieuwen</button></section>
        <section className="table-card"><table><thead><tr><th>Team</th><th>Fase</th><th>Tijd</th><th>Hints</th><th>Route</th><th>Status</th></tr></thead><tbody>{dashboard.teams.map(t=><tr key={t.id}><td><strong>{t.teamName}</strong></td><td>{phaseLabels[t.currentPhase] || t.currentPhase.replaceAll('_',' ')}</td><td>{t.elapsedMinutes} min</td><td>{t.hintCount}</td><td>{t.chosenRoute||'—'}</td><td><span className={`status ${t.status}`}>{t.status}</span></td></tr>)}</tbody></table></section>
      </div>
    </main>;
  }

  return <main className="login-scene">
    <div className="login-backdrop" aria-hidden="true"></div>
    <div className="login-vignette" aria-hidden="true"></div>
    <div className="login-wrap login-content">
      <section className="brand login-brand">
        <div className="case-tag"><span></span> MAISON BEAUMONT · DOSSIER 014</div>
        <div className="lotus-mark">✦</div>
        <div className="eyebrow">VERTROUWELIJKE OPERATIE</div>
        <h1>DE ZWARTE<br/>LOTUS</h1>
        <p>De diamant is verdwenen. Het spoor loopt via de haven. Jullie team heeft één opdracht: reconstrueer de roof voordat de steen voorgoed verdwijnt.</p>
        <div className="login-clues">
          <span><b>01</b> Onderzoek het alarm</span>
          <span><b>02</b> Ontmasker het netwerk</span>
          <span><b>03</b> Vind de Zwarte Lotus</span>
        </div>
      </section>
      <section className="login-card login-glass">
        <div className="login-card-head">
          <div><span>TEAMTOEGANG</span><strong>Start onderzoek</strong></div>
          <div className="access-light">LIVE</div>
        </div>
        <form onSubmit={loginTeam}>
          <label>Teamnaam<input name="teamName" placeholder="Bijv. Team Nacht" required/></label>
          <label>Spelcode<input name="code" placeholder="LOTUS-4171" autoCapitalize="characters" required/></label>
          {error&&<div className="error">{error}</div>}
          <button className="primary full login-start" disabled={loading}>{loading?'Controleren...':'Start het onderzoek'}</button>
        </form>
        <div className="security-strip"><span>●</span> Verbinding beveiligd · Maison Beaumont</div>
        <div className="divider"><span>spelbegeleider</span></div>
        <button className="secondary full" onClick={loadDashboard} disabled={loading}>Open locatiedashboard</button>
        <p className="demo">Demo teamcode: <strong>LOTUS-4171</strong></p>
      </section>
    </div>
  </main>;
}

function GameCountdown({timerStartedAt}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    if(!timerStartedAt) return;
    const id=setInterval(()=>setNow(Date.now()),1000);
    return()=>clearInterval(id);
  },[timerStartedAt]);
  if(!timerStartedAt) return <div className="game-countdown waiting"><span>TIJD</span><strong>90:00</strong><small>start na briefing</small></div>;
  const elapsed=Math.floor((now-Number(timerStartedAt))/1000);
  const remaining=Math.max(0,5400-elapsed);
  const min=Math.floor(remaining/60);
  const sec=remaining%60;
  return <div className={`game-countdown ${remaining<=900?'urgent':''} ${remaining===0?'expired':''}`}><span>{remaining===0?'TIJD VERSTREKEN':'TIJD OVER'}</span><strong>{String(min).padStart(2,'0')}:{String(sec).padStart(2,'0')}</strong><small>90 minuten</small></div>;
}

function GamePhase({ team, loading, feedback, startGame, submitOpening, startCountdown, submitAnswer, requestHint, chooseRoute, chooseFinal }) {
  const phase = team.currentPhase;
  if (phase === 'START') return <section className="panel cinematic intro-panel">
    <div className="section-label">MAISON BEAUMONT · VERTROUWELIJK</div>
    <h2>Een diner. Een diamant. Een verdwenen spoor.</h2>
    <p>Vanavond presenteert Maison Beaumont één van de zeldzaamste stenen ter wereld: <strong>De Zwarte Lotus</strong>. Een zwarte diamant met een waarde waar mensen voor liegen, verdwijnen — en erger.</p>
    <div className="mission-card"><span>MISSIE 01</span><strong>Reconstrueer het alarm en achterhaal de code van de kist.</strong></div>
    <button className="primary" onClick={startGame} disabled={loading}>{loading?'Starten...':'Start het onderzoek'}</button>
  </section>;

  if (['ALARM','CAMERA','KIST_OPEN'].includes(phase)) return <OpeningPuzzlePage loading={loading} feedback={feedback} submitOpening={submitOpening} startCountdown={startCountdown} requestHint={requestHint} timerStartedAt={team.timerStartedAt} />;

  if (phase === 'DOSSIER') return <DossierPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;

  if (phase === 'ORIGINELE_CONTAINER') return <OriginalContainerPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'ROTJE_KNOR') return <RotjeKnorPhase loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'JOHNNY_ONTMASKERD') return <JohnnyIdentifyPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'NIEUWE_CONTAINER') return <JohnnyContainerPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'KEUZE') return <JohnnyChoice loading={loading} feedback={feedback} chooseRoute={chooseRoute} />;
  if (phase === 'JOHNNY_ROUTE') return <JohnnyRouteIntro loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'KLUIS') return <SafePuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'LOTUS_GEVONDEN') return <LotusFound loading={loading} feedback={feedback} chooseFinal={chooseFinal} />;
  if (phase === 'EINDE' && team.chosenRoute === 'Politie') return <section className="panel cinematic"><div className="section-label">POLITIEROUTE</div><h2>De mede-agenten zijn ingelicht.</h2><p>Deze verhaallijn bouwen we later verder. Voor de huidige test stopt deze route hier.</p></section>;
  if (phase === 'EINDOPERATIE' && team.chosenRoute === 'Johnny') return <JohnnyFinalOperation team={team} loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'RESULTAAT' && team.chosenRoute === 'Johnny') return <JohnnyResult team={team} />;

  return <section className="panel"><div className="section-label">HUIDIGE FASE</div><h2>{phaseLabels[phase] || phase.replaceAll('_',' ')}</h2><p>Deze fase bouwen we in de volgende stap verder uit.</p></section>;
}


function OpeningPuzzlePage({loading,feedback,submitOpening,startCountdown,requestHint,timerStartedAt}) {
  const [briefingDone,setBriefingDone]=useState(Boolean(timerStartedAt));
  const [alarm,setAlarm]=useState('');
  const [camera,setCamera]=useState('');
  const [code,setCode]=useState('');
  const [local,setLocal]=useState('');

  const submit = async (e) => {
    e.preventDefault();
    if(!briefingDone){setLocal('Luister eerst het volledige bericht van de inspecteur af.');return;}
    const ok = await submitOpening({ alarm, camera, code });
    if(!ok) setLocal('Minstens één controle klopt nog niet. Leg de losse bewijsstukken opnieuw naast elkaar en controleer jullie conclusies.');
  };

  return <section className="panel opening-case-panel">
    <div className="opening-briefing">
      <div className="inspector-visual"><img src="/assets/inspector-kist.jpg" alt="Boze inspecteur in een noir recherchekamer"/><div className="inspector-badge">HOOFDINSPECTEUR · MAISON BEAUMONT</div></div>
      <div className="inspector-copy">
        <div className="section-label">SPOEDBRIEFING · OPEN DE KIST</div>
        <h2>“Jullie hebben één taak.”</h2>
        <p>Luister de inspecteur volledig af. Daarna kunnen jullie de eerste conclusies invoeren. De informatie zelf staat niet op dit scherm: gebruik de bewijsstukken die op tafel liggen.</p>
        <div className={`briefing-audio ${briefingDone?'complete':''}`}>
          <div><span>{briefingDone?'BRIEFING VOLTOOID':'VERPLICHT BERICHT'}</span><strong>Inspecteur Beaumont</strong></div>
          <audio controls preload="metadata" src="/assets/inspector-briefing.mp3" onEnded={async()=>{setBriefingDone(true);setLocal('Briefing voltooid. De 90-minutentimer loopt. Onderzoek nu de losse bewijsstukken.');await startCountdown();}} />
        </div>
        {!briefingDone&&<div className="briefing-lock">🔒 Controles worden vrijgegeven nadat het bandje volledig is afgespeeld.</div>}
      </div>
    </div>

    <form className={`opening-puzzles evidence-board ${briefingDone?'unlocked':'locked'}`} onSubmit={submit}>
      <article className="opening-puzzle-card evidence-card">
        <div className="puzzle-kicker">ALARMREGISTRATIE</div>
        <h3>Wanneer werd het vitrinecontact verbroken?</h3>
        <p>Gebruik het losse alarmregister van Maison Beaumont. Zoek zelf welk moment in de tijdlijn relevant is voor de vitrine.</p>
        <div className="physical-evidence-tag"><span>LOS BEWIJSSTUK</span><strong>Alarmregister · Maison Beaumont</strong><small>Uitgereikt door de spelbegeleider</small></div>
        <label>Conclusie<input disabled={!briefingDone} value={alarm} onChange={e=>setAlarm(e.target.value)} placeholder="Tijd / twee cijfers" maxLength={5} required/></label>
      </article>

      <article className="opening-puzzle-card evidence-card">
        <div className="puzzle-kicker">CAMERADOSSIER</div>
        <h3>Welke camera hoort bij het beslissende moment?</h3>
        <p>Gebruik uitsluitend het losse cameradossier op tafel. Vergelijk de tijdstempels en bepaal welke feed bij het incident hoort.</p>
        <div className="physical-evidence-tag"><span>LOS BEWIJSSTUK</span><strong>Cameradossier · beveiligingsfeeds</strong><small>Niet digitaal beschikbaar</small></div>
        <label>Conclusie<input disabled={!briefingDone} value={camera} onChange={e=>setCamera(e.target.value)} placeholder="Cameranummer" maxLength={9} required/></label>
      </article>

      <article className="opening-puzzle-card final-code-card evidence-card">
        <div className="puzzle-kicker">KISTVERGRENDELING</div>
        <h3>Welke code opent de kist?</h3>
        <p>Gebruik jullie conclusies uit de bewijsstukken. De kist accepteert één viercijferige code.</p>
        <div className="lock-readout"><span>MAISON BEAUMONT</span><b>••••</b><small>Vier cijfers vereist</small></div>
        <label>Kistcode<input disabled={!briefingDone} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,4))} inputMode="numeric" placeholder="••••" maxLength={4} required/></label>
      </article>

      <div className="opening-submit">
        <button type="button" className="hint-link" disabled={!briefingDone} onClick={()=>requestHint('Hint: leg het alarmregister en het cameradossier naast elkaar. Zoek naar tijdstippen en aanduidingen die elkaar bevestigen; de site geeft de volgorde niet cadeau.')}>Hint aanvragen</button>
        <button className="primary open-chest-button" disabled={loading||!briefingDone}>{loading?'Controleren...':'Controleer conclusies · open de kist'}</button>
      </div>
    </form>
    {local&&<div className="filter-feedback" aria-live="polite">{local}</div>}
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}


const suspects = [
  { id:'johnny', name:'Johnny Jatwerk', alias:'De Wegbrenger', image:'/assets/suspects/johnny.jpg' },
  { id:'don', name:'Don Diamantini', alias:'De Koning van de Karaat', image:'/assets/suspects/don.jpg' },
  { id:'freddy', name:'Freddy Flessentrekker', alias:'De Bonnenkoning', image:'/assets/suspects/freddy.jpg' },
  { id:'carla', name:'Carla Kraak', alias:'De Slotfluisteraar', image:'/assets/suspects/carla.jpg' },
  { id:'rita', name:'Rita Ratel', alias:'De Fluwelen Hand', image:'/assets/suspects/rita.jpg' },
  { id:'boris', name:'Boris Breekijzer', alias:'De Man met de Koevoet', image:'/assets/suspects/boris.jpg' },
  { id:'vera', name:'Valse Vera', alias:'De Vrouw met Zeven Namen', image:'/assets/suspects/vera.jpg' },
  { id:'max', name:'Max Muntwasser', alias:'De Schone Boekhouder', image:'/assets/suspects/max.jpg' }
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
    <h2>Wie vormden samen het oorspronkelijke heist-team?</h2>
    <p>Leg de acht fysieke dossierkaarten voor jullie neer. Gebruik de bewijsstukken uit de kist. <strong>Niet iedere verdachte hoort bij deze roof.</strong> Bepaal welke vier personen noodzakelijk waren om de operatie uit te voeren.</p>
    <div className="mission-card"><span>OPDRACHT</span><strong>Selecteer precies vier verdachten.</strong></div>
    <div className="suspect-grid">{suspects.map(s=>{
      const active=selected.includes(s.id);
      return <button type="button" key={s.id} className={`suspect-card ${active?'selected':''}`} onClick={()=>toggle(s.id)} aria-pressed={active}>
        <img className="suspect-photo" src={s.image} alt={`Dossierfoto van ${s.name}`} />
        <span className="suspect-info"><strong>{s.name}</strong><small>{s.alias}</small></span>
        <span className="suspect-check">{active?'✓':'○'}</span>
      </button>
    })}</div>
    <div className="selection-footer"><span><strong>{selected.length}/4</strong> geselecteerd</span><button className="primary" type="button" disabled={loading||selected.length!==4} onClick={submit}>{loading?'Controleren...':'Controleer verdachten'}</button></div>
    <button className="hint-link" onClick={()=>requestHint('Hint: denk niet alleen aan wie verdacht is. Welke vier functies waren noodzakelijk voor techniek, documenten, koper en transport?')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

const containerRows = [
  {container:'MBX-1120',dock:'11',arrival:'19:40',origin:'Frankrijk',status:'Vrijgegeven'},
  {container:'MBX-2408',dock:'24',arrival:'20:08',origin:'Italië',status:'Vrijgegeven'},
  {container:'MBX-3314',dock:'33',arrival:'20:14',origin:'België',status:'Vertraagd'},
  {container:'MBX-4717',dock:'17',arrival:'20:15',origin:'Zwitserland',status:'Handmatige controle'},
  {container:'MBX-8617',dock:'17',arrival:'19:55',origin:'België',status:'Vrijgegeven'},
  {container:'MBX-7317',dock:'17',arrival:'20:15',origin:'Frankrijk',status:'Wacht op controle'},
  {container:'MBX-9017',dock:'17',arrival:'20:18',origin:'Duitsland',status:'Gesloten'},
  {container:'MBX-2517',dock:'17',arrival:'20:15',origin:'Italië',status:'Vrijgegeven'},
  {container:'MBX-7303',dock:'07',arrival:'20:15',origin:'Zwitserland',status:'Technische controle'},
  {container:'MBX-1906',dock:'19',arrival:'20:06',origin:'Oostenrijk',status:'Vrijgegeven'},
  {container:'MBX-4417',dock:'44',arrival:'20:17',origin:'Spanje',status:'Vertraagd'}
];

function OriginalContainerPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [step,setStep]=useState(1);
  const [dock,setDock]=useState('');
  const [arrival,setArrival]=useState('');
  const [origin,setOrigin]=useState('');
  const [localFeedback,setLocalFeedback]=useState('');

  const normal=(v)=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const checkDock=(e)=>{e.preventDefault(); if(normal(dock)==='17'){setStep(2);setLocalFeedback('Dock 17 bevestigd. Er blijven vijf containers over.');}else setLocalFeedback('Dat dock past niet bij de gereconstrueerde route. Controleer de routegegevens uit het dossier.');};
  const checkArrival=(e)=>{e.preventDefault(); const v=normal(arrival).replace(':',''); if(v==='2015'){setStep(3);setLocalFeedback('Aankomsttijd 20:15 bevestigd. Er blijven drie containers over.');}else setLocalFeedback('Die aankomsttijd klopt niet. Zoek het moment dat één minuut na het vitrinecontact ligt.');};
  const checkOrigin=(e)=>{e.preventDefault(); const v=normal(origin); if(['zwitserland','switzerland','ch'].includes(v)){setStep(4);setLocalFeedback('Herkomst bevestigd. Er blijft één container over.');}else setLocalFeedback('Dat land past niet bij de aantekeningen van Don Diamantini. Bekijk zijn codes en aanwijzingen opnieuw.');};
  const visibleRows=containerRows.filter(r=>step===1?true:step===2?r.dock==='17':step===3?r.dock==='17'&&r.arrival==='20:15':r.dock==='17'&&r.arrival==='20:15'&&r.origin==='Zwitserland');

  return <section className="panel container-puzzle">
    <div className="section-label">FASE 3 · OORSPRONKELIJK TRANSPORTPLAN</div>
    <h2>Welke container was bestemd voor De Zwarte Lotus?</h2>
    <p>De vier criminelen brachten ieder een deel van het plan mee. Gebruik de fysieke routegegevens en de stukken uit de kist om de vrachtlijst stap voor stap te filteren. <strong>Raad niet.</strong> Iedere stap moet door het dossier worden bewezen.</p>
    <div className="filter-progress"><span className={step>=1?'active':''}>1 · Dock</span><span className={step>=2?'active':''}>2 · Aankomst</span><span className={step>=3?'active':''}>3 · Herkomst</span><span className={step>=4?'active':''}>4 · Container</span></div>

    <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Dock</th><th>Aankomst</th><th>Herkomst</th><th>Status</th></tr></thead><tbody>{visibleRows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.dock}</td><td>{r.arrival}</td><td>{r.origin}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    <div className="manifest-count">{visibleRows.length} {visibleRows.length===1?'container over':'containers zichtbaar'}</div>

    {step===1&&<form className="filter-form" onSubmit={checkDock}><div><span>FILTER 1</span><strong>Welk dock hoort bij de oorspronkelijke route?</strong><small>Gebruik de routegegevens van het heist-team.</small></div><div className="filter-input"><input value={dock} onChange={e=>setDock(e.target.value)} placeholder="Docknummer" inputMode="numeric" required/><button className="primary">Filter lijst</button></div></form>}
    {step===2&&<form className="filter-form" onSubmit={checkArrival}><div><span>FILTER 2</span><strong>Welke aankomsttijd hoort bij de zending?</strong><small>Gebruik de tijdlijn van vitrinecontact en camera-uitval.</small></div><div className="filter-input"><input value={arrival} onChange={e=>setArrival(e.target.value)} placeholder="Bijv. 20:15" required/><button className="primary">Filter lijst</button></div></form>}
    {step===3&&<form className="filter-form" onSubmit={checkOrigin}><div><span>FILTER 3</span><strong>Uit welk land kwam de juiste zending?</strong><small>Gebruik de privé-aantekeningen van Don Diamantini.</small></div><div className="filter-input"><input value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="Land van herkomst" required/><button className="primary">Filter lijst</button></div></form>}
    {step===4&&<div className="final-container"><span>LAATSTE CONTROLE</span><h3>Er is nog één container over.</h3><p>Voer het volledige containernummer in om het oorspronkelijke transportplan te bevestigen.</p><AnswerForm loading={loading} placeholder="MBX-••••" maxLength={12} button="Bevestig container" onSubmit={(v)=>submitAnswer('ORIGINELE_CONTAINER',v)} /></div>}

    {localFeedback&&<div className="filter-feedback" aria-live="polite">{localFeedback}</div>}
    <button className="hint-link" onClick={()=>requestHint(step===1?'Hint: begin niet bij het containernummer. Zoek eerst in de routegegevens welk dock bij het viertal hoort.':step===2?'Hint: na het juiste dock blijven vijf regels over. De aankomsttijd ligt één minuut na het vitrinecontact.':step===3?'Hint: Don noteerde CH en GVA en schreef over horloges, banken en gesloten kluizen.': 'Hint: na drie correcte filters hoort er nog maar één regel in de vrachtlijst te staan.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}


function RotjeKnorPhase({loading,feedback,submitAnswer}) {
  const callHref = ROTJE_PHONE ? `tel:${ROTJE_PHONE.replace(/\s+/g,'')}` : null;
  return <section className="panel cinematic informant-panel">
    <div className="section-label">FASE 4 · DOUANELIJN</div>
    <h2>Het oude transportplan klopt. Maar iemand heeft het gewijzigd.</h2>
    <p>Jullie hebben <strong>Dock 17</strong> en <strong>MBX-4717</strong> gereconstrueerd. Een infiltrant bij de douane heeft aanvullende informatie. Bel de lijn en luister het bericht volledig af.</p>
    <div className="phone-card">
      <span>CONTACTPERSOON</span>
      <strong>Rotje Knor</strong>
      <small>Douane-infiltrant · vertrouwelijk kanaal</small>
      {ROTJE_PHONE ? <a className="primary call-button" href={callHref}>Bel {ROTJE_PHONE}</a> : <div className="phone-placeholder">Telefoonnummer nog niet ingesteld</div>}
    </div>
    {!ROTJE_PHONE && <details className="test-audio"><summary>Testmodus · reservebandje afspelen</summary><audio className="audio-player" controls preload="metadata" src="/assets/story/rotje-knor.mp3" /></details>}
    <div className="mission-card"><span>OPDRACHT</span><strong>Luister naar de initialen, het tijdstip en de containerstatus.</strong></div>
    <button className="primary" disabled={loading} onClick={()=>submitAnswer('ROTJE_KNOR','beluisterd')}>{loading?'Openen...':'Bandje beluisterd · bewijsmateriaal ontvangen'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyIdentifyPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [selected,setSelected]=useState('');
  return <section className="panel dossier-ready">
    <div className="section-label">FASE 5 · LAATSTE WIJZIGING</div>
    <h2>Wie heeft het transportplan aangepast?</h2>
    <p>Gebruik het <strong>fysieke transportlog</strong> dat jullie nu van de spelbegeleider hebben ontvangen. Vergelijk dit document met het bericht van Rotje Knor. De wijziging is uitgevoerd nadat de andere drie rollen al klaar waren.</p>
    <div className="mission-card"><span>BEWIJSMATERIAAL</span><strong>Transportlog – Laatste wijziging</strong><small>Wordt fysiek uitgereikt door de spelbegeleider.</small></div>
    <div className="single-suspect-grid">{suspects.map(s=><button key={s.id} type="button" className={`mini-suspect ${selected===s.id?'selected':''}`} onClick={()=>setSelected(s.id)} aria-pressed={selected===s.id}><img src={s.image} alt=""/><span><strong>{s.name}</strong><small>{s.alias}</small></span></button>)}</div>
    <div className="selection-footer"><span>{selected?'1 verdachte geselecteerd':'Selecteer de verdachte die bij J.J. past'}</span><button className="primary" disabled={loading||!selected} onClick={()=>submitAnswer('JOHNNY_ONTMASKERD',selected)}>{loading?'Controleren...':'Ontmasker J.J.'}</button></div>
    <button className="hint-link" onClick={()=>requestHint('Hint: combineer de initialen J.J., het signalement, de transportmap en de rol van de chauffeur.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

const johnnyRows = [
  {container:'JJX-1841',series:'JJX',time:'18:41',route:'Reguliere rit',status:'Gesloten'},
  {container:'JJX-2034',series:'JJX',time:'20:34',route:'Stille route',status:'Actief'},
  {container:'JJX-2134',series:'JJX',time:'21:34',route:'Wachtroute',status:'Vertraagd'},
  {container:'JJX-2047',series:'JJX',time:'20:34',route:'Koerierswissel',status:'Controle'},
  {container:'JJX-7334',series:'JJX',time:'20:34',route:'Opslagroute',status:'Wacht'},
  {container:'JJX-1907',series:'JJX',time:'19:07',route:'Retour',status:'Gesloten'},
  {container:'RDX-2034',series:'RDX',time:'20:34',route:'Stille route',status:'Foutieve reeks'},
  {container:'MBX-2034',series:'MBX',time:'20:34',route:'Oude route',status:'Geannuleerd'}
];

function JohnnyContainerPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [step,setStep]=useState(1); const [series,setSeries]=useState(''); const [time,setTime]=useState(''); const [route,setRoute]=useState(''); const [culprit,setCulprit]=useState(''); const [container,setContainer]=useState(''); const [localFeedback,setLocalFeedback]=useState('');
  const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const checkSeries=e=>{e.preventDefault(); if(norm(series)==='jjx'){setStep(2);setLocalFeedback('JJX-reeks bevestigd. Zes containers blijven over.');}else setLocalFeedback('Die reeks is niet gekoppeld aan de laatste wijziging. Bekijk het transportlog opnieuw.');};
  const checkTime=e=>{e.preventDefault(); if(norm(time).replace(':','')==='2034'){setStep(3);setLocalFeedback('20:34 bevestigd. Drie containers blijven over.');}else setLocalFeedback('Dat tijdstip klopt niet met Rotje Knor en het transportlog.');};
  const checkRoute=e=>{e.preventDefault(); if(norm(route)==='stille route'){setStep(4);setLocalFeedback('Routekenmerk bevestigd. Er blijft één container over.');}else setLocalFeedback('Dat routekenmerk hoort niet bij Johnny’s nieuwe rit.');};
  const rows=johnnyRows.filter(r=>step===1?true:step===2?r.series==='JJX':step===3?r.series==='JJX'&&r.time==='20:34':r.series==='JJX'&&r.time==='20:34'&&r.route==='Stille route');
  const finalSubmit=e=>{e.preventDefault(); submitAnswer('NIEUWE_CONTAINER', {culprit,container});};
  return <section className="panel container-puzzle">
    <div className="section-label">FASE 6 · JOHNNY'S NIEUWE ROUTE</div>
    <h2>Waar heeft J.J. De Zwarte Lotus naartoe verplaatst?</h2>
    <p>MBX-4717 is een <strong>lege huls</strong>. Filter nu het gewijzigde transportregister. Gebruik het fysieke transportlog van de spelbegeleider en de informatie uit Rotje Knors bericht.</p>
    <div className="filter-progress"><span className={step>=1?'active':''}>1 · Reeks</span><span className={step>=2?'active':''}>2 · Tijd</span><span className={step>=3?'active':''}>3 · Route</span><span className={step>=4?'active':''}>4 · Bevestiging</span></div>
    <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Reeks</th><th>Wijziging</th><th>Routekenmerk</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.series}</td><td>{r.time}</td><td>{r.route}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    <div className="manifest-count">{rows.length} {rows.length===1?'container over':'containers zichtbaar'}</div>
    {step===1&&<form className="filter-form" onSubmit={checkSeries}><div><span>FILTER 1</span><strong>Welke containergroep is na de wijziging gebruikt?</strong><small>Zoek de nieuwe reeks in het transportlog.</small></div><div className="filter-input"><input value={series} onChange={e=>setSeries(e.target.value)} placeholder="Bijv. ABC" required/><button className="primary">Filter lijst</button></div></form>}
    {step===2&&<form className="filter-form" onSubmit={checkTime}><div><span>FILTER 2</span><strong>Op welk tijdstip nam J.J. het plan over?</strong><small>Rotje Knor noemt het tijdstip expliciet.</small></div><div className="filter-input"><input value={time} onChange={e=>setTime(e.target.value)} placeholder="Bijv. 20:34" required/><button className="primary">Filter lijst</button></div></form>}
    {step===3&&<form className="filter-form" onSubmit={checkRoute}><div><span>FILTER 3</span><strong>Welk routekenmerk hoort bij Johnny?</strong><small>Het is de route die buiten de gewone controle blijft.</small></div><div className="filter-input"><input value={route} onChange={e=>setRoute(e.target.value)} placeholder="Routekenmerk" required/><button className="primary">Filter lijst</button></div></form>}
    {step===4&&<form className="final-confirm" onSubmit={finalSubmit}><span>LAATSTE CONTROLE</span><h3>Bevestig dader én nieuwe container.</h3><div className="two-inputs"><label>Dader<input value={culprit} onChange={e=>setCulprit(e.target.value)} placeholder="Initialen of naam" required/></label><label>Container<input value={container} onChange={e=>setContainer(e.target.value)} placeholder="JJX-••••" required/></label></div><button className="primary" disabled={loading}>{loading?'Controleren...':'Bevestig nieuwe route'}</button></form>}
    {localFeedback&&<div className="filter-feedback" aria-live="polite">{localFeedback}</div>}
    <button className="hint-link" onClick={()=>requestHint(step===1?'Hint: de nieuwe reeks staat letterlijk in het transportlog.':step===2?'Hint: de wijziging vond plaats om 20:34.':step===3?'Hint: Johnny noemt dit de stille route.':'Hint: de dader is J.J. en er hoort nog maar één regel in de lijst te staan.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyChoice({loading,feedback,chooseRoute}) {
  const [seconds,setSeconds]=useState(30); const [locked,setLocked]=useState(false);
  useEffect(()=>{if(locked||seconds<=0)return; const id=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000); return()=>clearInterval(id);},[locked,seconds]);
  useEffect(()=>{if(seconds===0)setLocked(true);},[seconds]);
  const choose=async route=>{setLocked(true); await chooseRoute(route);};
  return <section className="panel cinematic johnny-choice">
    <div className="section-label">VERSLEUTELD BERICHT · J.J.</div>
    <h2>“Ik heb jullie door.”</h2>
    <div className="johnny-message"><p>Jullie dachten mij te pakken. Leuk geprobeerd.</p><p>Of ik verplaats alles opnieuw — en dan zijn jullie mij én De Zwarte Lotus kwijt — of jullie laten de overdracht doorgaan.</p><p>De Zwarte Lotus is verkocht voor <strong>€ 37.000.000</strong>. Jullie krijgen <strong>30%</strong>: € 11.100.000.</p><p>Jullie volgende locatie: <strong>{JOHNNY_COORDS}</strong>.</p><p>Jullie hebben dertig seconden. Werken jullie met mij samen, of lichten jullie de mede-agenten in?</p></div>
    <div className={`choice-timer ${seconds<=10?'urgent':''}`}><span>TIJD OVER</span><strong>{String(seconds).padStart(2,'0')}</strong></div>
    <div className="choice-grid"><button className="choice-card criminal" disabled={loading||locked} onClick={()=>choose('Johnny')}><span>OPTIE 1</span><strong>Werk samen met Jatwerk</strong><small>Laat de overdracht doorgaan en volg Johnny naar de kluis.</small></button><button className="choice-card police" disabled={loading||locked} onClick={()=>choose('Politie')}><span>OPTIE 2</span><strong>Licht de politie in</strong><small>Waarschuw de mede-agenten en bereid een inval voor.</small></button></div>
    {seconds===0&&<div className="feedback">Tijd verstreken. Gebruik het begeleidersdashboard om deze testfase opnieuw te starten.</div>}
    {feedback&&<div className="feedback">{feedback}</div>}
  </section>;
}

function JohnnyRouteIntro({loading,feedback,submitAnswer}) {
  return <section className="panel cinematic johnny-route-panel">
    <div className="success-seal">SAMENWERKING ACTIEF</div>
    <div className="section-label">JOHNNY-ROUTE · LOCATIE</div>
    <h2>Ga naar de kluis.</h2>
    <div className="johnny-message">
      <p>“Jullie hebben gekozen. Dan krijgen jullie ook wat ik beloofd heb.”</p>
      <p>De Zwarte Lotus ligt niet meer in een container. Hij ligt in een <strong>fysieke kluis</strong>.</p>
      <p>Ga naar de locatie hieronder. Zoek daar naar de markering van de chauffeur.</p>
    </div>
    <div className="coordinate-card"><span>LOCATIE</span><strong>{JOHNNY_COORDS}</strong><small>Markering: zwarte routepijl · Poort 9</small></div>
    <div className="mission-card"><span>OPDRACHT</span><strong>Vind de fysieke kluis. Open hem nog niet voordat jullie de zescijferige code hebben opgelost.</strong></div>
    <button className="primary" disabled={loading} onClick={()=>submitAnswer('JOHNNY_ROUTE','locatie bereikt')}>{loading?'Bevestigen...':'Wij staan bij de kluis'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function SafePuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [step,setStep]=useState(1);
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [c,setC]=useState('');
  const [safeCode,setSafeCode]=useState('');
  const [local,setLocal]=useState('');
  const [safeState,setSafeState]=useState('closed');
  const [unlocking,setUnlocking]=useState(false);
  const digits=[step>1?'20':'••',step>2?'34':'••',step>3?'09':'••'];

  const check=(which,e)=>{
    e.preventDefault();
    const v=(which===1?a:which===2?b:c).trim().replace(/\D/g,'').padStart(2,'0');
    const correct=which===1?'20':which===2?'34':'09';
    if(v!==correct){setLocal('Dat deel van de code klopt nog niet. Gebruik alleen informatie die jullie al in het dossier hebben bewezen.');return;}
    setLocal(which===3?'Alle drie de codeparen zijn gevonden. Combineer ze nu van links naar rechts en open de kluis.':`Codepaar ${which} bevestigd.`);
    setStep(which+1);
  };

  const unlockSafe = async (e) => {
    e.preventDefault();
    const normalized = safeCode.replace(/\D/g,'').slice(0,6);
    if(normalized !== '203409') {
      setSafeState('error');
      setLocal('Code geweigerd. De kluis blijft vergrendeld. Controleer het moment en de poort nogmaals.');
      return;
    }
    setSafeState('opening');
    setLocal('Code geaccepteerd. Kluis wordt ontgrendeld...');
    setUnlocking(true);
    setTimeout(() => {
      setSafeState('open');
      setUnlocking(false);
      setLocal('Klik. De kluis springt open. Binnenin ligt De Zwarte Lotus.');
    }, 1100);
  };

  const continueAfterOpen = async () => {
    await submitAnswer('KLUIS','203409');
  };

  return <section className="panel safe-panel cinematic">
    <div className="section-label">FASE 8 · DE KLUIS</div>
    <h2>Drie raadsels. Zes cijfers.</h2>
    <p>De kluis gebruikt drie codeparen. Los ieder raadsel afzonderlijk op. Zet de drie antwoorden daarna direct achter elkaar — en gebruik ze om de kluis op het scherm te openen.</p>
    <div className="safe-display"><span>{digits[0]}</span><i>·</i><span>{digits[1]}</span><i>·</i><span>{digits[2]}</span></div>

    <div className="riddle-stack">
      <article className={`riddle-card ${step>1?'solved':''}`}>
        <span>RAADSEL 1 · TWEE CIJFERS</span>
        <h3>Wat delen de twee beslissende tijdstippen?</h3>
        <p>Het hoofdalarm en Johnny’s routewijziging liggen zeventien minuten uit elkaar. Toch beginnen beide tijdstippen met exact dezelfde twee cijfers. Welke?</p>
        {step===1&&<form onSubmit={e=>check(1,e)} className="riddle-form"><input value={a} onChange={e=>setA(e.target.value)} inputMode="numeric" maxLength={2} placeholder="••" required/><button className="primary">Controleer</button></form>}
        {step>1&&<strong className="riddle-answer">20</strong>}
      </article>

      <article className={`riddle-card ${step>2?'solved':''} ${step<2?'locked':''}`}>
        <span>RAADSEL 2 · TWEE CIJFERS</span>
        <h3>Wanneer stierf het oude plan?</h3>
        <p>Het hoofdalarm klonk om 20:17. Het nummer van het oorspronkelijke dock was 17. Tel dat aantal minuten bij het alarm op. Neem alleen de minuten van de nieuwe tijd.</p>
        {step===2&&<form onSubmit={e=>check(2,e)} className="riddle-form"><input value={b} onChange={e=>setB(e.target.value)} inputMode="numeric" maxLength={2} placeholder="••" required/><button className="primary">Controleer</button></form>}
        {step>2&&<strong className="riddle-answer">34</strong>}
      </article>

      <article className={`riddle-card ${step>3?'solved':''} ${step<3?'locked':''}`}>
        <span>RAADSEL 3 · TWEE CIJFERS</span>
        <h3>Waar eindigt de stille route?</h3>
        <p>Niet bij de pier. Niet bij de terminal. Zoek het nummer van de poort bij de kluis en schrijf het als twee cijfers.</p>
        {step===3&&<form onSubmit={e=>check(3,e)} className="riddle-form"><input value={c} onChange={e=>setC(e.target.value)} inputMode="numeric" maxLength={2} placeholder="••" required/><button className="primary">Controleer</button></form>}
        {step>3&&<strong className="riddle-answer">09</strong>}
      </article>
    </div>

    {step===4&&<div className="safe-stage">
      <div className={`vault ${safeState}`}>
        <div className="vault-frame">
          <div className="vault-door">
            <div className="vault-wheel"><span></span><span></span><span></span><span></span></div>
            <div className="vault-keypad">203409</div>
            <div className="vault-bars"><i></i><i></i><i></i></div>
          </div>
          <div className="vault-interior">
            <div className="lotus-gem"></div>
            <div className="vault-note-stack">
              <div className="vault-note"><strong>DE ZWARTE LOTUS</strong><small>Zwarte diamant veiliggesteld</small></div>
              <div className="vault-note"><strong>V.V.-37</strong><small>Koperkanaal · KARAAT</small></div>
            </div>
          </div>
        </div>
      </div>

      {safeState !== 'open' && <div className="safe-final screen-safe-final"><span>KLUISCODE GERECONSTRUEERD</span><h3>Voer de zes cijfers in en open de kluis.</h3><form className="screen-safe-form" onSubmit={unlockSafe}><input value={safeCode} onChange={e=>setSafeCode(e.target.value)} placeholder="203409" inputMode="numeric" maxLength={6} required/><button className="primary" disabled={unlocking}>{unlocking?'Ontgrendelen...':'Open de kluis'}</button></form><small>Bij de juiste code draait de kluis open en wordt de inhoud zichtbaar.</small></div>}

      {safeState === 'open' && <div className="safe-open-actions"><div className="safe-final success"><span>KLUIS GEOPEND</span><h3>De Zwarte Lotus ligt in de kluis.</h3><p>Jullie hebben het object én de begeleidende informatie gevonden. Ga verder naar de inhoud van de kluis.</p><button className="primary" disabled={loading} onClick={continueAfterOpen}>{loading?'Laden...':'Bekijk inhoud van de kluis'}</button></div></div>}
    </div>}

    {local&&<div className="filter-feedback" aria-live="polite">{local}</div>}
    <button className="hint-link" onClick={()=>requestHint(step===1?'Hint: vergelijk 20:17 met 20:34.':step===2?'Hint: 20:17 plus 17 minuten is 20:34.':step===3?'Hint: de markering bij de kluis noemt Poort 9. Schrijf 9 als twee cijfers.':'Hint: zet 20, 34 en 09 direct achter elkaar.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function LotusFound({loading,feedback,chooseFinal}) {
  const [choice,setChoice]=useState('');
  return <section className="panel cinematic lotus-found">
    <div className="success-seal">KLUIS OPEN</div>
    <div className="section-label">DE ZWARTE LOTUS IS GEVONDEN</div>
    <h2>Jullie hebben de steen.</h2>
    <p>In de kluis ligt de fysieke Zwarte Lotus. Daarnaast vinden jullie het koperdossier en Johnny’s routebon. Vanaf dit moment hebben jullie meer informatie dan Johnny denkt.</p>

    <div className="vault-contents">
      <article><span>OBJECT</span><strong>De Zwarte Lotus</strong><small>Zwarte diamant · fysiek in jullie bezit</small></article>
      <article><span>KOPER</span><strong>Victor Valmont</strong><small>Alias: De Verzamelaar · kanaal V.V.-37</small></article>
      <article><span>CODEWOORD</span><strong>KARAAT</strong><small>Verificatie: “Is de kluis nog gesloten?” → “Niet meer.”</small></article>
      <article><span>AFSPRAAK</span><strong>Perron 3 · Oude goederenloods</strong><small>23:10 · herkenningsteken: zwarte handschoen · tweede codewoord: Nachtglas</small></article>
      <article><span>JOHNNY</span><strong>Chauffeurskeet · Laadzone West</strong><small>Gele deur · zwarte routepijl · dienstpad achter Poort 9</small></article>
    </div>

    <div className="mission-card"><span>LAATSTE KEUZE</span><strong>Johnny denkt dat jullie nog steeds voor hem werken. De koper weet niet dat jullie de steen hebben. Wat doen jullie?</strong></div>
    <div className="choice-grid final-choice-grid">
      <button className={`choice-card police ${choice==='VAL'?'selected':''}`} onClick={()=>setChoice('VAL')}><span>OPTIE 1</span><strong>Lok ze samen in de val</strong><small>Bevestig de afspraak met de koper en geef de overdrachtsplek door aan de politie. Laat Johnny en de koper daar samen binnenlopen.</small></button>
      <button className={`choice-card criminal ${choice==='DUBBELSPEL'?'selected':''}`} onClick={()=>setChoice('DUBBELSPEL')}><span>OPTIE 2</span><strong>Speel de deal uit</strong><small>Maak de afspraak met de koper, laat Johnny naar een andere plek gaan en bereid twee gelijktijdige arrestaties voor.</small></button>
    </div>
    <button className="primary" disabled={loading||!choice} onClick={()=>chooseFinal(choice)}>{loading?'Keuze vastleggen...':'Bevestig eindplan'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyFinalOperation({team,loading,feedback,submitAnswer,requestHint}) {
  const double=team.finalChoice==='DUBBELSPEL';
  const [step,setStep]=useState(1);
  const [verification,setVerification]=useState('');
  const [codeword,setCodeword]=useState('');
  const [time,setTime]=useState('');
  const [local,setLocal]=useState('');

  const normalize=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const checkVerification=e=>{
    e.preventDefault();
    if(!['niet meer','nietmeer'].includes(normalize(verification))){setLocal('Victor verbreekt bijna het contact. Het antwoord op zijn verificatievraag klopt niet.');return;}
    setStep(2); setLocal('Identiteit geaccepteerd. Victor blijft aan de lijn.');
  };
  const checkCodeword=e=>{
    e.preventDefault();
    if(normalize(codeword)!=='nachtglas'){setLocal('Codewoord geweigerd. Controleer het koperdossier uit de kluis.');return;}
    setStep(3); setLocal('Tweede codewoord bevestigd. De afspraak kan nu worden vastgezet.');
  };
  const checkTime=e=>{
    e.preventDefault();
    const v=normalize(time).replace('.',':');
    if(!['23:10','2310'].includes(v)){setLocal('Victor accepteert dit tijdstip niet. Gebruik het afgesproken overdrachtsmoment uit het dossier.');return;}
    setStep(4); setLocal('Afspraak bevestigd voor 23:10. De operatie staat klaar.');
  };
  const launch=()=>submitAnswer('EINDOPERATIE',{answer1:'Niet meer',answer2:'Nachtglas',answer3:'23:10'});

  return <section className="panel cinematic final-operation">
    <div className="section-label">EINDOPERATIE · {double?'DUBBEL SPEL':'VALSTRIK'}</div>
    <h2>{double?'Twee doelwitten. Twee locaties. Eén moment.':'Zet de overdracht in scène.'}</h2>
    <p>{double?'Johnny denkt dat jullie de koper voor hem warmhouden. Victor denkt dat de overdracht doorgaat. Jullie moeten beide mannen tegelijk in beweging krijgen zonder dat ze elkaar waarschuwen.':'Johnny denkt dat jullie nog aan zijn kant staan. Victor verwacht de diamant. Laat de afspraak echt lijken en geef de politie pas groen licht wanneer beide mannen op de juiste plek zijn.'}</p>

    <div className="operation-grid">
      <article><span>KOPER</span><strong>Victor Valmont</strong><small>Perron 3 · Oude goederenloods · zwarte handschoen op tafel</small></article>
      <article><span>JOHNNY</span><strong>{double?'Laadzone West':'Naar Perron 3'}</strong><small>{double?'Lok hem terug naar de chauffeurskeet.':'Laat hem geloven dat hij de overdracht zelf moet controleren.'}</small></article>
    </div>

    <div className="secure-chat">
      <div className="chat-head"><span>VERSLEUTELD KANAAL</span><strong>V.V.-37</strong><small>verbinding actief</small></div>
      <div className="chat-log">
        <div className="chat-row incoming"><span>Victor Valmont</span><p>Is de kluis nog gesloten?</p></div>
        {step>1&&<div className="chat-row outgoing"><span>Jullie</span><p>Niet meer.</p></div>}
        {step>1&&<div className="chat-row incoming"><span>Victor Valmont</span><p>Dan wil ik het tweede woord horen.</p></div>}
        {step>2&&<div className="chat-row outgoing"><span>Jullie</span><p>Nachtglas.</p></div>}
        {step>2&&<div className="chat-row incoming"><span>Victor Valmont</span><p>Goed. Wanneer?</p></div>}
        {step>3&&<div className="chat-row outgoing"><span>Jullie</span><p>23:10.</p></div>}
        {step>3&&<div className="chat-row incoming"><span>Victor Valmont</span><p>Perron 3. Ik kom alleen.</p></div>}
      </div>
    </div>

    <div className="operation-progress"><span className={step>=1?'active':''}>1 · Verificatie</span><span className={step>=2?'active':''}>2 · Codewoord</span><span className={step>=3?'active':''}>3 · Tijd</span><span className={step>=4?'active':''}>4 · Inval</span></div>

    {step===1&&<form className="operation-step" onSubmit={checkVerification}><span>STAP 1</span><h3>Beantwoord Victor zonder zijn argwaan te wekken.</h3><label>“Is de kluis nog gesloten?”<input value={verification} onChange={e=>setVerification(e.target.value)} placeholder="Jullie antwoord" required/></label><button className="primary">Verstuur antwoord</button></form>}
    {step===2&&<form className="operation-step" onSubmit={checkCodeword}><span>STAP 2</span><h3>Victor vraagt om de tweede beveiliging.</h3><label>Tweede codewoord<input value={codeword} onChange={e=>setCodeword(e.target.value)} placeholder="Codewoord" required/></label><button className="primary">Verstuur codewoord</button></form>}
    {step===3&&<form className="operation-step" onSubmit={checkTime}><span>STAP 3</span><h3>Zet het overdrachtsmoment vast.</h3><label>Tijdstip<input value={time} onChange={e=>setTime(e.target.value)} placeholder="UU:MM" required/></label><button className="primary">Bevestig afspraak</button></form>}
    {step===4&&<div className="raid-ready"><span>OPERATIE GEREED</span><h3>{double?'Beide arrestatieteams staan klaar.':'Johnny en Victor bewegen richting Perron 3.'}</h3><p>{double?'Victor wordt om 23:10 op Perron 3 opgepakt. Johnny wordt op exact hetzelfde moment bij Laadzone West aangehouden.':'De politie sluit beide uitgangen zodra de verificatie is afgerond en beide doelwitten binnen zijn.'}</p><button className="primary" disabled={loading} onClick={launch}>{loading?'Operatie loopt...':double?'Geef groen licht voor beide invallen':'Geef groen licht voor de valstrik'}</button></div>}

    {local&&<div className="filter-feedback" aria-live="polite">{local}</div>}
    <button className="hint-link" onClick={()=>requestHint(step===1?'Hint: Victor verwacht het antwoord “Niet meer”.':step===2?'Hint: het tweede codewoord uit het dossier is Nachtglas.':step===3?'Hint: de afspraak is om 23:10.':'Hint: alles staat goed. Geef nu groen licht.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyResult({team}) {
  const double=team.finalChoice==='DUBBELSPEL';
  return <section className="panel cinematic case-result">
    <div className="success-seal">OPERATIE GESLAAGD</div>
    <div className="section-label">MAISON BEAUMONT · ZAAK AFGESLOTEN</div>
    <h2>De Zwarte Lotus is veiliggesteld.</h2>
    <p>{double?'Om 23:10 vielen twee arrestatieteams tegelijk binnen. Victor Valmont werd op Perron 3 aangehouden terwijl Johnny Jatwerk bij Laadzone West werd onderschept. Geen van beiden kreeg de kans de ander te waarschuwen.':'Om 23:10 arriveerden Victor Valmont en Johnny Jatwerk bij de goederenloods. Na de verificatie sloot de politie beide uitgangen. De diamant bleef buiten hun bereik.'}</p>
    <div className="result-grid">
      <article><span>DE ZWARTE LOTUS</span><strong>Veiliggesteld</strong><small>De diamant blijft in bewaring van Maison Beaumont.</small></article>
      <article><span>JOHNNY JATWERK</span><strong>Aangehouden</strong><small>Ontmaskerd als verrader en uitvoerder van de routewijziging.</small></article>
      <article><span>VICTOR VALMONT</span><strong>Aangehouden</strong><small>De koper werd tijdens de overdracht geïdentificeerd en onderschept.</small></article>
      <article><span>JULLIE ROUTE</span><strong>{double?'Dubbel spel':'Valstrik'}</strong><small>{team.hintCount} hint{team.hintCount===1?'':'s'} gebruikt tijdens het onderzoek.</small></article>
    </div>
    <div className="case-stamp">ZAAK GESLOTEN</div>
    <div className="mission-card"><span>EINDE JOHNNY-ROUTE</span><strong>Meld jullie bij de spelbegeleider. De Johnny-route is volledig afgerond.</strong></div>
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
