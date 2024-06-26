// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: main.js
// Main entry point for the game. This file is responsible for
// setting up the game and creating the Phaser game instance.
// ------------------------------------------------------------ //

import MMRPG from './shared/MMRPG.js';

import BootScene from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import TitleScene from './scenes/TitleScene.js';
import MainScene from './scenes/MainScene.js';

import DebugScene from './scenes/DebugScene.js';
import DebugRunnerScene from './scenes/debug/DebugRunnerScene.js';

var config = {
    type: Phaser.AUTO,
    width: MMRPG.canvas.width,
    height: MMRPG.canvas.height,
    pixelArt: true,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 200 }
            }
        },
    scene: [
        BootScene,
        PreloaderScene,
        TitleScene,
        MainScene,
        DebugScene,
        DebugRunnerScene,
        ],
    audio: {
        disableWebAudio: false
        },
    };

// make it so clicking the game container triggers an alert
let gameIsReady = false;
let gameIsRunning = false;
let gameIsClickable = false;
let gameResumeCallback = null;
window.toggleGameIsReady = () => { gameIsReady = !gameIsReady; window.refreshGameContainer(); };
window.toggleGameIsRunning = () => { gameIsRunning = !gameIsRunning; window.refreshGameContainer();  };
window.toggleGameIsClickable = () => { gameIsClickable = !gameIsClickable; };
window.setGameResumeCallback = (callback) => { gameResumeCallback = callback; };
window.refreshGameContainer = () => {
    const gameContainer = document.getElementById('game-container');
    if (gameIsReady){ gameContainer.classList.add('ready'); }
    else { gameContainer.classList.remove('ready'); }
    if (gameIsRunning){ gameContainer.classList.add('running'); gameContainer.classList.remove('paused'); }
    else { gameContainer.classList.add('paused'); gameContainer.classList.remove('running'); }
    };
window.refreshGameContainer();
document.getElementById('game-container').addEventListener('click', () => {
    if (!gameIsClickable){ return false; }
    //console.log('The game container was clicked! w/ gameIsReady:', gameIsReady, 'gameIsRunning:', gameIsRunning);
    if (!gameIsReady){ return false; }
    if (gameIsRunning){ return false; }
    window.toggleGameIsRunning(true);
    if (gameResumeCallback
        && typeof gameResumeCallback === 'function'){
        gameResumeCallback();
        }
    return true;
});

let game = new Phaser.Game(config);