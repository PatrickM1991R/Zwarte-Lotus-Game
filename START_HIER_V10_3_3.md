# De Zwarte Lotus v10.3.3 – verplichte eindkeuze

Gebaseerd op het volledige pakket v10.3.2.

- Eindkeuze binnen 3 minuten verplicht: VAL (Victor aangeven) = geslaagd; GELD (geld houden) = opgepakt; geen keuze = opgepakt.
- Na 3 minuten wordt server-side `GEEN` opgeslagen met `finalChoiceTimedOut=true`; de missie eindigt als mislukt.
- De finale toont bij geen keuze een aparte aanhoudingsscène, niet de succesvolle Victor-arrestatie.
- Dashboard toont expliciet **Geen keuze binnen 3 minuten → team opgepakt**.
- Officiële ranglijst bevat uitsluitend teams die tijdig zelf Victor aangaven. Geen keuze of geld houden betekent geen klassering.
- Historische foutieve automatische `VAL`-keuzes met `finalChoiceTimedOut=true` worden als mislukt getoond.
- Handmatig een team doorzetten naar de resultaatfase zonder keuze geldt ook als mislukking.

Deploy client én server naar Render; de servercode is gewijzigd. Bestaande databasebestanden niet vervangen.
