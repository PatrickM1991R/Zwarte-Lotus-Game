# De Zwarte Lotus — spelplatform v0.5

Werkende technische basis voor het dinerspel.

## Nieuw in v0.5

- Rotje Knor-fase met onderschept audiobericht op de spelpagina
- Transportlog in beeld
- Johnny Jatwerk ontmaskeren via J.J. + signalement
- Tweede containerpuzzel: JJX-reeks → 20:34 → stille route → JJX-2034
- Eindbevestiging: dader + nieuwe container
- 30-secondenkeuze: samenwerken met Johnny of politie inlichten
- Johnny-route opent na keuze

## Omgevingsvariabelen frontend

- `VITE_API_URL` — URL van de Render API
- `VITE_JOHNNY_COORDS` — locatie/coördinaten die Johnny aan spelers toont

## Demo

Teamcode: `LOTUS-4171`

## v0.6
Johnny-route uitgebreid met fysieke kluislocatie, drie raadsels voor de 6-cijferige code 203409, Lotus-gevonden scherm, kopergegevens en twee eindplannen.


## v0.7 wijziging
- Transportlog wordt niet meer digitaal getoond.
- Na Rotje Knor geeft de spelbegeleider het fysieke transportlog aan het team.
- De website gebruikt dit document alleen als fysiek bewijsmateriaal voor de vervolgpuzzels.


## v1.0
Johnny-route afgerond: kopercontact als versleutelde chat, stapsgewijze verificatie, codewoord, tijdstip, groen-lichtmoment, verbeterd resultaat en teamstatus `klaar`.

## v2.5 – Recherchekarakters
- Nieuwe teamopstelling vóór de inspecteursbriefing.
- Kies 2 t/m 6 deelnemers.
- Vul per deelnemer de naam in en koppel één van zes vaste karakters: Kees Zoek, Rob Berie, Al Larm, Cold Case, Ben de Bajes en Ferry Fout.
- Ieder karakter heeft een portret, specialisme en korte omschrijving.
- De gekozen teamopstelling wordt op de server opgeslagen.
- Het systeem maakt automatisch een dossierplan zodat noodzakelijke bewijssets over de actieve karakters verdeeld kunnen worden, ook bij minder dan zes spelers.
- Na bevestiging toont de intro nogmaals welk dossierboek bij welke deelnemer hoort.
- Reset team wist ook de karakteropstelling en dossierverdeling.

## v2.6 – Kees Zoek / infiltrantenroute

- Kees Zoek is verplicht onderdeel van ieder rechercheteam.
- Het cameradossier staat niet meer in de openbare frontend.
- In Kees' fysieke dossierboek komt deze geheime link:
  `https://zwarte-lotus-game.onrender.com/#/infiltrant?code=KZ-731`
- Op die pagina speelt eerst het infiltrantenbandje af.
- Pas nadat het bandje volledig is afgespeeld verschijnt het veld voor een e-mailadres.
- Daarna verstuurt de backend de camerabeelden als e-mailbijlage.

### Render environment variables voor e-mail

Zet op de backend-service in Render:

- `INFILTRANT_ACCESS_CODE=KZ-731`
- `RESEND_API_KEY=<jouw Resend API key>`
- `INFILTRANT_FROM_EMAIL=De Zwarte Lotus <spel@jouwdomein.nl>`

Het afzenderdomein moet bij de mailprovider geverifieerd zijn.


## v3.2
Fase 2 gebruikt alleen fysieke dossiers. Online worden geen verdachteportretten of verdachtekaarten getoond. Een fout antwoord voegt 60 seconden straftijd toe aan de oplopende speeltijd.


## v3.5 – Koos Toms: inkomende e-mail als bron in fase 3

- Het herkomstland is uit de online transporttabel verwijderd; alleen de mailbijlage bevat de herkomstregistraties.
- Zet in één van de fysieke detective-dossiers de contactgegevens van Koos Toms (Douane).
- Inkomend mailadres moet in Resend Receiving worden aangemaakt of gekozen; dit is **geen** fictief adres uit de code.
- Koppel een Resend-webhook `email.received` aan `https://zwarte-lotus-api.onrender.com/api/webhooks/koos-toms`.
- Render backend: `KOOS_INBOUND_EMAIL` = exacte inkomende adres, `RESEND_WEBHOOK_SECRET` = ondertekeningsgeheim van de webhook, `KOOS_FROM_EMAIL` = geverifieerde afzender (bv. `Koos Toms <koos@spel.jouwdomein.nl>`); bestaande `RESEND_API_KEY` blijft nodig.
- Elke e-mail **van een geldig afzenderadres** aan Koos krijgt dezelfde geautomatiseerde tekst en de PDF `Transportregister-herkomst-Koos-Toms.pdf` als bijlage. Onderwerp/inhoud worden niet gecontroleerd.
- Beveiliging: webhook-handtekening gevalideerd; alleen exact Koos-adres triggert antwoord; zelfmail-loop wordt geblokkeerd. In-memory event-deduplicatie is geschikt voor de demo, gebruik duurzame opslag/queue voor productie bij serverherstarts.
- **Let op:** e-mailontvangst werkt pas wanneer Resend Receiving, afzenderverificatie en de genoemde Render-variabelen zijn ingesteld. Een bestaande API key op zichzelf is onvoldoende.

## v3.6 – Koos Toms: tweede PDF-bijlage

- Koos antwoordt op inkomende mails met **twee PDF-bijlagen**: de transportlijst inclusief herkomstlanden én de aangetroffen privé-aantekeningen van Don Diamantini.
- De antwoordtekst vermeldt dat de aantekeningen tussen de containerpapieren zijn gevonden.
- Het notitieblad bevat geen expliciete eindoplossing; spelers moeten zelf de aanwijzingen combineren met het transportregister.
- Beide PDF's staan privé in `server/assets/` en worden niet op de openbare website geplaatst.
- Vereist nog steeds een correct geverifieerd verzenddomein in Resend.

## v3.7 – Persoonlijk antwoord aan Rob Berie
- Koos Toms is expliciet de geheime bron van rechercheur Rob Berie.
- Koos spreekt Rob persoonlijk aan in de automatische antwoordmail, ook wanneer die vanaf een willekeurig extern e-mailadres wordt verzonden.
- Beide PDF-bijlagen blijven gelijk.


## v3.8 – universele strafminuut
Iedere onjuiste inzending (openingscontrole, verdachtenreconstructie, containernummers en lokale filters, kluisraadsels en eindoperatie) leidt tot een servergeregistreerde strafminuut. Een groot waarschuwingsscherm met `!` en `+1 MINUUT` wordt getoond. Voor lokale vragen is een nieuwe serverroute `/api/teams/:id/check-step` toegevoegd, zodat de straf niet kan worden omzeild door te verversen. De oplopende tijd toont eventuele overschrijding van 90 minuten; maximaal 90 minuten blijft als limiet vermeld. Niet-puzzelacties zoals navigeren, afspelen van audio en keuzes veroorzaken geen straf.


## v4.0 – Automatische timerstart
Na het volledig afluisteren van de inspecteursbriefing verschijnt de timer 2 seconden fullscreen en verdwijnt daarna automatisch. Geen klik nodig; daarna is de openingspuzzel beschikbaar.


## v4.1 — opening zonder fysieke kist

- De fysieke kist vervalt: na de inspecteursbriefing voeren spelers de viercijferige toegangscode in (spelbegeleidersoplossing 1403).
- Correcte invoer leidt rechtstreeks naar fase 2, waarin de inspecteur het team expliciet oproept om de fysieke transportstukken op te halen.
- De bestaande verdachtenreconstructie blijft in fase 2 beschikbaar.
- Verkeerde toegangscode: dezelfde servergestuurde +1 minuut straftijd en waarschuwing.
- De geheime infiltrantenlink en Koos Toms e-mailflow blijven ongemoeid.

## v4.3
De telefoonknop van Rotje Knor is vervangen door een geïntegreerd audiobericht. Na volledig afluisteren kan het team verder met de bestaande Johnny-route.


## v4.4 — Rotje Knor via het dossier (geen automatisch bandje op fase 4)

- **Geheime dossierlink voor Cold Case:** `https://zwarte-lotus-game.onrender.com/#/rotje?code=CK-842`
- **Als Cold Case niet actief is:** plaats die fysieke dossierpagina bij **Rob Berie**. Rob Berie is altijd actief. Dit is ook in `dossierPlan` vastgelegd via clue pack `rotje-contact`.
- De hoofdwebsite toont het bandje **niet** en vermeldt het geheime adres niet. Fase 4 vraagt enkel om een ontvangstcode uit het persoonlijke contactkanaal.
- De geheime pagina speelt het bestaande Rotje-bandje af en toont na volledig afluisteren de ontvangstcode `RK-7318`. Met die code gaat fase 4 door.
- De server controleert de dossierlink via `GET /api/rotje/verify` en controleert de ontvangstcode op het gewone antwoordendpoint; foutieve codes krijgen de bestaande +1 minuut straf.
- Optioneel voor Render backend Environment: `ROTJE_ACCESS_CODE=CK-842` en `ROTJE_RECEIPT_CODE=RK-7318`. Houd deze voorlopig gelijk aan de in de frontend getoonde ontvangstcode.
- **Fysieke voorbereiding vereist:** print een contactstrook met de geheime URL/QR-code en stop deze in het dossier van Cold Case of anders Rob Berie. De website maakt fysieke boeken niet automatisch.


## v4.6 – Transportregistratie
Het beveiligde transportsysteem toont alleen de initialen **J.J.** bij 'Wijziging uitgevoerd door'. De volledige naam Johnny Jatwerk wordt hier niet meer weergegeven; spelers leiden de identiteit af uit fysieke verdachte-dossiers. Overige fases blijven intact.


## v5.1 - Johnny's videobericht
- Originele opname van de gebruiker: `client/public/assets/story/johnny-jatwerk-offer.mp3` (~53 sec).
- Goedgekeurd Johnny-portret: `client/public/assets/story/johnny-jatwerk-offer.png`.
- Tijdens audio: filmische beweging (CSS / licht-effect), geen lip-sync, geen tekst of keuze.
- Na het audio-einde: gesproken tekst onder portret en 30 seconden om te kiezen.
- Server start de keuzeperiode slechts eenmaal, bewaakt de deadline en laat herladen niet resetten.
- Het serverdemogeheugen is niet permanent: bij een volledige backend-restart resetten demo-teams. Voor productie is een persistente database vereist.


## v5.3 — Johnny kluisbericht
Johnny’s bericht bij Laadperron 9 vermeldt dat hij de kluiscode wegens onderscheppingsgevaar niet digitaal doorstuurt en dat het team die zelf moet afleiden. De digitale kluis, code en overgang blijven ongewijzigd.
