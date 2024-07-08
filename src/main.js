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

import PauseOverlay from './scenes/PauseOverlay.js';

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
        PauseOverlay,
        ],
    audio: {
        disableWebAudio: false
        },
    };

let game = new Phaser.Game(config);