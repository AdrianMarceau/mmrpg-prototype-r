// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: TitleScene.js (scene)
// Title scene for the game. This scene is responsible for
// loading the game assets and then displaying the splash screen
// and start button to the user.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import MMRPG_Player from '../objects/MMRPG_Player.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';
import { StringsUtility as Strings } from '../utils/StringsUtility.js';

import SpritesManager from '../managers/SpritesManager.js';
import SoundsManager from '../managers/SoundsManager.js';
import ButtonsManager from '../managers/ButtonsManager.js';

export default class TitleScene extends Phaser.Scene
{

    constructor ()
    {
        console.log('TitleScene.constructor() called');
        super('Title');

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(this);
        let SOUNDS = SoundsManager.getInstance(this);
        let BUTTONS = ButtonsManager.getInstance(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        this.SOUNDS = SOUNDS;
        this.BUTTONS = BUTTONS;

        // Initialize this scene with a first-load callback function
        MMRPG.init('TitleScene', 'Title', function(){

            /* ... */

            });

    }

    init ()
    {
        //console.log('TitleScene.init() called');

        // Initialize any objects that need it
        this.SPRITES.init(this);
        this.BUTTONS.init(this);

    }

    preload ()
    {
        //console.log('TitleScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;

        // Define some idle sprite variables first and preload so we can use them later
        this.idleSprites = {};
        this.idleSpriteTokens = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.currentIdleSprite = this.idleSpriteTokens[0];
        this.currentIdleDelay = 0;

        // Loop through the idle sprite tokens and preload their sheets
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let token = this.idleSpriteTokens[i];
            let alt = 'base';
            if (token.indexOf('_') !== -1){
                let frags = token.split('_');
                token = frags[0];
                alt = frags[1];
                }
            //console.log('Preloading idle sprite token: ', token, ' (', alt, ')');
            let $player = new MMRPG_Player(this, token, {image_alt: alt});
            $player.preloadSpriteSheets();
            $player.destroy();
            }

    }

    create ()
    {
        //console.log('TitleScene.create() called');

        // Pull in required object references
        let _this = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;

        // Create the base canvas for which the rest of the game will be drawn
        this.canvasImage = this.add.image(0, 0, 'canvas');
        this.canvasImage.setOrigin(0, 0);

        // Add a splash screen with the logo and the game's title
        this.splashImage = this.add.image(0, 0, 'splash');
        this.splashImage.setOrigin(0, 0);

        // We should also show the current version just to be safe
        var x = MMRPG.canvas.centerX - 50, y = MMRPG.canvas.height - 30;
        var version = 'v ' + MMRPG.version;
        let $version = Strings.addPlainText(this, x, y, version, {color: '#696969', fontSize: '12px'});
        $version.x = MMRPG.canvas.centerX - ($version.width / 2);
        $version.setDepth(9999);

        // Generate some idle sprites to keep the user entertained
        //console.log('SPRITES.index = ', SPRITES.index);
        var x = -40, y = MMRPG.canvas.centerY + 125;
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let idleToken = this.idleSpriteTokens[i];
            let spriteToken = idleToken;
            let spriteAlt = 'base';
            if (spriteToken.indexOf('_') !== -1){
                let frags = spriteToken.split('_');
                spriteToken = frags[0];
                spriteAlt = frags[1];
                }
            //console.log('Creating idle sprite: ', spriteToken, ' (', spriteAlt, ')');
            let spriteDir = 'right';
            let $idlePlayer = new MMRPG_Player(this, spriteToken, {image_alt: spriteAlt}, {x: x, y: y, direction: spriteDir});
            let spriteRunAnim = $idlePlayer.getSpriteAnim('sprite', 'run');
            let $idleSprite = $idlePlayer.sprite;
            //console.log('-> $idlePlayer = ', $idlePlayer, ', $idleSprite = ', $idleSprite);
            //console.log('-> $idlePlayer token:', $idlePlayer.token, 'speedMod:', $idlePlayer.data.speedMod, '$idlePlayer:', $idlePlayer);
            $idleSprite.subTweens.runBounceTween = this.add.tween({
                targets: $idleSprite,
                y: '-=2',
                ease: 'Sine.easeInOut',
                duration: 200,
                repeatDelay: 100,
                repeat: -1,
                yoyo: true
                });
            $idleSprite.play(spriteRunAnim);
            this.idleSprites[idleToken] = $idlePlayer;
            }

        //console.log('this.idleSprites = ', this.idleSprites);

        // Show the start button now that we're ready
        this.startButton = this.addStartButton(this);

        // We can also show the debug button now too
        this.debugButton = BUTTONS.addDebugButton(this);

    }

    update (time, delta)
    {

        //console.log('TitleScene.update() called');

        // Animate the idle sprites to give the user something to look at
        //console.log('this.currentIdleSprite = ', this.currentIdleSprite);
        //console.log('this.idleSprites = ', this.idleSprites);
        if (this.currentIdleDelay > 0){
            this.currentIdleDelay--;
            } else if (this.currentIdleSprite) {
            let idleToken = this.currentIdleSprite;
            let spriteToken = idleToken;
            let spriteAlt = 'base';
            if (idleToken.indexOf('_')){
                let frags = idleToken.split('_');
                spriteToken = frags[0];
                spriteAlt = frags[1];
                }
            let $idlePlayer = this.idleSprites[idleToken];
            let $idleSprite = $idlePlayer.sprite;
            let spriteSpeed = Math.ceil(100 * $idlePlayer.data.speedMod) * (delta / 1000);
            //console.log('-> idleToken:', idleToken, '$idlePlayer:', $idlePlayer, '$idleSprite:', $idleSprite, 'spriteSpeed:', spriteSpeed);
            $idleSprite.x += spriteSpeed;
            if ($idleSprite.x > MMRPG.canvas.width){
                $idleSprite.x = -80;
                this.currentIdleDelay += 80;
                let idleOptions = this.idleSpriteTokens;
                let nextIdleToken = idleOptions[(idleOptions.indexOf(idleToken) + 1) % idleOptions.length];
                this.currentIdleSprite = nextIdleToken;
                }

            }

    }

    addStartButton(ctx) {

        let MMRPG = this.MMRPG;
        let SOUNDS = this.SOUNDS;

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
            SOUNDS.play('game-start', {volume: 0.5});
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