import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Alle API-verzoeken naar de game en het dashboard hebben een eigen sessietoken.
function apiFetch(url,options={}) {
  const token=localStorage.getItem(url.includes('/api/teams/')?'lotus_team_token':'lotus_staff_token');
  return fetch(url,{...options,headers:{...(options.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})}});
}
function formatDuration(seconds) {
  const s=Math.max(0,Math.floor(Number(seconds)||0));
  return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function localTime(value) {return value?new Date(value).toLocaleString('nl-NL'):'—';}

const phases = ['START','ALARM','DOSSIER','ORIGINELE_CONTAINER','ORIGINELE_CONTAINER_BEVESTIGEN','ROTJE_KNOR','JOHNNY_ONTMASKERD','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','JOHNNY_MELDEN','JOHNNY_ARRESTATIE','EINDOPERATIE','KOPER_KEUZE','RESULTAAT'];

const policePhases = [...phases.slice(0,phases.indexOf('JOHNNY_ROUTE')), 'POLITIE_BRIEFING', ...phases.slice(phases.indexOf('JOHNNY_ROUTE'))];


const phaseLabels = {
  START: 'Introductie', ALARM: 'Toegangscode', CAMERA: 'Toegangscode', KIST_OPEN: 'Toegangscode', DOSSIER: 'Verdachtenonderzoek',
  ORIGINELE_CONTAINER: 'Transportonderzoek', ORIGINELE_CONTAINER_BEVESTIGEN: 'Container bevestigen', ROTJE_KNOR: 'Nieuw spoor', JOHNNY_ONTMASKERD: 'Johnny ontmaskerd', NIEUWE_CONTAINER: 'Nieuwe container', KEUZE: 'Keuze', JOHNNY_ROUTE: 'Naar de kluis', KLUIS: 'Kluiscode', LOTUS_GEVONDEN: 'Bewijs uit de kluis', JOHNNY_MELDEN: 'Inspecteur · Code B', JOHNNY_ARRESTATIE: 'Aanhouding Johnny', EINDOPERATIE: 'Koperskanaal', KOPER_KEUZE:'Laatste keuze', RESULTAAT: 'Zaak afgerond',
  POLITIE_BRIEFING:'Inspecteur · Infiltratieopdracht'
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
    apiFetch(`${API}/api/infiltrant/verify?code=${encodeURIComponent(accessCode)}`)
      .then(async r=>({ok:r.ok,body:await r.json().catch(()=>({}))}))
      .then(({ok})=>{if(active)setVerified(ok);})
      .catch(()=>{if(active)setVerified(false);});
    return()=>{active=false};
  },[accessCode]);

  const sendCamera=async(e)=>{
    e.preventDefault(); setSending(true); setStatus('');
    try{
      const r=await apiFetch(`${API}/api/infiltrant/send-camera`,{
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
      <div className="section-label">GEZAMENLIJK ONDERZOEKSTEAM</div>
      <h1>De informant stuurt je een bericht</h1>
      <p className="infiltrant-copy">Speel het bericht volledig af. Reageer pas wanneer de verbinding daarom vraagt.</p>
      <audio className="audio-player infiltrant-audio" controls preload="metadata" src="/assets/story/infiltrant-kees-zoek.mp3" onEnded={()=>setBriefingDone(true)} />
      {!briefingDone&&<div className="infiltrant-locked"><span>BERICHT NOG NIET VOLLEDIG AFGELUISTERD</span></div>}
      {briefingDone&&status!=='VERZONDEN'&&<form className="infiltrant-mail-form" onSubmit={sendCamera}>
        <div><span>BEVEILIGDE OVERDRACHT</span><h2>Waar moeten de bestanden naartoe?</h2><p>Vul één e-mailadres in. De bron stuurt het cameramateriaal direct door.</p></div>
        <label>E-mailadres<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>
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
    apiFetch(`${API}/api/rotje/verify?code=${encodeURIComponent(accessCode)}`)
      .then(r=>{if(active)setVerified(r.ok);})
      .catch(()=>{if(active)setVerified(false);});
    return()=>{active=false};
  },[accessCode]);
  if(verified===null) return <main className="infiltrant-page"><section className="infiltrant-card"><h1>Verbinding controleren…</h1></section></main>;
  if(!verified) return <main className="infiltrant-page denied"><section className="infiltrant-card"><div className="section-label">TOEGANG GEWEIGERD</div><h1>Onbekend contactkanaal</h1><p>De dossierverwijzing is niet geldig.</p></section></main>;
  return <main className="infiltrant-page rotje-secret-page"><section className="infiltrant-card">
    <div className="infiltrant-status"><span></span> VERTROUWELIJKE VERBINDING</div>
    <div className="section-label">VERTROUWELIJK · RECHERCHETEAM</div>
    <h1>Een bericht van Rotje Knor</h1>
    <p className="infiltrant-copy">Luister de volledige opname af. Bespreek de informatie daarna met je team.</p>
    <audio className="audio-player infiltrant-audio" controls preload="metadata" src="/assets/story/rotje-knor.mp3" onEnded={()=>setCompleted(true)} />
    {!completed?<div className="infiltrant-locked"><span>VOLLEDIG AFSPELEN OM HET BERICHT TE BEVESTIGEN</span></div>:
      <div className="rotje-proof"><span>VERTROUWELIJKE TOEGANGSCODE</span><h2>Toegang tot de transportadministratie</h2><strong>RK-7318</strong><p>Gebruik deze autorisatiecode om het beveiligde transportsysteem te openen. Raadpleeg daar het containerregister.</p><a className="primary transport-contact-link" href="#/transport-systeem" target="_blank" rel="noopener noreferrer">Open transportsysteem</a></div>}
  </section></main>;
}

const johnnyRows = [
  {container:'JJX-1841',series:'JJX',time:'18:41',route:'Reguliere afvoer',status:'Actief'},
  {container:'JJX-2034',series:'JJX',time:'20:38',route:'Ongeplande overslag',status:'Actief'},
  {container:'JJX-2134',series:'JJX',time:'21:34',route:'Wacht op vrijgave',status:'Actief'},
  {container:'JJX-2047',series:'JJX',time:'20:38',route:'Chauffeurswissel',status:'Actief'},
  {container:'JJX-7334',series:'JJX',time:'20:38',route:'Verplaatsing opslagvak',status:'Actief'},
  {container:'JJX-1907',series:'JJX',time:'19:07',route:'Retourzending',status:'Afgerond'},
  {container:'RDX-2034',series:'RDX',time:'20:38',route:'Reguliere overslag',status:'Actief'},
  {container:'MBX-2034',series:'MBX',time:'20:38',route:'Oude route',status:'Geannuleerd'},
  {container:'JJX-2088',series:'JJX',time:'20:38',route:'Extra transportorder',status:'Actief'},
  {container:'JJX-2147',series:'JJX',time:'21:47',route:'Ongeplande overslag',status:'Actief'},
  {container:'RDX-2041',series:'RDX',time:'20:38',route:'Ongeplande overslag',status:'Actief'},
  {container:'JJX-2234',series:'JJX',time:'22:34',route:'Spoedmutatie',status:'Actief'}
];

function TransportSystemPage() {
  const [code,setCode]=useState('');
  const [record,setRecord]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const login=async(e)=>{
    e.preventDefault();setError('');setLoading(true);
    try {
      const r=await apiFetch(`${API}/api/transport-system/access`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
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
      <form onSubmit={login} className="transport-login"><label>Autorisatiecode<input autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} required /></label>
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
        <tr><th>Nieuwe containerregistratie</th><td>{record.newContainerSeries}</td></tr>
        <tr><th>Mutatie</th><td>{record.action}</td></tr>
      </tbody></table>
      <div className="transport-registry">
        <div className="transport-registry-heading"><span>BIJLAGE · CONTAINERREGISTER</span><h2>Gewijzigde zendingen in de haven</h2><p>Vergelijk de wijzigingstijd, de containerreeks en het type handeling. Niet elke registratie van 20:38 betreft een ongeplande fysieke overslag.</p></div>
        <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Reeks</th><th>Wijziging</th><th>Registratie</th><th>Status</th></tr></thead><tbody>{johnnyRows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.series}</td><td>{r.time}</td><td>{r.route}</td><td>{r.status}</td></tr>)}</tbody></table></div>
        <p className="manifest-count">{johnnyRows.length} containers in het register. Identificeer de juiste zending en geef het containernummer door in jullie lopende onderzoek.</p>
      </div>
      <p className="transport-record-foot">De bronregistratie vermeldt geen individueel containernummer. Dat bepalen jullie aan de hand van het register en jullie overige aanwijzingen.</p>
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
  useEffect(()=>{
    const id=localStorage.getItem('lotus_team_id');
    if(!id||!localStorage.getItem('lotus_team_token'))return;
    apiFetch(`${API}/api/teams/${id}/final-status`).then(r=>r.ok?r.json():null).then(j=>{if(j?.team){setTeam(j.team);setMode('game');}}).catch(()=>{});
  },[]);
  useEffect(()=>{
    if(mode!=='game'||!team)return;
    const id=setInterval(()=>{
      apiFetch(`${API}/api/teams/${team.id}/final-status`).then(r=>r.ok?r.json():null).then(j=>{if(j?.team && (j.team.currentPhase!==team.currentPhase||j.team.status!==team.status||j.team.pausedAt!==team.pausedAt))setTeam(j.team);}).catch(()=>{});
    },4000);
    return()=>clearInterval(id);
  },[mode,team?.id,team?.currentPhase,team?.status,team?.pausedAt]);


  const loginTeam = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const r = await apiFetch(`${API}/api/team-login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ teamName: form.get('teamName'), code: form.get('code') }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Inloggen mislukt');
      localStorage.setItem('lotus_team_token',j.token);localStorage.setItem('lotus_team_id',String(j.team.id));setTeam(j.team); setMode('game');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const startGame = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/start`, { method: 'POST' });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Starten mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const startCountdown = async () => {
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/timer-start`, { method:'POST' });
      const j = await r.json();
      if (r.ok) setTeam(j.team);
    } catch {}
  };

  const submitOpening = async (answers) => {
    setLoading(true); setFeedback('');
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/opening`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(answers) });
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
      const r = await apiFetch(`${API}/api/teams/${team.id}/answer`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phase, answer }) });
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
      const r=await apiFetch(`${API}/api/teams/${team.id}/check-step`,{
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
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/hint`, {
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestedHint:text})
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Hint aanvragen is mislukt.');
      setTeam(j.team);
      setFeedback('Hintverzoek verstuurd naar de spelbegeleider. Deze ziet jullie team en spelfase in het live dashboard.');
    } catch (e) {setFeedback(e.message || 'Verbinding met de spelbegeleider mislukt.');}
  };

  const startJohnnyOffer = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/johnny-offer-start`, {method:'POST'});
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Kon de keuzeperiode niet starten.');
      setTeam(j.team);
    } catch(err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const chooseRoute = async (route) => {
    setLoading(true); setFeedback('');
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/route`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ route }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Keuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const [policePenaltyShown,setPolicePenaltyShown] = useState(false);
  const infiltrateJohnny = async () => {
    setLoading(true);setFeedback('');
    try {
      const r=await apiFetch(`${API}/api/teams/${team.id}/police-infiltrate`,{method:'POST'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Overstap naar infiltratie mislukt.');
      setTeam(j.team);
      if(j.penaltySeconds===300)setPolicePenaltyShown(true);
    } catch(err) {setFeedback(err.message);} finally {setLoading(false);}
  };

  const syncFinal = async () => {
    if (!team || team.currentPhase!=='KOPER_KEUZE') return;
    try {
      const r=await apiFetch(`${API}/api/teams/${team.id}/final-status`);
      const j=await r.json();if(r.ok && j.team) setTeam(j.team);
    } catch {}
  };

  const sendBuyerChat = async (action,value='',time='') => {
    setLoading(true);setFeedback('');
    try {
      const r=await apiFetch(`${API}/api/teams/${team.id}/buyer-chat`,{
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
      const r = await apiFetch(`${API}/api/teams/${team.id}/final-choice`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ choice }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Eindkeuze opslaan mislukt');
      setTeam(j.team);
    } catch (err) { setFeedback(err.message); } finally { setLoading(false); }
  };

  const goBackWithPenalty = async () => {
    setLoading(true); setFeedback('');
    try {
      const r = await apiFetch(`${API}/api/teams/${team.id}/go-back`, { method:'POST' });
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
    const activePhases = team.chosenRoute==='Politie'?policePhases:phases;
    const idx = Math.max(0, activePhases.indexOf(team.currentPhase));
    const canGoBack = idx > 0 && team.currentPhase!=='POLITIE_BRIEFING';
    return <main className={`scene-page phase-${String(team.currentPhase || "start").toLowerCase()}`}> 
      <div className="scene-backdrop" aria-hidden="true"></div>
      <div className="scene-vignette" aria-hidden="true"></div>
      <div className="app-shell game-shell scene-inner">
        <section className="topbar game-topbar game-topbar-refined"><div className="topbar-left"><button className="ghost" onClick={()=>{localStorage.removeItem('lotus_team_token');localStorage.removeItem('lotus_team_id');setTeam(null);setMode('login');}}>← Uitloggen</button>{canGoBack&&<button className="secondary previous-page-button" onClick={()=>setBackConfirmOpen(true)}>← Vorige pagina</button>}</div><GameCountdown timerStartedAt={team.timerStartedAt} finishedAt={team.finishedAt||team.stoppedAt} pausedAt={team.pausedAt} totalPausedMs={team.totalPausedMs||0}/><div className="eyebrow">DE ZWARTE LOTUS</div></section>
        <section className="hero compact game-case-hero"><div><span className="chip">VERTROUWELIJK ONDERZOEK</span><h1>{team.teamName}</h1><p>Spelronde: {team.eventName}</p></div><div className="progress-ring">{Math.round((idx/(activePhases.length-1))*100)}%</div></section>
        <GamePhase team={team} loading={loading} feedback={feedback} startGame={startGame} submitOpening={submitOpening} startCountdown={startCountdown} submitAnswer={submitAnswer} requestHint={requestHint} chooseRoute={chooseRoute} chooseFinal={chooseFinal} syncFinal={syncFinal} sendBuyerChat={sendBuyerChat} checkStep={checkStep} startJohnnyOffer={startJohnnyOffer} infiltrateJohnny={infiltrateJohnny}/>
        {team.editorNote && <section className="panel"><strong>Aanvullende instructie</strong><p>{team.editorNote}</p></section>}
        {(team.status==='klaar'||team.status==='gestopt') && <div className="game-finished"><h2>{team.status==='klaar'?'MISSIE VOLTOOID':'SPEL GESTOPT'}</h2><strong>{formatDuration(team.elapsedSeconds)}</strong><p>Eindtijd: {localTime(team.finishedAt||team.stoppedAt)}</p></div>}
        {team.pausedAt && <div className="game-finished"><h2>TEAM GEPAUZEERD</h2><p>De spelbegeleider hervat jullie spel.</p></div>}
        {policePenaltyShown && <div className="penalty-overlay" role="alertdialog" aria-modal="true" aria-label="Vijf minuten straftijd">
          <div className="penalty-screen">
            <div className="penalty-exclamation" aria-hidden="true">!</div>
            <div className="penalty-eyebrow">MISLUKTE POLITIEKEUZE</div>
            <h2>+5 MINUTEN</h2>
            <p>De inspecteur heeft jullie teruggestuurd. Vijf strafminuten zijn toegevoegd. Beluister nu Johnny's volledige aanbod en accepteer de samenwerking.</p>
            <button className="primary" onClick={()=>setPolicePenaltyShown(false)}>Beluister Johnny's aanbod →</button>
          </div>
        </div>}
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
        <section className="stats"><div><strong>{team.hintCount}</strong><span>Hints</span></div><div><strong>{idx+1}/{activePhases.length}</strong><span>{phaseLabels[team.currentPhase] || 'Fase'}</span></div><div><strong>{team.chosenRoute || '—'}</strong><span>Route</span></div></section>
      </div>
    </main>;
  }

  if(mode==='staff')return <StaffPortal onExit={()=>setMode('login')} />;

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
          <label>Teamnaam<input name="teamName" required/></label>
          <label>Spelcode<input name="code" autoCapitalize="characters" required/></label>
          {error&&<div className="error">{error}</div>}
          <button className="primary full login-start" disabled={loading}>{loading?'Controleren...':'Start het onderzoek'}</button>
        </form>
        <div className="security-strip"><span>●</span> Verbinding beveiligd · Maison Beaumont</div>
        <div className="divider"><span>spelbegeleider</span></div>
        <button className="secondary full" onClick={()=>setMode('staff')} disabled={loading}>Inloggen als spelbegeleider of beheerder</button>

      </section>
    </div>
  </main>;
}

function TeamPenaltyControls({team,onApply}) {
  const [choice,setChoice]=useState('1');
  const [custom,setCustom]=useState('');
  const [saving,setSaving]=useState(false);
  const minutes=choice==='custom'?Number(custom):Number(choice);
  const valid=Number.isInteger(minutes)&&minutes>=1&&minutes<=120;
  async function addPenalty(){
    if(!valid||saving)return;
    if(!window.confirm(`Voeg ${minutes} strafminuut${minutes===1?'':'en'} toe aan team ${team.teamName}?\nDe officiële eindtijd wordt aangepast.`))return;
    setSaving(true);
    try{await onApply(team,minutes);}finally{setSaving(false);}
  }
  return <div className="staff-penalty-control" aria-label={`Straftijd toevoegen voor ${team.teamName}`}>
    <label className="staff-penalty-label">Straftijd
      <select value={choice} onChange={e=>setChoice(e.target.value)} disabled={saving||!team.timerStartedAt}>
        <option value="1">1 minuut</option><option value="2">2 minuten</option><option value="5">5 minuten</option><option value="10">10 minuten</option><option value="custom">Eigen aantal…</option>
      </select>
    </label>
    {choice==='custom'&&<input className="staff-penalty-custom" type="number" min="1" max="120" step="1" placeholder="Min." value={custom} onChange={e=>setCustom(e.target.value)} disabled={saving||!team.timerStartedAt} aria-label="Eigen aantal strafminuten"/>}
    <button className="staff-penalty-add" disabled={!team.timerStartedAt||!valid||saving} onClick={addPenalty}>{saving?'Toevoegen…':'+ Straftijd'}</button>
  </div>;
}

function StaffPortal({onExit}) {
  const [user,setUser]=useState(null);
  const [events,setEvents]=useState([]);
  const [event,setEvent]=useState(null);
  const [teams,setTeams]=useState([]);
  const [notice,setNotice]=useState('');
  const [activeHint,setActiveHint]=useState(null);
  const [busy,setBusy]=useState(false);
  const [staffUsers,setStaffUsers]=useState([]);
  const [editor,setEditor]=useState(null);
  const [editPhase,setEditPhase]=useState('');
  const [answers,setAnswers]=useState('');
  const [note,setNote]=useState('');
  const [tab,setTab]=useState('events');
  async function request(path,options={}) {
    const response=await apiFetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||'Verzoek mislukt.');
    return data;
  }
  async function refreshEvents(){const data=await request('/api/events');setEvents(data.events);}
  async function refreshEvent(id){
    const data=await request(`/api/events/${id}`);setEvent(data.event);setTeams(data.teams);
    const waiting=data.teams.flatMap(t=>(t.hintRequests||[]).filter(h=>!h.handledAt).map(h=>({...h,teamId:t.id,teamName:t.teamName}))).sort((a,b)=>a.at-b.at);
    setActiveHint(waiting[0]||null);
  }
  async function acknowledgeHint(){
    if(!activeHint||!event)return;
    try {
      await request(`/api/events/${event.id}/teams/${activeHint.teamId}/hints/${activeHint.id}/ack`,{method:'POST'});
      await refreshEvent(event.id);
    } catch(e){setNotice(e.message);}
  }
  useEffect(()=>{
    if(!localStorage.getItem('lotus_staff_token'))return;
    request('/api/auth/me').then(j=>{setUser(j.user);refreshEvents().catch(()=>{});}).catch(()=>localStorage.removeItem('lotus_staff_token'));
  },[]);
  useEffect(()=>{
    if(!event)return;
    const interval=setInterval(()=>refreshEvent(event.id).catch(()=>{}),2500);
    return()=>clearInterval(interval);
  },[event?.id]);
  async function login(e){
    e.preventDefault();setBusy(true);setNotice('');
    const f=new FormData(e.currentTarget);
    try{const data=await request('/api/auth/login',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})});
      localStorage.setItem('lotus_staff_token',data.token);setUser(data.user);await refreshEvents();
    }catch(e){setNotice(e.message);}finally{setBusy(false);}
  }
  async function createEvent(e){
    e.preventDefault();setBusy(true);setNotice('');
    const form=e.currentTarget;
    const f=new FormData(form);
    try{
      const data=await request('/api/events',{method:'POST',body:JSON.stringify({name:f.get('name')})});
      form.reset();
      await refreshEvents();
      await refreshEvent(data.event.id);
    }catch(err){setNotice(err.message);}finally{setBusy(false);}
  }
  async function deleteEvent(){
    if(!event)return;
    const confirmation=window.prompt(`Dit verwijdert '${event.name}' en alle ${teams.length} teamresultaten definitief.\n\nTyp exact de evenementnaam om te bevestigen:`);
    if(confirmation===null)return;
    if(confirmation!==event.name){setNotice('Niet verwijderd: de ingevoerde evenementnaam komt niet overeen.');return;}
    try{
      await request(`/api/events/${event.id}`,{method:'DELETE',body:JSON.stringify({confirmName:confirmation})});
      setEvent(null);setTeams([]);setNotice(`Evenement '${confirmation}' en de bijbehorende resultaten zijn verwijderd.`);
      await refreshEvents();
    }catch(err){setNotice(err.message);}
  }
  const finishedTeams=teams.filter(t=>t.status==='klaar').sort((a,b)=>a.elapsedSeconds-b.elapsedSeconds || (a.finishedAt||0)-(b.finishedAt||0));
  async function teamAction(team,action){
    if(['reset','stop'].includes(action)&&!confirm(`${action==='reset'?'Reset':'Stop'} ${team.teamName}?`))return;
    try{await request(`/api/events/${event.id}/teams/${team.id}/action`,{method:'POST',body:JSON.stringify({action})});await refreshEvent(event.id);}catch(e){setNotice(e.message);}
  }
  async function addTeamPenalty(team,minutes){
    try{
      await request(`/api/events/${event.id}/teams/${team.id}/penalty`,{method:'POST',body:JSON.stringify({minutes})});
      await refreshEvent(event.id);
      setNotice(`${minutes} strafminuut${minutes===1?'':'en'} toegevoegd aan ${team.teamName}.`);
    }catch(e){setNotice(e.message);}
  }
  async function addFacilitator(e){
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form);
    try{
      await request('/api/admin/facilitators',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})});
      form.reset();
      const j=await request('/api/admin/facilitators');
      setStaffUsers(j.users);
      setNotice('Spelbegeleider aangemaakt.');
    }catch(err){setNotice(err.message);}
  }
  async function loadEditor(){try{const j=await request('/api/admin/editor');setEditor(j);selectPhase(j.phases[0],j);setTab('editor');}catch(e){setNotice(e.message);}}
  function selectPhase(phase,model=editor){setEditPhase(phase);setAnswers((model?.answers?.[phase]||[]).join('\n'));setNote(model?.notes?.[phase]||'');}
  async function saveEditor(e){e.preventDefault();try{await request('/api/admin/editor',{method:'PUT',body:JSON.stringify({phase:editPhase,answers,note})});setNotice('Opgeslagen. Nieuwe antwoorden gelden voor volgende inzendingen.');const j=await request('/api/admin/editor');setEditor(j);}catch(e){setNotice(e.message);}}
  if(!user)return <main className="scene-page staff-scene"><div className="app-shell"><section className="panel staff-login"><span className="chip">BEVEILIGDE TOEGANG</span><h1>Spelbegeleider / Beheerder</h1><p>Log in met je persoonlijke account.</p><form onSubmit={login}><label>Gebruikersnaam<input name="username" autoComplete="username" required/></label><label>Wachtwoord<input name="password" type="password" autoComplete="current-password" required/></label><button className="primary" disabled={busy}>Inloggen</button></form>{notice&&<p className="feedback">{notice}</p>}<button className="secondary" onClick={onExit}>← Spelerslogin</button></section></div></main>;
  return <main className="scene-page staff-scene"><div className="app-shell wide">
    <section className="topbar"><div><span className="chip">DE ZWARTE LOTUS · {user.role==='admin'?'BEHEERDER':'SPELBEGELEIDER'}</span><h1>Spelbeheer</h1></div><button className="secondary" onClick={()=>{localStorage.removeItem('lotus_staff_token');setUser(null);onExit();}}>Uitloggen</button></section>
    <div className="staff-nav"><button className="secondary" onClick={()=>{setTab('events');setEvent(null);refreshEvents().catch(e=>setNotice(e.message));}}>Mijn evenementen</button>{user.role==='admin'&&<><button className="secondary" onClick={loadEditor}>Spel-editor</button><button className="secondary" onClick={async()=>{try{const j=await request('/api/admin/facilitators');setStaffUsers(j.users);setTab('staff');}catch(e){setNotice(e.message);}}}>Accounts</button></>}</div>
    {activeHint&&event&&<div className="staff-hint-backdrop" role="presentation"><div className="staff-hint-modal" role="alertdialog" aria-modal="true" aria-label="Nieuw hintverzoek"><span>🔔 NIEUW HINTVERZOEK</span><h2>{activeHint.teamName}</h2><p>Fase: {phaseLabels[activeHint.phase]||activeHint.phase}</p><p>Het team vraagt om hulp. Ga naar het team en geef de hint persoonlijk.</p><button className="primary" onClick={acknowledgeHint}>Hintverzoek afhandelen</button></div></div>}
    {notice&&<div className="feedback" role="status">{notice}</div>}
    {tab==='events'&&!event&&<><section className="panel"><h2>Nieuw evenement</h2><form onSubmit={createEvent} className="staff-form"><label>Evenementnaam<input name="name" required/></label><button className="primary" disabled={busy}>Evenement aanmaken</button></form></section><section className="panel"><h2>Mijn evenementen</h2><div className="staff-event-grid">{events.map(e=><button key={e.id} className="staff-event-button" onClick={()=>refreshEvent(e.id).catch(x=>setNotice(x.message))}><strong>{e.name}</strong><small>{e.teamCount} teams · {e.status==='closed'?'Afgesloten':'Open'}</small></button>)}</div></section></>}
    {tab==='events'&&event&&<><section className="panel"><div className="staff-heading"><div><button className="secondary" onClick={()=>setEvent(null)}>← Evenementen</button><h2>{event.name}</h2><p>Deel deze code met alle teams. De timer start automatisch zodra een team het spel begint.</p></div><div className="staff-code"><span>EVENEMENTCODE</span><strong>{event.code}</strong><button className="secondary" onClick={()=>navigator.clipboard.writeText(event.code)}>Kopieer</button></div></div><p>Status: <strong>{event.status==='closed'?'Afgesloten':'Open voor deelname'}</strong> · {teams.length} teams</p>{event.status!=='closed'&&<button className="secondary" onClick={async()=>{if(!confirm('Evenement afsluiten? Alle nog actieve teams worden gestopt. De ranglijst en alle gegevens blijven bewaard.'))return;try{await request(`/api/events/${event.id}/close`,{method:'POST'});await refreshEvent(event.id);}catch(e){setNotice(e.message);}}}>Evenement afsluiten (resultaten bewaren)</button>}<p className="staff-retention-note">🔒 Dit evenement en de ranglijst blijven bestaan totdat jij ze handmatig verwijdert. Afsluiten verwijdert niets.</p><button className="staff-delete-event" onClick={deleteEvent}>Evenement en resultaten definitief verwijderen…</button></section>
    <section className="panel staff-table"><h2>Live dashboard</h2><p>Openstaande hintverzoeken verschijnen direct als pop-up en blijven bewaard totdat je ze afhandelt.</p><table><thead><tr><th>Team</th><th>Fase</th><th>Route</th><th>Speeltijd</th><th>Hints</th><th>Straf</th><th>Status</th><th>Eindtijd</th><th>Bediening</th></tr></thead><tbody>{teams.map(t=><tr key={t.id}><td><strong>{t.teamName}</strong></td><td>{phaseLabels[t.currentPhase]||t.currentPhase}</td><td>{t.chosenRoute||'—'}</td><td>{formatDuration(t.elapsedSeconds)}</td><td>{t.hintCount}{(t.hintRequests||[]).some(h=>!h.handledAt)&&<strong className="staff-hint-pending"> · 🔔 HULP GEVRAAGD</strong>}</td><td>+{t.penaltyMinutes||0} min</td><td>{t.pausedAt?'Gepauzeerd':t.status}</td><td>{localTime(t.finishedAt||t.stoppedAt)}</td><td><div className="staff-actions">{t.status!=='klaar'&&t.status!=='gestopt'&&<>{t.pausedAt?<button onClick={()=>teamAction(t,'resume')}>Hervat</button>:<button onClick={()=>teamAction(t,'pause')}>Pauzeer</button>}<button onClick={()=>teamAction(t,'previous')} disabled={t.currentPhase==='START'}>← Vorige fase</button><button onClick={()=>teamAction(t,'next')}>Volgende fase →</button><button onClick={()=>teamAction(t,'stop')}>Stop</button></>}<button onClick={()=>teamAction(t,'reset')}>Reset</button><TeamPenaltyControls team={t} onApply={addTeamPenalty}/></div></td></tr>)}</tbody></table>{teams.length===0&&<p>Er zijn nog geen teams ingelogd.</p>}</section>
    <section className="panel staff-leaderboard"><div className="staff-leaderboard-head"><div><span>OFFICIËLE EINDSTAND</span><h2>🏆 Leaderboard</h2><p>Rangschikking op totale eindtijd, inclusief strafminuten. De ranglijst blijft beschikbaar na afloop en na afsluiten van het evenement.</p></div><strong>{finishedTeams.length} / {teams.length} teams klaar</strong></div>{finishedTeams.length===0?<p className="leaderboard-empty">Nog geen afgeronde teams. Resultaten verschijnen hier automatisch zodra een team het spel voltooit.</p>:<div className="leaderboard-scroll"><table className="leaderboard-table"><thead><tr><th>Plaats</th><th>Team</th><th>Speeltijd</th><th>Straf</th><th>Eindtijd inclusief straf</th></tr></thead><tbody>{finishedTeams.map((t,i)=><tr key={t.id}><td><span className={`leaderboard-rank ${i<3?'podium':''}`}>{i+1}</span></td><td><strong>{t.teamName}</strong><small>{t.chosenRoute||'Route onbekend'}</small></td><td>{formatDuration(Math.max(0,t.elapsedSeconds-(t.penaltyMinutes||0)*60))}</td><td>+{t.penaltyMinutes||0} min</td><td><strong>{formatDuration(t.elapsedSeconds)}</strong></td></tr>)}</tbody></table></div>}</section></>}
    {tab==='staff'&&user.role==='admin'&&<><section className="panel"><h2>Spelbegeleider aanmaken</h2><form className="staff-form" onSubmit={addFacilitator}><label>Gebruikersnaam<input name="username" required/></label><label>Wachtwoord (minimaal 12 tekens)<input name="password" type="password" minLength={12} required/></label><button className="primary">Account aanmaken</button></form></section><section className="panel"><h2>Accounts</h2>{staffUsers.map(u=><p key={u.id}>{u.username} · {u.role}</p>)}</section></>}
    {tab==='editor'&&user.role==='admin'&&editor&&<section className="panel"><h2>Spel-editor · antwoordcontrole</h2><p>Je kunt hier de geaccepteerde antwoorden voor de basispuzzels en aanvullende instructies instellen. Complexe routes en verhaalscènes staan nog in de broncode.</p><form onSubmit={saveEditor} className="staff-form"><label>Puzzel<select value={editPhase} onChange={e=>selectPhase(e.target.value)}>{editor.phases.map(p=><option key={p} value={p}>{phaseLabels[p]||p}</option>)}</select></label><label>Geaccepteerde antwoorden (één per regel)<textarea rows={7} value={answers} onChange={e=>setAnswers(e.target.value)} required/></label><label>Aanvullende instructie voor spelers (optioneel)<textarea rows={4} value={note} onChange={e=>setNote(e.target.value)}/></label><button className="primary">Opslaan</button></form></section>}
  </div></main>;
}

function GameCountdown({timerStartedAt,finishedAt,pausedAt,totalPausedMs=0}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    if(!timerStartedAt || finishedAt || pausedAt) return;
    const id=setInterval(()=>setNow(Date.now()),1000);
    return()=>clearInterval(id);
  },[timerStartedAt,finishedAt,pausedAt]);
  if(!timerStartedAt) return <div className="game-countdown refined-clock waiting" aria-label="De timer start na de inspecteursbriefing"><div className="clock-topline"><span>SPEELTIJD</span><small>NOG NIET GESTART</small></div><strong>00:00</strong><div className="clock-limit">Doeltijd <b>90:00</b> · Start na briefing</div></div>;
  const elapsed=Math.max(0,Math.floor(((finishedAt||pausedAt||now)-Number(timerStartedAt)-totalPausedMs)/1000));
  const min=Math.floor(elapsed/60);
  const sec=elapsed%60;
  const urgent=elapsed>=4500 && elapsed<5400;
  const expired=elapsed>=5400;
  const overtime=Math.max(0,elapsed-5400);
  const ovText=`+${String(Math.floor(overtime/60)).padStart(2,'0')}:${String(overtime%60).padStart(2,'0')}`;
  return <div className={`game-countdown refined-clock ${urgent?'urgent':''} ${expired?'expired':''}`} role="timer" aria-label={`Speeltijd ${min} minuten en ${sec} seconden`}>
    <div className="clock-topline"><span>{finishedAt?'DEFINITIEVE SPEELTIJD':pausedAt?'SPEL GEPAUZEERD':'LIVE SPEELTIJD'}</span><small>{finishedAt?'AFGEROND':pausedAt?'GEPAUZEERD': '● LIVE'}</small></div>
    <strong>{String(min).padStart(2,'0')}:{String(sec).padStart(2,'0')}</strong>
    <div className="clock-limit"><span>Doeltijd <b>90:00</b></span>{expired&&<em>{ovText} boven doeltijd</em>}</div>
    <div className="clock-track" aria-hidden="true"><i style={{width:`${Math.min(100,elapsed/5400*100)}%`}}/></div>
  </div>;
}


function GamePhase({ team, loading, feedback, startGame, submitOpening, startCountdown, submitAnswer, requestHint, chooseRoute, chooseFinal, syncFinal, sendBuyerChat, checkStep, startJohnnyOffer, infiltrateJohnny }) {
  const phase = team.currentPhase;
  if (phase === 'START') return <section className="panel cinematic intro-panel">
    <div className="section-label">MAISON BEAUMONT · VERTROUWELIJK</div>
    <h2>Een diner. Een diamant. Een verdwenen spoor.</h2>
    <p>Vanavond presenteert Maison Beaumont één van de zeldzaamste stenen ter wereld: <strong>De Zwarte Lotus</strong>. Een zwarte diamant met een waarde waar mensen voor liegen, verdwijnen — en erger.</p>
    <div className="mission-card"><span>MISSIE 01</span><strong>Pak jullie gezamenlijke onderzoeksdossier. Daarna begint de briefing van de inspecteur.</strong></div>
    <button className="primary" onClick={startGame} disabled={loading}>{loading?'Starten...':'Start het onderzoek'}</button>
  </section>;

  if (['ALARM','CAMERA','KIST_OPEN'].includes(phase)) return <OpeningPuzzlePage loading={loading} feedback={feedback} submitOpening={submitOpening} startCountdown={startCountdown} requestHint={requestHint} timerStartedAt={team.timerStartedAt} />;

  if (phase === 'DOSSIER') return <DossierPuzzle team={team} loading={loading} feedback={feedback} submitAnswer={submitAnswer} checkStep={checkStep} requestHint={requestHint} />;

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
  if (phase==='POLITIE_BRIEFING' && team.chosenRoute==='Politie') return <PoliceRoutePage loading={loading} feedback={feedback} infiltrateJohnny={infiltrateJohnny}/>;
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

  return <section className="panel opening-case-panel opening-redesign">
    {timerLaunch&&<div className="timer-launch-overlay" role="status" aria-live="assertive"><div className="timer-launch-inner"><span>DE SPEELTIJD START</span><strong>00:00</strong><small>Doeltijd: 90 minuten. De klok blijft daarna doorlopen.</small></div></div>}

    <div className="opening-section-header"><span className="opening-step-index">01</span><div><span className="opening-overline">MAISON BEAUMONT · VERTROUWELIJKE BRIEFING</span><h2>Het onderzoek begint hier</h2><p>Luister naar de hoofdinspecteur en onderzoek vervolgens de beschikbare bewijsmiddelen.</p></div></div>
    <div className="opening-briefing opening-briefing-refined">
      <div className="inspector-visual"><img src="/assets/inspector-kist.jpg" alt="Hoofdinspecteur in een recherchekamer"/><div className="inspector-badge">HOOFDINSPECTEUR · MAISON BEAUMONT</div></div>
      <div className="inspector-copy">
        <div className="opening-overline">SPOEDBRIEFING · AUDIO 01</div>
        <h2>“Jullie hebben één taak.”</h2>
        <p>Luister het bericht van de inspecteur helemaal af. Daarna start jullie officiële speeltijd.</p>
        <div className={`briefing-audio briefing-audio-refined ${briefingDone?'complete':''}`}>
          <div className="audio-heading"><span className="audio-symbol" aria-hidden="true">♫</span><div><span>{briefingDone?'BRIEFING VOLTOOID':'VERPLICHTE BRIEFING'}</span><strong>Bericht van de hoofdinspecteur</strong></div></div>
          <audio controls preload="metadata" src="/assets/inspector-briefing.mp3" onEnded={finishBriefing} aria-label="Briefing hoofdinspecteur" />
        </div>
        <div className={`opening-briefing-status ${briefingDone?'ready':''}`}>{briefingDone?'✓ Briefing afgerond · De speeltijd is gestart':'Luister het fragment volledig af om het onderzoek te beginnen.'}</div>
      </div>
    </div>

    <form className={`opening-puzzles evidence-board ${briefingDone?'unlocked':'locked'}`} onSubmit={submit}>
      <article className="opening-puzzle-card evidence-card opening-reconstruction">
        <div className="opening-section-header question-heading"><span className="opening-step-index">02</span><div><span className="opening-overline">ONDERZOEK · BEVEILIGDE TOEGANG</span><h3>Reconstrueer de code van het onderzoek.</h3><p>Gebruik van beide bewijsstukken de laatste twee cijfers. Neem twee cijfers uit de camerabeelden en twee uit het alarmbandje. Combineer ze tot de viercijferige onderzoekscode. De volgorde waarin de bewijsstukken worden aangeboden, hoeft niet de volgorde van de code te zijn.</p></div></div>
        <div className="opening-evidence-grid">
          <div className="opening-evidence-reference"><span className="evidence-number">BEWIJSSTUK 01</span><span className="evidence-symbol" aria-hidden="true">▣</span><strong>Camerabeelden</strong><p>Raadpleeg de beelden die jullie via het onderzoek hebben ontvangen.</p><small>Te vinden in jullie onderzoeksdossier</small></div>
          <div className="opening-alarm-evidence"><div className="opening-alarm-evidence-head"><span>BEWIJSSTUK 02 · AUDIO</span><strong>Alarmregistratie Maison Beaumont</strong><small>Beluister het beveiligingsbericht. Je kunt het zo vaak opnieuw afspelen als nodig.</small></div><audio controls preload="metadata" src="/assets/alarmfragment.mp3" aria-label="Alarmfragment Maison Beaumont" /></div>
        </div>
        <div className="opening-code-area"><div><span className="opening-overline">JULLIE CONCLUSIE</span><h4>Onderzoekscode</h4><p>Vul de vier cijfers in die jullie uit de bewijsstukken hebben afgeleid.</p></div><label className="opening-code-field"><span>Viercijferige code</span><input disabled={!briefingDone} value={accessCode} onChange={e=>setAccessCode(e.target.value.replace(/\D/g,'').slice(0,4))} inputMode="numeric" pattern="[0-9]{4}" autoComplete="off" maxLength={4} required aria-label="Viercijferige onderzoekscode" /></label></div>
      </article>
      <div className="opening-submit"><button type="button" className="hint-link" disabled={!briefingDone} onClick={()=>requestHint('Hint: vergelijk wat jullie via het alarmonderzoek en het visuele spoor hebben vastgesteld.')}>Hint aanvragen</button><button className="primary" disabled={loading||!briefingDone||accessCode.length!==4}>{loading?'Controleren...':'Controleer onderzoekscode →'}</button></div>
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

function DossierPuzzle({team,loading,feedback,submitAnswer,checkStep,requestHint}) {
  const [suspectCount,setSuspectCount]=useState(team.completedSteps?.DOSSIER?.count?'4':'');
  const [countVerified,setCountVerified]=useState(Boolean(team.completedSteps?.DOSSIER?.count));
  const [checkingCount,setCheckingCount]=useState(false);
  const [entries,setEntries]=useState(()=>team.completedSteps?.DOSSIER?.count?Array.from({length:4},()=>({name:'',skill:'',nameOk:false,skillOk:false})):[]);
  const [checkingRow,setCheckingRow]=useState('');

  const skillOptions=[
    {value:'techniek',label:'Techniek / beveiliging'},
    {value:'documenten',label:'Documenten / vervalsing'},
    {value:'koper',label:'Handel / koper / afzet'},
    {value:'transport',label:'Transport / smokkel'},
    {value:'afleiding',label:'Afleiding / zakkenrollen'},
    {value:'identiteit',label:'Identiteit / vermomming'},
    {value:'inbraak',label:'Inbraak / brute kracht'},
    {value:'financien',label:'Financiën / geldstromen'}
  ];

  const changeCount=(value)=>{setSuspectCount(value);setCountVerified(false);setEntries([]);};
  const verifyCount=async()=>{
    if(!/^[1-8]$/.test(String(suspectCount)))return;
    setCheckingCount(true);
    try {
      const ok=await checkStep('DOSSIER','count',String(suspectCount));
      if(ok){setCountVerified(true);setEntries(Array.from({length:Number(suspectCount)},()=>({name:'',skill:'',nameOk:false,skillOk:false})));}
    } finally {setCheckingCount(false);}
  };
  const updateEntry=(index,key,value)=>setEntries(prev=>prev.map((row,i)=>i===index?{
    ...row,[key]:value,...(key==='name'?{nameOk:false,skill:'',skillOk:false}:{skillOk:false})
  }:row));
  const verifyName=async(index)=>{
    const entry=entries[index];if(!entry?.name.trim())return;
    if(entries.some((row,i)=>i!==index && row.nameOk && row.name.trim().toLowerCase()===entry.name.trim().toLowerCase()))return;
    setCheckingRow(`name-${index}`);
    try {const ok=await checkStep('DOSSIER','suspect_name',entry.name);if(ok)setEntries(rows=>rows.map((row,i)=>i===index?{...row,nameOk:true}:row));}
    finally {setCheckingRow('');}
  };
  const verifySkill=async(index)=>{
    const entry=entries[index];if(!entry?.nameOk||!entry.skill)return;
    setCheckingRow(`skill-${index}`);
    try {const ok=await checkStep('DOSSIER','suspect_skill',JSON.stringify({name:entry.name,skill:entry.skill}));if(ok)setEntries(rows=>rows.map((row,i)=>i===index?{...row,skillOk:true}:row));}
    finally {setCheckingRow('');}
  };
  const count=Number(suspectCount)||0;
  const complete=countVerified&&entries.length===count&&entries.every(x=>x.nameOk&&x.skillOk);
  const submit=async()=>{if(complete)await submitAnswer('DOSSIER',{count,entries:entries.map(({name,skill})=>({name,skill}))});};

  return <section className="panel dossier-ready evidence-reconstruction physical-dossier-phase">
    <div className="success-seal">TOEGANG VERLEEND</div>
    <div className="section-label">FASE 2 · RECONSTRUCTIE</div>
    <div className="mission-card inspector-summons" role="note"><span><strong>DRINGEND BERICHT VAN DE INSPECTEUR</strong></span><strong>Hé, nietsnutten!</strong><p>Ik heb eindelijk die verdomde verdachtenprofielen binnengekregen!</p><p>Wat staan jullie daar nog te kijken? Pak die dossiers erbij en analyseer ze grondig!</p><p>Bestudeer hun achtergronden, strafbladen, specialiteiten en onderlinge contacten. <strong>Ik wil weten wie de hoofdverdachten zijn in deze diamantroof!</strong></p><p>En waag het niet om zomaar wat namen te roepen. Ik verwacht dat jullie je conclusies kunnen onderbouwen!</p><strong>HUP! AAN HET WERK!</strong></div>
    <h2>Wie beschikken over de kwaliteiten om deze roof uit te voeren?</h2>
    <p>Een diamantroof vereist verschillende vaardigheden: de beveiliging omzeilen, documenten of toegang regelen, de buit vervoeren en de diamant vervolgens verhandelen en verkopen. Vergelijk de acht persoonsdossiers. Zoek de verdachten die samen over de benodigde kwaliteiten beschikken. Niet iedereen met een strafblad hoeft betrokken te zijn.</p>

    <div className="dossier-count-card dossier-count-check">
      <div className="dossier-count-heading"><span>ONDERZOEKSVRAAG 01</span><strong>Hoeveel hoofdverdachten beschikken samen over deze kwaliteiten?</strong><p>Bepaal eerst hoeveel personen je nodig acht voor de uitvoering, het vervoer en de afzet van de diamant.</p></div>
      <div className="dossier-count-controls"><label htmlFor="suspect-count-input">Aantal hoofdverdachten
        <input id="suspect-count-input" type="number" min="1" max="8" inputMode="numeric" disabled={countVerified} value={suspectCount} onChange={e=>changeCount(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!countVerified){e.preventDefault();verifyCount();}}} />
      </label>
      {!countVerified?<button type="button" className="primary" disabled={checkingCount||loading||!/^[1-8]$/.test(String(suspectCount))} onClick={verifyCount}>{checkingCount?'Controleren...':'Controleer aantal'}</button>:<div className="dossier-count-success" role="status">✓ Aantal bevestigd · ga verder met de personen</div>}</div>
      {!countVerified&&<small>Een onjuist antwoord levert 1 minuut tijdstraf op.</small>}
    </div>

    {countVerified&&count>0&&<div className="physical-suspect-entry-list">
      <h3>ONDERZOEKSVRAAG 02 · Identificeer de verdachten en hun specialismen</h3>
      <p>Controleer eerst per persoon of deze tot de vier hoofdverdachten behoort. Na een juiste naam wordt deze groen en kun je de bijbehorende kwaliteit controleren. Ook de juiste kwaliteit kleurt groen.</p>
      {entries.map((entry,index)=><div className={`physical-suspect-entry suspect-check-card${entry.nameOk?' suspect-name-confirmed':''}${entry.skillOk?' suspect-fully-confirmed':''}`} key={index}>
        <div className="suspect-card-header">
          <div className="physical-suspect-number">{String(index+1).padStart(2,'0')}</div>
          <div className="suspect-card-heading"><span>HOOFDVERDACHTE {String(index+1).padStart(2,'0')}</span><strong>{entry.skillOk?'Verdachte en kwaliteit bevestigd':entry.nameOk?'Verdachte bevestigd · controleer de kwaliteit':'Identificeer de verdachte'}</strong></div>
          {entry.skillOk&&<span className="suspect-card-complete" role="status">✓ Compleet</span>}
        </div>
        <div className="suspect-check-line">
          <label htmlFor={`suspect-name-${index}`}>Welke verdachte?
            <input id={`suspect-name-${index}`} className={entry.nameOk?'dossier-verified-input':''} value={entry.name} disabled={entry.nameOk} onChange={e=>updateEntry(index,'name',e.target.value)} autoComplete="off" placeholder="Voor- en achternaam" />
          </label>
          {entry.nameOk?<div className="dossier-row-ok suspect-check-feedback" role="status">✓ Verdachte correct</div>:<button type="button" className="secondary suspect-check-button" disabled={loading||Boolean(checkingRow)||!entry.name.trim()||entries.some((row,i)=>i!==index&&row.nameOk&&row.name.trim().toLowerCase()===entry.name.trim().toLowerCase())} onClick={()=>verifyName(index)}>{checkingRow===`name-${index}`?'Controleren...':'Controleer verdachte'}</button>}
        </div>
        {entry.nameOk&&<div className="suspect-check-line suspect-skill-line">
          <label htmlFor={`suspect-skill-${index}`}>Welke kwaliteit maakt deze persoon relevant?
            <select id={`suspect-skill-${index}`} className={entry.skillOk?'dossier-verified-input':''} value={entry.skill} disabled={entry.skillOk} onChange={e=>updateEntry(index,'skill',e.target.value)}>
              <option value="">Kies vaardigheid…</option>{skillOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {entry.skillOk?<div className="dossier-row-ok suspect-check-feedback" role="status">✓ Kwaliteit correct</div>:<button type="button" className="secondary suspect-check-button" disabled={loading||Boolean(checkingRow)||!entry.skill} onClick={()=>verifySkill(index)}>{checkingRow===`skill-${index}`?'Controleren...':'Controleer kwaliteit'}</button>}
        </div>}
      </div>)}
    </div>}

    <div className="dossier-submit-footer simple"><button className="primary" type="button" disabled={loading||!complete} onClick={submit}>{loading?'Controleren...':'Bevestig conclusie'}</button></div>
    <button className="hint-link" onClick={()=>requestHint('Hint: kijk naar de combinatie van beveiliging, documenten, transport en handel in de gestolen diamant.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

const containerRows = [
  {container:'MBX-1120',dock:'11',arrival:'19:40',status:'Vrijgegeven'},
  {container:'MBX-2408',dock:'24',arrival:'20:08',status:'Vrijgegeven'},
  {container:'MBX-3314',dock:'33',arrival:'20:14',status:'Vertraagd'},
  {container:'MBX-4717',dock:'17',arrival:'20:28',status:'Handmatige controle'},
  {container:'MBX-8617',dock:'17',arrival:'19:55',status:'Vrijgegeven'},
  {container:'MBX-7317',dock:'17',arrival:'20:28',status:'Wacht op controle'},
  {container:'MBX-9017',dock:'17',arrival:'20:18',status:'Gesloten'},
  {container:'MBX-2517',dock:'17',arrival:'20:28',status:'Vrijgegeven'},
  {container:'MBX-7303',dock:'07',arrival:'20:28',status:'Technische controle'},
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
    if(!originOk) return r.dock==='17'&&r.arrival==='20:28';
    return r.container==='MBX-4717';
  });

  return <section className="panel container-puzzle transport-onepage">
    <div className="section-label">FASE 3 · OORSPRONKELIJK TRANSPORTPLAN</div>
    <h2>Reconstrueer het oorspronkelijke transport.</h2>
    <p>Gebruik het onderzoeksdossier, de stadskaart en de transportgegevens om de vrachtlijst te verkleinen. Houd rekening met de reistijd tussen Maison Beaumont en de haven: een zending kan niet aankomen vóór het voertuig de afstand heeft afgelegd. Na drie bewezen kenmerken blijft de oorspronkelijke container over.</p>

    <div className="manifest-wrap"><table className="manifest"><thead><tr><th>Container</th><th>Dock</th><th>Aankomst</th><th>Status</th></tr></thead><tbody>{visibleRows.map(r=><tr key={r.container}><td><strong>{r.container}</strong></td><td>{r.dock}</td><td>{r.arrival}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    <div className="manifest-count">{visibleRows.length} {visibleRows.length===1?'container over':'containers zichtbaar'}</div>

    <div className="transport-filter-grid">
      <form className={`transport-filter-card ${dockOk?'solved':''}`} onSubmit={checkDock}>
        <span>ROUTEGEGEVEN</span>
        <strong>Welk dock hoort bij de oorspronkelijke route?</strong>
        <small>Gebruik de fysieke routegegevens van het heist-team.</small>
        <div className="filter-input"><input value={dock} onChange={e=>setDock(e.target.value)} inputMode="numeric" required/><button className="primary">{dockOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>

      <form className={`transport-filter-card ${arrivalOk?'solved':''} ${!dockOk?'locked':''}`} onSubmit={checkArrival}>
        <span>REISTIJD · STADSKAART</span>
        <strong>Hoe laat kon het transport de haven bereiken?</strong>
        <small>Neem het moment waarop de vitrine werd geopend als vertrektijd. Ga uit van een directe rit onder normale verkeersomstandigheden. Gebruik de reistijd Maison Beaumont → haven op jullie stadskaart. Vul de berekende aankomsttijd in als UU:MM.</small>
        <div className="filter-input"><input value={arrival} onChange={e=>setArrival(e.target.value)} disabled={!dockOk} required/><button className="primary" disabled={!dockOk}>{arrivalOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>

      <form className={`transport-filter-card ${originOk?'solved':''} ${!arrivalOk?'locked':''}`} onSubmit={checkOrigin}>
        <span>HERKOMST</span>
        <strong>Uit welk land kwam de juiste zending?</strong>
        <small>Onderzoek welke herkomstgegevens nog ontbreken.</small>
        <div className="filter-input"><input value={origin} onChange={e=>setOrigin(e.target.value)} disabled={!arrivalOk} required/><button className="primary" disabled={!arrivalOk}>{originOk?'Bevestigd ✓':'Controleer'}</button></div>
      </form>
    </div>

    {originOk&&<div className="transport-next-screen">
      <span>TRANSPORTONDERZOEK AFGEROND</span>
      <h3>Jullie hebben de vrachtlijst teruggebracht tot één mogelijke zending.</h3>
      <p>Ga verder om de eindconclusie apart vast te leggen.</p>
      <button className="primary" type="button" disabled={loading} onClick={()=>submitAnswer('ORIGINELE_CONTAINER','verder')}>{loading?'Laden...':'Ga naar eindbevestiging'}</button>
    </div>}

    {localFeedback&&<div className="filter-feedback" aria-live="polite">{localFeedback}</div>}
    <button className="hint-link" onClick={()=>requestHint(!dockOk?'Hint: begin met de fysieke routegegevens en zoek het dock dat bij het heist-team hoort.':!arrivalOk?'Hint: zoek het tijdstip waarop de vitrine werd geopend en tel daar de reistijd op de stadskaart van Maison Beaumont naar de haven bij op.':!originOk?'Hint: vergelijk de herkomstgegevens uit het externe transportregister met de overgebleven zendingen.':'Hint: na drie correcte filters hoort er nog maar één regel over te zijn.')}>Hint aanvragen</button>
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
      <AnswerForm loading={loading} maxLength={16} button="Bevestig container" onSubmit={v=>submitAnswer('ORIGINELE_CONTAINER_BEVESTIGEN',v)}/>
    </div>
    <button className="hint-link" onClick={()=>requestHint('Hint: controleer de enige overgebleven regel uit het transportonderzoek.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function RotjeKnorPhase({loading,feedback,submitAnswer}) {
  return <section className="panel cinematic informant-panel infiltration-briefing">
    <div className="section-label">FASE 4 · NIEUW SPOOR</div>
    <div className="infiltration-heading">
      <span className="infiltration-kicker">VERTROUWELIJKE ONDERZOEKSOPDRACHT</span>
      <h2>Het transport is verdwenen</h2>
      <p>Jullie hebben de oorspronkelijke container geïdentificeerd. Maar volgens de laatste gegevens is de lading niet meer op de oorspronkelijke bestemming aangekomen.</p>
      <p>Er ontbreekt belangrijke informatie over een wijziging in het transportplan.</p>
    </div>
    <div className="infiltration-mission">
      <div className="infiltration-mission-head"><span className="infiltration-number">04</span><div><small>NIEUWE ONDERZOEKSOPDRACHT</small><strong>Zoek de juiste infiltrant.</strong></div></div>
      <p>De juiste infiltrant beschikt mogelijk over informatie waarmee jullie toegang krijgen tot de geheime transportadministratie. Onderzoek jullie aanwijzingen om vast te stellen met wie je contact moet leggen.</p>
    </div>
    <div className="infiltration-questions">
      <span>TE ONDERZOEKEN</span>
      <ol>
        <li>Wat is er met het oorspronkelijke transport gebeurd?</li>
        <li>Wie heeft de wijziging uitgevoerd?</li>
        <li>Welke nieuwe containerregistratie is aangemaakt?</li>
      </ol>
    </div>
    <div className="infiltration-footer">
      <p>De antwoorden hoeven jullie hier nog niet in te vullen. Verzamel eerst het bewijs; daarna gaat het onderzoek verder in het containerregister.</p>
      <button type="button" className="primary" disabled={loading} onClick={()=>submitAnswer('ROTJE_KNOR','onderzoek gestart')}>{loading?'Openen...':'Ga verder naar het containerregister'}</button>
    </div>
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


function JohnnyContainerPuzzle({loading,feedback,submitAnswer,requestHint}) {
  const [container,setContainer]=useState('');
  const finalSubmit=e=>{e.preventDefault();submitAnswer('NIEUWE_CONTAINER',{container});};
  return <section className="panel container-puzzle">
    <div className="section-label">FASE 6 · GEWIJZIGDE ZENDING</div>
    <div className="johnny-transport-story">
      <span className="johnny-transport-kicker">DRINGEND BERICHT · HOOFDINSPECTEUR</span>
      <h2>De zending is spoorloos.</h2>
      <p>Het oorspronkelijke transport is gereconstrueerd, maar de lading is verdwenen. De reguliere havenadministratie levert geen sluitend antwoord op. Jullie moeten achterhalen onder welk nieuw containernummer de zending verder is gegaan.</p>
      <div className="johnny-transport-dispatch"><span>DE INSPECTEUR</span><strong>“Luister goed, nietsnutten! Ik kan jullie geen bruikbaar containerregister geven. Zoek contact met de infiltrant. Die kan jullie toegang verschaffen tot de afgeschermde transportadministratie. Daar moet het bewijs te vinden zijn. En kom niet terug met een gok!”</strong></div>
      <div className="johnny-transport-mission"><span>JULLIE OPDRACHT</span><h3>Neem contact op met de infiltrant</h3><p>Gebruik de contactcode hieronder om zijn beveiligde bericht te openen. Luister het bericht volledig af en gebruik de ontvangen autorisatiecode voor het transportsysteem. In dat systeem vinden jullie het containerregister.</p></div>
    </div>
    <div className="transport-contact-card">
      <span>BEVEILIGD INFILTRANTENKANAAL · CONTACTCODE</span>
      <strong>CK-842</strong>
      <a className="primary transport-contact-link" href="#/rotje?code=CK-842" target="_blank" rel="noopener noreferrer">Open contact met de infiltrant</a>
      <p>Deze link opent een apart tabblad. Laat de onderzoekspagina open staan om straks de conclusie in te voeren.</p>
    </div>
    <form className="final-confirm" onSubmit={finalSubmit}>
      <span>CONCLUSIE · NA ONDERZOEK</span><h3>Onder welk containernummer is de zending verdergegaan?</h3>
      <p>Vul hier het containernummer in dat jullie uit de gegevens van de infiltrant en het beveiligde transportsysteem hebben afgeleid.</p>
      <label>Containernummer<input value={container} onChange={e=>setContainer(e.target.value)} autoComplete="off" required/></label>
      <button className="primary" disabled={loading}>{loading?'Controleren...':'Bevestig containernummer'}</button>
    </form>
    <button className="hint-link" onClick={()=>requestHint('Hint: neem contact op met de infiltrant met CK-842. Gebruik daarna zijn autorisatiecode om het containerregister in het transportsysteem te raadplegen. Vergelijk de gewijzigde reeks, de tijd en het soort overslag.')}>Hint aanvragen</button>
    {feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}
  </section>;
}

function JohnnyChoice({team,loading,feedback,chooseRoute,startJohnnyOffer}) {
  const startedAt = team.johnnyOfferStartedAt ? Number(team.johnnyOfferStartedAt) : null;
  const returningFromPolice = Boolean(team.policeDetourPenaltyApplied && team.chosenRoute==='Politie');
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
  const expired=!!startedAt && seconds===0 && !returningFromPolice;
  const choose = async(route)=>{
    if(!startedAt || expired || choiceSubmitted || loading || (returningFromPolice && route!=='Johnny'))return;
    setChoiceSubmitted(true);
    await chooseRoute(route);
    setChoiceSubmitted(false);
  };
  return <section className="panel cinematic johnny-choice johnny-transmission">
    <div className="section-label">VERSLEUTELDE VERBINDING · J.J.</div>
    <h2>{returningFromPolice?'Johnny Jatwerk neemt opnieuw contact op.':'Johnny Jatwerk neemt contact op.'}</h2>
    {returningFromPolice&&<p>De inspecteur heeft jullie teruggestuurd om te infiltreren. Luister eerst Johnny's aanbod opnieuw. De vijf strafminuten zijn al toegevoegd; jullie kunnen daarna rechtstreeks akkoord gaan met zijn voorstel.</p>}
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
      {!returningFromPolice&&<div className={`choice-timer ${seconds<=10?'urgent':''}`} role="timer" aria-label={`Nog ${seconds} seconden`}>
        <span>TIJD OVER</span><strong>{String(seconds).padStart(2,'0')}</strong>
      </div>}
      <div className="choice-grid"><button className="choice-card criminal" disabled={loading||choiceSubmitted||expired} onClick={()=>choose('Johnny')}><span>{returningFromPolice?'INFILTRATIE':'OPTIE 1'}</span><strong>{returningFromPolice?'Accepteer Johnny’s aanbod':'Werk samen met Jatwerk'}</strong><small>Laat de overdracht doorgaan en volg Johnny naar de kluis.</small></button>{!returningFromPolice&&<button className="choice-card police" disabled={loading||choiceSubmitted||expired} onClick={()=>choose('Politie')}><span>OPTIE 2</span><strong>Licht de politie in</strong><small>Vraag de inspecteur om hulp. Wat zal hij ervan vinden?</small></button>}</div>
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
      <label>Waar bevindt Johnny Jatwerk zich?<input value={location} onChange={e=>setLocation(e.target.value)} required autoComplete="off"/></label>
      <label>Code B van de inspecteur<input value={policeCode} onChange={e=>setPoliceCode(e.target.value)} required autoComplete="off"/></label>
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
    <h2>De koper moet in de val lopen</h2>
    <div className="buyer-mission-intro">
      <div className="buyer-mission-stamp">OPERATIE SCHADUWJACHT <span>VERTROUWELIJK</span></div>
      <h3>Johnny is opgepakt. Nu is de koper aan de beurt.</h3>
      <p>De politie heeft Johnny Jatwerk aangehouden, maar daarmee is de zaak nog niet opgelost. De Zwarte Lotus was bestemd voor een koper die zich verschuilt achter de codenaam <strong>V.V.-37: Victor Valmont</strong>.</p>
      <p>Bij de bewijsstukken ligt een <strong>zwart communicatiekastje</strong>. Daarmee kunnen jullie rechtstreeks contact leggen met de koper. Hij weet nog niet dat Johnny is gearresteerd. Dat is jullie voordeel.</p>
      <div className="buyer-device-instruction">
        <div className="buyer-device-icon" aria-hidden="true"><span className="buyer-device-light"/><span className="buyer-device-screen">V.V.-37<br/>VERBINDING</span><span className="buyer-device-keys">● ● ●</span></div>
        <div><span className="buyer-device-label">OPDRACHT · BEVEILIGD CONTACT</span><strong>Gebruik het zwarte kastje en neem Johnny's plaats in.</strong><p>Voer de gevonden codewoorden in, win het vertrouwen van Victor en maak een afspraak voor de overdracht. Bepaal zelf waar en wanneer de ontmoeting plaatsvindt.</p></div>
      </div>
      <p className="buyer-mission-warning"><strong>LET OP:</strong> Vertel Victor niet dat Johnny is opgepakt. Hij mag niets vermoeden zolang de deal nog niet rond is.</p>
    </div>
    <div className="secure-chat new-buyer-chat">
      <div className="chat-head"><span>VERSLEUTELDE CHAT</span><strong>V.V.-37</strong><small>Verbinding beveiligd</small></div>
      <div className="chat-log" aria-live="polite">{(chat.messages||[]).map((m,i)=><div key={i} className={`chat-row ${m.from==='Team'?'outgoing':'incoming'}`}><span>{m.from}</span><p>{m.text}</p></div>)}</div>
    </div>
    <form className="operation-step buyer-chat-compose" onSubmit={submit}>
      <span>{chat.stage==='codeword1'?'CODEWOORD 1':chat.stage==='codeword2'?'CODEWOORD 2':'AFSPRAAK'}</span>
      {chat.stage==='location'?<>
        <label>Locatie voor de overdracht<input maxLength={180} value={value} onChange={e=>setValue(e.target.value)} required/></label>
        <label>Tijdstip<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label>
      </>:<label>Geheim codewoord<input value={value} onChange={e=>setValue(e.target.value)} autoComplete="off" required/></label>}
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
  const arrestSteps=[
    {at:0,label:'Politie in positie',title:'Agenten wachten op Victor',text:`De teams houden ${team.buyerChat?.location||'de overdrachtslocatie'} in de gaten.`},
    {at:3000,label:'Geen contact',title:'De koper is nog niet te zien',text:'De afgesproken plek blijft leeg. De inspecteur laat de eenheden wachten.'},
    {at:6500,label:'Verdachte in beeld',title:'Victor wordt gesignaleerd',text:'Een observant herkent de zwarte handschoen. Victor nadert de overdrachtslocatie.'},
    {at:10300,label:'Aanhouding bevestigd',title:'Victor Valmont is aangehouden',text:'Politie-eenheden grijpen in en stellen het geld veilig.'}
  ];
  const escapeSteps=[
    {at:0,label:'Geen politieactie',title:'De overdracht begint',text:'Het rechercheteam kiest ervoor Victor niet te laten oppakken.'},
    {at:3000,label:'Victor gearriveerd',title:'De koper verschijnt',text:'De overdracht verloopt volgens het geheime plan.'},
    {at:6500,label:'Geld overgedragen',title:'Het geld wisselt van eigenaar',text:'Victor merkt niet dat de rechercheurs het geld zelf willen houden.'},
    {at:10300,label:'Uit beeld',title:'Victor lijkt ontsnapt',text:'De koper verdwijnt. Het team denkt dat het ermee wegkomt.'}
  ];
  const betrayalSteps=[
    {at:0,label:'Nieuwe melding',title:'De politie vindt Victor terug',text:'Een observatieteam volgt hem tot aan een andere uitgang van de haven.'},
    {at:4000,label:'Arrestatie',title:'Victor wordt alsnog aangehouden',text:'Zwaailichten verlichten de uitvalsweg. Politiebusjes blokkeren de doorgang en Victor wordt aangehouden.'},
    {at:8000,label:'Verhoor',title:'Victor verraadt het rechercheteam',text:'Victor vertelt de inspecteur dat de rechercheurs zelf het geld wilden houden.'},
    {at:12000,label:'Aanhouding',title:'Het rechercheteam wordt opgepakt',text:'Met loeiende sirenes rijden politiewagens het terrein op. Agenten omsingelen het team en nemen het geld in beslag.'}
  ];
  const escapeDone=elapsed>=10300;
  const betrayalElapsed=Math.max(0,elapsed-10300);
  const victorCaught=elapsed>=14300;
  const betrayalKnown=elapsed>=18300;
  const done=keptMoney?elapsed>=22300:elapsed>=10300;
  const headline=!keptMoney? (done?'Operatie geslaagd.':'De politie wacht op Victor…'):
    !escapeDone?'Jullie denken dat het plan slaagt…':
    !victorCaught?'Victor is toch nog in beeld…':
    !betrayalKnown?'Victor is opgepakt.':'Victor heeft jullie verraden.';
  return <section className="panel cinematic case-result arrest-scene">
    <div className="section-label">DE ZWARTE LOTUS · EINDOPERATIE VICTOR</div>
    <h2>{done&&keptMoney?'Ook het rechercheteam is aangehouden.':headline}</h2>
    <div className="final-inspector-dispatch"><img src="/assets/inspector-kist.jpg" alt="De inspecteur uit de openingsbriefing"/><div><span>BERICHT VAN DE INSPECTEUR</span><strong>{!keptMoney?(done?'Johnny zat al vast. Victor is nu ook aangehouden.':'Johnny zit al vast. De politie wacht op Victor.'):
      done?'Victor heeft alles verklaard. Het rechercheteam is gearresteerd.':
      betrayalKnown?'Victor heeft de betrokkenheid van het team onthuld.':
      victorCaught?'Victor is alsnog aangehouden. De inspecteur ondervraagt hem.':
      'Het team denkt dat het geld nu veilig is.'}</strong></div></div>
    {!keptMoney&&<LiveOperationFeed title="OPERATIE KOPER · VICTOR" image="/assets/story/victor-operatie.jpg" alt="Politie bij de overdrachtslocatie van Victor" steps={arrestSteps} elapsed={elapsed} person="Victor Valmont" outcome="arrest"/>}
    {keptMoney&&<>
      <LiveOperationFeed title="OVERDRACHT · VICTOR" image="/assets/zwarte-lotus-login-background.jpg" alt="De nachtelijke overdrachtslocatie" steps={escapeSteps} elapsed={Math.min(elapsed,10000)} />
      {escapeDone&&<div className="endgame-interruption" role="status"><span>! ONVERWACHTE MELDING</span><strong>Victor is toch niet verdwenen.</strong></div>}
      {escapeDone&&<LiveOperationFeed title="NACHTVAL · NASLEEP" image="/assets/story/victor-operatie.jpg" alt="Politie haalt Victor later alsnog in" steps={betrayalSteps} elapsed={betrayalElapsed}/>}
      {victorCaught&&<div className="capture-confirmation"><div className="capture-confirmation-symbol">✓</div><div><small>POLITIEKANAAL · STATUSBEVESTIGING</small><h3>Victor Valmont alsnog aangehouden</h3><p>Victor wordt overgebracht naar het bureau voor verhoor.</p></div></div>}
      {betrayalKnown&&<section className="betrayal-card" aria-live="polite"><span>VERTROUWELIJK · VERHOORVERSLAG</span><h3>Victor verraadt jullie.</h3><p>“Die rechercheurs hebben de overdracht geregeld. Zij wilden het geld zelf houden.”</p><p>De inspecteur heeft de verklaring ontvangen.</p></section>}
      {betrayalKnown&&<div className={`team-arrest-cinematic ${done?'complete':'approach'}`} role="region" aria-label="Camerabeelden aanhouding rechercheteam">
        <img src="/assets/story/aanhouding-rechercheteam.png" alt="Politie-eenheden met zwaailichten omsingelen rechercheurs in de nachtelijke haven" />
        <div className="team-arrest-strobes" aria-hidden="true"></div>
        <div className="team-arrest-vignette" aria-hidden="true"></div>
        <div className="team-arrest-camera-hud"><span className="live-dot" aria-hidden="true"></span> LIVE · CAMERA HAVEN WEST <span>OPERATIE NACHTVAL</span></div>
        <div className="team-arrest-film-caption"><span>{done?'AANHOUDING BEVESTIGD':'POLITIE IN AANTOCHT'}</span><h3>{done?'Het rechercheteam is aangehouden.':'Politie-eenheden sluiten het terrein af.'}</h3><p>{done?'De inspecteur laat iedereen afvoeren. Het geld is in beslag genomen.':'Blauw-rode zwaailichten naderen. Eenheden komen van beide kanten het terrein op.'}</p></div>
      </div>}
      {done&&<section className="team-arrest-card" role="status"><div className="capture-confirmation-symbol">!</div><div><span>POLITIE · AANHOUDING BEVESTIGD</span><h3>Het rechercheteam is aangehouden.</h3><p>Het geld is door de politie in beslag genomen.</p></div></section>}
    </>}
    {done&&<div className="arrest-result-reveal">
      <div className="success-seal">{keptMoney?'OPERATIE MISLUKT':'MISSIE VOLTOOID'}</div>
      <p>{keptMoney?`Victor leek bij ${team.buyerChat?.location||'de overdracht'} te ontkomen, maar werd alsnog gearresteerd. Tijdens zijn verhoor verlinkte hij jullie. Het rechercheteam is aangehouden en het volledige geldbedrag is in beslag genomen.`:`Victor is bij ${team.buyerChat?.location||'de overdracht'} om ${team.buyerChat?.meetingTime||'het afgesproken tijdstip'} aangehouden. Johnny zat al vast.`}</p>
      <div className="result-grid">
        <article><span>JOHNNY JATWERK</span><strong>Eerder aangehouden</strong></article>
        <article><span>VICTOR VALMONT</span><strong>Aangehouden</strong></article>
        <article><span>DE ZWARTE LOTUS</span><strong>Veiliggesteld</strong></article>
        <article><span>GELD</span><strong>{keptMoney?'In beslag genomen':'Bewijs politie'}</strong></article>
        {keptMoney&&<article><span>RECHERCHEURS</span><strong>Zelf aangehouden</strong></article>}
      </div>
      <div className="case-stamp">{keptMoney?'ZAAK TEGEN RECHERCHEURS':'ZAAK GESLOTEN'}</div>
    </div>}
  </section>;
}


// De politiekeuze is een korte omweg, geen aparte verhaallijn.
// Het team krijgt vijf strafminuten en gaat daarna verder met Johnny.
function PoliceRoutePage({loading,feedback,infiltrateJohnny}) {
  return <section className="panel cinematic police-route-panel">
    <div className="police-route-header">
      <div className="section-label">OPERATIE SCHADUWJACHT · NOODBRIEFING</div>
      <span className="police-route-tag">POLITIE INGELICHT</span>
    </div>
    <h2>“Zijn jullie wel goed bij je hoofd?!”</h2>
    <div className="inspector-final-briefing">
      <div className="final-inspector-portrait"><img src="/assets/inspector-kist.jpg" alt="De woedende hoofdinspecteur van Maison Beaumont"/></div>
      <div className="final-inspector-message">
        <span>DRINGEND BERICHT VAN DE HOOFDINSPECTEUR</span>
        <h3>“Wat moet ik hier in hemelsnaam mee, nietsnutten?!”</h3>
        <p>“Jullie willen dat ik de politie eropaf stuur? Op basis waarvan?! Ik heb geen enkel hard bewijs, geen bruikbare aanleiding en geen aanknopingspunt voor een arrestatie!”</p>
        <p>“Zijn jullie helemaal niet goed bij je hoofd? Als we nu ingrijpen, jagen we de hele zaak de mist in. De Zwarte Lotus verdwijnt en wij staan met lege handen.”</p>
        <p>“Er zit nog maar één ding op: <strong>infiltreren!</strong> Doe alsof jullie met Johnny samenwerken, win zijn vertrouwen en ontdek waar die steen werkelijk is.”</p>
        <p><strong>“Neem als de bliksem contact op met Johnny Jatwerk! HUP, AAN HET WERK!”</strong></p>
      </div>
    </div>
    <div className="police-detour-warning" role="note">
      <strong>GEVOLG VAN DE POLITIEKEUZE · +5 MINUTEN STRAFTIJD</strong>
      <p>De inspecteur stuurt jullie terug naar het infiltratiespoor. Na bevestiging worden vijf strafminuten aan de teamtijd toegevoegd.</p>
    </div>
    <button className="primary" disabled={loading} onClick={infiltrateJohnny}>{loading?'Contact herstellen...':'Toch samenwerken met Johnny · +5 minuten →'}</button>
    {feedback&&<div className="feedback" role="alert">{feedback}</div>}
  </section>;
}

function PuzzleCard({label,title,feedback,children}) {
  return <section className="panel puzzle-card"><div className="section-label">{label}</div><h2>{title}</h2>{children}{feedback&&<div className="feedback" aria-live="polite">{feedback}</div>}</section>;
}

function AnswerForm({onSubmit,loading,placeholder,button,maxLength=12,inputMode='text'}) {
  const [value,setValue]=useState('');
  const submit = async (e)=>{ e.preventDefault(); const ok=await onSubmit(value); if(!ok) setValue(value); };
  return <form className="answer-form" onSubmit={submit}><input value={value} onChange={e=>setValue(e.target.value)} maxLength={maxLength} inputMode={inputMode} autoComplete="off" required/><button className="primary" disabled={loading}>{loading?'Controleren...':button}</button></form>;
}

createRoot(document.getElementById('root')).render(<Root/>);
