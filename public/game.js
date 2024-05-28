// Define the GameScene class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('figur', 'assets/figur.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.socket = io();
        this.score = 0;

        this.add.image(400, 300, 'sky');
    
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(200, 400, 'ground');
        this.platforms.create(800, 450, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');
    
        // Other players
        this.otherPlayers = this.physics.add.group();
        this.physics.add.collider(this.otherPlayers, this.platforms);

        // Create physics group to hold the stars
        this.stars = this.physics.add.group();

        this.physics.add.collider(this.stars, this.platforms);
    
        //  Initialize Score boards
        this.scoreText = this.add.text(16, 545, 'Points: 0', {
            fontSize: '20px',
            fill: '#000',
            fill: "#ffffff",
        });

        this.leaderScore = this.add.text(16, 570, 'Leader: 0', {
            fontSize: '20px',
            fill: '#000',
            fill: "#ffffff",
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        // Draw all players upon first joining
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (players[id].playerId === this.socket.id) {
                    this.addPlayer(players[id]);
                } else {
                    this.addOtherPlayers(players[id]);
                }
            });
        });

        // Draw new players that join
        this.socket.on('newPlayer', (playerInfo) => {
            this.addOtherPlayers(playerInfo);
        });

        // Remove any players who disconnect
        this.socket.on('disconnect', (playerId) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });
        
        // Draw player movements
        this.socket.on('playerMoved', (playerInfo) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                }
            });
        });

        // Draw the stars on initial connect
        this.socket.on('starLocation', (starLocations) => {
            for (var i = 0; i < starLocations.length; i++) {
                var star = this.physics.add.sprite(starLocations[i].x, starLocations[i].y, 'star');

                star.setGravityY(0);
                star.refID = i;

                if (starLocations[i].display != true) {
                    // If star should be hidden, then hide it
                    star.disableBody(true, true);
                }
                this.stars.add(star);
            }

            this.physics.add.collider(this.stars, this.platforms);

            this.physics.add.overlap(this.player, this.stars, (player, star) => {
                console.log(star.refID);
                this.score += 10;
                star.disableBody(true, true);
                this.socket.emit('starCollected', star.refID, this.score);

                this.scoreText.setText('Points: ' + this.score);
            }, null, this);
        });
        
        // Remove stars collecetd by other users
        this.socket.on('removeStar', (id) => {
            this.stars.children.iterate((child) => {
                if (child.refID == id)
                    child.disableBody(true, true);
            });
        });
        
        // Replenish stars when the server tells us
        this.socket.on('replenishStars', () => {
            this.stars.children.iterate((child) => {
                child.enableBody(true, child.x, child.y, true, true);
    
            });
        });
        
        // Update the leader score
        this.socket.on('leaderScore', (highscore) => {
            this.leaderScore.setText('Leader: ' + highscore);
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

            // Tell the server about your movement
            var x = player.x;
            var y = player.y;
            if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y)) {
                this.socket.emit('playerMovement', {
                    x: player.x,
                    y: player.y,
                });
            }

            // Save old position
            player.oldPosition = {
                x: player.x,
                y: player.y,
            };
        }
    }

    // Add the player object
    addPlayer(playerInfo) {
        this.player = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'figur');

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        // this.player.body.setGravityY(300);

        this.physics.add.collider(this.player, this.platforms);
    }

    // Add any additional players
    addOtherPlayers(playerInfo) {
        var otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'figur');

        // Set a tint so we can distinguish ourselves
        otherPlayer.setTint(0x7CC78F);

        otherPlayer.playerId = playerInfo.playerId;
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
            debug: false
        }
    },
    scene: [
        // MenuScene, 
        // LobbyScene, 
        GameScene
    ]
};

var game = new Phaser.Game(config);