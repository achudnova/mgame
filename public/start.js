//window.socket = io();

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
        MenuScene, 
        LobbyScene, 
        GameScene
    ]
};

var game = new Phaser.Game(config);