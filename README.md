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

## v5.4 – Digitale kluis op ware grootte
- De drie raadsels staan gelijktijdig zichtbaar op de onderzoekspagina, zonder afzonderlijke antwoordcontrole.
- Via de pijl 'Bekijk de kluis' opent een apart schermvullend kluisscherm.
- Op de kluis is een aanraakbaar 0–9-toetsenbord aanwezig, plus C, terugwissen en ENTER.
- Alleen zes cijfers kunnen worden bevestigd. De server controleert de code; bij een fout antwoord komt er +1 minuut straftijd en het grote uitroepteken.
- Bij de juiste code opent de kluisdeur zichtbaar en wordt de inhoud getoond.
- Mobile-first weergave van kluis en toetsenbord.


### v5.5 — Realistisch metalen kluisfront
Bij de digitale kluis zijn een realistische industriële metalen deur, klinkmechanisme, scharnieren, klinknagels, statuslampje en diepe kluisopening toegevoegd. Het bestaande numerieke toetsenbord, zes-cijferige code 203409, de correcte opening en de +1 minuut bij fouten zijn ongewijzigd.


## v5.7: Johnny-finale
- Drie minuten servergestuurde bedenktijd, vanaf het openen van de kluis. Verversen reset de tijd niet.
- Verstrijkt de termijn zonder keuze, dan start automatisch noodplan 'Valstrik'.
- Scriptmatige beveiligde chat met Victor Valmont (simulatie, geen echte externe chat), inclusief verificatie, tweede codewoord, eigen ontmoetingslocatie/tijd en politiecode.
- Politiecodes komen fysiek van de spelbegeleider. Optioneel kan in Render `POLICE_OPERATION_CODE` worden ingesteld om exact te controleren; anders is het een niet-geverifieerde demo-invoer.
- Chatvoortgang wordt op de server bijgehouden, zoals de overige spelvoortgang. Foute bekende codewoorden leveren een strafminuut op.
- De resultatenpagina is nog gebaseerd op het oorspronkelijke verhaal; specifieke arrestatielocaties moeten nader op de gekozen afspraken worden afgestemd.


## v5.9 – Politiecode B & arrestatiescène
De spelbegeleider is de inspecteur en reikt operatiedossier B uit. Testcode: `NV-07419` (eenmalig vast voor demo, wijzig via backend-omgeving `POLICE_OPERATION_CODE` indien gewenst). Deze code gaat alléén naar het afgeschermde politiekanaal, niet naar Victor. Bij een onjuiste code volgt +1 minuut straftijd. Daarna kan het team de arrestatie starten. De eindscène toont visueel de aanhouding van Johnny Jatwerk en bevestigt de arrestatie van Victor Valmont en het veiligstellen van de diamant.


## v6.0 — Dezelfde inspecteur en visuele eindscène
- De Code-B-briefing gebruikt nu expliciet dezelfde inspecteursfoto als de openingsbriefing (`inspector-kist.jpg`).
- Na een bevestigde afspraak met Victor geeft de spelbegeleider in zijn rol als inspecteur Operatiedossier B. De politiecode gaat niet via de koperschat.
- Tijdens de finale verschijnt de inspecteur met drie opeenvolgende arrestatiebevelen en als laatste de goedgekeurde cinematische eindvisual.
- De bestaande chat, servercontrole, code B, tijdsregistratie en arrestatiefases zijn behouden.


## v6.1 — nieuwe slotroute Johnny / Victor

- Na het openen van de digitale kluis liggen er twee bewijsstukken: Johnny's bestaande koperskladje en een nieuw handgeschreven briefje dat zijn schuilplaats aanwijst.
- Dezelfde inspecteur als bij de opening vraagt om Johnny's locatie en Operatiedossier B. Test: locatie `Chauffeurskeet achter Laadperron 9`, Code B `NV-07419`. Fout: +1 minuut.
- Bij juiste bevestiging wordt Johnny afzonderlijk aangehouden, vóór de chat met Victor.
- Victor vraagt eerst codewoord 1 `KARAAT`, dan codewoord 2 `NACHTGLAS`. Geen vraag meer over de kluis.
- Het team kan vervolgens zelf een overdrachtslocatie en tijdstip voorstellen.
- Zodra Victor die bevestigt start een echte (servergestuurde) keuzeperiode van drie minuten: `Victor laten arresteren` of `geld zelf houden`. De standaardkeuze bij tijdsoverschrijding is arrestatie.
- De eindscène verschilt: Johnny is altijd aangehouden, Victor alleen bij arrestatiekeuze. Het geld wordt alleen bij de geldkeuze als zelf gehouden beschreven.
- De politiecode wordt nooit aan de koper gestuurd.

**Let op:** deze game is nog een prototype met in-memory teamstatus: een herstart van de Render-backend kan actieve teams resetten. De frontend wordt bij deployment door Render gebouwd.

## v6.2 – Terugnavigatie en live eindoperatie
- Teams kunnen nu terug naar de vorige pagina via een expliciete knop.
- Voor teruggaan vraagt het systeem eerst bevestiging en telt daarna automatisch **2 minuten straftijd** op.
- De inspecteur in het slotstuk gebruikt weer consequent dezelfde foto/uitstraling als in de openingsbriefing.
- Het Johnny-blok in de eindfase is visueel netter uitgelijnd.
- De eindoperatie toont nu een **live operatie-animatie** met spanningsopbouw voor de arrestatie van Johnny.
- Bij de finale wordt ook Victor Valmont zichtbaar meegenomen in een aparte live operatievolgorde: eerst onzekerheid / niet direct vinden, daarna wel of niet aanhouding, afhankelijk van de teamkeuze.

## v6.3 – Live arrestatiebeleving
- Aanhoudingsbeeld met bewegende camera, blauw-rode politielichten en dreigende beeldstoring.
- Optioneel signaalgeluid, uitgeschakeld totdat speler het zelf activeert.
- Afzonderlijk groot statuspaneel per verdachte: Johnny aangehouden; Victor aangehouden of ontkomen afhankelijk van de laatste keuze.
- De politie-inval is een geanimeerde spelsimulatie op basis van stilstaand beeld en tijdlijn, **geen echte video of lip-sync**.
- Bestaande codewoorden, keuzes en strafminuten blijven ongewijzigd.

## v6.4 — Afzonderlijke finale-pagina's en geen dubbele aanhouding
- **Bewijspagina:** de twee kluisbriefjes staan op een eigen pagina, zonder de vragen van de inspecteur.
- **Politiekanaal:** een afzonderlijke volgende pagina vraagt Johnny's locatie en Operatiedossier Code B. Een fout antwoord kost één strafminuut.
- **Johnny:** na de correcte gegevens start een afzonderlijke operatie met spanningsopbouw. Pas na de aanhouding kan het team door.
- **Victor-chat:** een afzonderlijke pagina zonder zichtbaar kluisbewijs of Johnny-arrestatie.
- **Victor-finale:** toont alleen de actie rond Victor en het gekozen einde. Johnny's arrestatie wordt niet opnieuw afgespeeld.
- **Inspecteur:** dezelfde portretbron als in de openingsbriefing (`inspector-kist.jpg`) wordt gebruikt op de beide politierapporten.
- **Terugkijken:** de bestaande terugknop blijft beschikbaar met bevestiging en +2 minuten straftijd.

## v6.5 — Moeilijker containerregister
Fase 6 toont 12 containers, waaronder negen actieve zendingen. Verscheidene actieve zendingen delen de JJX-reeks, het wijzigingstijdstip 20:34 of de registratie Ongeplande overslag. Alleen JJX-2034 combineert de drie relevante eigenschappen. Het juiste antwoord en de strafminuut blijven ongewijzigd.


## v6.6 – Bugfix overgang bewijsstukken
De knop “Ga naar het politiekanaal” accepteert “bewijs bekeken” als navigatieactie, zet de teamfase op JOHNNY_MELDEN en kent geen strafminuut toe. Verkeerde antwoorden in het politiekanaal blijven 1 strafminuut kosten.


## v6.7 — Herleidbare containerpuzzel
Het geheime transportsysteem toont de nieuwe containerregistratie **JJX-reeks** naast tijdstip **20:34** en mutatie **Ongeplande overslag**. Het afzonderlijke containernummer blijft afgeschermd. In fase 6 moeten spelers die aanwijzingen combineren tot **JJX-2034**.

## v6.8 - Bewijspagina
- Het blok BEWIJS VERZAMELD onder Johnnys notities is verwijderd.
- De knop naar het politiekanaal blijft aanwezig en werkt ongewijzigd.

## v6.9 – geldroute met verraad
Victor lijkt te ontsnappen, wordt later alsnog opgepakt en noemt de rechercheurs in zijn verhoor. De politie houdt het rechercheteam aan en neemt het geld in beslag. De reguliere politie-eindroute blijft ongewijzigd.

## v7.0 – Visuele ontknoping geldroute
- Bij het kiezen om het geld te houden wordt Victor later gearresteerd en verraadt hij de rechercheurs.
- Na het verhoor verschijnt een filmische nachtelijke haven-scène met bewegend camerabeeld, blauw-rode zwaailichten en aanhoudingsbevestiging voor het rechercheteam.
- De succesvolle politie-route blijft ongewijzigd; de geldroute eindigt met inbeslagname van het geld.
- De scène is een geanimeerde afbeelding, geen vooraf gerenderde video.


## v7.1 – Operatie Schaduwjacht: volledige alternatieve politieroute
Na Johnny's 30-secondenaanbod opent **Waarschuw de politie** een eigen route met negen schermen (waaronder vijf inhoudelijke bewijsopdrachten), een mislukte inval en een dubbele arrestatiefinale. De Johnny-samenwerkingsroute is behouden. Alle puzzelantwoorden worden op de server gevalideerd met +1 minuut bij fouten. Terug naar de vorige pagina kost +2 minuten. De live operaties hebben vaste timing en herstarten niet bij vernieuwen zolang de demo-API in geheugen actief blijft.

Spelbegeleidersoplossingen politieroute: Camera 06 / West; Freddy Flessentrekker / FF-27; kanaal VV-37 / 23:10 / Perron 3; Koelcel B-12 / ZL-09; SCHADUW-27 / Victor Valmont. De extra 35–45 minuten blijft een spelduurdoel en moet met testteams worden geverifieerd.


## v7.2
Het MISSIE-blok “Doorzoek de havenadministratie en bouw een nieuw dossier op. Johnny helpt jullie niet.” is verwijderd van de politie-intro. Overige puzzels en functionaliteit blijven gelijk.


## v7.3 - Inspecteur geeft cameradossier uit
- De cameraregistratietabel en het schematische havencameraschema zijn verwijderd van de politieroute-pagina.
- De inspecteur reikt het printbare bestand `dossier-inleg/Inspecteur_Aanvullend_Cameradossier_Schaduwjacht.pdf` fysiek uit (2 pagina's).
- De online antwoordvelden blijven bestaan: CAM 06 en uitgang West.
- Het eerder verwijderde MISSIE-blok blijft verwijderd.


## v7.4 — Camerareconstructie met 16 registraties
- De webpagina POLITIE_CAMERA toont uitsluitend de twee antwoordvelden (CAM 06 / West).
- De inspecteur overhandigt `dossier-inleg/Inspecteur_Aanvullend_Cameradossier_16_registraties.pdf` met 16 afleidende cameraregistraties en sectorenkaart.
- In Johnny's persoonlijke dossier hoort `dossier-inleg/Johnny_Jatwerk_Voertuigobservatie_Evoque.pdf`, met observatiefoto en herkenningspunten van een zwarte Range Rover Evoque.
- De voertuigfoto staat ook als asset in `client/public/assets/story/johnny-range-rover-evoque.jpg` voor later dossierbeheer.
- Geen oplossingen in de spelersdocumenten; oplossingen blijven ongewijzigd.
- De foto is fictief spelmateriaal en geen bewijs van een echt voertuig of incident.


## v7.5 – Wie heeft Johnny gewaarschuwd?
De online pagina toont alleen drie vragen; alle aanwijzingen komen uit vier fysieke, verzegelde inspecteursstukken. Logboek bevat 16 gebeurtenissen. Freddy Flessentrekker / FF-27 / gekloonde toegangspas is de volledige oplossing. Carla Kraak is afleider: zij werkte aan de camera’s, maar niet aan de waarschuwing. De fysieke stukken worden bij deze fase door de inspecteur uitgereikt.

## v7.6 – Vertrouwelijke douanemail en afzonderlijke politieorder
- Puzzel 'Waar ligt de diamant nu?' toont de opslagregistratie en inbeslagname-instructie als twee uitklapbare bijlagen van een vertrouwelijke douanemail; daarna een apart beveiligd antwoordformulier.
- Finale 'Bereid de dubbele arrestatie voor' toont een afzonderlijke operationele e-mail met twee bijlagen: radioprotocol (beginletters van zeven regels vormen de operatienaam) en eenhedenrooster (beide inzetlocaties).
- De inspecteur noemt de code niet meer letterlijk. De gevalideerde antwoorden blijven B-12/ZL-09 en SCHADUW27/Victor Valmont.
- De oude zichtbare fragmenten A-C bij de koperscommunicatie zijn van de spelpagina verwijderd zoals eerder gevraagd.
- Er is niets veranderd aan de Johnny-route en aan de strafminuten.
