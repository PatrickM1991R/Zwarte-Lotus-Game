# De Zwarte Lotus v9.2 — Vorige fase

In **Spelbeheer > evenement > Live dashboard** staan per actief team **← Vorige fase** en **Volgende fase →**.

- Een druk op **Vorige fase** zet alleen het gekozen team één fase terug binnen de bestaande spelroute.
- De speeltijd, hints en bestaande strafminuten blijven bestaan. Handmatig terugzetten veroorzaakt geen extra tijdstraf.
- Bij teruggaan naar de routekeuze kan het team opnieuw voor Johnny of politie kiezen.
- Bij heropenen van een puzzel worden eerder geregistreerde deelantwoorden van die puzzel leeggemaakt.
- Voor sommige tijdgebonden operaties wordt de tijdvenster opnieuw gestart.
- Bij teruggaan van de koperkeuze naar de chat wordt de gesprekssessie opnieuw gestart.
- De eerste fase en afgeronde/gestopte teams kunnen niet teruggezet worden (gebruik daar zo nodig Reset, dat wél het hele team wist).

**Installatie:** Pak de volledige ZIP uit en overschrijf de bestaande projectbestanden in GitHub. Render moet de frontend en backend herdeployen. Maak vooraf een GitHub-back-up.

**Controle:** test met een actief team: zet via spelbeheer één fase vooruit en dan terug. Controleer dat de pagina in het team wijzigt en de tijdstraf onveranderd blijft.
