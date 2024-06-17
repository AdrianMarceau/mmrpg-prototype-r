// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: PopupsManager.js
// Popup utility class for the game. This class contains methods
// for displaying various popups and dialogues to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class PopupsManager {

    // Static method to get the singleton instance of this class
    static getInstance (scene)
    {
        //console.log('PopupsManager.getInstance() called');
        if (!MMRPG.Managers.POPUPS){ MMRPG.Managers.POPUPS = new PopupsManager(scene); }
        return MMRPG.Managers.POPUPS;
    }

    // Constructor for the PopupsManager class
    constructor(scene)
    {
        console.log('PopupsManager.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Predefine some internal variables for the popup interface
        this.popupOverlay = null;
        this.popupVisible = false;
        this.queuedPopups = [];

        // Initialize this scene with a first-load callback function
        MMRPG.init('PopupsManager', 'Popups', function(){

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
        //console.log('PopupsManager.preload() called');
        /* ... */
    }
    create ()
    {
        //console.log('PopupsManager.create() called');
        this.createOverlay();
    }
    update ()
    {
        //console.log('PopupsManager.update() called');
        /* ... */
    }

    // Define functions to creat, show, and destroy the overlay
    createOverlay (){
        //console.log('PopupsManager.createOverlay() called');
        if (this.popupOverlay){ this.popupOverlay.destroy(); }
        const $blackOverlay = this.scene.add.graphics({ fillStyle: { color: 0x000000 } });
        $blackOverlay.fillRect(0, 0, MMRPG.canvas.width, MMRPG.canvas.height);
        $blackOverlay.setAlpha(0.75);
        $blackOverlay.setVisible(false);
        $blackOverlay.setDepth(9000);
        $blackOverlay.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, MMRPG.canvas.width, MMRPG.canvas.height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
            });
        this.popupOverlay = $blackOverlay;
    }
    showOverlay (){
        //console.log('PopupsManager.showOverlay() called', this.popupOverlay);
        this.popupOverlay.setVisible(true);
        this.popupVisible = true;
    }
    hideOverlay (){
        //console.log('PopupsManager.hideOverlay() called', this.popupOverlay);
        this.popupOverlay.setVisible(false);
        this.popupVisible = false;
    }

    // Displays a popup on the screen with an arrow to dismiss it w/ a queue for multiple popups
    displayPopup(text, options)
    {
        //console.log('PopupsManager.displayPopup() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;

        // Predefine some text variables to be ready
        let popupText = [];
        if (Array.isArray(text)) { popupText = text; }
        else { popupText.push(text); }
        let popupOptions = {};
        if (options) { popupOptions = options; }

        // Pre-count the number of pages in case it's relevant
        if (typeof popupOptions.showTitle !== 'string'){ popupOptions.showTitle = false; }
        if (typeof popupOptions.showPages !== 'boolean'){ popupOptions.showPages = false; }
        if (typeof popupOptions.totalPages !== 'number'){ popupOptions.totalPages = popupText.length; }
        if (typeof popupOptions.showArrow !== 'boolean'){ popupOptions.showArrow = true; }
        if (typeof popupOptions.onComplete !== 'function'){ popupOptions.onComplete = function(){}; }

        // Add these to the queue regardless of what we do next
        this.queuedPopups.push({ text: popupText, options: popupOptions });

        // If the overlay hasn't been created yet, do so now
        if (!this.popupOverlay) { this.createOverlay(); }

        // If there isn't a popup window visible yet, we can show it now
        if (!this.popupVisible){ this.displayQueuedPopup(); }

    }

    // Display a rectangular dialogue box with a welcome message inside
    displayQueuedPopup()
    {
        //console.log('PopupsManager.displayQueuedPopup() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;

        // Predefine some text variables to be ready
        let popupText = '';
        let popupOptions = {};
        let pagesRemaining = 0;
        let fadeOutPopup = false;
        if (this.queuedPopups.length > 0){
            let queuedPopup = this.queuedPopups.shift();
            popupText = queuedPopup.text.shift();
            popupOptions = queuedPopup.options;
            if (queuedPopup.text.length > 0){
                this.queuedPopups.unshift({ text: queuedPopup.text, options: popupOptions });
                pagesRemaining = queuedPopup.text.length;
                } else {
                fadeOutPopup = true;
                }
            } else {
            //console.log('No queued popups to display!');
            return;
            }

        // Predefine some variables for the panel
        let panelWidth = MMRPG.canvas.width - 80,
            panelHeight = 180,
            panelX = MMRPG.canvas.width - panelWidth - 40,
            panelY = MMRPG.canvas.height - panelHeight - 40
            ;

        // Create a container and add the graphics and text to it
        const $panelContainer = this.scene.add.container(0, 0);
        $panelContainer.setSize(panelWidth, panelHeight);
        $panelContainer.setDepth(9100);

        // Cover the canvas in a black overlay to darken the background
        this.showOverlay();

        // Create the panel graphics using a rectangle with stroke
        const $panelBackground = this.scene.add.graphics({ lineStyle: { width: 3, color: 0x0a0a0a }, fillStyle: { color: 0x161616 } });
        $panelBackground.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        $panelBackground.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        $panelContainer.add($panelBackground);

        // Predefine some variables for the text
        let textPadding = 15,
            textWidth = panelWidth - (textPadding * 2),
            textPositionX = panelX + textPadding,
            textPositionY = panelY + textPadding
            ;

        // Add the welcome text to the panel
        const $panelText = this.scene.add.text(textPositionX, textPositionY, popupText, {
            fontSize: 16,
            fontFamily: 'Open Sans',
            lineSpacing: 10,
            align: 'left',
            wordWrap: { width: textWidth, useAdvancedWrap: true }
            });
        $panelText.setText(popupText.slice(0, 0));
        $panelContainer.add($panelText);

        // Create a typed text event to animate the text appearing
        let typedTextComplete = false;
        let typedTextEvent = this.scene.time.addEvent({
            callback: () => {
                $panelText.setText(popupText.slice(0, $panelText.text.length + 1));
                if ($panelText.text.length === popupText.length){
                    typedTextComplete = true;
                    }
                },
            repeat: popupText.length - 1,
            delay: 20
            });

        // If there are multiple pages and we're allowed to show them, then show them
        if (popupOptions.totalPages > 1
            && popupOptions.showPages){

            // Display a little text area at the top-left showing # of #
            let counterSize = 14,
                counterX = panelX + panelWidth - 10,
                counterY = panelY - 20
                ;
            let counterText = '[ ' + (popupOptions.totalPages - pagesRemaining) + ' / ' + popupOptions.totalPages + ' ]';
            const $panelCounter = this.scene.add.text(counterX, counterY, counterText, {
                fontSize: counterSize,
                fontFamily: 'Open Sans',
                color: '#dedede'
                });
            //$panelCounter.setOrigin(1, 0);
            $panelCounter.x = panelX + panelWidth - $panelCounter.width - 10;
            //$panelCounter.y = panelY - $panelCounter.height - 20;
            $panelContainer.add($panelCounter);

            }

        // Only show the arrow if we're allowed to and then animate it appropriately
        if (popupOptions.showArrow){

            // Check to see if this is the final message or not
            let hasMorePages = popupOptions.totalPages > 1 && pagesRemaining > 0 ? true : false;

            // Add an upside down white triangle for clicking
            let arrowWidth = 15, arrowHeight = 15, arrowStroke = 2, arrowColor = 0xefefef;
            let arrowX = panelX + panelWidth - arrowWidth - 20,
                arrowY = panelY + panelHeight - arrowHeight - 20
                ;

            // Draw the panel arrow so the user knows to click forward to the next or to dismiss
            const $panelArrow = this.scene.add.graphics({ fillStyle: { color: arrowColor }, lineStyle: { width: arrowStroke, color: arrowColor } });
            $panelArrow.fillTriangle(arrowX, arrowY, arrowX + arrowWidth, arrowY, arrowX + (arrowWidth / 2), arrowY + arrowHeight)
            $panelArrow.strokeTriangle(arrowX, arrowY, arrowX + arrowWidth, arrowY, arrowX + (arrowWidth / 2), arrowY + arrowHeight);

            // Add the arrow to the panel container
            $panelContainer.add($panelArrow);

            // Show the arrow hovering up and down slowly, faster if there are more pages
            let arrowTween = {
                targets: $panelArrow,
                duration: 400,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                y: -4,
                delay: 0,
                repeatDelay: 0
                };
            this.scene.tweens.add(arrowTween);

            }

        // Make the panel background interactive and clickable to dismiss
        $panelBackground.setInteractive({
            hitArea:new Phaser.Geom.Rectangle(panelX, panelY, panelWidth, panelHeight),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
            });
        $panelBackground.on('pointerdown', () => {
            //console.log('Popup panel clicked!');

            // If the text isn't fully typed out yet, then do so now
            if (!typedTextComplete){
                $panelText.setText(popupText);
                typedTextEvent.remove();
                typedTextComplete = true;
                return;
                }

            // Define a function to run for destroying this popup
            $panelBackground.setInteractive(false);
            let thisContext = this;
            let destroyCallback = function(){

                // Always destroy the current message as it's done
                $panelContainer.destroy();
                typedTextEvent.remove();

                // If there's more to show, then show it
                if (thisContext.queuedPopups.length > 0){
                    thisContext.displayQueuedPopup();
                    }
                // Otherwise we should hide the panel and overlay
                else {
                    thisContext.hideOverlay();
                    popupOptions.onComplete();
                    }

                };

            // Fade out the popup first before destroying it if requested
            if (fadeOutPopup){
                let fadeOutTween = {
                    targets: $panelContainer,
                    duration: 200,
                    alpha: 0,
                    onComplete: destroyCallback
                    };
                this.scene.tweens.add(fadeOutTween);
                } else {
                destroyCallback();
                }

            });

    }

}