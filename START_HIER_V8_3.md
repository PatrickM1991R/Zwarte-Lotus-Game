# De Zwarte Lotus v8.3 – visuele openingsfase

## Aanpassingen
- Openingsscherm: aparte inspecteursbriefing, duidelijke onderzoeksopdracht, visueel onderscheiden camerabron en alarmfragment, en een centrale invoer voor de viercijferige onderzoekscode.
- Spelklok: label 'LIVE SPEELTIJD' met doeltijd 90:00 en overschrijding apart vermeld. De werkelijke tijd loopt door; er is geen automatische stop toegevoegd.
- Bestaande audio, codevalidatie, strafminuten en fase-overgang zijn niet gewijzigd.
- Geen voorbeeldantwoord en geen placeholder in het codeveld.

## Installatie in GitHub
Gebruik de volledige ZIP of vervang uitsluitend `client/src/main.jsx` en `client/src/styles.css` uit de hotfix. Upload de inhoud naar de repository-root en commit de wijzigingen. Controleer na de automatische Render-deploy de openingsbriefing, audio, het antwoordveld en de teller met een nieuwe testteamsessie. Een al lopende sessie van 154 minuten blijft doorlopen, omdat de serverstarttijd bewust niet wordt gereset.

## Teststatus
Backend JavaScript-syntaxis gecontroleerd; volledige React-build en live functietest niet uitgevoerd in deze omgeving. Maak een GitHub-back-up voor overschrijven.
