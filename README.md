# De Zwarte Lotus — spelplatform v0.1

Eerste werkende technische basis voor het dinerspel.

## Wat werkt al
- Team-login met spelcode
- Locatie + spelronde + teams
- Voortgang per team
- Begeleidersdashboard per locatie
- Fase, speeltijd, hints en gekozen route zichtbaar
- Mobielvriendelijke donkere Zwarte Lotus-stijl

## Demo
Teamcode: `LOTUS-4171`
Begeleidersdashboard is vanaf het loginscherm te openen.

## Lokaal starten
```bash
npm install
npm --prefix client install
npm --prefix server install
npm run dev
```
Frontend: http://localhost:5173
API: http://localhost:3001

## Render-opzet
### Server
Maak een Render Web Service vanuit de repository.
Root directory: `server`
Build command: `npm install`
Start command: `npm start`

### Client
Maak een Render Static Site.
Root directory: `client`
Build command: `npm install && npm run build`
Publish directory: `dist`
Environment variable: `VITE_API_URL=https://<jouw-api>.onrender.com`

## Volgende bouwstappen
1. PostgreSQL aansluiten en testdata vervangen.
2. Echte begeleider-login en rollen.
3. Admin: locaties, evenementen en teamcodes aanmaken.
4. Puzzelfases toevoegen (alarm, camera, container, Johnny, kluis).
5. Live updates via polling/WebSocket.
