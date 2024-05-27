// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MainScene.js (scene)
// Main menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import SpritesUtility from '../utils/SpritesUtility.js';
import ButtonsUtility from '../utils/ButtonsUtility.js';
import PopupsUtility from '../utils/PopupsUtility.js';

import MainBanner from '../components/Banner/MainBanner.js';

export default class MainScene extends Phaser.Scene
{
    constructor ()
    {
        console.log('MainScene.constructor() called');
        super('Main');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesUtility(this);
        let POPUPS = new PopupsUtility(this);
        let BUTTONS = new ButtonsUtility(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
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
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        SPRITES.preload(this);
        BUTTONS.preload(this);
        POPUPS.preload(this);

        /* ... */

        // Trigger post-preload methods for utility classes
        SPRITES.afterPreload(this);
        BUTTONS.afterPreload(this);
        POPUPS.afterPreload(this);

    }

    create ()
    {
        console.log('MainScene.create() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        SPRITES.create(this);
        BUTTONS.create(this);
        POPUPS.create(this);

        // Create the base canvas for which the rest of the game will be drawn
        var $canvas = this.add.image(0, 0, 'canvas');
        $canvas.setOrigin(0, 0);

        // Predefine some sizing details about the scene
        var bannerSize = 'full';
        var bannerWidth = 750;
        var bannerHeight = 184;
        var subMenuHeight = 23;
        var readyRoomHeight = bannerHeight - subMenuHeight;
        if (bannerSize === 'small'){
            bannerHeight = 124;
            readyRoomHeight = bannerHeight - subMenuHeight;
            }

        // READY ROOM MOCKUP (Banner Area)

        var x = MMRPG.canvas.centerX, y = 15;
        var $readyRoom = this.add.image(x, y, 'mockup_main_banner_ready-room_' + bannerSize);
        $readyRoom.setOrigin(0.5, 0);

        // SUB MENU MOCKUP (Menu Area)

        var x = MMRPG.canvas.centerX, y = y + readyRoomHeight;
        var $subMenu = this.add.image(x, y, 'mockup_main_banner_sub-menu');
        $subMenu.setOrigin(0.5, 0);

        // HOME CONTENT MOCKUP (Content Area)

        var x = MMRPG.canvas.centerX, y = y + subMenuHeight + 10;
        var $contentHome = this.add.image(x, y, 'mockup_main_content_home');
        $contentHome.setOrigin(0.5, 0);

        // BANNER COMPONENT (Main Banner)

        /*
        // Draw the main banner and collect a reference to it
        var x = 15, y = 15;
        this.mainBanner = new MainBanner(this, x, y, {
            fullsize: true
            });
        */

        // Run any debug code we need to
        this.debug();


        // Trigger post-create methods for utility classes
        SPRITES.afterCreate(this);
        BUTTONS.afterCreate(this);
        POPUPS.afterCreate(this);

    }

    update(time, delta) {

        // Update the banner if needed
        // this.mainBanner.update({ backgroundColor: 0x654321 });

    }

    // DEBUG DEBUG DEBUG
    // <----------------
    debug ()
    {
        console.log('MainScene.debug() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
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