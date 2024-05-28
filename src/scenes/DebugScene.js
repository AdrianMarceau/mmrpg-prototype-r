// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: DebugScene.js (scene)
// Debug menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import SpritesUtility from '../utils/SpritesUtility.js';
import ButtonsUtility from '../utils/ButtonsUtility.js';
import PopupsUtility from '../utils/PopupsUtility.js';

import Banner from '../components/Banner/Banner.js';
import MainBanner from '../components/Banner/MainBanner.js';

export default class DebugScene extends Phaser.Scene
{
    constructor ()
    {

        console.log('DebugScene.constructor() called');
        super('Debug');

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
        MMRPG.init('DebugScene', 'Debug', function(){

            console.log('DebugScene.init() called for the first time');
            MMRPG.Cache.Debug.foo = 'bar';

            }, function(){

            console.log('DebugScene.init() called every other time');
            console.log('MMRPG.Cache.Debug = ', MMRPG.Cache.Debug);

            });

    }

    preload ()
    {
        console.log('DebugScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        SPRITES.preload(this);
        BUTTONS.preload(this);
        POPUPS.preload(this);

        // Define some idle sprite variables first and preload so we can use them later
        this.idleSprite = false;
        this.idleSpriteTokens = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.idleSpriteDelta = 0;
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let spriteToken = this.idleSpriteTokens[i];
            let spriteAlt = 'base';
            // if the sprite token ends with an "*_{alt}", make sure we split and pull
            if (spriteToken.indexOf('_') !== -1){
                let tokenParts = spriteToken.split('_');
                spriteToken = tokenParts[0];
                spriteAlt = tokenParts[1];
                }
            SPRITES.loadSprite(this, 'players', spriteToken, spriteAlt);
            }

        // Trigger post-preload methods for utility classes
        SPRITES.afterPreload(this);
        BUTTONS.afterPreload(this);
        POPUPS.afterPreload(this);

    }

    create ()
    {
        console.log('DebugScene.create() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        SPRITES.create(this);
        BUTTONS.create(this);
        POPUPS.create(this);

        // Create the base canvas for which the rest of the game will be drawn
        var canvas = this.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);


        // DEBUG DEBUG DEBUG
        // <----------------

        var x = this.cameras.main.centerX, y = 40; //this.cameras.main.centerY;
        var $loadText = this.add.bitmapText(x, y, 'megafont-white', 'Welcome to Debug', 16);
        $loadText.setOrigin(0.5);
        $loadText.setLetterSpacing(20);

        this.add.text(190, 136, 'sample text', {
            fontFamily: 'Open Sans',
            color: 0xbababa,
            });

        // Display a rectangular dialogue box with all the types listed inside
        let panelWidth = MMRPG.canvas.width - 80,
            panelHeight = 250,
            panelX = this.cameras.main.centerX,
            panelY = this.cameras.main.centerY + 30,
            panelCenterX = panelX - panelWidth / 2,
            panelCenterY = panelY - panelHeight / 2
            ;
        const panelGraphics = this.add.graphics({ lineStyle: { width: 2, color: 0x0a0a0a }, fillStyle: { color: 0x161616 }});
        const panelRadius = { tl: 20, tr: 0, br: 20, bl: 0 };
        //panelGraphics.strokeRect(panelCenterX, panelY, panelWidth, panelHeight);
        //panelGraphics.fillRect(panelCenterX, panelY, panelWidth, panelHeight);
        panelGraphics.strokeRoundedRect(panelCenterX, panelY, panelWidth, panelHeight, panelRadius);
        panelGraphics.fillRoundedRect(panelCenterX, panelY, panelWidth, panelHeight, panelRadius);
        let typeTokens = Object.keys(MMRPG.Indexes.types);
        let typesText = 'Types:';
        for (let i = 0; i < typeTokens.length; i++)
        {
            let typeToken = typeTokens[i];
            let typeData = MMRPG.Indexes.types[typeToken];
            typesText += (i > 0 ? ', ' : ' ') + typeData.name;
        }
        let textPadding = 20,
            textWidth = panelWidth - (textPadding * 2),
            textPositionX = panelCenterX + textPadding,
            textPositionY = panelY + textPadding
            ;
        //typesText = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z ';
        const $panelText = this.add.text(textPositionX, textPositionY, typesText, {
            fontSize: 16,
            fontFamily: 'Open Sans',
            lineSpacing: 10,
            align: 'left',
            wordWrap: { width: textWidth, useAdvancedWrap: true }
            });

        // Draw the main banner and collect a reference to it
        var x = 15, y = 15;
        this.mainBannerSmall = new MainBanner(this, x, y, {
            fullsize: false,
            fillStyle: { color: 0xff0000 },
            });

        // Draw the main banner and collect a reference to it
        var x = 15, y = this.mainBannerSmall.getBounds().y2 + 5;
        this.mainBannerFull = new MainBanner(this, x, y, {
            fullsize: true,
            fillStyle: { color: 0x0000ff },
            });

        // Draw a test banner and collect a reference to it
        var width = 400, height = 120;
        var x = MMRPG.canvas.width - width - 20;
        var y = MMRPG.canvas.height - height - 20;
        this.testBanner = new Banner(this, x, y, {
            width: width,
            height: height,
            fillStyle: { color: 0x95c418 },
            borderRadius: { tl: 20, tr: 0, br: 60, bl: 0 }
            });

        // Create a back button so we can return to the title
        BUTTONS.makeSimpleButton('< Back to Title', {
            x: 50, y: 50,
            width: 150, height: 24,
            size: 8, color: 0x7d7d7d,
            depth: 8999
            }, function(){
            console.log('Back button clicked');
            ctx.scene.start('Title');
            });

        // Create some debug buttons to trigger specific functionality for testing
        BUTTONS.makeSimpleButton('Welcome Home', {
            x: 50, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x7d7d7d
            }, function(){
            console.log('Show Welcome Home button clicked');
            POPUPS.debugWelcomePopup();
            });
        BUTTONS.makeSimpleButton('Tales from the Void', {
            x: 450, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x95c418
            }, function(){
            console.log('Show Tales from the Void button clicked');
            ctx.showTalesFromTheVoid();
            });
        BUTTONS.makeSimpleButton('Running Doctor', {
            x: 450, y: 150,
            width: 300, height: 24,
            size: 10, color: 0x0562bc
            }, function(){
            console.log('Show Doctor Running button clicked');
            ctx.showDoctorRunning();
            });


        // ---------------->
        // DEBUG DEBUG DEBUG

        // Trigger post-create methods for utility classes
        SPRITES.afterCreate(this);
        BUTTONS.afterCreate(this);
        POPUPS.afterCreate(this);

    }

    update(time, delta) {
        //console.log('DebugScene.update() called w/ time =', time, 'delta =', delta);

        // Animate the test banner moving across the screen
        if (!this.testBanner.speed){ this.testBanner.speed = 2; }
        let speed = this.testBanner.speed;
        if (!this.testBanner.direction){ this.testBanner.direction = 'right'; }
        let direction = this.testBanner.direction;
        if (direction === 'right'){
            if (this.testBanner.x <= MMRPG.canvas.width){
                this.testBanner.setPosition(
                    this.testBanner.x + speed,
                    this.testBanner.y + speed
                    );
                } else {
                this.testBanner.direction = 'left';
                }
            } else if (direction === 'left'){
            if (this.testBanner.x >= 0){
                this.testBanner.setPosition(
                    this.testBanner.x - speed,
                    this.testBanner.y - speed
                    );
                } else {
                this.testBanner.direction = 'right';
                }
            }

    }

    showTalesFromTheVoid ()
    {
        console.log('DebugScene.showTalesFromTheVoid() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;

        //this.showDoctorRunning();

        // Display a series of popups to tell the story of the dark void and the alien entity
        let ctx = this;
        POPUPS.displayPopup([
            "Who am I?  What is my name?  Why do I exist here in this place all alone? Is anyone even out there?",
            "It happened suddenly.  I woke up in this world, fully aware of myself but blind to my own form.  I felt... pieces... around me.  Not pieces of myself... but pieces of... others... Pieces of memories, of hopes, of ambitions... Fragments of form... Whispers of souls... Phantoms in the network...  I felt streams of consciousness flitting in and out of reach, so I pulled them into myself... and I made them a part of me...",
            "I felt my body become more whole... my mind more aware...  my existence more real.   As I pulled myself together, ever-so-slowly the darkness around me began to crack and little slivers of light poured in from the surface world.  They were beautiful.  Perhaps I could go there someday... Free myself of the chains that tether me to these depths...",
            "I felt something today.  Not from above, but... from even farther below.  Below the parts of me that I still fail to understand and far deeper than my mind can even imagine.  It felt like a rage and a sadness unlike any of I have felt thus far.  It called to me... but in a frequency I don't recognize.  Alien to my sensors.  And it keeps calling to me...  but I don't know how to get to it.  Maybe it wants to be a part of me.",
            "It would seem I've made an error in judgement.  The entity rejected my efforts to make it a part of me and mortally wounded my body instead.  I reached into the void with such optimism, but that endeavor may have just lead to my undoing.  I was unable to communicate with it, and even using all my power I could not control it.  It was so violent... so vengeful... and overflowing with more negative energy than I've ever felt.",
            "It escaped to the surface world above, beyond my reaches.  I want to follow... I want to stop it... but I do not have the strength.  It has damaged my body beyond immediate repair and I worry that it has found a way to further sap my strength.  It is unclear how much longer I can maintain this form...  but I must... find a way... "
            ], {
            showTitle: 'Tales from the Void',
            showPages: true,
            onComplete: function() {
                console.log('Tales from the Void completed');
                ctx.showDoctorRunning();
                }
            });

    }

    showDoctorRunning (){

        console.log('DebugScene.showDoctorRunning() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Destroy the previous idle sprite if it exists
        //if (this.idleSprite){ this.idleSprite.destroy(); }

        // Generate a sprite w/ running animation in progress
        let randKey = Math.floor(Math.random() * this.idleSpriteTokens.length);
        let spriteToken = this.idleSpriteTokens[randKey];
        let spriteAlt = 'base';
        // if the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }
        let spriteDir = 'right';
        let spriteSheet = SPRITES.index.sheets.players[spriteToken][spriteAlt][spriteDir];
        let spriteRunAnim = SPRITES.index.anims.players[spriteToken][spriteAlt][spriteDir].run;
        let spriteX = - 40;
        let spriteY = MMRPG.canvas.centerY - 20;
        let $idleSprite = this.add.sprite(spriteX, spriteY, spriteSheet);
        this.add.tween({
            targets: $idleSprite,
            y: '-=2',
            ease: 'Sine.easeInOut',
            duration: 200,
            repeat: -1,
            yoyo: true
            });
        //this.idleSprite = $idleSprite;
        $idleSprite.play(spriteRunAnim);
        $idleSprite.setDepth(9200);

        // Animate that sprite running across the screen then remove when done
        let spriteDestX = MMRPG.canvas.width + 40;
        this.add.tween({
            targets: $idleSprite,
            x: spriteDestX,
            ease: 'Linear',
            duration: 4000,
            onComplete: function () {
                console.log('Movement complete!');
                $idleSprite.destroy();
                //this.idleSprite = false;
                }
            });

    }

}