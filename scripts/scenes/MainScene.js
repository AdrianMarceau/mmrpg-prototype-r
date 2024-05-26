// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MainScene.js (scene)
// Main menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';
import ButtonsUtility from '../utils/ButtonsUtility.js';
import PopupsUtility from '../utils/PopupsUtility.js';

export default class MainScene extends Phaser.Scene
{
    constructor ()
    {
        console.log('MainScene.constructor() called');
        super('Main');

        // Initialize MMRPG utility class objects
        let POPUPS = new PopupsUtility(this);
        let BUTTONS = new ButtonsUtility(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.POPUPS = POPUPS;
        this.BUTTONS = BUTTONS;

        // Initialize this scene with a first-load callback function
        MMRPG.init('MainScene', 'Main', function(){

            /* ... */

            });
    }

    preload ()
    {
        console.log('MainScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        BUTTONS.setScene(this);
        POPUPS.setScene(this);

        /* ... */

    }

    create ()
    {
        console.log('MainScene.create() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Create the base canvas for which the rest of the game will be drawn
        var $canvas = this.add.image(0, 0, 'canvas');
        $canvas.setOrigin(0, 0);


        // READY ROOM MOCKUP (Banner Area)

        var readyRoomExpanded = true;
        var readyRoomHeight = readyRoomExpanded ? 161 : 101;
        var x = MMRPG.canvas.centerX, y = 15;
        var $readyRoom = this.add.image(x, y, 'mockup_main_banner_ready-room_' + (readyRoomExpanded ? 'full' : 'small'));
        $readyRoom.setOrigin(0.5, 0);

        // SUB MENU MOCKUP (Menu Area)

        var subMenuHeight = 23;
        var x = MMRPG.canvas.centerX, y = y + readyRoomHeight;
        var $subMenu = this.add.image(x, y, 'mockup_main_banner_sub-menu');
        $subMenu.setOrigin(0.5, 0);


        // HOME CONTENT MOCKUP (Content Area)

        var x = MMRPG.canvas.centerX, y = y + subMenuHeight + 10;
        var $contentHome = this.add.image(x, y, 'mockup_main_content_home');
        $contentHome.setOrigin(0.5, 0);

        // Run any debug code we need to
        this.debug();

    }

    // DEBUG DEBUG DEBUG
    // <----------------
    debug ()
    {
        console.log('MainScene.debug() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // We can also show the debug button now too
        this.debugButton = BUTTONS.addDebugButton(this);

        //POPUPS.debugWelcomePopup();
        //POPUPS.displayPopup('Testing 123');
        //POPUPS.displayPopup('Testing 456');
        //POPUPS.displayPopup('Testing 789');
        //POPUPS.displayPopup(['Lorem ipsum', 'Dolar sit amet']);

    }
    // ---------------->
    // DEBUG DEBUG DEBUG

}