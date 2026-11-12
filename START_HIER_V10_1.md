# De Zwarte Lotus v10.1 – handmatige straftijd

In het live dashboard kan de spelbegeleider bij elk team 1, 2, 5 of 10 strafminuten toevoegen, of een eigen geheel aantal (1–120).

- Dit is alleen toegestaan voor een team waarvan de timer al gestart is.
- De actie vraagt expliciete bevestiging met teamnaam en aantal minuten.
- De server controleert de bevoegdheid voor het evenement en valideert de minuten.
- De straf wordt opgeslagen, in de zichtbare speeltijd verwerkt en in het leaderboard meegerekend.
- Ook bij gepauzeerde of al afgeronde teams kan een spelbegeleider de eindtijd corrigeren.
- Iedere handmatige toevoeging wordt gelogd met account, tijdstip en aantal minuten.

Upload de inhoud van de volledige ZIP in GitHub; deploy frontend en backend op Render. Test met een lopend team en controleer of de straftijd exact éénmaal wordt toegevoegd. Databasegegevens blijven afhankelijk van persistente Render-opslag.
