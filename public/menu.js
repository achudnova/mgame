class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('titlescreen', 'assets/titlescreen.png');
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createStartButton();
    this.promptPlayerName();
    this.createInfoButton();
  }

  createBackground() {
    this.add.image(400, 300, 'titlescreen');
  }

  createTitle() {
    this.add.text(400, 100, 'Platformer Game', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fill: '#fff',
    }).setOrigin(0.5);
  }

  createStartButton() {
    const startBtn = this.add.text(400, 500, 'Start', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fill: '#fff',
    }).setOrigin(0.5);

    startBtn.setInteractive();
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }

  promptPlayerName() {
    let name = prompt('Please enter your name');
    while (!name) {
      name = prompt('Please enter your name');
    }
    name = name.substring(0, 10);
    this.registry.set('playerName', name);

    this.add.text(400, 270, 'Your name: ', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fill: '#fff',
    }).setOrigin(0.5);

    this.add.text(400, 320, name, {
      fontFamily: 'Arial',
      fontSize: '28px',
      fill: '#fff',
    }).setOrigin(0.5);
  }

  createInfoButton() {
    const infoButton = this.add.text(700, 500, '?', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fill: '#fff',
    }).setOrigin(0.5);

    infoButton.setInteractive();
    infoButton.on('pointerdown', () => {
      this.showGameRules();
    });
  }

  showGameRules() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 0.8);
    graphics.fillRect(100, 100, 600, 400);

    const rulesText = this.add.text(400, 300, 
      'Spielregeln:\n\n1. Bewege deinen Charakter mit den Pfeiltasten.\n2. Sammle Sterne um Punkte zu erhalten.\n3. Der Spieler mit den meisten Punkten gewinnt.', 
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        fill: '#fff',
        align: 'center',
      }
    ).setOrigin(0.5);

    const closeButton = this.add.text(400, 450, 'Schließen', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#fff',
    }).setOrigin(0.5);

    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      graphics.destroy();
      rulesText.destroy();
      closeButton.destroy();
    });
  }
}
