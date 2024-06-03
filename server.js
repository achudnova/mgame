// Server stuff goes here - Verbindung zw. Client und Server herstellen
// Express-Framework laden
var express = require('express');
var app = express(); // wird verwendet, um verschiedene HTTP-Anfragen zu definieren und auf diese zu reagieren
// http-Server erstellen, um Socket.io zu integrieren
var server = require('http').Server(app);

// statische Dateien: html, css, js werden aus dem public Verzeichnis geladen
app.use(express.static(__dirname + '/public'));

// der Server schickt dem Client die html Datei als Antwort auf GET-Anfrage
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// alle Spieler speichern
var players = {};
var highScore = 0;

var stars = []

class Star {
    constructor(id, x, y, display) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.display = display;
    }
}

stars.push(new Star(1, 24, 176, true));
stars.push(new Star(2, 73, 38, true));
stars.push(new Star(3, 185, 73, true));
stars.push(new Star(4, 301, 103, true));
stars.push(new Star(5, 375, 41, true));
stars.push(new Star(6, 419, 208, true));
stars.push(new Star(7, 603, 63, true));
stars.push(new Star(8, 721, 142, true));
stars.push(new Star(9, 37, 349, true));
stars.push(new Star(10, 148, 452, true));
stars.push(new Star(11, 277, 377, true));
stars.push(new Star(12, 359, 484, true));
stars.push(new Star(13, 484, 447, true));
stars.push(new Star(14, 601, 496, true));
stars.push(new Star(15, 738, 465, true));
stars.push(new Star(16, 564, 327, true));
stars.push(new Star(17, 722, 286, true));

var starCount = stars.length;

// Socket.io-Setup
var io = require('socket.io')(server, {
    wsEngine: 'ws'
});

// Farben definieren
const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00]; // rot, blau, gelb, grün
let availableColors = [...colors];

function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors.splice(randomIndex, 1)[0];
}

// Sockets Logik
io.on('connection', function (socket) {
    if (Object.keys(players).length >= 4) {
        // Schließe die Verbindung des Spielers
        socket.disconnect(); // Disconnect the player if there are already 4 players
        return;
    }
    
    console.log('a user connected');

    // Farbe für den neuen Spieler auswählen
    const color = getRandomColor(); // Get a random color from the array

    // neuen Spieler erstellen und zum player-Objekt hinzufügen
    players[socket.id] = {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 300) + 50,
        playerId: socket.id,
        color: color,
    };

    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // dem neuen spieler den aktuellen Spieler senden
    socket.emit('currentPlayers', players);

    // Send leaderboard
    io.emit('leaderScore', highScore);

    // dem neuen spieler Sterne senden
    socket.emit('starLocation', stars);

    // Spieler abmelden
    socket.on('disconnect', function () {
        console.log('user disconnected');
        availableColors.push(players[socket.id].color); // Add the player's color back to the array
        // Spieler aus dem players-Objekt entfernen
        delete players[socket.id];
        // andere Spieler darüber informieren
        io.emit('disconnect', socket.id);

    });

    // Spielerbewegung, update the player data
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    // Stern gesammelt
    socket.on('starCollected', function (id, score) {

        if (stars[id].display == true) {
            stars[id].display = false;
            io.emit('removeStar', id);
            starCount--;
        }

        if(score > highScore)
        {
            highScore = score;
            io.emit('leaderScore', highScore);
        }

        if(starCount == 0)
        {
            stars.forEach(element => {
                element.display=true;
            });
            starCount = stars.length;
            setTimeout(() => {
                io.emit('replenishStars');
            }, 2000);            
        }
    });
});

var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log(`Listening on ${server.address().port}`);
});