# Multiplayer Spiel

Die Client- und Serverdateien kommunizieren mithilfe von socket.io, einer JavaScript-Bibliothek für Echtzeit-Webanwendungen. 

- `game.js` - Clientseite
- `server.js` - Serverseite

Mit der `emit`-Methode kann eine Nachricht(=Daten) von einem Client oder Server an den anderen gesendet werden. 

this.socket.emit('playerMovement', { x: player.x, y: player.y });
Der Client teilt dem Server mit, dass sich der Spieler bewegt hat.
Auf der Serverseite werden `emit`-Aufrufe verwendet, um Daten an alle verbundenen Clients zu sendenm die dann wiederum diese Daten mit `socket.on` empfangen und darauf reagieren können.

`socket.on` ist das Gegenteil von `emit`. Diese Methode wird vrewendet, um auf Ereignisse zu reagieren, die vom Server an den Client gesendet werden.
socket.on('playerMovement', function(movementData) { /* ... */ });