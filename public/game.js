class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.loadImages();
  }

  loadImages() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('figur1_white', 'assets/figur1_white.png');
  }

  create() {
    this.setupSocket();
    this.createBackground();
    this.createPlatforms();
    this.initializeGroups();
    this.createScoreboard();
    this.createInputControls();
    this.setupSocketEvents();
  }

  setupSocket() {
    this.socket = io();
  }

  createBackground() {
    this.add.image(400, 300, 'sky');
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    const platformPositions = [
      { x: 400, y: 568, scale: 2 },
      { x: 200, y: 400 },
      { x: 800, y: 450 },
      { x: 50, y: 250 },
      { x: 750, y: 220 },
    ];

    platformPositions.forEach(pos => {
      const platform = this.platforms.create(pos.x, pos.y, 'ground');
      if (pos.scale) platform.setScale(pos.scale).refreshBody();
    });
  }

  initializeGroups() {
    this.otherPlayers = this.physics.add.group();
    this.physics.add.collider(this.otherPlayers, this.platforms);
    this.players = {};
    this.stars = this.physics.add.group();
    this.physics.add.collider(this.stars, this.platforms);
  }

  createScoreboard() {
    this.scoreText = this.add.text(16, 25, 'Your Points: 0', {
      fontSize: '20px',
      fill: '#ffffff',
    });

    this.leaderScore = this.add.text(16, 50, 'Leader: 0', {
      fontSize: '20px',
      fill: '#ffffff',
    });
  }

  createInputControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  setupSocketEvents() {
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('currentPlayers', this.onCurrentPlayers.bind(this));
    this.socket.on('newPlayer', this.onNewPlayer.bind(this));
    this.socket.on('disconnected', this.onDisconnected.bind(this));
    this.socket.on('playerMoved', this.onPlayerMoved.bind(this));
    this.socket.on('starLocation', this.onStarLocation.bind(this));
    this.socket.on('removeStar', this.onRemoveStar.bind(this));
    this.socket.on('replenishStars', this.onReplenishStars.bind(this));
    this.socket.on('scoreboard', this.onScoreboard.bind(this));
    this.socket.on('gameFull', this.onGameFull.bind(this));
    this.socket.on('gameOver', this.onGameOver.bind(this));
  }

  onConnect() {
    //console.log({ fn: 'on_connect', socketId: this.socket.id });
    const playerName = this.registry.get('playerName');
    //console.log({ fn: 'create', create: { id: 'N/A before connect', name: playerName } });
    this.socket.emit('playerJoined', { name: playerName, id: this.socket.id });
  }

  onCurrentPlayers(currentPlayers) {
    this.players = currentPlayers;
    this.updateOtherPlayers();
  }

  onNewPlayer(aPlayer) {
    if (aPlayer.id === this.socket.id) return;
    this.players[aPlayer.id] = aPlayer;
    this.addOtherPlayers(aPlayer);
  }

  onDisconnected(playerId) {
    this.removePlayer(playerId);
  }

  onPlayerMoved(aPlayer) {
    this.updatePlayerPosition(aPlayer);
  }

  onStarLocation(starLocations) {
    this.createStars(starLocations);
  }

  onRemoveStar(refId) {
    this.removeStar(refId);
  }

  onReplenishStars() {
    this.replenishStars();
  }

  onScoreboard(scoreboard) {
    this.updateScoreboard(scoreboard);
  }

  onGameFull() {
    alert('Das Spiel ist voll. Bitte versuche es später erneut.');
    this.createBackButton();
  }

  onGameOver(aPlayer) {
    this.displayGameOverMessage(aPlayer);
  }

  update() {
    this.updatePlayerMovement();
    this.updateOtherPlayerNames();
  }

  addPlayer(aPlayer) {
    if (this.player) {
      this.player.playerNameText.destroy();
      this.player.destroy();
    }
    this.createPlayer(aPlayer);
  }

  addOtherPlayers(aPlayer) {
    const otherPlayer = this.add.sprite(aPlayer.x, aPlayer.y, 'figur1_white');
    otherPlayer.setTint(aPlayer.color);
    otherPlayer.playerId = aPlayer.id;
    otherPlayer.playerNameText = this.add.text(aPlayer.x, aPlayer.y - 20, aPlayer.name, {
      fontSize: '16px',
      fill: '#ffffff',
    });
    this.otherPlayers.add(otherPlayer);
  }

  createPlayer(aPlayer) {
    this.player = this.physics.add.sprite(aPlayer.x, aPlayer.y, 'figur1_white');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(aPlayer.color);
    this.player.playerNameText = this.add.text(aPlayer.x, aPlayer.y - 20, aPlayer.name, {
      fontSize: '16px',
      fill: '#ffffff',
    });
    this.physics.add.collider(this.player, this.platforms);
  }

  updateOtherPlayers() {
    this.otherPlayers.getChildren().forEach(otherPlayer => {
      if (!(otherPlayer.playerId in this.players)) {
        otherPlayer.playerNameText.destroy();
        otherPlayer.destroy();
      }
    });

    Object.keys(this.players).forEach(pId => {
      if (this.players[pId].id === this.socket.id) {
        this.addPlayer(this.players[pId]);
      } else {
        this.addOtherPlayers(this.players[pId]);
      }
    });
  }

  updatePlayerPosition(aPlayer) {
    this.otherPlayers.getChildren().forEach(pSprite => {
      if (aPlayer.id === pSprite.playerId) {
        pSprite.setPosition(aPlayer.x, aPlayer.y);
        pSprite.playerNameText.setPosition(aPlayer.x, aPlayer.y - 20);
      }
    });
  }

  updatePlayerMovement() {
    if (this.player) {
      const { left, right, up } = this.cursors;
      if (left.isDown) {
        this.player.setVelocityX(-180);
      } else if (right.isDown) {
        this.player.setVelocityX(180);
      } else {
        this.player.setVelocityX(0);
      }
      if (up.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-330);
      }
      this.emitPlayerMovement();
    }
  }

  emitPlayerMovement() {
    const { x, y } = this.player;
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
      this.socket.emit('playerMovement', { x, y });
      this.player.playerNameText.setPosition(x - 15, y - 35);
    }
    this.player.oldPosition = { x, y };
  }

  updateOtherPlayerNames() {
    this.otherPlayers.getChildren().forEach(pSprite => {
      pSprite.playerNameText.setPosition(pSprite.x - 15, pSprite.y - 35);
    });
  }

  createStars(starLocations) {
    starLocations.forEach((location, i) => {
      const star = this.physics.add.sprite(location.x, location.y, 'star');
      star.setGravityY(0);
      star.refID = i;
      if (!location.display) star.disableBody(true, true);
      this.stars.add(star);
    });

    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
  }

  collectStar(player, star) {
    star.disableBody(true, true);
    this.socket.emit('starCollected', star.refID);
  }

  removeStar(refId) {
    this.stars.children.iterate(child => {
      if (child.refID == refId) child.disableBody(true, true);
    });
  }

  replenishStars() {
    this.stars.children.iterate(child => {
      child.enableBody(true, child.x, child.y, true, true);
    });
  }

  updateScoreboard(scoreboard) {
    const maxScore = Math.max(...Object.values(scoreboard));
    const maxId = Object.keys(scoreboard).find(pId => scoreboard[pId] === maxScore);
    const maxName = maxId in this.players ? this.players[maxId].name : '';
    const selfScore = scoreboard[this.socket.id] || 0;

    this.leaderScore.setText(`Leader ${maxName}: ${maxScore}`);
    this.scoreText.setText(`Your Points: ${selfScore}`);
  }

  createBackButton() {
    const backButton = this.add.text(400, 500, 'Zurück zum Menü', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#fff',
    }).setOrigin(0.5);
    backButton.setInteractive();
    backButton.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  displayGameOverMessage(aPlayer) {
    if (aPlayer.id === this.socket.id) {
      alert('Du hast gewonnen!');
    } else {
      alert(`Du hast verloren! (${aPlayer.name} hat gewonnen!)`);
    }
    this.leaderScore.setText('Leader: 0');
    this.scoreText.setText('Your Points: 0');
  }

  removePlayer(playerId) {
    this.otherPlayers.getChildren().forEach(otherPlayer => {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.playerNameText.destroy();
        otherPlayer.destroy();
      }
    });
  }
}

const config = {
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
  scene: [MenuScene, GameScene],
};

const game = new Phaser.Game(config);