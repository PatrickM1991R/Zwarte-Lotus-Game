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
