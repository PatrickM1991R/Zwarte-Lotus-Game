# De Zwarte Lotus v9.1 — leaderboard en bewaren van spelrondes

## Nieuw
- Live leaderboard voor elk evenement: afgeronde teams worden gerangschikt op de totale eindtijd **inclusief** strafminuten (de bestaande teller bevat de straf al).
- Toon apart de netto speeltijd, strafminuten, totale eindtijd en route.
- Het evenement en het leaderboard blijven bestaan als alle teams klaar zijn.
- Een evenement afsluiten **stopt actieve teams** maar bewaart alle gegevens.
- Alleen de eigenaar-spelbegeleider of een beheerder kan het evenement met alle teamresultaten verwijderen. Er is een exacte naambevestiging nodig.

## Installatie
Pak de volledige ZIP uit en overschrijf de bestaande projectbestanden in GitHub. Of kopieer uit de hotfix alleen `server/src/index.js`, `client/src/main.jsx`, `client/src/styles.css`.

## CRUCIAAL: duurzame opslag op Render
De website schrijft gegevens naar het bestand ingesteld via `DATA_FILE`. Een reguliere Render filesystem-schijf is vergankelijk; bij redeploy of herstart kunnen resultaten verdwijnen. Gebruik een **Render Persistent Disk**, gemount bijvoorbeeld op `/var/data`, en zet de serveromgevingsvariabele op:
`DATA_FILE=/var/data/zwarte-lotus-state.json`

Zorg dat je huidige gegevens voor de omschakeling naar een nieuwe locatie worden overgezet of veilig geback-upt. Alleen de code installeren garandeert niet dat historische data overleven.

## Controlestappen
1. Laat meerdere teams afronden. Open de spelbegeleider, selecteer het evenement en bekijk Leaderboard.
2. Controleer de volgorde op eindtijd inclusief strafminuten.
3. Sluit het evenement af; de ranglijst blijft staan, ook na het opnieuw openen van het evenement.
4. Herstart de backend: met persistente schijf moeten de gegevens behouden blijven.
5. Verwijderen: kies de rode knop, typ de exacte evenementnaam; pas daarna worden het evenement en de teamresultaten verwijderd.

Let op: de code is syntactisch gecontroleerd maar niet op een live Render-service gevalideerd. Een complete frontend-build kon in deze container niet worden uitgevoerd doordat npm-afhankelijkheden offline niet beschikbaar zijn.
