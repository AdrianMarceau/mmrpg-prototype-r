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
import SoundsManager from '../managers/SoundsManager.js';
import PopupsManager from '../managers/PopupsManager.js';
import ButtonsManager from '../managers/ButtonsManager.js';

import Banner from '../components/Banner/Banner.js';
import MainBanner from '../components/Banner/MainBanner.js';
import BattleBanner from '../components/Banner/BattleBanner.js';

export default class DebugScene extends Phaser.Scene
{
    constructor ()
    {

        //console.log('DebugScene.constructor() called');
        super('Debug');

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(this);
        let SOUNDS = SoundsManager.getInstance(this);
        let POPUPS = PopupsManager.getInstance(this);
        let BUTTONS = ButtonsManager.getInstance(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        this.SOUNDS = SOUNDS;
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
        this.SOUNDS.init(this);
        this.BUTTONS.init(this);
        this.POPUPS.init(this);

    }

    preload ()
    {
        //console.log('DebugScene.preload() called');

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.preload(this);

        // Before doing anything else, let's fake some save data
        this.generateFakeSaveData();

        // Pull in other required objects and references
        let scene = this;
        let SPRITES = this.SPRITES;
        let SOUNDS = this.SOUNDS;
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

        // Make sure we actually preload the sprites now
        SPRITES.preloadPending(this);

    }

    create ()
    {
        //console.log('DebugScene.create() called');

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.create(this);

        // Pull in other required objects and references
        let scene = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // Always print these when starting the DEBUG scene
        console.log('%c->%c MMRPG:', 'color: #bcf819;', '', MMRPG);
        //console.log('>> SPRITES:', SPRITES);

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
            var depth = 2000;
            var width = Math.ceil(MMRPG.canvas.width / 3), height = 90;
            var x = MMRPG.canvas.xMax - width - 20, y = 150;
            var lorem = "[Hey]{water} there [Bomb Man]{explode}! I know [i]I'm[/i] good, but how are [b]you[/b] today? I hear you got hit by a [Flame Sword]{flame_cutter}! [b][i]Your weakness[/i][/b]!!! [b][Gravity Man]{space_electric}[/b] is the one who told me btw.";
            let $floatingTextBubble = Strings.addFormattedText(this, x, y, lorem, {
                width: width,
                height: height,
                border: true,
                color: '#ffffff',
                depth: depth++,
                padding: 10,
                });
            scene.floatingTextBubble = $floatingTextBubble;
            // add two robot masters talking to each other for effect
            var origin = [0.5, 1];
            var x = x + (width / 2), y = y + 2;
            let $bubbleRobot1 = new MMRPG_Robot(this, 'star-man', null, { x: x - 40, y: y, z: depth++, direction: 'right', scale: 2, origin: origin });
            let $bubbleRobot2 = new MMRPG_Robot(this, 'bomb-man', null, { x: x + 40, y: y, z: depth++, direction: 'left', scale: 2, origin: origin });
            $bubbleRobot1.startIdleAnimation();
            $bubbleRobot2.startIdleAnimation();
            // automatically fade out and remove the above after a few seconds
            let floatingTextBubbleTween;
            scene.time.delayedCall(4000, function(){
                floatingTextBubbleTween = this.tweens.addCounter({
                    from: 100,
                    to: 0,
                    ease: 'Sine.easeOut',
                    delay: 100,
                    duration: 1000,
                    onUpdate: function () {
                        //console.log('floatingTextBubbleTween:', floatingTextBubbleTween.getValue());
                        let alpha = floatingTextBubbleTween.getValue() / 100;
                        $floatingTextBubble.setAlpha(alpha);
                        $bubbleRobot1.setAlpha(alpha);
                        $bubbleRobot2.setAlpha(alpha);
                        $floatingTextBubble.setPosition(null, '-=2');
                        $bubbleRobot1.setPosition(null, '-=1');
                        $bubbleRobot2.setPosition(null, '-=1');
                        },
                    onComplete: function () {
                        //console.log('floatingTextBubbleTween complete!');
                        $floatingTextBubble.destroy();
                        $bubbleRobot1.destroy();
                        $bubbleRobot2.destroy();
                        $bubbleRobot1 = null;
                        $bubbleRobot2 = null;
                        }
                    });
                }, [], this);

            // -- DEBUG SOUND EFFECTS -- //

            // Play a sound effect to make sure they're working
            SOUNDS.playSoundEffect('9-reggae-laughs_rockboard-nes', {volume: 1.5, delay: 100});


            // -- DEBUG SPRITE TESTING -- //

            // Create some primitive MMRPG objects for testing purposes
            let $battleBanner = scene.battleBanner;
            var bannerY = $battleBanner.y;
            var fieldDepth = $battleBanner.depths.field;
            var actionDepth = $battleBanner.depths.action;
            var baseX = 50, baseY = 170, baseZ = 0, lastZ = baseZ;
            var $debugObjects = {};
            $debugObjects.player = new MMRPG_Player(this, 'dr-light', null, { x: (baseX + 0), y: (baseY + 0), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.robot = new MMRPG_Robot(this, 'mega-man', null, { x: (baseX + 0), y: (baseY + 40), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.robot2 = new MMRPG_Robot(this, 'quick-man', null, { x: (baseX + 40), y: (baseY + 40), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.robot3 = new MMRPG_Robot(this, 'wood-man', null, { x: (baseX + 80), y: (baseY + 40), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.ability = new MMRPG_Ability(this, 'buster-shot', null, { x: (baseX + 0), y: (baseY + 80), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.ability2 = new MMRPG_Ability(this, 'super-arm', null, { x: (baseX + 40), y: (baseY + 80), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.item = new MMRPG_Item(this, 'energy-tank', null, { x: (baseX + 0), y: (baseY + 120), z: lastZ++, depth: actionDepth, origin: [0.5, 1] });
            $debugObjects.field = new MMRPG_Field(this, 'prototype-subspace', { foreground_variant: 'decayed' }, { x: 0, y: bannerY, z: baseZ, depth: fieldDepth, origin: [0, 0] });
            $debugObjects.skill = new MMRPG_Skill(this, 'xtreme-submodule', null);
            $debugObjects.type = new MMRPG_Type(this, 'water');
            let onClickTestObject = function(){
                SOUNDS.playMenuSound('link-click');
                let $sprite = this.sprite;
                this.stopAll();
                if (this.kind === 'player' || this.kind === 'robot'){
                    this.slideSpriteForward(function(){
                        let flipDirection = false;
                        if (this.direction === 'left' && this.x <= (MMRPG.canvas.xMin + 100)){ flipDirection = true; }
                        else if (this.direction === 'right' && this.x >= (MMRPG.canvas.xMax - 100)){ flipDirection = true; }
                        if (this.kind === 'player'){
                            this.shakeSprite();
                            this.setFrame('summon');
                            if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                            $sprite.subTimers.effectTimer = this.delayedCall(600, function(){
                                this.resetFrame();
                                if (flipDirection){ this.flipDirection(); }
                                this.startIdleAnimation(true, true);
                                });
                            } else if (this.kind === 'robot'){
                            if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                            $sprite.subTimers.effectTimer = this.delayedCall(250, function(){
                                let currentAlt = this.getImageAlt();
                                let altOptions = this.data.image_alts || [];
                                let altOptionsTokens = altOptions.map(item => item.token);
                                altOptionsTokens.unshift(this.objectConfig.baseAltSheet);
                                let nextAltKey = altOptionsTokens.indexOf(currentAlt) + 1;
                                let nextAltToken = altOptionsTokens[nextAltKey];
                                this.setFrame('summon');
                                this.shakeSprite();
                                this.setImageAlt(nextAltToken, function(){
                                    if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                                    $sprite.subTimers.effectTimer = this.delayedCall(600, function(){
                                        this.resetFrame();
                                        if (flipDirection){ this.flipDirection(); }
                                        this.startIdleAnimation(true, true);
                                        });
                                    });
                                });
                            }
                        });
                    } else if (this.kind === 'ability'){
                    let distance = 100;
                    let direction = this.direction;
                    let x = (direction === 'left' ? '-=' : '+=') + distance;
                    let frame = this.getCounter('debugFrame') || 0;
                    let maxFrame = this.getValue('debugMaxFrame') || 0;
                    if (maxFrame > 0){ this.setFrame(frame + 1); }
                    this.moveToPositionX(x, 500, function(){
                        let flipDirection = false;
                        if (this.direction === 'left' && this.x <= (MMRPG.canvas.xMin + 100)){ flipDirection = true; }
                        else if (this.direction === 'right' && this.x >= (MMRPG.canvas.xMax - 100)){ flipDirection = true; }
                        if (maxFrame > 0){ this.setFrame(frame); }
                        this.shakeSprite();
                        if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                        $sprite.subTimers.effectTimer = this.delayedCall(200, function(){
                            if ((frame + 2) >= maxFrame){
                                let currentSheet = this.getImageSheet();
                                let numSheetOptions = this.data.image_sheets || 1;
                                let nextSheet = currentSheet + 1;
                                if (nextSheet > numSheetOptions){ nextSheet = 1; }
                                //console.log(this.token + ' | -> changing sheet to ' + nextSheet);
                                this.setImageSheet(nextSheet, function(){
                                    //console.log(this.token + ' | -> sheet changed to ' + nextSheet);
                                    this.setFrame(0);
                                    this.setCounter('debugFrame', 0);
                                    if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                                    $sprite.subTimers.effectTimer = this.delayedCall(200, function(){
                                        //console.log(this.token + ' | -> flipping direction (current: ' + this.direction + ')');
                                        if (flipDirection){ this.flipDirection(); }
                                        });
                                    });
                                } else {
                                let nextFrame = frame + 2;
                                this.setFrame(nextFrame);
                                this.setCounter('debugFrame', nextFrame);
                                //console.log(this.token + ' | -> changing frame to ' + nextFrame);
                                if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                                $sprite.subTimers.effectTimer = this.delayedCall(200, function(){
                                    //console.log(this.token + ' | -> nextFrame changed to ' + nextFrame);
                                    //console.log(this.token + ' | -> flipping direction (current: ' + this.direction + ')');
                                    if (flipDirection){ this.flipDirection(); }
                                    });
                                }
                            });
                        }, {easing: 'Sine.easeOut'});
                    } else if (this.kind === 'item'){
                    let distance = 100;
                    let direction = this.direction;
                    let x = (direction === 'left' ? '-=' : '+=') + distance;
                    this.moveToPositionX(x, 600, function(){
                        let flipDirection = false;
                        if (this.direction === 'left' && this.x <= (MMRPG.canvas.xMin + 100)){ flipDirection = true; }
                        else if (this.direction === 'right' && this.x >= (MMRPG.canvas.xMax - 100)){ flipDirection = true; }
                        if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                        $sprite.subTimers.effectTimer = this.delayedCall(200, function(){
                            let currentSheet = this.getImageSheet();
                            let numSheetOptions = this.data.image_sheets || 1;
                            let nextSheet = currentSheet + 1;
                            if (nextSheet > numSheetOptions){ nextSheet = 1; }
                            this.shakeSprite();
                            //console.log(this.token + ' | -> changing sheet to ' + nextSheet);
                            this.setImageSheet(nextSheet, function(){
                                //console.log(this.token + ' | -> sheet changed to ' + nextSheet);
                                if ($sprite.subTimers.effectTimer){ $sprite.subTimers.effectTimer.remove(); }
                                $sprite.subTimers.effectTimer = this.delayedCall(200, function(){
                                    //console.log(this.token + ' | -> flipping direction (current: ' + this.direction + ')');
                                    if (flipDirection){ this.flipDirection(); }
                                    });
                                });
                            });
                        });
                    } else {
                    return;
                    }
                };
            for (let key in $debugObjects){
                let $object = $debugObjects[key];
                //console.log('$'+key+' =', $object);
                scene.battleBanner.add($object);
                $object.useContainerForDepth(true);
                if ($object.kind === 'ability'
                    && $object.token === 'super-arm'){
                    $object.setValue('debugMaxFrame');
                    }
                $object.setShadow(true);
                $object.startIdleAnimation(true, true);
                if ($object.kind === 'field'){
                    $object.setForegroundOffset(null, -34);
                    } else {
                    $object.setOnClick(onClickTestObject);
                    }
                }
            window.MMRPG_DebugScene_debugObjects = $debugObjects;
            console.log('$debugObjects (small) (MMRPG_DebugScene_customObjects) =\n', $debugObjects);

            // Animate the MMRPG field object in various ways for testing purposes
            const debugFieldConfig = {};
            const startDebugFieldAnimations = function(){
                //console.log('DebugScene.create().startDebugFieldAnimations()');
                let $field = $debugObjects.field;
                let config = debugFieldConfig;
                if (!$field){ return; }
                if (!config.baseX){ config.baseX = $field.x; }
                if (!config.baseY){ config.baseY = $field.y; }
                if (!config.baseOffsetX){ config.baseOffsetX = $field.getBackgroundOffsetX(); }
                if (!config.baseOffsetY){ config.baseOffsetY = $field.getBackgroundOffsetY(); }
                if (config.tween){ config.tween.remove(); }
                config.tween = scene.tweens.addCounter({
                    from: 0,
                    to: 100,
                    ease: 'Sine.easeInOut',
                    duration: 3000,
                    yoyo: true,
                    repeat: -1,
                    delay: 600,
                    onUpdate: function () {
                        //console.log('startDebugFieldAnimations().onUpdate() | -> config.tween:', config.tween.getValue());
                        let value = config.tween.getValue();
                        //let newPositionY = config.baseY + Math.floor(15 * (value / 100));
                        //$field.setPositionY(newPositionY);
                        let backgroundOffsetY = config.baseOffsetY - Math.floor(15 * (value / 100));
                        //console.log('config.baseOffsetY =', config.baseOffsetY, 'backgroundOffsetY =', backgroundOffsetY);
                        $field.setBackgroundOffsetY(backgroundOffsetY);
                        },
                    onComplete: function () {
                        //console.log('startDebugFieldAnimations().onComplete() | -> config.tween complete!');
                        if (config.tween){ config.tween.remove(); }
                        //$field.setPositionY(config.baseY);
                        //$field.setBackgroundOffsetY(config.baseOffsetY);
                        }
                    });
                };
            startDebugFieldAnimations();

            // Create some mods of the above to see what's possible
            var $ref = scene.battleBanner;
            var commonX = $ref.x + ($ref.width / 2);
            var commonY = $ref.y + ($ref.height / 2) + 50; //76;

            // Define a custom hover effect for all the custom robot masters/bosses/mechas
            let customMouseOver = function(){
                if (this.isMoving){ return; }
                this.stopIdleAnimation();
                this.setFrame('taunt');
                };
            let customMouseOut = function(){
                if (this.isMoving){ return; }
                this.resetFrame();
                this.startIdleAnimation();
                };

            // Define a custom click event for all the custom robot masters/bosses/mechas
            let customClickEvent = function($sprite, pointer, localX, localY){
                //console.log('%c' + this.token+' | customClickEvent() called', 'color: magenta;');
                if (!scene.battleBanner.isWithinBounds(pointer.x, pointer.y)){ return; }
                this.stopMoving();
                this.stopIdleAnimation();
                SOUNDS.playSoundEffect('damage');
                let damageAmount = 35, actualDamageAmount;
                let currentEnergy = this.getCounter('energy');
                let minEnergy = this.getValue('energyMin');
                let maxEnergy = this.getValue('energyMax');
                let staggerCounter = this.getCounter('stagger');
                if (currentEnergy <= 0){ return; }
                if (staggerCounter){ damageAmount += Math.round((damageAmount * 0.1) * staggerCounter); }
                actualDamageAmount = Math.min(damageAmount, currentEnergy);
                this.setCounter('energy', '-='+damageAmount);
                let newCurrentEnergy = this.getCounter('energy');
                let threatLevel = 0;
                if (newCurrentEnergy <= Math.floor(maxEnergy / 2)){ threatLevel++; }
                if (newCurrentEnergy <= Math.floor(maxEnergy / 3)){ threatLevel++; }
                if (newCurrentEnergy <= Math.floor(maxEnergy / 4)){ threatLevel++; }
                if (newCurrentEnergy <= minEnergy){ threatLevel++; }
                let damageTextColor = '#ffffff';
                if (threatLevel >= 2){ damageTextColor = '#ff9900'; }
                if (threatLevel >= 3){ damageTextColor = '#ff0000'; SOUNDS.playSoundEffect('damage-reverb', {delay: 50}); }
                if (threatLevel >= 4) { SOUNDS.playSoundEffect('damage-reverb', {delay: 100}); }
                //console.log('current energy:', newCurrentEnergy);
                //console.log('max energy:', maxEnergy);
                this.setCounter('stagger', '+=1');
                if (newCurrentEnergy <= 0){
                    // This robot is disabled so we should explode and return
                    //console.log('->', this.token, 'is disabled! energy: 0/', maxEnergy);
                    this.stopAll(true);
                    SOUNDS.playSoundEffect('damage-critical', {delay: 100});
                    SOUNDS.playSoundEffect('master-overloading-sound', {delay: 200});
                    this.showDamage(actualDamageAmount, function(){
                        // Play a sound effect to make sure they're
                        this.setFrame('defeat');
                        this.flashSprite(3, 100);
                        SOUNDS.playSoundEffect('explode-sound');
                        //this.showExplosions();
                        this.delayedCall(1000, function(){
                            //this.stopExplosions();
                            SOUNDS.playSoundEffect('master-destroyed-sound');
                            this.destroy();
                            });
                        }, {color: damageTextColor});
                    return;
                    } else {
                    // This robot is fine but we still need to display damage
                    //console.log('->', this.token, 'is damaged | energy: ', newCurrentEnergy, '/', maxEnergy);
                    this.stopAll(false);
                    SOUNDS.playSoundEffect('damage-reverb');
                    this.showDamage(actualDamageAmount, function(){
                        //console.log('show damage complete');
                        this.resetFrame();
                        this.setCounter('stagger', 0);
                        // Make the robot slide away from the clicked location
                        var runDirX = (localX >= (this.width / 2) ? 'left' : 'right');
                        var runDirY = (localY >= (this.height / 2) ? 'up' : 'down');
                        if (runDirX !== this.direction){ this.flipDirection(); }
                        var newX = (runDirX === 'left' ? '-=' : '+=') + 120;
                        var newY = (runDirY === 'up' ? '-=' : '+=') + 90;
                        let duration = 1000;
                        let speedMod = this.data.baseStats.dividers.speed || 1;
                        if (this.getFlag('teleports')){ duration = 0; }
                        else { duration *= speedMod; }
                        this.setFrame('slide');
                        this.moveToPosition(newX, newY, duration, function(){
                            //console.log(this.token+' | customClickEvent movement complete (A)!');
                            return customPostMoveCheck.call(this, duration);
                            });
                        }, {color: damageTextColor});
                    }
                };

            // Define a custom function to be run post-movement to check and readjust if offscreen
            let customBounds = scene.battleBanner.getBounds(); // contains xMin, yMin, xMax, yMax
            //console.log('customBounds =', customBounds);
            let customPostMoveCheck = function(duration){
                //console.log('%c' + this.token+' | customPostMoveCheck() called', 'color: pink;');
                let offset = {h: 0, v: 0};
                let correction = 100;
                let leeway = this.spriteConfig.hitbox[0] * 2;
                if ((this.x - leeway) < customBounds.xMin){ offset.h = (this.x - leeway); }
                else if ((this.x + leeway) > customBounds.xMax){ offset.h = (this.x + leeway) - customBounds.xMax; }
                if ((this.y - leeway) < customBounds.yMin){ offset.v = (this.y - leeway); }
                else if ((this.y + leeway) > customBounds.yMax){ offset.v = (this.y + leeway) - customBounds.yMax; }
                //console.log(this.token+' | customPostMoveCheck | offset =', offset);
                if (offset.h !== 0 || offset.v !== 0){
                    if (offset.h < 0 && this.direction === 'left'
                        || offset.h > 0 && this.direction === 'right'){
                        this.flipDirection();
                        }
                    this.setFrame('slide');
                    let newX = null, newY = null;
                    if (offset.h !== 0){
                        newX = offset.h < 0 ? (customBounds.xMin + correction) : (customBounds.xMax - correction);
                        }
                    if (offset.v !== 0){
                        newY = offset.v < 0 ? (customBounds.yMin + correction) : (customBounds.yMax - correction);
                        newX = this.direction === 'left' ? (this.x - leeway) : (this.x + leeway);
                        }
                    //console.log(this.token+' | customPostMoveCheck | newX =', newX, 'newY =', newY);
                    this.moveToPosition(newX, newY, ((duration || 200) / 2), function(){
                        //console.log(this.token+' | customPostMoveCheck movement complete (B)!');
                        return customPostMoveCheck.call(this, duration);
                        });
                    } else {
                    //console.log(this.token+' | customPostMoveCheck | robot is within bounds!');
                    this.setFrame('base');
                    this.startIdleAnimation();
                    return;
                    }
                };

            let $customBoss = new MMRPG_Robot(this, 'slur', {
                image_alt: 'alt2'
                }, {
                x: commonX - 80,
                y: commonY,
                //z: depth++,
                depth: actionDepth,
                scale: 2,
                origin: [0.5, 1],
                direction: 'right',
                });
            //console.log('-> $customBoss:', $customBoss);

            let $customGuardian = new MMRPG_Robot(this, 'duo', {
                // ...
                }, {
                x: commonX + 40,
                y: commonY - 2,
                //z: depth++,
                depth: actionDepth,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left'
                });
            //console.log('-> $customGuardian:', $customGuardian);

            let $customRobot = new MMRPG_Robot(this, 'proto-man', {
                image_alt: 'water'
                }, {
                x: commonX + 60,
                y: commonY,
                //z: depth++,
                depth: actionDepth,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left'
                });
            //console.log('-> $customRobot:', $customRobot);

            let $customRobot2 = new MMRPG_Robot(this, 'quick-man', {
                image_alt: 'alt'
                }, {
                x: commonX + 90,
                y: commonY,
                //z: depth++,
                depth: actionDepth,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left'
                });
            //console.log('-> $customRobot2:', $customRobot2);

            let $customMecha = new MMRPG_Robot(this, 'met', {
                //image_alt: 'alt2'
                }, {
                x: commonX + 110,
                y: commonY + 2,
                //z: depth++,
                depth: actionDepth,
                scale: 2,
                origin: [0.5, 1],
                direction: 'left',
                hitbox: [20, 20]
                });
            $customMecha.setFlag('teleports', true);
            //console.log('-> $customMecha:', $customMecha);

            let customObjects = [];
            customObjects.push($customBoss);
            customObjects.push($customGuardian);
            customObjects.push($customRobot);
            customObjects.push($customRobot2);
            customObjects.push($customMecha);
            let energyMin = 0, energyMax = 100;
            for (let i = 0; i < customObjects.length; i++){
                let $object = customObjects[i];
                scene.battleBanner.add($object);
                $object.useContainerForDepth(true);
                $object.setValue('energyMin', energyMin);
                $object.setValue('energyMax', energyMax);
                $object.setCounter('energy', energyMax);
                $object.setShadow(true);
                $object.setOnHover(customMouseOver, customMouseOut);
                $object.setOnClick(customClickEvent);
                $object.startIdleAnimation();
                }
            window.MMRPG_DebugScene_customObjects = customObjects;
            console.log('$customObjects (large) (MMRPG_DebugScene_customObjects) =\n', customObjects);

            /*
            // -- DEBUG SPRITE-ORIGIN TESTING -- //

            // Loop through the different origins with a 40x40 and an 80x80 sprite to make sure alignment works
            var origin = [0, 0];
            var baseSize = SPRITES.config.baseSize;
            var startX = 70 + 4, startY = this.battleBanner.y + 20;
            var x = startX, y = startY;
            for (let i = 0; i <= 2; i++){
                for (let j = 0; j <= 2; j++){
                    Strings.addPlainText(this, x, y, '[' + origin[0] + ',' + origin[1] + ']', {color: '#ffffff', fontSize: '10px', depth: depth++});
                    let $testRobot1 = new MMRPG_Robot(this, 'bomb-man', null, { x: x, y: y, z: depth++, direction: 'right', scale: 1, origin: origin });
                    let $testRobot2 = new MMRPG_Robot(this, 'star-man', null, { x: x, y: y, z: depth++, direction: 'left', scale: 1, origin: origin });
                    //console.log('$testRobot1[' + origin[0] + ',' + origin[1] + '] =', $testRobot1.spriteConfig);
                    //console.log('$testRobot2[' + origin[0] + ',' + origin[1] + '] =', $testRobot2.spriteConfig);
                    x += 100;
                    origin[0] += 0.5;
                }
                x = startX;
                y += 100;
                origin[0] = 0;
                origin[1] += 0.5;
            }
            */

            // -- DEBUG CLASS METHODS -- //

            //Graphics.test();
            //Strings.test();

        // ---------------->
        // DEBUG DEBUG DEBUG

        window.MMRPG_DebugScene_showSlidingRobot = this.showSlidingRobot.bind(this);
        window.MMRPG_DebugScene_showRunningPlayer = this.showRunningPlayer.bind(this);

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
    showRunningPlayer (token, alt, side = 'left')
    {
        //console.log('DebugScene.showRunningPlayer() called w/ token =', token, 'alt =', alt, 'side =', side);

        // Pull in required object references
        let scene = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let playerSheets = SPRITES.index.sheets.players;
        let playerAnims = SPRITES.index.anims.players;
        let playersIndex = MMRPG.Indexes.players;

        // Generate a list of random tokens to pull from should it be necessary
        let randTokens = [];
        if (!randTokens.length){ randTokens = randTokens.concat(scene.runningDoctors); }
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

        // Count the number of sliding sprites currently on the screen
        let numSprites = scene.debugAddedSprites - scene.debugRemovedSprites;

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
        let $playerSprite = scene.add.sprite(spriteX, spriteY, spriteSheet);
        scene.debugSprites.push($playerSprite);
        $playerSprite.debugKey = scene.debugSprites.length - 1;
        scene.debugAddedSprites++;

        // Add required sub-objects to the sprite
        $playerSprite.subTweens = {};
        $playerSprite.subTimers = {};
        $playerSprite.subSprites = {};

        // Set the origin, scale, and depth for the sprite then add to parent container
        $playerSprite.setOrigin(0.5, 1);
        $playerSprite.setScale(2.0);
        $playerSprite.setDepth(scene.battleBanner.depths.action + spriteY);
        scene.battleBanner.add($playerSprite);

        // Apply effects and setup the frame
        $playerSprite.preFX.addShadow();
        $playerSprite.play(spriteRunAnim);

        // Animate the doctor bouncing up and down as they walk forward
        $playerSprite.subTweens.bounceTween = scene.add.tween({
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
        $playerSprite.subTweens.runTween = scene.add.tween({
            targets: $playerSprite,
            x: runDestination,
            ease: 'Linear',
            duration: runDuration,
            onComplete: function () {
                //console.log(playerInfo.name + ' running movement complete!');
                SPRITES.destroySpriteAndCleanup(scene, $playerSprite);
                }
            });

        // Update the scene with last-used sprite token
        scene.lastRunningDoctor = spriteToken;

    }

    // Define a function that generates a sprite of a robot and animates it sliding across the screen
    async showSlidingRobot (token, alt, side)
    {
        //console.log('DebugScene.showSlidingRobot() called w/ token =', token, 'alt =', alt, 'side =', side);
        //console.log('scene.masterTokensByCoreType['+alt+'] =', this.masterTokensByCoreType[alt]);

        // Pull in required object references
        let scene = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let SOUNDS = this.SOUNDS;
        let typesIndex = MMRPG.Indexes.types;
        let robotsIndex = MMRPG.Indexes.robots;
        let abilitiesIndex = MMRPG.Indexes.abilities;

        // Collect the sprite side and direction from the function else define defaults
        let spriteSide = side || 'left';
        let spriteDirection = spriteSide === 'left' ? 'right' : 'left';

        // Pull a list of random tokens to pull from should it be necessary
        let randTokens = [];
        if (this.safeTypeTokens.indexOf(alt) >= 0){
            if (typeof scene.masterTokensByCoreType[alt] !== 'undefined'
                && scene.masterTokensByCoreType[alt].length > 0){
                randTokens = randTokens.concat(scene.masterTokensByCoreType[alt]);
                alt = '';
                } else if (typeof scene.masterTokensByCoreType['copy'] !== 'undefined'
                && scene.masterTokensByCoreType['copy'].length > 0){
                randTokens = randTokens.concat(scene.masterTokensByCoreType['copy']);
                }
            }
        if (!randTokens.length){ randTokens = randTokens.concat(scene.slidingMasters); }
        let randKey = Math.floor(Math.random() * randTokens.length);

        // Count the number of sliding sprites already on the screen (for adjusting the animations)
        let numSprites = scene.debugAddedSprites - scene.debugRemovedSprites;

        // Prepare the Robot

        // Collect the sprite token and alt if provided, else rely on the random key
        let robotSpriteToken = token || randTokens[randKey];
        let robotSpriteAlt = alt || 'base';
        if (robotSpriteToken.indexOf('_') !== -1){
            let tokenParts = robotSpriteToken.split('_');
            robotSpriteToken = tokenParts[0];
            robotSpriteAlt = tokenParts[1];
            }
        let robotIndexInfo = robotsIndex[robotSpriteToken];
        let robotAltTokens = robotIndexInfo.image_alts ? robotIndexInfo.image_alts.map(item => item.token) : [];
        if (robotSpriteAlt !== 'base' && robotAltTokens.indexOf(robotSpriteAlt) === -1){ robotSpriteAlt = 'base'; }
        //console.log('robotSpriteToken:', robotSpriteToken, 'robotSpriteAlt:', robotSpriteAlt, 'robotIndexInfo:', robotIndexInfo, 'robotAltTokens:', robotAltTokens);

        // Create a temp robot object to ensure everything gets preloaded
        let $robot = new MMRPG_Robot(scene, robotSpriteToken, {image_alt: robotSpriteAlt}, MMRPG.canvas.offscreen);
        await $robot.isReady();
        //console.log('Robot ' + $robot.token + ' is ready for action!', $robot);

        // Prepare the Ability

        // Define the ability-specific details for potential animation sequence
        let abilityRand = Math.floor(Math.random() * 100);
        let abilitySuffix = abilityRand % 3 === 0 ? 'buster' : 'shot';
        let abilityElement = robotIndexInfo.core !== '' && robotIndexInfo.core !== 'copy' ? robotIndexInfo.core : '';
        let abilitySpriteToken = abilityElement ? (abilityElement + '-' + abilitySuffix) : ('buster-shot');
        let abilitySpriteSheet = 1;
        let abilityIndexInfo = abilitiesIndex[abilitySpriteToken];
        //console.log(abilitySpriteToken, 'abilityRand:', abilityRand, 'abilitySuffix:', abilitySuffix, 'abilityElement:', abilityElement, 'abilityIndexInfo:', abilityIndexInfo);

        // Create a temp ability object to ensure everything gets preloaded
        let $ability = new MMRPG_Ability(scene, abilitySpriteToken, {image_sheet: abilitySpriteSheet}, MMRPG.canvas.offscreen);
        await $ability.isReady();
        //console.log('Ability ' + $ability.token + ' is ready for action!', $ability);

        // Define the base coordinates for the sprite to be added
        var offset = ((numSprites % 10) * 5);
        let spriteX = spriteSide === 'left' ? (0 - offset - 40) : (MMRPG.canvas.width + offset + 40);
        let spriteY = this.battleBanner.y + 90 + ((numSprites % 10) * 10);
        var spriteDepth = scene.battleBanner.depths.action;

        // Add this robot to the battle banner and update graphics
        scene.battleBanner.add($robot);
        $robot.useContainerForDepth(true);
        $robot.refreshSprite();

        // Set the origin, scale, and depth for the sprite then add to parent container
        $robot.setPosition(spriteX, spriteY, spriteY);
        $robot.setDepth(spriteDepth);
        $robot.setOrigin(0.5, 1);
        $robot.setScale(2.0);
        $robot.setShadow(true);
        $robot.refreshSprite();

        // Add effects and setup the frame for the sliding sprite
        $robot.setFrame('base');

        // Fallback to later code for now (remove later)
        let $robotSprite = $robot.sprite;
        scene.debugSprites.push($robotSprite);
        $robotSprite.debugKey = scene.debugSprites.length - 1;
        scene.debugAddedSprites++;

        // Animate that sprite sliding across the screen then remove when done
        let baseStats = robotIndexInfo.baseStats;
        let speedMod = baseStats.multipliers.speed;
        let speedMod2 = baseStats.dividers.speed;
        let slideDistance = (MMRPG.canvas.width / 3) * speedMod;
        let slideDestination = spriteSide === 'left' ? (MMRPG.canvas.width + 40) : (0 - 40);
        let slideDuration = 2000 * speedMod2;
        //if (numSprites >= 10){ slideDuration /= 2; }
        //console.log('numSprites = ', numSprites);
        //console.log('slideDuration = ', slideDuration);

        // Define a function for sliding a given sprite forward, then calling another function to slide it somewhere else
        const slideSpriteForward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting forward slide movement for sprite!', robotSpriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));
            $sprite.direction = 'right';
            let others = Object.keys(scene.debugSprites).length;
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
            let slideSheet = $robot.getSpriteSheet('sprite', $sprite.direction);
            let slideAnim = $robot.getSpriteAnim('sprite', 'slide', $sprite.direction);
            $sprite.setFrame(0);
            $sprite.setTexture(slideSheet);
            if ($sprite.subTimers.slideDelay){ $sprite.subTimers.slideDelay.remove(); }
            $sprite.subTimers.slideDelay = scene.time.delayedCall(delay, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                //console.log('$sprite:', typeof $sprite, $sprite);
                $sprite.play(slideAnim);
                //SOUNDS.playSoundEffect('glass-klink');
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = scene.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial sliding movement complete...');
                        //SOUNDS.playSoundEffect('glass-klink');
                        if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                        $sprite.subTimers.nextAction = scene.time.delayedCall(1000, function(){
                            //console.log('...let\'s slide somewhere else!');
                            slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                            delete $sprite.subTimers.nextAction;
                            });
                        }
                    });
                }, [], scene);
            };

        // Define a function for sliding a given sprite backward, then calling another function to slide it somewhere else
        const slideSpriteBackward = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting backward slide movement for sprite!', robotSpriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));
            $sprite.direction = 'left';
            let others = Object.keys(scene.debugSprites).length;
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
            let slideSheet = $robot.getSpriteSheet('sprite', $sprite.direction);
            let slideAnim = $robot.getSpriteAnim('sprite', 'slide', $sprite.direction);
            $sprite.setFrame(0);
            $sprite.setTexture(slideSheet);
            if ($sprite.subTimers.slideDelay){ $sprite.subTimers.slideDelay.remove(); }
            $sprite.subTimers.slideDelay = scene.time.delayedCall(delay, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                //console.log('$sprite:', typeof $sprite, $sprite);
                $sprite.play(slideAnim);
                //SOUNDS.playSoundEffect('glass-klink');
                if ($sprite.slideTween){ $sprite.slideTween.stop().destroy(); }
                $sprite.slideTween = scene.add.tween({
                    targets: $sprite,
                    x: newX,
                    ease: 'Sine.easeOut',
                    delay: 300,
                    duration: duration,
                    onComplete: function () {
                        //console.log('Partial sliding movement complete...');
                        //SOUNDS.playSoundEffect('glass-klink');
                        if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                        $sprite.subTimers.nextAction = scene.time.delayedCall(1000, function(){
                            //console.log('...let\'s slide somewhere else!');
                            slideSpriteSomewhere($sprite, distance, destination, duration, onComplete);
                            delete $sprite.subTimers.nextAction;
                            });
                        }
                    });
                }, [], scene);
            };

        // Define a function that makes a given sprite perform a shoot animation and then move w/ a slide
        let abilityShotSprites = [];
        const makeSpriteShoot = function($sprite, distance, destination, duration, onComplete){
            //console.log('Starting shooting movement for sprite!', robotSpriteToken, 'x:', $sprite.x);
            if (!$sprite || $sprite.toBeDestroyed){ return; }
            //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

            // Calculate where we're going to draw the shot sprite itself given context
            let shotOffset = abilitySuffix === 'buster' ? 10 : 0;
            let shotX = $sprite.x + ($sprite.direction === 'left' ? -60 : 60);
            let shotY = $sprite.y + shotOffset;

            // First create the shot sprite and add it to the scene
            let shotSheet = $ability.getSpriteSheet('sprite', $sprite.direction);
            let $shotSprite = scene.add.sprite(shotX, shotY, shotSheet);
            scene.debugSprites.push($shotSprite);
            $shotSprite.debugKey = scene.debugSprites.length - 1;
            scene.debugAddedSprites++;
            $shotSprite.setOrigin(0.5, 1);
            $shotSprite.setScale(2.0);
            $shotSprite.setDepth($sprite.depth + 1);
            scene.battleBanner.add($shotSprite);

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
            let shootAnim = $robot.getSpriteAnim('sprite', 'shoot', $sprite.direction);
            $sprite.setFrame(0);
            $sprite.play(shootAnim);
            if ($sprite.subTweens.kickbackTween){ $sprite.subTweens.kickbackTween.stop().destroy(); }
            if (abilitySuffix === 'shot'){ SOUNDS.playSoundEffect('shot-sound'); }
            else if (abilitySuffix === 'buster'){ SOUNDS.playSoundEffect('blast-sound'); }
            $sprite.subTweens.kickbackTween = scene.add.tween({
                targets: $sprite,
                x: newX,
                ease: 'Linear',
                delay: 300,
                duration: 100,
                yoyo: true,
                onComplete: function () {
                    //console.log('Partial shooting movement complete!');
                    if ($sprite.subTimers.nextAction){ $sprite.subTimers.nextAction.remove(); }
                    $sprite.subTimers.nextAction = scene.time.delayedCall(1000, function(){
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
            $sprite.subTweens.chargeTween = scene.tweens.addCounter({
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
            $sprite.subTimers.afterCharge = scene.time.delayedCall(400, function(){
                if (!$sprite || $sprite.toBeDestroyed){ return; }
                $sprite.fx.reset();
                $sprite.subTweens.chargeTween.remove();
                });

            // Wait a moment for the robot to finish its kickback, then animate the shot going offscreen at predetermined speed
            $shotSprite.subTimers.bulletTween = scene.time.delayedCall(400, function(){
                if (!$shotSprite){ return; }
                $shotSprite.setAlpha(0.6);
                $shotSprite.setFrame(shotFrame);
                $shotSprite.subTweens.bulletTween = scene.add.tween({
                    targets: $shotSprite,
                    x: shotDestX,
                    alpha: 1.0,
                    ease: 'Sine.easeOut',
                    duration: shotDuration,
                    onComplete: function () {
                        //console.log(robotIndexInfo.name + '\'s ' + abilityIndexInfo.name + ' movement complete!');
                        SPRITES.destroySprite(scene, $shotSprite);
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
            //console.log('Starting random movement for sprite!', robotSpriteToken, 'x:', $sprite.x, 'xMin:', safeZoneMinX, 'xMax:', safeZoneMaxX);
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
        let effectElement = (robotIndexInfo.core !== '' && robotIndexInfo.core !== 'copy' ? robotIndexInfo.core : '');
        let effectToken = effectElement ? effectElement + '-buster' : 'mega-buster';
        let $tempAbility = new MMRPG_Ability(scene, effectToken, null, MMRPG.canvas.offscreen);
        await $tempAbility.isReady();
        $tempAbility.destroy();
        let explodeSpriteInfo = SPRITES.getSpriteInfo('ability', effectToken, 1);
        //console.log('%c----------', 'color: orange;');
        //console.log('explodeSpriteInfo (before) =', explodeSpriteInfo);
        //console.log('explodeSpriteInfo.sprite (before) =', JSON.stringify(explodeSpriteInfo.sprite));
        const createExplodeSpriteAnimation = function(robotIndexInfo, spriteInfo, spriteDirection){
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
            let explodeAnimation = scene.anims.get(animKey);
            if (!explodeAnimation){
                scene.anims.create(Object.assign({}, animTemplate, {
                    key: animKey,
                    sheet: sheetKey,
                    frames: scene.anims.generateFrameNumbers(sheetKey, { frames: animTemplate.frames }),
                    }));
                explodeAnimation = scene.anims.get(animKey);
                //console.log('Created explodeAnimation w/ key:', explodeAnimation.key, 'sheet:', explodeAnimation.sheet);
                }
            spriteInfo['sprite'][spriteDirection]['anim']['explode'] = explodeAnimation.key;
            };
        createExplodeSpriteAnimation(robotIndexInfo, explodeSpriteInfo, 'left');
        createExplodeSpriteAnimation(robotIndexInfo, explodeSpriteInfo, 'right');
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
            SPRITES.stopSpriteTweens(scene, $sprite, false);
            SPRITES.stopSpriteTimers(scene, $sprite, false);

            // Set the frame to disabled and darken the sprite, then play the explosion animation
            $sprite.setFrame(3);
            $sprite.fx = $sprite.preFX.addColorMatrix();
            $sprite.fx.brightness(3.0);

            // Generate the explosion animation tween of flashing, then destroy the sprite when done
            $sprite.subTweens.flashTween = scene.tweens.addCounter({
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
                    //console.log(robotIndexInfo.name + ' explosion complete!');
                    SPRITES.destroySprite(scene, $sprite);
                    }
                });

            // -- Then we separately generate an explosion effect sprite in the same location

            // Calculate where we're going to draw the explosion sprite itself given context
            let explodeOffsets = { x: (($sprite.direction === 'left' ? 1 : -1) * 10), y: 15 };
            let explodeX = $sprite.x + explodeOffsets.x;
            let explodeY = $sprite.y + explodeOffsets.y;

            // First create the explode sprite and add it to the scene
            let $explodeSprite = scene.add.sprite(explodeX, explodeY, explodeSpriteInfo['sprite'][$sprite.direction]['sheet']);
            scene.debugSprites.push($explodeSprite);
            $explodeSprite.debugKey = scene.debugSprites.length - 1;
            scene.debugAddedSprites++;
            $explodeSprite.setOrigin(0.5, 1);
            $explodeSprite.setScale(2.0);
            $explodeSprite.setDepth($sprite.depth - 1);
            scene.battleBanner.add($explodeSprite);

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
            SOUNDS.playSoundEffect('explode-sound');

            // Generate a tween for the explode sprite that has it slowly fade away via alpha then remove itself
            $explodeSprite.subTweens.fadeTween = scene.add.tween({
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
                    //console.log(robotIndexInfo.name + '\'s explosion fade complete!');
                    SPRITES.destroySprite(scene, $explodeSprite);
                    }
                });

            };

        // Define a function that shows a robot's defeat quote in the position it was defeated
        let robotQuoteBubbles = [];
        let robotQuoteTweens = [];
        const showRobotDefeatQuote = function($sprite){
            // Destroy any existing floating text bubbles
            if (scene.floatingTextBubble){
                //console.log('Destroying clicked scene.floatingTextBubble:', scene.floatingTextBubble);
                scene.floatingTextBubble.destroy();
                scene.floatingTextBubble = null;
                }
            // If the robot has quotes to display, let's do so now
            let quoteDisplayed = false;
            let $floatingTextBubble = null;
            //console.log('robot destroyed:', robotIndexInfo.token, robotIndexInfo.name, robotIndexInfo);
            if (typeof robotIndexInfo.quotes !== 'undefined'){
                let robotCoreType = robotIndexInfo.core !== '' ? robotIndexInfo.core : '';
                let robotTypeInfo = typesIndex[robotCoreType || 'none'];
                let robotQuotes = robotIndexInfo.quotes;
                //console.log(robotIndexInfo.token, 'robotCoreType:', robotCoreType, 'robotTypeInfo:', robotTypeInfo, 'robotQuotes:', robotQuotes);
                if (typeof robotQuotes.battle_defeat
                    && robotQuotes.battle_defeat.length){
                    //console.log('robotQuotes.battle_defeat:', robotQuotes.battle_defeat);
                    var text = robotQuotes.battle_defeat.toUpperCase();
                    var color = '#f0f0f0';
                    var shadow = '#090909'; //robotCoreType ? Graphics.returnHexColorString(robotTypeInfo.colour_dark) : '#969696';
                    //console.log('text:', text, 'color:', color);
                    var x = $robotSprite.x + 40, y = $robotSprite.y - 60;
                    var width = Math.ceil(MMRPG.canvas.width / 4), height = 90;
                    $floatingTextBubble = Strings.addFormattedText(scene, x, y, text, {
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
                let quoteDisplayTween = scene.tweens.addCounter({
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
            //console.log('queueSpriteCleanup()');
            if (cleanupTimer){ cleanupTimer.remove(); }
            let removeDebugKeys = [];
            cleanupTimer = scene.time.delayedCall(cleanupDelay, function(){
                //console.log('Time to cleanup sprites:', $robotSprite);
                removeDebugKeys = removeDebugKeys.concat(getDebugKeys($robotSprite));
                SPRITES.destroySpriteAndCleanup(scene, $robotSprite, true);
                $robot.destroy();
                for (let i = 0; i < abilityShotSprites.length; i++){
                    let $abilityShotSprite = abilityShotSprites[i];
                    removeDebugKeys = removeDebugKeys.concat(getDebugKeys($abilityShotSprite));
                    SPRITES.destroySpriteAndCleanup(scene, $abilityShotSprite, true);
                    $ability.destroy();
                    }
                for (let i = 0; i < explodeEffectSprites.length; i++){
                    let $explodeEffectSprite = explodeEffectSprites[i];
                    removeDebugKeys = removeDebugKeys.concat(getDebugKeys($explodeEffectSprite));
                    SPRITES.destroySpriteAndCleanup(scene, $explodeEffectSprite, true);
                    }
                //console.log('removeDebugKeys:', removeDebugKeys);
                for (let i = 0; i < removeDebugKeys.length; i++){
                    let debugKey = removeDebugKeys[i];
                    //console.log('Removing debug key:', debugKey, 'from debugSprites:', scene.debugSprites);
                    delete scene.debugSprites[debugKey];
                    scene.debugRemovedSprites++;
                    }
                });
            };

        // Preset the sprite direction to right, and then start playing the slide animation
        $robotSprite.direction = spriteDirection;
        let slideAnim = $robot.getSpriteAnim('sprite', 'slide', spriteDirection);
        $robotSprite.play(slideAnim);
        let startFunction;
        if (spriteDirection === 'right'){ startFunction = slideSpriteForward; }
        else if (spriteDirection === 'left'){ startFunction = slideSpriteBackward; }
        //console.log('Starting slide animation for', robotIndexInfo.name, 'w/ token:', robotSpriteToken, 'and alt:', robotSpriteAlt);
        startFunction($robotSprite, slideDistance, slideDestination, slideDuration, function($robotSprite){
            //console.log('%c' + 'All animations for ' + robotIndexInfo.name + ' complete!', 'color: amber;');
            queueSpriteCleanup();
            });

        // Make it so the sprite is clickable to shows an alert
        $robotSprite.setInteractive({ useHandCursor: true });
        $robotSprite.on('pointerdown', function(){
            //console.log('Sliding sprite clicked:', robotSpriteToken);
            if (!$robotSprite || $robotSprite.isDisabled){ return; }
            showRobotDefeatQuote($robotSprite);
            explodeSpriteAndDestroy($robotSprite);
            queueSpriteCleanup();
            });

        // Destroy stuff we don't need anymore
        //$robot.destroy(); // temporary (will transition to actually using this $robot object later)
        //$ability.destroy(); // temporary (will transition to actually using this $ability object later)

        // Update the scene with last-used sprite token
        scene.lastSlidingMaster = robotSpriteToken;
    }

    // Define a function for creating the title banner and associated elements inside it
    createTitleBanner ()
    {
        //console.log('DebugScene.createTitleBanner() called');

        // Pull in other required objects and references
        let scene = this;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // TITLE BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var y = 10, x = 10;
        var width = MMRPG.canvas.width - 20, height = 30;
        this.titleBanner = new Banner(scene, x, y, {
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
            scene.scene.pause();
            $pauseButton.setText('PAUSED');
            if (pauseTimeout){ clearTimeout(pauseTimeout); }
            pauseTimeout = setTimeout(function(){
                window.toggleGameIsClickable(true);
                }, 500);
            });
        window.setGameResumeCallback(function(){
            $pauseButton.setText('PAUSE');
            scene.scene.resume();
            SOUNDS.playMenuSound('icon-click-mini');
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
            scene.scene.start('Title');
            });

        // Create a next button so we can go to the main scene
        buttonConfig.x = MMRPG.canvas.width - 165;
        buttonConfig.depth = depth++;
        BUTTONS.makeSimpleButton('Restart Debug', buttonConfig, function(){
            //console.log('Debug button clicked');
            scene.scene.start('Debug');
            });

    }

    // Define a function for creating the buttons banner and associated elements inside it
    createHeaderBanner ()
    {
        //console.log('DebugScene.createHeaderBanner() called');

        // Pull in other required objects and references
        let scene = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // HEADER BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var y = 45, x = 10;
        var width = MMRPG.canvas.width - 20, height = 28;
        this.headerBanner = new Banner(scene, x, y, {
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
        let scene = this;
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
            depth: depth
            });
        // base needs 10, field needs 100, underlay needs 100, action needs 1000, overlay needs 100
        var depths = {};
        var lastDepth = $battleBanner.depth;
        lastDepth = depths.base = lastDepth + 0;
        lastDepth = depths.grid = lastDepth + 10;
        lastDepth = depths.field = lastDepth + 1000;
        lastDepth = depths.underlay = lastDepth + 1000;
        lastDepth = depths.action = lastDepth + 1000;
        lastDepth = depths.overlay = lastDepth + 1000;
        $battleBanner.depths = depths;
        this.battleBanner = $battleBanner;
        //console.log('Battle banner created w/ depths:', depths);

        // Create a mask for the battle banner area that we can add sprites to
        const spriteContainer = $battleBanner.createContainer();
        this.battleBannerContainer = spriteContainer;

        // Draw the sprite grid as a background texture in front of the battle banner
        var x = $battleBanner.x, y = $battleBanner.y;
        var width = $battleBanner.width, height = $battleBanner.height;
        var $gridBackground = this.add.tileSprite(x, y, width, height, 'misc.sprite-grid');
        $gridBackground.setOrigin(0, 0);
        $gridBackground.setDepth($battleBanner.depths.grid + 1);
        $gridBackground.setAlpha(0.2);
        this.battleBanner.add($gridBackground);

        // Draw a second sprite grid slightly shorter to act as a foreground texture for the battle banner
        y += 60, height -= 60;
        var $gridForeground = this.add.tileSprite(x, y, width, height, 'misc.sprite-grid');
        $gridForeground.setOrigin(0, 0);
        $gridForeground.setDepth($battleBanner.depths.grid + 2);
        $gridForeground.setAlpha(0.4);
        this.battleBanner.add($gridForeground);

        // Draw a vertical black line on top of the foreground to make it look like a horizon
        var $horizonLine = this.add.graphics();
        $horizonLine.fillStyle(0x191919);
        $horizonLine.fillRect(x, y, width, 2);
        $horizonLine.setDepth($battleBanner.depths.grid + 3);
        this.battleBanner.add($horizonLine);

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
        let scene = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);
        let safeTypeTokens = scene.safeTypeTokens;

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
        let scene = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);
        let safeTypeTokens = scene.safeTypeTokens;

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
            SOUNDS.playSoundEffect('glass-klink');
            var type = $alphaBanner.type;
            //console.log('$alphaBanner type:', type);
            if (scene.allowRunningDoctors){
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
                if (doctor){ this.showRunningPlayer(doctor, alt, 'left'); }
                if (master && $alphaBanner.directionY === 'up'){ this.showSlidingRobot(master, null, 'left'); }
                if (support && $alphaBanner.directionY === 'down'){ this.showSlidingRobot(support, null, 'left'); }
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
            SOUNDS.playSoundEffect('glass-klink');
            var type = $betaBanner.type;
            //console.log('$betaBanner type:', type);
            if (scene.allowSlidingMasters){
                //console.log('Show a sliding master of type:', type);
                this.showSlidingRobot(null, type, 'left');
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
        let scene = this;
        let types = MMRPG.Indexes.types;
        let safeTypes = scene.safeTypeTokens;
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
                if (scene.allowRunningDoctors){ scene.showRunningPlayer(); }
                if (scene.allowSlidingMasters){
                    var doctor = scene.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showSlidingRobot(master, null, 'left');
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
                if (scene.allowRunningDoctors){ scene.showRunningPlayer(); }
                if (scene.allowSlidingMasters){
                    var doctor = scene.lastRunningDoctor;
                    var master = 'robot';
                    if (doctor === 'dr-light'){ master = mainBanner.type === 'copy' ? 'mega-man' : 'roll'; }
                    else if (doctor === 'dr-wily'){ master = mainBanner.type === 'copy' ? 'bass' : 'disco'; }
                    else if (doctor === 'dr-cossack'){ master = mainBanner.type === 'copy' ? 'proto-man' : 'rhythm'; }
                    this.showSlidingRobot(master, null, 'left');
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
        let scene = this;
        let types = MMRPG.Indexes.types;
        let safeTypes = scene.safeTypeTokens;
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
            if (scene.allowSlidingMasters){
                this.showSlidingRobot(null, type, 'right');
                }
            }

    }

    // Define a function for creating the buttons banner and associated elements inside it
    addPanelWithDebugButtons ()
    {
        //console.log('DebugScene.addPanelWithDebugButtons() called');

        // Pull in other required objects and references
        let scene = this;
        let SPRITES = this.SPRITES;
        let POPUPS = this.POPUPS;
        let BUTTONS = this.BUTTONS;
        let SOUNDS = this.SOUNDS;

        // HEADER BANNER

        // First we add a simple, empty banner to the header
        var depth = 1000;
        var width = MMRPG.canvas.width - 20, height = 148;
        var y = MMRPG.canvas.height - height - 32, x = 10;
        let $debugButtonPanel = new Banner(scene, x, y, {
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
                scene.showWelcomeToThePrototype();
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
                scene.showRunningPlayer(null, null, 'left');
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
                scene.showSlidingRobot(null, null, 'left');
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
                if (scene.allowRunningDoctors){
                    button.text.setTint(0xff0000);
                    //button.text.setColor('#ff0000');
                    scene.allowRunningDoctors = false;
                    scene.bounceBannerAlpha.setAlpha(0.1);
                    } else {
                    button.text.setTint(0x00ff00);
                    //button.text.setColor('#00ff00');
                    scene.allowRunningDoctors = true;
                    scene.bounceBannerAlpha.setAlpha(1);
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
                if (scene.allowSlidingMasters){
                    button.text.setTint(0xff0000);
                    //button.text.setColor('#ff0000');
                    scene.allowSlidingMasters = false;
                    scene.bounceBannerBeta.setAlpha(0.1);
                    } else {
                    button.text.setTint(0x00ff00);
                    //button.text.setColor('#00ff00');
                    scene.allowSlidingMasters = true;
                    scene.bounceBannerBeta.setAlpha(1);
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
                scene.showTalesFromTheVoid();
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
                scene.showRunningPlayer(null, null, 'right');
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
                scene.showSlidingRobot(null, null, 'right');
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
        let scene = this;
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
                scene.showSlidingRobot(null, type, 'left');
                }
            });
        this.typeButtonPanel = $typeButtonPanel;

    }

    // Define a function that adds a panel to the scene with elemental type buttons for clicking
    createTypeButtonPanel (config)
    {

        // Pull in required object references
        let scene = this;
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
        const $panelBack = Graphics.addTypePanel(scene, panelConfig);

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
        let scene = this;
        let panelText = "Welcome to Mega Man RPG: Legacy of the Prototype!";
        panelText += '\n' + "Looks like you've reached the DEBUG room!";
        POPUPS.displayPopup(panelText, {
            onComplete: function() {
                //console.log('Welcome to the Prototype completed');
                // ...
                }
            });

        // Show a robot master sliding the the background while they're reading
        if (scene.allowSlidingMasters){
            scene.showSlidingRobot('auto', null, 'right');
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
        let scene = this;
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
        if (scene.allowRunningDoctors){
            scene.showRunningPlayer('proxy', null, 'right');
            }

    }

    // Define a function that generates fake save data that we can test with
    generateFakeSaveData ()
    {
        //consolejson('DebugScene.generateFakeSaveData() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let saveData = MMRPG.SaveData;

        // Define some fake data to test with

        saveData.players.addPlayer('dr-light', {
            level: 1,
            points: 0,
            rewards: {
                abilities: ['buster-shot', 'mega-buster', 'mega-ball', 'mega-slide', 'roll-swing', 'oil-slider', 'energy-boost'],
                robots: ['mega-man', 'roll', 'oil-man'],
                },
            settings: {
                robots: ['mega-man']
                }
            });

        saveData.robots.addRobot('mega-man', {
            level: 1,
            experience: 999,
            rewards: {
                abilities: ['buster-shot', 'mega-buster', 'mega-ball', 'mega-slide'],
                },
            settings: {
                abilities: ['buster-shot', 'mega-buster', 'mega-slide'],
                }
            });
        saveData.robots.addRobot('roll', {
            level: 2,
            experience: 0,
            rewards: {
                abilities: ['buster-shot', 'roll-swing', 'energy-boost'],
                },
            settings: {
                abilities: ['roll-swing', 'energy-boost'],
                image: 'roll_alt2'
                }
            });
        saveData.robots.addRobot('oil-man', {
            level: 10,
            experience: 0,
            rewards: {
                abilities: ['buster-shot', 'oil-slider'],
                },
            settings: {
                abilities: ['oil-slider'],
                }
            });

        saveData.abilities.addAbility('buster-shot');
        saveData.abilities.addAbility('mega-buster');
        saveData.abilities.addAbility('roll-swing');

        saveData.items.addItem('energy-tank', 99);
        saveData.items.addItem('weapons-tank', 99);

        //console.log('Fake save data generated:', saveData);

    }

}