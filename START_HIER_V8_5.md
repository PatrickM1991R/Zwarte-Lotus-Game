# De Zwarte Lotus – v8.5

## Nieuwe controlevraag in fase 2

Op de pagina Verdachtenonderzoek moeten spelers nu eerst afzonderlijk beantwoorden hoeveel hoofdverdachten er zijn. Het antwoord is **4**. Zij drukken op **Controleer aantal**.

- Onjuist antwoord (bijvoorbeeld 3): de backend kent via dezelfde centrale strafregel als de andere puzzels **1 minuut** toe en toont de bestaande straf-overlay.
- Juist antwoord: de vier naam- en vaardigheidsvelden worden zichtbaar.
- De validatie vindt op de server plaats; een directe inzending van de vier namen zonder de afgeronde aantalsvraag wordt geweigerd.
- De correcte tussenstap wordt bij het team opgeslagen zodat na verversen de vraag als beantwoord zichtbaar blijft.

Alle overige spelpuzzels, inspecteurstekst, timers, routes en antwoordcontroles zijn behouden.

## Deploy

Pak de volledige ZIP uit en upload de inhoud naar de root van dezelfde GitHub-repository. Overschrijf gelijke bestanden, zonder de repository te wissen. De frontend **en backend** zijn gewijzigd, dus beide Render-services moeten de nieuwe commit gebruiken.

Gebruik de Hotfix ZIP alleen als je uitsluitend de bestanden `client/src/main.jsx`, `client/src/styles.css` en `server/src/index.js` wilt vervangen.

Test met een nieuw team; bij een bestaand team kan de voorgaande fasevoortgang nog bestaan.
