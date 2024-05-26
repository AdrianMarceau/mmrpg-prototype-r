// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: main.js
// Main entry point for the game. This file is responsible for
// setting up the game and creating the Phaser game instance.
// ------------------------------------------------------------ //

import MMRPG from './shared/MMRPG.js';

import ButtonsUtility from './shared/Utilities.Buttons.js';
import PopupsUtility from './shared/Utilities.Popups.js';

import BootScene from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import TitleScene from './scenes/TitleScene.js';
import MainScene from './scenes/MainScene.js';
import DebugScene from './scenes/DebugScene.js';

var config = {
    type: Phaser.AUTO,
    width: MMRPG.canvas.width,
    height: MMRPG.canvas.height,
    pixelArt: true,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 200 }
        }
    },
    scene: [ BootScene, PreloaderScene, TitleScene, MainScene, DebugScene ]
    };

let game = new Phaser.Game(config);