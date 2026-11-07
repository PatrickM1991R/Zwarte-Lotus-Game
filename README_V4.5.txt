DE ZWARTE LOTUS – V4.5

NIEUW: geheim transportsysteem met login uit Rotje Knors audiobericht.

1. In het fysieke dossier van Cold Case staat een transportinlog-inleg. Speelt Cold Case niet mee, dan geeft de spelbegeleider die inleg aan Rob Berie.
2. De link op de inleg is: https://zwarte-lotus-game.onrender.com/#/transport-systeem
3. Via de bestaande geheime Rotje-pagina krijgen spelers na het afluisteren de autorisatiecode RK-7318. Dat is nu expliciet de code voor het transportsysteem (niet de normale spelpagina).
4. Op de aparte transportpagina voeren ze de code in. De backend geeft alleen bij de juiste code de wijzigingsgegevens vrij: originele container MBX-4717, 20:34, initialen J.J., Johnny Jatwerk, oude status 'Lege huls', transport omgeleid. Het nieuwe containernummer staat er niet in.
5. Op de hoofdwebsite staat in fase 4 uitsluitend 'Nieuw spoor'. Spelers moeten invullen wat er is gebeurd en wie de route veranderde. Goed antwoord gaat direct door naar de puzzel voor de nieuwe container, zonder herhaalde selectie van Johnny.
6. Onjuiste fase-4-antwoorden: +1 minuut straf via bestaande backend-logica.

ADMIN / INZET
- Dossier-inleg PDF: dossier-inleg/Transporttoegang_Cold_Case_Rob_Berie.pdf
- Link is bedoeld als fysiek dossierbewijs, niet als link op de reguliere gamepagina.
- Rotje-pagina blijft: https://zwarte-lotus-game.onrender.com/#/rotje?code=CK-842
- Autorisatiecode transportsysteem: standaard RK-7318. Via ROTJE_RECEIPT_CODE in Render kan de code worden aangepast; de zichtbare code in de frontend is in deze demo nog vast ingesteld op RK-7318, dus laat deze variabele op de standaardwaarde.
- Geen nieuwe Render-variabelen nodig voor deze update.
- Backend + frontend samen uitrollen.

OPMERKING
De volledige Vite-frontend-build kon in deze omgeving niet worden afgerond omdat npm install vastliep. De Node backend syntax is geverifieerd. Test na deploy de speciale pagina en de doorstroom in fase 4.
