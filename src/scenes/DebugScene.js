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
        this.copySafeTypeTokens = [];
        for (let typeToken in typesIndex){
            let typeData = typesIndex[typeToken];
            if (typeData.class !== 'normal'){ continue; }
            this.safeTypeTokens.push(typeToken);
        }
        this.safeTypeTokens.push('none');

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
            let robotCore = robotData.core || 'none';
            if (robotData.class === 'system'){ continue; }
            if (robotData.class !== 'master'){ continue; }
            if (!robotData.flag_complete){ continue; }
            if (!this.masterTokensByCoreType[robotCore]){ this.masterTokensByCoreType[robotCore] = []; }
            this.masterTokensByCoreType[robotCore].push(robotToken);
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
                if (this.copySafeTypeTokens.indexOf(typeToken) < 0){ continue; }
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

        // -- TITLE -- //

        var x = MMRPG.canvas.centerX, y = 40;
        var $loadText = this.add.bitmapText(x, y, 'megafont-white', 'Welcome to Debug', 16);
        $loadText.setOrigin(0.5);
        $loadText.setLetterSpacing(20);
        $loadText.setDepth(8200);

        // -- BUTTONS -- //

        window.setCurrentGameScene(ctx);
        let pauseTimeout = null;
        let $pauseButton = BUTTONS.makeSimpleButton('PAUSE', {
            x: MMRPG.canvas.centerX - 50, y: 70,
            width: 120, height: 24,
            size: 10, color: '#cacaca',
            depth: 8100
            }, function(){
            //console.log('Pause button clicked');
            window.toggleGameIsClickable(false);
            window.toggleGameIsRunning(false);
            ctx.scene.pause();
            if (pauseTimeout){ clearTimeout(pauseTimeout); }
            pauseTimeout = setTimeout(function(){
                window.toggleGameIsClickable(true);
                }, 1000);
            });

        // Create a back button so we can return to the title
        BUTTONS.makeSimpleButton('< Back to Title', {
            x: 50, y: 50,
            width: 150, height: 24,
            size: 8, color: '#7d7d7d',
            depth: 8000
            }, function(){
            //console.log('Back button clicked');
            ctx.scene.start('Title');
            });

        // Create a next button so we can go to the main scene
        BUTTONS.makeSimpleButton('Go to Main >', {
            x: 600, y: 50,
            width: 150, height: 24,
            size: 8, color: '#7d7d7d',
            depth: 8000
            }, function(){
            //console.log('Main button clicked');
            ctx.scene.start('Main');
            });

        // Create some debug buttons to trigger specific functionality for testing
        BUTTONS.makeSimpleButton('Welcome Home', {
            x: 50, y: 100,
            width: 300, height: 24,
            size: 13, color: '#7d7d7d',
            depth: 8000
            }, function(){
            //console.log('Show Welcome Home button clicked');
            POPUPS.debugWelcomePopup();
            });
        BUTTONS.makeSimpleButton('Tales from the Void', {
            x: 450, y: 100,
            width: 300, height: 24,
            size: 13, color: '#95c418',
            depth: 8000
            }, function(){
            //console.log('Show Tales from the Void button clicked');
            ctx.showTalesFromTheVoid();
            });

        BUTTONS.makeSimpleButton('Toggle Doctor Stream', {
            x: 50, y: 150,
            width: 300, height: 24,
            size: 11, color: '#00ff00',
            depth: 8000
            }, function(button){
            //console.log('Toggle Doctors Running button clicked');
            if (ctx.allowRunningDoctors){
                button.text.setTint(0xff0000);
                //button.text.setColor('#ff0000');
                ctx.allowRunningDoctors = false;
                } else {
                button.text.setTint(0x00ff00);
                //button.text.setColor('#00ff00');
                ctx.allowRunningDoctors = true;
                }
            });
        BUTTONS.makeSimpleButton('Running Doctor', {
            x: 50, y: 180,
            width: 300, height: 24,
            size: 13, color: '#6592ff',
            depth: 8000
            }, function(){
            //console.log('Show Doctor Running button clicked');
            ctx.showDoctorRunning();
            });

        BUTTONS.makeSimpleButton('Toggle Master Stream', {
            x: 450, y: 150,
            width: 300, height: 24,
            size: 11, color: '#00ff00',
            depth: 8000
            }, function(button){
            //console.log('Toggle Masters Sliding button clicked');
            if (ctx.allowSlidingMasters){
                button.text.setTint(0xff0000);
                //button.text.setColor('#ff0000');
                ctx.allowSlidingMasters = false;
                } else {
                button.text.setTint(0x00ff00);
                //button.text.setColor('#00ff00');
                ctx.allowSlidingMasters = true;
                }
            });
        BUTTONS.makeSimpleButton('Sliding Master', {
            x: 450, y: 180,
            width: 300, height: 24,
            size: 13, color: '#6592ff',
            depth: 8000
            }, function(){
            //console.log('Show Master Sliding button clicked');
            ctx.showMasterSliding();
            });


        // -- BANNERS -- //

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

        // -- TYPES PANEL -- //

        //this.addTestTypesPanel();

        var x = 20, y = MMRPG.canvas.height - 190;
        var width = MMRPG.canvas.width - 40, height = 150;
        this.addPanelWithTypeButtons({
            x: x,
            y: y,
            width: width,
            height: height,
            types: this.safeTypeTokens,
            onClick: function(button, type){
                console.log('Wow! Type button clicked!', 'type:', type, 'button:', button);
                }
            });

        // -- DEBUG TEXT -- //

        var x = 20, y = MMRPG.canvas.height - 30;
        var lorem = 'Let go your earthly tether. Enter the void. Empty and become wind.';
        Strings.addPlainText(this, x, y, lorem, {color: '#000000'});

        // We should also show the current version just to be safe
        var x = MMRPG.canvas.width - 100, y = MMRPG.canvas.height - 26;
        var version = 'v ' + MMRPG.version;
        let $version = Strings.addPlainText(this, x, y, version, {color: '#000000', fontSize: '12px'});
        $version.x = MMRPG.canvas.width - $version.width - 20;

        // ---------------->
        // DEBUG DEBUG DEBUG

        console.log('MMRPG = ', MMRPG);
        console.log('SPRITES =', SPRITES);
        //Graphics.test();
        //Strings.test();

    }

    update (time, delta) {
        //console.log('DebugScene.update() called w/ time =', time, 'delta =', delta);

        if (typeof this.debugAddedSprites === 'undefined'){ this.debugAddedSprites = 0; }
        if (typeof this.debugRemovedSprites === 'undefined'){ this.debugRemovedSprites = 0; }

        const activeSprites = this.battleBannerContainer.getAll();
        const activeSpritesLength = activeSprites.length;
        //console.log('activeSprites =', activeSprites);
        //console.log('activeSpritesLength =', activeSpritesLength);
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
                if (ctx.allowRunningDoctors){ ctx.showDoctorRunning(); }
                if (ctx.allowSlidingMasters){
                    var doctor = ctx.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showMasterSliding(master);
                    }
                var type = 'copy';
                var typeInfo = types[type];
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'left';
                mainBanner.type = type;
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + typeInfo.name);
                }
            } else if (direction === 'left'){
            if (x >= 0){
                mainBanner.setPosition(x - speed, y - speed);
                mainBanner.setSize(width + resize, height + resize);
                } else {
                if (ctx.allowRunningDoctors){ ctx.showDoctorRunning(); }
                if (ctx.allowSlidingMasters){
                    var doctor = ctx.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showMasterSliding(master);
                    }
                var type = 'none';
                var typeInfo = types[type];
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'right';
                mainBanner.type = type;
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + typeInfo.name);
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
        //console.log('DebugScene.showTalesFromTheVoid() called');

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
                //console.log('Tales from the Void completed');
                if (ctx.allowRunningDoctors){
                    ctx.showDoctorRunning();
                    }
                }
            });

    }

    // Define a function that generates a sprite of a player and animates it running across the screen
    showDoctorRunning (token)
    {
        //console.log('DebugScene.showDoctorRunning() called w/ token =', token);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let playerSheets = SPRITES.index.sheets.players;
        let playerAnims = SPRITES.index.anims.players;
        let playersIndex = MMRPG.Indexes.players;

        // Generate a sprite w/ running animation in progress
        let randKey = Math.floor(Math.random() * ctx.runningDoctors.length);
        let spriteToken = token || ctx.runningDoctors[randKey];
        let spriteAlt = 'base';
        let playerInfo = playersIndex[spriteToken];
        //console.log('playerInfo for ', spriteToken, '=', playerInfo);

        // If the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }

        // Ensure this alt actually exists on the player in question
        //console.log('pending spriteToken =', spriteToken, 'pending spriteAlt =', spriteAlt);
        if (!playerSheets[spriteToken][spriteAlt]){
            //console.log('Sprite alt not found, defaulting to base');
            spriteAlt = 'base';
            }

        // Define the base variables for this player animation sequence
        let spriteDir = 'right';
        let spriteKey = 'sprite-'+spriteDir;
        let spriteSheet = playerSheets[spriteToken][spriteAlt][spriteKey];
        let spriteRunAnim = playerAnims[spriteToken][spriteAlt][spriteKey]['run'];
        let spriteX = - 40;
        let spriteY = this.battleBanner.y + 70; //MMRPG.canvas.centerY - 15;

        // Create the sprite and add it to the scene
        let $runningSprite = ctx.add.sprite(spriteX, spriteY, spriteSheet);
        ctx.debugSprites.push($runningSprite);
        $runningSprite.debugKey = ctx.debugSprites.length - 1;
        ctx.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $runningSprite.subTweens = {};
        $runningSprite.subTimers = {};
        $runningSprite.subSprites = {};

        // Set the origin, scale, and depth for the sprite then add to parent container
        $runningSprite.setOrigin(0.5, 1);
        $runningSprite.setScale(2.0);
        $runningSprite.setDepth(ctx.battleBanner.depth + spriteY);
        ctx.battleBannerContainer.add($runningSprite);
        ctx.battleBannerContainer.sort('depth');

        // Apply effects and setup the frame
        $runningSprite.preFX.addShadow();
        $runningSprite.play(spriteRunAnim);

        // Animate the doctor bouncing up and down as they walk forward
        $runningSprite.subTweens.bounceTween = ctx.add.tween({
            targets: $runningSprite,
            y: {from: spriteY, to: spriteY - 2},
            ease: 'Stepped',
            delay: 300,
            repeatDelay: 200,
            duration: 200,
            repeat: -1,
            yoyo: true,
            });

        // Animate that sprite running across the screen then remove when done
        let runSpeed = (((100) + playerInfo.speed) - playerInfo.defense);
        let runSpeedMultiplier = (runSpeed / 100);
        let runDistance = (MMRPG.canvas.width / 4) * runSpeedMultiplier;
        let runDestination = MMRPG.canvas.width + 40;
        let runDuration = (runDestination / runDistance) * 1000; //5000 - (500 * runSpeedMultiplier);
        //console.log(playerInfo.token, 'runSpeed:', runSpeed, 'runSpeedMultiplier:', runSpeedMultiplier, 'runDistance:', runDistance, 'runDuration:', runDuration);

        // Animate that sprite using the previously defined variables
        $runningSprite.subTweens.runTween = ctx.add.tween({
            targets: $runningSprite,
            x: runDestination,
            ease: 'Linear',
            duration: runDuration,
            onComplete: function () {
                //console.log(playerInfo.name + ' running movement complete!');
                ctx.destroySpriteAndCleanup($runningSprite);
                }
            });

        // Update the scene with last-used sprite token
        ctx.lastRunningDoctor = spriteToken;

    }

     // Define a function that generates a sprite of a robot and animates it sliding across the screen
    showMasterSliding (token, alt)
    {
        //console.log('DebugScene.showMasterSliding() called w/ token =', token, 'alt =', alt);
        //console.log('ctx.masterTokensByCoreType['+alt+'] =', this.masterTokensByCoreType[alt]);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let robotSheets = SPRITES.index.sheets.robots;
        let robotAnims = SPRITES.index.anims.robots;
        let robotsIndex = MMRPG.Indexes.robots;
        let abilitiesIndex = MMRPG.Indexes.abilities;

        // Count the number of sliding sprites currently on the screen
        let numSprites = ctx.debugAddedSprites - ctx.debugRemovedSprites;

        // Generate a list of random tokens to pull from should it be necessary
        let randTokens = [];
        if (this.safeTypeTokens.indexOf(alt) >= 0){
            if (typeof ctx.masterTokensByCoreType[alt] !== 'undefined'
                && ctx.masterTokensByCoreType[alt].length > 0){
                randTokens = randTokens.concat(ctx.masterTokensByCoreType[alt]);
                alt = '';
                } else if (typeof ctx.masterTokensByCoreType['copy'] !== 'undefined'
                && ctx.masterTokensByCoreType['copy'].length > 0){
                randTokens = randTokens.concat(ctx.masterTokensByCoreType['copy']);
                }
            }
        if (!randTokens.length){ randTokens = randTokens.concat(ctx.slidingMasters); }
        let randKey = Math.floor(Math.random() * randTokens.length);

        // Collect the sprite token and alt if provided, else rely on the random key
        let spriteToken = token || randTokens[randKey];
        let spriteAlt = alt || 'base';

        // If the sprite token ends with an "*_{alt}", make sure we parse it out
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }

        // Pull the robot data for the token we're using
        let robotInfo = robotsIndex[spriteToken];
        //console.log('robotInfo for ', spriteToken, '=', robotInfo);

        // Ensure the selected alt actually exists on the robot in question, else default to base
        //console.log('pending spriteToken =', spriteToken, 'pending spriteAlt =', spriteAlt);
        if (!robotSheets[spriteToken][spriteAlt]){
            //console.log('Sprite alt not found, defaulting to base');
            spriteAlt = 'base';
            }

        // Define the robot-specific details for this animation sequence
        let robotSpriteToken = spriteToken;
        let robotSpriteAlt = spriteAlt;
        let robotSpriteInfo = SPRITES.getSpriteInfo('robot', robotSpriteToken, robotSpriteAlt);
        //console.log('robotSpriteInfo = ', robotSpriteInfo);

        // Define the ability-specific details for potential animation sequence
        let abilityRand = Math.floor(Math.random() * 100);
        let abilitySuffix = abilityRand % 3 === 0 ? 'buster' : 'shot';
        let abilityElement = robotInfo.core !== '' && robotInfo.core !== 'copy' ? robotInfo.core : '';
        let abilitySpriteToken = abilityElement ? (abilityElement + '-' + abilitySuffix) : ('buster-shot');
        let abilitySpriteInfo = SPRITES.getSpriteInfo('ability', abilitySpriteToken, 1);
        //console.log(abilitySpriteToken, 'abilityRand:', abilityRand, 'abilitySuffix:', abilitySuffix, 'abilityElement:', abilityElement);
        //console.log('abilitySpriteToken =', abilitySpriteToken, 'abilitySpriteInfo =', abilitySpriteInfo);

        // Pull the ability data for the token we're using
        let abilityInfo = abilitiesIndex[abilitySpriteToken];
        //console.log('abilityInfo for ', abilitySpriteToken, '=', abilityInfo);

        // Define the base coordinates for the sprite to be added
        let spriteX = - 40 - ((numSprites % 10) * 5);
        let spriteY = this.battleBanner.y + 90 + ((numSprites % 10) * 10);

        // Create the new sliding sprite and add it to the scene
        let $slidingSprite = ctx.add.sprite(spriteX, spriteY, robotSpriteInfo['sprite']['right']['sheet']);
        ctx.debugSprites.push($slidingSprite);
        $slidingSprite.debugKey = ctx.debugSprites.length - 1;
        ctx.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $slidingSprite.subTweens = {};
        $slidingSprite.subTimers = {};
        $slidingSprite.subSprites = {};

        // Set the origin, scale, and depth for the sprite then add to parent container
        $slidingSprite.setOrigin(0.5, 1);
        $slidingSprite.setScale(2.0);
        $slidingSprite.setDepth(ctx.battleBanner.depth + spriteY);
        ctx.battleBannerContainer.add($slidingSprite);
        ctx.battleBannerContainer.sort('depth');

        // Add effects and setup the frame for the sliding sprite
        $slidingSprite.preFX.addShadow();
        $slidingSprite.setFrame(0);

        // Animate that sprite sliding across the screen then remove when done
        let slideSpeed = robotInfo.speed;
        let slideSpeedMultiplier = (slideSpeed / 100);
        let slideDistance = (MMRPG.canvas.width / 3) * slideSpeedMultiplier;
        let slideDestination = MMRPG.canvas.width + 40;
        let slideDuration = 2000 - (500 * slideSpeedMultiplier);
        //if (numSprites >= 10){ slideDuration /= 2; }
        //console.log('numSprites = ', numSprites);
        //console.log('slideDuration = ', slideDuration);

        // Define a function for sliding a given sprite forward, then calling another function to slide it somewhere else
        const slideSpriteForward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting forward slide movement for sprite!', spriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));
            $sprite.direction = 'right';
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
            if ($sprite.subTimers.slideDelay){ $sprite.subTimers.slideDelay.remove(); }
            $sprite.subTimers.slideDelay = ctx.time.delayedCall(delay, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                //console.log('$sprite:', typeof $sprite, $sprite);
                $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['slide']);
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial shooting movement complete...');
                        if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                        $sprite.subTimers.nextAction = ctx.time.delayedCall(1000, function(){
                            //console.log('...let\'s slide somewhere else!');
                            slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                            delete $sprite.subTimers.nextAction;
                            });
                        }
                    });
                }, [], ctx);
            };

        // Define a function for sliding a given sprite backward, then calling another function to slide it somewhere else
        const slideSpriteBackward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting backward slide movement for sprite!', spriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));
            $sprite.direction = 'left';
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
            if ($sprite.subTimers.slideDelay){ $sprite.subTimers.slideDelay.remove(); }
            $sprite.subTimers.slideDelay = ctx.time.delayedCall(delay, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                //console.log('$sprite:', typeof $sprite, $sprite);
                $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['slide']);
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial shooting movement complete...');
                        if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                        $sprite.subTimers.nextAction = ctx.time.delayedCall(1000, function(){
                            //console.log('...let\'s slide somewhere else!');
                            slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                            delete $sprite.subTimers.nextAction;
                            });
                        }
                    });
                }, [], ctx);
            };

        // Define a function that makes a given sprite perform a shoot animation and then move w/ a slide
        let abilityShotSprites = [];
        const makeSpriteShoot = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting shooting movement for sprite!', spriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

            // Calculate where we're going to draw the shot sprite itself given context
            let shotOffset = abilitySuffix === 'buster' ? 10 : 0;
            let shotX = $sprite.x + ($sprite.direction === 'left' ? -60 : 60);
            let shotY = $sprite.y + shotOffset;

            // First create the shot sprite and add it to the scene
            let $shotSprite = ctx.add.sprite(shotX, shotY, abilitySpriteInfo['sprite'][$sprite.direction]['sheet']);
            ctx.debugSprites.push($shotSprite);
            $shotSprite.debugKey = ctx.debugSprites.length - 1;
            ctx.debugAddedSprites++;
            $shotSprite.setOrigin(0.5, 1);
            $shotSprite.setScale(2.0);
            $shotSprite.setDepth($sprite.depth + 1);
            ctx.battleBannerContainer.add($shotSprite);
            ctx.battleBannerContainer.sort('depth');

            // Add required sub-objects to the sprite
            $shotSprite.subTweens = {};
            $shotSprite.subTimers = {};
            $shotSprite.subSprites = {};

            // Apply effects and setup the frame
            let shotFrame = abilitySuffix === 'buster' ? 3 : 0;
            $shotSprite.preFX.addShadow();
            $shotSprite.setAlpha(0);
            $shotSprite.setFrame(shotFrame);

            // Add this shot sprite as a child of the parent
            abilityShotSprites.push($shotSprite);
            $shotSprite.shotKey = abilityShotSprites.length - 1;

            // Now we animate the kickback of the shoot animation w/ intentional pause after
            let newX = $sprite.x + ($sprite.direction === 'left' ? 4 : -4); //kickback
            $sprite.setFrame(0);
            $sprite.play(robotSpriteInfo['sprite'][$sprite.direction]['anim']['shoot']);
            if ($sprite.subTweens.kickbackTween){ $sprite.subTweens.kickbackTween.stop().destroy(); }
            $sprite.subTweens.kickbackTween = ctx.add.tween({
                targets: $sprite,
                x: newX,
                ease: 'Linear',
                delay: 300,
                duration: 100,
                yoyo: true,
                onComplete: function () {
                    //console.log('Partial shooting movement complete!');
                    if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                    $sprite.subTimers.nextAction = ctx.time.delayedCall(1000, function(){
                        //console.log('Partial shooting movement complete!');
                        slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                        delete $sprite.subTimers.nextAction;
                        });
                    }
                });

            // Then animate the robot flashing brightly back and forth to simulate charging
            let leftBounds = -40, rightBounds = MMRPG.canvas.width + 40;
            let distFromEdge = $sprite.direction === 'left' ? $sprite.x - leftBounds : rightBounds - $sprite.x;
            let shotDestX = $sprite.direction === 'left' ? leftBounds : rightBounds;
            let shotDuration = (distFromEdge * 1.5);
            $sprite.fx = $sprite.preFX.addColorMatrix();
            $sprite.fx.brightness(3.0);
            $sprite.subTweens.chargeTween = ctx.tweens.addCounter({
                from: 0,
                to: 3,
                duration: 400,
                delay: 200,
                loop: -1,
                yoyo: true,
                onUpdate: () => {
                    $sprite.fx.brightness($sprite.subTweens.chargeTween.getValue());
                    }
                });
            $sprite.subTimers.afterCharge = ctx.time.delayedCall(400, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                $sprite.fx.reset();
                $sprite.subTweens.chargeTween.remove();
                });

            // Wait a moment for the robot to finish its kickback, then animate the shot going offscreen at predetermined speed
            $shotSprite.subTimers.bulletTween = ctx.time.delayedCall(400, function(){
                if (!$shotSprite){ return; }
                $shotSprite.setAlpha(0.3);
                $shotSprite.setFrame(shotFrame);
                $shotSprite.subTweens.bulletTween = ctx.add.tween({
                    targets: $shotSprite,
                    x: shotDestX,
                    alpha: 1.0,
                    ease: 'Sine.easeOut',
                    duration: shotDuration,
                    onComplete: function () {
                        //console.log(robotInfo.name + '\'s ' + abilityInfo.name + ' movement complete!');
                        ctx.destroySprite($shotSprite);
                        }
                    });
                });

            };

        // Define a function that takes a given sprite and then randomly slides it forward or backward
        // (other actions may occasionally be taken as well, such as shooting or other animations)
        let safeZone = 40;
        let safeZoneMinX = MMRPG.canvas.xMin - safeZone;
        let safeZoneMaxX = MMRPG.canvas.xMax + safeZone;
        const slideSpriteSomewhere = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting random movement for sprite!', spriteToken, 'x:', $sprite.x, 'xMin:', safeZoneMinX, 'xMax:', safeZoneMaxX);
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));
            if (!$sprite
                || $sprite.toBeDestroyed
                || $sprite.x >= safeZoneMaxX
                || $sprite.x <= safeZoneMinX){
                return onComplete($sprite);
                } else if ($sprite.x >= (MMRPG.canvas.xMax - 20)){
                return slideSpriteForward($sprite, distance, destination, duration, onComplete);
                } else if ($sprite.x < (MMRPG.canvas.xMin + 20)){
                return slideSpriteBackward($sprite, distance, destination, duration, onComplete);
                } else {
                let backChance = Math.random() * 100;
                if (backChance >= 50){
                    return slideSpriteForward($sprite, distance, destination, duration, onComplete);
                    } else if (backChance >= 25){
                    return makeSpriteShoot($sprite, distance, destination, duration, onComplete);
                    } else {
                    return slideSpriteBackward($sprite, distance, destination, duration, onComplete);
                    }
                }
            };

        // Collect data for the explosion sprite and the generate the sheets and animation
        let effectElement = (robotInfo.core !== '' && robotInfo.core !== 'copy' ? robotInfo.core : '');
        let effectToken = effectElement ? effectElement + '-buster' : 'mega-buster';
        let explodeSpriteInfo = SPRITES.getSpriteInfo('ability', effectToken, 1);
        //console.log('%c----------', 'color: orange;');
        //console.log('explodeSpriteInfo (before) =', explodeSpriteInfo);
        //console.log('explodeSpriteInfo.sprite (before) =', JSON.stringify(explodeSpriteInfo.sprite));
        const createExplodeSpriteAnimation = function(robotInfo, spriteInfo, spriteDirection){
            let xkind = 'abilities';
            let token = effectToken;
            let sheet = '1';
            let anim = 'explode';
            let baseKey = 'sprites.' + xkind + '.' + token + '.' + sheet;
            let sheetKey = baseKey+'.sprite-'+spriteDirection;
            let animKey = baseKey+'.sprite-'+spriteDirection+'.' + anim;
            let animTemplate = {
                key: '',
                sheet: '',
                frames: [ 0, 1, 2, 0, 2, 1, 0, 1, 0, 0 ],
                frameRate: 12,
                repeat: -1
                };
            let explodeAnimation = ctx.anims.get(animKey);
            if (!explodeAnimation){
                ctx.anims.create(Object.assign({}, animTemplate, {
                    key: animKey,
                    sheet: sheetKey,
                    frames: ctx.anims.generateFrameNumbers(sheetKey, { frames: animTemplate.frames }),
                    }));
                explodeAnimation = ctx.anims.get(animKey);
                //console.log('Created explodeAnimation w/ key:', explodeAnimation.key, 'sheet:', explodeAnimation.sheet);
                }
            spriteInfo['sprite'][spriteDirection]['anim']['explode'] = explodeAnimation.key;
            };
        createExplodeSpriteAnimation(robotInfo, explodeSpriteInfo, 'left');
        createExplodeSpriteAnimation(robotInfo, explodeSpriteInfo, 'right');
        //console.log('explodeSpriteInfo (after) =', explodeSpriteInfo);
        //console.log('explodeSpriteInfo.sprite (after) =', JSON.stringify(explodeSpriteInfo.sprite));

        // Define a function that plays an explode animation and then destroyed the sprite when done
        let explodeCleanupTimer = null;
        let explodeEffectSprites = [];
        const explodeSpriteAndDestroy = function($sprite){
            //console.log('explodeSpriteAndDestroy() w/ $sprite:', $sprite);
            if (!$sprite || $sprite.toBeDestroyed){ return; }

            // -- First we disable the sprite itself and make sure it gets cleaned up

            // Stop any of this sprite's tweens and timers, then play the explosion animation
            $sprite.isDisabled = true;
            $sprite.stop();
            ctx.stopSpriteTweens($sprite, false);
            ctx.stopSpriteTimers($sprite, false);

            // Set the frame to disabled and darken the sprite, then play the explosion animation
            $sprite.setFrame(3);
            $sprite.fx = $sprite.preFX.addColorMatrix();
            $sprite.fx.brightness(3.0);

            // Generate the explosion animation tween of flashing, then destroy the sprite when done
            $sprite.subTweens.flashTween = ctx.tweens.addCounter({
                from: 0.6,
                to: 1.4,
                duration: 40,
                delay: 100,
                loop: 3,
                yoyo: true,
                onUpdate: () => {
                    $sprite.fx.brightness($sprite.subTweens.flashTween.getValue());
                    },
                onComplete: function (){
                    //console.log(robotInfo.name + ' explosion complete!');
                    ctx.destroySprite($sprite);
                    }
                });

            // -- Then we separately generate an explosion effect sprite in the same location

            // Calculate where we're going to draw the explosion sprite itself given context
            let explodeOffsets = { x: (($sprite.direction === 'left' ? 1 : -1) * 10), y: 15 };
            let explodeX = $sprite.x + explodeOffsets.x;
            let explodeY = $sprite.y + explodeOffsets.y;

            // First create the explode sprite and add it to the scene
            let $explodeSprite = ctx.add.sprite(explodeX, explodeY, explodeSpriteInfo['sprite'][$sprite.direction]['sheet']);
            ctx.debugSprites.push($explodeSprite);
            $explodeSprite.debugKey = ctx.debugSprites.length - 1;
            ctx.debugAddedSprites++;
            $explodeSprite.setOrigin(0.5, 1);
            $explodeSprite.setScale(2.0);
            $explodeSprite.setDepth($sprite.depth - 1);
            ctx.battleBannerContainer.add($explodeSprite);
            ctx.battleBannerContainer.sort('depth');

            // Add required sub-objects to the sprite
            $explodeSprite.subTweens = {};
            $explodeSprite.subTimers = {};
            $explodeSprite.subSprites = {};

            // Apply effects and setup the frame
            let explodeFrame = 0;
            $explodeSprite.preFX.addShadow();
            $explodeSprite.setAlpha(0);
            $explodeSprite.setFrame(explodeFrame);

            // Add this explode sprite as a child of the parent
            explodeEffectSprites.push($explodeSprite);
            $explodeSprite.explodeKey = explodeEffectSprites.length - 1;

            // Show the sprite and play its explode animation on loop
            $explodeSprite.setAlpha(0.8);
            $explodeSprite.play(explodeSpriteInfo['sprite'][$sprite.direction]['anim']['explode']);

            // Generate a tween for the explode sprite that has it slowly fade away via alpha then remove itself
            $explodeSprite.subTweens.fadeTween = ctx.add.tween({
                targets: $explodeSprite,
                alpha: 0.1,
                ease: 'Linear',
                delay: 200,
                duration: 800,
                onUpdate: function () {
                    // also make the explode's x track the source robot's x
                    $explodeSprite.x = $sprite.x + explodeOffsets.x;
                    },
                onComplete: function () {
                    //console.log(robotInfo.name + '\'s explosion fade complete!');
                    ctx.destroySprite($explodeSprite);
                    }
                });

            };

        // Define a function for queueing cleanup of the sprite after a set amount of time
        let cleanupTimer = null;
        let cleanupDelay = 3000;
        const queueSpriteCleanup = function(){
            //console.log('queueSpriteCleanup() w/ $sprite:', $sprite, 'duration:', duration);
            if (cleanupTimer){ cleanupTimer.remove(); }
            cleanupTimer = ctx.time.delayedCall(cleanupDelay, function(){
                //console.log('Time to cleanup sprites:', $slidingSprite);
                ctx.destroySpriteAndCleanup($slidingSprite, true);
                for (let i = 0; i < abilityShotSprites.length; i++){
                    let $abilityShotSprite = abilityShotSprites[i];
                    ctx.destroySpriteAndCleanup($abilityShotSprite, true);
                    }
                for (let i = 0; i < explodeEffectSprites.length; i++){
                    let $explodeEffectSprite = explodeEffectSprites[i];
                    ctx.destroySpriteAndCleanup($explodeEffectSprite, true);
                    }
                });
            };

        // Preset the sprite direction to right, and then start playing the slide animation
        $slidingSprite.direction = 'right';
        $slidingSprite.play(robotSpriteInfo['sprite'][$slidingSprite.direction]['anim']['slide']);
        slideSpriteForward($slidingSprite, slideDistance, slideDestination, slideDuration, function($slidingSprite){
            //console.log('%c' + 'All animations for ' + robotInfo.name + ' complete!', 'color: amber;');
            queueSpriteCleanup();
            });

        // Make it so the sprite is clickable to shows an alert
        $slidingSprite.setInteractive({ useHandCursor: true });
        $slidingSprite.on('pointerdown', function(){
            //console.log('Sliding sprite clicked:', spriteToken);
            if (!$slidingSprite || $slidingSprite.isDisabled){ return; }
            explodeSpriteAndDestroy($slidingSprite);
            queueSpriteCleanup();
            });

        //abilityShotSprites

        // Update the scene with last-used sprite token
        ctx.lastSlidingMaster = spriteToken;
    }

    // Define a function for stopping any tweens attached to a given sprite
    stopSpriteTweens ($sprite, recursive = true)
    {
        //console.log('stopSpriteTweens() w/ $sprite:', $sprite, 'recursive:', recursive);
        if (!$sprite){ return; }
        //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

        // Collect a reference to the scene context
        let ctx = this;

        // Stop any tweens on this sprite itself
        if (typeof $sprite.stop === 'function'){ $sprite.stop(); }

        // Stop and destroy any tweens attached to this sprite
        if ($sprite.subTweens){
            let keys = Object.keys($sprite.subTweens);
            for (let i = 0; i < keys.length; i++){
                let $tween = $sprite.subTweens[keys[i]];
                $tween.stop().destroy();
                }
            }

        // Recursively destroy any sub-sprites attached to this one
        if (recursive && $sprite.subSprites){
            let keys = Object.keys($sprite.subSprites);
            for (let i = 0; i < keys.length; i++){
                let $subSprite = $sprite.subSprites[keys[i]];
                if (!$subSprite.subSprites){ continue; }
                ctx.stopSpriteTweens($subSprite);
                }
            }

        // Return true on success
        return true;

    }

    // Define a function for stopping any timers attached to a given sprite
    stopSpriteTimers ($sprite, recursive = true)
    {
        //console.log('stopSpriteTimers() w/ $sprite:', $sprite, 'recursive:', recursive);
        if (!$sprite){ return; }
        //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

        // Collect a reference to the scene context
        let ctx = this;

        // Stop and destroy any timers attached to this sprite
        if ($sprite.subTimers){
            let keys = Object.keys($sprite.subTimers);
            for (let i = 0; i < keys.length; i++){
                let $timer = $sprite.subTimers[keys[i]];
                $timer.remove();
                }
            }

        // Recursively destroy any sub-sprites attached to this one
        if (recursive && $sprite.subSprites){
            let keys = Object.keys($sprite.subSprites);
            for (let i = 0; i < keys.length; i++){
                let $subSprite = $sprite.subSprites[keys[i]];
                if (!$subSprite.subSprites){ continue; }
                ctx.stopSpriteTimers($subSprite);
                }
            }

        // Return true on success
        return true;

    }

    // Define a function for disabling a robot sprite and hiding it from view until destruction
    destroySprite ($sprite)
    {
        //console.log('disableRobotSprite() w/ $sprite:', $sprite);
        if (!$sprite){ return; }

        // Hide the sprite visually and set it to be destroyed
        $sprite.x = -9999;
        $sprite.y = -9999;
        $sprite.setAlpha(0);
        $sprite.setActive(false);
        $sprite.setVisible(false);
        $sprite.toBeDestroyed = true;

        // Stop and destroy any tweens attached to this sprite
        this.stopSpriteTweens($sprite, true);

        // Stop and destroy any timers attached to this sprite
        this.stopSpriteTimers($sprite, true);

        return $sprite;
    }

    // Define a function for destroying a sprite as well as any children from the scene
    destroySpriteAndCleanup ($sprite, recursive = true)
    {
        //console.log('destroySpriteAndCleanup() w/ $sprite:', $sprite, 'recursive:', recursive);
        //console.log('$sprite starts as:', typeof $sprite, $sprite, ($sprite ? true : false));
        if (!$sprite){ return; }

        // Collect a reference to the scene context
        let ctx = this;

        // Save backup refs for children in case not recusive
        let $echo = {};
        $echo.subTweens = $sprite.subTweens || {};
        $echo.subTimers = $sprite.subTimers || {};
        $echo.subSprites = $sprite.subSprites || {};

        // First we "destroy" the sprite by fully hiding it
        ctx.destroySprite($sprite);

        // Recursively destroy any sub-sprites attached to this one
        if (recursive && $sprite.subSprites){
            let keys = Object.keys($sprite.subSprites);
            for (let i = 0; i < keys.length; i++){
                let $subSprite = $sprite.subSprites[keys[i]];
                if (!$subSprite.subSprites){ continue; }
                ctx.destroySpriteAndCleanup($subSprite);
                }
            }

        // Now we can destroy this actual sprite
        $sprite.destroy();
        this.debugRemovedSprites++;
        delete this.debugSprites[$sprite.debugKey];

        // Set the sprite equal to null to ensure it's not used again
        $sprite = null;

        // Return the backup refs for children in case not recusive
        //console.log('$sprite is now:', typeof $sprite, $sprite, ($sprite ? true : false));
        return $echo;

    }

    addPanelWithTypeButtons (config){

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);
        let safeTypeTokens = Object.values(this.safeTypeTokens);

        // Define the panel configuration using above where possible
        let panelConfig = {
            x: config.x || 20,
            y: config.y || 20,
            width: config.width || 600,
            height: config.height || 150,
            padding: config.padding || 15,
            radius: config.radius || { tl: 20, tr: 0, br: 20, bl: 0 },
            lineStyle: config.lineStyle || { width: 2, color: 0x0a0a0a },
            fillStyle: config.fillStyle || { color: 0x161616 },
            depth: config.depth || 1000,
            };

        // Draw the panel with the specified configuration
        const $panelBack = Graphics.addTypePanel(ctx, panelConfig);

        // Draw little buttons on the type panel for each type
        let typeButtons = [];
        let typeButtonWidth = 90;
        let typeButtonHeight = 25;
        let typeButtonMargin = 10;
        let typeButtonX = panelConfig.x + panelConfig.padding;
        let typeButtonY = panelConfig.y + panelConfig.padding;
        let typeButtonDepth = panelConfig.depth + 1;
        let widthAvailable = panelConfig.width - (typeButtonMargin * 2);
        let widthUsed = 0;
        let goToNextLine = function(){
            typeButtonX = panelConfig.x + panelConfig.padding;
            typeButtonY += typeButtonHeight + typeButtonMargin;
            widthUsed = 0;
            };
        for (let i = 0; i < safeTypeTokens.length; i++)
        {
            let typeToken = safeTypeTokens[i];
            let typeData = typesIndex[typeToken];
            //console.log('Adding type button:', typeToken);
            //console.log('typeButtonY:', typeButtonY, 'typeButtonX:', typeButtonX);
            //console.log('width:', typeButtonWidth, 'widthUsed:', widthUsed, 'widthAvailable:', widthAvailable);
            if ((widthUsed + typeButtonWidth + typeButtonMargin) > widthAvailable){
                //console.log('> Pre-moving to next row of buttons');
                goToNextLine();
                }
            let $typeButton = BUTTONS.makeSimpleButton(typeData.name, {
                x: typeButtonX,
                y: typeButtonY,
                width: typeButtonWidth,
                height: typeButtonHeight,
                size: 8, color: '#ffffff',
                border: Graphics.returnHexColorString(typeData.colour_dark),
                background: Graphics.returnHexColorString(typeData.colour_light),
                depth: typeButtonDepth
                }, function(){
                console.log('Huh? Type button clicked:', typeToken);
                ctx.showMasterSliding(null, typeToken);
                });
            typeButtons.push($typeButton);
            widthUsed += typeButtonWidth + typeButtonMargin;
            if (widthUsed <= widthAvailable){
                typeButtonX += (typeButtonWidth + typeButtonMargin);
                } else {
                //console.log('> Moving to next row of buttons');
                goToNextLine();
                }
            //console.log('typeButtonY:', typeButtonY, 'typeButtonX:', typeButtonX);
            //console.log('width:', typeButtonWidth, 'widthUsed:', widthUsed, 'widthAvailable:', widthAvailable);
        }

    }

    addTestTypesPanel (){

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

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
            color: '#dedede',
            fontSize: 16,
            fontFamily: 'Open Sans',
            lineSpacing: 10,
            align: 'left',
            wordWrap: { width: textConfig.textWidth, useAdvancedWrap: true }
            });

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