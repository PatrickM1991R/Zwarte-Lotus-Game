# De Zwarte Lotus — v8.0 testpakket

Dit pakket bouwt voort op de aangeleverde v7.8. De twee bestaande verhaallijnen en media zijn behouden.

## GitHub: bronbestanden vervangen

1. Maak eerst een back-up / nieuwe branch van je bestaande repository.
2. Upload de **inhoud** van deze ZIP naar de root van je repository, met behoud van de mappen `client/`, `server/` en `dossier-inleg/`.
3. Overschrijf de bestaande `client/src/main.jsx`, `client/src/styles.css` en `server/src/index.js` en upload de nieuwe documentatie.
4. Controleer dat je hosting (bestaande Render frontend en backend) op deze GitHub-branch is aangesloten.
5. Zet de hieronder genoemde backend environment variables voordat je de nieuwe backend start.

## Beveiligde backendinstellingen

Op de backend-hosting zijn **ADMIN_USERNAME**, **ADMIN_PASSWORD** (sterk, uniek, minimaal 12 tekens), **SESSION_SECRET** (lange willekeurige sleutel) en **DATA_FILE** verplicht voor de productieopstelling. `NODE_ENV=production` vereist dat adminwachtwoord en session secret ingesteld zijn. Plaats wachtwoorden NOOIT in GitHub. De beheerder wordt bij serverstart uit deze variabelen gemaakt / bijgewerkt.

### DATA_FILE — heel belangrijk

De game slaat evenementen, spelbegeleiders, teamresultaten en editorwijzigingen op als JSON-bestand. Gebruik voor een echte spelmiddag een **permanente opslaglocatie** (zoals Render Persistent Disk); bijvoorbeeld `DATA_FILE=/var/data/zwarte-lotus-state.json`. Zonder permanente schijf kan een redeploy, crash of restart alle evenementen en resultaten wissen. De `DATABASE_URL` uit de oude versie wordt door deze versie NIET gebruikt. Deze versie is niet geschikt voor meerdere gelijktijdige backend-instanties. Maak vooraf een back-up van het opslagbestand.

## Testprocedure

1. Open het bestaande speldomein, klik op **Inloggen als spelbegeleider of beheerder**.
2. Log in met de beheerder uit ADMIN_USERNAME / ADMIN_PASSWORD.
3. Via **Accounts** maak je een spelbegeleider aan met een persoonlijk wachtwoord van minimaal 12 tekens.
4. Log uit en log opnieuw in als die begeleider.
5. Maak een evenement aan met de naam `27-11-2026 Assen`. Het systeem genereert één willekeurige unieke `LOTUS-...`-code.
6. Open de spelwebsite in een tweede browser/apparaat; vul de evenementcode en een teamnaam in.
7. Een nieuw team verschijnt automatisch binnen circa 2,5 seconden in het bijbehorende dashboard.
8. Als het team start met de timer, gaat de speeltijd lopen zonder dat de spelbegeleider het evenement hoeft te starten.
9. Test **Pauzeer**, **Hervat**, **Volgende fase**, **Stop** en **Reset** op een testteam.
10. Speel beide routes helemaal uit; het einde bevriest de speeltijd en slaat de afsluiting op.

## Wat is nieuw

- Drie gescheiden rollen: beheerder, spelbegeleider, team.
- Een gedeelde code per evenement, met automatisch aangemaakte teams.
- Afzonderlijke dashboards per evenement; live polling iedere 2,5 seconde.
- Automatische timerstart bij teamtimer, automatische finish bij eindfase.
- Tijd, eindtijd, hints, strafminuten, route en ranking per team.
- Begeleider kan teams handmatig bedienen. Acties worden per team gelogd.
- Beheerder kan spelbegeleiders aanmaken en basis-antwoordvarianten / extra instructieteksten wijzigen.
- Alle tekstuele placeholders uit spelers-invoervelden verwijderd. Geen demo-teamcodes in het inlogscherm.
- Onderliggende spelantwoorden blijven server-side.

## Huidige beperkingen / nog af te testen

- De beheereditor kan nu **basisantwoordvarianten en aanvullende instructies** aanpassen. Een complete visuele editor voor alle complexe puzzels, verhaallijnen, assets en audiovisuele scènes is **nog niet ingebouwd**; deze onderdelen worden nog in de broncode aangepast.
- Een gedeelde evenementcode plus teamnaam fungeert als teamtoegang. Een ander apparaat dat dezelfde teamnaam weet, kan hetzelfde team hervatten. Voor extra identiteitscontrole is een extra herstelcode nodig.
- Server-side opslag is één JSON-bestand: géén PostgreSQL-transacties / multi-instance clustering.
- Automatische einde-timers en beide complete verhaallijnen moeten op de **echte hosting** door een begeleider met minimaal twee browsers worden getest.
- In deze bouwomgeving kon de npm registry niet worden bereikt. Backend- en JSX-syntaxis zijn gecontroleerd, maar er is hier geen volledige npm-build of end-to-end browsertest uitgevoerd.
- De bestaande Resend-webhook, geheime dossiers en e-mailintegratie vereisen dezelfde hostinginstellingen als v7.8.

## Lokaal starten

In aparte terminals:

```
cd server
npm install
# stel variabelen in via server/.env (zie .env.example)
npm run dev
```

```
cd client
npm install
npm run dev
```

Frontend API URL: `VITE_API_URL` uit `client/.env.example`.
