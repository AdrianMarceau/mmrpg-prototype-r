// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: ButtonsManager.js
// Button utility class for the MMRPG. This class is responsible for
// creating and managing interactive buttons in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';
import { StringsUtility as Strings } from '../utils/StringsUtility.js';

export default class ButtonsManager {

    // Constructor for the ButtonsManager class
    constructor(scene)
    {
        console.log('ButtonsManager.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Initialize this scene with a first-load callback function
        MMRPG.init('ButtonsManager', 'Buttons', function(){

            /* ... */

            });

    }
    init (scene)
    {
        this.scene = scene;
        scene.events.on('preload', this.preload, this);
        scene.events.on('create', this.create, this);
        scene.events.on('update', this.update, this);
    }

    preload ()
    {
        //console.log('ButtonsManager.preload() called');
        /* ... */
    }
    create ()
    {
        //console.log('ButtonsManager.create() called');
        /* ... */
    }
    update ()
    {
        //console.log('ButtonsManager.update() called');
        /* ... */
    }

    makeSimpleButton (text, config, callback){

        // Create a small text button to trigger displaying tales from the void
        let ctx = this.scene;
        var buttonText = text || '...';
        var buttonSize = config.size || 12;
        var buttonX = config.x || 0, buttonY = config.y || 0;
        var buttonWidth = config.width || 100, buttonHeight = config.height || 25;
        var buttonTextFont = config.font || 'megafont-white';
        var buttonTextX = buttonX + 0, buttonTextY = buttonY + 0;
        var buttonTextColor = config.color || '#95c418';
        var buttonBorderColor = config.border || '#0a0a0a';
        var buttonBackgroundColor = config.background || '#161616';
        var buttonDepth = config.depth || 'auto';
        var buttonCallback = callback || function(){};

        let $buttonRect = Graphics.addTypePanel(ctx, {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            radius: 6,
            depth: buttonDepth,
            lineStyle: { width: 2, color: Graphics.returnHexColorValue(buttonBorderColor) },
            fillStyle: { color: Graphics.returnHexColorValue(buttonBackgroundColor) },
            });
        buttonDepth = $buttonRect.depth;

        // Check if explicitly one of the bitmap fonts, otherwise we have to add it in plain text
        let $buttonText;
        if (buttonTextFont === 'megafont-white'
            || buttonTextFont === 'megafont-black'){

            // Add the button text using the selected bitmap font
            $buttonText = ctx.add.bitmapText(buttonTextX, buttonTextY, buttonTextFont, buttonText, buttonSize);
            $buttonText.setOrigin(0.5);
            $buttonText.setLetterSpacing(20);
            $buttonText.setTint(Graphics.returnHexColorValue(buttonTextColor));
            $buttonText.setAlpha(0.8);
            $buttonText.setDepth(buttonDepth + 1);
            buttonTextX = buttonX + (buttonWidth / 2); //((buttonWidth - $buttonText.width) / 2);
            buttonTextY = buttonY + (buttonHeight / 2); //((buttonHeight - $buttonText.height) / 2);
            $buttonText.x = buttonTextX;
            $buttonText.y = buttonTextY;

            } else {

            // Add the button text using the default font
            //buttonTextFont === 'default'
            let fontDefaults = Strings.getDefaults();
            // convert the hex value buttonTextColor to a string version of itself
            $buttonText = ctx.add.text(buttonTextX, buttonTextY, buttonText, {
                fontFamily: fontDefaults.font,
                fontSize: buttonSize + 'px',
                color: Graphics.returnHexColorString(buttonTextColor),
                //fontWeight: 'bold',
                //letterSpacing: 100,
                });
            $buttonText.setOrigin(0.5);
            $buttonText.setAlpha(0.8);
            $buttonText.setDepth(buttonDepth + 1);

            }

        $buttonRect.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
            });

        let $buttonGroup = ctx.add.group();
        $buttonGroup.add($buttonRect);
        $buttonGroup.add($buttonText);

        let buttonObject = {
            group: $buttonGroup,
            span: $buttonRect,
            text: $buttonText,
            setPosition: function(x, y){
                $buttonRect.x = x;
                $buttonRect.y = y;
                $buttonText.x = x + (buttonWidth / 2);
                $buttonText.y = y + (buttonHeight / 2);
                },
            };

        let buttonClickTween = null;
        $buttonRect.on('pointerover', function () { $buttonText.setAlpha(1.0); });
        $buttonRect.on('pointerout', function () { $buttonText.setAlpha(0.8); });
        $buttonRect.on('pointerdown', function () {
            buttonCallback(buttonObject);
            // add a tween where the text grows briefly then shrinks back
            if (buttonClickTween){ buttonClickTween.stop(); }
            $buttonText.scaleX = 1.2;
            $buttonText.scaleY = 1.2;
            buttonClickTween = ctx.add.tween({
                targets: $buttonText,
                scaleX: 1.0,
                scaleY: 1.0,
                ease: 'Sine.easeInOut',
                duration: 200,
                repeat: 0
                });
            });

        // Create a group with the above two elements and return it
        return buttonObject;

    }

    addDebugButton(ctx) {

        // Add a small debug button at the bottom we can click
        var x = MMRPG.canvas.width - 60, y = MMRPG.canvas.height - 20;
        let $debugButton = ctx.add.bitmapText(x, y, 'megafont-white', 'DEBUG', 9);
        $debugButton.setLetterSpacing(20);
        $debugButton.setOrigin(0, 1);
        $debugButton.setDepth(8000);

        // Make sure the debug button is clickable
        $debugButton.setInteractive({
            useHandCursor: true
            });

        $debugButton.on('pointerdown', () => {
            //console.log('Debug button clicked');
            ctx.scene.start('Debug');
            });

        // Return the generated debug button
        return $debugButton;

    }

}