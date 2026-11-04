# De Zwarte Lotus — spelplatform v0.5

Werkende technische basis voor het dinerspel.

## Nieuw in v0.5

- Rotje Knor-fase met configureerbaar telefoonnummer en reserve-audio voor testmodus
- Transportlog in beeld
- Johnny Jatwerk ontmaskeren via J.J. + signalement
- Tweede containerpuzzel: JJX-reeks → 20:34 → stille route → JJX-2034
- Eindbevestiging: dader + nieuwe container
- 30-secondenkeuze: samenwerken met Johnny of politie inlichten
- Johnny-route opent na keuze

## Omgevingsvariabelen frontend

- `VITE_API_URL` — URL van de Render API
- `VITE_ROTJE_PHONE` — telefoonnummer van de douanelijn
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
