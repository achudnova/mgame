// Modul für die Erstellung des Webservers
const express = require('express');
// createServer Funktion aus dem http-Modul, um einen Websocket-Server zu erstellen
const { createServer } = require('http');
// Server-Klasse aus dem socket.io Modul
const { Server } = require('socket.io');
// IP-Modul um die IP Adresse des Servers zu erhalten
const ip = require('ip');
// Klassen importieren
const Star = require('./src/star');
const { generateColor } = require('./src/color');
const { getRandomIn } = require('./src/random');

// neue Express Anwendung erstellen
const app = express();
// HTTP-Server erstellen
const httpServer = createServer(app);
// WebScoket-Server erstellen, der den HTTP-Server verwendet
const io = new Server(httpServer);

// stellt das public-Verzeichnis als statisches Verzeichnis bereit, sodass alle darin enthaltenen Dateien direkt om Server bedient werden können
app.use(express.static(__dirname + '/public'));
// Route für die Startseute festlegen, die die index Datei aus dem Hauptverzeichnis sendet
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// Ein leeres Objekt wird erstellt, um alle Spieler zu speichern
const players = {};
// Leeres Objekt fürs Scoreboard
let scoreboard = {};
// Sterne initialisieren
const stars = initializeStars();
// setzt die Anzahl der verfügbaren Sterne
let starsAvailable = stars.length;

// legt max Anzahl an Spielern fest, breite und höhe des Spielfelds definieren
const maxPlayers = 4;
const boardWidth = 800;
const boardHeight = 600;
// setzt das Timeout für das Nachfüllen der Sterne auf 2 Sekunden
const timeoutBeforeStarReplenishMs = 2000;
// legt die Punktzahl fest, die zum gewinnen des Spiels erforderlich ist
const scoreToWin = 50;

//Diese Funktion erstellt und gibt ein Array von Star-Objekten zurück. 
// Jeder Stern wird mit einer ID, x- und y-Koordinaten sowie einem display-Flag initialisiert.
function initializeStars() {
  return [
    new Star(1, 24, 176, true), new Star(2, 73, 38, true), new Star(3, 185, 73, true),
    new Star(4, 301, 103, true), new Star(5, 375, 41, true), new Star(6, 419, 208, true),
    new Star(7, 603, 63, true), new Star(8, 721, 142, true), new Star(9, 37, 349, true),
    new Star(10, 148, 452, true), new Star(11, 277, 377, true), new Star(12, 359, 484, true),
    new Star(13, 484, 447, true), new Star(14, 601, 496, true), new Star(15, 738, 465, true),
    new Star(16, 564, 327, true), new Star(17, 722, 286, true),
  ];
}

// Funktion, die überprüft, ob die maximale Spieleranzahl erreicht wurde
const isMaxPlayersReached = () => Object.keys(players).length >= maxPlayers;

//  Funktion, die ein neues Spielerobjekt erstellt.
// Der Spieler wird mit zufälligen x- und y-Koordinaten, einer ID, einer zufällig generierten Farbe und einem Namen initialisiert.
const makePlayer = (id, name) => ({
  x: getRandomIn(0, boardWidth),
  y: getRandomIn(0, boardHeight - 100),
  id: id,
  color: generateColor(),
  name: name,
});

// WebSocket-Verbindungen und Events
// Lauscht auf neue Verbindungen
// Jedes Mal, wenn ein Spieler sich verbindet, wird eine neue connection-Sitzung erstellt.
io.on('connection', socket => {
  // Speichert die Socket-ID des Spielers als playerId
  const playerId = socket.id;

  // Lauscht auf das playerJoined-Event und ruft die handlePlayerJoined-Funktion auf.
  socket.on('playerJoined', aPlayer => handlePlayerJoined(socket, playerId, aPlayer));
  // auscht auf das disconnect-Event und ruft die handlePlayerDisconnect-Funktion auf.
  socket.on('disconnect', () => handlePlayerDisconnect(playerId));
  // : Lauscht auf das playerMovement-Event und ruft die handlePlayerMovement-Funktion auf.
  socket.on('playerMovement', movementData => handlePlayerMovement(playerId, movementData));
  // auscht auf das starCollected-Event und ruft die handleStarCollected-Funktion auf.
  socket.on('starCollected', refId => handleStarCollected(playerId, refId));
});

// Event-handler Funktionen
/**
 * Diese Funktion wird aufgerufen, wenn ein Spieler beitritt. 
 * Sie überprüft, ob die maximale Spieleranzahl erreicht ist. 
 * Falls ja, wird der Spieler getrennt. 
 * Ansonsten wird der Spieler erstellt, zu den vorhandenen Spielern hinzugefügt
 * und alle anderen Spieler werden über den neuen Spieler informiert.
 */
const handlePlayerJoined = (socket, playerId, aPlayer) => {
  if (isMaxPlayersReached()) {
    socket.emit('gameFull');
    socket.disconnect();
    return;
  }

  console.log(`a new player connected: [id: ${playerId}, name: ${aPlayer.name}]`);
  players[playerId] = makePlayer(playerId, aPlayer.name);
  io.emit('newPlayer', players[playerId]);
  socket.emit('currentPlayers', players);
  io.emit('leaderScore', scoreboard);
  socket.emit('starLocation', stars);
};

// Spieler trennen
/**
 * Diese Funktion wird aufgerufen, wenn ein Spieler die Verbindung trennt
 * Sie entfernt den Spieler aus dem players- und scoreboard-Objekt
 * und informiert alle anderen Spieler.
 */
const handlePlayerDisconnect = playerId => {
  const player = players[playerId];
  if (!player) return;

  delete players[playerId];
  delete scoreboard[playerId];
  io.emit('disconnected', playerId);
  console.log(`player has disconnected: [id: ${player.id}, name: ${player.name}]`);
};

// Spielerbewegung
// Diese Funktion wird aufgerufen, wenn ein Spieler sich bewegt.
// Sie aktualisiert die Position des Spielers
// und informiert alle anderen Spieler über die neue Position.
const handlePlayerMovement = (playerId, movementData) => {
  const player = players[playerId];
  if (!player) return;

  player.x = movementData.x;
  player.y = movementData.y;
  io.emit('playerMoved', player);
};

// 
const handleStarCollected = (playerId, refId) => {
  if (stars[refId].display) {
    stars[refId].display = false;
    io.emit('removeStar', refId);
    starsAvailable--;
  }
  // Aktualisiert das Scoreboard, indem dem Spielerpunktestand ein Punkt hinzugefügt wird. 
  // Falls der Spieler noch keine Punkte hat, wird er mit 0 initialisiert und dann um 1 erhöht.
  scoreboard[playerId] = (scoreboard[playerId] || 0) + 1;
  // Sendet das aktualisierte Scoreboard an alle Spieler.
  io.emit('scoreboard', scoreboard);

  // Überprüft, ob der Spieler die zum Gewinnen erforderliche Punktzahl erreicht hat.
  // Falls ja, wird ein gameOver-Event an alle Spieler gesendet, das den Gewinner bekannt gibt, und das Scoreboard wird zurückgesetzt.
  if (scoreboard[playerId] >= scoreToWin) {
    io.emit('gameOver', { id: playerId, name: players[playerId].name, score: scoreboard[playerId] });
    scoreboard = {};
  }
  //  Überprüft, ob keine Sterne mehr verfügbar sind. Falls ja, werden die Sterne nachgefüllt.
  if (starsAvailable === 0) {
    replenishStars();
  }
};

// Diese Funktion setzt das display-Flag aller Sterne zurück, sodass sie wieder angezeigt werden. 
// Nach einer festgelegten Verzögerung (timeoutBeforeStarReplenishMs) wird ein replenishStars-Event an alle Spieler gesendet, um die Sterne im Spiel nachzufüllen.
const replenishStars = () => {
  stars.forEach(star => (star.display = true));
  starsAvailable = stars.length;
  setTimeout(() => io.emit('replenishStars'), timeoutBeforeStarReplenishMs);
};

//  Legt den Port fest, auf dem der Server lauschen soll. 
// Wenn die Umgebungsvariable PORT gesetzt ist, wird dieser Wert verwendet. Andernfalls wird Port 3000 verwendet.
const port = process.env.PORT || 3000;
// Startet den HTTP-Server und gibt die IP-Adresse und den Port des Servers in der Konsole aus
httpServer.listen(port, () => {
  console.log(`Server running at http://${ip.address()}:${port}/`);
});
