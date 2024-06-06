// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: DebugScene.js (scene)
// Debug menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';
import { StringsUtility as Strings } from '../utils/StringsUtility.js';

import SpritesManager from '../managers/SpritesManager.js';
import PopupsManager from '../managers/PopupsManager.js';
import ButtonsManager from '../managers/ButtonsManager.js';

import Banner from '../components/Banner/Banner.js';
import MainBanner from '../components/Banner/MainBanner.js';
import BattleBanner from '../components/Banner/BattleBanner.js';

export default class DebugScene extends Phaser.Scene
{
    constructor ()
    {

        console.log('DebugScene.constructor() called');
        super('Debug');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesManager(this);
        let POPUPS = new PopupsManager(this);
        let BUTTONS = new ButtonsManager(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        this.BUTTONS = BUTTONS;
        this.POPUPS = POPUPS;

        // Initialize this scene with a first-load callback function
        MMRPG.init('DebugScene', 'Debug', function(){

            //console.log('DebugScene.init() called for the first time');
            MMRPG.Cache.Debug.foo = 'bar';

            }, function(){

            //console.log('DebugScene.init() called every other time');
            //console.log('MMRPG.Cache.Debug = ', MMRPG.Cache.Debug);

            });

    }

    init ()
    {
        //console.log('MainScene.init() called');

        // Initialize any objects that need it
        this.SPRITES.init(this);
        this.BUTTONS.init(this);
        this.POPUPS.init(this);

    }

    preload ()
    {
        //console.log('DebugScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in some indexes for later use
        let typesIndex = MMRPG.Indexes.types;
        let robotsIndex = MMRPG.Indexes.robots;
        //console.log('typesIndex =', typesIndex);
        //console.log('robotsIndex =', robotsIndex);

        // Define a list of types safe for randomizing with
        this.safeTypeTokens = [];
        for (let typeToken in typesIndex){
            let typeData = typesIndex[typeToken];
            if (typeData.class !== 'normal'){ continue; }
            this.safeTypeTokens.push(typeToken);
        }

        // Define a list of players and robots we should preload
        this.allowRunningDoctors = true;
        this.allowSlidingMasters = true;
        this.runningDoctors = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.slidingMasters = ['mega-man', 'bass', 'proto-man', 'roll', 'disco', 'rhythm'];
        this.debugSprites = [];

        // Predefine a list of robot master tokens sorted into core type(s)
        this.masterTokensByCoreType = {};
        for (let robotToken in robotsIndex){
            let robotData = robotsIndex[robotToken];
            if (robotData.class === 'system'){ continue; }
            if (robotData.class !== 'master'){ continue; }
            if (!robotData.flag_complete){ continue; }
            if (!this.masterTokensByCoreType[robotData.core]){ this.masterTokensByCoreType[robotData.core] = []; }
            this.masterTokensByCoreType[robotData.core].push(robotToken);
            }
        //console.log('this.masterTokensByCoreType =', this.masterTokensByCoreType);

        // Preload all the necessary sprites for the scene
        let preloadSprites = {};
        preloadSprites.players = Object.values(this.runningDoctors);
        preloadSprites.robots = Object.values(this.slidingMasters);

        // DEBUG!!! Preload the entire robots index for testing
        for (let robotToken in robotsIndex){
            let robotData = robotsIndex[robotToken];
            if (robotData.class === 'system'){ continue; }
            if (!robotData.flag_complete){ continue; }
            preloadSprites.robots.push(robotToken);
            }

        // Also load type-specific sprites for any copy robots that have them
        let preloadMasters = Object.values(preloadSprites.robots);
        for (let i = 0; i < preloadMasters.length; i++){
            let robotToken = preloadMasters[i];
            let robotData = robotsIndex[robotToken];
            //console.log('robotToken =', robotToken, 'robotData =', robotData);
            if (robotData.core !== 'copy'){ continue; }
            for (let typeToken in typesIndex){
                if (this.safeTypeTokens.indexOf(typeToken) < 0){ continue; }
                var altToken = robotToken + '_' + typeToken;
                preloadSprites.robots.push(altToken);
                }
            }

        // Loop through the preload sprites and load them into memory
        for (let spriteKind in preloadSprites){
            let spriteTokens = preloadSprites[spriteKind];
            for (let i = 0; i < spriteTokens.length; i++){
                // pull the base token before we pase it
                let spriteToken = spriteTokens[i];
                // if the sprite token ends with an "*_{alt}", make sure we split and pull
                let spriteAlt = 'base';
                if (spriteToken.indexOf('_') !== -1){
                    let tokenParts = spriteToken.split('_');
                    spriteToken = tokenParts[0];
                    spriteAlt = tokenParts[1];
                    }
                // load whatever sprite we need based on above variables
                SPRITES.loadSprite(this, spriteKind, spriteToken, spriteAlt);
                }
            }

        //console.log('this.runningDoctors =', this.runningDoctors);
        //console.log('this.slidingMasters =', this.slidingMasters);

    }

    create ()
    {
        //console.log('DebugScene.create() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

        // Create the base canvas for which the rest of the game will be drawn
        var canvas = this.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);


        // DEBUG DEBUG DEBUG
        // <----------------

        // Draw the main banner and collect a reference to it
        var type = 'wily';
        var x = 15, y = 15;
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let mainBanner = new MainBanner(this, x, y, {
            fullsize: false,
            fillStyle: { color: xcolor },
            mainTextStyle: { fontSize: '16px' },
            depth: 100
            });
        this.mainBanner = mainBanner;

        // Draw a test banner and collect a reference to it
        var width = 350, height = 100;
        var x = MMRPG.canvas.width - width - 20;
        var y = MMRPG.canvas.height - height - 20;
        let testBanner = new Banner(this, x, y, {
            width: width,
            height: height,
            fillStyle: { color: 0x95c418 },
            borderRadius: { tl: 20, tr: 0, br: 60, bl: 0 },
            mainText: 'Test Banner',
            depth: 50
            });
        this.testBanner = testBanner;

        // Draw the battle banner and collect a reference to it
        var type = 'empty';
        var ref = this.mainBanner.getBounds();
        var x = ref.x, y = MMRPG.canvas.centerY - 90;
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let battleBanner = new BattleBanner(this, x, y, {
            height: 200,
            fillStyle: { color: xcolor },
            mainText: '',
            depth: 200
            });
        // Create a mask for the battle banner area that we can add sprites to
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0x660022);
        maskGraphics.fillRect(x, y, battleBanner.width, battleBanner.height);
        maskGraphics.setVisible(false);
        const bannerMask = maskGraphics.createGeometryMask();
        const spriteContainer = this.add.container();
        spriteContainer.setMask(bannerMask);
        spriteContainer.setDepth(210);
        this.battleBanner = battleBanner;
        this.battleBannerMask = bannerMask;
        this.battleBannerContainer = spriteContainer;

        // Create a back button so we can return to the title
        BUTTONS.makeSimpleButton('< Back to Title', {
            x: 50, y: 50,
            width: 150, height: 24,
            size: 8, color: 0x7d7d7d,
            depth: 8000
            }, function(){
            console.log('Back button clicked');
            ctx.scene.start('Title');
            });

        // Create a next button so we can go to the main scene
        BUTTONS.makeSimpleButton('Go to Main >', {
            x: 600, y: 50,
            width: 150, height: 24,
            size: 8, color: 0x7d7d7d,
            depth: 8000
            }, function(){
            console.log('Main button clicked');
            ctx.scene.start('Main');
            });

        // Create some debug buttons to trigger specific functionality for testing
        BUTTONS.makeSimpleButton('Welcome Home', {
            x: 50, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x7d7d7d,
            depth: 8000
            }, function(){
            console.log('Show Welcome Home button clicked');
            POPUPS.debugWelcomePopup();
            });
        BUTTONS.makeSimpleButton('Tales from the Void', {
            x: 450, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x95c418,
            depth: 8000
            }, function(){
            console.log('Show Tales from the Void button clicked');
            ctx.showTalesFromTheVoid();
            });


        BUTTONS.makeSimpleButton('Toggle Doctors Running', {
            x: 50, y: 150,
            width: 300, height: 24,
            size: 10, color: 0x00ff00,
            depth: 8000
            }, function(button){
            console.log('Toggle Doctors Running button clicked');
            if (ctx.allowRunningDoctors){
                button.text.setTint(0xff0000);
                ctx.allowRunningDoctors = false;
                } else {
                button.text.setTint(0x00ff00);
                ctx.allowRunningDoctors = true;
                }
            });
        BUTTONS.makeSimpleButton('Running Doctor', {
            x: 50, y: 180,
            width: 300, height: 24,
            size: 10, color: 0x0562bc,
            depth: 8000
            }, function(){
            console.log('Show Doctor Running button clicked');
            ctx.showDoctorRunning();
            });

        BUTTONS.makeSimpleButton('Toggle Masters Sliding', {
            x: 450, y: 150,
            width: 300, height: 24,
            size: 10, color: 0x00ff00,
            depth: 8000
            }, function(button){
            console.log('Toggle Masters Sliding button clicked');
            if (ctx.allowSlidingMasters){
                button.text.setTint(0xff0000);
                ctx.allowSlidingMasters = false;
                } else {
                button.text.setTint(0x00ff00);
                ctx.allowSlidingMasters = true;
                }
            });
        BUTTONS.makeSimpleButton('Sliding Master', {
            x: 450, y: 180,
            width: 300, height: 24,
            size: 10, color: 0x0562bc,
            depth: 8000
            }, function(){
            console.log('Show Master Sliding button clicked');
            ctx.showMasterSliding();
            });


        let $pauseButton = BUTTONS.makeSimpleButton('Pause', {
            x: MMRPG.canvas.centerX - 30, y: 70,
            width: 120, height: 24,
            size: 10, color: 0xcacaca,
            depth: 8100
            }, function(){
            console.log('Pause button clicked');
            ctx.scene.pause();
            });

        // -------- //

        var x = MMRPG.canvas.centerX, y = 40;
        var $loadText = this.add.bitmapText(x, y, 'megafont-white', 'Welcome to Debug', 16);
        $loadText.setOrigin(0.5);
        $loadText.setLetterSpacing(20);
        $loadText.setDepth(8200);

        var x = 20, y = MMRPG.canvas.height - 30;
        var lorem = 'Let go your earthly tether. Enter the void. Empty and become wind.';
        Strings.addPlainText(this, x, y, lorem);

        let typesTextPlain = 'Types:';
        for (let i = 0; i < typesIndexTokens.length; i++)
        {
            let typeToken = typesIndexTokens[i];
            let typeData = typesIndex[typeToken];
            typesTextPlain += (i > 0 ? ', ' : ' ') + typeData.name;
        }

        //lettersText = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z ';

        let panelConfig = {
            panelPadding: 20,
            panelHeight: 150,
            panelWidth: MMRPG.canvas.width - (20 * 2),
            panelX: 20,
            panelY: MMRPG.canvas.height - 150 - 20,
            panelRadius: { tl: 20, tr: 0, br: 20, bl: 0 },
            panelLineStyle: { width: 2, color: 0x0a0a0a },
            panelFillStyle: { color: 0x161616 },
            };

        let textConfig = {
            textPadding: 20,
            textWidth: panelConfig.panelWidth - (20 * 2),
            textHeight: panelConfig.panelHeight - (20 * 2),
            textPositionX: panelConfig.panelX + 20,
            textPositionY: panelConfig.panelY + 20
            };

        const $panelBack = this.add.graphics({ lineStyle: panelConfig.panelLineStyle, fillStyle: panelConfig.panelFillStyle });
        $panelBack.strokeRoundedRect(panelConfig.panelX, panelConfig.panelY, panelConfig.panelWidth, panelConfig.panelHeight, panelConfig.panelRadius);
        $panelBack.fillRoundedRect(panelConfig.panelX, panelConfig.panelY, panelConfig.panelWidth, panelConfig.panelHeight, panelConfig.panelRadius);

        const $panelText = this.add.text(textConfig.textPositionX, textConfig.textPositionY, typesTextPlain, {
            fontSize: 16,
            fontFamily: 'Open Sans',
            lineSpacing: 10,
            align: 'left',
            wordWrap: { width: textConfig.textWidth, useAdvancedWrap: true }
            });

        // ---------------->
        // DEBUG DEBUG DEBUG

        console.log('MMRPG = ', MMRPG);
        console.log('SPRITES =', SPRITES);

    }

    update (time, delta) {
        //console.log('DebugScene.update() called w/ time =', time, 'delta =', delta);

        if (typeof this.debugAddedSprites === 'undefined'){ this.debugAddedSprites = 0; }
        if (typeof this.debugRemovedSprites === 'undefined'){ this.debugRemovedSprites = 0; }

        //const activeSprites = this.battleBannerContainer.getAll().length;
        //console.log('activeSprites =', activeSprites);
        //console.log('this.debugAddedSprites =', this.debugAddedSprites);
        //console.log('this.debugRemovedSprites =', this.debugRemovedSprites);

        let ctx = this;
        let types = MMRPG.Indexes.types;
        let safeTypes = ctx.safeTypeTokens;
        //console.log('types =', typeof types, types);
        //console.log('safeTypes =', typeof safeTypes, safeTypes);

        // -- ANIMATE SWAYING MAIN BANNER -- //

        // Animate the main banner moving across the screen
        let mainBanner = this.mainBanner;
        if (!mainBanner.speed){ mainBanner.speed = 1/3; }
        if (!mainBanner.direction){ mainBanner.direction = 'right'; }
        var x = mainBanner.x,
            y = mainBanner.y,
            width = mainBanner.width,
            height = mainBanner.height,
            speed = mainBanner.speed,
            resize = (speed / 2),
            direction = mainBanner.direction
            ;
        if (direction === 'right'){
            if ((x + width) <= MMRPG.canvas.width){
                mainBanner.setPosition(x + speed, y + speed);
                mainBanner.setSize(width - resize, height - resize);
                } else {
                var type = 'copy'; //safeTypes[Math.floor(Math.random() * safeTypes.length)]; //'water';
                var typeInfo = types[type];
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'left';
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + typeInfo.name);
                if (ctx.allowRunningDoctors){
                    ctx.showDoctorRunning();
                    }
                if (ctx.allowSlidingMasters){
                    if (ctx.lastRunningDoctor === 'dr-light'){ this.showMasterSliding('mega-man'); }
                    else if (ctx.lastRunningDoctor === 'dr-wily'){ this.showMasterSliding('bass'); }
                    else if (ctx.lastRunningDoctor === 'dr-cossack'){ this.showMasterSliding('proto-man'); }
                    }
                }
            } else if (direction === 'left'){
            if (x >= 0){
                mainBanner.setPosition(x - speed, y - speed);
                mainBanner.setSize(width + resize, height + resize);
                } else {
                var type = 'none'; //safeTypes[Math.floor(Math.random() * safeTypes.length)]; //'nature';
                var typeInfo = types[type];
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'right';
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + typeInfo.name);
                if (ctx.allowRunningDoctors){
                    ctx.showDoctorRunning();
                    }
                if (ctx.allowSlidingMasters){
                    if (ctx.lastRunningDoctor === 'dr-light'){ this.showMasterSliding('roll'); }
                    else if (ctx.lastRunningDoctor === 'dr-wily'){ this.showMasterSliding('disco'); }
                    else if (ctx.lastRunningDoctor === 'dr-cossack'){ this.showMasterSliding('rhythm'); }
                    }
                }
            }

        // -- ANIMATE THE BOUNCING TEST BANNER -- //

        // Animate the test banner moving across the screen
        let testBanner = this.testBanner;
        if (!testBanner.directionX){ testBanner.directionX = 'right'; }
        if (!testBanner.directionY){ testBanner.directionY = 'down'; }
        var x = testBanner.x, y = testBanner.y;
        var xDir = testBanner.directionX, yDir = testBanner.directionY;
        var width = testBanner.width, height = testBanner.height;
        var speed = 50; // pixels per second
        var resize = 1;
        var movement = speed * (delta / 1000);
        if (xDir === 'right') { x += movement; }
        if (xDir === 'left') { x -= movement; }
        if (yDir === 'down') { y += movement; }
        if (yDir === 'up') { y -= movement; }
        testBanner.setPosition(x, y);
        var newDir = false;
        if (x >= (MMRPG.canvas.width - width)){ testBanner.directionX = 'left'; newDir = true; }
        if (x <= 0){ testBanner.directionX = 'right'; newDir = true; }
        if (y >= (MMRPG.canvas.height - height)){ testBanner.directionY = 'up'; newDir = true; }
        if (y <= 0){ testBanner.directionY = 'down'; newDir = true; }
        if (newDir){
            //console.log('Changing direction');
            var type = safeTypes[Math.floor(Math.random() * safeTypes.length)]; //'water';
            //console.log('type =', type, types[type]);
            var color = types[type]['colour_light'];
            var color2 = types[type]['colour_dark'];
            testBanner.setColor(color, color2);
            if (ctx.allowSlidingMasters){
                this.showMasterSliding(null, type);
                }
            }
        /*
        if (!testBanner.growth){ testBanner.growth = 1; }
        if (testBanner.growth > 0){
            testBanner.growth++;
            testBanner.setSize(width + resize, height + resize);
            if (testBanner.growth > 100){ testBanner.growth = -1; }
            } else if (testBanner.growth < 0){
            testBanner.growth--;
            testBanner.setSize(width - resize, height - resize);
            if (testBanner.growth < -100){ testBanner.growth = 1; }
            }
        */

    }

    showTalesFromTheVoid ()
    {
        console.log('DebugScene.showTalesFromTheVoid() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;

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
                if (ctx.allowRunningDoctors){
                    ctx.showDoctorRunning();
                    }
                }
            });

    }

    showDoctorRunning (token){

        //console.log('DebugScene.showDoctorRunning() called w/ token =', token);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Generate a sprite w/ running animation in progress
        let randKey = Math.floor(Math.random() * ctx.runningDoctors.length);
        let spriteToken = token || ctx.runningDoctors[randKey];
        let spriteAlt = 'base';
        // if the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }
        let spriteDir = 'right';
        let spriteKey = 'sprite-'+spriteDir;
        let spriteSheet = SPRITES.index.sheets.players[spriteToken][spriteAlt][spriteKey];
        let spriteRunAnim = SPRITES.index.anims.players[spriteToken][spriteAlt][spriteKey]['run'];
        let spriteX = - 40;
        let spriteY = MMRPG.canvas.centerY - 15;
        let $runningSprite = ctx.add.sprite(spriteX, spriteY, spriteSheet);
        ctx.debugAddedSprites++;
        $runningSprite.setOrigin(0.5, 1);
        $runningSprite.setDepth(ctx.battleBanner.depth + spriteY);
        //console.log(spriteToken, 'spriteY =', spriteY, 'depth =', $runningSprite.depth);
        $runningSprite.setScale(2.0);
        ctx.add.tween({
            targets: $runningSprite,
            y: '-=2',
            ease: 'Sine.easeInOut',
            duration: 200,
            repeat: -1,
            yoyo: true
            });
        $runningSprite.play(spriteRunAnim);
        if (typeof ctx.debugSprites === 'undefined'){ ctx.debugSprites = []; }
        ctx.debugSprites.push($runningSprite);
        let runningSpriteKey = ctx.debugSprites.length - 1;
        ctx.battleBannerContainer.add($runningSprite);
        ctx.battleBannerContainer.sort('depth');

        // Animate that sprite running across the screen then remove when done
        let spriteDestX = MMRPG.canvas.width + 40;
        let numSprites = Object.keys(ctx.debugSprites).length;
        let runDuration = 4000 + (numSprites * 200);
        if (numSprites >= 20){ runDuration /= 2; }
        //console.log('numSprites = ', numSprites);
        //console.log('runDuration = ', runDuration);
        ctx.add.tween({
            targets: $runningSprite,
            x: spriteDestX,
            ease: 'Linear',
            duration: runDuration,
            onComplete: function () {
                //console.log('Movement complete!');
                $runningSprite.destroy();
                ctx.debugRemovedSprites++;
                delete ctx.debugSprites[runningSpriteKey];
                }
            });

        // Update the scene with last-used sprite token
        ctx.lastRunningDoctor = spriteToken;

    }

    showMasterSliding (token, alt){

        //console.log('DebugScene.showMasterSliding() called w/ token =', token, 'alt =', alt);
        //console.log('ctx.masterTokensByCoreType['+alt+'] =', this.masterTokensByCoreType[alt]);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let robotsIndex = MMRPG.Indexes.robots;

        // Count the number of sliding sprites currently on the screen
        if (typeof ctx.debugSprites === 'undefined'){ ctx.debugSprites = []; }
        let numSprites = Object.keys(ctx.debugSprites).length;

        // Generate a sprite w/ sliding animation in progress
        let randTokens = typeof ctx.masterTokensByCoreType[alt] !== 'undefined' ? ctx.masterTokensByCoreType[alt] : ctx.slidingMasters;
        let randKey = Math.floor(Math.random() * randTokens.length);
        let spriteToken = token || randTokens[randKey];
        let spriteAlt = alt || 'base';
        let robotInfo = robotsIndex[spriteToken];
        //console.log('robotInfo for ', spriteToken, '=', robotInfo);

        // if the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }

        // ensure this alt actually exists on the robot in question
        //console.log('pending spriteToken =', spriteToken, 'pending spriteAlt =', spriteAlt);
        if (!SPRITES.index.sheets.robots[spriteToken][spriteAlt]){
            //console.log('Sprite alt not found, defaulting to base');
            spriteAlt = 'base';
            }

        //let spriteDir = 'right';
        //let spriteKey = 'sprite-'+spriteDir;
        //let spriteSheet = SPRITES.index.sheets.robots[spriteToken][spriteAlt][spriteKey];
        //let spriteSlideAnim = SPRITES.index.anims.robots[spriteToken][spriteAlt][spriteKey]['slide'];

        let robotSpriteToken = spriteToken;
        let robotSpriteAlt = spriteAlt;
        let robotSpriteInfo = {
            'sprite': {
                'left': {
                    'sheet': SPRITES.index.sheets.robots[robotSpriteToken][robotSpriteAlt]['sprite-left'],
                    'anim': {
                        'slide': SPRITES.index.anims.robots[robotSpriteToken][robotSpriteAlt]['sprite-left']['slide'],
                        'shoot': SPRITES.index.anims.robots[robotSpriteToken][robotSpriteAlt]['sprite-left']['shoot'],
                        },
                    },
                'right': {
                    'sheet': SPRITES.index.sheets.robots[robotSpriteToken][robotSpriteAlt]['sprite-right'],
                    'anim': {
                        'slide': SPRITES.index.anims.robots[robotSpriteToken][robotSpriteAlt]['sprite-right']['slide'],
                        'shoot': SPRITES.index.anims.robots[robotSpriteToken][robotSpriteAlt]['sprite-right']['shoot'],
                        },
                    },
                },
            'mug': {
                'left': {
                    'sheet': SPRITES.index.sheets.robots[robotSpriteToken][robotSpriteAlt]['mug-left'],
                    },
                'right': {
                    'sheet': SPRITES.index.sheets.robots[robotSpriteToken][robotSpriteAlt]['mug-right'],
                    },
                },
            };

        let abilityRand = Math.floor(Math.random() * 100);
        let abilitySuffix = abilityRand % 3 === 0 ? 'buster' : 'shot';
        let abilityElement = robotInfo.core !== '' && robotInfo.core !== 'copy' ? robotInfo.core : '';
        let abilitySpriteToken = abilityElement ? (abilityElement + '-' + abilitySuffix) : ('buster-shot');
        let abilityShotFrame = abilitySuffix === 'buster' ? 3 : 0;
        let abilityShotOffset = abilitySuffix === 'buster' ? 10 : 0;
        let abilitySpriteSheet = 1;
        //console.log(abilitySpriteToken, 'abilityRand:', abilityRand, 'abilitySuffix:', abilitySuffix, 'abilityElement:', abilityElement, 'abilityShotFrame:', abilityShotFrame);
        let abilitySpriteInfo = {
            'sprite': {
                'left': {
                    'sheet': SPRITES.index.sheets.abilities[abilitySpriteToken][abilitySpriteSheet]['sprite-left'],
                    },
                'right': {
                    'sheet': SPRITES.index.sheets.abilities[abilitySpriteToken][abilitySpriteSheet]['sprite-right'],
                    },
                },
            'icon': {
                'left': {
                    'sheet': SPRITES.index.sheets.abilities[abilitySpriteToken][abilitySpriteSheet]['icon-left'],
                    },
                'right': {
                    'sheet': SPRITES.index.sheets.abilities[abilitySpriteToken][abilitySpriteSheet]['icon-right'],
                    },
                },
            };
        //console.log('abilitySpriteToken =', abilitySpriteToken, 'abilitySpriteInfo =', abilitySpriteInfo);

        let spriteX = - 40 - (numSprites * 5);
        let spriteY = MMRPG.canvas.centerY + 30 + ((numSprites % 10) * 10);
        let $slidingSprite = ctx.add.sprite(spriteX, spriteY, robotSpriteInfo['sprite']['right']['sheet']);
        ctx.debugAddedSprites++;
        $slidingSprite.setOrigin(0.5, 1);
        $slidingSprite.setDepth(ctx.battleBanner.depth + spriteY);
        $slidingSprite.setScale(2.0);
        ctx.debugSprites.push($slidingSprite);
        let slidingSpriteKey = ctx.debugSprites.length - 1;
        ctx.battleBannerContainer.add($slidingSprite);
        ctx.battleBannerContainer.sort('depth');

        // Animate that sprite sliding across the screen then remove when done
        let slideDistance = (MMRPG.canvas.width / 3) * (robotInfo.speed / 100);
        let slideDestination = MMRPG.canvas.width + 40;
        let slideDuration = 2000 - (500 * (robotInfo.speed / 100));
        //if (numSprites >= 10){ slideDuration /= 2; }
        //console.log('numSprites = ', numSprites);
        //console.log('slideDuration = ', slideDuration);

        const slideSpriteForward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting forward slide movement for sprite!', spriteToken);
            $sprite.direction = 'right';
            if ($sprite.tween){ $sprite.tween.stop().destroy(); }
            let others = Object.keys(ctx.debugSprites).length;
            let newX = $sprite.x + distance;
            let overflow = 0;
            let delay = 1000;
            if (others >= 10){
                overflow = others - 10;
                delay -= overflow * 100;
                //duration -= overflow * (slideDuration / 100);
                if (delay < 0){ delay = 0; }
                //if (duration < 500){ duration = 500; }
                }
            $sprite.setFrame(0);
            $sprite.setTexture(robotSpriteInfo['sprite'][$sprite.direction]['sheet']);
            ctx.time.delayedCall(delay, function(){
                $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['slide']);
                $sprite.tween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial slide movement complete!');
                        slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                        }
                    });
                }, [], ctx);
            };
        const slideSpriteBackward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting backward slide movement for sprite!', spriteToken);
            $sprite.direction = 'left';
            if ($sprite.tween){ $sprite.tween.stop().destroy(); }
            let others = Object.keys(ctx.debugSprites).length;
            let newX = $sprite.x - distance;
            let overflow = 0;
            let delay = 1000;
            if (others >= 10){
                overflow = others - 10;
                delay -= overflow * 100;
                //duration -= overflow * (slideDuration / 100);
                if (delay < 0){ delay = 0; }
                //if (duration < 500){ duration = 500; }
                }
            $sprite.setFrame(0);
            $sprite.setTexture(robotSpriteInfo['sprite'][$sprite.direction]['sheet']);
            ctx.time.delayedCall(delay, function(){
                $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['slide']);
                $sprite.tween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial slide movement complete!');
                        slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                        }
                    });
                }, [], ctx);
            };
        const makeSpriteShoot = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting shooting movement for sprite!', spriteToken);

            // First we animate the robot doing a shoot animation w/ intentional pause after
            if ($sprite.tween){ $sprite.tween.stop().destroy(); }
            let newX = $sprite.x + ($sprite.direction === 'left' ? 4 : -4); //kickback
            $sprite.setFrame(0);
            $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['shoot']);
            $sprite.tween = ctx.add.tween({
                targets: $sprite,
                x: newX,
                ease: 'Linear',
                delay: 300,
                duration: 100,
                yoyo: true,
                onComplete: function () {
                    //console.log('Partial shooting movement complete!');
                    ctx.time.delayedCall(1000, function(){
                        //console.log('Partial shooting movement complete!');
                        slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                        });
                    }
                });

            // Then we prepare the shot sprite itself in the correct location and settings
            let shotX = $sprite.x + ($sprite.direction === 'left' ? -60 : 60);
            let shotY = $sprite.y + abilityShotOffset;
            let $shotSprite = ctx.add.sprite(shotX, shotY, abilitySpriteInfo['sprite'][$sprite.direction]['sheet']);
            ctx.debugAddedSprites++;
            //console.log('Shot sprite created at ', shotX, shotY, ' w/ ', abilitySpriteInfo);
            $shotSprite.setAlpha(0);
            $shotSprite.setOrigin(0.5, 1);
            $shotSprite.setDepth($sprite.depth + 1);
            $shotSprite.setScale(2.0);
            $shotSprite.setFrame(abilityShotFrame);
            ctx.debugSprites.push($shotSprite);
            let shotSpriteKey = ctx.debugSprites.length - 1;
            ctx.battleBannerContainer.add($shotSprite);
            ctx.battleBannerContainer.sort('depth');

            // Wait a moment for the robot to move into frame, then animate the shot going offscreen at predetermined speed
            let leftBounds = -40, rightBounds = MMRPG.canvas.width + 40;
            let distFromEdge = $sprite.direction === 'left' ? $sprite.x - leftBounds : rightBounds - $sprite.x;
            let shotDestX = $sprite.direction === 'left' ? leftBounds : rightBounds;
            let shotDuration = (distFromEdge * 1.5);
            $sprite.fx = $sprite.preFX.addColorMatrix();
            $sprite.fx.brightness(3.0);
            $sprite.tween2 = ctx.tweens.addCounter({
                from: 0,
                to: 3,
                duration: 400,
                delay: 200,
                loop: -1,
                yoYo: true,
                onUpdate: () => {
                    $sprite.fx.brightness($sprite.tween2.getValue());
                    }
                });
            ctx.time.delayedCall(400, function(){
                $sprite.fx.reset();
                $sprite.tween2.remove();
                $shotSprite.setAlpha(0.3);
                $shotSprite.setFrame(abilityShotFrame);
                //console.log(robotSpriteToken, 'fired off a', abilitySpriteToken);
                $shotSprite.tween = ctx.add.tween({
                    targets: $shotSprite,
                    x: shotDestX,
                    alpha: 1.0,
                    ease: 'Sine.easeOut',
                    duration: shotDuration,
                    onComplete: function () {
                        //console.log('Shot movement complete!');
                        $shotSprite.destroy();
                        ctx.debugRemovedSprites++;
                        delete ctx.debugSprites[shotSpriteKey];
                        }
                    });
                });

            };
        const slideSpriteSomewhere = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting random slide movement for sprite!', spriteToken, 'x:', $sprite.x);
            let safeZone = 40;
            if ($sprite.x >= (MMRPG.canvas.xMax + safeZone)
                || $sprite.x <= (MMRPG.canvas.xMin - safeZone)){
                return onComplete($sprite);
                } else if ($sprite.x > MMRPG.canvas.xMax){
                return slideSpriteForward($sprite, distance, destination, duration, onComplete);
                } else if ($sprite.x < MMRPG.canvas.xMin){
                return slideSpriteBackward($sprite, distance, destination, duration, onComplete);
                } else {
                let backChance = Math.random() * 100;
                if (backChance < 33){
                    return makeSpriteShoot($sprite, distance, destination, duration, onComplete);
                    } else if (backChance < 66){
                    return slideSpriteBackward($sprite, distance, destination, duration, onComplete);
                    } else {
                    return slideSpriteForward($sprite, distance, destination, duration, onComplete);
                    }
                }
            };

        $slidingSprite.direction = 'right';
        $slidingSprite.play(robotSpriteInfo['sprite'][$slidingSprite.direction]['anim']['slide']);
        slideSpriteForward($slidingSprite, slideDistance, slideDestination, slideDuration, function($slidingSprite){
            //console.log('Full sliding movement complete!');
            $slidingSprite.destroy();
            ctx.debugRemovedSprites++;
            delete ctx.debugSprites[slidingSpriteKey];
            });

        /*
        // Listen to frame change events
        $slidingSprite.on('animationupdate', (animation, frame) => {
            if (frame.index === 0) { $slidingSprite.tween.pause();  }
            else { $slidingSprite.tween.resume(); }
            if (frame.index >= 2) {  $slidingSprite.tween.setTimeScale(2);  }
            else { $slidingSprite.tween.setTimeScale(1);  }
            });
        */

        // Update the scene with last-used sprite token
        ctx.lastSlidingMaster = spriteToken;

    }

    // Define a function for testing DOM-based text and styling options to see if they work
    testDomTextStyles (ctx){

        // Add some basic text styles to the DOM for testing
        let styleMarkup = '';
        styleMarkup += `.text {
            font-family: 'Open Sans', monospace;
            font-size: 16px;
            line-height: 1.6;
            text-align: center;
            white-space: normal;
            outline: 1px dotted red;
            }
        .text.center {
            text-align: center;
            }
        .text.left {
            text-align: left;
            }
        .text.right {
            text-align: right;
            }
        .text.in-popup {
            font-size: 16px;
            line-height: 1.6;
            } `;
        let styleElement = document.createElement('style');
        styleElement.innerHTML = styleMarkup;
        document.head.appendChild(styleElement);

        // Display a rectangular dialogue box with all the types listed inside
        let panelPadding = 20,
            panelHeight = 240,
            panelWidth = MMRPG.canvas.width - (panelPadding * 2),
            panelX = panelPadding,
            panelY = MMRPG.canvas.height - panelHeight - panelPadding,
            //panelCenterX = panelX - panelWidth / 2,
            //panelCenterY = panelY - panelHeight / 2,
            panelRadius = { tl: 20, tr: 0, br: 20, bl: 0 }
            ;
        const $panelBack = this.add.graphics({ lineStyle: { width: 2, color: 0x0a0a0a }, fillStyle: { color: 0x161616 }});
        //$panelBack.strokeRect(panelCenterX, panelY, panelWidth, panelHeight);
        //$panelBack.fillRect(panelCenterX, panelY, panelWidth, panelHeight);
        $panelBack.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        $panelBack.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        let typeTokens = Object.keys(MMRPG.Indexes.types);
        let typesText = 'Types:';
        for (let i = 0; i < typeTokens.length; i++)
        {
            let typeToken = typeTokens[i];
            let typeData = MMRPG.Indexes.types[typeToken];
            typesText += (i > 0 ? ', ' : ' ') + typeData.name;
        }

        var typesIndex = MMRPG.Indexes.types;
        this.generateTypeStyles(this, typesIndex);

        // Predefine some variables for the text positioning
        let textPadding = 20,
            textWidth = panelWidth - (textPadding * 2),
            textHeight = panelHeight - (textPadding * 2),
            textPositionX = panelX + textPadding,
            textPositionY = panelY + textPadding
            ;
        //console.log('panelWidth = ', panelWidth, 'panelHeight = ', panelHeight, 'panelX = ', panelX, 'panelY = ', panelY);
        //console.log('textWidth = ', textWidth, 'textHeight = ', 'textPadding = ', textPadding, textHeight, 'textPositionX = ', textPositionX, 'textPositionY = ', textPositionY);

        // Position a rich-text object on top of the panel rectangle
        var textDiv = document.createElement('div');
        var textClasses = ['text', 'left', 'is-rich', 'in-popup'];
        var textStyles = {'width': textWidth + 'px', 'height': textHeight + 'px'};
        textDiv.innerHTML = typesText;
        textDiv.innerHTML += ' | <strong class="type water">This should appear in bold!</strong>';
        textDiv.innerHTML += ' | <em class="type water flame">This should appear in italic!</em>';
        textDiv.className = textClasses.join(' ');
        textDiv.setAttribute('style', Object.keys(textStyles).map(function(key){ return key + ':' + textStyles[key]; }).join(';'));
        var $textElement = this.add.dom(textPositionX, textPositionY, textDiv);
        $textElement.setOrigin(0, 0);

    }

    generateTypeStyles (ctx){
        var typesIndex = MMRPG.Indexes.types;
        let types = Object.keys(typesIndex);
        let styleMarkup = '';
        styleMarkup += `.type {
            display: inline-block;
            padding: 0 6px;
            border: 1px solid transparent;
            border-radius: 3px;
            } `;
        // Loop through all the types and generate the necessary styles
        for (let i = 0; i < types.length; i++){
            let type = types[i];
            let typeData = typesIndex[type];
            let darkColour = typeData.colour_dark;
            let lightColour = typeData.colour_light;
            // Generate a style for the base colour of the type as a text colour
            styleMarkup += '.color.' + type + ' { ';
                styleMarkup += 'color: rgb(' + lightColour.join(',') + ') !important; ';
            styleMarkup += '} \n';
            // Generate styles for using the one or two types as the background of the text colour
            styleMarkup += '.type.' + type + ' { ';
                styleMarkup += 'border-color: rgb(' + darkColour.join(',') + ') !important; ';
                styleMarkup += 'background-color: rgb(' + lightColour.join(',') + ') !important; ';
            styleMarkup += '} \n';
            for (let j = 0; j < types.length; j++){
                let type2 = types[j];
                if (type2 === type){ continue; }
                let typeData2 = typesIndex[type2];
                let darkColour2 = typeData2.colour_dark;
                let lightColour2 = typeData2.colour_light;
                styleMarkup += '.type.' + type + '.' + type2 + ' { ';
                    styleMarkup += 'border-color: rgb(' + darkColour.join(',') + ') !important; ';
                    styleMarkup += 'background-color: rgb(' + lightColour.join(',') + ') !important; ';
                    styleMarkup += 'background-image: -webkit-gradient(linear, left top, right top, color-stop(0, rgb(' + lightColour.join(',') + ')), color-stop(1, rgb(' + lightColour2.join(',') + '))) !important; ';
                    styleMarkup += 'background-image: -o-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -moz-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -webkit-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -ms-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: linear-gradient(to right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                styleMarkup += '} \n';
                }

            }

        let styleElement = document.createElement('style');
        styleElement.innerHTML = styleMarkup;
        document.head.appendChild(styleElement);
        //console.log('styleMarkup = ', styleMarkup);
        return styleElement;

    }

}