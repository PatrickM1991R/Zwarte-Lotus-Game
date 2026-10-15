import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const phases = [
  'START','ALARM','CAMERA','KIST_OPEN','DOSSIER','ORIGINELE_CONTAINER','ROTJE_KNOR','JOHNNY_ONTMASKERD','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','EINDE'
];

function App(){
  const [mode,setMode]=useState('login');
  const [team,setTeam]=useState(null);
  const [dashboard,setDashboard]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const loginTeam = async (e)=>{
    e.preventDefault(); setError(''); setLoading(true);
    const form=new FormData(e.currentTarget);
    try{
      const r=await fetch(`${API}/api/team-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamName:form.get('teamName'),code:form.get('code')})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||'Inloggen mislukt');
      setTeam(j.team); setMode('game');
    }catch(err){setError(err.message)} finally{setLoading(false)}
  };

  const loadDashboard = async ()=>{
    setLoading(true); setError('');
    try{
      const r=await fetch(`${API}/api/facilitator/location/1`); const j=await r.json(); if(!r.ok) throw new Error(j.error||'Dashboard niet beschikbaar');
      setDashboard(j); setMode('facilitator');
    }catch(err){setError(err.message)} finally{setLoading(false)}
  };

  const advance = async ()=>{
    if(!team) return;
    const idx=Math.max(0,phases.indexOf(team.currentPhase)); const next=phases[Math.min(idx+1,phases.length-1)];
    const r=await fetch(`${API}/api/teams/${team.id}/progress`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPhase:next})});
    const j=await r.json(); setTeam(j.team);
  };

  if(mode==='game' && team){
    const idx=Math.max(0,phases.indexOf(team.currentPhase));
    return <main className="app-shell">
      <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Uitloggen</button><div className="eyebrow">DE ZWARTE LOTUS</div></section>
      <section className="hero compact"><div><span className="chip">{team.locationName}</span><h1>{team.teamName}</h1><p>Spelronde: {team.eventName}</p></div><div className="progress-ring">{Math.round((idx/(phases.length-1))*100)}%</div></section>
      <section className="panel"><div className="section-label">HUIDIGE FASE</div><h2>{team.currentPhase.replaceAll('_',' ')}</h2><p>Dit is de technische basis. Hier komt straks de daadwerkelijke puzzelinhoud van deze fase.</p><div className="actions"><button className="primary" onClick={advance}>Test: volgende fase</button><button className="secondary" onClick={()=>setTeam({...team,hintCount:team.hintCount+1})}>Hint aanvragen</button></div></section>
      <section className="stats"><div><strong>{team.hintCount}</strong><span>Hints</span></div><div><strong>{idx+1}/{phases.length}</strong><span>Fase</span></div><div><strong>{team.chosenRoute||'—'}</strong><span>Route</span></div></section>
    </main>
  }

  if(mode==='facilitator' && dashboard){
    return <main className="app-shell wide">
      <section className="topbar"><button className="ghost" onClick={()=>setMode('login')}>← Terug</button><div className="eyebrow">SPELBEGELEIDER</div></section>
      <section className="hero compact"><div><span className="chip">LOCATIE</span><h1>{dashboard.location.name}</h1><p>{dashboard.event.name} · {dashboard.teams.length} teams actief</p></div><button className="secondary" onClick={loadDashboard}>Vernieuwen</button></section>
      <section className="table-card"><table><thead><tr><th>Team</th><th>Fase</th><th>Tijd</th><th>Hints</th><th>Route</th><th>Status</th></tr></thead><tbody>{dashboard.teams.map(t=><tr key={t.id}><td><strong>{t.teamName}</strong></td><td>{t.currentPhase.replaceAll('_',' ')}</td><td>{t.elapsedMinutes} min</td><td>{t.hintCount}</td><td>{t.chosenRoute||'—'}</td><td><span className={`status ${t.status}`}>{t.status}</span></td></tr>)}</tbody></table></section>
    </main>
  }

  return <main className="login-wrap">
    <section className="brand"><div className="lotus-mark">✦</div><div className="eyebrow">MAISON BEAUMONT</div><h1>DE ZWARTE LOTUS</h1><p>Een interactief onderzoek naar de verdwenen zwarte diamant.</p></section>
    <section className="login-card">
      <form onSubmit={loginTeam}><label>Teamnaam<input name="teamName" placeholder="Bijv. Team Nacht" required/></label><label>Spelcode<input name="code" placeholder="LOTUS-4171" autoCapitalize="characters" required/></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={loading}>{loading?'Controleren...':'Start het onderzoek'}</button></form>
      <div className="divider"><span>spelbegeleider</span></div>
      <button className="secondary full" onClick={loadDashboard} disabled={loading}>Open locatiedashboard</button>
      <p className="demo">Demo teamcode: <strong>LOTUS-4171</strong></p>
    </section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
