// Static assembly copy. Machine-drafted, technical-reference corrections; native review pending.
export default {
  "version": 1,
  "steps": {
    "prepare-intro": {
      "short": "Schauen Sie sich zunächst den kompletten Roboter an",
      "title": "Verstehen Sie den gesamten Maschinen- und Montageweg",
      "text": "Schauen Sie sich zunächst die gesamte Maschine an, schließen Sie dann nacheinander die Vorbereitung, Beine, Körper, Kopf und Hals, die Endmontage und die Kalibrierung ab.",
      "check": "Dies ist der Prototyp des unabhängigen Unterrichts. Über die „Vollständige Vorschau“ können Sie jederzeit wieder zum abgeschlossenen Zustand zurückkehren.",
      "caption": ""
    },
    "prepare-boards": {
      "short": "Stecken Sie zwei Platinen provisorisch zusammen",
      "title": "Stecken Sie UNO Q und Erweiterungsplatine vorübergehend ein",
      "text": "Richten Sie die Stiftleisten und Buchsenleisten der beiden Platinen aus und drücken Sie sie in die gleiche Richtung zusammen. Die beiden Boards sind im Tutorial zwei separate Objekte.",
      "check": "Mit bestätigtem Fotomodell. Die vier Sätze von 32-Pins sind entsprechend den Modellkoordinaten ausgerichtet; PCB und die Schnittstelle werden nicht entsprechend der Gesamthüllkurve gestreckt. Platinenfreiheit, Schlüsselpositionen, elektrische Zuordnung und physische Passform müssen noch überprüft werden.",
      "caption": "Richten Sie die Stiftleiste und die Buchsenleiste aus und drücken Sie sie zusammen"
    },
    "prepare-battery": {
      "short": "Prüfbatterie anschließen",
      "title": "Schließen Sie die temporäre Stromversorgungsbatterie an",
      "text": "Stecken Sie den Batteriestecker entsprechend dem Originalstück ein, um die Stromversorgung für die nächste einzelne Servo-Konfiguration vorzubereiten.",
      "check": "Das Video erinnert Sie daran, auf die Polarität zu achten; Dieser Prototyp schätzt die tatsächlichen Pins oder die Polarität nicht anhand des Erscheinungsbilds ein.",
      "caption": "Netzstecker und Ausrichtung unterliegen einer physischen Überprüfung"
    },
    "prepare-servo": {
      "short": "Schließen Sie einen Servo an",
      "title": "Schließen Sie jeweils nur einen zu konfigurierenden Servo an",
      "text": "Stecken Sie zuerst das dreiadrige Kabel in Servo und dann das andere Ende in die Platine. Derzeit ist nur dieser mit dem Test Servo verbunden.",
      "check": "Nachdem Sie die Nummerierung des aktuellen abgeschlossen haben, trennen Sie das nächste und ersetzen Sie es.",
      "caption": "Einzeln Servo · Eingesteckt"
    },
    "prepare-usb": {
      "short": "Schalten Sie den Roboter ein und verbinden Sie ihn mit dem Computer",
      "title": "Schalten Sie den Roboter ein und schließen Sie die Type-C-Leitung an",
      "text": "Befolgen Sie die Anweisungen im Video, schalten Sie den Roboter ein und verbinden Sie ihn dann mit dem Type-C-Kabel mit dem Computer.",
      "check": "Auf dieser Seite wird nur die Verbindungssequenz veranschaulicht und es werden keine echten Geräte gestartet oder verbunden.",
      "caption": "Einschalten · Mit Type-C verbinden"
    },
    "prepare-app": {
      "short": "Importieren Sie die Anwendung und führen Sie sie aus",
      "title": "Importieren Sie die Anwendung und führen Sie sie unter Arduino App Lab aus",
      "text": "Importieren Sie die XGO Duck-Anwendung auf Ihren Computer und führen Sie sie aus. Das Originalvideo zeigt die Installation der ersten Umgebung nicht vollständig.",
      "check": "Dieser Schritt bietet Videovergleiche und Anleitungen; Es gibt hier keine tatsächliche App Lab-Sitzung.",
      "caption": "Anwendungsstart · Tutorial-Anweisungen"
    },
    "prepare-scan": {
      "short": "Scannen und zentrieren",
      "title": "Geben Sie Servo setup ein, scannen und zentrieren Sie den aktuellen Servo",
      "text": "Öffnen Sie Ihre eigene Gerätekonfigurationsadresse und geben Sie Servo setup ein. Scan all IDs → Nachdem ein einziges gefunden wurde, Stop scan → Move to 2047 → Write.",
      "check": "Aufgrund unterschiedlicher Umgebungen kopieren das Gerät IP und der Hostname nicht die feste Adresse des Originalfilms.",
      "caption": "Scan → Stop → 2047 → Write"
    },
    "prepare-id": {
      "short": "Parameter schreiben und ID",
      "title": "Schreiben Sie die Parameter und legen Sie das Ziel ID fest",
      "text": "Die Videoparameter sind KP=5 und KD=20. Klicken Sie auf Write. Geben Sie das Ziel ID ein, führen Sie Change ID aus und bestätigen Sie den Erfolg.",
      "check": "Dies ist die Konfigurationssequenz im Video; Die aktuelle Webseite sendet keine Parameter an Servo.",
      "caption": "KP 5 · KD 20 · Change ID"
    },
    "prepare-all-ids": {
      "short": "Schließe 15 und ID nacheinander ab",
      "title": "Vervollständigen Sie die Nummerierung und Zentrierung der fünfzehn Servos nacheinander",
      "text": "Vervollständigen Sie 10–14, 20–24, 30–34 der Reihe nach. Konfigurieren Sie jeweils nur eine. Die anschließende mechanische Montage beginnt in einem nummerierten, zentrierten Zustand.",
      "check": "Die fünfzehn ID auf dieser Seite sind eine Anleitungsliste und stellen nicht dar, dass echte Geräte geschrieben oder zentriert wurden.",
      "caption": "15 ID · Nacheinander verarbeitet"
    },
    "r-prepare": {
      "short": "Teile vorbereiten",
      "title": "Bereiten Sie die rechten Knöchelteile vor",
      "text": "Bereiten Sie die nummerierten, zentrierten ID14 Servo sowie den Fußballen, die Wade, Lager und den Knöchelschaft auf dieser Seite vor.",
      "check": "Die Servonummerierung und -zentrierung sollte vor der mechanischen Installation erfolgen.",
      "caption": ""
    },
    "r-horn": {
      "short": "Entfernen Sie Servohorn",
      "title": "Entfernen Sie Servohorn",
      "text": "Lösen Sie zuerst die ursprüngliche Befestigungsschraube in der Mitte des Servohorn und entfernen Sie dann die schwarze Servohorn in Richtung der Abtriebswelle.",
      "check": "Legen Sie den Servohorn und die Originalschrauben beiseite. Spätere Schritte werden es nicht durch selbstschneidende Schrauben ersetzen.",
      "caption": "Entfernen Sie zuerst die Zentralschraube und entfernen Sie dann das Servohorn"
    },
    "r-plug": {
      "short": "Stecken Sie das Kabel ein",
      "title": "Stecken Sie die Servo-Leitung ein",
      "text": "Richten Sie das Anschlussloch des Steckers am Vorsprung der Schnittstelle aus, führen Sie ihn in Richtung der Schnittstelle ein und drücken Sie ihn dann fest.",
      "check": "Überprüfen Sie die Steckrichtung genau. Der Steckvorgang wird hier demonstriert. Die Pin-Belegung des dreiadrigen Kabels muss noch physisch überprüft werden.",
      "caption": "Richten Sie die Schnittstelle aus und drücken Sie sie fest"
    },
    "r-shank": {
      "short": "Festes Kalb",
      "title": "Fester Unterschenkelanschluss",
      "text": "Bringen Sie den weißen unteren Beinverbinder an Servo an, richten Sie die Montagelöcher aus und schrauben Sie dann zwei selbstschneidende Senkkopfschrauben M2×6 ein.",
      "check": "Das lange Ende des Steckers muss nach oben zeigen. Richten Sie zuerst die Löcher aus und befestigen Sie dann die Teile. Verwenden Sie keine Schrauben, um falsch ausgerichtete Teile in die Einbauposition zu zwingen.",
      "caption": "Richtiges Loch · M2×6 ×2"
    },
    "r-foot": {
      "short": "Passt in die Fußsohle",
      "title": "Installieren Sie Servo in der Fußsohle",
      "text": "Setzen Sie das Modul bestehend aus Servo und Wadenverbinder in die Fußsohle ein und befestigen Sie die vier selbstschneidenden Senkkopfschrauben M2×6, wie im Video gezeigt.",
      "check": "Bestätigen Sie zunächst die Ausrichtung der Fußsohlen und Gelenke und fixieren Sie dann die vier Positionen. Die Kabel bleiben außen.",
      "caption": "Fester Fuß · M2×6 ×4"
    },
    "r-small-bearing": {
      "short": "Drücken Sie Lager",
      "title": "Drücken Sie den kleinen Lager hinein",
      "text": "Richten Sie den kleinen Lager am kreisförmigen Montageloch an der Fußsohle aus und drücken Sie ihn in axialer Richtung hinein.",
      "check": "Lager muss aufrecht sitzen, mit dem Mittelloch und dem Stecker koaxial. Die Modellnummer entspricht laut Liste 10×15×3 mm.",
      "caption": "Axial eindrücken"
    },
    "r-axle": {
      "short": "Installieren Sie den Knöchelschaft",
      "title": "Richten Sie den Knöchelschaft aus und installieren Sie ihn",
      "text": "Richten Sie das mittlere Loch aus, platzieren Sie die gedruckte Knöchelachse in der Mitte von Lager und schrauben Sie dann die selbstschneidende Schraube M2.3×8 manuell ein.",
      "check": "Die Knöchelachse nutzt das vorhandene 3MF-Raster; Die Positionierung hier wurde für die Anzeige angepasst und nicht auf physische Passform überprüft.",
      "caption": "Richten Sie Lager mittig aus"
    },
    "r-tighten": {
      "short": "Überprüfung behoben",
      "title": "Anziehen und prüfen",
      "text": "Schrauben Sie die M2.3×8-Schraube axial ein, bis der Schraubenkopf am Untergrund anliegt, und überprüfen Sie dann die Knöchelverbindung.",
      "check": "Im Video wird gefordert, dass der Schraubenkopf fest sitzt und das Ende auf der anderen Seite herauskommt. Der Prototyp demonstriert nur die Bewegung und simuliert kein tatsächliches Drehmoment oder Toleranzen.",
      "caption": "Anziehen, bis der Schraubenkopf passt"
    },
    "r-ankle-done": {
      "short": "Vollständige Besichtigung",
      "title": "Der rechte Knöchel ist eingebaut",
      "text": "Sie können die Inspektion rotieren lassen, bevor Sie mit der nächsten Stufe fortfahren. Sohlenpolster werden in der Endbearbeitungsphase der Beine angebracht.",
      "check": "Die Unterfußpolster sind in diesem Abschnitt noch nicht installiert; Sie werden später im Video an den Beinen angebracht.",
      "caption": ""
    },
    "l-prepare": {
      "short": "Teile vorbereiten",
      "title": "Bereiten Sie die linken Knöchelteile vor",
      "text": "Bereiten Sie die nummerierten, zentrierten ID24 Servo sowie den Fußballen, die Wade, Lager und den Knöchelschaft auf dieser Seite vor.",
      "check": "Die Servonummerierung und -zentrierung sollte vor der mechanischen Installation erfolgen.",
      "caption": ""
    },
    "l-horn": {
      "short": "Entfernen Sie Servohorn",
      "title": "Entfernen Sie Servohorn",
      "text": "Lösen Sie zuerst die ursprüngliche Befestigungsschraube in der Mitte des Servohorn und entfernen Sie dann die schwarze Servohorn in Richtung der Abtriebswelle.",
      "check": "Legen Sie den Servohorn und die Originalschrauben beiseite. Spätere Schritte werden es nicht durch selbstschneidende Schrauben ersetzen.",
      "caption": "Entfernen Sie zuerst die Zentralschraube und entfernen Sie dann das Servohorn"
    },
    "l-plug": {
      "short": "Stecken Sie das Kabel ein",
      "title": "Stecken Sie die Servo-Leitung ein",
      "text": "Richten Sie das Anschlussloch des Steckers am Vorsprung der Schnittstelle aus, führen Sie ihn in Richtung der Schnittstelle ein und drücken Sie ihn dann fest.",
      "check": "Überprüfen Sie die Steckrichtung genau. Der Steckvorgang wird hier demonstriert. Die Pin-Belegung des dreiadrigen Kabels muss noch physisch überprüft werden.",
      "caption": "Richten Sie die Schnittstelle aus und drücken Sie sie fest"
    },
    "l-shank": {
      "short": "Festes Kalb",
      "title": "Fester Unterschenkelanschluss",
      "text": "Bringen Sie den weißen unteren Beinverbinder an Servo an, richten Sie die Montagelöcher aus und schrauben Sie dann zwei selbstschneidende Senkkopfschrauben M2×6 ein.",
      "check": "Das lange Ende des Steckers muss nach oben zeigen. Richten Sie zuerst die Löcher aus und befestigen Sie dann die Teile. Verwenden Sie keine Schrauben, um falsch ausgerichtete Teile in die Einbauposition zu zwingen.",
      "caption": "Richtiges Loch · M2×6 ×2"
    },
    "l-foot": {
      "short": "Passt in die Fußsohle",
      "title": "Installieren Sie Servo in der Fußsohle",
      "text": "Setzen Sie das Modul bestehend aus Servo und Wadenverbinder in die Fußsohle ein und befestigen Sie die vier selbstschneidenden Senkkopfschrauben M2×6, wie im Video gezeigt.",
      "check": "Bestätigen Sie zunächst die Ausrichtung der Fußsohlen und Gelenke und fixieren Sie dann die vier Positionen. Die Kabel bleiben außen.",
      "caption": "Fester Fuß · M2×6 ×4"
    },
    "l-small-bearing": {
      "short": "Drücken Sie Lager",
      "title": "Drücken Sie den kleinen Lager hinein",
      "text": "Richten Sie den kleinen Lager am kreisförmigen Montageloch an der Fußsohle aus und drücken Sie ihn in axialer Richtung hinein.",
      "check": "Lager muss aufrecht sitzen, mit dem Mittelloch und dem Stecker koaxial. Die Modellnummer entspricht laut Liste 10×15×3 mm.",
      "caption": "Axial eindrücken"
    },
    "l-axle": {
      "short": "Installieren Sie den Knöchelschaft",
      "title": "Richten Sie den Knöchelschaft aus und installieren Sie ihn",
      "text": "Richten Sie das mittlere Loch aus, platzieren Sie die gedruckte Knöchelachse in der Mitte von Lager und schrauben Sie dann die selbstschneidende Schraube M2.3×8 manuell ein.",
      "check": "Die Knöchelachse nutzt das vorhandene 3MF-Raster; Die Positionierung hier wurde für die Anzeige angepasst und nicht auf physische Passform überprüft.",
      "caption": "Richten Sie Lager mittig aus"
    },
    "l-tighten": {
      "short": "Überprüfung behoben",
      "title": "Anziehen und prüfen",
      "text": "Schrauben Sie die M2.3×8-Schraube axial ein, bis der Schraubenkopf am Untergrund anliegt, und überprüfen Sie dann die Knöchelverbindung.",
      "check": "Im Video wird gefordert, dass der Schraubenkopf fest sitzt und das Ende auf der anderen Seite herauskommt. Der Prototyp demonstriert nur die Bewegung und simuliert kein tatsächliches Drehmoment oder Toleranzen.",
      "caption": "Anziehen, bis der Schraubenkopf passt"
    },
    "l-ankle-done": {
      "short": "Vollständige Besichtigung",
      "title": "Der linke Knöchel ist eingebaut",
      "text": "Sie können die Inspektion rotieren lassen, bevor Sie mit der nächsten Stufe fortfahren. Sohlenpolster werden in der Endbearbeitungsphase der Beine angebracht.",
      "check": "Die Unterfußpolster sind in diesem Abschnitt noch nicht installiert; Sie werden später im Video an den Beinen angebracht.",
      "caption": ""
    },
    "r-pair": {
      "short": "Doppeltes Servo ausrichten",
      "title": "Richten Sie die beiden Servo am rechten Bein aus",
      "text": "Ordnen Sie ID12 / ID13 per Video an, richten Sie das Paar Servo aus. Die linke und rechte Seite im Bild stellen den Aufnahmewinkel dar und entsprechen nicht direkt der linken und rechten Seite des Roboters.",
      "check": "Behalten Sie den anderen fertigen Knöchel; Überprüfen Sie die aktuelle Seite.",
      "caption": "Überprüfen Sie Servo mit Richtung"
    },
    "r-support": {
      "short": "Feste Oberschenkelstütze",
      "title": "Feste Oberschenkelstütze mit doppelter Öse",
      "text": "Befestigen Sie die weiße Doppelrundlochhalterung am Paar Servo, richten Sie die vier festen Positionen aus und schrauben Sie die vier M2×6 ein, wie im Video gezeigt.",
      "check": "Loch für Loch prüfen und dann reparieren. Die Lochposition und die Einbaukoordination sind noch Prototypenangaben.",
      "caption": "M2×6 ×4 · Feste Unterstützung"
    },
    "r-bearing": {
      "short": "Drücken Sie den großen Lager hinein",
      "title": "Drücken Sie in den großen Lager, der den Knöchel verbindet",
      "text": "Richten Sie 16×22×4 mm und das große Lager am Stützloch aus und drücken Sie es entlang der axialen Richtung fest.",
      "check": "Lager sollte aufrecht sitzen und dann den installierten Knöchel verbinden.",
      "caption": "Den großen Lager in axialer Richtung eindrücken"
    },
    "r-join": {
      "short": "Befestigter Knöchel",
      "title": "Befestigen Sie die rechte Knöchel-Unterbaugruppe",
      "text": "Bewegen Sie den fertigen Knöchel und die Wade als Ganzes in die Lager-Position der Oberschenkelstütze und befestigen Sie vier M2×6.",
      "check": "Es sind bereits Schrauben, Gelenke und Kabel vorhanden, die sich mit der Unterbaugruppe bewegen.",
      "caption": "Gesamtausrichtung · M2×6 ×4"
    },
    "r-wire-a": {
      "short": "In das Bein einsetzen Kabelbaum",
      "title": "Stecken Sie den sichtbaren Beinbus ein",
      "text": "Stecken Sie die sichtbare dreipolige Servo-Leitung entsprechend dem Video ein und ziehen Sie sie fest, sodass Spielraum für Gelenkbewegung bleibt.",
      "check": "Paarung und Routing werden hier demonstriert; Die genauen Anschlüsse und Pinbelegungen an jedem Ende jedes Kabels wurden nicht überprüft.",
      "caption": "Stecker Kabelbaum · Endpunktdiagramm"
    },
    "r-wire-b": {
      "short": "Organisieren Sie die Kabelbaum-Marge",
      "title": "Ordnen Sie Kabelbaum an und lassen Sie die obere Verbindungslinie stehen",
      "text": "Ordnen Sie den Schleifendraht so an, dass Kabelbaum an der Außenseite des Mechanismus verbleibt, und bewahren Sie die nachfolgenden Drahtenden auf, die mit dem Gehäuse verbunden sind.",
      "check": "Klemmen Sie den Faden nicht ein und beurteilen Sie die Pin-Belegung nicht anhand des Aussehens des dreiadrigen schwarzen Kabels.",
      "caption": "Freiraum für Bewegung lassen · Keine Fadenklemmung"
    },
    "r-leg-done": {
      "short": "Verbindung des rechten Beins abgeschlossen",
      "title": "Verbindungsteil für das rechte Bein fertiggestellt",
      "text": "Überprüfen Sie den verbundenen Knöchel, die doppelte Servo-Orthese und Kabelbaum und fahren Sie dann mit der nächsten Stufe fort.",
      "check": "Die oberen Anschlüsse und Unterfußpolster sind noch nicht installiert.",
      "caption": ""
    },
    "l-pair": {
      "short": "Doppeltes Servo ausrichten",
      "title": "Richten Sie die beiden Servo am linken Bein aus",
      "text": "Ordnen Sie ID23 / ID22 per Video an, richten Sie das Paar Servo aus. Die linke und rechte Seite im Bild stellen den Aufnahmewinkel dar und entsprechen nicht direkt der linken und rechten Seite des Roboters.",
      "check": "Behalten Sie den anderen fertigen Knöchel; Überprüfen Sie die aktuelle Seite.",
      "caption": "Überprüfen Sie Servo mit Richtung"
    },
    "l-support": {
      "short": "Feste Oberschenkelstütze",
      "title": "Feste Oberschenkelstütze mit doppelter Öse",
      "text": "Befestigen Sie die weiße Doppelrundlochhalterung am Paar Servo, richten Sie die vier festen Positionen aus und schrauben Sie die vier M2×6 ein, wie im Video gezeigt.",
      "check": "Loch für Loch prüfen und dann reparieren. Die Lochposition und die Einbaukoordination sind noch Prototypenangaben.",
      "caption": "M2×6 ×4 · Feste Unterstützung"
    },
    "l-bearing": {
      "short": "Drücken Sie den großen Lager hinein",
      "title": "Drücken Sie in den großen Lager, der den Knöchel verbindet",
      "text": "Richten Sie 16×22×4 mm und das große Lager am Stützloch aus und drücken Sie es entlang der axialen Richtung fest.",
      "check": "Lager sollte aufrecht sitzen und dann den installierten Knöchel verbinden.",
      "caption": "Den großen Lager in axialer Richtung eindrücken"
    },
    "l-join": {
      "short": "Befestigter Knöchel",
      "title": "Befestigen Sie die Unterbaugruppe des linken Knöchels",
      "text": "Bewegen Sie den fertigen Knöchel und die Wade als Ganzes in die Lager-Position der Oberschenkelstütze und befestigen Sie vier M2×6.",
      "check": "Es sind bereits Schrauben, Gelenke und Kabel vorhanden, die sich mit der Unterbaugruppe bewegen.",
      "caption": "Gesamtausrichtung · M2×6 ×4"
    },
    "l-wire-a": {
      "short": "In das Bein einsetzen Kabelbaum",
      "title": "Stecken Sie den sichtbaren Beinbus ein",
      "text": "Stecken Sie die sichtbare dreipolige Servo-Leitung entsprechend dem Video ein und ziehen Sie sie fest, sodass Spielraum für Gelenkbewegung bleibt.",
      "check": "Paarung und Routing werden hier demonstriert; Die genauen Anschlüsse und Pinbelegungen an jedem Ende jedes Kabels wurden nicht überprüft.",
      "caption": "Stecker Kabelbaum · Endpunktdiagramm"
    },
    "l-wire-b": {
      "short": "Organisieren Sie die Kabelbaum-Marge",
      "title": "Ordnen Sie Kabelbaum an und lassen Sie die obere Verbindungslinie stehen",
      "text": "Ordnen Sie den Schleifendraht so an, dass Kabelbaum an der Außenseite des Mechanismus verbleibt, und bewahren Sie die nachfolgenden Drahtenden auf, die mit dem Gehäuse verbunden sind.",
      "check": "Klemmen Sie den Faden nicht ein und beurteilen Sie die Pin-Belegung nicht anhand des Aussehens des dreiadrigen schwarzen Kabels.",
      "caption": "Freiraum für Bewegung lassen · Keine Fadenklemmung"
    },
    "l-leg-done": {
      "short": "Das linke Bein ist verbunden",
      "title": "Der Verbindungsteil für das linke Bein ist fertiggestellt",
      "text": "Überprüfen Sie den verbundenen Knöchel, die doppelte Servo-Orthese und Kabelbaum und fahren Sie dann mit der nächsten Stufe fort.",
      "check": "Die oberen Anschlüsse und Unterfußpolster sind noch nicht installiert.",
      "caption": ""
    },
    "r-top-horn": {
      "short": "Entfernen Sie den oberen Teil des rechten Beins Servohorn",
      "title": "Entfernen Sie den Original-Servohorn am oberen rechten Bein",
      "text": "Entfernen Sie zuerst die zentrale Befestigungsschraube, entfernen Sie dann den Servohorn und legen Sie ihn daneben.",
      "check": "Das obere Ende wird entsprechend dem Video hier bearbeitet; Entfernen Sie nicht den festen Knöchel.",
      "caption": "Entfernen Sie zuerst die Zentralschraube und nehmen Sie dann den Servohorn heraus"
    },
    "l-top-horn": {
      "short": "Entfernen Sie den oberen Teil des linken Beins Servohorn",
      "title": "Entfernen Sie den Original-Servohorn am oberen linken Bein",
      "text": "Bearbeiten Sie das andere Bein in Spiegelrichtung und entfernen Sie nacheinander die Zentralschraube und Servohorn.",
      "check": "Die ausgebauten Originalteile verbleiben im Teilebereich.",
      "caption": "Bewahren Sie die ausgebauten Originalteile auf"
    },
    "r-top-bearing": {
      "short": "Rechtes Verbindungsstück drücken Lager",
      "title": "Drücken Sie zunächst Lager in den oberen rechten Anschluss",
      "text": "Drücken Sie den großen Lager in den separaten oberen Anschluss und befestigen Sie dann die Baugruppe am Bein.",
      "check": "Drücken Sie zuerst Lager und installieren Sie dann den Stecker. Machen Sie diese beiden Schritte nicht rückgängig.",
      "caption": "Drücken Sie zunächst Lager in den Stecker"
    },
    "r-top-link": {
      "short": "Rechten Stecker einbauen",
      "title": "Befestigen Sie den oberen rechten Stecker mit Lager",
      "text": "Richten Sie den eingepressten Stecker Lager auf die obere Endposition aus und fixieren Sie ihn mit vier M2×6.",
      "check": "Der Stecker bewegt sich mit dem Lager darin.",
      "caption": "Gesamtinstallation der Komponenten · M2×6 ×4"
    },
    "l-top-bearing": {
      "short": "Linkes Verbindungsstück drücken Lager",
      "title": "Drücken Sie Lager in den oberen linken Anschluss",
      "text": "Drücken Sie den großen Lager in den Anschluss auf der anderen Seite und behalten Sie dabei die Spiegelausrichtung bei.",
      "check": "Die linken und rechten Anschlüsse verwenden ihre eigenen echten Netze.",
      "caption": "Spiegelrichtung · Drücken Sie zuerst Lager"
    },
    "l-top-link": {
      "short": "Linken Stecker einbauen",
      "title": "Befestigen Sie den oberen linken Stecker mit Lager",
      "text": "Montieren Sie das Verbindungsstück auf der anderen Seite mit Lager und befestigen Sie es mit vier M2×6.",
      "check": "Überprüfen Sie, ob die Richtungen auf beiden Seiten übereinstimmen und eine Verbindungsposition für die spätere Karosseriemontage frei bleibt.",
      "caption": "Gesamtinstallation der Komponenten · M2×6 ×4"
    },
    "r-sole": {
      "short": "Festes Sohlenpolster für den rechten Fuß",
      "title": "Installieren Sie das rechte Sohlenpolster",
      "text": "Bringen Sie das weiche Polster an Ihrer Fußsohle an, richten Sie die vier Löcher entsprechend dem Video aus und befestigen Sie die vier M2×6.",
      "check": "Dabei handelt es sich um das Sohlenpolster, nicht um die Oberschenkelschale, die später in der Endmontagephase hinzukommt.",
      "caption": "Richten Sie Ihre Fußsohlen aus · M2×6 ×4"
    },
    "l-sole": {
      "short": "Festes linkes Sohlenpolster",
      "title": "Installieren Sie das Sohlenpolster des linken Fußes",
      "text": "Bringen Sie ein weiches Polster an der Unterseite des anderen Fußes an und befestigen Sie vier M2×6, wie im Video gezeigt.",
      "check": "Überprüfen Sie den Zustand der Sohlen beider Füße und Kabelbaum und fahren Sie dann mit dem Zusammenbau von Körper und Hüfte fort.",
      "caption": "Richten Sie Ihre Fußsohlen aus · M2×6 ×4"
    },
    "legs-complete": {
      "short": "Gesamtansicht der Beine",
      "title": "Die zweibeinige Unterbaugruppe ist installiert",
      "text": "Sie können sich jetzt drehen, um beide Beine zu sehen, oder zu einer beliebigen Bühne zurückkehren, um sie erneut zu sehen.",
      "check": "Die aktuelle Stufe ist 08:16; Der nächste Schritt besteht darin, die Körperhüften zu installieren und dann den Kopf, den Hals und die elektronische Steuerung zusammenzubauen.",
      "caption": ""
    },
    "t-pair": {
      "short": "Doppeltes Servo anordnen",
      "title": "Ordnen Sie die Nummern ID20 und ID10 an",
      "text": "Ordnen Sie zwei zentrierte Servo entsprechend der Desktop-Perspektive des Originalfilms an: ID20 auf der linken Seite des Bildschirms und ID10 auf der rechten Seite. Behalten Sie die Originalteile Servohorn.",
      "check": "Die linke und rechte Seite des Bildschirms entspricht nicht direkt der linken und rechten Seite des Roboters. Das Raster wird entsprechend den vorhandenen Koordinaten der gesamten Maschine platziert und die Installationskoordination steht noch zur physischen Überprüfung an.",
      "caption": "Bildschirm links 20 · Bildschirm rechts 10"
    },
    "t-support": {
      "short": "feste Hüftstütze",
      "title": "Befestigen Sie die Doppelrundloch-Hüftstütze mit sechs Schrauben",
      "text": "Platzieren Sie die P6-09-Hüftstütze mit doppeltem Rundloch auf den beiden Servo, richten Sie sie aus und befestigen Sie die sechs selbstschneidenden Senkkopfschrauben M2×6.",
      "check": "Lassen Sie die beiden unteren Löcher in der Mitte, wie im Video erwähnt, und befestigen Sie diese beiden Löcher nicht mit Schrauben. Animierte Schraubenankerpunkte sind Lochgruppendarstellungen.",
      "caption": "M2×6 ×6 · Lassen Sie die beiden mittleren Löcher unten leer"
    },
    "t-wire": {
      "short": "Anschließen und Verkabeln",
      "title": "Kabelbaum ist an der eingesetzten Hüfte sichtbar und kommt heraus",
      "text": "Drücken Sie unter Bezugnahme auf die Demonstration im Originalfilm die beiden sichtbaren Stecker Servo auf den Roboterkörper. Legen Sie die Anschlusskabel für den Hüftmotor bzw. die reservierten Kabel für die Hauptplatine beiseite und führen Sie die reservierten Kabel aus der Öffnung heraus.",
      "check": "Die Doppelsteckdose wird als einfaches Lehrmodell entsprechend den Eigenschaften der Quellgitteroberfläche positioniert. Der Kabelbaum-Pfad, die Socket-Identität und die Pins wurden nicht überprüft, und die beiden Körper Servo werden nicht ohne Genehmigung als miteinander verbunden dargestellt.",
      "caption": "Zuerst axial einstecken, dann die Drähte einfädeln, Schaltplan"
    },
    "t-backplate-front": {
      "short": "Karosserierückwand einbauen",
      "title": "Montieren Sie die Rückwand des Gehäuses und befestigen Sie die beiden Schrauben an der Vorderseite",
      "text": "Richten Sie die Rückwand des P4-03-Körpers an der Hüftbaugruppe aus. Befestigen Sie zunächst die beiden sichtbaren M2×6-Elemente auf der Vorderseite des Originalteils.",
      "check": "Die Rückwand und Kabelbaum sollten zuerst zusammengefügt und dann festgezogen werden, ohne den Faden in der Naht zu versiegeln. Die Lochpositionen dienen weiterhin Lehrzwecken.",
      "caption": "Vorne M2×6 ×2"
    },
    "t-backplate-back": {
      "short": "hinten fixiert",
      "title": "Befestigen Sie die beiden Schrauben auf der Rückseite der Rückwand",
      "text": "Arbeiten Sie weiter an der Rückseite und befestigen Sie die anderen beiden M2×6. Die beiden PCs auf der Vorderseite und die beiden PCs auf der Rückseite der Rückwand werden separat demonstriert.",
      "check": "Dieser Schritt fügt zwei neue hinzu und zählt die vorherige Gruppe nicht erneut.",
      "caption": "Zurück M2×6 ×2"
    },
    "t-yaw-r": {
      "short": "Rechtes Verbindungsteil montieren",
      "title": "Drücken Sie zuerst Lager und installieren Sie dann den rechten Yaw–Roll-Stecker",
      "text": "Drücken Sie zuerst den großen Lager in den unabhängigen P6-06-Stecker und richten Sie dann den gesamten Stecker mit Lager an der rechten Seite des Gehäuses aus. Abschließend wird die Befestigungslochgruppe demonstriert.",
      "check": "Originalfilm 09:41 Im Anschluss ist Lager zu sehen. 10:05 Untertitel sind vier M2×6, aber die Anzahl und Lochgruppenzuordnungen auf jeder Seite müssen noch überprüft werden; die animierten Schrauben sind nur angedeutet.",
      "caption": "Drücken Sie zunächst Lager → Gesamtausrichtung · Lochgruppendiagramm"
    },
    "t-yaw-l": {
      "short": "Installieren Sie den linken Stecker",
      "title": "Installieren Sie die linke Seite Lager und den Stecker in Spiegelrichtung",
      "text": "Drücken Sie zuerst den anderen großen Lager in den unabhängigen Stecker P6-07 und bewegen Sie dann diese Komponente zur linken Seite des Gehäuses, um sie zu befestigen.",
      "check": "Der Originalfilm 09:57 ist als Lager zu sehen. Der linke und der rechte Teil verwenden ihre eigenen realen Gitter; Die Anzahl der Schrauben und die genauen Lochpositionen auf jeder Seite müssen überprüft werden.",
      "caption": "Spiegelrichtung · Drücken Sie zuerst Lager und installieren Sie dann den Stecker"
    },
    "t-roll-pair": {
      "short": "Nehmen Sie den angesagten Servo",
      "title": "Entfernen Sie die beiden Hüften ID21 und ID11 und Servo",
      "text": "Der Desktop-Betrachtungswinkel des Originalfilms beträgt links ID21 und rechts ID11. Die beiden Servo werden zunächst in die unabhängige Vorbereitungsposition gebracht und sind noch nicht in den Körper geladen.",
      "check": "Überprüfen Sie die Anzahl und den Zentrierungsstatus und bereiten Sie die Entfernung des ursprünglichen Servohorn vor.",
      "caption": "Bildschirm links 21 · Bildschirm rechts 11"
    },
    "t-roll-horns": {
      "short": "Entladezentrum Servohorn",
      "title": "Entfernen Sie zuerst die Zentralschraube und entfernen Sie dann die beiden Original-Servohorn",
      "text": "Entfernen Sie nacheinander die ursprünglichen zentralen Befestigungsschrauben und entfernen Sie dann Servohorn in axialer Richtung. Die entnommenen Kleinteile werden im Teilebereich daneben aufbewahrt.",
      "check": "Die Spezifikationen der Original-Zentralschrauben wurden nicht überprüft und sie zählen nicht zu den selbstschneidenden M2×6-Schrauben.",
      "caption": "Zuerst die Zentralschraube entfernen → dann Servohorn herausnehmen"
    },
    "t-motor-r": {
      "short": "Installieren Sie den rechten Hüftmotor",
      "title": "Nach der Verkabelung installieren Sie die rechte Seite ID11 Hüfte Servo",
      "text": "Schließen Sie gemäß dem Originalstück zuerst das reservierte Kabel am Körper an und dann das freie Ende des vorhandenen Kabels am kompletten rechten Bein. Nachdem zwei Einfügungen abgeschlossen sind, stecken Sie den ID11 in den rechten Anschluss und befestigen Sie schließlich die beiden M2×6.",
      "check": "Die Drahtenden und Stifte dienen nur zur Veranschaulichung und die Polarität oder Buszweige können anhand des Aussehens des schwarzen dreiadrigen Kabels nicht bestimmt werden. Bewahren Sie den Bewegungsspielraum der Gelenke.",
      "caption": "Zuerst verdrahten → Ausrichtung · M2×6 ×2"
    },
    "t-cover-r": {
      "short": "Bringen Sie die rechte Abdeckung an",
      "title": "Befestigen Sie die rechte Roll Servo-Abdeckung mit vier Schrauben",
      "text": "Bringen Sie die P6-02-Abdeckplatte an der rechten Hüfte an, achten Sie darauf, dass Kabelbaum nicht in der Abdeckplatte eingeklemmt wird, und befestigen Sie dann die vier M2×6-Teile.",
      "check": "Nachdem die Abdeckung befestigt ist, drücken Sie Lager auf den oberen Anschluss des unabhängigen kompletten Beins; Das gesamte Bein ist noch nicht verbunden.",
      "caption": "Richten Sie die Abdeckung aus · M2×6 ×4"
    },
    "t-bearing-r": {
      "short": "Drücken Sie die rechte große Taste Lager",
      "title": "Vor dem Anbringen des Beins das große Lager in die rechte Anschlussstelle einpressen",
      "text": "Sehen Sie sich die Szene nach 11:18 im Video an: Drücken Sie den neuen 16×22×4 mm und den größeren Lager axial in den oberen Anschluss des unabhängigen rechten Beins und bereiten Sie dann die Verbindung dieses Beins mit dem Körper des Roboters vor.",
      "check": "Dabei handelt es sich nicht um das obere Ende Lager, das bereits im Beinmodul installiert ist. Dieser Schritt drückt nur auf den neuen Lager und das rechte Bein befindet sich noch in der Bereitschaftsposition; Koaxiale Zusammenarbeit ist ein Signal.",
      "caption": "Zuerst Lager drücken · Das intakte Bein bewegt sich vorerst nicht."
    },
    "t-join-r": {
      "short": "Zugang zum rechten Bein",
      "title": "Befestigen Sie die komplette Baugruppe des rechten Beins am Körper",
      "text": "Bewegen Sie das installierte rechte Bein als Ganzes in die Körperverbindungsposition, richten Sie es aus und befestigen Sie die vier M2×6. Die Schrauben an den Beinen Lager und Kabelbaum bewegen sich zusammen.",
      "check": "Bewegen Sie nur dieses Bein. Das andere Bein bleibt in der Vorbereitungsposition; Lochposition und Montagetoleranzen müssen noch physisch überprüft werden.",
      "caption": "Vollständige Integration des rechten Beins · M2×6 ×4"
    },
    "t-motor-l": {
      "short": "Installieren Sie den linken Hüftmotor",
      "title": "Installieren Sie nach der Verkabelung die andere Seite ID21, Hüfte Servo",
      "text": "Je nach Spiegelrichtung verbinden Sie zunächst die reservierte Leitung am Körper und anschließend das freie Ende der vorhandenen Leitung am kompletten linken Bein. Nachdem die beiden Einfügungen abgeschlossen sind, installieren Sie den ID21 im Stecker und befestigen Sie die beiden M2×6.",
      "check": "Das fertige rechte Bein bleibt verbunden. Die Kabelbaum-Pfade und Endpunkte werden weiterhin als schematisch markiert und es werden keine elektrischen Pins abgeleitet.",
      "caption": "Zuerst verdrahten → Ausrichtung · M2×6 ×2"
    },
    "t-cover-l": {
      "short": "Installieren Sie die linke Abdeckung",
      "title": "Befestigen Sie die Roll Servo-Abdeckung auf der anderen Seite",
      "text": "Bringen Sie die P6-03-Abdeckplatte an der linken Hüfte an, stellen Sie sicher, dass Kabelbaum keine Nähte aufweist, und befestigen Sie dann vier M2×6-Teile.",
      "check": "Das linke Bein befindet sich weiterhin in der unabhängigen Vorbereitungsposition. Der nächste Schritt besteht darin, den neuen Lager an seinem oberen Anschluss zu installieren.",
      "caption": "Richten Sie die Abdeckung aus · M2×6 ×4"
    },
    "t-bearing-l": {
      "short": "Drücken Sie links groß Lager",
      "title": "Drücken Sie vor dem Einsetzen des zweiten Beins Lager",
      "text": "Sehen Sie sich die Szene nach 12:28 im Video an: Drücken Sie den anderen neuen großen Lager in den oberen Anschluss des unabhängigen linken Beins und schließen Sie dann die zweite vollständige Beinbaugruppe an.",
      "check": "Das rechte Bein wurde eingebaut; das linke Bein hat sich noch nicht bewegt. Die Lager-Haltung und Kontaktfläche werden anhand des vorhandenen Modells veranschaulicht.",
      "caption": "Zuerst Lager drücken · Das linke Bein befindet sich noch in der Bereitschaftsposition"
    },
    "t-join-l": {
      "short": "Zugang zum linken Bein",
      "title": "Befestigen Sie das zweite komplette Bein und befestigen Sie es",
      "text": "Bewegen Sie die Unterbaugruppe des linken Beins als Ganzes in die Körperverbindungsposition, überprüfen Sie die Ausrichtung und befestigen Sie dann vier M2×6.",
      "check": "Alle am linken Bein verbauten Teile bewegen sich zusammen mit Kabelbaum; das rechte Bein bleibt stationär.",
      "caption": "Vollständige Integration des linken Beins · M2×6 ×4"
    },
    "t-complete": {
      "short": "Beine prüfen",
      "title": "Überprüfen Sie die Verbindung zwischen Körper und Beinen",
      "text": "Der Körper, die Hüften Servo und zwei Beine sind im Prototyp bereits verbunden. Drehen, um die Ausrichtung beider Seiten, der Abdeckplatte und der Kabelbaum-Reservierung anzuzeigen.",
      "check": "Hier wird nur der Animationsstatus überprüft. Die Lochpositionen, Toleranzen, Drahtenden und die physische Belastung wurden noch nicht akzeptiert, und der nächste Schritt wird mit dem Kopf und Hals sowie der Endmontage fortgesetzt.",
      "caption": ""
    },
    "head-yaw-motor": {
      "short": "Zuerst Lager, dann Servo",
      "title": "Zuerst Lager eindrücken, dann ID32 und die erste Halterung befestigen",
      "text": "Drücken Sie entsprechend dem Originalteil zunächst einen Lager in die erste weiße Halterung, setzen Sie dann den nummerierten und zentrierten ID32 ein und befestigen Sie nach dem Einbau vier M2×6. Die erste Halterung verwendet P6-01.",
      "check": "Lager ist schematisch entlang der Achse des Quellgitterzylinders installiert; die axiale Sitzfläche und die physikalischen Passtoleranzen müssen noch überprüft werden.",
      "caption": "Drücken Sie zuerst Lager, passen Sie dann M2×6 ×4 an und befestigen Sie es"
    },
    "head-yaw-wire": {
      "short": "Einsteckbares Drehkabel",
      "title": "Stecken Sie die Leitung Servo in ID32",
      "text": "Richten Sie die Richtung der sichtbaren Schnittstelle aus und drücken Sie den Stecker fest; Behalten Sie das folgende Liniensegment um die Klammer bei.",
      "check": "Der Kabelbaum-Pfad und die Buchsenidentität dienen Lehrzwecken und die Pins und Polarität müssen überprüft werden.",
      "caption": "Festdrücken · Endpunktanzeige"
    },
    "head-bearings": {
      "short": "Zuerst Lager eindrücken",
      "title": "Drücken Sie zunächst Lager auf die unabhängige Halterung",
      "text": "Nehmen Sie die zweite weiße offene Halterung P6-08, drücken Sie Lager entsprechend dem Originalteil in die beiden Lager-Positionen der unabhängigen Halterung und montieren Sie dann ID33.",
      "check": "Der erste Lager wurde auf der ersten Halterung installiert; Hier sind die anderen beiden in der zweiten Klammer. Die axiale Position folgt dem Quellgitter und die physische Passung muss überprüft werden.",
      "caption": "Zweite Halterung · Zwei Lager nacheinander eindrücken"
    },
    "head-roll-motor": {
      "short": "Zweitens Servo laden",
      "title": "Installieren Sie ID33 in der vorbereiteten Halterung",
      "text": "Nehmen Sie laut Video ID33, richten Sie es an der Halterung aus, die Lager gedrückt hat, und befestigen Sie zunächst die vier im ersten Teil des Bildschirms markierten M2×6.",
      "check": "Die Unterbaugruppen ID32 und Kabelbaum bleiben erhalten; Der endgültige Satz Löcher für beide Befestigungsstellen muss noch überprüft werden.",
      "caption": "Die erste Fixierung · M2×6 ×4"
    },
    "head-core-join": {
      "short": "Kombiniertes Rotationsmodul",
      "title": "Verbinden Sie die Unterkomponenten der beiden Köpfe Servo",
      "text": "Lassen Sie die ID32-Unterbaugruppe an Ort und Stelle und verbinden Sie die ID33-Halterungsunterbaugruppe, mit der Lager als Ganzes installiert wurde. Befestigen Sie es dann mit vier M2×6-Schrauben gemäß den Anweisungen, die an zweiter Stelle auf dem Bildschirm markiert sind.",
      "check": "P6-08 und seine beiden Lager bewegen sich mit der Unterbaugruppe ID33; P6-01 und der erste Lager bleiben auf der ID32-Seite. Die Lochachse stammt aus dem Quellgitter und die physische Passung muss überprüft werden.",
      "caption": "Gesamtes Andocken und Neufixieren von Unterbaugruppen M2×6 ×4"
    },
    "head-core-horn-wire": {
      "short": "Deinstallieren und verbinden",
      "title": "Entfernen Sie den Kopfausgang Servohorn und verdrahten Sie ihn",
      "text": "Lösen Sie zuerst die ursprüngliche zentrale Befestigungsschraube, entfernen Sie dann den Servohorn und bewahren Sie ihn daneben auf; Schließen Sie dann die sichtbare Servo-Leitung an.",
      "check": "Die mittlere Originalschraube ist nicht als selbstschneidend M2 klassifiziert. Die Positionen der Abtriebswelle und der Anschlüsse sind noch Richtwerte.",
      "caption": "Entfernen Sie zuerst die Zentralschraube und nehmen Sie dann den Servohorn heraus"
    },
    "head-platform": {
      "short": "Setzen Sie die Kopfplattform ein",
      "title": "Setzen Sie die rotierende Unterbaugruppe als Ganzes in die Kopfplattform ein",
      "text": "Platzieren Sie die verbundene Kopfrotationsbaugruppe als Ganzes in der P2-02-Kopfplattform. Lassen Sie die angeschlossenen Drähte aus der Öffnung herauskommen.",
      "check": "Lager, montierte Schrauben, Kabelbaum und Dübel bewegen sich zusammen; Drücken Sie den Draht nicht unter die Plattform.",
      "caption": "Die Baugruppe wird als Ganzes platziert und die Drähte werden aus der Öffnung herausgeführt."
    },
    "head-mouth-prepare": {
      "short": "Überprüfen Sie den Mund Servo",
      "title": "Entfernen Sie ein Mundstück Servo und überprüfen Sie die Anzahl",
      "text": "Der Untertitel des Servo im Originalfilm lautet „Nummer 33“, und die offizielle Software definiert den Mund als ID34; Dieser Prototyp behält die Mehrdeutigkeit von 33 / 34 bei und die tatsächliche Anzahl muss überprüft werden.",
      "check": "Ändern Sie auf dieser Grundlage nicht die Nummer eines anderen ID33. Die Geometrie dient lediglich als eigenständiger Kandidat für den Mund Servo.",
      "caption": "Video 33 / Offizielles 34 · Zur Überprüfung"
    },
    "head-mouth-horn-wire": {
      "short": "Mund Servo Entladelinie",
      "title": "Entfernen Sie das Mundstück Servohorn und schließen Sie Kabelbaum an",
      "text": "Entfernen Sie zuerst die zentrale Befestigungsschraube, entfernen Sie dann den Mund Servohorn und bewahren Sie ihn auf. Fügen Sie die Servo-Leitung entsprechend dem Video ein und drücken Sie sie fest.",
      "check": "Es besteht weiterhin Unklarheit bei der Nummerierung. Steckerkodierung, tatsächliche Buchsen und Pinbelegung werden durch diese Animation nicht bestätigt.",
      "caption": "Zuerst Servohorn entfernen, dann Kabelbaum einstecken"
    },
    "head-mouth-jaw": {
      "short": "Mundservo und Kieferteil einsetzen",
      "title": "Mundservo einsetzen, dann das Kieferteil aufsetzen",
      "text": "Setzen Sie zuerst den Mund des Roboters Servo in die Plattform ein. Richten Sie beide Seiten des Roboterbackenteils P2-01 an der Antriebswelle und der Stützposition aus und setzen Sie es dann ein. Kabelbaum sollte durch die Öffnung gehen und herausragen.",
      "check": "Diese Animation drückt die Sequenzbeziehung aus; Die Wellenlöcher auf beiden Seiten, die tatsächlichen Abstände und die Passgenauigkeit müssen überprüft werden.",
      "caption": "Servo einsetzen, dann Roboterkiefer aufsetzen"
    },
    "head-servo-support": {
      "short": "Decken Sie die Befestigung ab",
      "title": "Montieren Sie das Kopfbefestigungsstück Servo",
      "text": "Befestigen Sie das P4-02-Kopfbefestigungsstück Servo am Mechanismus auf der Plattform. Verwenden Sie zur Befestigung gemäß den Anweisungen im ersten Untertitel vier M2×6-Schrauben.",
      "check": "Halten Sie Ihren Kiefer beweglich und vermeiden Sie Kabelbaum. Die genauen Positionen der vier Löcher sind noch Richtwerte.",
      "caption": "Die erste Lochgruppe · M2×6 ×4"
    },
    "head-platform-fix": {
      "short": "Feste Kinnausgangsseite",
      "title": "Vier Löcher auf der Ausgangsseite des festen Kinns",
      "text": "Befestigen Sie es gemäß den Anweisungen der zweiten vier M2×6 am Originalteil von der Außenseite der Antriebsseite des Kinns. Hier wird die Vierlochachse des P2-01 Quellgitters verwendet.",
      "check": "Die eingebauten Schrauben öffnen und schließen sich dann zusammen mit dem Kinn. Die Lochachse des Quellgitters kann überprüft werden, die physikalischen Spezifikationen und die Koordination müssen jedoch noch überprüft werden.",
      "caption": "Kinnausgangsseite · M2×6 ×4"
    },
    "head-mouth-check": {
      "short": "Überprüfen Sie das Öffnen und Schließen des Mundes",
      "title": "Überprüfen Sie das Öffnen und Schließen des Kinns sowie den Kabelbaum-Status",
      "text": "Bewegen Sie den unteren Backenteil des Roboters vorsichtig, um zu prüfen, ob er sich öffnen und schließen lässt, ob er nicht offensichtlich festsitzt und ob auf beiden Seiten keine Kabel eingeklemmt sind. Die Animation zeigt nur einmal das Öffnen und Schließen.",
      "check": "Dies ist nur ein Zeichen für das Öffnen und Schließen und kehrt am Ende in die geschlossene Position zurück. Ob das tatsächliche Produkt glatt ist, müssen der Spalt und der Servo-Winkel überprüft werden.",
      "caption": "Öffnen → Schließen simulieren · Tatsächliches zu überprüfendes Objekt"
    },
    "head-neck-pair": {
      "short": "Verbinden Sie zwei Servo",
      "title": "Ordnen Sie ID31 und ID30 an und installieren Sie die erste Verbindungsplatine",
      "text": "Die Desktop-Perspektive des Originalfilms ist links ID31 und rechts ID30. Befestigen Sie zuerst die erste Verbindungsplatte an einem Servo und verbinden Sie dann die andere, um die verbleibenden Löcher der Verbindungsplatte zu vervollständigen.",
      "check": "Das Video wird zunächst mit 2-Stücken und dann mit 4-Stücken markiert. Ob es sich um eine kumulierte Menge handelt, muss noch überprüft werden. Die Quelle P3-02 hat nur vier Löcher und die Animation wird durch vier tatsächliche Löcher dargestellt, ohne dass zwei zusätzliche Löcher entstehen.",
      "caption": "Befestigen Sie zuerst ein Ende und verbinden Sie dann das andere Ende Servo"
    },
    "head-neck-plate": {
      "short": "Installieren Sie die zweite Verbindungsplatte",
      "title": "Installieren Sie eine weitere Halsverbindungsplatte",
      "text": "Installieren Sie den Verbindungsplatinenkandidaten P3-03 auf der anderen Seite und befestigen Sie vier M2×6, wie im Video gezeigt, um eine doppelte Servo-Hals-Unterbaugruppe zu bilden.",
      "check": "Vervollständigen Sie zuerst die Verbindungselemente auf beiden Seiten und verbinden Sie dann den gesamten Hals mit dem Kopf.",
      "caption": "Anschlussplatte auf der anderen Seite · M2×6 ×4"
    },
    "head-neck-join": {
      "short": "Kopf und Hals verbinden",
      "title": "Verbinden Sie den doppelten Servo-Hals mit dem Kopf",
      "text": "Befestigen Sie den bereits zusammengesetzten Hals als Einheit am Nickgelenk des Kopfes. Laut Originalvideo muss der Kabelausgang aus Sicht der montierenden Person links liegen.",
      "check": "Links aus Sicht der montierenden Person ist nicht automatisch die linke Seite des Roboters. Richtung, Lochpositionen und die Zuordnung des Montageschritts zu P6-01 sind noch nicht überprüft.",
      "caption": "Kabelausgang aus Sicht der montierenden Person links überprüfen."
    },
    "head-neck-fix": {
      "short": "Feste Kopf- und Halsverbindung",
      "title": "Zwei Lochgruppen zur Fixierung der Kopf-Hals-Verbindung",
      "text": "Befestigen Sie die beiden Kopf- und Halsgelenke der Reihe nach gemäß dem Video, und jeder Untertitel ist mit vier M2×6 gekennzeichnet.",
      "check": "Die beiden Gruppen wechseln sich nacheinander ab. Die tatsächliche Lochposition, die axiale Richtung und der Gesamtverbrauch müssen in der physischen Loch-für-Loch-Tabelle überprüft werden.",
      "caption": "An zwei Stellen befestigt · Jeweils M2×6 ×4"
    },
    "head-neck-wire": {
      "short": "Draht verdrahten und Rand freilassen",
      "title": "Stecken Sie den Anschlusshalsbus ein und organisieren Sie die Drahtschleifen",
      "text": "Führen Sie den Steckerhals Kabelbaum entsprechend der sichtbaren Aktion ein und ordnen Sie dann die Drahtschlaufe so an, dass Spielraum für Neigung und Drehung bleibt. Lassen Sie die für die spätere Montage verwendeten Aderenden außen liegen.",
      "check": "Die Drahtschleifen und Endpunkte dienen Lehrzwecken; Die beiden Enden jedes Drahtes, die Reihenschaltungsreihenfolge und die elektrischen Pins müssen überprüft werden.",
      "caption": "Ordnen Sie zuerst Kabelbaum an und schließen Sie dann die Shell"
    },
    "head-shell": {
      "short": "Kopfbedeckungsset",
      "title": "Setzen Sie die weiße Kopfbedeckung auf",
      "text": "Setzen Sie die P4-01-Kopfabdeckung auf den fertigen Kopfmechanismus und lassen Sie den reservierten Kabelbaum außerhalb der Öffnung.",
      "check": "Erben Sie das vorhandene echte Netz. Schalenausführung, Rastposition und Spaltmaß sind prüfpflichtig.",
      "caption": "Setzen Sie die Kopfbedeckung auf · Vermeiden Sie Kabelbaum"
    },
    "head-shell-fix": {
      "short": "Interne feste Kopfabdeckung",
      "title": "Befestigen Sie die Kopfabdeckung von innen",
      "text": "Laut Untertitel zu 17:31 zwei M2×6 von innen reparieren.",
      "check": "Die Schraubenpositionen dienen Lehrzwecken. Stellen Sie sicher, dass Kabelbaum nicht zwischen der Kopfabdeckung und der Plattform eingeklemmt ist.",
      "caption": "Interne Fixierung · M2×6 ×2"
    },
    "head-eyes": {
      "short": "Installieren Sie Augenringe für die Augen",
      "title": "Installieren Sie Augenringe und Augenzubehör",
      "text": "Richten Sie die vorderen Löcher der Schlägerkopfabdeckung aus und installieren Sie die P2-06-Augenränder und P3-01-Augenkomponentenkandidaten.",
      "check": "Das Video zeigt die einzelnen kleinen Innenteile nicht deutlich. Die Reihenfolge und Eingriffsmethoden hier dienen nur als Referenz.",
      "caption": "Richten Sie die vorderen Löcher aus. · Die Identität kleiner Gegenstände muss überprüft werden"
    },
    "head-lower-tape": {
      "short": "Doppelseitiges Klebeband an der Unterlippe",
      "title": "Kleben Sie zunächst doppelseitiges Klebeband auf die ebene Fläche des Kinnpolsters",
      "text": "Bearbeiten Sie zunächst das weiche Polster am Kinn entsprechend dem Originalstück und kleben Sie doppelseitiges Klebeband auf die flache Unterseite. Animation behält sichtbare Kissen und unabhängige Filme.",
      "check": "Die Folie befindet sich auf der Außenfläche des Gitters. Die Dicke und der Schnittbereich dienen als Referenz; Der nächste Schritt besteht darin, es zusammen mit dem weichen Polster am Kinn anzubringen.",
      "caption": "Kleben Sie zunächst doppelseitiges Klebeband auf das Kinnpolster"
    },
    "head-lower-pad": {
      "short": "Kinnpolster",
      "title": "Legen Sie zunächst das Kissen in das Kinn",
      "text": "Sehen Sie sich die Demonstration im Originalfilm an: Befestigen Sie das geklebte Roboterbackenkissen als Ganzes am geöffneten Roboterbackenteil, drücken Sie es flach und passen Sie es an. Das Quellraster verwendet P1-01.",
      "check": "Der Film und das Kissen werden zusammen bewegt und die obere und untere Identität der Quelldateien werden als Kandidaten beibehalten; Das physikalische Material und die Klebeechtheit müssen überprüft werden.",
      "caption": "Bringen Sie zuerst das Kinnkissen an"
    },
    "head-upper-tape": {
      "short": "Doppelseitiges Klebeband am Mund",
      "title": "Kleben Sie dann doppelseitiges Klebeband auf die ebene Fläche des oberen Mundpolsters.",
      "text": "Bearbeiten Sie dann das weiche Kissen des oberen Mundes, kleben Sie doppelseitiges Klebeband auf die freiliegende flache Oberfläche und drücken Sie es dann als Ganzes auf den oberen Mund.",
      "check": "Der Film befindet sich auf der Außenfläche des Gitters und die Dicke, Kontur und Klebefestigkeit dienen weiterhin Lehrzwecken.",
      "caption": "Anschließend doppelseitiges Klebeband auf das obere Mundpolster aufkleben"
    },
    "head-upper-pad-check": {
      "short": "Zum Verschließen das Pad anbringen",
      "title": "Bringen Sie das Mundkissen an und prüfen Sie den Sitz von Ober- und Untermund",
      "text": "Sehen Sie sich die Demonstration des Originalfilms an: Befestigen Sie das weiche Polster des oberen Mundes des Roboters zusammen mit der Folie am oberen Mundteil des Roboters. Verwenden Sie P1-02 für das Quellraster. Überprüfen Sie anschließend, ob die oberen und unteren Mundteile des Roboters gut passen und ob offensichtliche Lücken vorhanden sind.",
      "check": "Dieser Schritt simuliert nur einmal das Öffnen und Schließen und kehrt zur Verzeichnisschließhaltung zurück. Nahtlose Passform, reibungslose Bewegung und Kabelbaum-Spielraum müssen am tatsächlichen Objekt überprüft werden.",
      "caption": "Simulieren Sie das Schließen nach der Montage. · Das tatsächliche Produkt ist zu überprüfen"
    },
    "final-battery": {
      "short": "Batteriespeicher",
      "title": "Setzen Sie den Akku ein und ziehen Sie das Netzkabel heraus",
      "text": "Legen Sie die Batterie in das unabhängige Batteriefach, führen Sie die roten und schwarzen Netzkabel und Anschlüsse durch die Öffnung und befestigen Sie dann das Batteriefach am Gehäuse.",
      "check": "Die Batteriegröße folgt der konzeptionellen Form des Originalmodells und die physische Größe, die Positionen der Anschlussschlüssel und die Polarität wurden noch nicht überprüft. Die Fadenfarbe stellt keinen verifizierten Pin dar.",
      "caption": "Betreten Sie zuerst das Lager. · Das Netzkabel wird aus der Öffnung herausgeführt"
    },
    "final-tray": {
      "short": "Batteriefach einbauen",
      "title": "Befestigen Sie das Batteriefach mit der Batterie am Gehäuse",
      "text": "Richten Sie die Batterie und das Batteriefach als eine Einheit an der Rückseite des Roboterkörpers aus. Verwenden Sie gemäß der Videoanleitung zur Befestigung selbstschneidende Senkkopfschrauben 4 M2×6.",
      "check": "Richten Sie es zuerst aus und befestigen Sie es dann. Halten Sie dabei das Netzkabel heraus. Die Schraubenposition und -koordination sind Lehranweisungen, und Sie müssen das tatsächliche Objekt Loch für Loch überprüfen.",
      "caption": "Die Komponenten sind als Ganzes vorhanden · M2×6 ×4"
    },
    "final-body-shells": {
      "short": "Karosserie einbauen",
      "title": "Montieren Sie die Karosserie auf beiden Seiten und bewahren Sie die obere Verkabelung auf",
      "text": "Richten Sie die beiden Körperschalen des Roboters aus und installieren Sie sie. Behalten Sie dabei den oberen Kabelbaum-Auslass bei. Bei ungefähr 19:05 vermerken die Untertitel des Videos insgesamt 5 M2×6 Schrauben. Dieser Schritt zeigt nur diese Gesamtsumme und gibt nicht die Menge pro Seite an.",
      "check": "Die Nebeneinander- und Loch-für-Loch-Verteilung der 5-Chips wurde noch nicht überprüft. In der Abbildung werden die vorhandenen runden Löcher im Quellgitter als Lehrkandidaten verwendet, und die tatsächliche Stufenzuordnung der oberen und unteren Löcher sowie der Nahtlöcher muss noch überprüft werden. Die Schlussfolgerung von 5 pro Seite basiert nicht darauf.",
      "caption": "M2×6 ×5 · Quelllochkandidat, zur Überprüfung zugewiesen"
    },
    "final-head-join": {
      "short": "Verbinden Sie den gesamten Kopf und Hals",
      "title": "Befestigen Sie die gesamte installierte Kopf- und Halsbaugruppe am Körper",
      "text": "Bewegen Sie den fertigen Roboterkopf, Hals, Schrauben und Kabelbaum als Ganzes. Bringen Sie zuerst das untere Servo-Verbindungsteil in die Installationsposition und befestigen Sie es dann anhand der Videomarkierungen mit 4 M2×6-Schrauben auf jeder Seite.",
      "check": "Kopf und Hals müssen sich als Ganzes bewegen, nicht nur der Schädel. Die Gesamtzahl der 4-Teile auf jeder Seite dieses Prototyps beträgt 8-Teile; die tatsächliche Lochposition, Einbauachse und Ausführung müssen noch überprüft werden.",
      "caption": "Kopf und Hals sind als Ganzes vorhanden · M2×6 ×4 auf beiden Seiten"
    },
    "final-board-mate": {
      "short": "Verbinden Sie zwei Platinen",
      "title": "Richten Sie die Stiftleiste aus und stecken Sie UNO Q in die Luwu-Erweiterungsplatine",
      "text": "Nehmen Sie die Erweiterungskarten UNO Q bzw. Luwu, richten Sie die Stifte der Erweiterungskarte an den Stiftleisten UNO Q aus und drücken Sie sie entlang der Steckrichtung fest. Die beiden Boards sind immer unabhängige Objekte.",
      "check": "Es wird das bestätigte Board-Modell verwendet; Die Ausrichtung der 32-Stifte und der 12.3mm-Modellierungsabstand wurden überprüft und die Lochpositionen wurden anhand von Fotos geschätzt. Die beiden Befestigungslöcher sind etwa 1.27mm falsch ausgerichtet und die physische Einfügung, die Toleranzen und die elektrischen Pins wurden nicht überprüft.",
      "caption": "Zwei unabhängige Platinen · Richten Sie die Header an den Headern aus"
    },
    "final-board-mount": {
      "short": "fester Controller",
      "title": "Befestigen Sie die eingelegte Zweiplattenbaugruppe an der Karosserie",
      "text": "Lassen Sie die beiden Platinen miteinander verbunden und bewegen Sie die Hauptsteuerbaugruppe auf die Rückseite des Roboterkörpers. Die Originalstücke sind mit 4 und M3×16 gekennzeichnet; Dieses Modell zeigt nur das Einfügen von zwei nahezu koaxialen Löchern, die restlichen beiden sind zur Überprüfung reserviert.",
      "check": "Das Originalstück hat 4-Teile; Die 2-Löcher dieses Modells sind nahezu koaxial und die 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet. Der abgeschlossene Zustand der Durchquerung der beiden Platten ist noch nicht dargestellt. Die Form der Quellplatte, die Lochposition, die PCB-Dicke und der Pin-Reihenabstand wurden nicht gestreckt oder gepatcht; Die Körperunterstützung und die körperliche Koordination müssen überprüft werden.",
      "caption": "Originalfilm M3×16 ×4 · Zeigt 2-Löcher, und die anderen 2-Löcher müssen überprüft werden"
    },
    "final-power": {
      "short": "Batteriekabel anschließen",
      "title": "Stecken Sie den verbleibenden Batteriestecker in den Batterieanschluss auf der Steuerplatine",
      "text": "Bewegen Sie den Stecker vom Batteriefach zur Batterieschnittstelle der Erweiterungsplatine, richten Sie ihn am Steckerschlüssel aus und drücken Sie ihn fest. Hier werden Aktionen und Wege aufgezeigt.",
      "check": "Die genaue Polarität, Pin-Nummerierung, Position des Anschlussschlüssels und die Revision der Videoplatine wurden nicht überprüft. Die roten und schwarzen Doppellinien im Bild stellen keine Grundlage für die Verkabelung dar.",
      "caption": "Zielen Sie auf den Batterieanschluss. Die Polarität und die Schlüsselposition müssen überprüft werden."
    },
    "final-buses": {
      "short": "Fügen Sie den Bus einzeln ein",
      "title": "Stecken Sie die drei Servo-Hauptbusse nacheinander in die Erweiterungsplatine",
      "text": "Richten Sie die drei dreipoligen Stecker nacheinander aus und drücken Sie sie ein. Das Video bestätigt, dass es drei Anschlüsse auf der Motherboard-Seite gibt; In diesem Schritt werden die drei Verbindungen separat demonstriert.",
      "check": "Die Topologie, die tatsächlichen Endpunkte und Pins des dreiadrigen Zweigs ID konnten nicht eindeutig nachverfolgt werden. Die Erweiterungsplatine weist Unterschiede in der Schnittstellenversion auf und GND, SIGNAL oder die Position der Stromversorgungsstifte können anhand des Erscheinungsbilds des Modells nicht identifiziert werden.",
      "caption": "Drei separate Plug-Ins, Endpunkte und Pins müssen überprüft werden"
    },
    "final-thigh-first": {
      "short": "Oberschenkelschale auf der ersten Seite",
      "title": "Installieren Sie das Oberschenkelgehäuse der ersten Seite",
      "text": "Installieren Sie die erste seitliche Oberschenkelschale und befestigen Sie die Untertitelmarkierung mit 2 selbstschneidenden Flachkopfschrauben M2.3×4. Der Prototyp demonstriert zunächst die rechte Seite des Roboters und die linke und rechte Zuordnung des Videos muss überprüft werden.",
      "check": "20:37-Untertitel M2.3×4 unterscheiden sich von den offiziellen BOM-Untertiteln M2.3×8; Die Originalfilmspezifikationen bleiben erhalten und werden nicht direkt ersetzt oder zum Kauf verwendet. Die Bohrlochstandorte unterliegen der Überprüfung.",
      "caption": "Video M2.3×4 ×2 · Unterschiede zu BOM"
    },
    "final-route": {
      "short": "Organisieren Sie Kabelbaum",
      "title": "Ordnen Sie Kabelbaum so an, dass auf der anderen Seite Platz für die Schale und die Gelenke bleibt",
      "text": "Ordnen Sie die sichtbaren Kabelbaum-Schlaufen so an, dass der Kabelbaum die Druckfugen und Gelenkaktivitätsbereiche des Gehäuses vermeidet. Lassen Sie einen angemessenen Abstand, bevor Sie die andere Seite des Gehäuses installieren.",
      "check": "Die Verkabelung ist eine visuelle Darstellung und der physische Biegeradius, die Kabellänge und der Bewegungsspielraum wurden nicht überprüft; Für diesen Schritt ist es nicht erforderlich, den angeschlossenen Motherboard-Stecker abzuziehen.",
      "caption": "Halten Sie Anschlüsse verbunden. · Organisieren Sie Ränder"
    },
    "final-thigh-second": {
      "short": "Oberschenkelschale auf der anderen Seite",
      "title": "Installieren Sie die Oberschenkelschale auf der anderen Seite, um die Endmontage dieses Abschnitts abzuschließen.",
      "text": "Montieren Sie die andere Oberschenkelschale spiegelbildlich. 20:57-Untertitel sind auch als 2 und M2.3×4 gekennzeichnet, wobei die Spezifikationsunterschiede zwischen dem Originalfilm und BOM erhalten bleiben.",
      "check": "Dieser Abschnitt endet mit der Endmontage von 20:58. Steuerung, Nummerierung und Kalibrierung werden in den folgenden Kapiteln beschrieben. Dieses Modul überprüft weder das Einschalten noch die mechanische Genauigkeit.",
      "caption": "Die andere Seite M2.3×4 ×2 · Endmontage"
    },
    "calibration-power": {
      "short": "Inbetriebnahme nach der Montage",
      "title": "Schalten Sie die Maschine ein, nachdem die Montage abgeschlossen ist",
      "text": "Dieser Absatz zeigt nur den Unterrichtsablauf. Überprüfen Sie die mechanischen Verbindungen und Kabelbaum des Roboters und befolgen Sie dann die Anweisungen im Video, um die Gerätekonfigurationsseite auf Ihrem eigenen realen Gerät zu öffnen.",
      "check": "Dieser Prototyp stellt keine Verbindung zur Hardware her; Im Folgenden wird nur die Lernsequenz gezeigt.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "calibration-start": {
      "short": "Starten Sie die Kalibrierung",
      "title": "Geben Sie Calibration ein und starten Sie die Kalibrierung",
      "text": "Geben Sie Calibration auf der Schnittstelle des realen Geräts ein, klicken Sie auf Start calibration und stabilisieren Sie den Roboter.",
      "check": "Die fertigen Posen auf der Seite weisen nicht darauf hin, dass der echte Roboter kalibriert wurde.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "calibration-servos": {
      "short": "Passen Sie 15 ID einzeln an",
      "title": "Stellen Sie die mechanische Nullposition aller Servo nacheinander ein",
      "text": "Passen Sie den Schieberegler ID nacheinander entsprechend der Geräteschnittstelle an und drücken Sie Finish, wenn Sie fertig sind. Rechtes Bein 10–14, linkes Bein 20–24, Kopf, Hals und Mund 30–34.",
      "check": "Für jeden ID ist eine Überprüfung der physischen Verbindungen erforderlich. Die Liste auf dieser Seite ist kein Ergebnis der Gerätekalibrierung.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "calibration-pose": {
      "short": "Überprüfen Sie die Körpergelenke",
      "title": "Zentrierung, Gelenke und Fußhaltung prüfen",
      "text": "Nehmen Sie anhand des Originalfotos weiterhin Feineinstellungen vor: Der Körper ist zentriert, die Gelenke sind ausgerichtet und die Füße sind flach, bis das Original fest stehen kann.",
      "check": "Das Standmodell dieses Prototyps dient ausschließlich dem Beobachtungsunterricht und kann die körperliche Haltungskontrolle nicht ersetzen.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "calibration-exit": {
      "short": "Kalibrierung beenden",
      "title": "Beenden Sie die Kalibrierung nach Abschluss jeder Verbindung",
      "text": "Nachdem alle Servo abgeschlossen sind, klicken Sie entsprechend dem Originalbild auf Exit und verlassen Sie dann die Einstellungsseite.",
      "check": "Bestätigen Sie, dass alle ID verarbeitet wurden, bevor Sie die Standardeinstellungsprüfung durchführen.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "calibration-default": {
      "short": "Überprüfen Sie die Standardpose",
      "title": "Führen Sie Default pose aus",
      "text": "Führen Sie Default pose auf einem realen Gerät aus und beobachten Sie, ob Körper und Beine die erwartete Haltung einnehmen.",
      "check": "Dabei werden weder Bewegungsbefehle gesendet noch das körperliche Gleichgewicht simuliert.",
      "caption": "Lehrdemonstration · Keine Kontrolle realer Geräte"
    },
    "robot-complete": {
      "short": "Vollständige Maschinenansicht",
      "title": "Vollständiges Tutorial zur Maschinenmontage",
      "text": "Sie können sich jetzt drehen, um den kompletten Roboter zu sehen, oder zu einer beliebigen Stufe zurückspringen, um ihn noch einmal abzuspielen. Der Originalfilm zeigt am Ende die Fernbedienung und den begehbaren Eingang.",
      "check": "Dies ist ein unabhängiger Lehrprototyp; Die tatsächliche Verkabelung, Lochpositionsanpassung und Gerätekalibrierung erfordern noch eine physische Überprüfung.",
      "caption": ""
    }
  },
  "chapters": {
    "prepare": {
      "name": "Vorbereitung und Nummerierung"
    },
    "right-ankle": {
      "name": "rechter Knöchel"
    },
    "left-ankle": {
      "name": "linker Knöchel"
    },
    "right-leg": {
      "name": "Verbindung mit dem rechten Bein"
    },
    "left-leg": {
      "name": "linke Beinverbindung"
    },
    "finish": {
      "name": "Fertig sind die Beine"
    },
    "torso-base": {
      "name": "Körper- und Hüftunterstützung"
    },
    "torso-legs": {
      "name": "Hüftmotorik und Beingelenke"
    },
    "head-core": {
      "name": "Kopfdrehung und Verkabelung"
    },
    "head-mouth-neck": {
      "name": "Mund und doppelter Servo-Hals"
    },
    "head-finish": {
      "name": "Kopfbedeckung und Mundpolster"
    },
    "final-body": {
      "name": "Zusammenbau von Körper und Kopf und Hals"
    },
    "final-electronics": {
      "name": "Elektronische Steuerung und Gehäuseveredelung"
    },
    "calibration": {
      "name": "Kalibrierung und Abschluss"
    }
  },
  "actors": {
    "p_uno": {
      "label": "Arduino UNO Q · Aussehen bestätigt v2-Charge",
      "source": "Bestätigtes Fotomodell · Einheitliche Einheitenumrechnung 1000; Die Schätzung der Montagelöcher und die elektrische Zuordnung wurden nicht physisch überprüft"
    },
    "p_extension": {
      "label": "Luwu-Erweiterungsplatine · Bestätigtes Erscheinungsbild v2",
      "source": "Bestätigtes Fotomodell · Einheitliche Einheitenumrechnung 1000; Die Schätzung der Montagelöcher und die elektrische Zuordnung wurden nicht physisch überprüft"
    },
    "p_battery": {
      "label": "Temporäre Stromversorgungsbatterie · Lehrmodell",
      "source": "Batteriegröße und Anschlüsse unterliegen einer physischen Überprüfung"
    },
    "p_motor": {
      "label": "Einzelner Servo, der konfiguriert werden muss",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "p_powerCable": {
      "label": "Testen Sie das Batterie-Netzkabel",
      "source": "Die Verdrahtung und Polarität dient nur zu Lehrzwecken."
    },
    "p_servoCable": {
      "label": "Einzelne Servo-Testlinie",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "p_usb": {
      "label": "Type-C Verbindungskabel · einfaches Lehrmodell",
      "source": "Zeigt nur die Verbindungsrichtung des Computers"
    },
    "motor": {
      "label": "RechtsServo · ID14",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft.",
      "chip": "Servo"
    },
    "foot": {
      "label": "Rechter Fuß · P2-03",
      "source": "Echtes 3MF-Gitter",
      "chip": "Fuß"
    },
    "shank": {
      "label": "Rechte Wade · P6-04",
      "source": "Echtes 3MF-Gitter",
      "chip": "Kalb"
    },
    "bearing": {
      "label": "Rechts klein Lager · 10×15×3",
      "source": "Vorhandenes Hilfsnetz",
      "chip": "KleinLager"
    },
    "axle": {
      "label": "Rechte Knöchelachse · P2-05",
      "source": "Echtes Gitter·Positionierungsdiagramm",
      "chip": "Knöchelachse"
    },
    "horn": {
      "label": "Servohorn von rechts entfernt",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "hornScrew": {
      "label": "Rechte zentrale Originalschraube Servohorn",
      "source": "Lehranweisungen hinzugefügt · Spezifikationen müssen überprüft werden"
    },
    "plug": {
      "label": "Rechter dreipoliger Servo-Stecker",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "wire": {
      "label": "Rechte dreiadrige Servo-Leitung",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "shankScrew0": {
      "label": "Rechte Wadenbefestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×2"
    },
    "shankScrew1": {
      "label": "Rechte Wadenbefestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "footScrew0": {
      "label": "Befestigungsschraube für rechten Fuß 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "footScrew1": {
      "label": "Befestigungsschraube für rechten Fuß 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "footScrew2": {
      "label": "Befestigungsschraube für rechten Fuß 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "footScrew3": {
      "label": "Befestigungsschraube für rechten Fuß 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "axisScrew": {
      "label": "Schraube zur Fixierung des rechten Knöchelschafts · M2.3×8",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2.3×8"
    },
    "l_motor": {
      "label": "LinksServo · ID24",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft.",
      "chip": "Servo"
    },
    "l_foot": {
      "label": "Linker Fuß · P2-04",
      "source": "Echtes 3MF-Gitter",
      "chip": "Fuß"
    },
    "l_shank": {
      "label": "Linke Wade · P6-05",
      "source": "Echtes 3MF-Gitter",
      "chip": "Kalb"
    },
    "l_bearing": {
      "label": "Zuo XiaoLager · 10×15×3",
      "source": "Vorhandenes Hilfsnetz",
      "chip": "KleinLager"
    },
    "l_axle": {
      "label": "Linke Knöchelachse · P2-07",
      "source": "Echtes Gitter·Positionierungsdiagramm",
      "chip": "Knöchelachse"
    },
    "l_horn": {
      "label": "Servohorn von links entfernt",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "l_hornScrew": {
      "label": "Linke Servohorn mittlere Originalschraube",
      "source": "Lehranweisungen hinzugefügt · Spezifikationen müssen überprüft werden"
    },
    "l_plug": {
      "label": "Linker dreipoliger Servo-Stecker",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "l_wire": {
      "label": "Linke dreiadrige Servo-Leitung",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "l_shankScrew0": {
      "label": "Linke Wadenbefestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×2"
    },
    "l_shankScrew1": {
      "label": "Linke Wadenbefestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "l_footScrew0": {
      "label": "Befestigungsschraube für linken Fuß 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_footScrew1": {
      "label": "Befestigungsschraube für linken Fuß 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "l_footScrew2": {
      "label": "Befestigungsschraube für linken Fuß 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "l_footScrew3": {
      "label": "Befestigungsschraube für linken Fuß 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "l_axisScrew": {
      "label": "Befestigungsschraube für den linken Knöchelschaft · M2.3×8",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2.3×8"
    },
    "r_upperMotor": {
      "label": "Oben rechts Servo · ID12",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "r_lowerMotor": {
      "label": "Rechte Mitte Servo · ID13",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "r_support": {
      "label": "Rechte Oberschenkelstütze · P5-04",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "r_lowerBearing": {
      "label": "Rechtes großes Lager · 16×22×4",
      "source": "Vorhandenes Hardware-Grid"
    },
    "r_supportScrew0": {
      "label": "Rechte Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew1": {
      "label": "Rechte Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew2": {
      "label": "Rechte Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew3": {
      "label": "Rechte Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew0": {
      "label": "Rechte Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew1": {
      "label": "Rechte Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew2": {
      "label": "Rechte Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew3": {
      "label": "Rechte Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_upperHorn": {
      "label": "Original Servohorn oben rechts",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "r_upperHornScrew": {
      "label": "Originale Zentralschraube oben rechts",
      "source": "Einfaches Lehrmodell · Ursprüngliche Spezifikationen müssen überprüft werden"
    },
    "r_topLink": {
      "label": "Oberer rechter Anschluss · P3-04",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "r_topBearing": {
      "label": "Rechter Stecker groß Lager",
      "source": "Vorhandenes Hardware-Grid"
    },
    "r_topScrew0": {
      "label": "Rechte Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew1": {
      "label": "Rechte Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew2": {
      "label": "Rechte Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew3": {
      "label": "Rechte Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_sole": {
      "label": "Polsterung der rechten Fußsohle · P1-03",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "r_soleScrew0": {
      "label": "Rechte Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew1": {
      "label": "Rechte Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew2": {
      "label": "Rechte Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew3": {
      "label": "Rechte Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "r_legWireA": {
      "label": "Dreiadriges Kabel im rechten Bein",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen",
      "chip": "Dreiadriger Draht im Bein"
    },
    "r_legWireB": {
      "label": "Reservierte Linie am oberen Ende des rechten Beins",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen",
      "chip": "Reservierte Zeile am oberen Ende"
    },
    "l_upperMotor": {
      "label": "Oben links Servo · ID22",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "l_lowerMotor": {
      "label": "Mitte links Servo · ID23",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "l_support": {
      "label": "Linke Oberschenkelstütze · P5-05",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "l_lowerBearing": {
      "label": "Zuo DaLager · 16×22×4",
      "source": "Vorhandenes Hardware-Grid"
    },
    "l_supportScrew0": {
      "label": "Linke Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew1": {
      "label": "Linke Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew2": {
      "label": "Linke Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew3": {
      "label": "Linke Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew0": {
      "label": "Linke Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew1": {
      "label": "Linke Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew2": {
      "label": "Linke Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew3": {
      "label": "Linke Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_upperHorn": {
      "label": "Original Servohorn oben links",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "l_upperHornScrew": {
      "label": "Originale Zentralschraube oben links",
      "source": "Einfaches Lehrmodell · Ursprüngliche Spezifikationen müssen überprüft werden"
    },
    "l_topLink": {
      "label": "Oberer linker Anschluss · P3-05",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "l_topBearing": {
      "label": "Linker Anschluss groß Lager",
      "source": "Vorhandenes Hardware-Grid"
    },
    "l_topScrew0": {
      "label": "Linke Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew1": {
      "label": "Linke Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew2": {
      "label": "Linke Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew3": {
      "label": "Linke Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_sole": {
      "label": "Polsterung der linken Fußsohle · P1-04",
      "source": "Echtes 3MF-Gitter · Koordination muss überprüft werden"
    },
    "l_soleScrew0": {
      "label": "Linke Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew1": {
      "label": "Linke Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew2": {
      "label": "Linke Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew3": {
      "label": "Linke Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "l_legWireA": {
      "label": "Dreiadriges Kabel im linken Bein",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen",
      "chip": "Dreiadriger Draht im Bein"
    },
    "l_legWireB": {
      "label": "Reservierte Linie am oberen Ende des linken Beins",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen",
      "chip": "Reservierte Zeile am oberen Ende"
    },
    "t_motor10": {
      "label": "Hüfte Yaw Servo · ID10",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "t_motor10Horn": {
      "label": "ID10 Original Servohorn (reserviert)",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "t_motor10HornScrew": {
      "label": "ID10 originale Zentralschraube",
      "source": "Originales Lehrmodell mit Zentralschraube · Spezifikationen müssen überprüft werden"
    },
    "t_motor20": {
      "label": "Hüfte Yaw Servo · ID20",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "t_motor20Horn": {
      "label": "ID20 Original Servohorn (reserviert)",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "t_motor20HornScrew": {
      "label": "ID20 originale Zentralschraube",
      "source": "Originales Lehrmodell mit Zentralschraube · Spezifikationen müssen überprüft werden"
    },
    "t_support": {
      "label": "Hüfte Yaw Unterstützung · P6-09",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_supportScrew0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_supportScrew1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_supportScrew2": {
      "label": "Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_supportScrew3": {
      "label": "Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_supportScrew4": {
      "label": "Befestigungsschraube 5 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_supportScrew5": {
      "label": "Befestigungsschraube 6 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_baseWire": {
      "label": "Reservierte Leitung für die Hauptplatine des rechten Gehäuses · Anzeige des freien Endes",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "t_baseWireL": {
      "label": "Reservierte Leitung für die Hauptplatine des linken Gehäuses · Anzeige des freien Endes",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "t_backplate": {
      "label": "Karosserierückwand · P4-03",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_backFrontScrew0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_backFrontScrew1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_backRearScrew0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_backRearScrew1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawR": {
      "label": "Rechter Yaw-Stecker · P6-06",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_yawBearingR": {
      "label": "Rechts Yaw Großer Stecker Lager · 16×22×4",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_yawScrewR0": {
      "label": "Diagramm der Befestigungsschrauben des rechten Verbindungsstücks · M2×6 · Nebeneinander zu überprüfende Menge",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewR1": {
      "label": "Diagramm der Befestigungsschrauben des rechten Verbindungsstücks · M2×6 · Nebeneinander zu überprüfende Menge",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewR2": {
      "label": "Diagramm der Befestigungsschrauben des rechten Verbindungsstücks · M2×6 · Nebeneinander zu überprüfende Menge",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewR3": {
      "label": "Diagramm der Befestigungsschrauben des rechten Verbindungsstücks · M2×6 · Nebeneinander zu überprüfende Menge",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_motor11": {
      "label": "Rechte Hüfte Roll Servo · ID11",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "t_motor11Horn": {
      "label": "ID11 Original Servohorn",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "t_motor11HornScrew": {
      "label": "ID11 originale zentrale Befestigungsschraube",
      "source": "Originales Lehrmodell mit Zentralschraube · Spezifikationen müssen überprüft werden"
    },
    "t_rollWireR": {
      "label": "Reservierte Linie vom rechten Körper zum Hüftmotor · Pfad-/Endpunktanzeige",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "t_motorScrewR0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_motorScrewR1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverR": {
      "label": "Rechte Roll Servo Abdeckung · P6-02",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_coverScrewR0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewR1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewR2": {
      "label": "Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewR3": {
      "label": "Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legBearingR": {
      "label": "Die rechte Beinschnittstelle ist groß Lager · 16×22×4",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_legScrewR0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewR1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewR2": {
      "label": "Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewR3": {
      "label": "Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawL": {
      "label": "Linker Yaw-Stecker · P6-07",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_yawBearingL": {
      "label": "Links Yaw Großer Stecker Lager · 16×22×4",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_yawScrewL0": {
      "label": "Anleitung zur Befestigung der Schrauben des linken Verbindungsstücks · M2×6 · Anzahl nebeneinander prüfen",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewL1": {
      "label": "Anleitung zur Befestigung der Schrauben des linken Verbindungsstücks · M2×6 · Anzahl nebeneinander prüfen",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewL2": {
      "label": "Anleitung zur Befestigung der Schrauben des linken Verbindungsstücks · M2×6 · Anzahl nebeneinander prüfen",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_yawScrewL3": {
      "label": "Anleitung zur Befestigung der Schrauben des linken Verbindungsstücks · M2×6 · Anzahl nebeneinander prüfen",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_motor21": {
      "label": "Linke Hüfte Roll Servo · ID21",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "t_motor21Horn": {
      "label": "ID21 Original Servohorn",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "t_motor21HornScrew": {
      "label": "ID21 originale zentrale Befestigungsschraube",
      "source": "Originales Lehrmodell mit Zentralschraube · Spezifikationen müssen überprüft werden"
    },
    "t_rollWireL": {
      "label": "Reservierte Linie vom linken Körper zum Hüftmotor · Pfad-/Endpunktanzeige",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "t_motorScrewL0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_motorScrewL1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverL": {
      "label": "Linke Roll Servo Abdeckung · P6-03",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_coverScrewL0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewL1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewL2": {
      "label": "Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_coverScrewL3": {
      "label": "Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legBearingL": {
      "label": "Die linke Beinschnittstelle ist groß Lager · 16×22×4",
      "source": "Echtes Quellraster · Video entsprechender Kandidat, Lochposition/-koordination muss überprüft werden"
    },
    "t_legScrewL0": {
      "label": "Befestigungsschraube 1 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewL1": {
      "label": "Befestigungsschraube 2 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewL2": {
      "label": "Befestigungsschraube 3 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "t_legScrewL3": {
      "label": "Befestigungsschraube 4 · M2×6",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "h_pitchSupport": {
      "label": "Erste Klammer · P6-01",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_motor32": {
      "label": "Kopfdrehung Servo · ID32 Kandidat",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "h_yawScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_yawSupport": {
      "label": "Zweite Öffnungsklammer · P6-08",
      "source": "Echtes Druckraster·Videokorrespondenz und -koordination unterliegen der Überprüfung; Der Originalfilm wird mit der zweiten Halterung/ID33-Unterbaugruppe geliefert und die physische Abstimmung muss überprüft werden"
    },
    "h_bearingFront": {
      "label": "Großer Kopf Lager ehemaliger Kandidat · 16×22×4",
      "source": "Vorhandenes Hardware-Grid · ID und Schnittstelle müssen überprüft werden; Laut Originalteil wird es mit der zweiten Halterung/ID33-Unterbaugruppe geliefert und die physische Übereinstimmung muss überprüft werden"
    },
    "h_bearingBack": {
      "label": "Kandidat nach Lager mit großem Kopf · 16×22×4",
      "source": "Vorhandenes Hardware-Grid · ID und Schnittstelle müssen überprüft werden; Laut Originalteil wird es mit der zweiten Halterung/ID33-Unterbaugruppe geliefert und die physische Übereinstimmung muss überprüft werden"
    },
    "h_bearingCrown": {
      "label": "Erste Klammer groß Lager · Sitzkandidat",
      "source": "head_yaw_1 komplettes ringförmiges Gitter wiederverwenden; entlang der Quellzylinderachse P6-01 x=-0.01, z=40.99 fällt die Bodenfläche auf die etwa y=206.24 Schulterfläche; Kandidaten für die axiale Sitzfläche und die physische Koordination müssen überprüft werden"
    },
    "h_motor33": {
      "label": "Leitender zweiter Kandidat Servo · ID33",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "h_rollScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_platform": {
      "label": "Kopfplattform · P2-02",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_mouthMotor": {
      "label": "Mund Servo · Video 33 / Offizielles 34, Überprüfung ausstehend",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "h_jaw": {
      "label": "Kinn · P2-01",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_servoSupport": {
      "label": "Kopf Servo Befestigungsstück · P4-02",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_supportScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_motor30": {
      "label": "Unteres Ende des Halses Servo · ID30 Kandidat",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "h_motor31": {
      "label": "Oberhals Servo · ID31 Kandidat",
      "source": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft."
    },
    "h_neckA": {
      "label": "Halsverbindungsplatte A · P3-02 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_neckAScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "Befestigen Sie zuerst das 2-Loch"
    },
    "h_neckAScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "Befestigen Sie zuerst das 2-Loch"
    },
    "h_neckAScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "Neu in die 4-Loch einbauen"
    },
    "h_neckAScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "Neu in die 4-Loch einbauen"
    },
    "h_neckB": {
      "label": "Halsverbindungsplatte B · P3-03 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_neckBScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew2": {
      "label": "M2×6 Befestigungsschraube 3 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew3": {
      "label": "M2×6 Befestigungsschraube 4 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew4": {
      "label": "M2×6 Befestigungsschraube 5 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew5": {
      "label": "M2×6 Befestigungsschraube 6 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew6": {
      "label": "M2×6 Befestigungsschraube 7 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew7": {
      "label": "M2×6 Befestigungsschraube 8 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×4"
    },
    "h_shell": {
      "label": "Kopfabdeckung · P4-01",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_shellScrew0": {
      "label": "M2×6 Befestigungsschraube 1 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×2"
    },
    "h_shellScrew1": {
      "label": "M2×6 Befestigungsschraube 2 · Lochpositionsanzeige",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
      "chip": "M2×6 ×2"
    },
    "h_eyeShell": {
      "label": "Augenringe · P2-06 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_eyes": {
      "label": "Augengeräte · P3-01 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_upperPad": {
      "label": "Lippenkissen · P1-02 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_lowerPad": {
      "label": "Unteres Mundkissen · P1-01 Kandidat",
      "source": "Echtes Ausdruckraster · Videokorrespondenz und -koordination müssen überprüft werden"
    },
    "h_wire32": {
      "label": "ID32 reservierte Leitung · Endpunktanzeige",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_wire33": {
      "label": "ID33 reservierte Leitung · Endpunktanzeige",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_wireMouth": {
      "label": "Mund Servo-Linie · 33/34 bis zur Überprüfung",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_neckWire": {
      "label": "Halsdrahtschleife · Anzeige der Endpunkte und Reihenschaltungsreihenfolge",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_headLead": {
      "label": "Das Ende der Kopf- und Halslinie ist für die Endmontage reserviert. Endpunktanzeige",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_plug32": {
      "label": "ID32-Stecker · Lehrschnittstelle",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_plug33": {
      "label": "ID33-Stecker · Lehrschnittstelle",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_plugMouth": {
      "label": "Mundstöpsel·Lehrschnittstelle",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_plugNeck": {
      "label": "Halskabelstecker · Unterrichtsschnittstelle",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "h_coreHorn": {
      "label": "Original Servohorn beibehalten",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "h_coreHornScrew": {
      "label": "Originale zentrale Befestigungsschraube · Spezifikationen müssen überprüft werden",
      "source": "Original-Zentralschrauben-Lehrmodell · Nicht als selbstschneidende Schrauben klassifiziert; Laut Originalteil wird es mit der zweiten Halterung/ID33-Unterbaugruppe geliefert und die physische Passform muss überprüft werden"
    },
    "h_mouthHorn": {
      "label": "Original Servohorn beibehalten",
      "source": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden"
    },
    "h_mouthHornScrew": {
      "label": "Originale zentrale Befestigungsschraube · Spezifikationen müssen überprüft werden",
      "source": "Original-Zentralschrauben-Lernschablone · Nicht als selbstschneidende Schrauben eingestuft"
    },
    "h_upperAdhesive": {
      "label": "Doppelseitiges Klebeband · Dicke und Konturangabe",
      "source": "Lehranleitung für doppelseitiges Klebeband · Material, Dicke, Kontur und Klebkraft unterliegen der Prüfung"
    },
    "h_lowerAdhesive": {
      "label": "Doppelseitiges Klebeband · Dicke und Konturangabe",
      "source": "Lehranleitung für doppelseitiges Klebeband · Material, Dicke, Kontur und Klebkraft unterliegen der Prüfung"
    },
    "f_batteryTray": {
      "label": "Batteriefach · P5-03",
      "source": "Reales Quellenraster · Befestigungslöcher und Koordination müssen überprüft werden"
    },
    "f_sideR": {
      "label": "Karosserie rechte Schale · P5-06",
      "source": "Reales Quellenraster · Befestigungslöcher und Koordination müssen überprüft werden"
    },
    "f_sideL": {
      "label": "Karosserie linke Schale · P5-07",
      "source": "Reales Quellenraster · Befestigungslöcher und Koordination müssen überprüft werden"
    },
    "f_thighR": {
      "label": "Oberschenkelschale rechts · P5-01",
      "source": "Reales Quellenraster · Befestigungslöcher und Koordination müssen überprüft werden"
    },
    "f_thighL": {
      "label": "Oberschenkelschale links · P5-02",
      "source": "Reales Quellenraster · Befestigungslöcher und Koordination müssen überprüft werden"
    },
    "f_battery": {
      "label": "Akkupack · Tatsächliche Größe muss überprüft werden",
      "source": "Befolgen Sie die trunk_base_8-Konzeptskizze · Nicht-physikalische Messung"
    },
    "f_trayScrew0": {
      "label": "M2×6 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_trayScrew1": {
      "label": "M2×6 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_trayScrew2": {
      "label": "M2×6 Stellschraube 3 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_trayScrew3": {
      "label": "M2×6 Stellschraube 4 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_bodyScrew0": {
      "label": "M2×6 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_bodyScrew1": {
      "label": "M2×6 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_bodyScrew2": {
      "label": "M2×6 Stellschraube 3 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_bodyScrew3": {
      "label": "M2×6 Stellschraube 4 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_bodyScrew4": {
      "label": "M2×6 Stellschraube 5 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewR0": {
      "label": "M2×6 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewR1": {
      "label": "M2×6 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewR2": {
      "label": "M2×6 Stellschraube 3 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewR3": {
      "label": "M2×6 Stellschraube 4 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewL0": {
      "label": "M2×6 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewL1": {
      "label": "M2×6 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewL2": {
      "label": "M2×6 Stellschraube 3 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_neckScrewL3": {
      "label": "M2×6 Stellschraube 4 · Kandidat für das Quellrasterloch",
      "source": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft."
    },
    "f_boardScrew0": {
      "label": "M3×16 Befestigungsschraube 1 · Geeignet für nahezu koaxiale Löcher auf zwei Platten",
      "source": "Quelle GLB Lochpositionsvergleich; 2-Löcher sind nahezu koaxial und 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet; Die Löcher werden nicht verändert oder die physische Passung wird vermutet"
    },
    "f_boardScrew1": {
      "label": "M3×16 Befestigungsschraube 2 · Geeignet für nahezu koaxiale Löcher auf zwei Platten",
      "source": "Quelle GLB Lochpositionsvergleich; 2-Löcher sind nahezu koaxial und 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet; Die Löcher werden nicht verändert oder die physische Passung wird vermutet"
    },
    "f_boardScrew2": {
      "label": "M3×16 Befestigungsschraube 3 · Lochposition muss überprüft werden",
      "source": "Quelle GLB Lochpositionsvergleich; 2-Löcher sind nahezu koaxial und 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet; Die Löcher werden nicht verändert oder die physische Passung wird vermutet"
    },
    "f_boardScrew3": {
      "label": "M3×16 Befestigungsschraube 4 · Lochposition muss überprüft werden",
      "source": "Quelle GLB Lochpositionsvergleich; 2-Löcher sind nahezu koaxial und 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet; Die Löcher werden nicht verändert oder die physische Passung wird vermutet"
    },
    "f_thighScrewR0": {
      "label": "M2.3×4 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "P5-01 Quelle geometry.bin Rundlochmontage · Das tatsächliche Objekt und die spezifische Lochverwendung müssen überprüft werden"
    },
    "f_thighScrewR1": {
      "label": "M2.3×4 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "P5-01 Quelle geometry.bin Rundlochmontage · Das tatsächliche Objekt und die spezifische Lochverwendung müssen überprüft werden"
    },
    "f_thighScrewL0": {
      "label": "M2.3×4 Stellschraube 1 · Kandidat für das Quellrasterloch",
      "source": "P5-02 Quelle geometry.bin Rundlochmontage · Das tatsächliche Objekt und die spezifische Lochverwendung müssen überprüft werden"
    },
    "f_thighScrewL1": {
      "label": "M2.3×4 Stellschraube 2 · Kandidat für das Quellrasterloch",
      "source": "P5-02 Quelle geometry.bin Rundlochmontage · Das tatsächliche Objekt und die spezifische Lochverwendung müssen überprüft werden"
    },
    "f_uno": {
      "label": "Arduino UNO Q · Aussehen bestätigt v2-Charge",
      "source": "Bestätigtes Fotomodell · Einheitliche Einheitenumrechnung 1000; Die Schätzung der Montagelöcher und die elektrische Zuordnung wurden nicht physisch überprüft"
    },
    "f_extension": {
      "label": "Luwu-Erweiterungsplatine · Bestätigtes Erscheinungsbild v2",
      "source": "Bestätigtes Fotomodell · Einheitliche Einheitenumrechnung 1000; Die Schätzung der Montagelöcher und die elektrische Zuordnung wurden nicht physisch überprüft"
    },
    "f_powerCable": {
      "label": "Batterie zweiadriges Netzkabel · Polarität muss überprüft werden",
      "source": "Im Originalfilm sind rote und schwarze Linien sichtbar. Der Pfad, die Leitungslänge, die Polarität und der tatsächliche Anschluss wurden nicht überprüft."
    },
    "f_powerPlug": {
      "label": "Batterieanschluss · Schlüsselposition und Polarität müssen überprüft werden",
      "source": "Tutorial einfaches Modell · Keine verifizierten elektrischen Pin-Definitionen"
    },
    "f_bus0": {
      "label": "Dreipoliger Hauptbus 1 · Abzweig entsprechender Schaltplan",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "f_busPlug0": {
      "label": "Hauptbusstecker 1 · Schlüsselposition muss überprüft werden",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "f_bus1": {
      "label": "Dreipoliger Hauptbus 2 · Abzweig entsprechender Schaltplan",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "f_busPlug1": {
      "label": "Hauptbusstecker 2 · Schlüsselposition muss überprüft werden",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "f_bus2": {
      "label": "Dreipoliger Hauptbus 3 · Abzweig entsprechender Schaltplan",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    },
    "f_busPlug2": {
      "label": "Hauptbusstecker 3 · Schlüsselposition muss überprüft werden",
      "source": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen"
    }
  },
  "ui": {
    "先认清这几件": "Lassen Sie uns zunächst diese Dinge identifizieren",
    "准备零件": "Teile vorbereiten",
    "这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。": "In diesem Abschnitt wird ein Knöchel zusammengebaut. Bereiten Sie zunächst das nummerierte und zentrierte Servo, sowie Fußsohle, Wadenverbinder, Lager und Knöchelschaft vor.",
    "舵机编号和居中应在机械安装前完成。": "Die Servonummerierung und -zentrierung sollte vor der mechanischen Installation erfolgen.",
    "拆下舵盘": "Entfernen Sie Servohorn",
    "先拧出舵盘中央的原装固定螺丝，再沿输出轴方向取下黑色舵盘。": "Lösen Sie zuerst die ursprüngliche Befestigungsschraube in der Mitte des Servohorn und entfernen Sie dann die schwarze Servohorn in Richtung der Abtriebswelle.",
    "把舵盘和原装螺丝放在一旁，后面的步骤不会用自攻螺丝替代它。": "Legen Sie den Servohorn und die Originalschrauben beiseite. Spätere Schritte werden es nicht durch selbstschneidende Schrauben ersetzen.",
    "插好舵机线": "Stecken Sie die Servo-Leitung ein",
    "插入线缆": "Stecken Sie das Kabel ein",
    "将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。": "Richten Sie das Anschlussloch des Steckers am Vorsprung der Schnittstelle aus, führen Sie ihn in Richtung der Schnittstelle ein und drücken Sie ihn dann fest.",
    "看清插头方向。这里演示插接动作，三芯线的针脚定义仍需实物核对。": "Überprüfen Sie die Steckrichtung genau. Der Steckvorgang wird hier demonstriert. Die Pin-Belegung des dreiadrigen Kabels muss noch physisch überprüft werden.",
    "固定小腿连接件": "Fester Unterschenkelanschluss",
    "固定小腿": "Festes Kalb",
    "将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。": "Bringen Sie den weißen unteren Beinverbinder an Servo an, richten Sie die Montagelöcher aus und schrauben Sie dann zwei selbstschneidende Senkkopfschrauben M2×6 ein.",
    "连接件的长端朝上。先对孔，再固定，不用螺丝把歪斜的零件硬拉到位。": "Das lange Ende des Steckers muss nach oben zeigen. Richten Sie zuerst die Löcher aus und befestigen Sie dann die Teile. Verwenden Sie keine Schrauben, um falsch ausgerichtete Teile in die Einbauposition zu zwingen.",
    "把舵机装入脚掌": "Installieren Sie Servo in der Fußsohle",
    "装入脚掌": "Passt in die Fußsohle",
    "把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。": "Setzen Sie das Modul bestehend aus Servo und Wadenverbinder in die Fußsohle ein und befestigen Sie die vier selbstschneidenden Senkkopfschrauben M2×6, wie im Video gezeigt.",
    "先确认脚掌与关节朝向，再固定四个位置。线缆留在外侧。": "Bestätigen Sie zunächst die Ausrichtung der Fußsohlen und Gelenke und fixieren Sie dann die vier Positionen. Die Kabel bleiben außen.",
    "压入小轴承": "Drücken Sie den kleinen Lager hinein",
    "压入轴承": "Drücken Sie Lager",
    "将小轴承对准脚掌的圆形安装孔，沿轴向压入。": "Richten Sie den kleinen Lager am kreisförmigen Montageloch an der Fußsohle aus und drücken Sie ihn in axialer Richtung hinein.",
    "轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。": "Lager muss aufrecht sitzen, mit dem Mittelloch und dem Stecker koaxial. Die Modellnummer entspricht laut Liste 10×15×3 mm.",
    "对齐并装入踝轴": "Richten Sie den Knöchelschaft aus und installieren Sie ihn",
    "装入踝轴": "Installieren Sie den Knöchelschaft",
    "对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。": "Richten Sie das mittlere Loch aus, platzieren Sie die gedruckte Knöchelachse in der Mitte von Lager und schrauben Sie dann die selbstschneidende Schraube M2.3×8 manuell ein.",
    "踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。": "Die Knöchelachse nutzt das vorhandene 3MF-Raster; Die Positionierung hier wurde für die Anzeige angepasst und nicht auf physische Passform überprüft.",
    "拧紧并检查": "Anziehen und prüfen",
    "固定检查": "Überprüfung behoben",
    "沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。": "Schrauben Sie die M2.3×8-Schraube axial ein, bis der Schraubenkopf am Untergrund anliegt, und überprüfen Sie dann die Knöchelverbindung.",
    "视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。": "Im Video wird gefordert, dass der Schraubenkopf fest sitzt und das Ende auf der anderen Seite herauskommt. Der Prototyp demonstriert nur die Bewegung und simuliert kein tatsächliches Drehmoment oder Toleranzen.",
    "这一只脚踝装好了": "Dieser Knöchel ist installiert",
    "完成查看": "Vollständige Besichtigung",
    "现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。": "Jetzt können Sie nach hinten schauen, um zu sehen, wo sich die Verbindungen befinden, oder zu einem beliebigen Schritt zurückkehren, um ihn zu überprüfen. Führen Sie die Spiegelmontage des anderen Knöchels durch, wie im Video gezeigt.",
    "这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。": "Die Unterfußpolster sind in diesem Abschnitt noch nicht installiert; Sie werden später im Video an den Beinen angebracht.",
    "舵机 · 视频 ID14": "Servo · Video ID14",
    "现有辅助网格": "Vorhandenes Hilfsnetz",
    "脚掌 · P2-03": "Fußsohle · P2-03",
    "真实 3MF 网格": "Echtes 3MF-Gitter",
    "小腿连接件 · P6-04": "Wadenverbinder · P6-04",
    "小轴承 · 10×15×3": "Kleiner Lager · 10×15×3",
    "踝轴 · P2-05": "Knöchelschaft · P2-05",
    "真实网格 · 定位示意": "Echtes Gitter·Positionierungsdiagramm",
    "拆下的舵盘": "Servohorn entfernt",
    "新增教学示意": "Lehranweisungen hinzugefügt",
    "舵盘中央原装螺丝": "Servohorn zentrale Originalschraube",
    "新增教学示意 · 规格待核": "Lehranweisungen hinzugefügt · Spezifikationen müssen überprüft werden",
    "三针舵机插头": "Dreipoliger Servo-Stecker",
    "三芯舵机线": "Dreiadrige Servo-Leitung",
    "新增教学示意 · 路径未核验": "Lehranweisungen hinzugefügt · Der Pfad wurde nicht verifiziert",
    "小腿固定螺丝 1 · M2×6": "Wadenbefestigungsschraube 1 · M2×6",
    "新增教学示意 · 孔位未核验": "Neue Lehranweisungen · Lochposition nicht überprüft",
    "小腿固定螺丝 2 · M2×6": "Wadenbefestigungsschraube 2 · M2×6",
    "脚掌固定螺丝 1 · M2×6": "Fußbefestigungsschraube 1 · M2×6",
    "脚掌固定螺丝 2 · M2×6": "Fußbefestigungsschraube 2 · M2×6",
    "脚掌固定螺丝 3 · M2×6": "Fußbefestigungsschraube 3 · M2×6",
    "脚掌固定螺丝 4 · M2×6": "Fußbefestigungsschraube 4 · M2×6",
    "踝轴固定螺丝 · M2.3×8": "Befestigungsschraube für Knöchelschaft · M2.3×8",
    "新增教学示意 · 配合未核验": "Lehranweisungen hinzugefügt · Die Zusammenarbeit wurde nicht überprüft",
    "拧入中": "Einschrauben",
    "已紧固": "Verschärft",
    "预拧中": "Vorverschraubt",
    "预拧到位": "Vorverschraubt",
    "正在取下": "Entfernen",
    "已取下": "ENTFERNT",
    "插接中": "Verbinden",
    "已接合": "Beschäftigt",
    "整理中": "In Vorbereitung",
    "余量已留好": "Der Restbetrag wurde reserviert",
    "压入中": "Eindrücken",
    "已就位": "Bereits vorhanden",
    "模型配合待核": "Modellpassung nicht geprüft",
    "螺丝放大": "Schraubendetail",
    "舵盘放大": "Servohorndetail",
    "放大": "vergrößern",
    "线端放大": "Kabelenddetail",
    "接头放大": "Steckerdetail",
    "{value} · {value}": "{value} · {value}",
    "局部放大": "lokale Vergrößerung",
    "本步可手动开关；换步后，小部位自动开启，大部位默认关闭": "Dieser Schritt kann manuell ein- und ausgeschaltet werden; Nach dem Ändern der Schritte werden kleine Teile automatisch aktiviert und große Teile standardmäßig deaktiviert.",
    "本步暂无需要放大的装配细节": "In diesem Schritt müssen keine Montagedetails vergrößert werden.",
    "局部放大 · ": "Teilzoom ·",
    "开": "Ein",
    "关": "Aus",
    " · 剖视": "· Querschnitt",
    "对准接口": "Schnittstelle ausrichten",
    "窗口": "Fenster",
    "当前装配部位的实时三维放大画面": "Dreidimensionale Vergrößerung des aktuellen Baugruppenteils in Echtzeit",
    "右脚踝": "rechter Knöchel",
    "左脚踝": "linker Knöchel",
    "右腿连接": "Verbindung mit dem rechten Bein",
    "左腿连接": "linke Beinverbindung",
    "双腿收尾": "Fertig sind die Beine",
    "准备{value}脚踝零件": "Bereiten Sie die Knöchelteile {value} vor",
    "{value}脚踝装好了": "{value} Knöchel ist installiert",
    "准备已编号、已居中的 {value} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。": "Bereiten Sie die nummerierten, zentrierten {value} Servo sowie den Fußballen, die Wade, Lager und den Knöchelschaft auf dieser Seite vor.",
    "可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。": "Sie können die Inspektion rotieren lassen, bevor Sie mit der nächsten Stufe fortfahren. Sohlenpolster werden in der Endbearbeitungsphase der Beine angebracht.",
    "先卸中央螺丝，再取下舵盘": "Entfernen Sie zuerst die Zentralschraube und entfernen Sie dann das Servohorn",
    "对准接口，按压到位": "Richten Sie die Schnittstelle aus und drücken Sie sie fest",
    "对孔 · M2×6 ×2": "Richtiges Loch · M2×6 ×2",
    "固定脚掌 · M2×6 ×4": "Fester Fuß · M2×6 ×4",
    "沿轴向压入": "Axial eindrücken",
    "对齐轴承中心": "Richten Sie Lager mittig aus",
    "拧至螺丝头贴合": "Anziehen, bis der Schraubenkopf passt",
    "右": "Rechts",
    "左": "Links",
    "对齐双舵机": "Doppeltes Servo ausrichten",
    "对齐{value}腿的两只舵机": "Richten Sie die beiden Servo-Beine von {value} aus",
    "按视频排列 {value}，对齐成对舵机。画面中的左右是拍摄视角，不直接等于机器人左右。": "Ordnen Sie {value} per Video an, richten Sie das Paar Servo aus. Die linke und rechte Seite im Bild stellen den Aufnahmewinkel dar und entsprechen nicht direkt der linken und rechten Seite des Roboters.",
    "保留另一只已完成的脚踝；核对当前这一侧。": "Behalten Sie den anderen fertigen Knöchel; Überprüfen Sie die aktuelle Seite.",
    "核对舵机与方向": "Überprüfen Sie Servo mit Richtung",
    "固定大腿支撑": "Feste Oberschenkelstütze",
    "固定双圆孔大腿支撑": "Feste Oberschenkelstütze mit doppelter Öse",
    "把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。": "Befestigen Sie die weiße Doppelrundlochhalterung am Paar Servo, richten Sie die vier festen Positionen aus und schrauben Sie die vier M2×6 ein, wie im Video gezeigt.",
    "逐孔核对后固定。孔位与安装配合仍是原型示意。": "Loch für Loch prüfen und dann reparieren. Die Lochposition und die Einbaukoordination sind noch Prototypenangaben.",
    "M2×6 ×4 · 固定支撑": "M2×6 ×4 · Feste Unterstützung",
    "压入大轴承": "Drücken Sie den großen Lager hinein",
    "压入连接脚踝的大轴承": "Drücken Sie in den großen Lager, der den Knöchel verbindet",
    "将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。": "Richten Sie 16×22×4 mm und das große Lager am Stützloch aus und drücken Sie es entlang der axialen Richtung fest.",
    "轴承应坐正，再连接已经装好的脚踝。": "Lager sollte aufrecht sitzen und dann den installierten Knöchel verbinden.",
    "沿轴向压入大轴承": "Den großen Lager in axialer Richtung eindrücken",
    "连接已装脚踝": "Befestigter Knöchel",
    "接上{value}脚踝子组件": "Verbinden Sie die {value}-Knöchelbaugruppe",
    "把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。": "Bewegen Sie den fertigen Knöchel und die Wade als Ganzes in die Lager-Position der Oberschenkelstütze und befestigen Sie vier M2×6.",
    "已有螺丝、踝轴与线缆随子组件一起移动。": "Es sind bereits Schrauben, Gelenke und Kabel vorhanden, die sich mit der Unterbaugruppe bewegen.",
    "整体对齐 · M2×6 ×4": "Gesamtausrichtung · M2×6 ×4",
    "插接腿内线束": "In das Bein einsetzen Kabelbaum",
    "插接可见的腿内总线": "Stecken Sie den sichtbaren Beinbus ein",
    "按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。": "Stecken Sie die sichtbare dreipolige Servo-Leitung entsprechend dem Video ein und ziehen Sie sie fest, sodass Spielraum für Gelenkbewegung bleibt.",
    "此处演示插接与路径；每根线两端的准确接口和针脚尚未核验。": "Paarung und Routing werden hier demonstriert; Die genauen Anschlüsse und Pinbelegungen an jedem Ende jedes Kabels wurden nicht überprüft.",
    "插接线束 · 端点示意": "Stecker Kabelbaum · Endpunktdiagramm",
    "整理线束余量": "Organisieren Sie die Kabelbaum-Marge",
    "整理线束并留出上端连接线": "Ordnen Sie Kabelbaum an und lassen Sie die obere Verbindungslinie stehen",
    "整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。": "Ordnen Sie den Schleifendraht so an, dass Kabelbaum an der Außenseite des Mechanismus verbleibt, und bewahren Sie die nachfolgenden Drahtenden auf, die mit dem Gehäuse verbunden sind.",
    "不要夹线，也不要根据三芯黑线的外观判断针脚定义。": "Klemmen Sie den Faden nicht ein und beurteilen Sie die Pin-Belegung nicht anhand des Aussehens des dreiadrigen schwarzen Kabels.",
    "留出活动余量 · 不夹线": "Freiraum für Bewegung lassen · Keine Fadenklemmung",
    "{value}腿连接完成": "{value} Beinverbindung abgeschlossen",
    "{value}腿连接部分完成": "{value} Beinverbindungsteil fertiggestellt",
    "检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。": "Überprüfen Sie den verbundenen Knöchel, die doppelte Servo-Orthese und Kabelbaum und fahren Sie dann mit der nächsten Stufe fort.",
    "上端连接件和脚底软垫还没有安装。": "Die oberen Anschlüsse und Unterfußpolster sind noch nicht installiert.",
    "卸右腿上端舵盘": "Entfernen Sie den oberen Teil des rechten Beins Servohorn",
    "卸下右腿上端的原装舵盘": "Entfernen Sie den Original-Servohorn am oberen rechten Bein",
    "先卸中央固定螺丝，再取下舵盘，保留在旁边。": "Entfernen Sie zuerst die zentrale Befestigungsschraube, entfernen Sie dann den Servohorn und legen Sie ihn daneben.",
    "此处按视频处理上端；不要拆动已经固定的脚踝。": "Das obere Ende wird entsprechend dem Video hier bearbeitet; Entfernen Sie nicht den festen Knöchel.",
    "先卸中央螺丝，再取舵盘": "Entfernen Sie zuerst die Zentralschraube und nehmen Sie dann den Servohorn heraus",
    "卸左腿上端舵盘": "Entfernen Sie den oberen Teil des linken Beins Servohorn",
    "卸下左腿上端的原装舵盘": "Entfernen Sie den Original-Servohorn am oberen linken Bein",
    "按镜像方向处理另一条腿，依次卸中央螺丝和舵盘。": "Bearbeiten Sie das andere Bein in Spiegelrichtung und entfernen Sie nacheinander die Zentralschraube und Servohorn.",
    "拆下的原装零件继续保留在零件区。": "Die ausgebauten Originalteile verbleiben im Teilebereich.",
    "保留拆下的原装零件": "Bewahren Sie die ausgebauten Originalteile auf",
    "右连接件压轴承": "Rechtes Verbindungsstück drücken Lager",
    "先给右上端连接件压入轴承": "Drücken Sie zunächst Lager in den oberen rechten Anschluss",
    "在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。": "Drücken Sie den großen Lager in den separaten oberen Anschluss und befestigen Sie dann die Baugruppe am Bein.",
    "先压轴承，再安装连接件；不要把这两步倒过来。": "Drücken Sie zuerst Lager und installieren Sie dann den Stecker. Machen Sie diese beiden Schritte nicht rückgängig.",
    "先在连接件中压入轴承": "Drücken Sie zunächst Lager in den Stecker",
    "安装右连接件": "Rechten Stecker einbauen",
    "固定右上端连接件与轴承": "Befestigen Sie den oberen rechten Stecker mit Lager",
    "把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。": "Richten Sie den eingepressten Stecker Lager auf die obere Endposition aus und fixieren Sie ihn mit vier M2×6.",
    "连接件与它内部的轴承一起移动。": "Der Stecker bewegt sich mit dem Lager darin.",
    "组件整体安装 · M2×6 ×4": "Gesamtinstallation der Komponenten · M2×6 ×4",
    "左连接件压轴承": "Linkes Verbindungsstück drücken Lager",
    "给左上端连接件压入轴承": "Drücken Sie Lager in den oberen linken Anschluss",
    "在另一侧连接件中压入大轴承，保持镜像朝向。": "Drücken Sie den großen Lager in den Anschluss auf der anderen Seite und behalten Sie dabei die Spiegelausrichtung bei.",
    "左右连接件使用各自的真实网格。": "Die linken und rechten Anschlüsse verwenden ihre eigenen echten Netze.",
    "镜像方向 · 先压轴承": "Spiegelrichtung · Drücken Sie zuerst Lager",
    "安装左连接件": "Linken Stecker einbauen",
    "固定左上端连接件与轴承": "Befestigen Sie den oberen linken Stecker mit Lager",
    "把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。": "Montieren Sie das Verbindungsstück auf der anderen Seite mit Lager und befestigen Sie es mit vier M2×6.",
    "检查两侧方向一致，给后续身体装配留下连接位置。": "Überprüfen Sie, ob die Richtungen auf beiden Seiten übereinstimmen und eine Verbindungsposition für die spätere Karosseriemontage frei bleibt.",
    "固定右脚底软垫": "Festes Sohlenpolster für den rechten Fuß",
    "安装右脚底软垫": "Installieren Sie das rechte Sohlenpolster",
    "将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。": "Bringen Sie das weiche Polster an Ihrer Fußsohle an, richten Sie die vier Löcher entsprechend dem Video aus und befestigen Sie die vier M2×6.",
    "这是脚底软垫，不是稍后总装阶段的大腿外壳。": "Dabei handelt es sich um das Sohlenpolster, nicht um die Oberschenkelschale, die später in der Endmontagephase hinzukommt.",
    "对准脚底 · M2×6 ×4": "Richten Sie Ihre Fußsohlen aus · M2×6 ×4",
    "固定左脚底软垫": "Festes linkes Sohlenpolster",
    "安装左脚底软垫": "Installieren Sie das Sohlenpolster des linken Fußes",
    "在另一只脚底安装软垫，按视频固定四颗 M2×6。": "Bringen Sie ein weiches Polster an der Unterseite des anderen Fußes an und befestigen Sie vier M2×6, wie im Video gezeigt.",
    "检查两只脚底与线束状态，然后进入身体与髋部装配。": "Überprüfen Sie den Zustand der Sohlen beider Füße und Kabelbaum und fahren Sie dann mit dem Zusammenbau von Körper und Hüfte fort.",
    "双腿完成查看": "Gesamtansicht der Beine",
    "双腿子组件装好了": "Die zweibeinige Unterbaugruppe ist installiert",
    "现在可以旋转查看两条腿，或回到任意阶段重新看。": "Sie können sich jetzt drehen, um beide Beine zu sehen, oder zu einer beliebigen Bühne zurückkehren, um sie erneut zu sehen.",
    "当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。": "Die aktuelle Stufe ist 08:16; Der nächste Schritt besteht darin, die Körperhüften zu installieren und dann den Kopf, den Hals und die elektronische Steuerung zusammenzubauen.",
    "{value}{value} · {value}": "{value}{value} · {value}",
    "{value}{value}": "{value}{value}",
    "舵机": "Servo",
    "小轴承": "KleinLager",
    "真实 3MF 网格 · 配合待核验": "Echtes 3MF-Gitter · Koordination muss überprüft werden",
    "现有硬件网格": "Vorhandenes Hardware-Grid",
    "教学简模 · 孔位待核验": "Einfaches Lehrmodell · Lochpositionen müssen überprüft werden",
    "{value}固定螺丝 {value} · M2×6": "{value} Befestigungsschraube {value} · M2×6",
    "{value}上端舵机 · ID{value}": "{value} oberes EndeServo · ID{value}",
    "{value}中部舵机 · ID{value}": "{value} Mitte Servo · ID{value}",
    "{value}大腿支撑 · {value}": "{value} Oberschenkelstütze · {value}",
    "{value}大轴承 · 16×22×4": "{value} groß Lager · 16×22×4",
    "{value}上端原装舵盘": "{value} oberes Ende original Servohorn",
    "教学简模 · 安装位示意": "Vermittlung eines einfachen Modells · Anzeige der Installationsposition",
    "{value}上端原装中央螺丝": "{value} Original-Zentralschraube am oberen Ende",
    "教学简模 · 原装规格待核": "Einfaches Lehrmodell · Ursprüngliche Spezifikationen müssen überprüft werden",
    "{value}上端连接件 · {value}": "{value} oberer Anschluss · {value}",
    "{value}连接件大轴承": "{value} großer Stecker Lager",
    "{value}脚底软垫 · {value}": "{value} Weiches Fußpolster · {value}",
    "线束教学示意 · 路径和端点待核验": "Kabelbaum Lehranweisungen · Der Pfad und die Endpunkte müssen überprüft werden",
    "{value}腿内三芯线": "{value} dreiadriges Kabel im Bein",
    "腿内三芯线": "Dreiadriger Draht im Bein",
    "{value}腿上端预留线": "{value} reservierte Linie für das obere Bein",
    "上端预留线": "Reservierte Zeile am oberen Ende",
    "教学接口；精确键位与针脚待核": "Lehrschnittstelle; Genaue Schlüsselpositionen und Stifte müssen überprüft werden",
    "双插座教学锚点；物理修订与电气针脚待核": "Lehranker mit Doppelsteckdose; Physische Überarbeitung und elektrische Pinbelegung stehen noch aus",
    "原装螺丝": "Originalschrauben",
    "原装舵盘": "Original Servohorn",
    "线端余量": "Zeilenendrand",
    "插头": "Stecker",
    "踝轴": "Knöchelachse",
    "轴承": "Lager",
    "线束整理": "Kabelbaum Endbearbeitung",
    "下嘴软垫": "Weiches Kissen für den unteren Mundbereich",
    "上嘴软垫": "Lippenkissen",
    "右脚底软垫": "Polsterung der rechten Fußsohle",
    "左脚底软垫": "Polsterung der linken Fußsohle",
    "下巴": "Kiefer",
    "头部平台": "Kopfplattform",
    "右脚": "rechter Fuß",
    "左脚": "linker Fuß",
    "右踝轴": "Rechte Knöchelachse",
    "眼睛外壳": "Augenmuschel",
    "左踝轴": "linke Knöchelachse",
    "眼睛": "Auge",
    "颈部连接板 A": "Halsverbindungsplatte A",
    "颈部连接板 B": "Halsverbindungsplatte B",
    "右 Roll 舵机输出": "Rechter Roll Servo-Ausgang",
    "左 Roll 舵机输出": "Linker Roll Servo-Ausgang",
    "头盖": "Schädel",
    "头部舵机固定件": "Kopf Servo Befestigungsstück",
    "身体背板": "Karosserierückwand",
    "大腿右外壳": "Rechte Oberschenkelschale",
    "大腿左外壳": "Oberschenkelschale links",
    "电池仓": "Batteriefach",
    "右大腿支撑": "Rechte Oberschenkelstütze",
    "左大腿支撑": "linke Oberschenkelstütze",
    "身体右外壳": "Körper rechte Schale",
    "身体左外壳": "Körper linke Schale",
    "头部俯仰支架": "Kopfneigungshalterung",
    "右 Roll 舵机盖板": "Rechte Roll Servo Abdeckung",
    "左 Roll 舵机盖板": "Linke Roll Servo Abdeckung",
    "右小腿": "Rechte Wade",
    "左小腿": "Linke Wade",
    "右 Yaw 连接件": "Rechter Yaw-Anschluss",
    "左 Yaw 连接件": "Linker Yaw-Stecker",
    "头部 Yaw 支架": "Kopf Yaw Halterung",
    "髋部 Yaw 支撑": "Hip Yaw Unterstützung",
    "重复 actorId: {value}": "Wiederholen Sie actorId: {value}",
    "Arduino UNO Q · 已确认外观 v2批次": "Arduino UNO Q · Aussehen bestätigt v2-Charge",
    "陆吾扩展板 · 已确认外观 v2": "Luwu-Erweiterungsplatine · Bestätigtes Erscheinungsbild v2",
    "已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证": "Bestätigtes Fotomodell · Einheitliche Einheitenumrechnung 1000; Die Schätzung der Montagelöcher und die elektrische Zuordnung wurden nicht physisch überprüft",
    "M3×16 固定螺丝 {value} · 两板近共轴孔候选": "M3×16 Befestigungsschraube {value} · Geeignet für nahezu koaxiale Löcher auf zwei Platten",
    "M3×16 固定螺丝 {value} · 孔位待核": "M3×16 Befestigungsschraube {value} · Lochposition muss überprüft werden",
    "源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合": "Quelle GLB Lochpositionsvergleich; 2-Löcher sind nahezu koaxial und 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet; Die Löcher werden nicht verändert oder die physische Passung wird vermutet",
    "已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证": "Bestätigtes v2 Servo-Erscheinungsbild · HD-1910-C001 / HD1910M; Der Schaft ist entsprechend den Modellkoordinaten angepasst und die Passung und Stifte wurden nicht physikalisch überprüft.",
    "已确认 v2 独立舵盘外观 · 按步骤拆卸；实体配合仍待核": "Bestätigtes v2 unabhängiges Servohorn-Erscheinungsbild · Demontage gemäß Schritten; Die körperliche Koordination muss noch überprüft werden",
    "已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意": "Das Erscheinen des dreiadrigen Steckers v2 und der drei schwarzen Drähte wurde bestätigt; Die Kabellänge, Verkabelung und Pins sind noch ungeprüfte Lehranweisungen",
    "已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证": "Das Aussehen der Schrauben mit den angegebenen Spezifikationen v2 wurde bestätigt. Die Lochposition, das Drehmoment und die physische Passform wurden nicht physisch überprüft.",
    "保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。": "Lassen Sie die beiden Platinen miteinander verbunden und bewegen Sie die Hauptsteuerbaugruppe auf die Rückseite des Roboterkörpers. Die Originalstücke sind mit 4 und M3×16 gekennzeichnet; Dieses Modell zeigt nur das Einfügen von zwei nahezu koaxialen Löchern, die restlichen beiden sind zur Überprüfung reserviert.",
    "原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。": "Das Originalstück hat 4-Teile; Die 2-Löcher dieses Modells sind nahezu koaxial und die 2-Löcher sind ungefähr 1.27mm falsch ausgerichtet. Der abgeschlossene Zustand der Durchquerung der beiden Platten ist noch nicht dargestellt. Die Form der Quellplatte, die Lochposition, die PCB-Dicke und der Pin-Reihenabstand wurden nicht gestreckt oder gepatcht; Die Körperunterstützung und die körperliche Koordination müssen überprüft werden.",
    "原片 M3×16 ×4 · 演示2孔，另2孔待核": "Originalfilm M3×16 ×4 · Zeigt 2-Löcher, und die anderen 2-Löcher müssen überprüft werden",
    "采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。": "Es wird das bestätigte Board-Modell verwendet; Die Ausrichtung der 32-Stifte und der 12.3mm-Modellierungsabstand wurden überprüft und die Lochpositionen wurden anhand von Fotos geschätzt. Die beiden Befestigungslöcher sind etwa 1.27mm falsch ausgerichtet und die physische Einfügung, die Toleranzen und die elektrischen Pins wurden nicht überprüft.",
    "采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。": "Mit bestätigtem Fotomodell. Die vier Sätze von 32-Pins sind entsprechend den Modellkoordinaten ausgerichtet; PCB und die Schnittstelle werden nicht entsprechend der Gesamthüllkurve gestreckt. Platinenfreiheit, Schlüsselpositionen, elektrische Zuordnung und physische Passform müssen noch überprüft werden.",
    "萨蒂 · 第一号吉姆诺佩蒂": "Satie Nr. 1 Jimnoppetti",
    "莫扎特 · K.545 行板": "Mozart · K.545 Andante",
    "已静音": "gedämpft",
    "点一下页面开始音乐": "Klicken Sie auf die Seite, um die Musik zu starten",
    "正在准备钢琴曲…": "Klaviermusik vorbereiten...",
    "正在播放 · ": "Spielt gerade ·",
    "仅播放完成提示音": "Spielen Sie nur den Abschlusston ab",
    "声音已关闭": "Der Ton ist aus",
    "钢琴曲暂时无法播放，可切换曲目重试": "Die Klaviermusik kann vorübergehend nicht abgespielt werden. Sie können den Titel wechseln und es erneut versuchen.",
    "打印件用涂装台当前的配色，舵机、板子和螺丝保持原样": "Der Druck verwendet das aktuelle Farbschema der Farbtabelle, Servo, die Platine und die Schrauben bleiben gleich",
    "还没有涂色，打印件先用白色演示": "Es wurde noch nicht eingefärbt, daher wird der Ausdruck zunächst in Weiß gezeigt.",
    "配色 · ": "Farbabstimmung ·",
    "白胚": "Unbemalt",
    ").textContent=s.complete?`{value} · 完成`:`${String(local).padStart(2,": ").textContent=s.complete?`{value} · Vollständig`:`${String(local).padStart(2,",
    "红框 · 对准这两处": "Rotes Kästchen · Zielen Sie auf diese beiden Orte",
    "绿框 · 本次已装好": "Grüner Rahmen · Dieses Mal bereits installiert",
    "真实零件网格": "Echtes Teilnetz",
    "模型清单加载失败": "Das Laden des Modellmanifests ist fehlgeschlagen",
    "模型几何加载失败": "Das Laden der Modellgeometrie ist fehlgeschlagen",
    "极致 · ": "Extrem ·",
    "极致 · 细腻哑光、边缘柔光与摄影棚反射": "Ultimativ · Zartes Matt, weiches Randlicht und Studioreflexion",
    "当前 · 原有材质和渲染": "Aktuell · Originalmaterialien und Rendering",
    "来做鸭 / letsduck · 3D 组装教程": "Machen wir eine Ente / letsduck · 3D Montage-Tutorial",
    "来做鸭 / letsduck": "Lass uns eine Ente machen / letsduck",
    "3D 组装教程": "3D-Montage-Tutorial",
    "整机预览": "Vorschau der gesamten Maschine",
    "对照原片": "Vergleichen Sie den Originalfilm",
    "跟着视频，一步一步装": "Folgen Sie dem Video und installieren Sie es Schritt für Schritt",
    "整机组装": "Komplette Maschinenmontage",
    "原片 00:00—23:10": "Originalfilm 00:00—23:10",
    "画质": "Bildqualität",
    "渲染画质": "Rendering-Qualität",
    "当前": "aktuell",
    "极致": "extrem",
    "局部放大 · 关": "Teilweiser Zoom · Aus",
    "最佳视角": "Bester Betrachtungswinkel",
    "正面": "Front",
    "背面": "zurück",
    "三维组装区域": "3D-Montagebereich",
    "正在加载现有模型…": "Vorhandenes Modell wird geladen...",
    "可旋转的整机三维模型": "Drehbares 3D-Modell der gesamten Maschine",
    "接头局部放大窗": "Gemeinsames Teilvergrößerungsfenster",
    "拖动放大窗": "Ziehen Sie das Vergrößerungsfenster",
    "收起局部放大": "Lokale Vergrößerung reduzieren",
    "当前接头的实时三维放大画面": "Echtzeit-3D-Vergrößerung des aktuellen Gelenks",
    "所选零件信息": "Ausgewählte Teileinformationen",
    "收起零件信息": "Teileinformationen ausblenden",
    "可以开始": "kann beginnen",
    "本步动作": "Aktion dieses Schritts",
    "本步动作进度": "Fortschritt dieses Schritts",
    "← 上一步": "← Zurück",
    "红绿框演示": "Demonstration der roten und grünen Box",
    "暂停": "Pause",
    "自动播放 · 关": "Autoplay · Aus",
    "播放倍率": "Wiedergabevergrößerung",
    "声音设置": "Toneinstellungen",
    "声音": "Klang",
    "收起声音设置": "Toneinstellungen einklappen",
    "背景音乐": "Hintergrundmusik",
    "选择钢琴曲": "Wählen Sie Klaviermusik",
    "完成提示音": "Abschlusston",
    "音量": "Volumen",
    "曲目与模型来源 ↗": "Spur- und Modellquelle ↗",
    "开始组装": "Beginnen Sie mit dem Zusammenbau",
    "下一步 →": "Weiter →",
    "从头再看": "Schauen Sie es sich von Anfang an an",
    "v4.1 走线复核版 · 新插头与部分3MF支架/外壳有几何干涉，红框部位配合待核。": "v4.1-Verkabelungsüberprüfungsversion · Der neue Stecker weist geometrische Interferenzen mit einigen 3MF-Halterungen/Gehäusen auf, und die Koordination der roten Boxteile muss überprüft werden.",
    "组装步骤": "Montageschritte",
    "组装顺序": "Montagereihenfolge",
    "选择组装阶段": "Montagestufe auswählen",
    "1 · 准备与编号": "1 · Vorbereitung und Nummerierung",
    "2 · 右脚踝": "2 · Rechter Knöchel",
    "3 · 左脚踝": "3 · Linker Knöchel",
    "4 · 右腿连接": "4 · Verbindung mit dem rechten Bein",
    "5 · 左腿连接": "5 · Linker Beinanschluss",
    "6 · 双腿收尾": "6 · Beinbearbeitung",
    "7 · 身体与髋支撑": "7 · Körper- und Hüftunterstützung",
    "8 · 髋电机与接腿": "8 · Hüftmotoren und Beingelenke",
    "9 · 头部旋转与接线": "9 · Kopfdrehung und Verkabelung",
    "10 · 嘴部与双舵机脖子": "10 · Mund und doppelter Hals Servo",
    "11 · 头盖与嘴部软垫": "11 · Kopfbedeckung und Mundpolster",
    "12 · 身体与头颈总装": "12 · Körper und Kopf-Hals-Baugruppe",
    "13 · 电控与外壳收尾": "13 · Elektronische Steuerung und Gehäuseveredelung",
    "14 · 校准与完成": "14 · Kalibrierung und Abschluss",
    "选择组装步骤": "Montageschritte auswählen",
    "本步说明 ↗": "Anleitung für diesen Schritt ↗",
    "收起本步说明": "Reduzieren Sie die Anweisungen für diesen Schritt",
    "准备": "Vorbereiten",
    "教学说明 · 不连接或控制真实设备": "Hinweise zum Tutorial · Keine Verbindung oder Steuerung realer Geräte",
    "本步用到": "Wird in diesem Schritt verwendet",
    "看这一步的原片": "Sehen Sie sich das Originalvideo dieses Schritts an",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。": "Lehranweisungen: Lochpositionen, Verbindungskoordination, Platinenmodifikationen und Linienendpunkte wurden noch nicht physisch überprüft.",
    "原片对照": "Originalfilmvergleich",
    "收起原片": "Schließen Sie den Originalfilm",
    "截取自你提供的视频 · 20:58—23:10": "Auszug aus dem von Ihnen bereitgestellten Video · 20:58—23:10",
    "{name}放大": "{name} vergrößern",
    "{ordinal}/{total} · {status}": "{ordinal}/{total} · {status}",
    "{frame} · {status}": "{frame} · {status}",
    "{title}窗口": "{title}-Fenster",
    "{name} · 剖视": "{name} · Querschnitt",
    "局部放大 · {state}": "Teilzoom · {state}",
    "自动播放 · {state}": "Autoplay · {state}",
    "截取自你提供的视频 · {start}—{end}": "Auszug aus dem von Ihnen bereitgestellten Video · {start}—{end}",
    "模型没有加载成功：{error}": "Das Modell wurde nicht erfolgreich geladen: {error}",
    "配色 · {name}": "Farbe · {name}",
    "正在播放 · {track}": "Spielt gerade · {track}",
    "本步观看 {seen} / {total} · 实物完成 {built} / {total}": "Sehen Sie sich diesen Schritt an {seen} / {total} · Physische Fertigstellung {built} / {total}",
    "本步说明": "Anleitung für diesen Schritt",
    "收起说明 · 留出观察空间": "Anweisungen zum Einklappen · Lassen Sie Platz für die Beobachtung",
    "方向与动作": "Richtung und Aktion",
    "完成检查": "Komplette Inspektion",
    "已看过此步": "Habe diesen Schritt bereits gesehen",
    "我已检查实物并装好": "Ich habe das physische Objekt überprüft und installiert",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。接头键位、实际插座、针脚和极性未核验。": "Lehranweisungen: Lochpositionen, Verbindungskoordination, Platinenmodifikationen und Linienendpunkte wurden noch nicht physisch überprüft. Steckerschlüssel, tatsächliche Buchsen, Stifte und Polarität wurden nicht überprüft.",
    "观察设置 · 视角 / 聚焦 / 画质": "Beobachtungseinstellungen·Anzeige/Fokus/Bildqualität",
    "播放设置 · 进度 / 倍率 / 声音": "Wiedergabeeinstellungen · Fortschritt/Vergrößerung/Ton",
    "收起组装顺序": "Zusammenbaureihenfolge reduzieren",
    "观看 {seen}/{total} · 实物 {built}/{total}": "Sehen Sie sich {seen}/{total} · Aktuelles {built}/{total} an",
    "{chapter} · {local} / {total}": "{chapter} · {local} / {total}",
    "{chapter} · 完成": "{chapter} · Vollständig",
    "{local}  {short}": "{local} {short}",
    "红框": "Roter Rahmen",
    "绿框": "Grüner Rahmen",
    "重播本步": "Wiederholen Sie diesen Schritt",
    "继续播放": "weiterspielen",
    "自动播放": "Autoplay",
    "开启后从第0步开始，连续播放全部14个阶段": "Nach dem Einschalten werden ab Schritt 0 alle 14-Stufen kontinuierlich abgespielt.",
    "全部播放完成": "Die gesamte Wiedergabe ist abgeschlossen",
    "本步完成，准备下一步": "Dieser Schritt ist abgeschlossen und bereit für den nächsten Schritt",
    "自动播放中": "Automatisch abspielen",
    "自动播放已暂停": "Autoplay angehalten",
    "正在演示": "Demonstrieren",
    "可旋转查看": "Zur Ansicht drehen",
    " 新模型配合待核：相关插头与原3MF支架或外壳有几何重叠；保持原尺寸，红框不表示已接合。": "Die Passform des neuen Modells muss überprüft werden: Der entsprechende Stecker weist eine geometrische Überlappung mit der ursprünglichen 3MF-Halterung oder -Schale auf; Die ursprüngliche Größe bleibt erhalten und das rote Kästchen zeigt nicht an, dass es verbunden wurde.",
    "进度未保存：浏览器存储不可用，请重试。": "Fortschritt nicht gespeichert: Browserspeicher ist nicht verfügbar, bitte versuchen Sie es erneut.",
    " · 已看过": "· Angesehen",
    " · 实物已装好": "· Das eigentliche Objekt wurde installiert",
    "展开本步说明": "Erweitern Sie die Anweisungen für diesen Schritt",
    "舵机口": "Servo-Port"
  }
};
