import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const phases = ['START','ALARM','DOSSIER','ORIGINELE_CONTAINER','ORIGINELE_CONTAINER_BEVESTIGEN','ROTJE_KNOR','JOHNNY_ONTMASKERD','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','JOHNNY_MELDEN','JOHNNY_ARRESTATIE','EINDOPERATIE','KOPER_KEUZE','RESULTAAT'];


const investigatorCharacters = [
  { id:'kees-zoek', name:'Kees Zoek', specialty:'Opsporing & details', blurb:'Ziet wat anderen missen en blijft zoeken tot het laatste detail klopt.', image:'/assets/characters/kees-zoek.jpg' },
  { id:'rob-berie', name:'Rob Berie', specialty:'Roof & criminelen', blurb:'Denkt als een overvaller en herkent patronen in de werkwijze van daders.', image:'/assets/characters/rob-berie.jpg' },
  { id:'al-larm', name:'Al Larm', specialty:'Beveiliging & tijdlijnen', blurb:'Leeft voor alarmen, logboeken en systemen die nét op het verkeerde moment uitvallen.', image:'/assets/characters/al-larm.jpg' },
  { id:'cold-case', name:'Cold Case', specialty:'Analyse & verbanden', blurb:'Blijft ijzig kalm en legt verbanden tussen oude en nieuwe sporen.', image:'/assets/characters/cold-case.jpg' },
  { id:'ben-de-bajes', name:'Ben de Bajes', specialty:'Verdachten & antecedenten', blurb:'Kent het boeventuig, hun contacten en de verhalen die ze liever verzwijgen.', image:'/assets/characters/ben-de-bajes.jpg' },
  { id:'ferry-fout', name:'Ferry Fout', specialty:'Afwijkingen & fouten', blurb:'Vindt slordigheden, tegenstrijdigheden en precies dat ene detail dat niet klopt.', image:'/assets/characters/ferry-fout.jpg' }
];

const phaseLabels = {
  START: 'Introductie', ALARM: 'Toegangscode', CAMERA: 'Toegangscode', KIST_OPEN: 'Toegangscode', DOSSIER: 'Verdachtenonderzoek',
  ORIGINELE_CONTAINER: 'Transportonderzoek', ORIGINELE_CONTAINER_BEVESTIGEN: 'Container bevestigen', ROTJE_KNOR: 'Nieuw spoor', JOHNNY_ONTMASKERD: 'Johnny ontmaskerd', NIEUWE_CONTAINER: 'Nieuwe container', KEUZE: 'Keuze', JOHNNY_ROUTE: 'Naar de kluis', KLUIS: 'Kluiscode', LOTUS_GEVONDEN: 'Bewijs uit de kluis', JOHNNY_MELDEN: 'Inspecteur · Code B', JOHNNY_ARRESTATIE: 'Aanhouding Johnny', EINDOPERATIE: 'Koperskanaal', KOPER_KEUZE:'Laatste keuze', RESULTAAT: 'Zaak afgerond'
};


function Root() {
  const hash = window.location.hash || '';
  return hash.startsWith('#/infiltrant') ? <InfiltrantPage /> : hash.startsWith('#/rotje') ? <RotjeSecretPage /> : hash.startsWith('#/transport-systeem') ? <TransportSystemPage /> : <App />;
}

function InfiltrantPage() {
  const hash = window.location.hash || '';
  const query = hash.includes('?') ? hash.split('?').slice(1).join('?') : '';
  const params = new URLSearchParams(query);
  const accessCode = params.get('code') || '';
  const [verified,setVerified]=useState(null);
  const [briefingDone,setBriefingDone]=useState(false);
  const [email,setEmail]=useState('');
  const [sending,setSending]=useState(false);
  const [status,setStatus]=useState('');

  useEffect(()=>{
    let active=true;
    fetch(`${API}/api/infiltrant/verify?code=${encodeURIComponent(accessCode)}`)
      .then(async r=>({ok:r.ok,body:await r.json().catch(()=>({}))}))
      .then(({ok})=>{if(active)setVerified(ok);})
      .catch(()=>{if(active)setVerified(false);});
    return()=>{active=false};
  },[accessCode]);

  const sendCamera=async(e)=>{
    e.preventDefault(); setSending(true); setStatus('');
    try{
      const r=await fetch(`${API}/api/infiltrant/send-camera`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessCode,email})
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error||'Versturen mislukt');
      setStatus('VERZONDEN');
    }catch(err){setStatus(err.message);}finally{setSending(false);}
  };

  if(verified===null) return <main className="infiltrant-page"><section className="infiltrant-card"><div className="section-label">VERBINDING CONTROLEREN</div><h1>Beveiligd kanaal</h1><p>Een ogenblik.</p></section></main>;
  if(!verified) return <main className="infiltrant-page denied"><section className="infiltrant-card"><div className="section-label">TOEGANG GEWEIGERD</div><h1>Onbekend kanaal.</h1><p>Deze verbinding bestaat niet of de dossiercode is ongeldig.</p></section></main>;

  return <main className="infiltrant-page">
    <section className="infiltrant-card">
      <div className="infiltrant-status"><span></span> VERSLEUTELDE VERBINDING</div>
      <div className="section-label">ALLEEN VOOR KEES ZOEK</div>
      <h1>De informant stuurt je een bericht</h1>
      <p className="infiltrant-copy">Speel het bericht volledig af. Reageer pas wanneer de verbinding daarom vraagt.</p>
      <audio className="audio-player infiltrant-audio" controls preload="metadata" src="/assets/story/infiltrant-kees-zoek.mp3" onEnded={()=>setBriefingDone(true)} />
      {!briefingDone&&<div className="infiltrant-locked"><span>BERICHT NOG NIET VOLLEDIG AFGELUISTERD</span></div>}
      {briefingDone&&status!=='VERZONDEN'&&<form className="infiltrant-mail-form" onSubmit={sendCamera}>
        <div><span>BEVEILIGDE OVERDRACHT</span><h2>Waar moeten de bestanden naartoe?</h2><p>Vul één e-mailadres in. De bron stuurt het cameramateriaal direct door.</p></div>
        <label>E-mailadres<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="naam@voorbeeld.nl" autoComplete="email" required/></label>
        <button className="primary" disabled={sending}>{sending?'Bestanden verzenden...':'Verstuur beveiligde bestanden'}</button>
      </form>}
      {status&&status!=='VERZONDEN'&&<div className="feedback">{status}</div>}
    </section>
  </main>;
}


function RotjeSecretPage() {
  const hash = window.location.hash || '';
  const rawQuery = hash.includes('?') ? hash.split('?').slice(1).join('?') : '';
  const accessCode = new URLSearchParams(rawQuery).get('code') || '';
  const [verified,setVerified] = useState(null);
  const [completed,setCompleted] = useState(false);
  useEffect(()=>{
    let active=true;
    fetch(`${API}/api/rotje/verify?code=${encodeURIComponent(accessCode)}`)
      .then(r=>{if(active)setVerified(r.ok);})
      .catch(()=>{if(active)setVerified(false);});
    return()=>{active=false};
  },[accessCode]);
  if(verified===null) return <main className="infiltrant-page"><section className="infiltrant-card"><h1>Verbinding controleren…</h1></section></main>;
  if(!verified) return <main className="infiltrant-page denied"><section className="infiltrant-card"><div className="section-label">TOEGANG GEWEIGERD</div><h1>Onbekend contactkanaal</h1><p>De dossierverwijzing is niet geldig.</p></section></main>;
  return <main className="infiltrant-page rotje-secret-page"><section className="infiltrant-card">
    <div className="infiltrant-status"><span></span> VERTROUWELIJKE VERBINDING</div>
    <div className="section-label">ALLEEN VOOR DE AANGEWEZEN RECHERCHEUR</div>
    <h1>Een bericht van Rotje Knor</h1>
    <p className="infiltrant-copy">Luister de volledige opname af. Bespreek de informatie daarna met je team.</p>
    <audio className="audio-player infiltrant-audio" controls preload="metadata" src="/assets/story/rotje-knor.mp3" onEnded={()=>setCompleted(true)} />
    {!completed?<div className="infiltrant-locked"><span>VOLLEDIG AFSPELEN OM HET BERICHT TE BEVESTIGEN</span></div>:
      <div className="rotje-proof"><span>VERTROUWELIJKE TOEGANGSCODE</span><h2>Toegang tot de transportadministratie</h2><strong>RK-7318</strong><p>Gebruik deze code in het aparte transportsysteem waarvan de inloggegevens in jullie fysieke dossier staan.</p></div>}
  </section></main>;
}

function TransportSystemPage() {
  const [code,setCode]=useState('');
  const [record,setRecord]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const login=async(e)=>{
    e.preventDefault();setError('');setLoading(true);
    try {
      const r=await fetch(`${API}/api/transport-system/access`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok) {
        if(r.status===403) throw new Error('Toegang geweigerd. Controleer de ontvangen toegangscode.');
        throw new Error(`Het transportsysteem reageert niet goed (fout ${r.status}). Probeer opnieuw.`);
      }
      setRecord(j.record);
    }catch(err){
      setError(err instanceof TypeError ? 'Verbinding met het transportsysteem mislukt. Controleer of de API op Render live is.' : err.message);
    }finally{setLoading(false);}
  };
  return <main className="infiltrant-page transport-system-page"><section className="infiltrant-card transport-terminal">
    <div className="infiltrant-status"><span></span> HAVEN · TRANSPORTADMINISTRATIE</div>
    <div className="section-label">AFGESCHERMD SYSTEEM</div>
    <h1>Transport­systeem</h1>
    {!record?<><p className="infiltrant-copy">Alleen toegankelijk met een geldige autorisatiecode.</p>
      <form onSubmit={login} className="transport-login"><label>Autorisatiecode<input autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} placeholder="Voer toegangscode in" required /></label>
      <button className="primary" disabled={loading}>{loading?'Controleren...':'Inloggen'}</button></form>
      {error&&<div className="feedback" role="alert">{error}</div>}
    </>:<div className="transport-record">
      <div className="transport-record-head"><span>INTERNE MUTATIE · TRANSPORT</span><strong>REGISTRATIE GEVONDEN</strong></div>
      <h2>Laatste wijziging op zending</h2>
      <table className="transport-system-table"><tbody>
        <tr><th>Oorspronkelijke container</th><td>{record.originalContainer}</td></tr>
        <tr><th>Wijzigingstijd</th><td>{record.modifiedAt}</td></tr>
        <tr><th>Wijziging uitgevoerd door</th><td>{record.modifiedBy}</td></tr>
        <tr><th>Functie</th><td>{record.role}</td></tr>
        <tr><th>Nieuwe status oude container</th><td>{record.originalStatus}</td></tr>
        <tr><th>Mutatie</th><td>{record.action}</td></tr>
      </tbody></table>
      <p className="transport-record-foot">Dit is een registratie uit het transportsysteem. Het vervangende containernummer is hier niet vrijgegeven.</p>
    </div>}
  </section></main>;
}

function App() {
  const [mode, setMode] = useState('login');
  const [team, setTeam] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [penaltyShown, setPenaltyShown] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

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

  const resetTeam = async (teamId, teamName) => {
    const ok = window.confirm(`Weet je zeker dat je ${teamName} volledig wilt resetten? Timer, hints, routekeuze en voortgang worden gewist.`);
    if (!ok) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/facilitator/teams/${teamId}/reset`, { method:'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Resetten mislukt');
      await loadDashboard();
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const saveTeamSetup = async (participants) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/team-setup`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participants }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Teamopstelling opslaan mislukt');
      setTeam(j.team); return true;
    } catch (err) { setFeedback(err.message); return false; }
    finally { setLoading(false); }
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
      if (!r.ok) {
        if (r.status===422 && j.penaltySeconds===60) {setTeam(j.team);setPenaltyShown(true);}
        else setFeedback(j.error || 'Controle mislukt.');
        return false;
      }
      setTeam(j.team); setFeedback(''); return true;
    } catch (err) { setFeedback('Verbinding met het spelsysteem mislukt.'); return false; }
    finally { setLoading(false); }
  };

  const submitAnswer = async (phase, answer) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/answer`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phase, answer }) });
      const j = await r.json();
      if (!r.ok) {
        if (j.team) setTeam(j.team);
        if (r.status === 422 && j.penaltySeconds===60 && j.team) {
          setPenaltyShown(true);
          setFeedback('');
        } else {
          setFeedback(j.error || 'Dat antwoord klopt nog niet.');
        }
        return false;
      }
      setTeam(j.team); setFeedback(''); return true;
    } catch (err) { setFeedback('Verbinding met het spelsysteem mislukt.'); return false; }
    finally { setLoading(false); }
  };

  const checkStep = async (phase,step,value) => {
    try {
      const r=await fetch(`${API}/api/teams/${team.id}/check-step`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phase,step,value})
      });
      const j=await r.json();
      if(!r.ok){
        if(r.status===422 && j.penaltySeconds===60){setTeam(j.team);setPenaltyShown(true);setFeedback('');}
        else setFeedback(j.error||'Controle mislukt.');
        return false;
      }
      return true;
    } catch {setFeedback('Verbinding met het spelsysteem mislukt.');return false;}
  };

  const requestHint = async (text) => {
    setFeedback(text);
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/hint`, { method:'POST' });
      const j = await r.json(); if (r.ok) setTeam(j.team);
    } catch {}
  };

  const startJohnnyOffer = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/johnny-offer-start`, {method:'POST'});
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Kon de keuzeperiode niet starten.');
      setTeam(j.team);
    } catch(err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const chooseRoute = async (route) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/route`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ route }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Keuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const syncFinal = async () => {
    if (!team || team.currentPhase!=='KOPER_KEUZE') return;
    try {
      const r=await fetch(`${API}/api/teams/${team.id}/final-status`);
      const j=await r.json();if(r.ok && j.team) setTeam(j.team);
    } catch {}
  };

  const sendBuyerChat = async (action,value='',time='') => {
    setLoading(true);setFeedback('');
    try {
      const r=await fetch(`${API}/api/teams/${team.id}/buyer-chat`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,time})
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok) {
        if(j.team) setTeam(j.team);
        if(r.status===422 && j.penaltySeconds===60) {setPenaltyShown(true);return false;}
        setFeedback(j.error||'Het bericht kon niet worden verzonden.');return false;
      }
      setTeam(j.team);return true;
    }catch {setFeedback('De verbinding met het beveiligde kanaal is verbroken.');return false;}
    finally {setLoading(false);}
  };

  const chooseFinal = async (choice) => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/final-choice`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ choice }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Eindkeuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const goBackWithPenalty = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await fetch(`${API}/api/teams/${team.id}/go-back`, { method:'POST' });
      const j = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(j.error || 'Teruggaan mislukt.');
      if (j.team) setTeam(j.team);
      setBackConfirmOpen(false);
    } catch (err) {
      setFeedback(err.message);
      setBackConfirmOpen(false);
    } finally { setLoading(false); }
  };

  if (mode === 'game' && team) {
    const idx = Math.max(0, phases.indexOf(team.currentPhase));
    const canGoBack = idx > 0;
    return <main className={`scene-page phase-${String(team.currentPhase || "start").toLowerCase()}`}> 
      <div className="scene-backdrop" aria-hidden="true"></div>
      <div className="scene-vignette" aria-hidden="true"></div>
      <div className="app-shell game-shell scene-inner">
        <section className="topbar game-topbar"><div className="topbar-left"><button className="ghost" onClick={()=>setMode('login')}>← Uitloggen</button>{canGoBack&&<button className="secondary previous-page-button" onClick={()=>setBackConfirmOpen(true)}>← Vorige pagina</button>}</div><GameCountdown timerStartedAt={team.timerStartedAt}/><div className="eyebrow">DE ZWARTE LOTUS</div></section>
        <section className="hero compact"><div><span className="chip">VERTROUWELIJK ONDERZOEK</span><h1>{team.teamName}</h1><p>Spelronde: {team.eventName}</p></div><div className="progress-ring">{Math.round((idx/(phases.length-1))*100)}%</div></section>
        {team.currentPhase === 'START' && !team.charactersConfigured
          ? <TeamSetup team={team} loading={loading} feedback={feedback} saveTeamSetup={saveTeamSetup}/>
          : <GamePhase team={team} loading={loading} feedback={feedback} startGame={startGame} submitOpening={submitOpening} startCountdown={startCountdown} submitAnswer={submitAnswer} requestHint={requestHint} chooseRoute={chooseRoute} chooseFinal={chooseFinal} syncFinal={syncFinal} sendBuyerChat={sendBuyerChat} checkStep={checkStep} startJohnnyOffer={startJohnnyOffer}/>}
        {penaltyShown && <div className="penalty-overlay" role="alertdialog" aria-modal="true" aria-label="Strafminuut toegevoegd">
          <div className="penalty-screen">
            <div className="penalty-exclamation" aria-hidden="true">!</div>
            <div className="penalty-eyebrow">ONJUIST ANTWOORD</div>
            <h2>+1 MINUUT</h2>
            <p>Strafminuut toegevoegd aan jullie speeltijd.</p>
            <button className="primary" onClick={()=>setPenaltyShown(false)}>Terug naar het onderzoek</button>
          </div>
        </div>}
        {backConfirmOpen && <div className="penalty-overlay" role="alertdialog" aria-modal="true" aria-label="Vorige pagina openen">
          <div className="penalty-screen backtrack-screen">
            <div className="penalty-exclamation" aria-hidden="true">↶</div>
            <div className="penalty-eyebrow">VORIGE PAGINA</div>
            <h2>+2 MINUTEN STRAFTIJD</h2>
            <p>Willen jullie echt terug naar de vorige pagina om informatie opnieuw te bekijken?</p>
            <div className="actions">
              <button className="secondary" onClick={()=>setBackConfirmOpen(false)} disabled={loading}>Blijven hier</button>
              <button className="primary" onClick={goBackWithPenalty} disabled={loading}>{loading?'Teruggaan...':'Ja, ga terug'}</button>
            </div>
          </div>
        </div>}
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
        <section className="hero compact"><div><span className="chip">SPELBEGELEIDING</span><h1>Locatiedashboard</h1><p>{dashboard.event.name} · {dashboard.teams.length} teams actief</p></div><button className="secondary" onClick={loadDashboard}>Vernieuwen</button></section>
        <section className="table-card"><table><thead><tr><th>Team</th><th>Fase</th><th>Tijd</th><th>Hints</th><th>Route</th><th>Status</th><th>Actie</th></tr></thead><tbody>{dashboard.teams.map(t=><tr key={t.id}><td><strong>{t.teamName}</strong></td><td>{phaseLabels[t.currentPhase] || t.currentPhase.replaceAll('_',' ')}</td><td>{t.elapsedMinutes} min</td><td>{t.hintCount}</td><td>{t.chosenRoute||'—'}</td><td><span className={`status ${t.status}`}>{t.status}</span></td><td><button className="reset-team-button" disabled={loading} onClick={()=>resetTeam(t.id,t.teamName)}>Reset team</button></td></tr>)}</tbody></table></section>
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
  if(!timerStartedAt) return <div className="game-countdown waiting"><span>SPEELTIJD</span><strong>00:00</strong><small>max. 90:00 · start na briefing</small></div>;
  const elapsed=Math.max(0,Math.floor((now-Number(timerStartedAt))/1000));
  const shown=elapsed;
  const min=Math.floor(shown/60);
  const sec=shown%60;
  const urgent=elapsed>=4500 && elapsed<5400;
  const expired=elapsed>=5400;
  return <div className={`game-countdown ${urgent?'urgent':''} ${expired?'expired':''}`}><span>{expired?'MAXIMALE TIJD':'SPEELTIJD'}</span><strong>{String(min).padStart(2,'0')}:{String(sec).padStart(2,'0')}</strong><small>maximaal 90:00</small></div>;
}


function TeamSetup({team,loading,feedback,saveTeamSetup}) {
  const [count,setCount]=useState(2);
  const [players,setPlayers]=useState([{playerName:''},{playerName:''}]);

  const changeCount=(n)=>{
    const next=Math.max(2,Math.min(6,Number(n)||2));
    setCount(next);
    setPlayers(prev=>Array.from({length:next},(_,i)=>prev[i]||{playerName:''}));
  };
  const update=(i,value)=>setPlayers(prev=>prev.map((p,idx)=>idx===i?{playerName:value}:p));
  const complete=players.length===count && players.every(p=>p.playerName.trim()) && new Set(players.map(p=>p.playerName.trim().toLowerCase())).size===count;
  const submit=async()=>{ if(!complete)return; await saveTeamSetup(players.map(p=>({playerName:p.playerName.trim()}))); };

  return <section className="panel cinematic team-setup-panel">
    <div className="section-label">TEAMOPSTELLING · VERTROUWELIJK</div>
    <h2>Wie zitten er in jullie rechercheteam?</h2>
    <p>Vul alleen de namen van de deelnemers in. Het spelsysteem bepaalt daarna willekeurig welke detective iedere deelnemer wordt.</p>

    <div className="player-count-block">
      <span>AANTAL DEELNEMERS</span>
      <div className="player-count-buttons">{[2,3,4,5,6].map(n=><button type="button" key={n} className={count===n?'active':''} onClick={()=>changeCount(n)}>{n}</button>)}</div>
    </div>

    <h3 className="research-team-title">Het recherche team</h3>
    <div className="character-roster">{investigatorCharacters.map(c=><article key={c.id} className="character-card">
      <img src={c.image} alt={`Portret van ${c.name}`}/>
      <div><strong>{c.name}{['kees-zoek','rob-berie'].includes(c.id)&&<em className="required-badge">VASTE KERN</em>}</strong><span>{c.specialty}</span><small>{c.blurb}</small></div>
    </article>)}</div>

    <div className="assignment-board random-assignment-board">
      <div className="assignment-head"><span>DEELNEMERS</span><strong>Vul jullie namen in</strong></div>
      {players.map((p,i)=><div className="assignment-row name-only" key={i}>
        <label>Deelnemer {i+1}<input value={p.playerName} onChange={e=>update(i,e.target.value)} placeholder={`Naam deelnemer ${i+1}`} /></label>
      </div>)}
    </div>

    <button type="button" className="primary full team-confirm" disabled={loading||!complete} onClick={submit}>{loading?'Team samenstellen...':'Verdeel de karakters'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function GamePhase({ team, loading, feedback, startGame, submitOpening, startCountdown, submitAnswer, requestHint, chooseRoute, chooseFinal, syncFinal, sendBuyerChat, checkStep, startJohnnyOffer }) {
  const phase = team.currentPhase;
  if (phase === 'START') return <section className="panel cinematic intro-panel">
    <div className="section-label">MAISON BEAUMONT · VERTROUWELIJK</div>
    <h2>Een diner. Een diamant. Een verdwenen spoor.</h2>
    <p>Vanavond presenteert Maison Beaumont één van de zeldzaamste stenen ter wereld: <strong>De Zwarte Lotus</strong>. Een zwarte diamant met een waarde waar mensen voor liegen, verdwijnen — en erger.</p>
    {team.participants?.length>0&&<div className="active-team-strip">{team.participants.map(p=>{const c=investigatorCharacters.find(x=>x.id===p.characterId);return <article key={p.characterId}>{c&&<img src={c.image} alt=""/>}<span><small>{p.playerName}</small><strong>{p.characterName}</strong></span></article>})}</div>}
    <div className="mission-card"><span>MISSIE 01</span><strong>Pak jullie persoonlijke dossierboeken. Daarna begint de briefing van de inspecteur.</strong></div>
    <button className="primary" onClick={startGame} disabled={loading}>{loading?'Starten...':'Start het onderzoek'}</button>
  </section>;

  if (['ALARM','CAMERA','KIST_OPEN'].includes(phase)) return <OpeningPuzzlePage loading={loading} feedback={feedback} submitOpening={submitOpening} startCountdown={startCountdown} requestHint={requestHint} timerStartedAt={team.timerStartedAt} />;

  if (phase === 'DOSSIER') return <DossierPuzzle team={team} loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;

  if (phase === 'ORIGINELE_CONTAINER') return <OriginalContainerPuzzle team={team} checkStep={checkStep} loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'ORIGINELE_CONTAINER_BEVESTIGEN') return <OriginalContainerConfirmation loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'ROTJE_KNOR') return <RotjeKnorPhase loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'JOHNNY_ONTMASKERD') return <JohnnyIdentifyPuzzle loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'NIEUWE_CONTAINER') return <JohnnyContainerPuzzle checkStep={checkStep} loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'KEUZE') return <JohnnyChoice team={team} loading={loading} feedback={feedback} chooseRoute={chooseRoute} startJohnnyOffer={startJohnnyOffer} />;
  if (phase === 'JOHNNY_ROUTE') return <JohnnyRouteIntro loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'KLUIS') return <SafePuzzle checkStep={checkStep} loading={loading} feedback={feedback} submitAnswer={submitAnswer} requestHint={requestHint} />;
  if (phase === 'LOTUS_GEVONDEN') return <LotusFound loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'JOHNNY_MELDEN') return <JohnnyInspectorReport loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'JOHNNY_ARRESTATIE') return <JohnnyArrestOperation team={team} loading={loading} feedback={feedback} submitAnswer={submitAnswer} />;
  if (phase === 'EINDE' && team.chosenRoute === 'Politie') return <section className="panel cinematic"><div className="section-label">POLITIEROUTE</div><h2>De mede-agenten zijn ingelicht.</h2><p>Deze verhaallijn bouwen we later verder. Voor de huidige test stopt deze route hier.</p></section>;
  if (phase === 'KOPER_KEUZE' && team.chosenRoute === 'Johnny') return <BuyerFinalChoice team={team} loading={loading} feedback={feedback} chooseFinal={chooseFinal} syncFinal={syncFinal} />;
  if (phase === 'EINDOPERATIE' && team.chosenRoute === 'Johnny') return <JohnnyFinalOperation team={team} loading={loading} feedback={feedback} sendBuyerChat={sendBuyerChat} />;
  if (phase === 'RESULTAAT' && team.chosenRoute === 'Johnny') return <JohnnyResult team={team} />;

  return <section className="panel"><div className="section-label">HUIDIGE FASE</div><h2>{phaseLabels[phase] || phase.replaceAll('_',' ')}</h2><p>Deze fase bouwen we in de volgende stap verder uit.</p></section>;
}


function OpeningPuzzlePage({loading,feedback,submitOpening,startCountdown,requestHint,timerStartedAt}) {
  const [briefingDone,setBriefingDone]=useState(Boolean(timerStartedAt));
  const [accessCode,setAccessCode]=useState('');
  const [local,setLocal]=useState('');
  const [timerLaunch,setTimerLaunch]=useState(false);

  const finishBriefing = async () => {
    if(briefingDone) return;
    setBriefingDone(true);
    setTimerLaunch(true);
    setLocal('De speeltijd loopt. Jullie hebben maximaal 90 minuten.');
    // De fullscreen timer verdwijnt automatisch na twee seconden, zonder klik.
    setTimeout(()=>setTimerLaunch(false),2000);
    await startCountdown();
  };

  const submit = async (e) => {
    e.preventDefault();
    if(!briefingDone){setLocal('Luister eerst het volledige bericht van de inspecteur af.');return;}
    const ok = await submitOpening({ code:accessCode });
    if(!ok) setLocal('Toegang geweigerd. Controleer de aanwijzingen opnieuw.');
  };

  return <section className="panel opening-case-panel">
    {timerLaunch&&<div className="timer-launch-overlay" role="status" aria-live="assertive"><div className="timer-launch-inner"><span>DE SPEELTIJD START</span><strong>00:00</strong><small>Maximale speeltijd: 90 minuten.</small></div></div>}

    <div className="opening-briefing">
      <div className="inspector-visual"><img src="/assets/inspector-kist.jpg" alt="Boze inspecteur in een noir recherchekamer"/><div className="inspector-badge">HOOFDINSPECTEUR · MAISON BEAUMONT</div></div>
      <div className="inspector-copy">
        <div className="section-label">SPOEDBRIEFING</div>
        <h2>“Jullie hebben één taak.”</h2>
        <div className={`briefing-audio ${briefingDone?'complete':''}`}>
          <div><span>{briefingDone?'BRIEFING VOLTOOID':'VERPLICHT BERICHT'}</span><strong>Inspecteur Beaumont</strong></div>
          <audio controls preload="metadata" src="/assets/inspector-briefing.mp3" onEnded={finishBriefing} />
        </div>
        {!briefingDone&&<div className="briefing-lock">🔒 Luister het volledige bericht af.</div>}
      </div>
    </div>

    <form className={`opening-puzzles evidence-board ${briefingDone?'unlocked':'locked'}`} onSubmit={submit}>
      <article className="opening-puzzle-card evidence-card">
        <div className="puzzle-kicker">ONDERZOEK · BEVEILIGDE TOEGANG</div>
        <h3>Voer de toegangscode in.</h3>
        <p>Gebruik jullie onderzoeksresultaten om toegang te krijgen tot het vervolg van de zaak.</p>
        <label>Toegangscode
          <input disabled={!briefingDone} value={accessCode} onChange={e=>setAccessCode(e.target.value.replace(/\D/g,'').slice(0,4))} inputMode="numeric" pattern="[0-9]{4}" autoComplete="off" placeholder="••••" maxLength={4} required aria-label="Viercijferige toegangscode" />
        </label>
      </article>
      <div className="opening-submit">
        <button type="button" className="hint-link" disabled={!briefingDone} onClick={()=>requestHint('Hint: vergelijk wat jullie via het alarmonderzoek en het visuele spoor hebben vastgesteld.')}>Hint aanvragen</button>
        <button className="primary" disabled={loading||!briefingDone||accessCode.length!==4}>{loading?'Controleren...':'Ontgrendel het onderzoek'}</button>
      </div>
    </form>
    {local&&<div className="filter-feedback" aria-live="polite">{local}</div>}
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}


const suspects = [
  { id:'rita', name:'Rita Ratel', alias:'De Fluwelen Hand', image:'/assets/suspects/rita.jpg' },
  { id:'johnny', name:'Johnny Jatwerk', alias:'De Wegbrenger', image:'/assets/suspects/johnny.jpg' },
  { id:'max', name:'Max Muntwasser', alias:'De Schone Boekhouder', image:'/assets/suspects/max.jpg' },
  { id:'carla', name:'Carla Kraak', alias:'De Slotfluisteraar', image:'/assets/suspects/carla.jpg' },
  { id:'boris', name:'Boris Breekijzer', alias:'De Man met de Koevoet', image:'/assets/suspects/boris.jpg' },
  { id:'don', name:'Don Diamantini', alias:'De Koning van de Karaat', image:'/assets/suspects/don.jpg' },
  { id:'vera', name:'Valse Vera', alias:'De Vrouw met Zeven Namen', image:'/assets/suspects/vera.jpg' },
  { id:'freddy', name:'Freddy Flessentrekker', alias:'De Bonnenkoning', image:'/assets/suspects/freddy.jpg' }
];

function DossierPuzzle({team,loading,feedback,submitAnswer,requestHint}) {
  const [suspectCount,setSuspectCount]=useState('');
  const [entries,setEntries]=useState([]);

  const skillOptions=[
    {value:'techniek',label:'Techniek / beveiliging'},
    {value:'documenten',label:'Documenten / vervalsing'},
    {value:'koper',label:'Koper / afzet'},
    {value:'transport',label:'Transport / smokkel'},
    {value:'afleiding',label:'Afleiding / zakkenrollen'},
    {value:'identiteit',label:'Identiteit / vermomming'},
    {value:'inbraak',label:'Inbraak / brute kracht'},
    {value:'financien',label:'Financiën / geldstromen'}
  ];

  const changeCount=(value)=>{
    const n=Math.max(0,Math.min(8,Number(value)||0));
    setSuspectCount(value);
    setEntries(prev=>Array.from({length:n},(_,i)=>prev[i]||{name:'',skill:''}));
  };

  const updateEntry=(index,key,value)=>setEntries(prev=>prev.map((row,i)=>i===index?{...row,[key]:value}:row));
  const count=Number(suspectCount)||0;
  const complete=count>0&&entries.length===count&&entries.every(x=>x.name.trim()&&x.skill);
  const submit=async()=>{if(!complete)return;await submitAnswer('DOSSIER',{count,entries});};

  return <section className="panel dossier-ready evidence-reconstruction physical-dossier-phase">
    <div className="success-seal">TOEGANG VERLEEND</div>
    <div className="section-label">FASE 2 · RECONSTRUCTIE</div>
    <div className="mission-card inspector-summons" role="note"><span><strong>DRINGEND BERICHT VAN DE INSPECTEUR</strong></span><strong>Hé, nietsnutten!</strong><p>Schiet nou eens op! Ik heb eindelijk die verdomde transportgegevens van de Douane binnengekregen waar jullie om vroegen!</p><p>Wat staan jullie daar nog te kijken? Kom die papieren onmiddellijk bij me ophalen!</p><p>En zorg dat jullie er deze keer wél iets nuttigs mee doen!</p><strong>HUP! AAN HET WERK!</strong></div>
    <h2>Wie zijn verdacht van de roof?</h2>
    <p>Gebruik de fysieke verdachte- en bewijsdossiers. Leg jullie gezamenlijke conclusie hieronder vast.</p>

    <div className="dossier-count-card">
      <label>Hoeveel mensen zijn er verdacht?
        <input type="number" min="1" max="8" inputMode="numeric" value={suspectCount} onChange={e=>changeCount(e.target.value)} placeholder="Aantal verdachten" />
      </label>
    </div>

    {count>0&&<div className="physical-suspect-entry-list">
      {entries.map((entry,index)=><div className="physical-suspect-entry" key={index}>
        <div className="physical-suspect-number">{String(index+1).padStart(2,'0')}</div>
        <label>Welke verdachte?
          <input value={entry.name} onChange={e=>updateEntry(index,'name',e.target.value)} placeholder="Naam uit het dossier" autoComplete="off" />
        </label>
        <label>Door welke vaardigheid is deze persoon verdacht?
          <select value={entry.skill} onChange={e=>updateEntry(index,'skill',e.target.value)}>
            <option value="">Kies vaardigheid…</option>
            {skillOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>)}
    </div>}

    <div className="dossier-submit-footer simple"><button className="primary" type="button" disabled={loading||!complete} onClick={submit}>{loading?'Controleren...':'Bevestig conclusie'}</button></div>
    <button className="hint-link" onClick={()=>requestHint('Hint: kijk niet alleen naar wat iemand gedaan kan hebben, maar welke verschillende vaardigheden noodzakelijk waren om de roof uit te voeren.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

const containerRows = [
  {container:'MBX-1120',dock:'11',arrival:'19:40',status:'Vrijgegeven'},
  {container:'MBX-2408',dock:'24',arrival:'20:08',status:'Vrijgegeven'},
  {container:'MBX-3314',dock:'33',arrival:'20:14',status:'Vertraagd'},
  {container:'MBX-4717',dock:'17',arrival:'20:15',status:'Handmatige controle'},
  {container:'MBX-8617',dock:'17',arrival:'19:55',status:'Vrijgegeven'},
  {container:'MBX-7317',dock:'17',arrival:'20:15',status:'Wacht op controle'},
  {container:'MBX-9017',dock:'17',arrival:'20:18',status:'Gesloten'},
  {container:'MBX-2517',dock:'17',arrival:'20:15',status:'Vrijgegeven'},
  {container:'MBX-7303',dock:'07',arrival:'20:15',status:'Technische controle'},
  {container:'MBX-1906',dock:'19',arrival:'20:06',status:'Vrijgegeven'},
  {container:'MBX-4417',dock:'44',arrival:'20:17',status:'Vertraagd'}
];

function OriginalContainerPuzzle({team,loading,feedback,submitAnswer,requestHint,checkStep}) {
  const [dock,setDock]=useState('');
  const [arrival,setArrival]=useState('');
  const [origin,setOrigin]=useState('');
  const [dockOk,setDockOk]=useState(!!team?.completedSteps?.ORIGINELE_CONTAINER?.dock);
  const [arrivalOk,setArrivalOk]=useState(!!team?.completedSteps?.ORIGINELE_CONTAINER?.arrival);
  const [originOk,setOriginOk]=useState(!!team?.completedSteps?.ORIGINELE_CONTAINER?.origin);
  const [localFeedback,setLocalFeedback]=useState('');

  const normal=(v)=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const checkDock=async(e)=>{e.preventDefault();if(await checkStep('ORIGINELE_CONTAINER','dock',normal(dock))){setDockOk(true);setLocalFeedback('Dock bevestigd. De vrachtlijst is versmald.');}else{setDockOk(false);setArrivalOk(false);setOriginOk(false);setLocalFeedback('');}};
  const checkArrival=async(e)=>{e.preventDefault();if(await checkStep('ORIGINELE_CONTAINER','arrival',normal(arrival))){setArrivalOk(true);setLocalFeedback('Aankomsttijd bevestigd. Er blijven nog drie mogelijke containers over.');}else{setArrivalOk(false);setOriginOk(false);setLocalFeedback('');}};
  const checkOrigin=async(e)=>{e.preventDefault();if(await checkStep('ORIGINELE_CONTAINER','origin',normal(origin))){setOriginOk(true);setLocalFeedback('Herkomst bevestigd. Er blijft nog één container over.');}else{setOriginOk(false);setLocalFeedback('');}};

  const visibleRows=containerRows.filter(r=>{
    if(!dockOk) return true;
    if(!arrivalOk) return r.dock==='17';
    if(!originOk) return r.dock==='17'&&r.arrival==='20:15';
    return r.container==='MBX-4717';
  });

  return <section className="panel container-puzzle transport-onepage">
    <div className="section-label">FASE 3 · OORSPRONKELIJK TRANSPORTPLAN</div>
    <h2>Reconstrueer het oorspronkelijke transport.</h2>
    <p>Gebruik de fysieke bewijsstukken om de vrachtlijst te verkleinen. Elk correct filter haalt onmogelijke containers uit beeld. Pas wanneer alle drie de kenmerken bewezen zijn, blijft de oorspronkelijke container over.</p>

    <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Dock</th><th>Aankomst</th><th>Status</th></tr></thead><tbody>{visibleRows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.dock}</td><td>{r.arrival}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    <div className="manifest-count">{visibleRows.length} {visibleRows.length===1?'container over':'containers zichtbaar'}</div>

    <div className="transport-filter-grid">
      <form className={`transport-filter-card ${dockOk?'solved':''}`} onSubmit={checkDock}>
        <span>ROUTEGEGEVEN</span>
        <strong>Welk dock hoort bij de oorspronkelijke route?</strong>
        <small>Gebruik de fysieke routegegevens van het heist-team.</small>
        <div className="filter-input"><input value={dock} onChange={e=>setDock(e.target.value)} placeholder="Docknummer" inputMode="numeric" required/><button className="primary">{dockOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>

      <form className={`transport-filter-card ${arrivalOk?'solved':''} ${!dockOk?'locked':''}`} onSubmit={checkArrival}>
        <span>TIJDLIJN</span>
        <strong>Welke aankomsttijd hoort bij de zending?</strong>
        <small>Combineer de eerder gevonden tijden met de transportinformatie.</small>
        <div className="filter-input"><input value={arrival} onChange={e=>setArrival(e.target.value)} placeholder="Bijv. 20:15" disabled={!dockOk} required/><button className="primary" disabled={!dockOk}>{arrivalOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>

      <form className={`transport-filter-card ${originOk?'solved':''} ${!arrivalOk?'locked':''}`} onSubmit={checkOrigin}>
        <span>HERKOMST</span>
        <strong>Uit welk land kwam de juiste zending?</strong>
        <small>Onderzoek welke herkomstgegevens nog ontbreken.</small>
        <div className="filter-input"><input value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="Land van herkomst" disabled={!arrivalOk} required/><button className="primary" disabled={!arrivalOk}>{originOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>
    </div>

    {originOk&&<div className="transport-next-screen">
      <span>TRANSPORTONDERZOEK AFGEROND</span>
      <h3>Jullie hebben de vrachtlijst teruggebracht tot één mogelijke zending.</h3>
      <p>Ga verder om de eindconclusie apart vast te leggen.</p>
      <button className="primary" type="button" disabled={loading} onClick={()=>submitAnswer('ORIGINELE_CONTAINER','verder')}>{loading?'Laden...':'Ga naar eindbevestiging'}</button>
    </div>}

    {localFeedback&&<div className="filter-feedback" aria-live="polite">{localFeedback}</div>}
    <button className="hint-link" onClick={()=>requestHint(!dockOk?'Hint: begin met de fysieke routegegevens en zoek het dock dat bij het heist-team hoort.':!arrivalOk?'Hint: vergelijk de tijdlijn met de overgebleven aankomsttijden.':!originOk?'Hint: vergelijk de herkomstgegevens uit het externe transportregister met de overgebleven zendingen.':'Hint: na drie correcte filters hoort er nog maar één regel over te zijn.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}


function OriginalContainerConfirmation({loading,feedback,submitAnswer,requestHint}) {
  return <section className="panel container-puzzle transport-confirmation">
    <div className="section-label">FASE 3 · EINDBEVESTIGING</div>
    <h2>Leg jullie conclusie vast.</h2>
    <p>Het transportonderzoek is afgerond. Welk containernummer hoort volgens jullie bij het oorspronkelijke plan?</p>
    <div className="transport-confirmation-card">
      <span>DEFINITIEVE IDENTIFICATIE</span>
      <AnswerForm loading={loading} placeholder="Containernummer" maxLength={16} button="Bevestig container" onSubmit={v=>submitAnswer('ORIGINELE_CONTAINER_BEVESTIGEN',v)}/>
    </div>
    <button className="hint-link" onClick={()=>requestHint('Hint: controleer de enige overgebleven regel uit het transportonderzoek.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function RotjeKnorPhase({loading,feedback,submitAnswer}) {
  const [event,setEvent] = useState('');
  const [who,setWho] = useState('');
  return <section className="panel cinematic informant-panel secret-followup">
    <div className="section-label">FASE 4 · NIEUW SPOOR</div>
    <h2>Nieuw spoor</h2>
    <form className="answer-form" onSubmit={e=>{e.preventDefault();submitAnswer('ROTJE_KNOR',{event,who})}}>
      <label>Wat is er met het oorspronkelijke transport gebeurd?
        <input value={event} onChange={e=>setEvent(e.target.value)} required autoComplete="off" placeholder="Jullie bevinding" />
      </label>
      <label>Wie heeft de route gewijzigd?
        <input value={who} onChange={e=>setWho(e.target.value)} required autoComplete="off" placeholder="Volledige voor- en achternaam" />
      </label>
      <button className="primary" disabled={loading}>{loading?'Controleren...':'Bevestig conclusie'}</button>
    </form>
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
  {container:'JJX-1841',series:'JJX',time:'18:41',route:'Reguliere afvoer',status:'Afgerond'},
  {container:'JJX-2034',series:'JJX',time:'20:34',route:'Ongeplande overslag',status:'Actief'},
  {container:'JJX-2134',series:'JJX',time:'21:34',route:'Wacht op vrijgave',status:'Vertraagd'},
  {container:'JJX-2047',series:'JJX',time:'20:34',route:'Chauffeurswissel',status:'Controle'},
  {container:'JJX-7334',series:'JJX',time:'20:34',route:'Verplaatsing opslagvak',status:'Wacht'},
  {container:'JJX-1907',series:'JJX',time:'19:07',route:'Retourzending',status:'Afgerond'},
  {container:'RDX-2034',series:'RDX',time:'20:34',route:'Reguliere overslag',status:'Controle'},
  {container:'MBX-2034',series:'MBX',time:'20:34',route:'Oude route',status:'Geannuleerd'}
];

function JohnnyContainerPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [container,setContainer]=useState('');
  const finalSubmit=e=>{e.preventDefault();submitAnswer('NIEUWE_CONTAINER',{container});};
  return <section className="panel container-puzzle">
    <div className="section-label">FASE 6 · GEWIJZIGDE ZENDING</div>
    <h2>Waar is De Zwarte Lotus naartoe verplaatst?</h2>
    <p>Onderzoek het containerregister en vergelijk de registraties met jullie bevindingen. Bepaal welke container bij de gewijzigde zending hoort.</p>
    <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Reeks</th><th>Wijziging</th><th>Registratie</th><th>Status</th></tr></thead><tbody>{johnnyRows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.series}</td><td>{r.time}</td><td>{r.route}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    <div className="manifest-count">8 containers in het register</div>
    <form className="final-confirm" onSubmit={finalSubmit}>
      <span>CONCLUSIE</span><h3>Welk containernummer hoort bij de gewijzigde zending?</h3>
      <label>Containernummer<input value={container} onChange={e=>setContainer(e.target.value)} autoComplete="off" placeholder="Containernummer" required/></label>
      <button className="primary" disabled={loading}>{loading?'Controleren...':'Bevestig containernummer'}</button>
    </form>
    <button className="hint-link" onClick={()=>requestHint('Hint: vergelijk de mutatietijd en transportregistratie uit het afgeschermde transportsysteem met de volledige containerlijst.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyChoice({team,loading,feedback,chooseRoute,startJohnnyOffer}) {
  const startedAt = team.johnnyOfferStartedAt ? Number(team.johnnyOfferStartedAt) : null;
  const [now,setNow] = useState(Date.now());
  const [audioStarted,setAudioStarted] = useState(false);
  const [audioError,setAudioError] = useState(false);
  const [choiceSubmitted,setChoiceSubmitted] = useState(false);
  useEffect(()=>{
    if(!startedAt)return;
    const id=setInterval(()=>setNow(Date.now()),200);
    return ()=>clearInterval(id);
  },[startedAt]);
  const seconds=startedAt ? Math.max(0,Math.ceil((startedAt+30000-now)/1000)) : 30;
  const expired=!!startedAt && seconds===0;
  const choose = async(route)=>{
    if(!startedAt || expired || choiceSubmitted || loading)return;
    setChoiceSubmitted(true);
    await chooseRoute(route);
    setChoiceSubmitted(false);
  };
  return <section className="panel cinematic johnny-choice johnny-transmission">
    <div className="section-label">VERSLEUTELDE VERBINDING · J.J.</div>
    <h2>Johnny Jatwerk neemt contact op.</h2>
    <div className={`johnny-film ${audioStarted&&!startedAt?'speaking':''}`}>
      <img src="/assets/story/johnny-jatwerk-offer.png" alt="Johnny Jatwerk in een duistere videoverbinding" />
      <div className="johnny-film-grain" aria-hidden="true" />
      <div className="johnny-film-line" aria-hidden="true" />
      <div className="johnny-film-badge"><span className="red-dot"/> LIVE VERBINDING · J.J.</div>
    </div>
    {!startedAt ? <div className="johnny-audio-briefing">
      <strong>Vertrouwelijk audiobericht</strong>
      <audio controls autoPlay preload="metadata" src="/assets/story/johnny-jatwerk-offer.mp3"
        onPlay={()=>{setAudioStarted(true);setAudioError(false);}}
        onPause={()=>setAudioStarted(false)}
        onEnded={()=>{setAudioStarted(false);startJohnnyOffer();}}
        onError={()=>{setAudioStarted(false);setAudioError(true);}} />
      <p>Luister naar Johnny. De tekst en de keuze verschijnen pas na het volledige bericht.</p>
      {audioError&&<p className="feedback">De opname kan niet worden afgespeeld. Controleer de verbinding.</p>}
    </div> : <>
      <div className="johnny-message johnny-offer-transcript">
        <p>Oké, jullie dachten mij te pakken. Leuk geprobeerd.</p>
        <p>Jullie hebben twee opties. Of ik verplaats alles opnieuw, en dan zijn jullie mij en De Zwarte Lotus kwijt. Of jullie laten de overdracht doorgaan.</p>
        <p>De Zwarte Lotus is verkocht voor <strong>€ 37.000.000</strong>. Ik bied jullie <strong>30 procent</strong>: <strong>€ 11.100.000</strong>.</p>
        <p>Jullie hebben dertig seconden. Werken jullie met mij samen, of lichten jullie nog wat andere sukkeltjes met blauwe petjes in? Dan zien jullie mij en De Zwarte Lotus nooit meer terug.</p>
      </div>
      <div className={`choice-timer ${seconds<=10?'urgent':''}`} role="timer" aria-label={`Nog ${seconds} seconden`}>
        <span>TIJD OVER</span><strong>{String(seconds).padStart(2,'0')}</strong>
      </div>
      <div className="choice-grid"><button className="choice-card criminal" disabled={loading||choiceSubmitted||expired} onClick={()=>choose('Johnny')}><span>OPTIE 1</span><strong>Werk samen met Jatwerk</strong><small>Laat de overdracht doorgaan en volg Johnny naar de kluis.</small></button><button className="choice-card police" disabled={loading||choiceSubmitted||expired} onClick={()=>choose('Politie')}><span>OPTIE 2</span><strong>Licht de politie in</strong><small>Waarschuw de mede-agenten en bereid een inval voor.</small></button></div>
      {expired&&<div className="feedback">De 30 seconden zijn voorbij. Vraag de spelbegeleider om deze testfase opnieuw te starten.</div>}
    </>}
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyRouteIntro({loading,feedback,submitAnswer}) {
  return <section className="panel cinematic johnny-route-panel">
    <div className="success-seal">SAMENWERKING ACTIEF</div>
    <div className="section-label">VERSLEUTELD BERICHT · J.J.</div>
    <h2>Laadperron 9.</h2>
    <div className="johnny-message">
      <p>“Luister goed, stelletje amateurs.</p>
      <p>De kluis staat bij <strong>Laadperron 9</strong>.</p>
      <p>En voordat jullie het vragen: nee, ik ga jullie die kluiscode niet geven. Denken jullie dat ik gek ben? Als ik die code via dit kanaal verstuur, kan iedere idioot hem onderscheppen.</p>
      <p>Maar goed… jullie hebben me tot nu toe weten te vinden. Dus zó dom zijn jullie blijkbaar ook weer niet.</p>
      <p>Alle informatie die jullie nodig hebben, hebben jullie al in handen.</p>
      <p>Als jullie echt zulke geweldige rechercheurs zijn, moet het openen van één lullige kluis toch geen probleem zijn?</p>
      <p><strong>Succes, slimmeriken. En laat me niet wachten.</strong>”</p>
    </div>
    <div className="coordinate-card"><span>BESTEMMING</span><strong>LAADPERRON 9</strong><small>Beveiligde digitale kluis</small></div>
    <button className="primary" disabled={loading} onClick={()=>submitAnswer('JOHNNY_ROUTE','locatie bereikt')}>{loading?'Verbinding maken...':'Open het kluissysteem'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function SafePuzzle({loading,feedback,submitAnswer,requestHint,checkStep}) {
  const [showVault,setShowVault]=useState(false);
  const [safeCode,setSafeCode]=useState('');
  const [safeState,setSafeState]=useState('closed');
  const [unlocking,setUnlocking]=useState(false);
  const [local,setLocal]=useState('');
  const keypad = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];
  const addKey=(key)=>{
    if (unlocking || safeState==='open') return;
    if (key==='C') setSafeCode('');
    else if (key==='⌫') setSafeCode(v=>v.slice(0,-1));
    else setSafeCode(v=>(v+key).slice(0,6));
    if (safeState==='error') setSafeState('closed');
    setLocal('');
  };
  const unlockSafe=async(e)=>{
    if(e) e.preventDefault();
    if(unlocking || safeState==='open' || safeCode.length!==6) return;
    setUnlocking(true);
    const correct=await checkStep('KLUIS','code',safeCode);
    if(!correct){
      setSafeState('error');
      setSafeCode('');
      setUnlocking(false);
      return;
    }
    setSafeState('opening');
    setLocal('TOEGANG VERLEEND');
    window.setTimeout(()=>{setSafeState('open');setUnlocking(false);},1150);
  };
  const continueAfterOpen=()=>submitAnswer('KLUIS','203409');
  return <>
    <section className="panel safe-panel cinematic safe-riddle-home">
      <div className="section-label">JOHNNY-ROUTE · LAADPERRON 9</div>
      <h2>Drie vragen. Eén kluis.</h2>
      <p>Johnny heeft de kluiscode niet verstuurd. Gebruik jullie onderzoeksgegevens om de zes cijfers te achterhalen.</p>
      <div className="safe-riddle-list">
        <article className="safe-riddle-question">
          <span>VRAAG A</span>
          <h3>Wat delen de twee beslissende tijdstippen?</h3>
          <p>Het hoofdalarm en Johnny’s routewijziging liggen zeventien minuten uit elkaar. Toch beginnen beide tijdstippen met dezelfde twee cijfers. Welke?</p>
        </article>
        <article className="safe-riddle-question">
          <span>VRAAG B</span>
          <h3>Wanneer stierf het oude plan?</h3>
          <p>Het hoofdalarm klonk om 20:17. Het oorspronkelijke dock was 17. Tel dat aantal minuten bij het alarm op. Neem alleen de minuten van de nieuwe tijd.</p>
        </article>
        <article className="safe-riddle-question">
          <span>VRAAG C</span>
          <h3>Waar eindigt het transport?</h3>
          <p>Niet bij de pier. Niet bij de terminal. Gebruik het nummer van het laadperron dat Johnny jullie doorgaf, geschreven als twee cijfers.</p>
        </article>
      </div>
      <button className="safe-enter-arrow" type="button" onClick={()=>setShowVault(true)}>
        <span className="safe-enter-symbol" aria-hidden="true">→</span>
        <span><strong>Bekijk de kluis</strong><small>Ga naar het digitale kluissysteem</small></span>
      </button>
      <button className="hint-link" onClick={()=>requestHint('Hint: de drie vragen leveren elk een paar cijfers op. Gebruik je bevindingen uit het onderzoek.')}>Hint aanvragen</button>
      {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
    </section>
    {showVault&&<div className="fullscreen-safe-screen" role="dialog" aria-modal="true" aria-label="Digitale kluis Laadperron 9">
      <div className="fullscreen-safe-head">
        {safeState!=='open'&&<button className="safe-back-button" type="button" onClick={()=>setShowVault(false)}>← Terug naar de vragen</button>}
        <span>LAADPERRON 9 · BEVEILIGDE KLUIS</span>
      </div>
      <div className="fullscreen-safe-content">
        <div className={`vault giant-vault ${safeState}`}>
          <div className="vault-frame">
            <div className="vault-interior vault-interior-photo">
              <img
                className="vault-revealed-scene"
                src="/assets/zwarte-lotus-kluis-binnenkant.jpg"
                alt="Een levensechte diepzwarte diamant op fluwelen kussen in een verlichte, luxe stalen kluis."
                draggable="false"
              />
              <div className="vault-reveal-caption" aria-live="polite">
                <strong>DE ZWARTE LOTUS</strong>
                <span>OBJECT GELOKALISEERD</span>
              </div>
            </div>
            <div className="vault-door">
              <div className="vault-door-edge" aria-hidden="true"></div>
              <div className="vault-door-inner-groove" aria-hidden="true"></div>
              <div className="vault-hinges" aria-hidden="true"><span></span><span></span><span></span></div>
              <div className="vault-steel-rivets" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div className="vault-engraving"><span>BEAUMONT</span><small>VAULT SYSTEMS · PORT 09</small></div>
              <div className="vault-wheel" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
              <div className="vault-bars" aria-hidden="true"><i></i><i></i><i></i></div>
              <div className="vault-status-panel"><span className="vault-status-led" aria-hidden="true"></span><span className="vault-status-word">{safeState==='opening'?'ONTGRENDELEN':safeState==='error'?'TOEGANG GEWEIGERD':'VERGRENDELD'}</span></div>
              <div className="vault-keypad">BEAUMONT · SECURE</div>
            </div>
          </div>
        </div>
        {safeState!=='open'?<div className="vault-entry-console">
          <span className="vault-console-label">TOEGANGSCODE · 6 CIJFERS</span>
          <div className="vault-code-screen" aria-label={`${safeCode.length} van 6 cijfers ingevoerd`}>
            {Array.from({length:6},(_,i)=><span key={i} className={safeCode[i]?'filled':''}>{safeCode[i] || '–'}</span>)}
          </div>
          <div className="vault-dial-pad">
            {keypad.map(k=><button key={k} type="button" aria-label={k==='⌫'?'Wis laatste cijfer':k==='C'?'Wis code':`Cijfer ${k}`} disabled={unlocking} onClick={()=>addKey(k)}>{k}</button>)}
          </div>
          <button className="vault-enter-key" type="button" disabled={unlocking || safeCode.length!==6} onClick={unlockSafe}>{unlocking?'ONTGRENDELEN...':'ENTER ↵'}</button>
          {safeState==='error'&&<span className="vault-code-error">TOEGANG GEWEIGERD · +1 MINUUT</span>}
          {local&&<span className="vault-code-success">{local}</span>}
        </div>:<div className="vault-entry-console vault-unlocked-console">
          <span className="vault-code-success">TOEGANG VERLEEND</span>
          <h2>De kluis is open.</h2>
          <p>De Zwarte Lotus en de vertrouwelijke stukken zijn gevonden.</p>
          <button className="vault-enter-key" type="button" disabled={loading} onClick={continueAfterOpen}>{loading?'Laden...':'Bekijk de inhoud →'}</button>
        </div>}
      </div>
      {feedback&&<div className="vault-screen-feedback" aria-live="polite">{feedback}</div>}
    </div>}
  </>;
}

function JohnnyPaper() {
  return <div className="johnny-location-paper">
    <div className="paper-redline">J.J. · privé / NIET VERZENDEN</div>
    <p>Na de overslag blijf ik bij de <u>chauffeurskeet achter Laadperron 9</u>.</p>
    <p>Gele deur. Niet via de voorkant van de loods.</p>
    <div className="paper-signature">— Johnny</div>
  </div>;
}
function LotusFound({loading,feedback,submitAnswer}) {
  return <section className="panel cinematic lotus-found">
    <div className="success-seal">KLUIS OPEN</div>
    <div className="section-label">DE ZWARTE LOTUS IS GEVONDEN · BEWIJSPAGINA</div>
    <h2>Er liggen twee stukken in de kluis.</h2>
    <p>Bekijk de stukken nauwkeurig en noteer de gegevens die jullie nodig hebben. Na het verlaten van deze pagina komen jullie bij een afzonderlijk beveiligd politiekanaal.</p>
    <figure className="johnny-scribble-evidence"><img src="/assets/story/johnny-handgeschreven-kladje.png" alt="Johnnys handgeschreven kladje met koperskanaal en twee codewoorden"/><figcaption>Kladje over de koper · gevonden bij De Zwarte Lotus</figcaption></figure>
    <JohnnyPaper/>
    <div className="mission-card"><span>BEWIJS VERZAMELD</span><strong>Controleer de stukken en leg jullie bevindingen vast.</strong></div>
    <button className="primary" disabled={loading} onClick={()=>submitAnswer('LOTUS_GEVONDEN','bewijs bekeken')}>{loading?'Verwerken...':'Ga naar het politiekanaal →'}</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyInspectorReport({loading,feedback,submitAnswer}) {
  const [location,setLocation]=useState('');
  const [policeCode,setPoliceCode]=useState('');
  return <section className="panel cinematic inspector-report-page">
    <div className="section-label">VERTROUWELIJK POLITIEKANAAL · CODE B</div>
    <h2>Waar zit Johnny?</h2>
    <div className="inspector-code-intro inspector-final-briefing">
      <div className="final-inspector-portrait"><img src="/assets/inspector-kist.jpg" alt="De inspecteur uit de openingsbriefing"/></div>
      <div className="final-inspector-message"><span>BERICHT VAN DE INSPECTEUR</span><h3>Geef de locatie door.</h3><p>“Niets naar die koper sturen over Johnny. Zoek die chauffeur eerst. Geef mij zijn locatie en haal <strong>Operatiedossier B</strong> bij me op. Dan kunnen mijn mensen hem aanhouden!”</p></div>
    </div>
    <form className="operation-step" onSubmit={e=>{e.preventDefault();submitAnswer('JOHNNY_MELDEN',{location,policeCode})}}>
      <label>Waar bevindt Johnny Jatwerk zich?<input value={location} onChange={e=>setLocation(e.target.value)} required placeholder="Vul jullie bevinding in" autoComplete="off"/></label>
      <label>Code B van de inspecteur<input value={policeCode} onChange={e=>setPoliceCode(e.target.value)} required placeholder="Code uit Operatiedossier B" autoComplete="off"/></label>
      <button className="primary" disabled={loading}>{loading?'Controleren...':'Stuur locatie naar de inspecteur'}</button>
    </form>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

const johnnyArrestSteps = [
  {at:0,label:'Eenheden zoeken',title:'Zoekactie rond Laadperron 9',text:'De inspecteur stuurt de eenheden naar de laadzone. Johnny is niet direct in beeld.'},
  {at:2800,label:'Geen visueel contact',title:'De keet lijkt leeg',text:'De zoekteams volgen het dienstpad achter de loods en proberen hem te lokaliseren.'},
  {at:5700,label:'Dreiging',title:'Verdachte gesignaleerd',text:'Bij de gele deur ontstaat onrust. De agenten houden afstand en nemen dekking.'},
  {at:9000,label:'Aanhouding',title:'Johnny Jatwerk is aangehouden',text:'De agenten krijgen de situatie onder controle. Johnny wordt geboeid en afgevoerd.'}
];

function JohnnyArrestOperation({team,loading,feedback,submitAnswer}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t);},[]);
  const elapsed=Math.max(0,now-Number(team.johnnyArrestStartedAt||now));
  return <section className="panel cinematic arrest-scene">
    <div className="section-label">LIVE OPERATIE · JOHNNY JATWERK</div>
    <h2>{elapsed<9000?'De eenheden zitten Johnny op de hielen…':'Johnny Jatwerk is aangehouden.'}</h2>
    <div className="final-inspector-dispatch"><img src="/assets/inspector-kist.jpg" alt="De inspecteur uit fase 1"/><div><span>BERICHT VAN DE INSPECTEUR</span><strong>{elapsed<9000?'Teams zijn ter plaatse. Blijf op de lijn.':'Johnny zit vast. Richt jullie nu op de koper.'}</strong></div></div>
    <LiveOperationFeed title="OPERATIE B · JOHNNY" image="/assets/story/johnny-arrestatie.jpg" alt="Politieactie bij de chauffeurskeet" steps={johnnyArrestSteps} elapsed={elapsed} person="Johnny Jatwerk"/>
    {elapsed>=9000&&<button className="primary" disabled={loading} onClick={()=>submitAnswer('JOHNNY_ARRESTATIE','volgende')}>Ga naar het beveiligde koperskanaal →</button>}
    {feedback&&<div className="feedback">{feedback}</div>}
  </section>;
}

function JohnnyFinalOperation({team,loading,feedback,sendBuyerChat}) {
  const chat=team.buyerChat || {stage:'codeword1',messages:[{from:'Victor Valmont',text:'V.V.-37. Codewoord 1?'}]};
  const [value,setValue]=useState('');
  const [time,setTime]=useState('23:10');
  useEffect(()=>{setValue('');},[chat.stage]);
  const submit=async(e)=>{e.preventDefault();if(await sendBuyerChat(chat.stage,value,time))setValue('');};
  return <section className="panel cinematic final-operation">
    <div className="section-label">BEVEILIGD KOPERSKANAAL · V.V.-37</div>
    <h2>Contact met Victor Valmont</h2>
    <p className="secure-chat-intro">De politie heeft de locatie van Johnny bevestigd. Communiceer nu uitsluitend met Victor. Laat niet blijken dat Johnny is opgepakt.</p>
    <div className="secure-chat new-buyer-chat">
      <div className="chat-head"><span>VERSLEUTELDE CHAT</span><strong>V.V.-37</strong><small>Verbinding beveiligd</small></div>
      <div className="chat-log" aria-live="polite">{(chat.messages||[]).map((m,i)=><div key={i} className={`chat-row ${m.from==='Team'?'outgoing':'incoming'}`}><span>{m.from}</span><p>{m.text}</p></div>)}</div>
    </div>
    <form className="operation-step buyer-chat-compose" onSubmit={submit}>
      <span>{chat.stage==='codeword1'?'CODEWOORD 1':chat.stage==='codeword2'?'CODEWOORD 2':'AFSPRAAK'}</span>
      {chat.stage==='location'?<>
        <label>Locatie voor de overdracht<input maxLength={180} value={value} onChange={e=>setValue(e.target.value)} required placeholder="Kies een ontmoetingsplek"/></label>
        <label>Tijdstip<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label>
      </>:<label>Geheim codewoord<input value={value} onChange={e=>setValue(e.target.value)} autoComplete="off" required placeholder="Voer het codewoord in"/></label>}
      <button className="primary" disabled={loading}>{loading?'Verwerken...':'Verstuur beveiligd bericht'}</button>
    </form>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function BuyerFinalChoice({team,loading,feedback,chooseFinal,syncFinal}) {
  const [choice,setChoice]=useState('');
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t);},[]);
  const remaining=Math.max(0,180-Math.floor((now-Number(team.finalDecisionStartedAt||now))/1000));
  useEffect(()=>{if(remaining===0)syncFinal();},[remaining===0]);
  return <section className="panel cinematic lotus-found">
    <div className="section-label">LAATSTE KEUZE · VICTOR VALMONT</div>
    <h2>De koper heeft jullie afspraak bevestigd.</h2>
    <p>Johnny zit vast. Victor komt naar <strong>{team.buyerChat?.location}</strong> om <strong>{team.buyerChat?.meetingTime}</strong> met het geld. Wat doen jullie met Victor?</p>
    <div className="final-decision-clock" role="timer"><span>TIJD OM TE KIEZEN</span><strong>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</strong><small>Na drie minuten kiest het systeem automatisch voor arrestatie.</small></div>
    <div className="choice-grid final-choice-grid">
      <button className={`choice-card police ${choice==='VAL'?'selected':''}`} onClick={()=>setChoice('VAL')} disabled={!remaining}><span>OPTIE 1</span><strong>Laat Victor arresteren</strong><small>Waarschuw de inspecteur. De koper loopt de val in; het geld wordt als bewijs veiliggesteld.</small></button>
      <button className={`choice-card criminal ${choice==='GELD'?'selected':''}`} onClick={()=>setChoice('GELD')} disabled={!remaining}><span>OPTIE 2</span><strong>Hou het geld zelf</strong><small>Laat Victor ontkomen en neem het geld. Het team kiest voor een criminele afloop.</small></button>
    </div>
    <button className="primary" disabled={loading||!choice||!remaining} onClick={()=>chooseFinal(choice)}>{loading?'Verwerken...':'Bevestig definitieve keuze'}</button>
    {feedback&&<div className="feedback">{feedback}</div>}
  </section>;
}

function LiveOperationFeed({title, image, alt, steps, elapsed, compact=false, person='', outcome='arrest'}) {
  const [soundEnabled,setSoundEnabled]=useState(false);
  const currentIndex = steps.reduce((acc, step, index) => elapsed >= step.at ? index : acc, 0);
  const current = steps[currentIndex];
  const isFinal = currentIndex === steps.length-1;
  const soundRef = React.useRef(null);
  const previousSoundStage = React.useRef(-1);

  const playSignal = (isSiren=false) => {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      const ctx = soundRef.current || new Context();
      soundRef.current = ctx;
      if(ctx.state==='suspended') ctx.resume();
      const start=ctx.currentTime;
      const tones=isSiren?[540,680,540,680]:[640,780];
      tones.forEach((frequency,i)=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(frequency,start+i*.22);
        gain.gain.setValueAtTime(.0001,start+i*.22);
        gain.gain.exponentialRampToValueAtTime(.035,start+i*.22+.025);
        gain.gain.exponentialRampToValueAtTime(.0001,start+i*.22+.19);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start+i*.22);
        osc.stop(start+i*.22+.2);
      });
    } catch {}
  };
  useEffect(()=>{
    if(!soundEnabled){previousSoundStage.current=currentIndex;return;}
    if(previousSoundStage.current!==currentIndex){
      previousSoundStage.current=currentIndex;
      playSignal(currentIndex===2);
    }
  },[currentIndex,soundEnabled]);

  return <div className={`operation-live-feed ${compact?'compact':''}`}>
    <div className={`operation-live-visual stage-${currentIndex}`}>
      <img src={image} alt={alt} />
      <div className="operation-live-overlay"></div>
      <div className="operation-live-noise"></div>
      <div className="operation-live-blue-red" aria-hidden="true"></div>
      <div className="operation-live-head">
        <span className="live-dot"></span><strong>LIVE OPERATIE</strong><small>{title}</small>
        <button className="live-sound-toggle" type="button" onClick={()=>{
          if (!soundEnabled) playSignal(true);
          setSoundEnabled(!soundEnabled);
        }}>{soundEnabled?'Geluid aan · uitschakelen':'Geluid inschakelen'}</button>
      </div>
      <div className="operation-live-timecode" aria-hidden="true">CAM 09 · REC <span>{String(Math.floor(elapsed/1000)).padStart(2,'0')}s</span></div>
      {currentIndex===2&&<div className="operation-live-alert" aria-hidden="true">⚠ VERBINDING ONSTABIEL · EENHEDEN IN POSITIE</div>}
      <div className="operation-live-status"><span>{current.label}</span><strong>{current.title}</strong><p>{current.text}</p></div>
      {isFinal&&person&&<div className={`operation-arrest-badge ${outcome==='escaped'?'escaped':''}`} role="status">
        <span>{outcome==='escaped'?'!':'✓'}</span>
        <div><small>{person.toUpperCase()}</small><strong>{outcome==='escaped'?'NIET AANGEHOUDEN':'AANGEHOUDEN'}</strong></div>
      </div>}
    </div>
    <div className="operation-live-timeline">
      {steps.map((step, index)=><article key={index} className={index<=currentIndex?'active':''}><span>{String(index+1).padStart(2,'0')}</span><strong>{step.title}</strong><small>{step.label}</small></article>)}
    </div>
    {isFinal&&person&&<section className={`capture-confirmation ${outcome==='escaped'?'failed':''}`}>
      <div className="capture-confirmation-symbol">{outcome==='escaped'?'!':'✓'}</div>
      <div><small>POLITIEKANAAL · STATUSBEVESTIGING</small><h3>{person} {outcome==='escaped'?'is ontkomen':'is aangehouden'}</h3><p>{outcome==='escaped'?'De koper is niet onderschept. De inspecteur registreert dit als een onvolledige operatie.':'Identiteit bevestigd. De verdachte is overgedragen aan de politie-eenheden.'}</p></div>
    </section>}
  </div>;
}

function JohnnyResult({team}) {
  const keptMoney=team.finalChoice==='GELD';
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[]);
  const elapsed=Math.max(0,now-Number(team.arrestStartedAt||now));
  const victorArrestSteps=[
    {at:0,label:'Politie in positie',title:'Agenten wachten op Victor',text:`De teams houden de omgeving van ${team.buyerChat?.location||'de overdrachtslocatie'} in de gaten.`},
    {at:3000,label:'Geen contact',title:'De koper is nog niet te zien',text:'De afgesproken plek blijft leeg. De inspecteur vraagt de eenheden hun posities te behouden.'},
    {at:6500,label:'Verdachte in beeld',title:'Victor wordt gesignaleerd',text:'Een observant herkent de zwarte handschoen. Victor nadert de overdrachtslocatie.'},
    {at:10300,label:'Aanhouding bevestigd',title:'Victor Valmont is aangehouden',text:'Politie-eenheden grijpen in. Victor wordt overgebracht naar het bureau en het geld wordt veiliggesteld.'}
  ];
  const victorEscapeSteps=[
    {at:0,label:'Geen politieactie',title:'De overdracht wordt voorbereid',text:'Het rechercheteam kiest ervoor Victor niet te laten oppakken.'},
    {at:3000,label:'Victor gearriveerd',title:'De koper verschijnt',text:'De overdracht verloopt via het afgesproken kanaal.'},
    {at:6500,label:'Afleiding',title:'Het geld wisselt van eigenaar',text:'Victor merkt niet dat het rechercheteam zijn eigen plan trekt.'},
    {at:10300,label:'Niet aangehouden',title:'Victor Valmont ontkomt',text:'De koper verdwijnt. Het team houdt het geld voor zichzelf.'}
  ];
  const complete=elapsed>=10300;
  return <section className="panel cinematic case-result arrest-scene">
    <div className="section-label">DE ZWARTE LOTUS · EINDOPERATIE VICTOR</div>
    <h2>{!complete?(keptMoney?'De overdracht wordt uitgevoerd…':'De politie wacht op Victor…'):(keptMoney?'Victor is ontsnapt.':'Operatie geslaagd.')}</h2>
    <div className="final-inspector-dispatch"><img src="/assets/inspector-kist.jpg" alt="Dezelfde inspecteur als bij de startbriefing"/><div><span>BERICHT VAN DE INSPECTEUR</span><strong>{complete?(keptMoney?'Johnny zit vast, maar Victor is niet aangehouden.':'Johnny zat al vast. Victor is nu ook aangehouden.'):'Johnny is al aangehouden. Deze operatie gaat uitsluitend over Victor Valmont.'}</strong></div></div>
    <LiveOperationFeed title="OPERATIE KOPER · VICTOR" image={keptMoney?'/assets/zwarte-lotus-login-background.jpg':'/assets/story/victor-operatie.jpg'} alt="Operatie bij de overdrachtslocatie van Victor Valmont" steps={keptMoney?victorEscapeSteps:victorArrestSteps} elapsed={elapsed} person="Victor Valmont" outcome={keptMoney?'escaped':'arrest'} />
    {complete&&<div className="arrest-result-reveal">
      <div className="success-seal">{keptMoney?'DUBBELE AGENDA':'MISSIE VOLTOOID'}</div>
      <p>{keptMoney?`Bij ${team.buyerChat?.location||'de overdracht'} hebben jullie het geld zelf gehouden en Victor laten gaan. Johnny zit vast, maar Victor niet.`:`Victor is bij ${team.buyerChat?.location||'de overdracht'} om ${team.buyerChat?.meetingTime||'het afgesproken tijdstip'} aangehouden. Johnny zat al vast.`}</p>
      <div className="result-grid">
        <article><span>JOHNNY JATWERK</span><strong>Eerder aangehouden</strong></article>
        <article><span>VICTOR VALMONT</span><strong>{keptMoney?'Ontkomen':'Aangehouden'}</strong></article>
        <article><span>DE ZWARTE LOTUS</span><strong>Veiliggesteld</strong></article>
        <article><span>GELD</span><strong>{keptMoney?'Zelf gehouden':'Bewijs politie'}</strong></article>
      </div>
      <div className="case-stamp">{keptMoney?'EINDE · VERTROUWELIJK':'ZAAK GESLOTEN'}</div>
    </div>}
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

createRoot(document.getElementById('root')).render(<Root/>);
