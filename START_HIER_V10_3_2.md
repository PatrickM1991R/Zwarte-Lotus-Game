# De Zwarte Lotus v10.3.2 – eindkeuzes & officiële ranglijst

Gebaseerd op het volledige broncodepakket v10.3.1.

## Gewijzigd
- Live dashboard van spelbegeleider toont nu per team de geregistreerde eindkeuze en uitslag.
- `VAL`: Victor Valmont aangegeven, missie geslaagd; ook automatische keuze na verstrijken van de drie minuten wordt herkenbaar weergegeven.
- `GELD`: team hield het geld, werd vervolgens opgepakt en heeft de missie **mislukt**.
- Officiële ranglijst bevat uitsluitend geslaagde teams en is gesorteerd op eindtijd inclusief strafminuten.
- Opgepakte teams staan onderaan in een aparte sectie **Niet geklasseerd**, zonder plaatsnummer, maar met hun tijd en strafminuten ter inzage.
- Afgeronde teams zonder geregistreerde eindkeuze worden **Uitslag onbekend** en krijgen niet automatisch een succesvolle eindklassering.
- De definitieve keuze was al duurzaam op de server opgeslagen; de wijziging leest deze bestaande gegevens en werkt ook voor eerder afgeronde teams.

## Implementatie
Werk de bestanden van deze volledige ZIP in GitHub bij, en deploy de client opnieuw op Render. De servercode is ongewijzigd. Bestaande evenementen en teamresultaten blijven behouden.
