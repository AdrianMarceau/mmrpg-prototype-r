// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: TitleScene.js (scene)
// Title scene for the game. This scene is responsible for
// loading the game assets and then displaying the splash screen
// and start button to the user.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import SpritesManager from '../managers/SpritesManager.js';

import ButtonsUtility from '../utils/ButtonsUtility.js';

export default class TitleScene extends Phaser.Scene
{

    constructor ()
    {
        console.log('TitleScene.constructor() called');
        super('Title');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesManager(this);
        let BUTTONS = new ButtonsUtility(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        this.BUTTONS = BUTTONS;

        // Initialize this scene with a first-load callback function
        MMRPG.init('TitleScene', 'Title', function(){

            /* ... */

            });

    }

    preload ()
    {
        //console.log('TitleScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        SPRITES.preload(this);
        BUTTONS.preload(this);

        // Define some idle sprite variables first and preload so we can use them later
        this.idleSprites = {};
        this.idleSpriteTokens = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.currentIdleSprite = this.idleSpriteTokens[0];
        this.currentIdleDelay = 0;

        // Trigger post-preload methods for utility classes
        SPRITES.afterPreload(this);
        BUTTONS.afterPreload(this);

    }

    create ()
    {
        //console.log('TitleScene.create() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        SPRITES.create(this);
        BUTTONS.create(this);

        // Create the base canvas for which the rest of the game will be drawn
        this.canvasImage = this.add.image(0, 0, 'canvas');
        this.canvasImage.setOrigin(0, 0);

        // Add a splash screen with the logo and the game's title
        this.splashImage = this.add.image(0, 0, 'splash');
        this.splashImage.setOrigin(0, 0);

        // Generate some idle sprites to keep the user entertained
        //console.log('SPRITES.index = ', SPRITES.index);
        var x = -40, y = MMRPG.canvas.centerY + 125;
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let spriteToken = this.idleSpriteTokens[i];
            if (typeof SPRITES.index.sheets.players[spriteToken] === 'undefined'){
                //console.log('Missing spriteToken "', spriteToken, '" in SPRITES.index.sheets.players');
                continue;
                }
            let spriteAlt = 'base';
            let spriteDir = 'right';
            let spriteSheet = SPRITES.index.sheets.players[spriteToken][spriteAlt][spriteDir];
            let spriteRunAnim = SPRITES.index.anims.players[spriteToken][spriteAlt][spriteDir].run;
            let spriteY = y + 100 + (i * 25);
            //console.log('spriteSheet = ', spriteSheet);
            //console.log('spriteRunAnim = ', spriteRunAnim);
            let $idleSprite = this.add.sprite(x, y, spriteSheet);
            this.add.tween({
                targets: $idleSprite,
                y: '-=2',
                ease: 'Sine.easeInOut',
                duration: 200,
                repeat: -1,
                yoyo: true
                });
            $idleSprite.play(spriteRunAnim);
            this.idleSprites[spriteToken] = $idleSprite;
            }

        // Show the start button now that we're ready
        this.startButton = this.addStartButton(this);

        // We can also show the debug button now too
        this.debugButton = BUTTONS.addDebugButton(this);

        // Trigger post-create methods for utility classes
        SPRITES.afterCreate(this);
        BUTTONS.afterCreate(this);

    }

    update ()
    {

        //console.log('TitleScene.update() called');

        // Animate the idle sprites to give the user something to look at
        //console.log('this.currentIdleSprite = ', this.currentIdleSprite);
        //console.log('this.idleSprites = ', this.idleSprites);
        if (this.currentIdleDelay > 0){
            this.currentIdleDelay--;
            } else {
            let idleSprite = this.currentIdleSprite;
            let $idleSprite = this.idleSprites[idleSprite];
            let spriteSpeed = this.idleSpriteTokens.indexOf(idleSprite) + 1;
            $idleSprite.x += spriteSpeed;
            if ($idleSprite.x > MMRPG.canvas.width){
                $idleSprite.x = -80;
                this.currentIdleDelay += 80;
                let options = this.idleSpriteTokens;
                let nextIdleSprite = options[(options.indexOf(this.currentIdleSprite) + 1) % options.length];
                this.currentIdleSprite = nextIdleSprite;
                }

            }

    }

    addStartButton(ctx) {

        // Add a start button and get ready to fade in slowly
        var x = MMRPG.canvas.centerX, y = MMRPG.canvas.centerY + 60;
        let $startButton = this.add.image(x, y, 'start');

        // Add a tween to the button that pulses alpha but make it start paused
        let pulseTween = ctx.add.tween({
            targets: $startButton,
            alpha: { getStart: () => 0.75, getEnd: () => 0.25 },
            ease: 'Sine.easeInOut',
            duration: 2000,
            repeat: -1,
            yoyo: true,
            paused: true
            });

        // Make sure the start button is interactive
        $startButton.setInteractive({
            useHandCursor: true
            });

        // Add a hover effect that changes the alpha of the button
        $startButton.on('pointerover', () => {
            pulseTween.pause();
            $startButton.alpha = 1.0;
            });
        $startButton.on('pointerout', () => {
            $startButton.alpha = 0.8;
            pulseTween.resume();
            });

        // Add a click event that triggers a move to the Main scene
        $startButton.on('pointerdown', () => {
            console.log('Start button clicked!');
            ctx.scene.start('Main');
            });

        // Add a visual tween that fades the start button into view
        $startButton.alpha = 0.0;
        ctx.add.tween({
            targets: $startButton,
            alpha: { getStart: () => 0.0, getEnd: () => 0.75 },
            ease: 'Sine.easeInOut',
            duration: 1000,
            onComplete: () => {

                // Create the pulsing tween now that it's showing
                pulseTween.play();

                }
            });

        // Return the generated start button
        return $startButton;

    }

    showDebugButton(ctx) {

        // Add a small debug button at the bottom we can click
        var x = MMRPG.canvas.width - 60, y = MMRPG.canvas.height - 20;
        let $debugButton = ctx.add.bitmapText(x, y, 'megafont-white', 'DEBUG', 9);
        $debugButton.setLetterSpacing(20);
        $debugButton.setOrigin(0, 1);

        // Make sure the debug button is clickable
        $debugButton.setInteractive({
            useHandCursor: true
            });

        $debugButton.on('pointerdown', () => {
            //console.log('Debug button clicked');
            this.scene.start('Debug');
            });

        // Add the start button to the scene
        ctx.debugButton = $debugButton;

    }

}