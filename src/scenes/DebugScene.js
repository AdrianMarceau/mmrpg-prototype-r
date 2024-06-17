// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: DebugScene.js (scene)
// Debug menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import MMRPG_Player from '../objects/MMRPG_Player.js';
import MMRPG_Robot from '../objects/MMRPG_Robot.js';
import MMRPG_Ability from '../objects/MMRPG_Ability.js';
import MMRPG_Item from '../objects/MMRPG_Item.js';
import MMRPG_Field from '../objects/MMRPG_Field.js';
import MMRPG_Skill from '../objects/MMRPG_Skill.js';
import MMRPG_Type from '../objects/MMRPG_Type.js';

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

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.preload(this);

        // Pull in other required objects and references
        let ctx = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

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

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.create(this);

        // Pull in other required objects and references
        let ctx = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // Always print these when starting the DEBUG scene
        console.log('MMRPG = ', MMRPG);
        console.log('SPRITES =', SPRITES);

        // First we add the title banner up at the top
        this.createTitleBanner();

        // Next we add the buttons banner under the title
        this.createHeaderBanner();

        // Next we add the battle banner to the scene
        this.createBattleBanner();

        // Next we add the two bound banners to the scene
        this.createBounceBanners();

        // Draw a panel with all of the debug options as buttons
        this.addPanelWithDebugButtons();

        // Draw a panel with all of the elemental types as buttons
        this.addPanelWithTypeButtons();


        // DEBUG DEBUG DEBUG
        // <----------------


            // -- DEBUG TEXT -- //

            var x = 20, y = MMRPG.canvas.height - 30;
            var ipsum = 'Let go your earthly tether. Enter the void. Empty and become wind.';
            Strings.addPlainText(this, x, y, ipsum, {color: '#000000'});

            // We should also show the current version just to be safe
            var x = MMRPG.canvas.width - 100, y = MMRPG.canvas.height - 26;
            var version = 'v ' + MMRPG.version;
            let $version = Strings.addPlainText(this, x, y, version, {color: '#000000', fontSize: '12px'});
            $version.x = MMRPG.canvas.width - $version.width - 20;

            // Create a floating text bubble to test the text formatting syntax and display wrapping
            var width = Math.ceil(MMRPG.canvas.width / 3), height = 90;
            var x = MMRPG.canvas.xMax - width - 20, y = 150;
            var lorem = "[Hey]{water} there [Bomb Man]{explode}! I know [i]I'm[/i] good, but how are [b]you[/b] today? I hear you got hit by a [Flame Sword]{flame_cutter}! [b][i]Your weakness[/i][/b]!!! [b][Gravity Man]{space_electric}[/b] is the one who told me btw.";
            let $floatingTextBubble = Strings.addFormattedText(this, x, y, lorem, {
                width: width,
                height: height,
                border: '#ff0000',
                color: '#ffffff',
                depth: 2000,
                padding: 10,
                });
            this.floatingTextBubble = $floatingTextBubble;
            // automatically fade out and remove the above after a few seconds
            let floatingTextBubbleTween;
            this.time.delayedCall(1234, function(){
                floatingTextBubbleTween = ctx.tweens.addCounter({
                    from: 100,
                    to: 0,
                    ease: 'Sine.easeOut',
                    delay: 100,
                    duration: 1000,
                    onUpdate: function () {
                        //console.log('floatingTextBubbleTween:', floatingTextBubbleTween.getValue());
                        $floatingTextBubble.setAlpha(floatingTextBubbleTween.getValue() / 100);
                        $floatingTextBubble.setPosition('-=0', '-=2');
                        },
                    onComplete: function () {
                        //console.log('floatingTextBubbleTween complete!');
                        $floatingTextBubble.destroy();
                        }
                    });
                }, [], this);


            // -- DEBUG SOUND EFFECTS -- //

            // Play a sound effect to make sure they're working
            SOUNDS.play('9-reggae-laughs_rockboard-nes');


            // -- DEBUG SPRITE TESTING -- //

            // Create some primitive MMRPG objects for testing purposes
            let depth = 9000;
            let $player = new MMRPG_Player(this, 'dr-light', null, { x: 40, y: 40, z: depth++ });
            let $robot = new MMRPG_Robot(this, 'mega-man', null, { x: 80, y: 80, z: depth++ });
            let $ability = new MMRPG_Ability(this, 'buster-shot', null, { x: 120, y: 120, z: depth++ });
            let $item = new MMRPG_Item(this, 'energy-tank', null, { x: 160, y: 160, z: depth++ });
            let $field = new MMRPG_Field(this, 'preserved-forest', null, { x: 200, y: 200, z: depth++ });
            let $skill = new MMRPG_Skill(this, 'xtreme-submodule', null);
            let $type = new MMRPG_Type(this, 'water');
            console.log('$player =', $player);
            console.log('$robot =', $robot);
            console.log('$ability =', $ability);
            console.log('$item =', $item);
            console.log('$field =', $field);
            console.log('$skill =', $skill);
            console.log('$type =', $type);

            // Create some mods of the above to see what's possible
            var $ref = this.battleBanner;
            let $customRobot = new MMRPG_Robot(this, 'proto-man', {
                image_alt: 'water'
                }, {
                x: $ref.x + ($ref.width / 2),
                y: $ref.y + ($ref.height / 2),
                z: depth++,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left'
                });
            $customRobot.setAlpha(0.5);
            $customRobot.setOnHover(function(){
                if (this.isMoving){ return; }
                //console.log('Hovered over $customRobot!');
                this.setFrame('taunt');
                }, function(){
                if (this.isMoving){ return; }
                //console.log('Moved away from $customRobot!');
                this.resetFrame();
                });
            $customRobot.setOnClick(function($sprite){
                if (this.isMoving){ return; }
                //console.log('%c' + '---------------------', 'color: red;');
                //console.log('Clicked on $customRobot! w/ this:', this, '$sprite:', $sprite);
                //console.log('-> this.x = ', this.x, 'this.y =', this.y);
                //console.log('-> $customRobot.x = ', $customRobot.x, '$customRobot.y =', $customRobot.y);
                //console.log('-> $sprite.x = ', $sprite.x, '$sprite.y =', $sprite.y);
                SOUNDS.play('lets-go', {volume: 0.3});
                this.setAlpha(1);
                this.flipDirection();
                this.setFrame('slide');
                var newX = this.direction === 'left' ? $sprite.x - 90 : $sprite.x + 90;
                var newY = $sprite.y + 30;
                //console.log('-> $customRobot is moving to newX:', newX, 'newY:', newY);
                this.moveToPosition(newX, newY, 1000, function(){
                    //console.log('%c' + '-------------', 'color: pink;');
                    //console.log('--> Movement complete!');
                    //console.log('--> this.x = ', this.x, 'this.y =', this.y);
                    //console.log('--> $customRobot.x = ', $customRobot.x, '$customRobot.y =', $customRobot.y);
                    //console.log('-> $sprite.x = ', $sprite.x, '$sprite.y =', $sprite.y);
                    this.setFrame('base');
                    });
                });
            console.log('$customRobot =', $customRobot);
            window.$customRobot = $customRobot;

            let $customBoss = new MMRPG_Robot(this, 'slur', {
                //image_alt: 'alt2'
                }, {
                x: $ref.x + ($ref.width / 2) - 60,
                y: $ref.y + ($ref.height / 2),
                z: depth++,
                scale: 2,
                origin: [0.5, 1],
                direction: 'right'
                });
            $customBoss.setOnHover(function(){
                if (this.isMoving){ return; }
                //console.log('Hovered over $customBoss!');
                this.setFrame('taunt');
                }, function(){
                if (this.isMoving){ return; }
                //console.log('Moved away from $customBoss!');
                this.resetFrame();
                });
            $customBoss.setOnClick(function($sprite){
                //console.log('Clicked on $customBoss! w/ $sprite:', $sprite);
                SOUNDS.play('level-up', {volume: 0.3});
                this.flipDirection();
                this.setFrame('slide');
                var newX = this.direction === 'left' ? $sprite.x - 90 : $sprite.x + 90;
                var newY = $sprite.y + 30;
                //console.log('Moving to:', newX, newY);
                this.moveToPosition(newX, newY, 1000, function(){
                    //console.log('Movement complete! $sprite.x =', $sprite.x, '$sprite.y =', $sprite.y);
                    if (this.isMoving){ return; }
                    this.setFrame('base');
                    });
                });
            console.log('$customBoss =', $customBoss);

            let $customMecha = new MMRPG_Robot(this, 'met', {
                //image_alt: 'alt2'
                }, {
                x: $ref.x + ($ref.width / 2) + 60,
                y: $ref.y + ($ref.height / 2),
                z: depth++,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left'
                });
            $customMecha.setOnHover(function(){
                if (this.isMoving){ return; }
                //console.log('Hovered over $customMecha!');
                this.setFrame('base2');
                }, function(){
                if (this.isMoving){ return; }
                //console.log('Moved away from $customMecha!');
                this.resetFrame();
                });
            $customMecha.setOnClick(function($sprite){
                //console.log('Clicked on $customMecha! w/ $sprite:', $sprite);
                SOUNDS.play('glass-klink', {volume: 0.3});
                this.flipDirection();
                this.setFrame('damage');
                var newX = this.direction === 'left' ? $sprite.x - 90 : $sprite.x + 90;
                var newY = $sprite.y + 30;
                //console.log('Moving to:', newX, newY);
                this.moveToPosition(newX, newY, 0, function(){
                    //console.log('Movement complete! $sprite.x =', $sprite.x, '$sprite.y =', $sprite.y);
                    this.setFrame('base');
                    });
                });
            console.log('$customMecha =', $customMecha);


            // -- DEBUG CLASS METHODS -- //

            //Graphics.test();
            //Strings.test();

        // ---------------->
        // DEBUG DEBUG DEBUG


    }

    update (time, delta)
    {
        //console.log('DebugScene.update() called w/ time =', time, 'delta =', delta);

        if (typeof this.debugAddedSprites === 'undefined'){ this.debugAddedSprites = 0; }
        if (typeof this.debugRemovedSprites === 'undefined'){ this.debugRemovedSprites = 0; }

        const activeSprites = this.battleBannerContainer.getAll();
        const activeSpritesLength = activeSprites.length;
        //console.log('activeSprites =', activeSprites);
        //console.log('activeSpritesLength =', activeSpritesLength);
        //console.log('this.debugAddedSprites =', this.debugAddedSprites);
        //console.log('this.debugRemovedSprites =', this.debugRemovedSprites);

        //this.updateMainBanner(time, delta);
        //this.updateTestBanner(time, delta);

        this.updateBounceBanners(time, delta);

    }

    // Define a function that generates a sprite of a player and animates it running across the screen
    showDoctorRunning (token, alt, side = 'left')
    {
        //console.log('DebugScene.showDoctorRunning() called w/ token =', token, 'alt =', alt, 'side =', side);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let playerSheets = SPRITES.index.sheets.players;
        let playerAnims = SPRITES.index.anims.players;
        let playersIndex = MMRPG.Indexes.players;

        // Count the number of sliding sprites currently on the screen
        let numSprites = ctx.debugAddedSprites - ctx.debugRemovedSprites;

        // Generate a list of random tokens to pull from should it be necessary
        let randTokens = [];
        if (!randTokens.length){ randTokens = randTokens.concat(ctx.runningDoctors); }
        let randKey = Math.floor(Math.random() * randTokens.length);

        // Collect the sprite token and alt if provided, else rely on the random key
        let spriteSide = side || 'left';
        let spriteDirection = spriteSide === 'left' ? 'right' : 'left';
        let spriteToken = token || randTokens[randKey];
        let spriteAlt = alt || 'base';
        //console.log('spriteToken =', spriteToken, 'spriteAlt =', spriteAlt, 'spriteSide =', spriteSide, 'spriteDirection =', spriteDirection);

        // If the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }

        // Generate a sprite w/ running animation in progress
        let playerInfo = playersIndex[spriteToken];
        let playerAlts = playerInfo.image_alts ? playerInfo.image_alts.map(item => item.token) : [];
        //console.log('playerInfo for ', spriteToken, '=', playerInfo);
        //console.log('playerAlts for ', spriteToken, '=', playerAlts);

        // Ensure this alt actually exists on the player in question
        //console.log('pending spriteToken =', spriteToken, 'pending spriteAlt =', spriteAlt);
        if (spriteAlt !== 'base' && playerAlts.indexOf(spriteAlt) === -1){ spriteAlt = 'base'; }
        if (!playerSheets[spriteToken][spriteAlt]){
            //console.log('Sprite alt not found, defaulting to base');
            spriteAlt = 'base';
            }

        // Define the base coordinates for the sprite to be added
        var offset = ((numSprites % 10) * 5);
        let spriteX = spriteSide === 'left' ? (0 - offset - 40) : (MMRPG.canvas.width + offset + 40);
        let spriteY = this.battleBanner.y + 80 + ((numSprites % 10) * 10);
        //console.log('spriteX =', spriteX, 'spriteY =', spriteY);

        // Define the base variables for this player animation sequence
        let spriteKey = 'sprite-'+spriteDirection;
        let spriteSheet = playerSheets[spriteToken][spriteAlt][spriteKey];
        let spriteRunAnim = playerAnims[spriteToken][spriteAlt][spriteKey]['run'];

        // Create the sprite and add it to the scene
        let $playerSprite = ctx.add.sprite(spriteX, spriteY, spriteSheet);
        ctx.debugSprites.push($playerSprite);
        $playerSprite.debugKey = ctx.debugSprites.length - 1;
        ctx.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $playerSprite.subTweens = {};
        $playerSprite.subTimers = {};
        $playerSprite.subSprites = {};

        // Set the origin, scale, and depth for the sprite then add to parent container
        $playerSprite.setOrigin(0.5, 1);
        $playerSprite.setScale(2.0);
        $playerSprite.setDepth(ctx.battleBanner.depth + spriteY);
        ctx.battleBannerContainer.add($playerSprite);
        ctx.battleBannerContainer.sort('depth');

        // Apply effects and setup the frame
        $playerSprite.preFX.addShadow();
        $playerSprite.play(spriteRunAnim);

        // Animate the doctor bouncing up and down as they walk forward
        $playerSprite.subTweens.bounceTween = ctx.add.tween({
            targets: $playerSprite,
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
        let runDestination = spriteDirection === 'right' ? (MMRPG.canvas.width + 40) : (0 - 40);
        let runDuration = 5000 - (1000 * runSpeedMultiplier);
        //console.log(playerInfo.token, 'runSpeed:', runSpeed, 'runSpeedMultiplier:', runSpeedMultiplier, 'runDistance:', runDistance, 'runDestination:', runDestination, 'runDuration:', runDuration);

        // Animate that sprite using the previously defined variables
        $playerSprite.subTweens.runTween = ctx.add.tween({
            targets: $playerSprite,
            x: runDestination,
            ease: 'Linear',
            duration: runDuration,
            onComplete: function () {
                //console.log(playerInfo.name + ' running movement complete!');
                SPRITES.destroySpriteAndCleanup(ctx, $playerSprite);
                }
            });

        // Update the scene with last-used sprite token
        ctx.lastRunningDoctor = spriteToken;

    }

    // Define a function that generates a sprite of a robot and animates it sliding across the screen
    showMasterSliding (token, alt, side)
    {
        //console.log('DebugScene.showMasterSliding() called w/ token =', token, 'alt =', alt, 'side =', side);
        //console.log('ctx.masterTokensByCoreType['+alt+'] =', this.masterTokensByCoreType[alt]);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let SOUNDS = this.SOUNDS;
        let robotSheets = SPRITES.index.sheets.robots;
        let robotAnims = SPRITES.index.anims.robots;
        let typesIndex = MMRPG.Indexes.types;
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
        let spriteSide = side || 'left';
        let spriteDirection = spriteSide === 'left' ? 'right' : 'left';
        let spriteToken = token || randTokens[randKey];
        let spriteAlt = alt || 'base';
        //console.log('spriteToken =', spriteToken, 'spriteAlt =', spriteAlt, 'spriteSide =', spriteSide, 'spriteDirection =', spriteDirection);

        // If the sprite token ends with an "*_{alt}", make sure we parse it out
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }

        // Pull the robot data for the token we're using
        let robotInfo = robotsIndex[spriteToken];
        let robotAlts = robotInfo.image_alts ? robotInfo.image_alts.map(item => item.token) : [];
        //console.log('robotInfo for ', spriteToken, '=', robotInfo);
        //console.log('robotAlts for ', spriteToken, '=', robotAlts);

        // Ensure the selected alt actually exists on the robot in question, else default to base
        //console.log('pending spriteToken =', spriteToken, 'pending spriteAlt =', spriteAlt);
        if (spriteAlt !== 'base' && robotAlts.indexOf(spriteAlt) === -1){ spriteAlt = 'base'; }
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
        var offset = ((numSprites % 10) * 5);
        let spriteX = spriteSide === 'left' ? (0 - offset - 40) : (MMRPG.canvas.width + offset + 40);
        let spriteY = this.battleBanner.y + 90 + ((numSprites % 10) * 10);

        // Create the new sliding sprite and add it to the scene
        let $robotSprite = ctx.add.sprite(spriteX, spriteY, robotSpriteInfo['sprite'][spriteDirection]['sheet']);
        ctx.debugSprites.push($robotSprite);
        $robotSprite.debugKey = ctx.debugSprites.length - 1;
        ctx.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $robotSprite.subTweens = {};
        $robotSprite.subTimers = {};
        $robotSprite.subSprites = {};

        // Set the origin, scale, and depth for the sprite then add to parent container
        $robotSprite.setOrigin(0.5, 1);
        $robotSprite.setScale(2.0);
        $robotSprite.setDepth(ctx.battleBanner.depth + spriteY);
        ctx.battleBannerContainer.add($robotSprite);
        ctx.battleBannerContainer.sort('depth');

        // Add effects and setup the frame for the sliding sprite
        $robotSprite.preFX.addShadow();
        $robotSprite.setFrame(0);

        // Animate that sprite sliding across the screen then remove when done
        let slideSpeed = robotInfo.speed;
        let slideSpeedMultiplier = (slideSpeed / 100);
        let slideDistance = (MMRPG.canvas.width / 3) * slideSpeedMultiplier;
        let slideDestination = spriteSide === 'left' ? (MMRPG.canvas.width + 40) : (0 - 40);
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
                //SOUNDS.play('beam-in_mmv-gb', {volume: 0.1});
                //SOUNDS.play('dink_mmii-gb', {volume: 0.1});
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial sliding movement complete...');
                        //SOUNDS.play('dink_mmii-gb', {volume: 0.1});
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
                //SOUNDS.play('beam-in_mmv-gb', {volume: 0.1});
                //SOUNDS.play('dink_mmii-gb', {volume: 0.1});
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = ctx.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial sliding movement complete...');
                        //SOUNDS.play('dink_mmii-gb', {volume: 0.1});
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
            if (abilitySuffix === 'shot'){ SOUNDS.play('shot-a_mmv-gb', {volume: 0.2}); }
            else if (abilitySuffix === 'buster'){ SOUNDS.play('mid-scene-mega-shoot_mmv-gb', {volume: 0.3}); }
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
                $shotSprite.setAlpha(0.6);
                $shotSprite.setFrame(shotFrame);
                $shotSprite.subTweens.bulletTween = ctx.add.tween({
                    targets: $shotSprite,
                    x: shotDestX,
                    alpha: 1.0,
                    ease: 'Sine.easeOut',
                    duration: shotDuration,
                    onComplete: function () {
                        //console.log(robotInfo.name + '\'s ' + abilityInfo.name + ' movement complete!');
                        SPRITES.destroySprite(ctx, $shotSprite);
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
                let slidePref = destination > MMRPG.canvas.centerX ? 'forward' : 'backward';
                let randChance = Math.random() * 100;
                let nextSpriteFunction;
                if (randChance <= 20) {
                    nextSpriteFunction = makeSpriteShoot;
                    } else if (slidePref === 'forward'){
                    nextSpriteFunction = randChance <= 80 ? slideSpriteForward : slideSpriteBackward;
                    } else if (slidePref === 'backward'){
                    nextSpriteFunction = randChance <= 80 ? slideSpriteBackward : slideSpriteForward;
                    }
                return nextSpriteFunction($sprite, distance, destination, duration, onComplete);
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
            SPRITES.stopSpriteTweens(ctx, $sprite, false);
            SPRITES.stopSpriteTimers(ctx, $sprite, false);

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
                    SPRITES.destroySprite(ctx, $sprite);
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
            SOUNDS.play('big-boom_mmv-gb', {volume: 0.5});

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
                    SPRITES.destroySprite(ctx, $explodeSprite);
                    }
                });

            };

        // Define a function that shows a robot's defeat quote in the position it was defeated
        let robotQuoteBubbles = [];
        let robotQuoteTweens = [];
        const showRobotDefeatQuote = function($sprite){
            // Destroy any existing floating text bubbles
            if (ctx.floatingTextBubble){
                //console.log('Destroying clicked ctx.floatingTextBubble:', ctx.floatingTextBubble);
                ctx.floatingTextBubble.destroy();
                ctx.floatingTextBubble = null;
                }
            // If the robot has quotes to display, let's do so now
            let quoteDisplayed = false;
            let $floatingTextBubble = null;
            //console.log('robot destroyed:', robotInfo.token, robotInfo.name, robotInfo);
            if (typeof robotInfo.quotes !== 'undefined'){
                let robotCoreType = robotInfo.core !== '' ? robotInfo.core : '';
                let robotTypeInfo = typesIndex[robotCoreType || 'none'];
                let robotQuotes = robotInfo.quotes;
                //console.log(robotInfo.token, 'robotCoreType:', robotCoreType, 'robotTypeInfo:', robotTypeInfo, 'robotQuotes:', robotQuotes);
                if (typeof robotQuotes.battle_defeat
                    && robotQuotes.battle_defeat.length){
                    //console.log('robotQuotes.battle_defeat:', robotQuotes.battle_defeat);
                    var text = robotQuotes.battle_defeat.toUpperCase();
                    var color = '#f0f0f0';
                    var shadow = '#090909'; //robotCoreType ? Graphics.returnHexColorString(robotTypeInfo.colour_dark) : '#969696';
                    //console.log('text:', text, 'color:', color);
                    var x = $robotSprite.x + 40, y = $robotSprite.y - 60;
                    var width = Math.ceil(MMRPG.canvas.width / 4), height = 90;
                    $floatingTextBubble = Strings.addFormattedText(ctx, x, y, text, {
                        width: width,
                        height: height,
                        color: color,
                        shadow: shadow,
                        depth: $robotSprite.depth + 1,
                        padding: 10,
                        border: false,
                        });
                    robotQuoteBubbles.push($floatingTextBubble);
                    quoteDisplayed = true;
                    }
                }
            // After a set amount of time, automatically destroy the floating text bubble
            if (quoteDisplayed
                && $floatingTextBubble){
                let quoteDisplayTween = ctx.tweens.addCounter({
                    from: 100,
                    to: 0,
                    ease: 'Sine.easeOut',
                    delay: 100,
                    duration: 1000,
                    onUpdate: function () {
                        //console.log('quoteDisplayTween:', quoteDisplayTween.getValue());
                        $floatingTextBubble.setAlpha(quoteDisplayTween.getValue() / 100);
                        $floatingTextBubble.setPosition('-=0', '-=2');
                        },
                    onComplete: function () {
                        //console.log('quoteDisplayTween complete!');
                        $floatingTextBubble.destroy();
                        }
                    });
                robotQuoteTweens.push(quoteDisplayTween);
                }
            };

        // Define a function for pulling debug keys from a sprite recursively
        const getDebugKeys = function($sprite){
            //console.log('getDebugKeys() w/ $sprite:', $sprite);
            let debugKeys = [];
            if (!$sprite){ return debugKeys; }
            if ($sprite.debugKey){ debugKeys.push($sprite.debugKey); }
            //console.log('debugKeys:', debugKeys);
            if (typeof $sprite.subSprites !== 'undefined'
                && $sprite.subSprites.length){
                //console.log('Checking subSprites:', $sprite.subSprites);
                for (let i = 0; i < $sprite.subSprites.length; i++){
                    let $subSprite = $sprite.subSprites[i];
                    let subKeys = getDebugKeys($subSprite);
                    if (subKeys.length){ debugKeys = debugKeys.concat(subKeys); }
                    }
                }
            return debugKeys;
            };

        // Define a function for queueing cleanup of the sprite after a set amount of time
        let cleanupTimer = null;
        let cleanupDelay = 3000;
        const queueSpriteCleanup = function(){
            //console.log('queueSpriteCleanup() w/ $sprite:', $sprite, 'duration:', duration);
            if (cleanupTimer){ cleanupTimer.remove(); }
            let removeDebugKeys = [];
            cleanupTimer = ctx.time.delayedCall(cleanupDelay, function(){
                //console.log('Time to cleanup sprites:', $robotSprite);
                removeDebugKeys = removeDebugKeys.concat(getDebugKeys($robotSprite));
                SPRITES.destroySpriteAndCleanup(ctx, $robotSprite, true);
                for (let i = 0; i < abilityShotSprites.length; i++){
                    let $abilityShotSprite = abilityShotSprites[i];
                    removeDebugKeys = removeDebugKeys.concat(getDebugKeys($abilityShotSprite));
                    SPRITES.destroySpriteAndCleanup(ctx, $abilityShotSprite, true);
                    }
                for (let i = 0; i < explodeEffectSprites.length; i++){
                    let $explodeEffectSprite = explodeEffectSprites[i];
                    removeDebugKeys = removeDebugKeys.concat(getDebugKeys($explodeEffectSprite));
                    SPRITES.destroySpriteAndCleanup(ctx, $explodeEffectSprite, true);
                    }
                //console.log('removeDebugKeys:', removeDebugKeys);
                for (let i = 0; i < removeDebugKeys.length; i++){
                    let debugKey = removeDebugKeys[i];
                    //console.log('Removing debug key:', debugKey, 'from debugSprites:', ctx.debugSprites);
                    delete ctx.debugSprites[debugKey];
                    ctx.debugRemovedSprites++;
                    }
                });
            };

        // Preset the sprite direction to right, and then start playing the slide animation
        $robotSprite.direction = spriteDirection;
        $robotSprite.play(robotSpriteInfo['sprite'][spriteDirection]['anim']['slide']);
        let startFunction;
        if (spriteDirection === 'right'){ startFunction = slideSpriteForward; }
        else if (spriteDirection === 'left'){ startFunction = slideSpriteBackward; }
        //console.log('Starting slide animation for', robotInfo.name, 'w/ token:', spriteToken, 'and alt:', spriteAlt);
        startFunction($robotSprite, slideDistance, slideDestination, slideDuration, function($robotSprite){
            //console.log('%c' + 'All animations for ' + robotInfo.name + ' complete!', 'color: amber;');
            queueSpriteCleanup();
            });

        // Make it so the sprite is clickable to shows an alert
        $robotSprite.setInteractive({ useHandCursor: true });
        $robotSprite.on('pointerdown', function(){
            //console.log('Sliding sprite clicked:', spriteToken);
            if (!$robotSprite || $robotSprite.isDisabled){ return; }
            showRobotDefeatQuote($robotSprite);
            explodeSpriteAndDestroy($robotSprite);
            queueSpriteCleanup();
            });

        // Update the scene with last-used sprite token
        ctx.lastSlidingMaster = spriteToken;
    }

    // Define a function for creating the title banner and associated elements inside it
    createTitleBanner ()
    {
        //console.log('DebugScene.createTitleBanner() called');

        // Pull in other required objects and references
        let ctx = this;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // TITLE BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var y = 10, x = 10;
        var width = MMRPG.canvas.width - 20, height = 30;
        this.titleBanner = new Banner(ctx, x, y, {
            width: width,
            height: height,
            depth: depth++
            });

        // Predefine some position vars to make things easier
        var ref = this.titleBanner;
        let bannerWidth = ref.width;
        let bannerHeight = ref.height;
        let bannerMinX = ref.x;
        let bannerMaxX = ref.x + bannerWidth;
        let bannerMinY = ref.y;
        let bannerMaxY = ref.y + bannerHeight;
        let bannerBounds = ref.getBounds();

        // PAUSE BUTTON

        // Create the pause button smack-dab in the center for pausing the game
        var ref = this.titleBanner;
        var width = 100, height = 23, size = 8;
        var y = (ref.y + 3);
        var x = (ref.x + (bannerWidth / 2) - (width / 2));
        var color = '#cacaca', background = '#262626';
        let pauseTimeout = null;
        let $pauseButton = BUTTONS.makeSimpleButton('PAUSE', {
            y: y, x: x,
            width: width, height: height, size: size,
            color: color, background: background,
            depth: depth++
            }, function(){
            //console.log('Pause button clicked');
            window.toggleGameIsClickable(false);
            window.toggleGameIsRunning(false);
            ctx.scene.pause();
            $pauseButton.setText('PAUSED');
            if (pauseTimeout){ clearTimeout(pauseTimeout); }
            pauseTimeout = setTimeout(function(){
                window.toggleGameIsClickable(true);
                }, 500);
            });
        window.setGameResumeCallback(function(){
            $pauseButton.setText('PAUSE');
            ctx.scene.resume();
            SOUNDS.play('wily-escape-iii-a_mmv-gb', {volume: 0.2});
            });
        this.pauseButton = $pauseButton;

        // BACK & NEXT BUTTONS

        // Predefine the config to use for the back and next buttons
        var buttonConfig = {
            y: (this.titleBanner.y + 3), x: 0,
            width: 150,  height: 23, size: 8,
            color: '#8d8d8d', background: '#262626',
            depth: 0
            };

        // Create a back button so we can return to the title
        buttonConfig.x = 15;
        buttonConfig.depth = depth++;
        BUTTONS.makeSimpleButton('< Back to Title', buttonConfig, function(){
            //console.log('Back button clicked');
            ctx.scene.start('Title');
            });

        // Create a next button so we can go to the main scene
        buttonConfig.x = MMRPG.canvas.width - 165;
        buttonConfig.depth = depth++;
        BUTTONS.makeSimpleButton('Restart Debug', buttonConfig, function(){
            //console.log('Debug button clicked');
            ctx.scene.start('Debug');
            });

    }

    // Define a function for creating the buttons banner and associated elements inside it
    createHeaderBanner ()
    {
        //console.log('DebugScene.createHeaderBanner() called');

        // Pull in other required objects and references
        let ctx = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // HEADER BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var y = 45, x = 10;
        var width = MMRPG.canvas.width - 20, height = 28;
        this.headerBanner = new Banner(ctx, x, y, {
            width: width,
            height: height,
            depth: depth++
            });

        // Predefine some position vars to make things easier
        var ref = this.headerBanner;
        let bannerWidth = ref.width;
        let bannerHeight = ref.height;
        let bannerMinX = ref.x;
        let bannerMaxX = ref.x + bannerWidth;
        let bannerMinY = ref.y;
        let bannerMaxY = ref.y + bannerHeight;
        let bannerBounds = ref.getBounds();

        // TITLE TEXT

        // Add a title to the scene for the player to see
        var ref = this.headerBanner;
        var y = (ref.y + 5), x = MMRPG.canvas.centerX;
        var $titleText = this.add.bitmapText(x, y, 'megafont-white', 'Welcome to Debug', 16);
        $titleText.setOrigin(0.5, 0);
        $titleText.setLetterSpacing(20);
        $titleText.setDepth(depth++);
        this.titleText = $titleText;

    }

    // Define a function for create the battle banner and the elements inside it
    createBattleBanner ()
    {
        //console.log('DebugScene.createBattleBanner() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

        // Draw the battle banner and collect a reference to it
        var ref = this.headerBanner;
        var depth = 200;
        var type = 'empty';
        var x = 14, y = ref.y + ref.height + 5
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let $battleBanner = new BattleBanner(this, x, y, {
            height: 213,
            fillStyle: { color: xcolor },
            mainText: '',
            depth: depth++
            });
        this.battleBanner = $battleBanner;

        // Create a mask for the battle banner area that we can add sprites to
        const spriteContainer = this.add.container();
        const spriteContainerMask = Graphics.makeRectangleMask(ctx, x, y, $battleBanner.width, $battleBanner.height, 5, false);
        spriteContainer.setMask(spriteContainerMask);
        spriteContainer.setDepth(depth++);
        this.battleBannerContainer = spriteContainer;

        // Draw the sprite grid as a background texture in front of the battle banner
        var x = $battleBanner.x, y = $battleBanner.y;
        var width = $battleBanner.width, height = $battleBanner.height;
        var $gridBackground = this.add.tileSprite(x, y, width, height, 'misc.sprite-grid');
        $gridBackground.setOrigin(0, 0);
        $gridBackground.setDepth(depth++);
        $gridBackground.setAlpha(0.2);
        spriteContainer.add($gridBackground);
        spriteContainer.sort('depth');

        // Draw a second sprite grid slightly shorter to act as a foreground texture for the battle banner
        y += 60, height -= 60;
        var $gridForeground = this.add.tileSprite(x, y, width, height, 'misc.sprite-grid');
        $gridForeground.setOrigin(0, 0);
        $gridForeground.setDepth(depth++);
        $gridForeground.setAlpha(0.4);
        spriteContainer.add($gridForeground);
        spriteContainer.sort('depth');

        // Draw a vertical black line on top of the foreground to make it look like a horizon
        var $horizonLine = this.add.graphics();
        $horizonLine.fillStyle(0x191919);
        $horizonLine.fillRect(x, y, width, 2);
        $horizonLine.setDepth(depth++);
        spriteContainer.add($horizonLine);
        spriteContainer.sort('depth');

        // Add the parts of the sprite grid object to the global object for easy reference
        this.spriteGrid = {
            background: $gridBackground,
            foreground: $gridForeground,
            horizontal: $horizonLine
            };

    }

    // Define a function for creating the two bounce banners that shift between elements
    createBounceBanners ()
    {
        //console.log('DebugScene.createBounceBanners() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);
        let safeTypeTokens = ctx.safeTypeTokens;

        // Create an empty type panel we can use as a boundary
        var depth = 1000;
        var ref = this.battleBanner;
        var width = ref.width, height = 80;
        var x = ref.x, y = ref.y + ref.height + 5;
        var color = typesIndex['empty'].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let $bouncePanel = Graphics.addTypePanel(this, {
            x: x,
            y: y,
            width: width,
            height: height,
            radius: { tl: 50, tr: 50, br: 50, bl: 50 },
            depth: depth++
            });
        $bouncePanel.setAlpha(1);
        this.bouncePanel = $bouncePanel;
        let bouncePanelBounds = $bouncePanel.getBounds();
        this.bouncePanelBounds = bouncePanelBounds;

        // Create a mask for the bounce container so we can add banners to it
        const maskGraphics = this.add.graphics({x: x, y: y});
        maskGraphics.fillStyle(0xff0000, 0);
        maskGraphics.fillRect(0, 0, bouncePanelBounds.width, bouncePanelBounds.height);
        maskGraphics.setVisible(false);
        const panelMask = maskGraphics.createGeometryMask();
        const bounceContainer = this.add.container();
        bounceContainer.setMask(panelMask);
        bounceContainer.setDepth(depth++);
        this.bouncePanelMask = panelMask;
        this.bounceBannerContainer = bounceContainer;

        // Create the first bounce banner for doctors
        var width = 90, height = 20;
        var x = bouncePanelBounds.x - 20;
        var y = bouncePanelBounds.y + 20;
        var types = ['attack', 'defense', 'speed'];
        var type = types[0];
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let $bounceBannerAlpha = new Banner(this, x, y, {
            width: width,
            height: height,
            fillStyle: { color: xcolor },
            borderRadius: { tl: 50, tr: 50, br: 50, bl: 50 },
            mainText: '',
            depth: depth++
            });
        $bounceBannerAlpha.type = type;
        $bounceBannerAlpha.types = types;
        $bounceBannerAlpha.addToContainer(bounceContainer);
        this.bounceBannerAlpha = $bounceBannerAlpha;

        // Create the second bounce banner for robots
        var width = 120, height = 30;
        var x = bouncePanelBounds.x2 - width + 20;
        var y = bouncePanelBounds.y2 - height - 20;
        var types = Object.values(safeTypeTokens);
        var type = types[0];
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let $bounceBannerBeta = new Banner(this, x, y, {
            width: width,
            height: height,
            fillStyle: { color: xcolor },
            borderRadius: { tl: 50, tr: 50, br: 50, bl: 50 },
            mainText: '',
            depth: depth++
            });
        $bounceBannerBeta.type = type;
        $bounceBannerBeta.types = types;
        $bounceBannerBeta.addToContainer(bounceContainer);
        this.bounceBannerBeta = $bounceBannerBeta;

    }

    // Define a function for updating the bounce banners on each update cycle
    updateBounceBanners (time, delta)
    {
        //console.log('DebugScene.updateBounceBanners() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);
        let safeTypeTokens = ctx.safeTypeTokens;

        // Pull in the bounce banner panel and bounds for reference
        let $bouncePanel = this.bouncePanel;
        let panelBounds = this.bouncePanelBounds;

        // -- ANIMATE BOUNCE BANNER ALPHA (DOCTORS) -- //

        // Animate the alpha bounce banner moving across the screen
        let $alphaBanner = this.bounceBannerAlpha;
        if (!$alphaBanner.directionX){ $alphaBanner.directionX = 'right'; }
        if (!$alphaBanner.directionY){ $alphaBanner.directionY = 'down'; }
        var bannerBounds = $alphaBanner.getBounds();
        var width = bannerBounds.width, height = bannerBounds.height;
        var speed = 5; // pixels per second
        var movement = speed * (delta / 1000);
        var newX = bannerBounds.x, newY = bannerBounds.y;
        var xDir = $alphaBanner.directionX, yDir = $alphaBanner.directionY;
        if (xDir === 'right') { newX += movement; }
        if (xDir === 'left') { newX -= movement; }
        if (yDir === 'down') { newY += movement; }
        if (yDir === 'up') { newY -= movement; }
        $alphaBanner.setPosition(newX, newY);
        var newDir = false;
        if (bannerBounds.x <= panelBounds.x && $alphaBanner.directionX !== 'right'){ $alphaBanner.directionX = 'right'; newDir = true; }
        if (bannerBounds.x2 >= panelBounds.x2 && $alphaBanner.directionX !== 'left'){ $alphaBanner.directionX = 'left'; newDir = true; }
        if (bannerBounds.y <= panelBounds.y && $alphaBanner.directionY !== 'down'){ $alphaBanner.directionY = 'down'; newDir = true; }
        if (bannerBounds.y2 >= panelBounds.y2 && $alphaBanner.directionY !== 'up'){ $alphaBanner.directionY = 'up'; newDir = true; }
        if (!$alphaBanner.isReady){
            if (bannerBounds.x > panelBounds.x
                && bannerBounds.x2 < panelBounds.x2
                && bannerBounds.y > panelBounds.y
                && bannerBounds.y2 < panelBounds.y2){
                $alphaBanner.isReady = true;
                } else {
                $alphaBanner.isReady = false;
                }
            }
        if (newDir && $alphaBanner.isReady){
            //console.log('Changing alpha banner direction to', $alphaBanner.directionX, $alphaBanner.directionY);
            SOUNDS.play('dink_mmi-gb', {volume: 0.2});
            var type = $alphaBanner.type;
            //console.log('$alphaBanner type:', type);
            if (ctx.allowRunningDoctors){
                //console.log('Show a running doctor of stat type:', type);
                let doctor = '', alt = '';
                if (type === 'defense'){ doctor = 'dr-light'; }
                if (type === 'attack'){ doctor = 'dr-wily'; }
                if (type === 'speed'){ doctor = 'dr-cossack'; }
                if (type === 'energy'){ doctor = 'proxy'; alt = 'alt2'; }
                let master = '', support = '';
                if (doctor === 'dr-light'){ master = 'mega-man'; support = 'roll'; }
                if (doctor === 'dr-wily'){ master = 'bass'; support = 'disco'; }
                if (doctor === 'dr-cossack'){ master = 'proto-man'; support = 'rhythm'; }
                if (doctor){ this.showDoctorRunning(doctor, alt, 'left'); }
                if (master && $alphaBanner.directionY === 'up'){ this.showMasterSliding(master, null, 'left'); }
                if (support && $alphaBanner.directionY === 'down'){ this.showMasterSliding(support, null, 'left'); }
                }
            // pick a new type for next time
            type = $alphaBanner.types[Math.floor(Math.random() * $alphaBanner.types.length)];
            var color = typesIndex[type]['colour_light'];
            var color2 = typesIndex[type]['colour_dark'];
            $alphaBanner.setColor(color, color2);
            $alphaBanner.type = type;
            //console.log('new $alphaBanner type:', type, 'color:', color, 'color2:', color2);
            }

        // -- ANIMATE BOUNCE BANNER BETA (MASTERS) -- //

        // Animate the beta bounce banner moving across the screen
        let $betaBanner = this.bounceBannerBeta;
        if (!$betaBanner.directionX){ $betaBanner.directionX = 'left'; }
        if (!$betaBanner.directionY){ $betaBanner.directionY = 'up'; }
        var bannerBounds = $betaBanner.getBounds();
        var width = bannerBounds.width, height = bannerBounds.height;
        var speed = 10; // pixels per second
        var movement = speed * (delta / 1000);
        var newX = bannerBounds.x, newY = bannerBounds.y;
        var xDir = $betaBanner.directionX, yDir = $betaBanner.directionY;
        if (xDir === 'right') { newX += movement; }
        if (xDir === 'left') { newX -= movement; }
        if (yDir === 'down') { newY += movement; }
        if (yDir === 'up') { newY -= movement; }
        $betaBanner.setPosition(newX, newY);
        var newDir = false;
        if (bannerBounds.x <= panelBounds.x && $betaBanner.directionX !== 'right'){ $betaBanner.directionX = 'right'; newDir = true; }
        if (bannerBounds.x2 >= panelBounds.x2 && $betaBanner.directionX !== 'left'){ $betaBanner.directionX = 'left'; newDir = true; }
        if (bannerBounds.y <= panelBounds.y && $betaBanner.directionY !== 'down'){ $betaBanner.directionY = 'down'; newDir = true; }
        if (bannerBounds.y2 >= panelBounds.y2 && $betaBanner.directionY !== 'up'){ $betaBanner.directionY = 'up'; newDir = true; }
        if (!$betaBanner.isReady){
            if (bannerBounds.x > panelBounds.x
                && bannerBounds.x2 < panelBounds.x2
                && bannerBounds.y > panelBounds.y
                && bannerBounds.y2 < panelBounds.y2){
                $betaBanner.isReady = true;
                } else {
                $betaBanner.isReady = false;
                }
            }
        if (newDir && $betaBanner.isReady){
            //console.log('Changing beta banner direction to', $betaBanner.directionX, $betaBanner.directionY);
            SOUNDS.play('dink_mmi-gb', {volume: 0.2});
            var type = $betaBanner.type;
            //console.log('$betaBanner type:', type);
            if (ctx.allowSlidingMasters){
                //console.log('Show a sliding master of type:', type);
                this.showMasterSliding(null, type, 'left');
                }
            // pick a new type for next time
            type = $betaBanner.types[Math.floor(Math.random() * $betaBanner.types.length)];
            var color = typesIndex[type]['colour_light'];
            var color2 = typesIndex[type]['colour_dark'];
            $betaBanner.setColor(color, color2);
            $betaBanner.type = type;
            //console.log('new $betaBanner type:', type, 'color:', color, 'color2:', color2);
            }

    }

    // Define a function for animating the main banner on each update cycle
    updateMainBanner (time, delta)
    {
        //console.log('DebugScene.updateMainBanner() called');

        // Pull in required object references
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
                // We are still safe to continue this direction
                mainBanner.setPosition(x + speed, y + speed);
                mainBanner.setSize(width - resize, height - resize);
                } else {
                // We need to bounce to the other side now
                if (ctx.allowRunningDoctors){ ctx.showDoctorRunning(); }
                if (ctx.allowSlidingMasters){
                    var doctor = ctx.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showMasterSliding(master, null, 'left');
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
                // We are still safe to continue this direction
                mainBanner.setPosition(x - speed, y - speed);
                mainBanner.setSize(width + resize, height + resize);
                } else {
                // We need to bounce to the other side now
                if (ctx.allowRunningDoctors){ ctx.showDoctorRunning(); }
                if (ctx.allowSlidingMasters){
                    var doctor = ctx.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showMasterSliding(master, null, 'left');
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

    }

    // Define a function for update the test banner on each update cycle
    updateTestBanner (time, delta)
    {
        //console.log('DebugScene.updateTestBanner() called');

        // Pull in required object references
        let ctx = this;
        let types = MMRPG.Indexes.types;
        let safeTypes = ctx.safeTypeTokens;
        //console.log('types =', typeof types, types);
        //console.log('safeTypes =', typeof safeTypes, safeTypes);

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
                this.showMasterSliding(null, type, 'right');
                }
            }

    }

    // Define a function for creating the buttons banner and associated elements inside it
    addPanelWithDebugButtons ()
    {
        //console.log('DebugScene.addPanelWithDebugButtons() called');

        // Pull in other required objects and references
        let ctx = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // HEADER BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var width = MMRPG.canvas.width - 20, height = 148;
        var y = MMRPG.canvas.height - height - 32, x = 10;
        let $debugButtonPanel = new Banner(ctx, x, y, {
            width: width,
            height: height,
            depth: depth++
            });
        this.debugButtonPanel = $debugButtonPanel;

        // Predefine some position vars to make things easier
        var ref = $debugButtonPanel;
        let bannerWidth = ref.width;
        let bannerHeight = ref.height;
        let bannerMinX = ref.x;
        let bannerMaxX = ref.x + bannerWidth;
        let bannerMinY = ref.y;
        let bannerMaxY = ref.y + bannerHeight;
        let bannerBounds = ref.getBounds();

        // Predefine some vars to make things easier
        var cell = null;
        var label = 'lorem', size = 8;
        var color = '#7d7d7d', background = '#262626';

        // Predefine the button grid to make positioning easier
        var offset = 25;
        var padding = 5;
        var numCols = 3;
        var numRows = 4;
        var buttonBounds = Graphics.getAdjustedBounds(bannerBounds, padding);
        var colWidths = Graphics.calculateColumnWidths(buttonBounds.width, [35, 30, 35]);
        var rowHeight = 24 + padding;
        var buttonGrid = BUTTONS.generateButtonGrid(buttonBounds, numCols, numRows, colWidths, rowHeight, padding);
        //console.log('buttonGrid:', buttonGrid);

        // BUTTON GRID

        // Define a quick function for adding placeholder buttons
        function addPlaceholderButton(cell){
            BUTTONS.makeSimpleButton('...', {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: '#696969', background: '#191919', size: 8,
                depth: depth++,
                disabled: true
                }, function(){
                //console.log('Placeholder button clicked');
                // ...
                });
            }

        // COLUMN 1

        cell = buttonGrid[0][0];
            // Create a trigger button for the "Welcome to the Prototype" popup
            label = 'Read "Welcome to the Prototype"';
            color = '#b99e3c';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log('Show Welcome Home button clicked');
                ctx.showWelcomeToThePrototype();
                });

        cell = buttonGrid[0][1];
            // Create a placeholder button
            addPlaceholderButton(cell);

        cell = buttonGrid[0][2];
            // Create buttons to add a running doctors to the scene
            label = 'Add Running Doctor (L)';
            color = '#6592ff';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log(label.toUpperCase() + ' button clicked');
                ctx.showDoctorRunning(null, null, 'left');
                });

        cell = buttonGrid[0][3];
            // Create a button to add a sliding master to the scene
            label = 'Add Sliding Master (L)';
            color = '#6592ff';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log(label.toUpperCase() + ' button clicked');
                ctx.showMasterSliding(null, null, 'left');
                });

        // COLUMN 2

        cell = buttonGrid[1][0];
            // Create a placeholder button
            addPlaceholderButton(cell);

        cell = buttonGrid[1][1];
            // Create a placeholder button
            addPlaceholderButton(cell);

        cell = buttonGrid[1][2];
            // Create a button to toggle the doctor stream
            label = 'Toggle Doctor Stream';
            color = '#00ff00';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(button){
                //console.log('Toggle Doctors Running button clicked');
                if (ctx.allowRunningDoctors){
                    button.text.setTint(0xff0000);
                    //button.text.setColor('#ff0000');
                    ctx.allowRunningDoctors = false;
                    ctx.bounceBannerAlpha.setAlpha(0.1);
                    } else {
                    button.text.setTint(0x00ff00);
                    //button.text.setColor('#00ff00');
                    ctx.allowRunningDoctors = true;
                    ctx.bounceBannerAlpha.setAlpha(1);
                    }
                });

        cell = buttonGrid[1][3];
            // Create a button to toggle the master stream
            label = 'Toggle Master Stream';
            color = '#00ff00';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(button){
                //console.log('Toggle Masters Sliding button clicked');
                if (ctx.allowSlidingMasters){
                    button.text.setTint(0xff0000);
                    //button.text.setColor('#ff0000');
                    ctx.allowSlidingMasters = false;
                    ctx.bounceBannerBeta.setAlpha(0.1);
                    } else {
                    button.text.setTint(0x00ff00);
                    //button.text.setColor('#00ff00');
                    ctx.allowSlidingMasters = true;
                    ctx.bounceBannerBeta.setAlpha(1);
                    }
                });

        // COLUMN 3

        cell = buttonGrid[2][0];
            // Create a trigger button for the "Tales from the Void" popup
            label = 'Read "Tales from the Void"';
            color = '#95c418';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log('Show Tales from the Void button clicked');
                ctx.showTalesFromTheVoid();
                });

        cell = buttonGrid[2][1];
            // Create a placeholder button
            addPlaceholderButton(cell);

        cell = buttonGrid[2][2];
            // Create buttons to add a running doctors to the scene
            label = 'Add Running Doctor (R)';
            color = '#d45858';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log(label.toUpperCase() + ' button clicked');
                ctx.showDoctorRunning(null, null, 'right');
                });

        cell = buttonGrid[2][3];
            // Create a button to add a sliding master to the scene
            label = 'Add Sliding Master (R)';
            color = '#d45858';
            BUTTONS.makeSimpleButton(label.toUpperCase(), {
                y: cell.y, x: cell.x,
                width: cell.width, height: cell.height,
                color: color, background: background, size: size,
                depth: depth++
                }, function(){
                //console.log(label.toUpperCase() + ' button clicked');
                ctx.showMasterSliding(null, null, 'right');
                });

        /*
        // Create a placeholder button
        addPlaceholderButton(cell);
        */

    }

    // Define a function that adds a panel to the scene with elemental type buttons for clicking
    addPanelWithTypeButtons ()
    {
        //console.log('DebugScene.addPanelWithTypeButtons() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;

        // Draw a panel with all of the elemental types as buttons
        var ref = this.debugButtonPanel;
        var width = MMRPG.canvas.width - 20, height = 68;
        var x = 10, y = ref.y - height - 5;
        let $typeButtonPanel = this.createTypeButtonPanel({
            x: x,
            y: y,
            width: width,
            height: height,
            padding: 6,
            margin: 6,
            types: this.safeTypeTokens,
            typesPerRow: 10,
            onClick: function($button, type){
                //console.log('Wow! Type button clicked!', 'type:', type, '$button:', $button);
                ctx.showMasterSliding(null, type, 'left');
                }
            });
        this.typeButtonPanel = $typeButtonPanel;

    }

    // Define a function that adds a panel to the scene with elemental type buttons for clicking
    createTypeButtonPanel (config)
    {

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
            padding: config.padding || 5,
            margin: config.margin || 5,
            radius: config.radius || { tl: 0, tr: 0, br: 0, bl: 0 },
            lineStyle: config.lineStyle || { width: 2, color: 0x0a0a0a },
            fillStyle: config.fillStyle || { color: 0x161616 },
            depth: config.depth || 1000,
            types: config.types || safeTypeTokens,
            typesPerRow: config.typesPerRow || Math.ceil(safeTypeTokens.length / 2),
            onClick: config.onClick || null
            };

        // Draw the panel with the specified configuration
        const $panelBack = Graphics.addTypePanel(ctx, panelConfig);

        // Draw little buttons on the type panel for each type
        let numTypes = panelConfig.types.length;
        let numTypesPerRow = panelConfig.typesPerRow;
        let buttonMargin = panelConfig.margin;
        let $typeButtons = [];
        let widthUsed = 0;
        let widthAvailable = panelConfig.width - (panelConfig.padding * 2);
        let typeButtonWidth = Math.floor(((widthAvailable + buttonMargin) - (buttonMargin * numTypesPerRow)) / numTypesPerRow);
        let typeButtonHeight = 24;
        let typeButtonX = panelConfig.x + panelConfig.padding;
        let typeButtonY = panelConfig.y + panelConfig.padding;
        let typeButtonDepth = panelConfig.depth + 1;
        let goToNextLine = function(){
            typeButtonX = panelConfig.x + panelConfig.padding;
            typeButtonY += typeButtonHeight + buttonMargin;
            widthUsed = 0;
            };
        //console.log('pre-vals', 'numTypes:', numTypes, 'widthAvailable:', widthAvailable, 'typeButtonWidth:', typeButtonWidth);
        //console.log('pre-test', '(numTypes * typeButtonWidth) =', (numTypes * typeButtonWidth), '(numTypes * (typeButtonWidth + buttonMargin)) =', (numTypes * (typeButtonWidth + buttonMargin)));
        for (let i = 0; i < panelConfig.types.length; i++)
        {
            let typeToken = panelConfig.types[i];
            let typeData = typesIndex[typeToken];
            //console.log('Adding type button:', typeToken);
            //console.log('typeButtonY:', typeButtonY, 'typeButtonX:', typeButtonX);
            //console.log('button:', typeToken, 'width:', typeButtonWidth, 'widthUsed:', widthUsed, 'widthAvailable:', widthAvailable);
            if ((widthUsed + typeButtonWidth) > widthAvailable){
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
                //console.log('Huh? Type button clicked:', typeToken);
                if (panelConfig.onClick){
                    panelConfig.onClick($typeButton, typeToken);
                    }
                });
            $typeButtons.push($typeButton);
            widthUsed += typeButtonWidth + buttonMargin;
            if (widthUsed <= widthAvailable){
                typeButtonX += (typeButtonWidth + buttonMargin);
                } else {
                //console.log('> Moving to next row of buttons');
                goToNextLine();
                }
            //console.log('typeButtonY:', typeButtonY, 'typeButtonX:', typeButtonX);
            //console.log('width:', typeButtonWidth, 'widthUsed:', widthUsed, 'widthAvailable:', widthAvailable);
        }

        // Return an object with generated elements
        return {
            x: panelConfig.x,
            y: panelConfig.y,
            width: panelConfig.width,
            height: panelConfig.height,
            panel: $panelBack,
            buttons: $typeButtons
            };

    }



    // Define a function that shows a popup with a debug welcome message inside
    showWelcomeToThePrototype ()
    {
        //console.log('DebugScene.showWelcomeToThePrototype() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;

        // Display a popup to welcome the user to the debug room
        let ctx = this;
        let panelText = "Welcome to Mega Man RPG: Legacy of the Prototype!";
        panelText += '\n' + "Looks like you've reached the DEBUG room!";
        POPUPS.displayPopup(panelText, {
            onComplete: function() {
                //console.log('Welcome to the Prototype completed');
                // ...
                }
            });

        // Show a robot master sliding the the background while they're reading
        if (ctx.allowSlidingMasters){
            ctx.showMasterSliding('auto', null, 'right');
            }

    }

    // Define a function that shows a popup with the story of the dark void and the alien entity
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
                // ...
                }
            });

        // Show a doctor running the the background while they're reading
        if (ctx.allowRunningDoctors){
            ctx.showDoctorRunning('proxy', null, 'right');
            }

    }

}