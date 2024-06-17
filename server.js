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

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// alle Spieler speichern
let players = {};
let highScore = 0;

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

let starCount = stars.length;

const maxPlayers = 4;
const boardWidth = 800;
const boardHeight = 600;
const timeoutBeforeStarReplenishMs = 2000;

const isMaxPlayersReached = () => {
  return Object.keys(players).length >= maxPlayers;
};

const makePlayer = (id, name) => {
  const posX = getRandomIn(0, boardWidth);
  const posY = getRandomIn(0, boardHeight);
  const color = generateColor();
  return {
    x: posX,
    y: posY,
    playerId: id,
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

    console.log({aPlayer});

    console.log(`a new player connected: [id: ${aPlayer.id}, name: ${aPlayer.name}]`);

    // neuen Spieler erstellen und zum player-Objekt hinzufügen
    players[playerId] = makePlayer(playerId, aPlayer.name);

    // update all other players of the new player
    io.emit('newPlayer', players[playerId]);

    // dem neuen spieler den aktuellen Spieler senden
    socket.emit('currentPlayers', players);

    // Send leaderboard
    io.emit('leaderScore', highScore);

    // dem neuen spieler Sterne senden
    socket.emit('starLocation', stars);
  });

  // Spieler abmelden
  socket.on('disconnect', function () {
    const player = players[playerId];
    // Spieler aus dem players-Objekt entfernen
    delete players[playerId];
    // andere Spieler darüber informieren
    io.emit('disconnected', playerId);
    console.log(`player has disconnected: [id: ${playerId}, name: ${player.name}]`);
  });

  // Spielerbewegung, update the player data
  socket.on('playerMovement', function (movementData) {
    players[playerId].x = movementData.x;
    players[playerId].y = movementData.y;
    // emit a message to all players about the player that moved
    io.emit('playerMoved', players[playerId]);
  });

  // Stern gesammelt
  socket.on('starCollected', function (id, score) {
    if (stars[id].display == true) {
      stars[id].display = false;
      io.emit('removeStar', id);
      starCount--;
    }

    if (score > highScore) {
      highScore = score;
      io.emit('leaderScore', highScore);
    }

    if (starCount == 0) {
      stars.forEach(it => {
        it.display = true;
      });
      starCount = stars.length;
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
