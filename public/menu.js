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

        const infoButton = this.add.text(700, 500, '?', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        infoButton.setInteractive();

        infoButton.on('pointerdown', () => {
            this.showGameRules();
        });

    }

    // Methode um die Spielregeln anzuzeigen
    showGameRules() {
        // Hintergrund für die Spielregeln
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillRect(100, 100, 600, 400);

        // Spielregeln Text
        const rulesText = this.add.text(400, 300, 'Spielregeln:\n\n1. Bewege deinen Charakter mit den Pfeiltasten.\n2. Sammle Sterne um Punkte zu erhalten.\n3. Der Spieler mit den meisten Punkten gewinnt.', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: '#fff',
            align: 'center',
            //wordWrap: { width: 580 }
        }).setOrigin(0.5);

        // Button zum Schließen der Spielregeln
        const closeButton = this.add.text(400, 450, 'Schließen', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            // Entferne die Grafik und den Text
            graphics.destroy();
            rulesText.destroy();
            closeButton.destroy();
        });
    }
}