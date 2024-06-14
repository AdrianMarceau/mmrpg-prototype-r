// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: DebugRunnerScene.js (scene)
// "Debug Click Runner" mini-game for testing various sprite movement
// and collision mechanics in a safe environment.  The TLDR of this
// mini-game is that you need to click the bad guys while avoiding
// the good guys long enough that they can get to the other side.
// ------------------------------------------------------------ //

import MMRPG from '../../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../../utils/GraphicsUtility.js';
import { StringsUtility as Strings } from '../../utils/StringsUtility.js';

import SpritesManager from '../../managers/SpritesManager.js';
import PopupsManager from '../../managers/PopupsManager.js';
import ButtonsManager from '../../managers/ButtonsManager.js';

import Banner from '../../components/Banner/Banner.js';
import MainBanner from '../../components/Banner/MainBanner.js';
import BattleBanner from '../../components/Banner/BattleBanner.js';

export default class DebugRunnerScene extends Phaser.Scene
{
    constructor ()
    {

        console.log('DebugRunnerScene.constructor() called');
        super('DebugRunner');

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
        MMRPG.init('DebugRunnerScene', 'DebugRunner', function(){

            //console.log('DebugRunnerScene.init() called for the first time');
            MMRPG.Cache.Debug.foo = 'bar';

            }, function(){

            //console.log('DebugRunnerScene.init() called every other time');
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
        //console.log('DebugRunnerScene.preload() called');

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
        this.debugScoreTracker = {};
        this.debugScoreTracker.allyRobotsLost = 0;
        this.debugScoreTracker.allyRobotsSaved = 0;
        this.debugScoreTracker.enemyRobotsDefeated = 0;
        this.debugScoreTracker.enemyRobotsMissed = 0;

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
        //console.log('DebugRunnerScene.create() called');

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.create(this);

        // Pull in other required objects and references
        let ctx = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // First we add the title banner up at the top
        this.createTitleBanner();

        // Next we add the buttons banner under the title
        this.createHeaderBanner();

        // Next we add the battle banner to the scene
        this.createBattleBanner();

        // Next we add the two bound banners to the scene
        this.createBounceBanners();

        // Last we create the "score" for this debug mode
        this.createDebugScore();


        // DEBUG DEBUG DEBUG
        // <----------------

        // Create all the test buttons and banners for the scene
        //this.createTestButtons();
        //this.createTestBanners();

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
        var depth = 2000;
        var width = Math.ceil(MMRPG.canvas.width / 2), height = 0;
        var x = MMRPG.canvas.centerX - 130, y = 215;

        // Define the title text and then add it to the scene
        var size = 12;
        var height = Math.ceil(size * 2);
        var title = "WELCOME TO DEBUG RUNNER";
        let $title = Strings.addFormattedText(this, x, y, title, {
            size: size,
            width: width,
            height: height,
            border: false,
            color: '#ffffff',
            depth: depth++,
            });
        this.introTitle = $title;

        // Define the rules text and then add it to the scene
        var size = 8;
        var height = Math.ceil(size * 2);
        var rules = [
            "+ Click to defeat enemy robots!",
            "+ Avoid clicking ally robots!",
            "+ Good luck!"
            ];
        let $rules = [];
        y += 10;
        for (let i = 0; i < rules.length; i++){
            let rule = rules[i];
            y += height + 5;
            let $rule = Strings.addFormattedText(this, x, y, rule, {
                size: size,
                width: width,
                height: height,
                border: false,
                color: '#ffffff',
                depth: depth++,
                });
            $rules.push($rule);
            }
        this.introRules = $rules;

        // Create a tween that fades the title after a few seconds
        let delay = 3000;
        let titleTween;
        this.time.delayedCall(delay, function(){
            titleTween = ctx.tweens.addCounter({
                from: 100,
                to: 0,
                ease: 'Sine.easeOut',
                delay: 100,
                duration: 1000,
                onUpdate: function () {
                    //console.log('titleTween:', titleTween.getValue());
                    $title.setAlpha(titleTween.getValue() / 100);
                    $title.setPosition('-=0', '-=2');
                    },
                onComplete: function () {
                    //console.log('titleTween complete!');
                    $title.destroy();
                    }
                });
            }, [], this);

        // Create a tween that fades out each rule after a few seconds
        let ruleTweens = [];
        for (let i = 0; i < $rules.length; i++){
            let $rule = $rules[i];
            delay += 1000;
            let ruleTween = this.time.delayedCall(delay, function(){
                ruleTweens[i] = ctx.tweens.addCounter({
                    from: 100,
                    to: 0,
                    ease: 'Sine.easeOut',
                    delay: 100,
                    duration: 1000,
                    onUpdate: function () {
                        //console.log('ruleTweens['+i+']:', ruleTweens[i].getValue());
                        $rule.setAlpha(ruleTweens[i].getValue() / 100);
                        $rule.setPosition('-=0', '-=2');
                        },
                    onComplete: function () {
                        //console.log('ruleTweens['+i+'] complete!');
                        $rule.destroy();
                        }
                    });
                }, [], this);
            }

        // Draw a panel with all of the elemental types as buttons
        var x = 10, y = MMRPG.canvas.height - 194;
        var width = MMRPG.canvas.width - 20, height = 160;
        this.addPanelWithTypeButtons({
            x: x,
            y: y,
            width: width,
            height: height,
            radius: {tl: 30, tr: 30, bl: 30, br: 30},
            types: this.safeTypeTokens,
            onClick: function($button, type){
                //console.log('Wow! Type button clicked!', 'type:', type, '$button:', $button);
                ctx.showMasterSliding(null, type, 'right');
                }
            });


        // -- DEBUG SOUND EFFECTS -- //

        // Play a sound effect to make sure they're working
        SOUNDS.play('megaman_ready_mm8-psx');


        // ---------------->
        // DEBUG DEBUG DEBUG

        console.log('MMRPG = ', MMRPG);
        console.log('SPRITES =', SPRITES);
        //Graphics.test();
        //Strings.test();

    }

    update (time, delta)
    {
        //console.log('DebugRunnerScene.update() called w/ time =', time, 'delta =', delta);

        if (typeof this.debugAddedSprites === 'undefined'){ this.debugAddedSprites = 0; }
        if (typeof this.debugRemovedSprites === 'undefined'){ this.debugRemovedSprites = 0; }

        const activeSprites = this.battleBannerContainer.getAll();
        const activeSpritesLength = activeSprites.length;
        //console.log('activeSprites =', activeSprites);
        //console.log('activeSpritesLength =', activeSpritesLength);
        //console.log('this.debugAddedSprites =', this.debugAddedSprites);
        //console.log('this.debugRemovedSprites =', this.debugRemovedSprites);

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
        //console.log('DebugRunnerScene.showMasterSliding() called w/ token =', token, 'alt =', alt, 'side =', side);
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
        var offset = ((numSprites % 10) * 5);
        let spriteX = spriteSide === 'left' ? (0 - offset - 40) : (MMRPG.canvas.width + offset + 40);
        let spriteY = this.battleBanner.y + 90 + ((numSprites % 10) * 10);

        // Create the new sliding sprite and add it to the scene
        let $robotSprite = ctx.add.sprite(spriteX, spriteY, robotSpriteInfo['sprite'][spriteDirection]['sheet']);
        ctx.debugSprites.push($robotSprite);
        $robotSprite.debugKey = ctx.debugSprites.length - 1;
        ctx.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $robotSprite.kind = 'robot';
        $robotSprite.token = spriteToken;
        $robotSprite.team = spriteSide;
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
            var emptyType = 'empty';
            var emptyColor = typesIndex[emptyType].colour_light;
            var emptyColorX = Phaser.Display.Color.GetColor(emptyColor[0], emptyColor[1], emptyColor[2]);
            if ($robotSprite.team){
                console.log('Destroyed sprite:', spriteToken, 'on team:', $robotSprite.team);
                ctx.time.delayedCall(200, function(){
                    SOUNDS.play('dead_mmi-gb', {volume: 0.3});
                    if ($robotSprite.team === 'right'){

                        // Enemy team, this is GOOD, we can celebrate (dark green: #1f350d)
                        ctx.battleBanner.setBackgroundColor('#1f350d');
                        //ctx.bouncePanel.setBackgroundColor('#1f350d');
                        ctx.debugScoreTracker.enemyRobotsDefeated++;

                        } else if ($robotSprite.team === 'left'){

                        // Our own team, this is BAD, we should tremble (dark red: #350d0d)
                        ctx.battleBanner.setBackgroundColor('#350d0d');
                        //ctx.bouncePanel.setBackgroundColor('#350d0d');
                        ctx.debugScoreTracker.allyRobotsLost++;

                        }
                    ctx.refreshDebugScore();
                    });
                ctx.time.delayedCall(400, function(){
                    ctx.battleBanner.setBackgroundColor(emptyColor);
                    //ctx.bouncePanel.setBackgroundColor(emptyColor);
                    });
                }
            });

        // Update the scene with last-used sprite token
        ctx.lastSlidingMaster = spriteToken;
    }

    // Define a function for creating the title banner and associated elements inside it
    createTitleBanner ()
    {
        //console.log('DebugRunnerScene.createTitleBanner() called');

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

        // TITLE TEXT

        // Add a title to the scene for the player to see
        var y = (this.titleBanner.y + 5), x = MMRPG.canvas.centerX;
        var $loadText = this.add.bitmapText(x, y, 'megafont-white', '- Debug Runner -', 16);
        $loadText.setOrigin(0.5, 0);
        $loadText.setLetterSpacing(20);
        $loadText.setDepth(depth++);

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
        BUTTONS.makeSimpleButton('Restart Runner', buttonConfig, function(){
            //console.log('DebugRunner button clicked');
            ctx.scene.start('DebugRunner');
            });

    }

    // Define a function for creating the buttons banner and associated elements inside it
    createHeaderBanner ()
    {
        //console.log('DebugRunnerScene.createHeaderBanner() called');

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
        var width = MMRPG.canvas.width - 20, height = 100;
        this.headerBanner = new Banner(ctx, x, y, {
            width: width,
            height: height,
            depth: depth++
            });

        // Predefine some position vars to make things easier
        let bannerWidth = this.headerBanner.width;
        let bannerHeight = this.headerBanner.height;
        let bannerMinX = this.headerBanner.x;
        let bannerMaxX = this.headerBanner.x + bannerWidth;
        let bannerMinY = this.headerBanner.y;
        let bannerMaxY = this.headerBanner.y + bannerHeight;
        let bannerBounds = this.headerBanner.getBounds();

        // PAUSE BUTTON

        // Create the pause button smack-dab in the center for pausing the game
        var width = 100, height = 23, size = 8;
        var y = (this.headerBanner.y + 3);
        var x = (this.headerBanner.x + (bannerWidth / 2) - (width / 2));
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

        // Predefine some vars to make things easier
        var cell = null;
        var label = 'lorem', size = 8;
        var color = '#7d7d7d', background = '#262626';

        // Predefine the button grid to make positioning easier
        var offset = 25;
        var padding = 5;
        var numCols = 3;
        var numRows = 2;
        var buttonBounds = Graphics.getAdjustedBounds(bannerBounds, [31, padding, padding, padding]);
        var colWidths = Graphics.calculateColumnWidths(buttonBounds.width, [40, 30, 30]);
        var rowHeight = 24 + padding;
        var buttonGrid = BUTTONS.generateButtonGrid(buttonBounds, numCols, numRows, colWidths, rowHeight, padding);
        //console.log('buttonGrid:', buttonGrid);

        // POPUP BUTTONS

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

        // Create a placeholder button
        cell = buttonGrid[0][0];
        addPlaceholderButton(cell);

        // Create a placeholder button
        cell = buttonGrid[0][1];
        addPlaceholderButton(cell);

        // DOCTOR/ROBOT TOGGLE BUTTONS

        // Create a button to toggle the doctor stream
        cell = buttonGrid[1][0];
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
                } else {
                button.text.setTint(0x00ff00);
                //button.text.setColor('#00ff00');
                ctx.allowRunningDoctors = true;
                }
            });

        // Create a button to toggle the master stream
        cell = buttonGrid[1][1];
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
                } else {
                button.text.setTint(0x00ff00);
                //button.text.setColor('#00ff00');
                ctx.allowSlidingMasters = true;
                }
            });


        // DOCTOR/ROBOT ADD-TO-SCENE BUTTONS

        // Create a button to add a running doctor to the scene
        cell = buttonGrid[2][0];
        label = 'Add Running Doctor';
        color = '#6592ff';
        BUTTONS.makeSimpleButton(label.toUpperCase(), {
            y: cell.y, x: cell.x,
            width: cell.width, height: cell.height,
            color: color, background: background, size: size,
            depth: depth++
            }, function(){
            //console.log('Show Doctor Running button clicked');
            ctx.showDoctorRunning();
            });

        // Create a button to add a sliding master to the scene
        cell = buttonGrid[2][1];
        label = 'Add Sliding Master';
        color = '#6592ff';
        BUTTONS.makeSimpleButton(label.toUpperCase(), {
            y: cell.y, x: cell.x,
            width: cell.width, height: cell.height,
            color: color, background: background, size: size,
            depth: depth++
            }, function(){
            //console.log('Show Master Sliding button clicked');
            ctx.showMasterSliding(null, null, 'left');
            });

    }

    // Define a function for create the battle banner and the elements inside it
    createBattleBanner ()
    {
        //console.log('DebugRunnerScene.createBattleBanner() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

        // Draw the battle banner and collect a reference to it
        var depth = 200;
        var type = 'empty';
        var x = 14, y = 150;
        var color = typesIndex[type].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        let battleBanner = new BattleBanner(this, x, y, {
            height: 200,
            fillStyle: { color: xcolor },
            mainText: '',
            depth: depth++
            });
        this.battleBanner = battleBanner;

        // Create a mask for the battle banner area that we can add sprites to
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0x660022);
        maskGraphics.fillRect(x, y, battleBanner.width, battleBanner.height);
        maskGraphics.setVisible(false);
        const bannerMask = maskGraphics.createGeometryMask();
        const spriteContainer = this.add.container();
        spriteContainer.setMask(bannerMask);
        spriteContainer.setDepth(depth++);
        this.battleBannerMask = bannerMask;
        this.battleBannerContainer = spriteContainer;

    }

    // Define a function for creating the two bounce banners that shift between elements
    createBounceBanners ()
    {
        //console.log('DebugRunnerScene.createBounceBanners() called');

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
        //console.log('safeTypeTokens:', safeTypeTokens);

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
        var types = Object.values(safeTypeTokens).filter(function(type){ return (type !== 'none' && type !== 'copy'); });
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
        //console.log('DebugRunnerScene.updateBounceBanners() called');

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
        var speed = 15; // pixels per second
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
            var types = $alphaBanner.types;
            var type = types[Math.floor(Math.random() * types.length)];
            //console.log('new type =', type);
            var color = typesIndex[type]['colour_light'];
            var color2 = typesIndex[type]['colour_dark'];
            $alphaBanner.setColor(color, color2);
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
            }

        // -- ANIMATE BOUNCE BANNER BETA (MASTERS) -- //

        // Animate the beta bounce banner moving across the screen
        let $betaBanner = this.bounceBannerBeta;
        if (!$betaBanner.directionX){ $betaBanner.directionX = 'left'; }
        if (!$betaBanner.directionY){ $betaBanner.directionY = 'up'; }
        var bannerBounds = $betaBanner.getBounds();
        var width = bannerBounds.width, height = bannerBounds.height;
        var speed = 30; // pixels per second
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
            var types = $betaBanner.types;
            var type = types[Math.floor(Math.random() * types.length)];
            //console.log('new type =', type);
            var color = typesIndex[type]['colour_light'];
            var color2 = typesIndex[type]['colour_dark'];
            $betaBanner.setColor(color, color2);
            if (ctx.allowSlidingMasters){
                //console.log('Show a sliding master of type:', type);
                this.showMasterSliding(null, type, 'right');
                }
            }

    }

    // Define a function for creating debug score text and adding it to the scene
    createDebugScore ()
    {
        //console.log('DebugRunnerScene.createDebugScore() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;

        // Create a debug text object for displaying the current score
        var ref = this.battleBanner;
        var space = 200;
        var x = ref.x + (ref.width / 2);
        var y = ref.y + 10;
        let $debugScoreText = this.add.text(x, y, 'Score: 0', { fontSize: '16px', fill: '#ffffff' });
        $debugScoreText.setOrigin(0.5, 0);
        $debugScoreText.setDepth(9999);
        this.debugScoreText = $debugScoreText;

    }

    // Define a function for refreshing the debug score text with whatever values have changed
    refreshDebugScore ()
    {
        //console.log('DebugRunnerScene.refreshDebugScore() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;

        // Recalculate the score given current circumstances
        let score = 0;
        score -= ctx.debugScoreTracker.allyRobotsLost * 40;
        score -= ctx.debugScoreTracker.enemyRobotsMissed * 30;
        score += ctx.debugScoreTracker.allyRobotsSaved * 20;
        score += ctx.debugScoreTracker.enemyRobotsDefeated * 10;

        // Update the debug text object with the new score
        let $debugScoreText = this.debugScoreText;
        $debugScoreText.setText('Score: ' + score);
        if (score > 0){
            $debugScoreText.setColor('#00ff00');
            } else if (score < 0){
            $debugScoreText.setColor('#ff0000');
            } else {
            $debugScoreText.setColor('#ffffff');
            }

    }

    // Define a function that adds a panel to the scene with elemental type buttons for clicking
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
            onClick: config.onClick || null
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
                //console.log('Huh? Type button clicked:', typeToken);
                if (panelConfig.onClick){
                    panelConfig.onClick($typeButton, typeToken);
                    }
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

}