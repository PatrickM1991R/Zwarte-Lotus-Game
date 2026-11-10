# De Zwarte Lotus v8.2 — opening aangepast

## Wat is gewijzigd?
- De inspecteursbriefing is behouden op de openingspagina (`/assets/inspector-briefing.mp3`).
- Het alarmfragment is opnieuw toegevoegd aan de openingspagina (`/assets/alarmfragment.mp3`).
- De vraag luidt nu: "Reconstrueer de code van het onderzoek."
- De instructie luidt: "Gebruik de camerabeelden en het alarmbandje."
- Beide audiobestanden kunnen opnieuw worden afgespeeld.
- De viercijferige code blijft server-side gecontroleerd en alle bestaande timer- en strafminuutregels blijven ongewijzigd.
- De alarmspeler staat bij de onderzoeksvraag, na de briefing; de timer start nog steeds na het volledig afluisteren van de inspecteursbriefing.

## Upload naar GitHub
Je kunt de complete repository uit dit ZIP-bestand uploaden, of alleen `client/src/main.jsx`, `client/src/styles.css` en waar nodig de twee MP3-bestanden onder `client/public/assets/` vervangen.

## Test
1. Open een nieuwe testsessie, luister de briefing volledig af.
2. Controleer of de timer start en of `Alarmfragment Maison Beaumont` afspeelbaar is.
3. Controleer de tekst, het lege viercijferige antwoordveld en de overgang naar fase 2.
4. Controleer na een refresh of de timer doorloopt en de audio opnieuw afspeelbaar blijft.

Let op: dit is een broncodecorrectie, nog niet gevalideerd op de live Render-site.
