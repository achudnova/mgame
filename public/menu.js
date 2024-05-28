// Define the MenuScene class
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('titlescreen', 'assets/titlescreen.png');
    }

    create() {
        this.add.image(400, 300, 'titlescreen');

        const lobbyButton = this.add.text(400, 500, 'Lobby betreten', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        lobbyButton.setInteractive();

        lobbyButton.on('pointerdown', () => {
            this.scene.start('LobbyScene');
        });
        
        this.add.text(400, 100, 'Platformer Game', {
            fontFamily: 'Arial',
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        do{
            var player = prompt("Please enter your name");
        }while(player == null || player == "" );
        
        // var player = prompt("Please enter your name", "");
        localStorage.setItem("playerName", player)
        localStorage.getItem("playerName")
        //console.log(player)

        this.add.text(400, 320, player, {
            fontFamily: 'Arial',
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 270, "Your name: ", {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);


    }
}