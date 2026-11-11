import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INFILTRANT_ACCESS_CODE = process.env.INFILTRANT_ACCESS_CODE || 'KZ-731';
const ROTJE_ACCESS_CODE = process.env.ROTJE_ACCESS_CODE || 'CK-842';
const ROTJE_RECEIPT_CODE = 'RK-7318';
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
        text:'Onderzoeksteam,\n\nIk heb de transportregistraties voor je opgehaald. In de bijlage vind je de containerlijst met de geregistreerde herkomstlanden.\n\nTussen de containerpapieren vond ik ook nog een blad met aantekeningen van Don Diamantini. Geen idee waarom dat ertussen lag, maar ik stuur het je mee. Misschien kun jij er wat mee.\n\nIk kan niet te lang in dit systeem blijven. Hou dit tussen ons.\n\nKoos Toms\nDouane',
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

// Persistente sessiegegevens: zet DATA_FILE op een permanente schijf in productie.
const DATA_FILE = process.env.DATA_FILE || path.resolve(__dirname, '../data/game-state.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || 'ONLY-FOR-LOCAL-DEV-CHANGE-ME';
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD)) {
  throw new Error('SESSION_SECRET en ADMIN_PASSWORD moeten in productie zijn ingesteld.');
}
function passwordHash(password, salt=randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(String(password), salt, 64).toString('hex')}`;
}
function passwordMatches(password, saved) {
  if (!saved || !saved.includes(':')) return false;
  const [salt, digest] = saved.split(':');
  const actual = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(digest,'hex');
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
const db = { events: [], teams: [], users: [], config: {answerOverrides:{}, playerNotes:{}} };
try {
  const stored=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
  for(const key of ['events','teams','users']) if(Array.isArray(stored[key])) db[key]=stored[key];
  if(stored.config) db.config=stored.config;
} catch(e) { if(e.code!=='ENOENT') throw e; }
if (process.env.ADMIN_PASSWORD) {
  const admin=db.users.find(u=>u.role==='admin' && u.username===(process.env.ADMIN_USERNAME||'admin'));
  if(!admin) db.users.push({id:randomBytes(12).toString('hex'),username:process.env.ADMIN_USERNAME||'admin',role:'admin',passwordHash:passwordHash(process.env.ADMIN_PASSWORD)});
  else if(!passwordMatches(process.env.ADMIN_PASSWORD,admin.passwordHash)) admin.passwordHash=passwordHash(process.env.ADMIN_PASSWORD);
}
function persist() {
  fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});
  const tmp=DATA_FILE+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(db,null,2));
  fs.renameSync(tmp,DATA_FILE);
}
persist();
function sign(payload) {
  const body=Buffer.from(JSON.stringify({...payload,expiresAt:Date.now()+1000*60*60*24*7})).toString('base64url');
  const mac=createHmac('sha256',TOKEN_SECRET).update(body).digest('base64url');
  return body+'.'+mac;
}
function verify(token) {
  try {
    const [body,mac]=String(token||'').split('.');
    if(!body||!mac)return null;
    const expected=createHmac('sha256',TOKEN_SECRET).update(body).digest();
    const given=Buffer.from(mac,'base64url');
    if(expected.length!==given.length||!timingSafeEqual(expected,given))return null;
    const value=JSON.parse(Buffer.from(body,'base64url').toString());
    return value.expiresAt>Date.now()?value:null;
  }catch{return null;}
}
function auth(req) { return verify((req.get('Authorization')||'').replace(/^Bearer\s+/i,'')); }
function staff(req) {
  const token=auth(req); if(!token || token.type!=='staff')return null;
  return db.users.find(u=>u.id===token.id && u.role===token.role)||null;
}
function permittedEvent(req,event) {
  const user=staff(req);
  return user && event && (user.role==='admin'||event.ownerId===user.id);
}
function teamView(team) {
  const ended=team.finishedAt||team.stoppedAt;
  const elapsedMs=team.timerStartedAt ? Math.max(0,(ended||Date.now())-team.timerStartedAt-(team.totalPausedMs||0)-(team.pausedAt ? (ended||Date.now())-team.pausedAt:0)) : 0;
  return {...team,elapsedSeconds:Math.floor(elapsedMs/1000),elapsedMinutes:Math.floor(elapsedMs/60000),endTime:ended||null};
}
function finishTeam(team) {
  if(!team.finishedAt)team.finishedAt=Date.now();
  team.status='klaar';team.pausedAt=null;
}
function guardTeam(req,res,next) {
  const team=db.teams.find(t=>t.id===Number(req.params.id));
  if(!team)return res.status(404).json({error:'Team niet gevonden'});
  const token=auth(req);
  if(token?.type==='team'&&token.id===team.id){if((team.status==='klaar'||team.status==='gestopt'||team.pausedAt) && req.method!=='GET')return res.status(409).json({error:'Dit team is afgerond, gestopt of gepauzeerd.'});return next();}
  if(permittedEvent(req,db.events.find(e=>e.id===team.eventId)))return next();
  return res.status(401).json({error:'Niet ingelogd voor dit team.'});
}
// Alle spelmutaties worden eerst duurzaam opgeslagen voor ze aan de client bevestigd worden.
app.use((req,res,next)=>{
  const original=res.json.bind(res);
  res.json=(value)=>{if(req.method!=='GET')persist();return original(value);};
  next();
});
app.use('/api/teams/:id',guardTeam);


const phaseAnswers = {
  ALARM: ['14', '20:14', '2014'],
  CAMERA: ['03', '3', 'camera 03', 'camera3'],
  KIST_OPEN: ['1403'],
  ORIGINELE_CONTAINER: ['verder'],
  ORIGINELE_CONTAINER_BEVESTIGEN: ['mbx-4717', 'mbx4717'],
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
  ROTJE_KNOR: 'NIEUWE_CONTAINER',
  JOHNNY_ONTMASKERD: 'NIEUWE_CONTAINER',
  NIEUWE_CONTAINER: 'KEUZE',
  JOHNNY_ROUTE: 'KLUIS',
  KLUIS: 'LOTUS_GEVONDEN',
  LOTUS_GEVONDEN: 'JOHNNY_MELDEN',
  EINDOPERATIE: 'RESULTAAT',
  POLITIE_BRIEFING: 'POLITIE_CAMERA',
  POLITIE_CAMERA: 'POLITIE_LEK',
  POLITIE_LEK: 'POLITIE_INVAL',
  POLITIE_INVAL: 'POLITIE_COMMUNICATIE',
  POLITIE_COMMUNICATIE: 'POLITIE_DIAMANT',
  POLITIE_DIAMANT: 'POLITIE_COORDINATIE',
  POLITIE_COORDINATIE: 'POLITIE_FINALE',
  POLITIE_FINALE: 'POLITIE_RESULTAAT'
};

const FINAL_DECISION_MS = 3 * 60 * 1000;
// Operatiedossier B wordt door de spelbegeleider/inspecteur uitgereikt.
// Alleen het politiekanaal mag deze code ontvangen, nooit de koper.
const POLICE_CODE_B = process.env.POLICE_OPERATION_CODE || 'NV-07419';
const JOHNNY_HIDEOUT = 'Chauffeurskeet achter Laadperron 9';
function initialBuyerChat() {
  return {stage:'codeword1', location:'', meetingTime:'', messages:[
    {from:'Victor Valmont',text:'V.V.-37. Codewoord 1?'}
  ]};
}
function enforceFinalDeadline(team) {
  if (team.currentPhase === 'KOPER_KEUZE' && !team.finalDecisionStartedAt) team.finalDecisionStartedAt=Date.now();
  if (team.currentPhase === 'KOPER_KEUZE' && !team.finalChoice &&
      Date.now() >= team.finalDecisionStartedAt + FINAL_DECISION_MS) {
    team.finalChoice='VAL';
    team.finalChoiceTimedOut=true;
    team.currentPhase='RESULTAAT';
    finishTeam(team);
    team.arrestStartedAt=Date.now();
    persist();
  }
}
const enrich = (team) => {
  enforceFinalDeadline(team);
  return { ...teamView(team), editorNote:db.config.playerNotes?.[team.currentPhase]||'', locationName: db.events.find(e=>e.id===team.eventId)?.name || '', eventName: db.events.find(e=>e.id===team.eventId)?.name || '' };
};

// Eén centrale strafregel voor alle onjuiste spelantwoorden en terugnavigatie.
function addPenaltyMinutes(team, amount = 1) {
  const minutes = Math.max(1, Number(amount) || 1);
  const base = team.timerStartedAt == null ? Date.now() : Number(team.timerStartedAt);
  team.timerStartedAt = base - (minutes * 60_000);
  team.penaltyMinutes = (team.penaltyMinutes || 0) + minutes;
  return team;
}
function addPenaltyMinute(team) {
  return addPenaltyMinutes(team, 1);
}
function wrongGameAnswer(res, team) {
  addPenaltyMinute(team);
  return res.status(422).json({ correct:false, penaltySeconds:60, team:enrich(team), error:'Onjuist antwoord.' });
}
const previousPhase = {
  ALARM:'START',
  DOSSIER:'ALARM',
  ORIGINELE_CONTAINER:'DOSSIER',
  ORIGINELE_CONTAINER_BEVESTIGEN:'ORIGINELE_CONTAINER',
  ROTJE_KNOR:'ORIGINELE_CONTAINER_BEVESTIGEN',
  JOHNNY_ONTMASKERD:'ROTJE_KNOR',
  NIEUWE_CONTAINER:'ROTJE_KNOR',
  KEUZE:'NIEUWE_CONTAINER',
  JOHNNY_ROUTE:'KEUZE',
  KLUIS:'JOHNNY_ROUTE',
  LOTUS_GEVONDEN:'KLUIS',
  JOHNNY_MELDEN:'LOTUS_GEVONDEN',
  JOHNNY_ARRESTATIE:'JOHNNY_MELDEN',
  EINDOPERATIE:'JOHNNY_ARRESTATIE',
  KOPER_KEUZE:'EINDOPERATIE',
  RESULTAAT:'KOPER_KEUZE',
  POLITIE_BRIEFING:'KEUZE',
  POLITIE_CAMERA:'POLITIE_BRIEFING',
  POLITIE_LEK:'POLITIE_CAMERA',
  POLITIE_INVAL:'POLITIE_LEK',
  POLITIE_COMMUNICATIE:'POLITIE_INVAL',
  POLITIE_DIAMANT:'POLITIE_COMMUNICATIE',
  POLITIE_COORDINATIE:'POLITIE_DIAMANT',
  POLITIE_FINALE:'POLITIE_COORDINATIE',
  POLITIE_RESULTAAT:'POLITIE_FINALE'
};
const localStepAnswers = {
  DOSSIER:{count:['4']},
  ORIGINELE_CONTAINER:{dock:['17'],arrival:['2028','20:28'],origin:['zwitserland','switzerland','ch']},
  KLUIS:{riddle1:['20'],riddle2:['34'],riddle3:['09','9'],code:['203409']},
  EINDOPERATIE:{codeword1:['karaat'],codeword2:['nachtglas']}
};

// Ook lokale tussenstappen worden door de server gevalideerd en bestraft.

app.post('/api/teams/:id/go-back', (req,res)=>{
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  const target = previousPhase[team.currentPhase];
  if (!target) return res.status(409).json({ error: 'Teruggaan is vanaf deze pagina niet beschikbaar.' });
  addPenaltyMinutes(team, 2);
  team.currentPhase = target;
  if (target !== 'KOPER_KEUZE') team.finalDecisionStartedAt = null;
  if (target !== 'RESULTAAT') team.arrestStartedAt = null;
  res.json({ ok:true, penaltySeconds:120, team: enrich(team) });
});

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
  if(phase==='DOSSIER') {
    team.completedSteps ??= {};
    team.completedSteps.DOSSIER ??= {};
    team.completedSteps.DOSSIER[step]=true;
  }
  if(phase==='ORIGINELE_CONTAINER') {
    team.completedSteps ??= {};
    team.completedSteps.ORIGINELE_CONTAINER ??= {};
    team.completedSteps.ORIGINELE_CONTAINER[step]=true;
  }
  return res.json({correct:true,team:enrich(team)});
});


app.get('/api/health', (req, res) => res.json({ ok: true }));

// Beperkt transportregister: inhoud pas vrijgeven nadat de code van Rotje is gevalideerd.
app.post('/api/transport-system/access', (req,res)=>{
  const code=String(req.body?.code||'').trim().toUpperCase().replace(/[–—−]/g,'-').replace(/\s+/g,'');
  if(code!==ROTJE_RECEIPT_CODE) return res.status(403).json({error:'Toegang geweigerd'});
  return res.json({ok:true, record:{
    originalContainer:'MBX-4717', modifiedAt:'20:34', initials:'J.J.',
    modifiedBy:'J.J.', role:'Transport / chauffeur',
    originalStatus:'Lege huls', newContainerSeries:'JJX-reeks', action:'Ongeplande overslag geregistreerd; individueel containernummer afgeschermd'
  }});
});

app.get('/api/rotje/verify', (req,res)=>{
  const code=String(req.query.code||'').trim();
  if(code!==ROTJE_ACCESS_CODE) return res.status(403).json({ok:false});
  res.json({ok:true});
});

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
        html:`<div style="font-family:Arial,sans-serif;background:#0b0b0d;color:#eee;padding:28px"><div style="max-width:620px;margin:auto"><p style="color:#c9a227;letter-spacing:2px;font-size:12px">VERTROUWELIJKE OVERDRACHT</p><h1 style="font-family:Georgia,serif">Onderzoeksteam,</h1><p>Zoals afgesproken. Dit is alles wat ik van de server heb kunnen halen.</p><p>Bekijk de camerabeelden goed. Let op de tijdstempels en op welk beeld op het beslissende moment wegvalt.</p><p style="margin-top:30px;color:#999">Verwijder dit bericht zodra je hebt wat je nodig hebt.</p><p>— Abrikoos</p></div></div>`,
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

app.post('/api/team-login', (req,res)=>{
  const code=String(req.body.code||'').trim().toUpperCase();
  const name=String(req.body.teamName||'').trim().slice(0,64);
  const event=db.events.find(e=>e.code===code);
  if(!event || event.status==='closed')return res.status(401).json({error:'Ongeldige of afgesloten evenementcode.'});
  if(!name)return res.status(422).json({error:'Vul een teamnaam in.'});
  let team=db.teams.find(t=>t.eventId===event.id && t.teamName.toLowerCase()===name.toLowerCase());
  if(!team){
    team={id:Math.max(0,...db.teams.map(t=>t.id))+1,eventId:event.id,teamName:name,currentPhase:'START',hintCount:0,chosenRoute:null,finalChoice:null,status:'wacht',startedAt:null,timerStartedAt:null,charactersConfigured:true,participants:[],dossierPlan:null,penaltyMinutes:0};
    db.teams.push(team);
  }
  res.json({team:enrich(team),token:sign({type:'team',id:team.id})});
});


app.post('/api/teams/:id/start', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase === 'START' && !team.startedAt) team.startedAt = Date.now();
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
    if (!team.completedSteps?.DOSSIER?.count) return res.status(409).json({error:'Controleer eerst het aantal hoofdverdachten.'});
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
  } else if (phase === 'ROTJE_KNOR') {
    const raw = req.body.answer || {};
    const event = String(raw.event || '').trim().toLowerCase();
    const who = String(raw.who || '').trim().toLowerCase().replace(/\s+/g,' ');
    const eventOk = event.length > 0; // Vrije conclusie: iedere niet-lege omschrijving wordt geaccepteerd.
    const whoOk = who === 'johnny jatwerk';
    if(!eventOk || !whoOk) return wrongGameAnswer(res,team);
  } else if (phase === 'NIEUWE_CONTAINER') {
    const raw = req.body.answer || {};
    const container = String(raw.container || '').trim().toLowerCase().replace(/\s+/g,'');
    const containerOk = ['jjx-2034','jjx2034'].includes(container);
    if (!containerOk) return wrongGameAnswer(res,team);
  } else if (phase === 'LOTUS_GEVONDEN') {
    // Deze actie is navigatie vanaf de bewijsstukken, geen puzzelantwoord.
    // Niet door de algemene antwoordcontrole laten lopen: dat gaf onterecht +1 minuut.
    if (String(req.body.answer || '').trim().toLowerCase() !== 'bewijs bekeken') {
      return res.status(409).json({ error:'Bekijk eerst de stukken uit de kluis.' });
    }
    team.currentPhase = 'JOHNNY_MELDEN';
    return res.json({ correct:true, team:enrich(team) });
  } else if (phase === 'JOHNNY_MELDEN') {
    const data=req.body.answer || {};
    const location=String(data.location||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const code=String(data.policeCode||'').toUpperCase().replace(/\s+/g,'');
    if(!location.includes('chauffeurskeet') || !location.includes('laadperron9') ||
       code!==POLICE_CODE_B.toUpperCase().replace(/\s+/g,'')) return wrongGameAnswer(res,team);
    team.johnnyLocation=JOHNNY_HIDEOUT;
    team.johnnyArrestStartedAt=Date.now();
    team.buyerChat=initialBuyerChat();
    team.currentPhase='JOHNNY_ARRESTATIE';
    return res.json({correct:true,team:enrich(team)});
  } else if (phase === 'JOHNNY_ARRESTATIE') {
    if(String(req.body.answer||'')!=='volgende')return res.status(409).json({error:'De arrestatie moet eerst worden afgerond.'});
    if(!team.johnnyArrestStartedAt || Date.now()-team.johnnyArrestStartedAt<9000)return res.status(409).json({error:'De aanhoudingsoperatie is nog bezig.'});
    team.currentPhase='EINDOPERATIE';
    return res.json({correct:true,team:enrich(team)});
  } else if (phase.startsWith('POLITIE_')) {
    if(team.chosenRoute !== 'Politie') return res.status(409).json({error:'Deze verhaallijn is niet actief.'});
    const input = req.body.answer || {};
    const normalized = x => String(x||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
    const matches = (field, expected) => normalized(input[field])===normalized(expected);
    let valid = false;
    if(phase==='POLITIE_BRIEFING') valid=String(input).toLowerCase()==='onderzoek starten';
    if(phase==='POLITIE_CAMERA') valid=matches('camera','06') && matches('exit','west');
    if(phase==='POLITIE_LEK') {
      const proof=normalized(input.proof);
      const cloneEvidence=['gekloondetoegangspas','toegangspasgekloond','gekloondepas','pasgekloond','dubbelepasregistratie','onmogelijkegelijktijdigeaanwezigheid','onmogelijkepasregistratie','pasoptweeplekken','pasoptweeplaatsen','dubbelelocatie','zelfdepasoptweelocaties','vervalstetoegangspas'];
      valid=matches('suspect','Freddy Flessentrekker') && matches('access','FF27') && cloneEvidence.some(v=>proof.includes(v));
    }
    if(phase==='POLITIE_INVAL') valid=String(input).toLowerCase()==='inval afronden' && team.policeRaidStartedAt && (Date.now()-team.policeRaidStartedAt)>=11000;
    if(phase==='POLITIE_COMMUNICATIE') valid=matches('channel','VV37') && matches('time','2310') && matches('location','Perron 3');
    if(phase==='POLITIE_DIAMANT') valid=['b12','koelcelb12'].includes(normalized(input.location)) && matches('seal','ZL09');
    if(phase==='POLITIE_COORDINATIE') valid=matches('code','SCHADUW27') && matches('buyer','Victor Valmont');
    if(phase==='POLITIE_FINALE') valid=String(input).toLowerCase()==='operatie afronden' && team.policeFinalStartedAt && (Date.now()-team.policeFinalStartedAt)>=16000;
    if(!valid) {
      if(['POLITIE_BRIEFING','POLITIE_INVAL','POLITIE_FINALE'].includes(phase)) return res.status(409).json({error:'De operatie kan nog niet worden voortgezet.'});
      return wrongGameAnswer(res,team);
    }
    if(phase==='POLITIE_LEK') team.policeRaidStartedAt=Date.now();
    if(phase==='POLITIE_COORDINATIE') team.policeFinalStartedAt=Date.now();
    if(phase==='POLITIE_FINALE') finishTeam(team);
    team.currentPhase=phaseNext[phase];
    return res.json({correct:true,team:enrich(team)});
  } else if (phase === 'EINDOPERATIE') {
    return res.status(409).json({error:'Gebruik het beveiligde koperskanaal.'});
  } else {
    const answer = String(req.body.answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const accepted = (db.config.answerOverrides?.[phase] || phaseAnswers[phase] || []).map((x) => x.toLowerCase());
    if (!accepted.includes(answer)) return wrongGameAnswer(res,team);
  }

  team.currentPhase = phaseNext[phase] || team.currentPhase;
  if (phase === 'KLUIS') {
    team.finalDecisionStartedAt = null;
    team.finalChoice = null;
    team.buyerChat = null;
    team.johnnyLocation = null;
    team.johnnyArrestStartedAt = null;
  }
  if (phase === 'EINDOPERATIE') finishTeam(team);
  res.json({ correct: true, team: enrich(team) });
});

app.post('/api/teams/:id/timer-start', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (!team.timerStartedAt) { team.timerStartedAt = Date.now(); team.startedAt ??= Date.now(); team.status='bezig'; }
  res.json({ team: enrich(team), durationSeconds: 5400 });
});

app.post('/api/teams/:id/hint', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  team.hintCount += 1;
  res.json({ team: enrich(team) });
});

// Johnny spreekt eerst zijn hele bericht uit. De server start de keuzeperiode
// slechts eenmaal per team, wanneer het audiobandje is afgelopen.
app.post('/api/teams/:id/johnny-offer-start', (req,res)=>{
  const team=db.teams.find(t=>t.id===Number(req.params.id));
  if(!team)return res.status(404).json({error:'Team niet gevonden'});
  if(team.currentPhase!=='KEUZE')return res.status(409).json({error:'Deze keuze is niet actief.'});
  if(!team.johnnyOfferStartedAt)team.johnnyOfferStartedAt=Date.now();
  res.json({team:enrich(team),durationSeconds:30});
});

app.post('/api/teams/:id/route', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase !== 'KEUZE') return res.status(409).json({ error: 'Deze keuze is nu niet actief.' });
  if (!team.johnnyOfferStartedAt) return res.status(409).json({error:'Luister eerst het volledige bericht van Johnny af.'});
  if (Date.now() >= team.johnnyOfferStartedAt + 30_000) return res.status(409).json({error:'De keuzeperiode van 30 seconden is voorbij.'});
  const route = String(req.body.route || '');
  if (!['Johnny','Politie'].includes(route)) return res.status(422).json({ error: 'Ongeldige routekeuze.' });
  team.chosenRoute = route;
  team.currentPhase = route === 'Johnny' ? 'JOHNNY_ROUTE' : 'POLITIE_BRIEFING';
  if(route==='Politie'){team.policeRaidStartedAt=null;team.policeFinalStartedAt=null;team.policeProgress={};}
  res.json({ team: enrich(team) });
});

app.get('/api/teams/:id/final-status', (req,res)=>{
  const team=db.teams.find(t=>t.id===Number(req.params.id));
  if(!team)return res.status(404).json({error:'Team niet gevonden'});
  res.json({team:enrich(team)});
});

app.post('/api/teams/:id/final-choice', (req,res)=>{
  const team=db.teams.find(t=>t.id===Number(req.params.id));
  if(!team)return res.status(404).json({error:'Team niet gevonden'});
  enforceFinalDeadline(team);
  if(team.currentPhase!=='KOPER_KEUZE' || team.chosenRoute!=='Johnny')
    return res.status(409).json({error:'De keuzeperiode is niet actief.',team:enrich(team)});
  const choice=String(req.body.choice||'');
  if(!['VAL','GELD'].includes(choice))return res.status(422).json({error:'Ongeldige keuze.'});
  team.finalChoice=choice;
  team.finalChoiceTimedOut=false;
  team.currentPhase='RESULTAAT';
  finishTeam(team);
  team.arrestStartedAt=Date.now();
  res.json({team:enrich(team)});
});

// Een rollenspel-chat met Victor; geen externe chatdienst en geen echt account bij Victor.
// Alle stappen en berichten staan op de server zodat verversen de voortgang bewaart.
app.post('/api/teams/:id/buyer-chat', (req,res) => {
  const team=db.teams.find(t=>t.id===Number(req.params.id));
  if(!team) return res.status(404).json({error:'Team niet gevonden'});
  if(team.currentPhase!=='EINDOPERATIE' || team.chosenRoute!=='Johnny')
    return res.status(409).json({error:'Het beveiligde kanaal is nog niet beschikbaar.'});
  team.buyerChat ??= initialBuyerChat();
  const chat=team.buyerChat;
  const action=String(req.body.action||'');
  const value=String(req.body.value||'').trim().slice(0,180);
  const norm=value.toLowerCase().replace(/\s+/g,' ');
  const add=(from,text)=>chat.messages.push({from,text});
  if(action==='codeword1' && chat.stage==='codeword1') {
    if(norm!=='karaat')return wrongGameAnswer(res,team);
    add('Team',value);add('Victor Valmont','Codewoord 2?');chat.stage='codeword2';
  } else if(action==='codeword2' && chat.stage==='codeword2') {
    if(norm!=='nachtglas')return wrongGameAnswer(res,team);
    add('Team',value);add('Victor Valmont','De woorden kloppen. Waar en wanneer vindt de overdracht plaats?');chat.stage='location';
  } else if(action==='location' && chat.stage==='location') {
    const time=String(req.body.time||'').trim();
    if(value.length<4 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return wrongGameAnswer(res,team);
    chat.location=value;chat.meetingTime=time;
    add('Team',`${value} · ${time}`);
    add('Victor Valmont',`Afgesproken. ${value}, ${time}. Ik neem het geld mee. Geen politie.`);
    chat.stage='confirmed';
    team.currentPhase='KOPER_KEUZE';
    team.finalDecisionStartedAt=Date.now();
  } else if(action==='launch' && chat.stage==='confirmed') {
    return res.status(409).json({error:'Maak eerst jullie keuze over de koper.'});
  } else {
    return res.status(409).json({error:'Dit bericht past niet bij de huidige chatstap.',team:enrich(team)});
  }
  res.json({ok:true,team:enrich(team)});
});

// Beheerders- en spelbegeleidersportaal
app.post('/api/auth/login',(req,res)=>{
  const user=db.users.find(u=>u.username===String(req.body.username||'').trim().toLowerCase());
  if(!user||!passwordMatches(req.body.password,user.passwordHash))return res.status(401).json({error:'Ongeldige inloggegevens.'});
  res.json({token:sign({type:'staff',id:user.id,role:user.role}),user:{id:user.id,username:user.username,role:user.role}});
});
app.get('/api/auth/me',(req,res)=>{
  const user=staff(req);if(!user)return res.status(401).json({error:'Niet ingelogd.'});
  res.json({user:{id:user.id,username:user.username,role:user.role}});
});
app.get('/api/events',(req,res)=>{
  const user=staff(req);if(!user)return res.status(401).json({error:'Niet ingelogd.'});
  res.json({events:db.events.filter(e=>user.role==='admin'||e.ownerId===user.id).map(e=>({...e,teamCount:db.teams.filter(t=>t.eventId===e.id).length}))});
});
app.post('/api/events',(req,res)=>{
  const user=staff(req);if(!user)return res.status(401).json({error:'Niet ingelogd.'});
  const name=String(req.body.name||'').trim().slice(0,100);
  if(name.length<3)return res.status(422).json({error:'Vul een evenementnaam in.'});
  let code;do{code='LOTUS-'+randomBytes(5).toString('hex').toUpperCase();}while(db.events.some(e=>e.code===code));
  const event={id:Math.max(0,...db.events.map(e=>e.id))+1,name,code,ownerId:user.id,status:'open',createdAt:Date.now()};
  db.events.push(event);res.status(201).json({event});
});
app.get('/api/events/:id',(req,res)=>{
  const event=db.events.find(e=>e.id===Number(req.params.id));
  if(!permittedEvent(req,event))return res.status(403).json({error:'Geen toegang tot dit evenement.'});
  res.json({event,teams:db.teams.filter(t=>t.eventId===event.id).map(teamView)});
});
app.post('/api/events/:id/close',(req,res)=>{
  const event=db.events.find(e=>e.id===Number(req.params.id));
  if(!permittedEvent(req,event))return res.status(403).json({error:'Geen toegang.'});
  event.status='closed';event.closedAt=Date.now();
  for(const team of db.teams.filter(t=>t.eventId===event.id && t.status!=='klaar' && t.status!=='gestopt')){team.stoppedAt=Date.now();team.status='gestopt';}
  res.json({event});
});
app.post('/api/events/:id/teams/:teamId/action',(req,res)=>{
  const event=db.events.find(e=>e.id===Number(req.params.id));
  if(!permittedEvent(req,event))return res.status(403).json({error:'Geen toegang.'});
  const team=db.teams.find(t=>t.id===Number(req.params.teamId)&&t.eventId===event.id);
  if(!team)return res.status(404).json({error:'Team niet gevonden.'});
  const action=String(req.body.action||'');
  if(action==='pause' && !team.pausedAt && team.status==='bezig'){team.pausedAt=Date.now();}
  else if(action==='resume' && team.pausedAt){team.totalPausedMs=(team.totalPausedMs||0)+(Date.now()-team.pausedAt);team.pausedAt=null;}
  else if(action==='stop' && team.status!=='klaar'){team.stoppedAt=Date.now();team.status='gestopt';}
  else if(action==='next' && team.status!=='klaar' && team.status!=='gestopt'){
    const routeSequence=team.chosenRoute==='Politie'
      ? ['START','ALARM','DOSSIER','ORIGINELE_CONTAINER','ORIGINELE_CONTAINER_BEVESTIGEN','ROTJE_KNOR','NIEUWE_CONTAINER','KEUZE','POLITIE_BRIEFING','POLITIE_CAMERA','POLITIE_LEK','POLITIE_INVAL','POLITIE_COMMUNICATIE','POLITIE_DIAMANT','POLITIE_COORDINATIE','POLITIE_FINALE','POLITIE_RESULTAAT']
      : ['START','ALARM','DOSSIER','ORIGINELE_CONTAINER','ORIGINELE_CONTAINER_BEVESTIGEN','ROTJE_KNOR','NIEUWE_CONTAINER','KEUZE','JOHNNY_ROUTE','KLUIS','LOTUS_GEVONDEN','JOHNNY_MELDEN','JOHNNY_ARRESTATIE','EINDOPERATIE','KOPER_KEUZE','RESULTAAT'];
    const idx=routeSequence.indexOf(team.currentPhase);
    const nextPhase=routeSequence[idx+1]||phaseNext[team.currentPhase];
    if(!nextPhase)return res.status(409).json({error:'Geen volgende fase beschikbaar.'});
    if(nextPhase==='KOPER_KEUZE')team.finalDecisionStartedAt=Date.now();
    if(nextPhase==='RESULTAAT'&&!team.finalChoice)team.finalChoice='VAL';
    if(nextPhase==='POLITIE_FINALE')team.policeFinalStartedAt=Date.now();
    if(nextPhase==='JOHNNY_ARRESTATIE')team.johnnyArrestStartedAt=Date.now();
    team.currentPhase=nextPhase;
    if(nextPhase==='RESULTAAT'||nextPhase==='POLITIE_RESULTAAT')finishTeam(team);
  } else if(action==='reset'){
    Object.assign(team,{currentPhase:'START',hintCount:0,chosenRoute:null,finalChoice:null,status:'wacht',startedAt:null,timerStartedAt:null,finishedAt:null,stoppedAt:null,pausedAt:null,totalPausedMs:0,penaltyMinutes:0,charactersConfigured:true,participants:[],dossierPlan:null,completedSteps:{},policeProgress:{},finalDecisionStartedAt:null,buyerChat:null});
  } else if(!['pause','resume','stop','next','reset'].includes(action))return res.status(422).json({error:'Ongeldige actie.'});
  team.manualActions??=[];team.manualActions.push({at:Date.now(),by:staff(req).username,action});
  res.json({team:teamView(team)});
});
app.get('/api/admin/facilitators',(req,res)=>{
  if(staff(req)?.role!=='admin')return res.status(403).json({error:'Alleen voor beheerders.'});
  res.json({users:db.users.map(({id,username,role})=>({id,username,role}))});
});
app.post('/api/admin/facilitators',(req,res)=>{
  if(staff(req)?.role!=='admin')return res.status(403).json({error:'Alleen voor beheerders.'});
  const username=String(req.body.username||'').trim().toLowerCase();
  const password=String(req.body.password||'');
  if(!/^[a-z0-9._-]{3,40}$/.test(username)||password.length<12)return res.status(422).json({error:'Gebruikersnaam minimaal 3 tekens; wachtwoord minimaal 12 tekens.'});
  if(db.users.some(u=>u.username===username))return res.status(409).json({error:'Gebruikersnaam bestaat al.'});
  const user={id:randomBytes(12).toString('hex'),username,role:'facilitator',passwordHash:passwordHash(password)};
  db.users.push(user);res.status(201).json({user:{id:user.id,username,role:user.role}});
});
// Beheerderseditor: configureer veilige antwoordvarianten en aanvullende instructieteksten.
app.get('/api/admin/editor',(req,res)=>{
  if(staff(req)?.role!=='admin')return res.status(403).json({error:'Alleen voor beheerders.'});
  res.json({phases:Object.keys(phaseAnswers),answers:{...phaseAnswers,...(db.config.answerOverrides||{})},notes:db.config.playerNotes||{}});
});
app.put('/api/admin/editor',(req,res)=>{
  if(staff(req)?.role!=='admin')return res.status(403).json({error:'Alleen voor beheerders.'});
  const phase=String(req.body.phase||'');
  if(!Object.hasOwn(phaseAnswers,phase))return res.status(422).json({error:'Ongeldige puzzelfase.'});
  const answers=String(req.body.answers||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(!answers.length||answers.length>40||answers.some(x=>x.length>100))return res.status(422).json({error:'Vul 1 tot 40 antwoordvarianten in.'});
  db.config.answerOverrides??={};db.config.answerOverrides[phase]=answers;
  db.config.playerNotes??={};db.config.playerNotes[phase]=String(req.body.note||'').slice(0,1000);
  res.json({ok:true});
});
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Zwarte Lotus API draait op ${port}`));
