# De Zwarte Lotus v9.7 — Verdachtencontrole en hintmeldingen

## Nieuw

1. Fase 1: uitleg dat de volgorde van de bewijsstukken niet gevolgd hoeft te worden. De tekst is niet vetgedrukt.
2. Fase 2: uitleg over vaardigheden voor de diamantroof (beveiliging, documenten, transport, handel/afzet). Eerst aantal, daarna elke verdachte afzonderlijk en ten slotte diens kwaliteit. Iedere correcte naam en correcte kwaliteit krijgt groen. Foutieve controle kost 1 strafminuut.
3. Hint aanvragen: het team verstuurt een hintverzoek. Het spelbeheerdersdashboard toont automatisch een pop-up met teamnaam en fase (dashboard ververst elke 2,5 seconde). De begeleider kan het verzoek afhandelen. Dit werkt met alle bestaande knoppen ‘Hint aanvragen’. De hinttekst wordt niet meer automatisch aan spelers getoond; de spelbegeleider geeft de hint.

## Installatie

Pak de VOLLEDIG-ZIP uit en upload de inhoud naar GitHub met overschrijven van bestaande bestanden. Frontend én backend opnieuw deployen op Render. Behoud je Render-omgevingsvariabelen en persistente dataopslag.

## Test

- Kies een team in fase 1: zie expliciete niet-vaste volgorde.
- Fase 2: toets 4, vervolgens Johnny Jatwerk/transport, Don Diamantini/koper, Freddy Flessentrekker/documenten en Carla Kraak/techniek in willekeurige volgorde. Controleer de groene markeringen na elke juiste stap.
- Toets opzettelijk een foute verdachte: de server moet 1 minuut tijdstraf toekennen.
- Open tegelijk het spelersscherm en het dashboard voor hetzelfde evenement. Vraag een hint aan; de pop-up moet binnen enkele seconden verschijnen en na afhandelen verdwijnen.

Opmerking: de frontend is syntactisch geparseerd en de backend is met `node --check` gecontroleerd. Een volledige Render-integratietest moet nog plaatsvinden.
