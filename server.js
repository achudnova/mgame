const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const ip = require('ip');
const Star = require('./src/star');
const { generateColor } = require('./src/color');
const { getRandomIn } = require('./src/random');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const players = {};
let scoreboard = {};
const stars = initializeStars();
let starsAvailable = stars.length;

const maxPlayers = 4;
const boardWidth = 800;
const boardHeight = 600;
const timeoutBeforeStarReplenishMs = 2000;
const scoreToWin = 50;

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

const isMaxPlayersReached = () => Object.keys(players).length >= maxPlayers;

const makePlayer = (id, name) => ({
  x: getRandomIn(0, boardWidth),
  y: getRandomIn(0, boardHeight - 100),
  id: id,
  color: generateColor(),
  name: name,
});

io.on('connection', socket => {
  const playerId = socket.id;
  socket.on('playerJoined', aPlayer => handlePlayerJoined(socket, playerId, aPlayer));
  socket.on('disconnect', () => handlePlayerDisconnect(playerId));
  socket.on('playerMovement', movementData => handlePlayerMovement(playerId, movementData));
  socket.on('starCollected', refId => handleStarCollected(playerId, refId));
});


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

const handlePlayerDisconnect = playerId => {
  const player = players[playerId];
  if (!player) return;

  delete players[playerId];
  delete scoreboard[playerId];
  io.emit('disconnected', playerId);
  console.log(`player has disconnected: [id: ${player.id}, name: ${player.name}]`);
};

const handlePlayerMovement = (playerId, movementData) => {
  const player = players[playerId];
  if (!player) return;

  player.x = movementData.x;
  player.y = movementData.y;
  io.emit('playerMoved', player);
};

const handleStarCollected = (playerId, refId) => {
  if (stars[refId].display) {
    stars[refId].display = false;
    io.emit('removeStar', refId);
    starsAvailable--;
  }

  scoreboard[playerId] = (scoreboard[playerId] || 0) + 1;
  io.emit('scoreboard', scoreboard);

  if (scoreboard[playerId] >= scoreToWin) {
    io.emit('gameOver', { id: playerId, name: players[playerId].name, score: scoreboard[playerId] });
    scoreboard = {};
  }
  if (starsAvailable === 0) {
    replenishStars();
  }
};

const replenishStars = () => {
  stars.forEach(star => (star.display = true));
  starsAvailable = stars.length;
  setTimeout(() => io.emit('replenishStars'), timeoutBeforeStarReplenishMs);
};


const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server running at http://${ip.address()}:${port}/`);
});
