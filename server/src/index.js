import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INFILTRANT_ACCESS_CODE = process.env.INFILTRANT_ACCESS_CODE || 'KZ-731';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const INFILTRANT_FROM_EMAIL = process.env.INFILTRANT_FROM_EMAIL || 'De Zwarte Lotus <onboarding@resend.dev>';
const KOOS_INBOUND_EMAIL = (process.env.KOOS_INBOUND_EMAIL || '').trim().toLowerCase();
const KOOS_FROM_EMAIL = process.env.KOOS_FROM_EMAIL || INFILTRANT_FROM_EMAIL;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
const processedKoosMail = new Set();
const app = express();
app.use(cors());
// Beveiligde inkomende e-mail: Koos Toms (ongeacht onderwerp of berichttekst).
// De webhook staat vóór express.json(): de ruwe bytes zijn nodig voor de Svix-handtekening.
function verifyResendWebhook(raw, req) {
  const id = req.get('svix-id') || '';
  const timestamp = req.get('svix-timestamp') || '';
  const signatures = req.get('svix-signature') || '';
  if (!RESEND_WEBHOOK_SECRET || !id || !/^\d+$/.test(timestamp) || !signatures) return false;
  if (Math.abs(Math.floor(Date.now()/1000)-Number(timestamp)) > 300) return false;
  const secret = RESEND_WEBHOOK_SECRET.replace(/^whsec_/, '');
  let key;
  try { key = Buffer.from(secret, 'base64'); } catch { return false; }
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${raw}`).digest();
  return signatures.split(/\s+/).some(part => {
    const match = part.match(/^v1,(.+)$/);
    if (!match) return false;
    try {const actual = Buffer.from(match[1], 'base64');return actual.length===expected.length && timingSafeEqual(actual,expected);}catch{return false;}
  });
}

app.post('/api/webhooks/koos-toms', express.text({type:'application/json',limit:'250kb'}), async (req,res)=>{
  const raw = req.body;
  if (typeof raw !== 'string' || !verifyResendWebhook(raw, req)) return res.status(401).json({error:'Ongeldige webhook-handtekening'});
  let event;
  try {event=JSON.parse(raw);} catch {return res.status(400).json({error:'Ongeldige JSON'});}
  if (event.type !== 'email.received') return res.json({ok:true,ignored:true});
  if (!KOOS_INBOUND_EMAIL || !RESEND_API_KEY) return res.status(503).json({error:'Koos Toms is nog niet geconfigureerd.'});
  const recipients = Array.isArray(event.data?.to) ? event.data.to.map(v=>String(v).trim().toLowerCase()) : [];
  if (!recipients.includes(KOOS_INBOUND_EMAIL)) return res.json({ok:true,ignored:true});
  const emailId = String(event.data?.email_id||'');
  const fromRaw = String(event.data?.from||'');
  const from = (fromRaw.match(/<([^<>]+)>/)?.[1] || fromRaw).trim().toLowerCase();
  if (!emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) return res.json({ok:true,ignored:true});
  // Voorkom een mail-loop en dubbele replies na eventuele webhook-herlevering.
  const outgoingAddress = (KOOS_FROM_EMAIL.match(/<([^<>]+)>/)?.[1] || KOOS_FROM_EMAIL).trim().toLowerCase();
  if (from===outgoingAddress || from===KOOS_INBOUND_EMAIL || processedKoosMail.has(emailId)) return res.json({ok:true,ignored:true});
  try {
    const attachmentPath=path.resolve(__dirname,'../assets/transportregister-herkomst-koos-toms.pdf');
    const content=fs.readFileSync(attachmentPath).toString('base64');
    const donNotesPath=path.resolve(__dirname,'../assets/aantekeningen-don-diamantini.pdf');
    const donNotesContent=fs.readFileSync(donNotesPath).toString('base64');
    const result=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:KOOS_FROM_EMAIL,
        to:[from],
        subject:'RE: Vertrouwelijk – transportregistratie',
        text:'Rob Berie,\n\nIk heb de transportregistraties voor je opgehaald. In de bijlage vind je de containerlijst met de geregistreerde herkomstlanden.\n\nTussen de containerpapieren vond ik ook nog een blad met aantekeningen van Don Diamantini. Geen idee waarom dat ertussen lag, maar ik stuur het je mee. Misschien kun jij er wat mee.\n\nIk kan niet te lang in dit systeem blijven. Hou dit tussen ons.\n\nKoos Toms\nDouane',
        attachments:[{filename:'Transportregister-herkomst-Koos-Toms.pdf',content},{filename:'Aantekeningen-Don-Diamantini.pdf',content:donNotesContent}]
      })
    });
    const data=await result.json().catch(()=>({}));
    if (!result.ok) {console.error('Koos mail delivery:',result.status,data.message||'onbekend');return res.status(502).json({error:'Koos kon de mail niet versturen'});}
    processedKoosMail.add(emailId);
    if(processedKoosMail.size>2000)processedKoosMail.clear();
    res.json({ok:true});
  }catch(error){console.error('Koos mail error',error);res.status(500).json({error:'Verzending mislukt'});}
});

app.use(express.json());

const now = Date.now();
const db = {
  location: { id: 1, name: 'Spellocatie' },
  event: { id: 1, locationId: 1, name: 'De Zwarte Lotus · Demoavond', status: 'active' },
  teams: [
    { id: 1, eventId: 1, teamName: 'Team Nacht', code: 'LOTUS-4171', currentPhase: 'START', hintCount: 0, chosenRoute: null, finalChoice: null, status: 'bezig', startedAt: now, timerStartedAt: null, charactersConfigured: false, participants: [], dossierPlan: null },
    { id: 2, eventId: 1, teamName: 'Team Karaat', code: 'LOTUS-4172', currentPhase: 'ROTJE_KNOR', hintCount: 0, chosenRoute: null, finalChoice: null, status: 'bezig', startedAt: now - 36 * 60000, timerStartedAt: null, charactersConfigured: true, participants: [], dossierPlan: null },
    { id: 3, eventId: 1, teamName: 'Team Zwart', code: 'LOTUS-4173', currentPhase: 'KEUZE', hintCount: 2, chosenRoute: 'Johnny', finalChoice: null, status: 'bezig', startedAt: now - 43 * 60000, timerStartedAt: null, charactersConfigured: true, participants: [], dossierPlan: null },
    { id: 4, eventId: 1, teamName: 'Team Lotus', code: 'LOTUS-4174', currentPhase: 'KLUIS', hintCount: 1, chosenRoute: 'Johnny', finalChoice: null, status: 'bezig', startedAt: now - 48 * 60000, timerStartedAt: null, charactersConfigured: true, participants: [], dossierPlan: null }
  ]
};


const characterDefinitions = {
  'kees-zoek': { name:'Kees Zoek', specialty:'Opsporing & details' },
  'rob-berie': { name:'Rob Berie', specialty:'Roof & criminelen' },
  'al-larm': { name:'Al Larm', specialty:'Beveiliging & tijdlijnen' },
  'cold-case': { name:'Cold Case', specialty:'Analyse & verbanden' },
  'ben-de-bajes': { name:'Ben de Bajes', specialty:'Verdachten & antecedenten' },
  'ferry-fout': { name:'Ferry Fout', specialty:'Afwijkingen & fouten' }
};

const cluePacks = [
  { id:'alarmregister', title:'Alarmregister Maison Beaumont', preferred:'al-larm' },
  { id:'infiltrant-kanaal', title:'Vertrouwelijk contactkanaal infiltrant', preferred:'kees-zoek' },
  { id:'verdachtennetwerk', title:'Verdachtennetwerk en werkwijzen', preferred:'rob-berie' },
  { id:'tijdlijn', title:'Tijdlijn en verbanden', preferred:'cold-case' },
  { id:'antecedenten', title:'Antecedenten en criminele contacten', preferred:'ben-de-bajes' },
  { id:'afwijkingen', title:'Afwijkingen en foutieve registraties', preferred:'ferry-fout' },
  { id:'don-notities', title:'Privé-aantekeningen Don Diamantini', preferred:'cold-case' },
  { id:'transport', title:'Transport- en routebewijs', preferred:'kees-zoek' }
];

function buildDossierPlan(participants) {
  const activeIds = participants.map(p=>p.characterId);
  const load = Object.fromEntries(activeIds.map(id=>[id,0]));
  const plan = Object.fromEntries(activeIds.map(id=>[id,[]]));
  cluePacks.forEach(pack=>{
    let target = activeIds.includes(pack.preferred) ? pack.preferred : [...activeIds].sort((a,b)=>(load[a]||0)-(load[b]||0))[0];
    plan[target].push({id:pack.id,title:pack.title});
    load[target]=(load[target]||0)+1;
  });
  return plan;
}

const phaseAnswers = {
  ALARM: ['14', '20:14', '2014'],
  CAMERA: ['03', '3', 'camera 03', 'camera3'],
  KIST_OPEN: ['1403'],
  ORIGINELE_CONTAINER: ['verder'],
  ORIGINELE_CONTAINER_BEVESTIGEN: ['mbx-4717', 'mbx4717'],
  ROTJE_KNOR: ['beluisterd'],
  JOHNNY_ONTMASKERD: ['johnny', 'j.j.', 'jj', 'johnny jatwerk'],
  JOHNNY_ROUTE: ['locatie bereikt'],
  KLUIS: ['203409']
};

const phaseNext = {
  START: 'ALARM',
  ALARM: 'CAMERA',
  CAMERA: 'KIST_OPEN',
  KIST_OPEN: 'DOSSIER',
  DOSSIER: 'ORIGINELE_CONTAINER',
  ORIGINELE_CONTAINER: 'ORIGINELE_CONTAINER_BEVESTIGEN',
  ORIGINELE_CONTAINER_BEVESTIGEN: 'ROTJE_KNOR',
  ROTJE_KNOR: 'JOHNNY_ONTMASKERD',
  JOHNNY_ONTMASKERD: 'NIEUWE_CONTAINER',
  NIEUWE_CONTAINER: 'KEUZE',
  JOHNNY_ROUTE: 'KLUIS',
  KLUIS: 'LOTUS_GEVONDEN',
  EINDOPERATIE: 'RESULTAAT'
};

const enrich = (team) => ({ ...team, locationName: db.location.name, eventName: db.event.name });

// Eén centrale strafregel voor alle onjuiste spelantwoorden.
function addPenaltyMinute(team) {
  const base = team.timerStartedAt == null ? Date.now() : Number(team.timerStartedAt);
  team.timerStartedAt = base - 60_000;
  team.penaltyMinutes = (team.penaltyMinutes || 0) + 1;
  return team;
}
function wrongGameAnswer(res, team) {
  addPenaltyMinute(team);
  return res.status(422).json({ correct:false, penaltySeconds:60, team:enrich(team), error:'Onjuist antwoord.' });
}
const localStepAnswers = {
  ORIGINELE_CONTAINER:{dock:['17'],arrival:['2015','20:15'],origin:['zwitserland','switzerland','ch']},
  NIEUWE_CONTAINER:{series:['jjx'],time:['2034','20:34'],route:['stille route']},
  KLUIS:{riddle1:['20'],riddle2:['34'],riddle3:['09','9'],code:['203409']},
  EINDOPERATIE:{verification:['niet meer','nietmeer'],codeword:['nachtglas'],time:['23:10','2310']}
};

// Ook lokale tussenstappen worden door de server gevalideerd en bestraft.
app.post('/api/teams/:id/check-step', (req,res)=>{
  const team = db.teams.find(t=>t.id===Number(req.params.id));
  if(!team) return res.status(404).json({error:'Team niet gevonden'});
  const phase=String(req.body.phase||'').toUpperCase();
  const step=String(req.body.step||'');
  if(team.currentPhase!==phase || !Object.hasOwn(localStepAnswers[phase]||{},step))
    return res.status(409).json({error:'Deze puzzelstap is niet actief.'});
  const value=String(req.body.value ?? '').trim().toLowerCase().replace(/\s+/g,' ');
  const valid=localStepAnswers[phase][step].includes(value);
  if(!valid) return wrongGameAnswer(res,team);
  if(phase==='ORIGINELE_CONTAINER') {
    team.completedSteps ??= {};
    team.completedSteps.ORIGINELE_CONTAINER ??= {};
    team.completedSteps.ORIGINELE_CONTAINER[step]=true;
  }
  return res.json({correct:true});
});


app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/infiltrant/verify', (req,res)=>{
  const code=String(req.query.code||'').trim();
  if(code!==INFILTRANT_ACCESS_CODE) return res.status(403).json({ok:false});
  res.json({ok:true});
});

app.post('/api/infiltrant/send-camera', async (req,res)=>{
  const accessCode=String(req.body.accessCode||'').trim();
  const email=String(req.body.email||'').trim().toLowerCase();
  if(accessCode!==INFILTRANT_ACCESS_CODE) return res.status(403).json({error:'Ongeldige dossiercode.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({error:'Vul een geldig e-mailadres in.'});
  if(!RESEND_API_KEY) return res.status(503).json({error:'De mailverbinding is nog niet geconfigureerd op de spelserver.'});
  try{
    const attachmentPath=path.resolve(__dirname,'../assets/camerabeelden-maison-beaumont.png');
    const content=fs.readFileSync(attachmentPath).toString('base64');
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:INFILTRANT_FROM_EMAIL,
        to:[email],
        subject:'VERTROUWELIJK — camerabeelden Maison Beaumont',
        html:`<div style="font-family:Arial,sans-serif;background:#0b0b0d;color:#eee;padding:28px"><div style="max-width:620px;margin:auto"><p style="color:#c9a227;letter-spacing:2px;font-size:12px">VERTROUWELIJKE OVERDRACHT</p><h1 style="font-family:Georgia,serif">Kees Zoek,</h1><p>Zoals afgesproken. Dit is alles wat ik van de server heb kunnen halen.</p><p>Bekijk de camerabeelden goed. Let op de tijdstempels en op welk beeld op het beslissende moment wegvalt.</p><p style="margin-top:30px;color:#999">Verwijder dit bericht zodra je hebt wat je nodig hebt.</p><p>— Abrikoos</p></div></div>`,
        attachments:[{filename:'camerabeelden-maison-beaumont.png',content}]
      })
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) return res.status(502).json({error:data.message||'De infiltrant kon de bestanden niet versturen.'});
    res.json({ok:true,id:data.id||null});
  }catch(err){
    console.error('Infiltrant mail error',err);
    res.status(500).json({error:'De beveiligde overdracht is mislukt.'});
  }
});

app.post('/api/team-login', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const name = String(req.body.teamName || '').trim();
  const team = db.teams.find((t) => t.code === code);
  if (!team) return res.status(401).json({ error: 'Ongeldige spelcode' });
  if (name) team.teamName = name;
  res.json({ team: enrich(team) });
});


app.post('/api/teams/:id/team-setup', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase !== 'START') return res.status(409).json({ error: 'De teamopstelling kan alleen vóór de briefing worden gewijzigd.' });
  const participants = Array.isArray(req.body.participants) ? req.body.participants : [];
  if (participants.length < 2 || participants.length > 6) return res.status(422).json({ error:'Kies tussen 2 en 6 deelnemers.' });
  const names = participants.map(p=>String(p.playerName||'').trim());
  if (names.some(name=>!name)) return res.status(422).json({ error:'Vul voor iedere deelnemer een naam in.' });
  if (new Set(names.map(name=>name.toLowerCase())).size !== names.length) return res.status(422).json({ error:'Gebruik voor iedere deelnemer een unieke naam.' });

  const shuffle = (items) => {
    const copy=[...items];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  };

  const fixedCharacters=['kees-zoek','rob-berie'];
  const optionalCharacters=shuffle(['al-larm','cold-case','ben-de-bajes','ferry-fout']);
  const activeCharacters=[...fixedCharacters,...optionalCharacters.slice(0,Math.max(0,names.length-2))];
  const assignedCharacters=shuffle(activeCharacters);
  const shuffledNames=shuffle(names);
  const assigned = shuffledNames.map((playerName,index)=>({ playerName, characterId:assignedCharacters[index] }));

  team.participants = assigned.map(p=>({...p, characterName:characterDefinitions[p.characterId].name, specialty:characterDefinitions[p.characterId].specialty}));
  team.dossierPlan = buildDossierPlan(assigned);
  team.charactersConfigured = true;
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/start', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (!team.charactersConfigured) return res.status(409).json({ error:'Stel eerst het rechercheteam samen.' });
  if (team.currentPhase === 'START') team.startedAt = Date.now();
  team.currentPhase = 'ALARM';
  res.json({ team: enrich(team) });
});


app.post('/api/teams/:id/opening', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (!['ALARM','CAMERA','KIST_OPEN'].includes(team.currentPhase)) return res.status(409).json({ error: 'De openingspuzzels zijn nu niet actief.' });
  const code = String(req.body.code || '').trim().replace(/\D/g,'');
  // Eén toegangscode vervangt de fysieke kist. De strafminuut blijft voor foutieve pogingen gelden.
  if (code !== '1403') return wrongGameAnswer(res,team);
  team.currentPhase = 'DOSSIER';
  res.json({ correct:true, team: enrich(team) });
});

app.post('/api/teams/:id/answer', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  const phase = String(req.body.phase || team.currentPhase || '').toUpperCase();
  if (phase !== team.currentPhase) return res.status(409).json({ error: 'Deze puzzel is niet actief voor dit team.' });

  if (phase === 'ORIGINELE_CONTAINER') {
    const steps=team.completedSteps?.ORIGINELE_CONTAINER||{};
    if(!steps.dock || !steps.arrival || !steps.origin) return res.status(409).json({error:'Rond eerst het transportonderzoek af.'});
  }

  if (phase === 'DOSSIER') {
    const raw = req.body.answer || {};
    const count = Number(raw.count || 0);
    const entries = Array.isArray(raw.entries) ? raw.entries : [];
    const normalizeName = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g,' ');
    const expected = new Map([
      ['johnny jatwerk','transport'],
      ['don diamantini','koper'],
      ['freddy flessentrekker','documenten'],
      ['carla kraak','techniek']
    ]);
    const submittedNames = entries.map(x=>normalizeName(x.name));
    const uniqueNames = new Set(submittedNames);
    const isCorrect = count===4 && entries.length===4 && uniqueNames.size===4 && entries.every(item=>{
      const name=normalizeName(item.name);
      const skill=String(item.skill||'').trim().toLowerCase();
      return expected.get(name)===skill;
    });
    if (!isCorrect) {
      return wrongGameAnswer(res,team);
    }
  } else if (phase === 'NIEUWE_CONTAINER') {
    const raw = req.body.answer || {};
    const culprit = String(raw.culprit || '').trim().toLowerCase().replace(/\s+/g,' ');
    const container = String(raw.container || '').trim().toLowerCase().replace(/\s+/g,'');
    const culpritOk = ['j.j.','jj','johnny','johnny jatwerk'].includes(culprit);
    const containerOk = ['jjx-2034','jjx2034'].includes(container);
    if (!culpritOk || !containerOk) return wrongGameAnswer(res,team);
  } else if (phase === 'EINDOPERATIE') {
    const raw = req.body.answer || {};
    const a1 = String(raw.answer1 || '').trim().toLowerCase().replace(/\s+/g,' ');
    const a2 = String(raw.answer2 || '').trim().toLowerCase().replace(/\s+/g,' ');
    const a3 = String(raw.answer3 || '').trim().toLowerCase().replace(/\s+/g,' ').replace('.',':');
    const ok1 = ['niet meer','nietmeer'].includes(a1);
    const ok2 = a2 === 'nachtglas';
    const ok3 = ['23:10','2310'].includes(a3);
    if (!ok1 || !ok2 || !ok3) return wrongGameAnswer(res,team);
  } else {
    const answer = String(req.body.answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const accepted = (phaseAnswers[phase] || []).map((x) => x.toLowerCase());
    if (!accepted.includes(answer)) return wrongGameAnswer(res,team);
  }

  team.currentPhase = phaseNext[phase] || team.currentPhase;
  if (phase === 'EINDOPERATIE') team.status = 'klaar';
  res.json({ correct: true, team: enrich(team) });
});

app.post('/api/teams/:id/timer-start', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (!team.timerStartedAt) team.timerStartedAt = Date.now();
  res.json({ team: enrich(team), durationSeconds: 5400 });
});

app.post('/api/teams/:id/hint', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  team.hintCount += 1;
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/route', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase !== 'KEUZE') return res.status(409).json({ error: 'Deze keuze is nu niet actief.' });
  const route = String(req.body.route || '');
  if (!['Johnny','Politie'].includes(route)) return res.status(422).json({ error: 'Ongeldige routekeuze.' });
  team.chosenRoute = route;
  team.currentPhase = route === 'Johnny' ? 'JOHNNY_ROUTE' : 'EINDE';
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/final-choice', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase !== 'LOTUS_GEVONDEN' || team.chosenRoute !== 'Johnny') return res.status(409).json({ error: 'Deze eindkeuze is nu niet actief.' });
  const choice = String(req.body.choice || '');
  if (!['VAL','DUBBELSPEL'].includes(choice)) return res.status(422).json({ error: 'Ongeldige eindkeuze.' });
  team.finalChoice = choice;
  team.currentPhase = 'EINDOPERATIE';
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/progress', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (req.body.currentPhase) team.currentPhase = req.body.currentPhase;
  if (req.body.chosenRoute !== undefined) team.chosenRoute = req.body.chosenRoute;
  if (req.body.hintCount !== undefined) team.hintCount = req.body.hintCount;
  res.json({ team: enrich(team) });
});


app.post('/api/facilitator/teams/:id/reset', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  team.currentPhase = 'START';
  team.hintCount = 0;
  team.chosenRoute = null;
  team.finalChoice = null;
  team.status = 'bezig';
  team.startedAt = Date.now();
  team.timerStartedAt = null;
  team.penaltyMinutes = 0;
  team.dossierLockedUntil = null;
  team.charactersConfigured = false;
  team.participants = [];
  team.dossierPlan = null;
  team.completedSteps = {};
  res.json({ team: enrich(team) });
});

app.get('/api/facilitator/location/:id', (req, res) => {
  if (Number(req.params.id) !== db.location.id) return res.status(404).json({ error: 'Locatie niet gevonden' });
  const teams = db.teams.map((t) => ({ ...t, elapsedMinutes: Math.max(0, Math.floor((Date.now() - t.startedAt) / 60000)) }));
  res.json({ location: db.location, event: db.event, teams });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Zwarte Lotus API draait op ${port}`));
