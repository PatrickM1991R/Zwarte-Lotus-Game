# De Zwarte Lotus — spelplatform v0.2

Werkende basis voor het dinerspel.

## v0.2

De echte openingsflow is ingebouwd:

1. Introductie Maison Beaumont
2. Alarmfragment → antwoord 14
3. Camerafeeds → antwoord 03
4. Kistcode → 1403
5. Overgang naar dossierfase

Nieuwe teams starten op fase START met 0 hints. De testknop is uit de spelersomgeving verwijderd.

## Demo

Teamcode: `LOTUS-4171`

## Render

Backend: Node/Express vanuit `server/`.
Frontend: Vite/React vanuit `client/`.
Frontend environment variable:

`VITE_API_URL=https://zwarte-lotus-api.onrender.com`

## v0.3
- Dossierfase interactief gemaakt.
- Acht verdachten zichtbaar in de spelersomgeving.
- Spelers moeten precies vier verdachten selecteren.
- Juiste heist-team: Carla Kraak, Freddy Flessentrekker, Don Diamantini en Johnny Jatwerk.
- Verkeerde combinatie geeft alleen een inhoudelijke hint, niet de oplossing.
- Juiste combinatie ontgrendelt de fase `ORIGINELE_CONTAINER`.

## v0.4
- Dossierselectie met portretten van alle acht verdachten.
- Verbeterde foutmelding en instructie dat niet elke verdachte bij de roof hoort.
- Oorspronkelijke containerpuzzel toegevoegd met drie filters: Dock 17 → 20:15 → Zwitserland → MBX-4717.
