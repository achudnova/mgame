const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const ip = require('ip');
const Star = require('./src/star');
const { generateColor } = require('./src/color');
const { getRandomIn } = require('./src/random');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// alle Spieler speichern
let players = {};
let scoreboard = {};

const stars = [
  new Star(1, 24, 176, true),
  new Star(2, 73, 38, true),
  new Star(3, 185, 73, true),
  new Star(4, 301, 103, true),
  new Star(5, 375, 41, true),
  new Star(6, 419, 208, true),
  new Star(7, 603, 63, true),
  new Star(8, 721, 142, true),
  new Star(9, 37, 349, true),
  new Star(10, 148, 452, true),
  new Star(11, 277, 377, true),
  new Star(12, 359, 484, true),
  new Star(13, 484, 447, true),
  new Star(14, 601, 496, true),
  new Star(15, 738, 465, true),
  new Star(16, 564, 327, true),
  new Star(17, 722, 286, true),
];

let starsAvailable = stars.length;

const maxPlayers = 4;
const boardWidth = 800;
const boardHeight = 600;
const timeoutBeforeStarReplenishMs = 2000;
const scoreToWin = 50;

const isMaxPlayersReached = () => {
  return Object.keys(players).length >= maxPlayers;
};

const makePlayer = (id, name) => {
  const posX = getRandomIn(0, boardWidth);
  const posY = getRandomIn(0, boardHeight - 100);
  const color = generateColor();
  return {
    x: posX,
    y: posY,
    id: id,
    color: color,
    name: name,
  };
};

// Sockets Logik
io.on('connection', socket => {
  const playerId = socket.id;

  // Receive player name and store it
  socket.on('playerJoined', aPlayer => {
    if (isMaxPlayersReached()) {
      socket.emit('gameFull');
      socket.disconnect();
      return;
    }

    console.log(`a new player connected: [id: ${playerId}, name: ${aPlayer.name}]`);

    // neuen Spieler erstellen und zum player-Objekt hinzufügen
    players[playerId] = makePlayer(playerId, aPlayer.name);

    // update all other players of the new player
    io.emit('newPlayer', players[playerId]);

    // dem neuen spieler den aktuellen Spieler senden
    socket.emit('currentPlayers', players);

    // Send leaderboard
    io.emit('leaderScore', scoreboard);

    // dem neuen spieler Sterne senden
    socket.emit('starLocation', stars);
  });

  // Spieler abmelden
  socket.on('disconnect', () => {
    const player = players[playerId];
    if (!player) {
      return;
    }

    // Spieler aus dem players-Objekt entfernen
    delete players[playerId];
    delete scoreboard[playerId];

    // andere Spieler darüber informieren
    io.emit('disconnected', playerId);
    console.log(`player has disconnected: [id: ${player.id}, name: ${player.name}]`);
  });

  // Spielerbewegung, update the player data
  socket.on('playerMovement', movementData => {
    let player = players[playerId];
    if (!player) {
      return;
    }

    player.x = movementData.x;
    player.y = movementData.y;

    // emit a message to all players about the player that moved
    io.emit('playerMoved', player);
  });

  // Stern gesammelt
  socket.on('starCollected', (refId, score) => {
    if (stars[refId].display) {
      stars[refId].display = false;
      io.emit('removeStar', refId);
      starsAvailable--;
    }

    scoreboard[playerId] = score;
    io.emit('scoreboard', scoreboard);

    if (score >= scoreToWin) {
      io.emit('gameOver', { id: playerId, name: players[playerId].name });
      scoreboard = {};
    }

    if (starsAvailable == 0) {
      stars.forEach(it => {
        it.display = true;
      });
      starsAvailable = stars.length;

      setTimeout(() => {
        io.emit('replenishStars');
      }, timeoutBeforeStarReplenishMs);
    }
  });
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server IP: ${ip.address()}`);
  console.log(`Server Port: ${port}`);
  console.log(`Server running at http://${ip.address()}:${port}/`);
});
