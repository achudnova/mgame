// Define the MenuScene class
class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        this.load.image('lobby_screen', 'assets/lobby_screen.png');
        this.load.spritesheet('figur', 'assets/figur.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.add.image(400, 300, 'lobby_screen');
        this.player = this.physics.add.sprite(100, 450, 'figur');
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('figur', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'turn',
            frames: [{ key: 'figur', frame: 4 }],
            frameRate: 20
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('figur', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    
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
            player.anims.play('left', true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(180);
            player.anims.play('right', true);
        } else {
            player.setVelocityX(0);
            player.anims.play('turn');
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-330);
        }
    }


}