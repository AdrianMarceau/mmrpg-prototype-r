// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: BootScene.js (scene)
// Boot scene for the game. This scene is responsible for loading
// the global game assets and then immediately starting the
// Preloader scene.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class BootScene extends Phaser.Scene
{
    constructor ()
    {
        console.log('BootScene.constructor() called');
        super('Boot');

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;

        // Initialize this scene with a first-load callback function
        MMRPG.init('BootScene', 'Boot', function(){

            /* ... */

            });

    }

    preload ()
    {
        //console.log('BootScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;

        // Load global game assets
        this.load.image('canvas', 'assets/MMRPG-canvas_fullsize.png');

        // Load the splash screen game assets
        this.load.image('splash', 'assets/MMRPG-splash_static-fullsize.png');
        this.load.image('start', 'assets/MMRPG-splash_start-text.png');

        // Load the bitmap font we'll be using
        // Charset:  _.,!?:;@`'"#$%&()[]{}*+-~\|/<=>0123456789^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
        this.load.bitmapFont('megafont-white', 'assets/fonts/mega-man-10-font_white.png', 'assets/fonts/mega-man-10-font_white.xml.fnt');
        this.load.bitmapFont('megafont-black', 'assets/fonts/mega-man-10-font_black.png', 'assets/fonts/mega-man-10-font_black.xml.fnt');

    }

    create ()
    {

        //console.log('BootScene.create() called');

        // Create the base canvas for which the rest of the game will be drawn
        var canvas = this.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);

        // Add a splash screen with the logo and the game's title
        //var splash = this.add.image(0, 0, 'splash');
        //splash.setOrigin(0, 0);

        var x = MMRPG.canvas.centerX, y = MMRPG.canvas.centerY;
        var loadText = this.add.bitmapText(x, y, 'megafont-white', 'Booting...', 16);
        loadText.setOrigin(0.5);
        loadText.setLetterSpacing(20);

        // Immediately start the preloader scene
        this.scene.start('Preloader');

    }

}