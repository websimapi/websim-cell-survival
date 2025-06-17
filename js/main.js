// Main game initialization
import { Game } from './game.js';
import { InputHandler } from './input.js';
import { UI } from './ui.js';
import { AudioManager } from './audio.js';

let game;
let ui;
let inputHandler;
let audioManager;
const room = new WebsimSocket();

async function initGame() {
    await room.initialize();
    
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize game components
    ui = new UI();
    inputHandler = new InputHandler(canvas);
    audioManager = new AudioManager();
    
    game = new Game(canvas, ctx, room, inputHandler, ui, audioManager);
    
    // Set up input callbacks
    inputHandler.setSpacePressCallback(() => {
        if (game.playerCell && game.playerCell.active) {
            game.playerCell.split();
            audioManager.play('cellSplit');
            game.updatePresence();
        }
    });
    
    inputHandler.setWPressCallback(() => {
        if (game.playerCell && game.playerCell.active && game.playerCell.size > 35) {
            const ejectedMass = game.playerCell.ejectMass();
            if (ejectedMass) {
                game.updatePresence();
                // You could also send an event to notify other players about ejected mass
            }
        }
    });
    
    game.start();
    
    // Handle start game button
    document.getElementById('start-game').addEventListener('click', () => {
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        document.getElementById('start-screen').classList.add('hidden');
        game.joinGame(playerName);
    });
    
    // Handle play again button
    document.getElementById('play-again').addEventListener('click', () => {
        document.getElementById('game-over').classList.add('hidden');
        game.reset();
        game.joinGame();
    });
}

// Start the game when the page loads
window.addEventListener('load', initGame);