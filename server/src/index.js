import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const now = Date.now();
const db = {
  location: { id: 1, name: 'Paviljoen Schoonhoven' },
  event: { id: 1, locationId: 1, name: 'De Zwarte Lotus · Demoavond', status: 'active' },
  teams: [
    { id: 1, eventId: 1, teamName: 'Team Nacht', code: 'LOTUS-4171', currentPhase: 'START', hintCount: 0, chosenRoute: null, status: 'bezig', startedAt: now },
    { id: 2, eventId: 1, teamName: 'Team Karaat', code: 'LOTUS-4172', currentPhase: 'ROTJE_KNOR', hintCount: 0, chosenRoute: null, status: 'bezig', startedAt: now - 36 * 60000 },
    { id: 3, eventId: 1, teamName: 'Team Zwart', code: 'LOTUS-4173', currentPhase: 'KEUZE', hintCount: 2, chosenRoute: 'Johnny', status: 'bezig', startedAt: now - 43 * 60000 },
    { id: 4, eventId: 1, teamName: 'Team Lotus', code: 'LOTUS-4174', currentPhase: 'KLUIS', hintCount: 1, chosenRoute: 'Johnny', status: 'bezig', startedAt: now - 48 * 60000 }
  ]
};

const phaseAnswers = {
  ALARM: ['14', '20:14', '2014'],
  CAMERA: ['03', '3', 'camera 03', 'camera3'],
  KIST_OPEN: ['1403'],
  ORIGINELE_CONTAINER: ['mbx-4717', 'mbx4717']
};

const phaseNext = {
  START: 'ALARM',
  ALARM: 'CAMERA',
  CAMERA: 'KIST_OPEN',
  KIST_OPEN: 'DOSSIER',
  DOSSIER: 'ORIGINELE_CONTAINER',
  ORIGINELE_CONTAINER: 'ROTJE_KNOR'
};

const enrich = (team) => ({ ...team, locationName: db.location.name, eventName: db.event.name });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/team-login', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const name = String(req.body.teamName || '').trim();
  const team = db.teams.find((t) => t.code === code);
  if (!team) return res.status(401).json({ error: 'Ongeldige spelcode' });
  if (name) team.teamName = name;
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/start', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  if (team.currentPhase === 'START') team.startedAt = Date.now();
  team.currentPhase = 'ALARM';
  res.json({ team: enrich(team) });
});

app.post('/api/teams/:id/answer', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  const phase = String(req.body.phase || team.currentPhase || '').toUpperCase();
  if (phase !== team.currentPhase) return res.status(409).json({ error: 'Deze puzzel is niet actief voor dit team.' });

  if (phase === 'DOSSIER') {
    const selected = Array.isArray(req.body.answer) ? req.body.answer.map(x => String(x).toLowerCase()).sort() : [];
    const correct = ['carla','don','freddy','johnny'].sort();
    const isCorrect = selected.length === 4 && selected.every((x,i) => x === correct[i]);
    if (!isCorrect) return res.status(422).json({ correct: false, error: 'De samenstelling klopt niet. Controleer welke vier rollen noodzakelijk waren voor techniek, documenten, koper en transport.' });
  } else {
    const answer = String(req.body.answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const accepted = (phaseAnswers[phase] || []).map((x) => x.toLowerCase());
    if (!accepted.includes(answer)) return res.status(422).json({ correct: false, error: 'Dat antwoord klopt nog niet.' });
  }

  team.currentPhase = phaseNext[phase] || team.currentPhase;
  res.json({ correct: true, team: enrich(team) });
});

app.post('/api/teams/:id/hint', (req, res) => {
  const team = db.teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Team niet gevonden' });
  team.hintCount += 1;
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

app.get('/api/facilitator/location/:id', (req, res) => {
  if (Number(req.params.id) !== db.location.id) return res.status(404).json({ error: 'Locatie niet gevonden' });
  const teams = db.teams.map((t) => ({ ...t, elapsedMinutes: Math.max(0, Math.floor((Date.now() - t.startedAt) / 60000)) }));
  res.json({ location: db.location, event: db.event, teams });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Zwarte Lotus API draait op ${port}`));
