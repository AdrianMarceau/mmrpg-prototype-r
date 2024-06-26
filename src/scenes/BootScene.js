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
        //console.log('BootScene.constructor() called');
        super('Boot');

        // Update the ready and running flags externally
        if (typeof window.toggleGameIsReady){ window.toggleGameIsReady(true); }
        if (typeof window.toggleGameIsRunning){ window.toggleGameIsRunning(true); }
        if (typeof window.toggleGameIsClickable){ window.toggleGameIsClickable(true); }

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

        // Collect the source path to make sure we pull the right files
        let assetsPath = MMRPG.paths.assets;

        // Load global game assets
        this.load.image('canvas', assetsPath + 'mmrpg-canvas_fullsize.png');

        // Load the splash screen game assets
        this.load.image('splash', assetsPath + 'mmrpg-splash_static-fullsize.png');
        this.load.image('start', assetsPath + 'mmrpg-splash_start-text.png');

        // Load the bitmap font we'll be using
        // Charset:  _.,!?:;@`'"#$%&()[]{}*+-~\|/<=>0123456789^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
        this.load.bitmapFont('megafont-white', assetsPath + 'fonts/mega-man-10-font_white.png', assetsPath + 'fonts/mega-man-10-font_white.xml.fnt');
        this.load.bitmapFont('megafont-black', assetsPath + 'assets/fonts/mega-man-10-font_black.png', assetsPath + 'fonts/mega-man-10-font_black.xml.fnt');

    }

    create ()
    {

        //console.log('BootScene.create() called');

        // Manually create the base canvas for which the rest of the game will be drawn (this is automated later)
        var canvas = this.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);

        // Write out some "boot" text to the screen until we're ready for the next step
        var x = MMRPG.canvas.centerX, y = MMRPG.canvas.centerY;
        var loadText = this.add.bitmapText(x, y, 'megafont-white', 'Booting...', 16);
        loadText.setOrigin(0.5);
        loadText.setLetterSpacing(20);

        // Immediately start the preloader scene now that basics are loaded
        this.scene.start('Preloader');

    }

}