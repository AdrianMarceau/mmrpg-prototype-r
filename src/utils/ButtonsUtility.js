// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: Utilities.Buttons.js
// Button utility class for the MMRPG. This class is responsible for
// creating and managing interactive buttons in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class ButtonsUtility {

    // Constructor for the PopupsUtility class
    constructor(scene)
    {
        console.log('ButtonsUtility.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Initialize this scene with a first-load callback function
        MMRPG.init('ButtonsUtility', 'Buttons', function(){

            /* ... */

            });

    }

    preload (scene)
    {
        this.scene = scene;
    }
    afterPreload (scene)
    {
        /* ... */
    }

    create (scene)
    {
        this.scene = scene;
    }
    afterCreate (scene)
    {
        /* ... */
    }

    makeSimpleButton (text, config, callback){

        // Create a small text button to trigger displaying tales from the void
        let ctx = this.scene;
        var buttonText = text || '...';
        var buttonSize = config.size || 12;
        var buttonX = config.x || 0, buttonY = config.y || 0;
        var buttonWidth = config.width || 100, buttonHeight = config.height || 25;
        var buttonTextX = buttonX + (buttonWidth / 2), buttonTextY = buttonY + (buttonHeight / 2);
        var buttonTextColor = config.color || 0x95c418;
        var buttonBorderColor = config.border || 0x0a0a0a;
        var buttonBackgroundColor = config.background || 0x161616;
        var buttonDepth = config.depth || 'auto';
        var buttonCallback = callback || function(){};

        let $buttonRect = ctx.add.graphics({ lineStyle: { width: 2, color: buttonBorderColor }, fillStyle: { color: buttonBackgroundColor }});
        $buttonRect.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
        $buttonRect.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
        if (buttonDepth !== 'auto'){ $buttonRect.setDepth(buttonDepth); }

        let $buttonText = ctx.add.bitmapText(buttonTextX, buttonTextY, 'megafont-white', buttonText, buttonSize);
        $buttonText.setOrigin(0.5);
        $buttonText.setLetterSpacing(20);
        $buttonText.setTint(buttonTextColor);
        $buttonText.setAlpha(0.8);
        $buttonText.x -= (buttonWidth - $buttonText.width) / 4;
        if (buttonDepth !== 'auto'){ $buttonText.setDepth(buttonDepth + 1); }

        $buttonRect.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
            });
        let buttonClickTween = null;
        $buttonRect.on('pointerover', function () { $buttonText.setAlpha(1.0); });
        $buttonRect.on('pointerout', function () { $buttonText.setAlpha(0.8); });
        $buttonRect.on('pointerdown', function () {
            buttonCallback();
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
        let $buttonGroup = ctx.add.group();
        $buttonGroup.add($buttonRect);
        $buttonGroup.add($buttonText);
        return $buttonGroup;

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