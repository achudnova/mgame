class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // Bilder / spritesheets laden
  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('figur1_white', 'assets/figur1_white.png');
  }

  create() {
    // Verbindung mit dem Server herstellen (Verbindungsaufbau)
    this.socket = io();
    this.add.image(400, 300, 'sky');

    // Statische Plattformen erstellen
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    this.platforms.create(200, 400, 'ground');
    this.platforms.create(800, 450, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(750, 220, 'ground');

    /**
     * Eine leere Gruppe initialisieren (group() in Phaser ist eine Sammlung von Spielobjekten, die zusammen verwaltet werden können)
     * Kollisionen zwischen den anderen Spielern und den Plattformen hinzufügen
     * Other player
     */
    this.otherPlayers = this.physics.add.group();
    this.physics.add.collider(this.otherPlayers, this.platforms);

    // Create physics group to hold the stars
    this.players = {};
    this.stars = this.physics.add.group();

    this.physics.add.collider(this.stars, this.platforms);

    //  Initialize Score boards
    this.scoreText = this.add.text(16, 25, 'Points: 0', {
      fontSize: '20px',
      fill: '#000',
      fill: '#ffffff',
    });

    this.leaderScore = this.add.text(16, 50, 'Leader: 0', {
      fontSize: '20px',
      fill: '#000',
      fill: '#ffffff',
    });

    // Navigationstasten für die Spielerbewegung erstellen
    this.cursors = this.input.keyboard.createCursorKeys();

    this.socket.on('connect', () => {
      console.log({ fn: 'on_connect', socketId: this.socket.id });

      // Send player name to the server
      const playerName = this.registry.get('playerName');
      console.log({ fn: 'create', create: { id: 'N/A before connect', name: playerName } });
      this.socket.emit('playerJoined', { name: playerName, id: this.socket.id });
    });

    // Draw all players upon first joining
    this.socket.on('currentPlayers', currentPlayers => {
      this.players = currentPlayers;

      // Remove any players that have disconnected
      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if(!(otherPlayer.playerId in Object.keys(currentPlayers))) {
          otherPlayer.playerNameText.destroy();
          otherPlayer.destroy();
        }
      });

      Object.keys(currentPlayers).forEach(pId => {
        if (currentPlayers[pId].id === this.socket.id) {
          this.addPlayer(currentPlayers[pId]);
        } else {
          this.addOtherPlayers(currentPlayers[pId]);
        }
      });
    });

    // Draw new players that join (neue Spieler hinzufügen)
    this.socket.on('newPlayer', aPlayer => {
      console.log({ fn: 'on_newPlayer', aPlayer, socketId: this.socket.id });
      if (aPlayer.id === this.socket.id) {
        return;
      } else {
        this.addOtherPlayers(aPlayer);
      }
    });

    // Remove any players who disconnect
    this.socket.on('disconnected', playerId => {
      console.log({ fn: 'on_disconnected', disconnected: playerId });
      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.playerNameText.destroy();
          otherPlayer.destroy();
        }
      });
    });

    // Draw player movements
    this.socket.on('playerMoved', aPlayer => {
      // console.log({fn: 'on_playerMoved', playerMoved: aPlayer});
      this.otherPlayers.getChildren().forEach(pSprite => {
        if (aPlayer.id === pSprite.playerId) {
          pSprite.setPosition(aPlayer.x, aPlayer.y);
          pSprite.playerNameText.setPosition(aPlayer.x, aPlayer.y - 20);
        }
      });
    });

    // Sterne beim ersten Verbinden zeichnen
    this.socket.on('starLocation', starLocations => {
      console.log({starLocations: starLocations});

      for (let i = 0; i < starLocations.length; i++) {
        const star = this.physics.add.sprite(starLocations[i].x, starLocations[i].y, 'star');

        star.setGravityY(0);
        star.refID = i;

        if (!starLocations[i].display) {
          // If star should be hidden, then hide it
          star.disableBody(true, true);
        }

        this.stars.add(star);
      }

      this.physics.add.collider(this.stars, this.platforms);

      this.physics.add.overlap(
        this.player,
        this.stars,
        (player, star) => {
          star.disableBody(true, true);
          this.socket.emit('starCollected', star.refID);
        },
        null,
        this
      );
    });

    // Sterne entfernen, die von anderen Spielern gesammelt wurden
    this.socket.on('removeStar', refId => {
      this.stars.children.iterate(child => {
        if (child.refID == refId) child.disableBody(true, true);
      });
    });

    // Replenish stars when the server tells us
    this.socket.on('replenishStars', () => {
      this.stars.children.iterate(child => {
        child.enableBody(true, child.x, child.y, true, true);
      });
    });

    // Update the leader score
    this.socket.on('scoreboard', scoreboard => {
      console.log({scoreboard});
      const maxScore = Math.max(...Object.values(scoreboard));
      const selfScore = scoreboard[this.socket.id] || 0;

      this.leaderScore.setText('Leader: ' + maxScore);
      this.scoreText.setText('Points: ' + selfScore);
    });

    this.socket.on('gameFull', () => {
      const message = 'Das Spiel ist voll. Bitte versuche es später erneut.';
      // Zeige eine Benachrichtigung an den Spieler, dass das Spiel voll ist
      alert(message); // Oder verwende ein anderes Mittel zur Anzeige der Nachricht, wie z.B. eine Modale oder eine Benachrichtigungsleiste

      // zum Menü zurückzukehren
      const backButton = this.add
        .text(400, 500, 'Zurück zum Menü', {
          fontFamily: 'Arial',
          fontSize: '24px',
          fill: '#fff',
        })
        .setOrigin(0.5);

      backButton.setInteractive();
      backButton.on('pointerdown', () => {
        // Gehe zurück zum Menü
        this.scene.start('MenuScene');
      });
    });

    this.socket.on('gameOver', aPlayer => {
      if (aPlayer.id === this.socket.id) {
        alert('Du hast gewonnen!');
      } else {
        alert(`Du hast verloren! (${aPlayer.name} hast gewonnen!)`);
      }

      this.leaderScore.setText('Leader: ' + 0);
      this.scoreText.setText('Points: ' + 0);
    });
  }

  update() {
    const player = this.player;
    if (player) {
      const cursors = this.cursors;

      if (cursors.left.isDown) {
        player.setVelocityX(-180);
      } else if (cursors.right.isDown) {
        player.setVelocityX(180);
      } else {
        player.setVelocityX(0);
      }

      if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
      }

      // Server über die Bewegung informieren
      var x = player.x;
      var y = player.y;
      if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y)) {
        this.socket.emit('playerMovement', {
          x: player.x,
          y: player.y,
        });
        // Update the player's name position
        player.playerNameText.setPosition(player.x, player.y - 20);
      }

      // Alte Positionen speichern
      player.oldPosition = {
        x: player.x,
        y: player.y,
      };
    }

    this.otherPlayers.getChildren().forEach(pSprite => {
      pSprite.playerNameText.setPosition(pSprite.x, pSprite.y - 20);
    });
  }

  // Spielerobjekt hinzufügen
  addPlayer(aPlayer) {
    console.log({ fn: 'addPlayer', addPlayer: aPlayer });

    if(this.player) {
      this.player.playerNameText.destroy();
      this.player.destroy();
    }
    this.player = this.physics.add.sprite(aPlayer.x, aPlayer.y, 'figur1_white');

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    // this.player.body.setGravityY(300);

    this.player.setTint(aPlayer.color);

    // Display player name
    this.player.playerNameText = this.add.text(aPlayer.x, aPlayer.y - 20, aPlayer.name, {
      fontSize: '16px',
      fill: '#ffffff',
    });
    this.physics.add.collider(this.player, this.platforms);
  }

  // Add any additional players
  addOtherPlayers(aPlayer) {
    console.log({ fn: 'addOtherPlayers', addOtherPlayers: aPlayer });

    const otherPlayer = this.add.sprite(aPlayer.x, aPlayer.y, 'figur1_white');

    // Set a tint so we can distinguish ourselves
    otherPlayer.setTint(aPlayer.color);

    otherPlayer.playerId = aPlayer.id;
    otherPlayer.playerNameText = this.add.text(aPlayer.x, aPlayer.y - 20, aPlayer.name, {
      fontSize: '16px',
      fill: '#ffffff',
    });
    this.otherPlayers.add(otherPlayer);
  }
}

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 350 },
      debug: false,
    },
  },
  scene: [
    MenuScene,
    //LobbyScene,
    GameScene,
  ],
};

var game = new Phaser.Game(config);
