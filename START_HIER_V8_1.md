# De Zwarte Lotus — wijziging v8.1: één gezamenlijk onderzoeksdossier

Deze versie is gebaseerd op de door de gebruiker aangeleverde v8.0-broncode, met de later verstrekte formulier-hotfix verwerkt.

## Functionele wijziging

- Geen verplichte individuele teamopstelling meer na het inloggen.
- Geen willekeurige toewijzing van Kees Zoek, Rob Berie, Al Larm, Cold Case, Ben de Bajes of Ferry Fout aan spelers.
- Nieuw team komt rechtstreeks op de gezamenlijke introductie terecht.
- Instructies in de startfase spreken van één gezamenlijk onderzoeksdossier.
- De backend vereist geen roltoewijzing voor de overgang START naar ALARM.
- Reset van teams keert terug naar deze nieuwe startflow.
- Berichten van Abrikoos en Koos Toms spreken het team als geheel aan.
- Overige puzzelantwoorden, routes, timer, accounts en evenementen blijven ongewijzigd.

## Wat je uploadt

Je kunt de volledige inhoud van deze ZIP naar GitHub kopiëren. Als je alleen wijzigingen wilt doen, vervang:
- `client/src/main.jsx`
- `server/src/index.js`

De rest is voor documentatie, spelmateriaal en bestaande assets. Het gezamenlijke printdossier staat ook los in de meegeleverde print-ZIP.

## Uitgifte dossier

Print één gezamenlijk dossier per team. Leg niet alle latere inspecteursstukken meteen op tafel; houd die in aparte enveloppen. Bij de start is de beveiligingsopname beschikbaar via de spelbegeleider, cameramateriaal via het Abrikoos-kanaal. Koos Toms en Rotje Knor staan als gezamenlijke bronnen in het dossier, maar zijn pas later relevant.

Controleer vóór het spelen de inkomende Koos-mail, de bronlinks en de productievariabelen. In dit dossier is het Koos-mailadres bewust leeg gelaten omdat de actuele configuratie niet in de broncode staat.

## Teststatus

De backend is gecontroleerd met `node --check`. De frontend is geparseerd met de TypeScript JSX-parser en heeft nul syntax errors. Een live browsertest, een productie-deploy en volledige eind-tot-eindtest zijn nog niet uitgevoerd. Test eerst met een nieuw, leeg teste­venement. Maak vóór upload en redeploy een back-up van de huidige GitHub-versie en serverdata.
