// Define the MenuScene class
class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        this.load.image('lobby_screen', 'assets/lobby_screen.png');
        this.load.image('figur1', 'assets/figur1.png');
    }

    create() {
        this.add.image(400, 300, 'lobby_screen');
        this.player = this.physics.add.sprite(100, 450, 'figur1');
        this.player.setCollideWorldBounds(true);
    
        const startButton = this.add.text(400, 500, 'Start', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        startButton.setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.player.setBounce(0.2);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        const cursors = this.cursors;
        const player = this.player;

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
    }
}