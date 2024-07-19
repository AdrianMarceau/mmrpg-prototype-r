// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Object.js (class)
// This is the primitive class for all objects in the game.
// All objects in the game that pull from the content directory
// should extend this class. This class is designed to be extended
// by other classes, and it should not be used directly in-game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { StringsUtility as Strings } from '../utils/StringsUtility.js';
import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';

import SpritesManager from '../managers/SpritesManager.js';

class MMRPG_Object {

    // Define the class constructor for the object class
    constructor (scene, _kind, token, _customInfo = {}, _spriteConfig = {}, _objectConfig = {})
    {
        //console.log('MMRPG_Object.constructor() called w/ _kind:', _kind, 'token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig, 'objectConfig:', objectConfig);

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(scene);

        // Parse the kind so we have both the kind and xkind
        let [kind, xkind] = MMRPG.parseKind(_kind);
        //console.log('-> kind:', kind, 'xkind:', xkind);

        // Define the properties of the object
        this.id = 0;
        this.token = token;
        this.kind = kind;
        this.xkind = xkind;
        this.scene = scene;
        this.data = {};
        this.cache = {};
        this.timers = {};
        this.ready = false;

        // Pull in refs to required global objects
        let _this = this;
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        //console.log('-> MMRPG:', MMRPG);

        // Pull in required data from the MMRPG data
        let objectIndex = MMRPG.Indexes[xkind] || {};
        let indexInfo = objectIndex[token] || objectIndex[kind];
        //console.log('-> objectIndex:', objectIndex, 'indexInfo:', indexInfo);
        this.indexInfo = indexInfo || {};
        this.customInfo = _customInfo && typeof _customInfo === 'object' ? Object.assign({}, _customInfo) : {};
        this.spriteConfig = _spriteConfig && typeof _spriteConfig === 'object' ? Object.assign({}, _spriteConfig) : {};
        this.objectConfig = _objectConfig && typeof _objectConfig === 'object' ? Object.assign({}, _objectConfig) : {};
        this.createData();
        let customInfo = this.customInfo;
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;

        // Collect or define the ID if not provided
        this.id = customInfo.id || MMRPG.generateID(kind, this.data);

        // Create some flags and a queue to help with lazy-loading
        this.spriteIsLoading = true;
        this.spriteIsPlaceholder = false;
        this.spriteMethodsQueued = [];
        this.spriteMethodsInProgress = [];
        this.spriteMethodsInProgress.add = function(method){ this.push(method); };
        this.spriteMethodsInProgress.remove = function(method){ this.splice(this.indexOf(method), 1); };

        // Before we modify anything, check if a sprite was expected given existing of position variables
        let createSprite = false;
        if (typeof spriteConfig.x !== 'undefined'
            && typeof spriteConfig.y !== 'undefined'){
            spriteConfig.x = spriteConfig.x || 0;
            spriteConfig.y = spriteConfig.y || 0;
            spriteConfig.z = spriteConfig.z || 0;
            createSprite = true;
            }
        else if (typeof spriteConfig.offscreen !== 'undefined'
            && spriteConfig.offscreen === true){
            spriteConfig.x = -9999;
            spriteConfig.y = -9999;
            spriteConfig.z = -9999;
            createSprite = true;
            }

        // Predefine parent sprite variables to avoid errors
        this.sprite = null;
        this.spriteLayers = {};
        this.spriteShadow = null;
        this.spriteHitbox = null;

        // Predefine spriteConfig properties to avoid errors
        spriteConfig.width = spriteConfig.width || this.data.image_width || this.data.image_size || 0;
        spriteConfig.height = spriteConfig.height || this.data.image_height || this.data.image_size || 0;
        spriteConfig.direction = spriteConfig.direction || 'right';
        spriteConfig.frame = spriteConfig.frame || 0;
        spriteConfig.sheet = spriteConfig.sheet || 'sprites.default';
        spriteConfig.origin = spriteConfig.origin || [0, 0];
        spriteConfig.hitbox = spriteConfig.hitbox || [0, 0];
        spriteConfig.alpha = spriteConfig.alpha || 1;
        spriteConfig.depth = spriteConfig.depth || 1;
        spriteConfig.scale = spriteConfig.scale || 1;
        spriteConfig.offsetX = spriteConfig.offsetX || 0;
        spriteConfig.offsetY = spriteConfig.offsetY || 0;
        spriteConfig.interactive = spriteConfig.interactive || false;
        spriteConfig.anchored = spriteConfig.anchored || false;
        spriteConfig.debug = spriteConfig.debug || false;

        // Compensate for missing size defaults using the object config
        if (objectConfig.baseSize){
            let [ baseWidth, baseHeight ] = objectConfig.baseSize;
            if (!spriteConfig.width){ spriteConfig.width = baseWidth; }
            if (!spriteConfig.height){ spriteConfig.height = baseHeight; }
            if (spriteConfig.width > baseWidth){ spriteConfig.offsetX = (spriteConfig.width - baseWidth) / 2; }
            if (spriteConfig.height > baseHeight){ spriteConfig.offsetY = (spriteConfig.height - baseHeight); }
            if (!spriteConfig.hitbox[0]){ spriteConfig.hitbox[0] = baseWidth; }
            if (!spriteConfig.hitbox[1]){ spriteConfig.hitbox[1] = baseHeight; }
            spriteConfig.offsetX *= spriteConfig.scale;
            spriteConfig.offsetY *= spriteConfig.scale;
            }

        // Overwrite default frame aliases if they've been provided in the sprite or object config
        this.spriteFrames = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'];
        this.spriteFrameAliases = [];
        if (spriteConfig.frameAliases){
            this.spriteFrameAliases = spriteConfig.frameAliases;
            } else if (objectConfig.frameAliases){
            this.spriteFrameAliases = objectConfig.frameAliases;
            }

        // Predefine a transforms object to hold temporary effect-related transforms to properties
        spriteConfig.transforms = {};
        spriteConfig.transforms.data = {};
        spriteConfig.transforms.keys = function(){ return Object.keys(this.data); };
        spriteConfig.transforms.has = function(key){ return typeof this.data[key] !== 'undefined' ? true : false; };
        spriteConfig.transforms.add = function(key, data){ this.data[key] = data; };
        spriteConfig.transforms.get = function(key, create = true){ if (this.has(key)){ return this.data[key]; } else if (create){ this.add(key, {}); return this.data[key]; } else { return null; } };
        spriteConfig.transforms.remove = function(key){ delete this.data[key]; };
        spriteConfig.transforms.clear = function(){ this.data = {}; };

        // Predefine some variables to use for the shadow and it's configurations
        spriteConfig.shadow = spriteConfig.shadow || false;
        spriteConfig.shadowStyle = spriteConfig.shadowStyle || 'drop';
        spriteConfig.shadowAlpha = 0.15;
        spriteConfig.shadowTint = 0x000000;
        spriteConfig.shadowScale = 1.5;
        spriteConfig.shadowRotationX = 1.25;
        spriteConfig.shadowRotationY = 0.5;

        // Also predefine some container-related settings for layering and depth
        this.spriteContainer = null;
        spriteConfig.useContainerForDepth = spriteConfig.useContainerForDepth || false;

        // Also predefine some anchor-related settings for positioning and scaling
        this.spriteAnchor = null;
        spriteConfig.useAnchorForPosition = spriteConfig.useAnchorForPosition || false;

        // Set this object to ready now that we're done setup
        this.ready = true;

        // If spriteConfig is provided, create a new sprite with it
        if (createSprite){

            // Automatically create the sprite with the spriteConfig provided
            this.createSprite();

            // Automatically draw the hitbox on this sprite for click-functionality
            this.createSpriteHitbox();

            }

        // end of object constructor

    }

    // Wait for a given condition function to be true before executing a callback
    waitForCondition (conditionFn, checkInterval = 100)
    {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (conditionFn()) {
                    clearInterval(interval);
                    resolve();
                    }
                }, checkInterval);
            });
    }

    // An async function that waits for the sprite to finish loading before continuing
    async isReady()
    {
        await this.waitForCondition(() => !this.spriteIsLoading);
    }

    // Execute a given callback when the sprite is ready to be used
    whenReady (callback)
    {
        //console.log('MMRPG_Object.whenReady() called for ', this.kind, this.token, 'w/ callback(', typeof callback, '):\n', callback);
        //console.log(this.token + ' | -> this.spriteIsLoading', this.spriteIsLoading);
        //console.log(this.token + ' | -> this.spriteIsPlaceholder', this.spriteIsPlaceholder);
        //console.log(this.token + ' | -> this.spriteMethodsQueued.length (before):', this.spriteMethodsQueued.length);
        this.spriteMethodsQueued.push(callback);
        //console.log(this.token + ' | -> this.spriteMethodsQueued.length (after):', this.spriteMethodsQueued.length);
        this.executeQueuedSpriteMethods();
    }

    // Execute all queued sprite methods now that the sprite is ready
    executeQueuedSpriteMethods ()
    {
        //console.log('MMRPG_Object.executeQueuedSpriteMethods() called for ', this.kind, this.token, 'w/ ', this.spriteMethodsQueued.length, 'in the queue');
        if (!this.spriteMethodsQueued){ return; }
        if (this.spriteMethodsQueued.length === 0){ return; }
        if (this.spriteIsLoading || this.spriteIsPlaceholder){
            //console.log(this.token + ' | -> sprite is not ready to execute methods yet!');
            if (this.timers.executeQueuedSpriteMethods){ this.timers.executeQueuedSpriteMethods.destroy(); }
            this.timers.executeQueuedSpriteMethods = this.delayedCall(100, this.executeQueuedSpriteMethods);
            return;
            }
        //console.log(this.token + ' | -> sprite is ready to execute', this.spriteMethodsQueued.length, 'methods!');
        if (this.spriteMethodsQueued){
            let methodsToCall = [];
            while (this.spriteMethodsQueued.length > 0){
                let method = this.spriteMethodsQueued.shift();
                methodsToCall.push(method);
                }
            if (methodsToCall.length > 0){
                //console.log(this.token + ' | -> sprite is executing', methodsToCall.length, 'queued methods!');
                while (methodsToCall.length > 0){
                    let method = methodsToCall.shift();
                    //console.log(this.token + ' | -> sprite is executing queued method:\n', method);
                    method.call(this);
                    }
                }
            }
    }

    // Execute a given callback after a certain amount of time gas passed
    delayedCall (delay, callback, condition = null)
    {
        //console.log('MMRPG_Object.delayedCall() called for ', this.kind, this.token, 'w/ delay:', delay, 'callback:', typeof callback);
        let _this = this;
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let delayedCall = scene.time.delayedCall(delay, function(){
            if (condition && typeof condition === 'function'){
                if (!condition.call(_this)){
                    //console.warn('delayedCall() condition failed for ', _this.kind, _this.token);
                    return false;
                    }
                }
            return callback.call(_this);
            }, [], scene);
        return delayedCall;
    }

    // Set this object as working on a specific task (for internal queueing purposes)
    isWorkingOn (taskToken)
    {
        this.spriteMethodsInProgress.add(taskToken);
    }

    // Set this object as done working on a specific task (and then executre any queued methods)
    isDoneWorkingOn (taskToken)
    {
        this.spriteMethodsInProgress.remove(taskToken);
        this.executeQueuedSpriteMethods();
    }

    // Execute a given callback when the sprite is done being animated and/or moved in some way
    whenDone (callback)
    {
        //console.log('MMRPG_Object.whenDone() called for ', this.kind, this.token, 'w/ callback:', callback);
        this.spriteMethodsQueued.push(callback);
        if (this.spriteMethodsInProgress.length > 0){ return false; }
        else { this.executeQueuedSpriteMethods(); }
    }


    // -- DATA CREATION -- //

    // Generate internal data for this object given index info vs custom info provided at construction
    createData ()
    {
        //console.log('MMRPG_Object.createData() called w/ kind:', this.kind, 'token:', this.token, 'customInfo:', this.customInfo);

        // Pull in references to required global objects
        let _this = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let indexInfo = this.indexInfo;
        let customInfo = this.customInfo;
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;
        //console.log('-> spriteConfig:', spriteConfig, 'objectConfig:', objectConfig);

        // Determine whether or not this object is a "character" and thus requires special care
        let isCharacter = (this.kind === 'player' || this.kind === 'robot');
        let isField = (this.kind === 'field');

        // Start the data as a clone of the index info
        this.data = Object.assign({}, indexInfo);

        // Next, collect custom keys and loop through them, assigning values
        let customKeys = Object.keys(customInfo);
        for (let i = 0; i < customKeys.length; i++) {
            let key = customKeys[i];
            let value = customInfo[key];
            // If the value is a simple scalar, set it directly
            if (typeof value !== 'object') {
                this.data[key] = value;
                }
            // Otherwise, make sure we assign so that fields aren't lost
            else {
                this.data[key] = Object.assign({}, value);
                }
        }

        // Make sure we create data entries for non-indexed variables as-needed
        this.data.flags = this.data.flags || [];
        this.data.counters = this.data.counters || {};
        this.data.values = this.data.values || {};

        // Now we can collect or define key objectConfig properties that we need for later
        objectConfig.iconPrefix = objectConfig.iconPrefix || 'icon';
        objectConfig.baseSize = objectConfig.baseSize || [40, 40];
        objectConfig.baseAlt = objectConfig.baseAlt || 'base';
        objectConfig.baseSheet = objectConfig.baseSheet || 1;
        objectConfig.baseAltSheet = isCharacter || isField ? objectConfig.baseAlt : objectConfig.baseSheet;
        objectConfig.currentAltSheet = (isCharacter || isField ? this.data.image_alt : this.data.image_sheet) || objectConfig.baseAltSheet;
        objectConfig.currentAltSheetIsBase = objectConfig.currentAltSheet === 'base' || objectConfig.currentAltSheet === '1' || objectConfig.currentAltSheet === 1;
        //console.log(this.token + ' | -> objectConfig.currentAltSheet:', objectConfig.currentAltSheet, 'objectConfig.currentAltSheetIsBase:', objectConfig.currentAltSheetIsBase);

        // Make sure we also create kind-specific data entries as-needed
        let directionalKinds = ['players', 'robots', 'abilities', 'items'];
        if (directionalKinds.indexOf(this.xkind) !== -1){

            // Add default values for image direction and size
            let [ baseWidth, baseHeight ] = objectConfig.baseSize;
            this.data.image_size = this.data.image_size || Math.max(baseWidth, baseHeight);
            this.data.image_width = this.data.image_width || baseWidth || this.data.image_size;
            this.data.image_height = this.data.image_height || baseHeight || this.data.image_size;

            // If this is a robot or player, add default values for the alt
            if (this.kind === 'robot' || this.kind === 'player') {
                this.data.image_alt = this.data.image_alt || objectConfig.baseAlt;
                }
            // If this is an ability or item, add default values for the sheet instead
            else if (this.kind === 'ability' || this.kind === 'item') {
                this.data.image_sheet = this.data.image_sheet || objectConfig.baseSheet;
                }

            } else if (this.kind === 'field') {

            // Add the default value for the field image size
            let [ baseWidth, baseHeight ] = objectConfig.baseSize;
            this.data.image_width = this.data.image_width || baseWidth;
            this.data.image_height = this.data.image_height || baseHeight;

            // Add default values for background and foreground variants
            this.data.background_variant = this.data.background_variant || '';
            this.data.foreground_variant = this.data.foreground_variant || '';

            } else {

            // ...

            }

        //console.log(`-> ${this.token}'s ${objectConfig.currentAltSheet} data:`, this.data);

    }

    // Set a flag in the data object for this object
    setFlag (flag, value = true)
    {
        //console.log('MMRPG_Object.setFlag() called w/ flag:', flag, 'value:', value);
        this.data.flags.push(flag);
        this.data.flags = this.data.flags.filter((v, i, a) => a.indexOf(v) === i);
    }

    // Get a flag from the data object for this object
    getFlag (flag)
    {
        //console.log('MMRPG_Object.getFlag() called w/ flag:', flag);
        return this.data.flags.indexOf(flag) !== -1;
    }

    // Unset a flag in the data object for this object
    unsetFlag (flag)
    {
        //console.log('MMRPG_Object.unsetFlag() called w/ flag:', flag);
        this.data.flags = this.data.flags.filter((v) => v !== flag);
    }

    // Set a counter in the data object for this object
    setCounter (counter, value = 0)
    {
        //console.log('MMRPG_Object.setCounter() called w/ counter:', counter, 'value:', value);
        if (typeof value === 'string'){
            let oldValue = this.data.counters[counter] || 0;
            let newValue = Graphics.parseRelativePosition(value, oldValue);
            let minValue = this.data.counters[counter+'Min'] || null;
            let maxValue = this.data.counters[counter+'Max'] || null;
            if (minValue !== null && newValue < minValue){ newValue = minValue; }
            if (maxValue !== null && newValue > maxValue){ newValue = maxValue; }
            this.data.counters[counter] = newValue;
            } else {
            this.data.counters[counter] = value;
            }
    }

    // Get a counter from the data object for this object
    getCounter (counter)
    {
        //console.log('MMRPG_Object.getCounter() called w/ counter:', counter);
        return this.data.counters[counter] || 0;
    }

    // Increment a counter in the data object for this object, (create at zero if not exists first)
    incCounter (counter, increment = 1){ this.incrementCounter(counter, increment); }
    incrementCounter (counter, increment = 1)
    {
        //console.log('MMRPG_Object.incrementCounter() called w/ counter:', counter, 'increment:', increment);
        this.data.counters[counter] = this.data.counters[counter] || 0;
        this.data.counters[counter] += increment;
    }

    // Decrement a counter in the data object for this object, (create at zero if not exists first)
    decCounter (counter, decrement = 1){ this.decrementCounter(counter, decrement); }
    decrementCounter (counter, decrement = 1)
    {
        //console.log('MMRPG_Object.decrementCounter() called w/ counter:', counter, 'decrement:', decrement);
        this.data.counters[counter] = this.data.counters[counter] || 0;
        this.data.counters[counter] -= decrement;
    }

    // Set a value in the data object for this object
    setValue (key, value)
    {
        //console.log('MMRPG_Object.setValue() called w/ key:', key, 'value:', value);
        this.data.values[key] = value;
    }

    // Get a value from the data object for this object
    getValue (key)
    {
        //console.log('MMRPG_Object.getValue() called w/ key:', key);
        return this.data.values[key];
    }


    // -- SPRITE CREATION -- //

    // Creates the main sprite for this object using known token and config values while preloading related
    createSprite ()
    {
        //console.log('MMRPG_Object.createSprite() called for ', this.kind, this.token, '\nw/ config:', this.spriteConfig);

        // Update this object's x, y, z and props that may be accessed externally
        let _this = this;
        let scene = this.scene;
        let config = this.spriteConfig;
        let objectConfig = this.objectConfig;
        this.x = config.x;
        this.y = config.y;
        this.z = config.z;
        this.width = config.width;
        this.height = config.height;
        this.direction = config.direction;
        this.frame = config.frame;
        this.sheet = config.sheet;
        this.origin = config.origin;
        this.alpha = config.alpha;
        this.depth = config.depth;
        this.scale = config.scale;
        this.isMoving = false;
        this.isAnimating = false;
        this.ready = false;

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteSheets = SPRITES.index.sheets[this.xkind];
        let spriteAnims = SPRITES.index.anims[this.xkind];
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets, 'spriteAnims:', spriteAnims);

        // Sprites with directional logic are drawn differently then others
        let directionalKinds = ['players', 'robots', 'abilities', 'items'];
        if (directionalKinds.indexOf(this.xkind) !== -1){
            //console.log('-> this is a directional kind! xkind:', this.xkind, ' of ['+directionalKinds.join(', ')+']');

            // Preload all the sprite sheets and animations into the queue
            this.preloadSpriteSheets();
            //console.log(this.token + ' | SPRITES.pendingSheets.length:', SPRITES.pendingSheets.length);
            //console.log(this.token + ' | SPRITES.pendingAnims.length:', SPRITES.pendingAnims.length);

            // Pull in the sprite token and direction then use it to update the current sheet
            let spriteToken = this.data.token;
            let spriteDirection = this.direction || 'right';
            let spriteSheet = _this.getSpriteSheet('sprite', spriteDirection);
            //console.log(this.token + ' | -> spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteSheet:', spriteSheet);
            config.sheet = spriteSheet;
            this.sheet = spriteSheet;

            // Create the sprite with the information we've collected when ready
            if (scene.textures
                && spriteSheet && scene.textures.exists(spriteSheet)
                ) {
                //console.log('sprite texture for ' + this.token + ' already exists');

                // Texture is loaded, create sprite normally
                this.spriteIsLoading = false;
                this.createObjectSprite();
                this.executeQueuedSpriteMethods();
                this.ready = true;

                } else {
                //console.log('sprite texture for ' + this.token + ' does not exist');

                // Texture is not loaded, create placeholder and load texture
                let tempToken = this.kind;
                let tempAlt = objectConfig.baseAltSheet;
                let tempSheet = _this.getSpriteSheet('sprite', this.direction, tempAlt, tempToken);
                this.spriteIsLoading = true;
                this.spriteIsPlaceholder = true;
                this.createObjectSprite(tempSheet);
                this.loadSpriteTexture(() => {
                    //console.log('%c' + '-> sprite texture '+this.sheet+' loaded! (via directionalKinds)', 'color: #00FF00');
                    _this.spriteIsLoading = false;
                    _this.spriteIsPlaceholder = false;
                    _this.createObjectSprite();
                    _this.executeQueuedSpriteMethods();
                    _this.ready = true;
                    });

                }

            }
        // Otherwise, if this is field, it's a much much bigger "sprite" without direction
        else if (this.kind === 'field') {
            //console.log('MMRPG_Object.createSprite() called for ', this.kind, this.token, '\nw/ config:', this.spriteConfig);
            //console.log(this.token + ' | -> this is a unique field kind! xkind:', this.xkind);

            // Preload all the sprite sheets and animations into the queue
            this.preloadSpriteSheets();
            //console.log(this.token + ' should have pending sheets and anims now...');
            //console.log(this.token + ' | SPRITES.pendingSheets.length:', SPRITES.pendingSheets.length);
            //console.log(this.token + ' | SPRITES.pendingAnims.length:', SPRITES.pendingAnims.length);

            // Pull in the sprite token and direction then use it to update the current sheet
            let spriteToken = this.data.token;
            let backgroundVariant = this.data.background_variant;
            let foregroundVariant = this.data.foreground_variant;
            let backgroundSheet = _this.getSpriteSheet('background', backgroundVariant);
            let foregroundSheet = _this.getSpriteSheet('foreground', foregroundVariant);
            let gridlineSheet = 'misc.battle-grid'; // same for every field kind
            let previewSheet = _this.getSpriteSheet('preview', backgroundVariant);
            let avatarSheet = _this.getSpriteSheet('avatar');
            //console.log(this.token + ' | -> spriteToken:', spriteToken, '\nbackgroundSheet:', backgroundSheet, '\nforegroundSheet:', foregroundSheet, '\npreviewSheet:', previewSheet, '\navatarSheet:', avatarSheet);
            config.sheet = avatarSheet;
            this.sheet = avatarSheet;
            config.backgroundSheet = backgroundSheet;
            config.foregroundSheet = foregroundSheet;
            config.gridlineSheet = gridlineSheet;
            config.previewSheet = previewSheet;
            config.avatarSheet = avatarSheet;
            this.backgroundSheet = backgroundSheet;
            this.foregroundSheet = foregroundSheet;
            this.gridlineSheet = gridlineSheet;
            this.previewSheet = previewSheet;
            this.avatarSheet = avatarSheet;

            // Create the sprite with the information we've collected when ready
            if (scene.textures
                && backgroundSheet && scene.textures.exists(backgroundSheet)
                && foregroundSheet && scene.textures.exists(foregroundSheet)
                && gridlineSheet && scene.textures.exists(gridlineSheet)
                && previewSheet && scene.textures.exists(previewSheet)
                && avatarSheet && scene.textures.exists(avatarSheet)
                ) {
                //console.log('field sprite textures for ' + this.token + ' already exist');

                // Texture is loaded, create sprite normally
                this.spriteIsLoading = false;
                this.createObjectSprite();
                this.executeQueuedSpriteMethods();
                this.ready = true;

                } else {
                //console.log('field sprite textures for ' + this.token + ' do not exist');

                // Texture is not loaded, create placeholder and load texture
                let tempToken = this.kind;
                let tempVariant = 'base';
                let tempSheet = _this.getSpriteSheet('avatar', null, tempToken);
                this.spriteIsLoading = true;
                this.spriteIsPlaceholder = true;
                this.createObjectSprite(tempSheet);
                this.loadSpriteTexture(() => {
                    //console.log('%c' + '-> sprite texture '+this.sheet+' loaded (via fieldKinds)!', 'color: #00FF00');
                    _this.spriteIsLoading = false;
                    _this.spriteIsPlaceholder = false;
                    _this.createObjectSprite();
                    _this.executeQueuedSpriteMethods();
                    _this.ready = true;
                    });

                }

            }
        // Otherwise it's unclear what this is or what to do with it
        else {

            // ...

            }

    }

    // Load a given sprite texture (sheet) into memory and optionally execute a callback when done
    loadSpriteTexture (onLoadCallback)
    {
        //console.log('MMRPG_Object.loadSpriteTexture() called');
        let _this = this;
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        this.ready = false;
        this.spriteIsLoading = true;
        SPRITES.preloadPending(scene);
        scene.load.once('complete', () => {
            //console.log('-> loadSpriteTexture() complete for token:', token);
            _this.createSpriteAnimations();
            _this.spriteIsLoading = false;
            _this.executeQueuedSpriteMethods();
            if (onLoadCallback){ onLoadCallback.call(_this); }
            _this.ready = true;
            });
        scene.load.start();
    }

    // Queue all of this sprite's sheets into the memory using the sprite manager utility
    queueSpriteSheets ()
    {
        //console.log('MMRPG_Object.queueSpriteSheets() called for ', this.kind, this.token);

        // Pull in index references
        let _this = this;
        let scene = this.scene;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let objectConfig = this.objectConfig;

        // Collect info for the sprite given the kind it is
        let kind = this.kind;
        let xkind = this.xkind;
        let token = this.token;
        let indexInfo = this.indexInfo;
        //console.log('indexInfo for ', kind, token, '=', indexInfo);

        // Predefine some base paths and keys
        let altSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let altIsBase = objectConfig.currentAltSheetIsBase ? true : false;
        let pathToken = token === kind ? ('.' + kind) : token;
        let contentPath = MMRPG.paths.content;
        let basePath = contentPath + xkind + '/' + pathToken + '/sprites' + (!altIsBase ? '_'+altSheet : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + altSheet;
        let spriteSize = indexInfo.image_size || objectConfig.baseSize[0];
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        spritesIndex.prepForKeys(spritesIndex.sizes, xkind);
        spritesIndex.sizes[xkind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to spritesIndex.sizes['+xkind+']['+token+']')
        //console.log(this.token + ' | -> altSheet:', altSheet, 'altIsBase:', altIsBase, 'basePath:', basePath);

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteDirections.length; i++){
            let direction = spriteDirections[i];

            // -- LOAD MAIN SPRITE SHEETS -- //

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let sheetKey = baseKey+'.sprite-'+direction;
            let sheetToken = 'sprite-' + direction;
            spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, altSheet);
            spritesIndex.sheets[xkind][token][altSheet][sheetToken] = sheetKey;
            //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+altSheet+']['+sheetToken+']');

            // Define the relative image path for this sprite sheet
            let image = 'sprite_'+direction+'_'+spriteSizeX+'.png';
            let imagePath = basePath+image;
            spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, altSheet);
            spritesIndex.paths[xkind][token][altSheet][sheetToken] = imagePath;
            //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+altSheet+']['+sheetToken+']');

            // Queue loading the sprite sheet into the game
            //console.log('SPRITES.pendingSheets.push() w/', {key: sheetKey, path: imagePath, size: spriteSize});
            SPRITES.pendingSheets.push({
                key: sheetKey,
                path: imagePath,
                size: spriteSize,
                });

            // -- LOAD ICON SPRITE SHEETS -- //

            // Define and register the key for this icon sheet using direction, image, key, and path
            let iconPrefix = objectConfig.iconPrefix;
            let iconSheetKey = sheetKey.replace('sprites.', iconPrefix+'s.');
            let iconSheetToken = sheetToken.replace('sprite-', iconPrefix+'-');
            spritesIndex.sheets[xkind][token][altSheet][iconSheetToken] = iconSheetKey;

            // Queue loading the icon sheet into the game
            let iconImage = iconPrefix+'_'+direction+'_'+spriteSizeX+'.png';
            let iconImagePath = basePath+iconImage;
            spritesIndex.paths[xkind][token][altSheet][iconSheetToken] = iconImagePath;
            //console.log('queued [ '+iconImagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+altSheet+']['+iconSheetToken+']');

            // Queue loading the icon sheet into the game
            //console.log('SPRITES.pendingSheets.push() w/', {key: iconSheetKey, path: iconImagePath, size: spriteSize});
            SPRITES.pendingSheets.push({
                key: iconSheetKey,
                path: iconImagePath,
                size: spriteSize,
                });

            }

        // Return when done
        return;

    }

    // Queue and then preload all of this sprite's sheets into the memory using the sprite manager utility
    preloadSpriteSheets ()
    {
        //console.log('MMRPG_Object.preloadSpriteSheets() called for ', this.kind, this.token);

        // Pull in index references
        let scene = this.scene;
        let SPRITES = this.SPRITES;

        // Queue all of the sprite sheets into memory
        this.queueSpriteSheets();

        // Automatically run the preloadPending function
        SPRITES.preloadPending(scene);

    }

    // Main function to generate animations for the sprite sheet currently loaded into memory
    createSpriteAnimations ()
    {
        //console.log('MMRPG_Object.createSpriteAnimations() called for ', this.kind, this.token);

        // Pull in index references
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let objectConfig = this.objectConfig;

        // Collect info for the sprite given the kind it is
        let kind = this.kind;
        let xkind = this.xkind;
        let indexInfo = this.indexInfo;
        let objectData = this.data;
        let token = this.token;

        // Collect the sheet and base but be prepared to override
        // if we're still a placeholder sprite so we don't take the
        // real sprite's position in the index when ready
        let altSheet;
        let altIsBase;
        if (!this.spriteIsPlaceholder) {
            altSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
            altIsBase = objectConfig.currentAltSheetIsBase ? true : false;
            } else {
            altSheet = objectConfig.baseAltSheet;
            altIsBase = true;
            token = kind;
            }

        // Predefine some base paths and keys
        let spriteSize = indexInfo.image_size || objectConfig.baseSize[0];
        let spriteDirections = ['left', 'right'];
        spritesIndex.prepForKeys(spritesIndex.sizes, xkind);
        spritesIndex.sizes[xkind][token] = spriteSize;

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        let pendingAnims = [];
        if (kind === 'player'
            || kind === 'robot'
            || kind === 'ability'
            || kind === 'item') {
            for (let i = 0; i < spriteDirections.length; i++) {
                let direction = spriteDirections[i];
                // Create animations for this sprite depending on kind
                if (kind === 'player') {
                    this.addPlayerAnimations({ token: token, altSheet: altSheet, direction: direction }, pendingAnims);
                    } else if (kind === 'robot') {
                    this.addRobotAnimations({ token: token, altSheet: altSheet, direction: direction }, pendingAnims);
                    } else if (kind === 'ability') {
                    this.addAbilityAnimations({ token: token, altSheet: altSheet, direction: direction }, pendingAnims);
                    } else if (kind === 'item') {
                    //this.addItemAnimations({ token: token, altSheet: altSheet, direction: direction }, pendingAnims);
                    }
                }
            } else if (kind === 'field') {
            this.addFieldAnimations({ token: token, altSheet: altSheet }, pendingAnims);
            }

        // Now that we've queued everything up, we can re-loop through the anims and create them
        this.createPendingAnimations(pendingAnims);

        // Return when we are done creating sprite animations
        return;
    }

    // Function to get the base key
    getBaseSpriteKey (xkind, token, altSheet, spriteKind = 'sprite')
    {
        //console.log('MMRPG_Object.getBaseSpriteKey() called w/ xkind:', xkind, 'token:', token, 'altSheet:', altSheet, 'spriteKind:', spriteKind);
        let objectConfig = this.objectConfig;
        xkind = xkind || this.xkind;
        token = token || this.data.image || this.token;
        altSheet = altSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        if (this.spriteIsPlaceholder){ token = this.kind; altSheet = objectConfig.baseAltSheet; }
        //console.log(this.token + ' | -> spriteIsPlaceholder:', this.spriteIsPlaceholder, '-> token:', token, 'altSheet:', altSheet);
        let baseKey = spriteKind+'s.' + xkind + '.' + token + '.' + altSheet;
        //console.log(this.token + ' | -> returning baseKey:', baseKey);
        return baseKey;
    }

    // Function to get the sheet key
    getBaseSheetKey (direction, spriteKind = 'sprite')
    {
        //console.log('MMRPG_Object.getBaseSheetKey() called w/ direction:', direction);
        let baseKey = this.getBaseSpriteKey();
        direction = direction || this.direction;
        let sheetKey = baseKey + '.' + spriteKind + '-' + direction;
        //console.log(this.token + ' | -> returning sheetKey:', sheetKey);
        return sheetKey;
    }

    // Function to queue animations using config objects
    queueAnimation (name, config, pendingAnims = [])
    {
        //console.log('MMRPG_Object.queueAnimation() called w/ name:', name, 'config:', config);
        let scene = this.scene;
        let objectConfig = this.objectConfig;
        let spritesIndex = this.SPRITES.index;
        let spriteAnims = spritesIndex.anims;
        let xkind = this.xkind;
        let token = config.token || this.data.image || this.token;
        let direction = config.direction || this.direction;
        let altSheet = config.altSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        //console.log(this.token + ' | -> token:', token, 'altSheet:', altSheet, '(via config.altSheet:', config.altSheet, '|| objectConfig.currentAltSheet:', objectConfig.currentAltSheet, '|| objectConfig.baseAltSheet:', objectConfig.baseAltSheet+')');
        let spriteKind = 'sprite';
        let sheetToken = config.sheetToken || spriteKind+'-' + direction;
        let sheetKey = config.sheetKey || this.getBaseSheetKey(config.direction, spriteKind);
        let animKey = sheetKey + '.' + name;
        //console.log(this.token + ' | -> spriteKind:', spriteKind, 'sheetToken:', sheetToken, 'sheetKey:', sheetKey, 'animKey:', animKey);
        spritesIndex.prepForKeys(spriteAnims, xkind, token, altSheet, sheetToken);
        spriteAnims[xkind][token][altSheet][sheetToken][name] = animKey;
        //console.log(this.token + ' | -> queued [ '+animKey+' ] to spriteAnims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+name+']');
        //console.log(this.token + ' | -> spriteAnims:', spriteAnims);
        if (!scene.anims.get(animKey)){
            let pendingAnim = {
                name: name,
                key: animKey,
                sheet: sheetKey,
                frames: config.frames
                };
            if (config.frameRate){ pendingAnim.frameRate = config.frameRate; }
            if (config.duration){ pendingAnim.duration = config.duration; }
            if (config.repeat){ pendingAnim.repeat = config.repeat; }
            pendingAnims.push(pendingAnim);
            }
    }

    // Function to add player animations using config objects
    addPlayerAnimations (config, pendingAnims = [])
    {
        //console.log('MMRPG_Object.addPlayerAnimations() called w/ config:', config);
        let token = config.token || this.data.image || this.token;
        let direction = config.direction || this.direction;
        let indexInfo = this.indexInfo;
        let baseStats = indexInfo.baseStats || {};
        let speedMod = baseStats.dividers.speed || 1;

        // Add idle animation
        this.queueAnimation('idle', {
            token: token,
            frames: [0, 1, 0, 6, 0, 1, 0, 1, 0, 6],
            duration: Math.round(6000 * speedMod),
            repeat: -1,
            direction: direction
            }, pendingAnims);

        // Add running animation
        this.queueAnimation('run', {
            token: token,
            frames: [8, 7, 8, 9],
            duration: 800,
            repeat: -1,
            direction: direction
            }, pendingAnims);
    }

    // Function to add robot animations using config objects
    addRobotAnimations (config, pendingAnims = [])
    {
        //console.log('MMRPG_Object.addRobotAnimations() called w/ config:', config);
        let token = config.token || this.data.image || this.token;
        let direction = config.direction || this.direction;
        let indexInfo = this.indexInfo;
        let baseStats = indexInfo.baseStats || {};
        let speedMod = baseStats.dividers.speed || 1;

        // Add idle animation
        this.queueAnimation('idle', {
            token: token,
            frames: [0, 1, 0, 8, 0, 1, 0, 10, 0, 0],
            duration: Math.round(10000 * speedMod),
            repeat: -1,
            direction: direction
            }, pendingAnims);

        // Add sliding animation
        this.queueAnimation('slide', {
            token: token,
            frames: [8, 7, 7, 7, 7, 7, 7, 8],
            frameRate: 6,
            repeat: 0,
            direction: direction
            }, pendingAnims);

        // Add shooting animation
        this.queueAnimation('shoot', {
            token: token,
            frames: [8, 4, 4, 4, 4, 4, 4, 4],
            frameRate: 6,
            repeat: 0,
            direction: direction
            }, pendingAnims);
    }

    // Function to add ability animations using config objects
    addAbilityAnimations (config, pendingAnims = [])
    {
        //console.log('MMRPG_Object.addAbilityAnimations() called w/ config:', config);
        let token = config.token || this.data.image || this.token;
        let direction = config.direction || this.direction;
        let indexInfo = this.indexInfo;

        // Add static animation
        this.queueAnimation('static', {
            token: token,
            frames: [0],
            duration: 1000,
            repeat: -1,
            direction: direction
            }, pendingAnims);
    }

    // Function to add field animations using config objects
    addFieldAnimations (config, pendingAnims = [])
    {
        //console.log('MMRPG_Object.addFieldAnimations() called w/ config:', config);
        let scene = this.scene;
        let token = config.token || this.data.image || this.token;
        let sheet = config.sheet || this.avatarSheet;
        let direction = config.direction || this.direction;
        let indexInfo = this.indexInfo;

        // Add basic loop animation for the background (containing all frames in sequence)
        let backgroundSheet = this.getBaseSpriteKey(null, null, 'background');
        let backgroundTexture = scene.textures.get(backgroundSheet);
        let backgroundTextureSize = backgroundTexture && backgroundTexture.frameTotal ? backgroundTexture.frameTotal - 1 : 0;
        //console.log(this.token + ' | -> backgroundSheet:', backgroundSheet, 'backgroundTexture:', backgroundTexture);
        let backgroundFrames = backgroundTextureSize ? scene.anims.generateFrameNumbers(backgroundSheet, { start: 0, end: (backgroundTextureSize - 1) }) : [];
        //console.log(this.token + ' | -> backgroundFrames:', backgroundFrames);
        this.queueAnimation('loop', {
            token: token,
            frames: backgroundFrames,
            frameRate: 3,
            repeat: -1,
            spriteKind: 'background'
            }, pendingAnims);

    }

    // Function to create pending animations provided a list of their configs
    createPendingAnimations (pendingAnims)
    {
        //console.log('MMRPG_Object.createPendingAnimations() called for ', this.kind, this.token, 'w/ pendingAnims:', pendingAnims);
        let scene = this.scene;
        while (pendingAnims.length) {

            // Pull the next animation in sequence, but skip if it already exists
            let anim = pendingAnims.shift();
            if (scene.anims.get(anim.key)){ console.warn(this.token + ' | anim.key: ' + anim.key + ' already exists'); continue; }
            //console.log('%c' + this.token + ' | creating new animation for ' + anim.key + ' -> ' + JSON.stringify(anim), 'color: green;');

            // Parse any frame numbers into frame objects for the animation
            if (anim.frames
                && anim.frames.length > 0
                && typeof anim.frames[0] === 'number'){
                //console.log(this.token + ' | -> anim.frames(before):', anim.frames);
                anim.frames = scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames });
                //console.log(this.token + ' | -> anim.frames(after):', anim.frames);
                }

            // Create the new animation in the scene
            //console.log(this.token + ' | creating new animation for ', anim.key, 'w/', anim);
            scene.anims.create(anim);

            // Pull the new animation from the scene to validate it was created
            let createdAnim = scene.anims.get(anim.key);
            //console.log(this.token + ' | created new animation w/ createdAnim:', createdAnim);

            }
    }

    // Function to add a sprite animation externally using config objects
    addSpriteAnimation (name, config)
    {
        //console.log('MMRPG_Object.addSpriteAnimation() called w/ name:', name, 'config:', config);
        let pendingAnims = [];
        this.queueAnimation(name, config, pendingAnims);
        this.createPendingAnimations(pendingAnims);
    }

    // Check if a sprite sheet exists for the loaded object
    hasSpriteSheet (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.hasSpriteSheet() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let sheetsIndex = spritesIndex.sheets;
        let objectConfig = this.objectConfig;
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        if (!sheetsIndex[xkind]) return false;
        if (!sheetsIndex[xkind][spriteToken]) return false;
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let spriteKindKey = spriteKind+'-'+spriteDirection;
        let spriteSheets = sheetsIndex[xkind][spriteToken] || {};
        return spriteSheets && spriteSheets[spriteAltOrSheet] && spriteSheets[spriteAltOrSheet][spriteKindKey];
    }

    // Check if a sprite path exists for the loaded object
    hasSpritePath (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.hasSpritePath() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritePaths = SPRITES.index.paths[xkind];
        let objectConfig = this.objectConfig;
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let spriteKey = spriteKind+'-'+spriteDirection;
        return spritePaths && spritePaths[spriteToken] && spritePaths[spriteToken][spriteAltOrSheet] && spritePaths[spriteToken][spriteAltOrSheet][spriteKey];
    }

    // Check if a sprite animation exists for the loaded object
    hasSpriteAnim (spriteKind = 'sprite', animName = 'idle', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.hasSpriteAnim() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'animName:', animName);
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let animationsIndex = spritesIndex.anims;
        let objectConfig = this.objectConfig;
        animName = animName || 'idle';
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        if (!animationsIndex[xkind]) return false;
        if (!animationsIndex[xkind][spriteToken]) return false;
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let spriteKindKey = spriteKind+'-'+spriteDirection;
        let spriteAnims = animationsIndex[xkind][spriteToken] || {};
        return spriteAnims && spriteAnims[spriteAltOrSheet] && spriteAnims[spriteAltOrSheet][spriteKindKey] && spriteAnims[spriteAltOrSheet][spriteKindKey][animName];
    }

    // Get the current sprite sheet/texture key for the loaded object
    // Optionally accepts kind, direction, altOrSheet, and token to override defaults
    getSpriteSheet (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpriteSheet() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let sheetsIndex = spritesIndex.sheets;
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'sheetsIndex:', sheetsIndex, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        if (!sheetsIndex[xkind]){ console.warn(this.token + ' | -> sheetsIndex['+xkind+'] does not exist'); return; }
        if (!sheetsIndex[xkind][spriteToken]){ console.warn(this.token + ' | -> sheetsIndex['+xkind+']['+spriteToken+'] does not exist'); return; }
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let spriteKindKey = spriteKind+'-'+spriteDirection;
        let spriteSheets = sheetsIndex[xkind][spriteToken] || {};
        //console.log(this.token + ' | -> spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteAltOrSheet:', spriteAltOrSheet, 'spriteKindKey:', spriteKindKey, 'spriteSheets:', spriteSheets);

        // Define the sprite key and sheet token given context
        //console.log(this.token + ' | -> looking for sheetKey in spriteSheets['+xkind+']['+spriteToken+']['+spriteAltOrSheet+']['+spriteKindKey+']');
        let sheetKey;
        if (spriteSheets
            && spriteSheets[spriteAltOrSheet]
            && spriteSheets[spriteAltOrSheet][spriteKindKey]){
            sheetKey = spriteSheets[spriteAltOrSheet][spriteKindKey];
            //console.log(this.token + ' | -> found sheetKey:', sheetKey);
            } else {
            sheetKey = '~'+spriteKind+'s.'+xkind+'.'+spriteToken+'.'+spriteAltOrSheet+'.'+spriteKindKey;
            console.warn(this.token + ' | -> could not find sheetKey:', sheetKey, 'in spriteSheets:', spriteSheets);
            }

        // Return the sheet token we found
        //console.log('Returning sheetKey:', sheetKey);
        return sheetKey;

    }

    // Determine and return the texture path (sheet) for an object given kind and direction (we already know the rest)
    getSpritePath (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpritePath() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritePaths = SPRITES.index.paths[xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spritePaths:', spritePaths, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        //console.log('Using getSpritePath() w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteAltOrSheet:', spriteAltOrSheet)

        // Define the sprite key and sheet token given context
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spritePath;
        let spriteKey = spriteKind+'-'+spriteDirection;
        if (typeof spritePaths[spriteToken] !== 'undefined'
            && typeof spritePaths[spriteToken][spriteAltOrSheet] !== 'undefined'
            && typeof spritePaths[spriteToken][spriteAltOrSheet][spriteKey] !== 'undefined'){
            spritePath = spritePaths[spriteToken][spriteAltOrSheet][spriteKey];
            } else {
            let size = this.data.image_size || objectConfig.baseSize[0];
            let xSize = size+'x'+size;
            spritePath = 'content/' + xkind + '/' + this.kind + '/' + spriteKind + '_' + spriteDirection +  '_' + xSize + '.png';
            }

        // Return the sheet token we found
        //console.log('Returning spritePath:', spritePath);
        return spritePath;

    }

    // Get the animation key of a specific animation on this loaded object
    // Optionally accepts kind, direction, altOrSheet, and token to override defaults
    getSpriteAnim (spriteKind = 'sprite', animName = 'idle', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpriteAnim() called for ', this.kind, this.token, 'w/ spriteKind:', spriteKind, 'amimName:', animName, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let animationsIndex = spritesIndex.anims;
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'animationsIndex:', animationsIndex, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        animName = animName || 'idle';
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        if (!animationsIndex[xkind]){ console.warn(this.token + ' | -> animationsIndex['+xkind+'] does not exist'); return; }
        if (!animationsIndex[xkind][spriteToken]){ console.warn(this.token + ' | -> animationsIndex['+xkind+']['+spriteToken+'] does not exist'); return; }
        spriteDirection = spriteDirection || this.direction;
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        let spriteKindKey = spriteKind+'-'+spriteDirection;
        let spriteAnims = animationsIndex[xkind][spriteToken] || {};
        //console.log(this.token + ' | -> animName:', animName, 'spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteAltOrSheet:', spriteAltOrSheet, 'spriteKindKey:', spriteKindKey, 'spriteAnims:', spriteAnims);

        // Define the sprite key and sheet token given context
        //console.log(this.token + ' | -> looking for animKey in spriteAnims['+xkind+']['+spriteToken+']['+spriteAltOrSheet+']['+spriteKindKey+']['+animName+']');
        let animKey;
        if (spriteAnims
            && spriteAnims[spriteAltOrSheet]
            && spriteAnims[spriteAltOrSheet][spriteKindKey]
            && spriteAnims[spriteAltOrSheet][spriteKindKey][animName]){
            animKey = spriteAnims[spriteAltOrSheet][spriteKindKey][animName];
            //console.log(this.token + ' | -> found animKey:', animKey);
            } else {
            animKey = '~'+spriteKind+'s.'+xkind+'.'+spriteToken+'.'+spriteAltOrSheet+'.'+spriteKindKey+'.'+animName;
            console.warn(this.token + ' -> could not find animKey:', animKey, 'in spriteAnims:', spriteAnims);
            }

        // Return the sheet token we found
        //console.log('Returning animKey:', animKey);
        return animKey;

    }

    // Prepare this object's sprite for use, creating it if it doesn't exist yet
    prepareSprite (spriteSheet = null)
    {
        //console.log('MMRPG_Object.prepareSprite() called for ', this.kind, this.token, '\nw/ spriteSheet:', spriteSheet, 'spriteConfig:', this.spriteConfig);
        if (this.sprite){ return; }
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let config = this.spriteConfig;
        let sheet = spriteSheet || config.sheet;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        //let $sprite = scene.add.sprite(modX, modY, sheet);
        let $sprite = SPRITES.add(modX, modY, sheet);
        this.sprite = $sprite;
        //console.log('-> created new sprite w/ sheet:', sheet, 'x:', config.x, 'y:', config.y);
        if (config.shadow){ this.prepareSpriteShadow(sheet); }
    }

    // Prepare this object's sprite shadow for us, creating it if it doesn't exist yet
    // Note: This is an exactly replica of the prepareSprite function, but for shadows
    prepareSpriteShadow (spriteSheet = null)
    {
        //console.log('MMRPG_Object.prepareSpriteShadow() called for ', this.kind, this.token, '\nw/ spriteSheet:', spriteSheet, 'spriteConfig:', this.spriteConfig);
        let _this = this;
        if (!this.sprite){ return; }
        if (this.spriteShadow){ return; }
        let SPRITES = this.SPRITES;
        let $sprite = this.sprite;
        let scene = this.scene;
        let config = this.spriteConfig;
        let sheet = spriteSheet || config.sheet;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        let shadowStyle = config.shadowStyle;
        let useMesh = shadowStyle === 'perspective' ? true : false;

        // Create the new shadow sprite and, if using perspective, set up the mesh for it
        let $shadow = SPRITES.add(modX, modY, sheet, useMesh, 0);
        if (shadowStyle === 'perspective'){ this.initSpriteShadow($shadow); }
        //console.log('-> created new sprite shadow w/ sheet:', sheet, 'x:', config.x, 'y:', config.y);
        this.spriteShadow = $shadow;

        // If this object already has a container assigned to it, make sure we "add" this shadow sprite too
        if (this.spriteContainer){ this.spriteContainer.add($shadow); }

        // Make sure this shadow tracks animation updates on the parent
        $sprite.on('animationupdate', function (animation, frame){
            //console.log(_this.token + ' | -> shadow animationupdate to frame ', frame.textureFrame, '\nw/ frame:', frame, '\nw/ $shadow:', _this.spriteShadow);
            let config = _this.spriteConfig;
            let $shadow = _this.spriteShadow;
            let shadowStyle = config.shadowStyle;
            let shadowTexture = $shadow.texture.key;
            let currentFrame = $shadow.frame.name;
            let newFrame = frame.textureFrame;
            if (currentFrame === newFrame){ return; }
            //console.log(_this.token + ' | -> shadow // currentFrame:', currentFrame, ' vs. newFrame:', newFrame, '\nw/ shadowTexture:', shadowTexture);
            $shadow.setFrame(newFrame);
            if (shadowStyle === 'perspective'){
                //console.log(_this.token + ' | -> perspective // $shadow.setTexture(', shadowTexture, newFrame, ');');
                $shadow.clear();
                _this.initSpriteShadow($shadow);
                }
            });

    }

    // Initialize a sprite shadow mesh with base settings so we can use it later
    initSpriteShadow ($mesh, frame = 0)
    {
        //console.log(this.token + ' | -> initSpriteShadow w/ $mesh:', $mesh, 'frame:', frame);
        if (!this.sprite){ return; }
        let _this = this;
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let side = $mesh.x >= MMRPG.canvas.centerX ? 'right' : 'left';
        let rotateX = side === 'left' ? -config.shadowRotationX : config.shadowRotationX;
        let rotateY = config.shadowRotationY;
        let scale = config.scale * config.shadowScale;
        Phaser.Geom.Mesh.GenerateGridVerts({
            mesh: $mesh,
            widthSegments: 6
            });
        $mesh.setScale(scale);
        $mesh.setDepth($sprite.depth - 2);
        $mesh.setTint(config.shadowTint);
        $mesh.setAlpha(config.shadowAlpha);
        $mesh.setOrtho();
        $mesh.hideCCW = false;
        $mesh.modelRotation.x = rotateX;
        $mesh.modelRotation.y = rotateY;
        $mesh.setFrame(frame);
    }

    // Prepare this object's individual sprite layers for use, creating them if they doesn't exist yet
    prepareSpriteLayers ()
    {
        //console.log('MMRPG_Object.prepareSpriteLayers() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);

        // ... nothing to do here for yet ... //

    }

    // Create the new object sprite with the sprite sheet provided and then update/create their graphics, properties, and animations
    createObjectSprite (spriteSheet = null)
    {
        //console.log('MMRPG_Object.createObjectSprite() called for ', this.kind, this.token, '\nw/ spriteSheet:', spriteSheet, '\n& spriteConfig:', this.spriteConfig);
        this.prepareSprite(spriteSheet);
        this.prepareSpriteLayers();
        this.updateSpriteGraphics();
        this.updateSpriteProperties();
        this.createSpriteAnimations();
    }

    // Creates the rectangular hitbox over top of the sprite for click-functionality, transparent by default but translucent magenta for debug
    createSpriteHitbox ()
    {
        //console.log('MMRPG_Object.createSpriteHitbox() called for ', this.kind, this.token);

        // Pull in references to required global objects
        let _this = this;
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        let config = this.spriteConfig;

        // Define the hitbox config and create the hitbox sprite
        let hitboxConfig = {
            x: config.x,
            y: config.y,
            width: config.hitbox[0] * config.scale,
            height: config.hitbox[1] * config.scale,
            depth: config.depth + config.z + 1,
            origin: [config.origin[0], config.origin[1]],
            alpha: 0.5,
            tint: 0xFF00FF,
            };

        // Create the hitbox zone where we can click on the sprite
        //console.log('Creating hitbox sprite for ', this.token, ' w/ config:', hitboxConfig);
        let $hitbox;
        if (config.debug){
            $hitbox = scene.add.rectangle(hitboxConfig.x, hitboxConfig.y, hitboxConfig.width, hitboxConfig.height, hitboxConfig.tint, hitboxConfig.alpha);
            $hitbox.setAlpha(hitboxConfig.alpha);
            } else {
            $hitbox = scene.add.zone(hitboxConfig.x, hitboxConfig.y, hitboxConfig.width, hitboxConfig.height);
            $hitbox.setRectangleDropZone(hitboxConfig.width, hitboxConfig.height);
            }
        $hitbox.setDepth(hitboxConfig.depth);
        $hitbox.setOrigin(hitboxConfig.origin[0], hitboxConfig.origin[1]);
        this.spriteHitbox = $hitbox;

    }

    // Update the existing sprite with any changes that have been made to the spriteConfig object
    updateSpriteGraphics ()
    {
        //console.log('MMRPG_Object.updateSpriteGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        let objectConfig = this.objectConfig;

        // Define a quick function that checks for any any transforms to a given property and returns the final value
        const getTransProp = (propName) => {
            let propVal = 0;
            let transformsList = config.transforms.data || {};
            let transformKeys = Object.keys(transformsList);
            //console.log(this.token + ' | -> checking transformsList:', transformsList, 'for propName:', propName, 'w/ transformKeys:', transformKeys);
            for (let i = 0; i < transformKeys.length; i++){
                let transKey = transformKeys[i];
                let transProps = transformsList[transKey];
                //console.log(this.token + ' | -> checking if transKey:', transKey, 'transProps:', transProps, 'has propName:', propName);
                if (transProps[propName]){
                    //console.log(this.token + ' | -> found transProps['+propName+']:', transProps[propName]);
                    propVal += transProps[propName];
                    }
                }
            //console.log(this.token + ' | -> returning final trans', propName, 'as', propVal);
            return propVal;
            };

        // First update the sprite itself as that's most important
        //console.log(this.token + ' | -> attempting to update sheet from', this.cache.sheet, 'to', config.sheet);
        if (typeof this.cache.sheet === 'undefined'){ this.cache.sheet = null; }
        if (this.cache.sheet !== config.sheet || $sprite.texture.key !== config.sheet){
            $sprite.setTexture(config.sheet);
            this.cache.sheet = config.sheet;
            //console.log(this.token + ' | -> updated sheet to', config.sheet, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update frame from', this.cache.frame, 'to', config.frame);
        if (typeof this.cache.frame === 'undefined'){ this.cache.frame = null; }
        if (this.cache.frame !== config.frame){
            $sprite.setFrame(config.frame);
            this.cache.frame = config.frame;
            //console.log(this.token + ' | -> updated frame to', config.frame, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update tint from', this.cache.tint, 'to', config.tint);
        if (typeof this.cache.tint === 'undefined'){ this.cache.tint = null; }
        if (this.cache.tint !== config.tint){
            if (config.tint){ $sprite.setTint(Graphics.returnHexColorValue(config.tint)); }
            else { $sprite.clearTint(); }
            this.cache.tint = config.tint;
            //console.log(this.token + ' | -> updated tint to', config.tint, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update alpha from', this.cache.alpha, 'to', config.alpha);
        if (typeof this.cache.alpha === 'undefined'){ this.cache.alpha = null; }
        if (this.cache.alpha !== config.alpha){
            $sprite.setAlpha(config.alpha);
            this.cache.alpha = config.alpha;
            //console.log(this.token + ' | -> updated alpha to', config.alpha, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update scale from', this.cache.scale, 'to', config.scale);
        if (typeof this.cache.scale === 'undefined'){ this.cache.scale = null; }
        if (this.cache.scale !== config.scale){
            $sprite.setScale(config.scale);
            if ($hitbox){ $hitbox.setScale(config.scale); }
            this.cache.scale = config.scale;
            //console.log(this.token + ' | -> updated scale to', config.scale, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update origin from', this.cache.origin, 'to', config.origin);
        if (typeof this.cache.origin === 'undefined'){ this.cache.origin = null; }
        if (this.cache.origin !== config.origin){
            $sprite.setOrigin(config.origin[0], config.origin[1]);
            if ($hitbox){ $hitbox.setOrigin(config.origin[0], config.origin[1]); }
            this.cache.origin = config.origin;
            //console.log(this.token + ' | -> updated origin to', config.origin, 'and updated cache');
            }

        // Calculate the sprite's position based on hard-coded x and y values present in the spriteConfig
        let allowTransforms = this.kind !== 'field' ? true : false;
        let spriteOffsets = this.kind !== 'field' ? this.getSpriteSizeOffsets() : [0, 0];
        let spriteX, spriteY;
        let transX = allowTransforms ? getTransProp('x') : 0;
        let transY = allowTransforms ? getTransProp('y') : 0;
        if (typeof this.cache.x === 'undefined'){ this.cache.x = null; }
        if (typeof this.cache.y === 'undefined'){ this.cache.y = null; }
        if (typeof this.cache.transX === 'undefined'){ this.cache.transX = null; }
        if (typeof this.cache.transY === 'undefined'){ this.cache.transY = null; }
        if (this.cache.x !== config.x || this.cache.y !== config.y
            || this.cache.transX !== transX || this.cache.transY !== transY){
            /* if (this.token === 'test-man'){
                console.warn(this.token + ' | -> position updates required!',
                    '\nw/ cache.x:', this.cache.x, 'vs. config.x:', config.x,
                    '\nw/ cache.y:', this.cache.y, 'vs. config.y:', config.y,
                    '\nw/ cache.transX:', this.cache.transX, 'vs. transX:', transX,
                    '\nw/ cache.transY:', this.cache.transY, 'vs. transY:', transY,
                    '\nw/ spriteOffsets:', spriteOffsets
                    );
                } */
            spriteX = config.x + spriteOffsets[0] + transX;
            spriteY = config.y + spriteOffsets[1] + transY;
            /* if (this.token === 'test-man'){
                console.warn(this.token + ' | -> updating final positions to spriteX:', spriteX, 'spriteY:', spriteY);
                } */
            $sprite.setPosition(spriteX, spriteY);
            if ($hitbox){ $hitbox.setPosition(config.x, config.y); }
            this.cache.x = config.x;
            this.cache.y = config.y;
            this.cache.transX = transX;
            this.cache.transY = transY;
            //console.log(this.token + ' | -> updated positions w/ spriteX:', spriteX, 'spriteY:', spriteY, 'transX:', transX, 'transY:', transY, 'and updated cache');
            }

        // If this sprite is inside of a container and we're allowed to, track Z changes to that container
        let spriteContainer = this.spriteContainer || null;
        let useContainerForDepth = spriteContainer && config.useContainerForDepth ? true : false;
        let sortSpriteContainer = false;
        //console.log(this.token + ' | -> check if we update z via the sprite container w/ spriteContainer:', typeof this.spriteContainer, 'and config.useContainerForDepth:', config.useContainerForDepth);
        if (useContainerForDepth){
            //console.log(this.token + ' | -> tracking Z to container:', this.spriteContainer);
            let containerBounds = spriteContainer.getBounds() || null;
            let containerY = containerBounds.y || 0;
            let objectY = config.y || 0;
            let offsetZ = Math.ceil(objectY - containerY);
            //console.log(this.token + ' | -> containerY:', containerY, 'objectY:', objectY, 'offsetZ:', offsetZ);
            config.z = offsetZ;
            }

        if (typeof this.cache.depth === 'undefined'){ this.cache.depth = null; }
        if (typeof this.cache.z === 'undefined'){ this.cache.z = null; }
        //console.log(this.token + ' | -> attempting to update depth from', this.cache.depth, 'to', config.depth);
        //console.log(this.token + ' | -> also considering z from', this.cache.z, 'to', config.z);
        if (this.cache.depth !== config.depth
            || this.cache.z !== config.z){
            $sprite.setDepth(config.depth + config.z);
            if ($hitbox){ $hitbox.setDepth(config.depth + config.z + 1); }
            this.cache.depth = config.depth;
            this.cache.z = config.z;
            if (useContainerForDepth){ sortSpriteContainer = true; }
            //console.log(this.token + ' | -> updated depth to', config.depth, 'and updated cache');
            }

        // If there's a shadow created, we should update that with any changes to the parent
        if (typeof this.cache.shadow === 'undefined'){ this.cache.shadow = {}; }
        let shadowCache = this.cache.shadow;
        if (config.shadow && this.spriteShadow){
            //console.log('%c' + this.token + ' | -> updating shadow!', 'color: lime;');
            //console.log(this.token + ' | -> config:', config);
            //console.log(this.token + ' | -> spriteShadow:', this.spriteShadow);
            //console.log(this.token + ' | -> config.width:', config.width, 'vs.', '$sprite.width:', $sprite.width, 'vs.', 'objectConfig.baseSize[0]', objectConfig.baseSize[0]);
            let $shadow = this.spriteShadow;
            let shadowSide = 'center';
            if (config.x <= MMRPG.canvas.centerX){ shadowSide = 'left'; }
            else if (config.x >= MMRPG.canvas.centerX){ shadowSide = 'right'; }
            let spriteOriginX = config.origin[0];
            let spriteOriginY = config.origin[1];
            let spriteX = $sprite.x;
            let spriteY = $sprite.y;
            let shadowStyle = config.shadowStyle;
            let shadowSheet = config.sheet;
            let shadowScale = config.shadowScale;
            let shadowAlpha = config.shadowAlpha;
            let shadowTint = config.shadowTint;
            let shadowRotationX = config.shadowRotationX;
            let shadowRotationY = config.shadowRotationY;
            let shadowFrame = $sprite.frame.name;
            let shadowDepth = $sprite.depth - 1;
            let shadowX = spriteX;
            let shadowY = spriteY;
            let shadowWidth = $shadow.width;
            let shadowHeight = $shadow.height;
            if (shadowStyle === 'drop'){
                let dropShift = 2 * config.scale;
                if (shadowSide === 'left'){ shadowX -= dropShift; }
                else if (shadowSide === 'right'){ shadowX += dropShift; }
                }
            else if (shadowStyle === 'perspective'){
                // Meshes don't support setOrigin() for reasons so we just have to move the shadow manually
                if (spriteOriginX === 0){ shadowX += Math.floor(shadowWidth / 4); }
                else if (spriteOriginX === 0.5){ shadowX -= 0; }
                else if (spriteOriginX === 1){ shadowX -= Math.floor(shadowWidth / 4); }
                if (spriteOriginY === 0){ shadowY += Math.floor(shadowHeight / 4); }
                else if (spriteOriginY === 0.5){ shadowY -= 0; }
                else if (spriteOriginY === 1){ shadowY -= Math.floor(shadowHeight / 4); }
                // Now we can shift the model rotation left or right as needed based on canvas side
                if (shadowSide === 'left'){ $shadow.modelRotation.x = -shadowRotationX; }
                else if (shadowSide === 'right'){ $shadow.modelRotation.x = shadowRotationX; }
                // Further, we should also offset the X a bit more just to drive the point home
                if (shadowSide === 'left'){ shadowX -= Math.floor(shadowWidth / 3); shadowX -= Math.floor(shadowWidth / 3) * (config.scale - 1); }
                else if (shadowSide === 'right'){ shadowX += Math.floor(shadowWidth / 3); shadowX += Math.floor(shadowWidth / 3) * (config.scale - 1); }
                // And we should also pull-up the Y a slight bit more so shadows are behind sprites
                shadowY -= Math.floor(shadowHeight / 4) * (config.scale - 1);
                }
            if (shadowCache.sheet !== shadowSheet
                || $shadow.texture.key !== shadowSheet){
                //console.log(this.token + ' | -> updating shadow sheet from', shadowCache.sheet, 'to', shadowSheet);
                if (shadowStyle === 'drop'){ $shadow.setTexture(shadowSheet); }
                else if (shadowStyle === 'perspective'){ $shadow.setTexture(shadowSheet, shadowFrame); }
                shadowCache.sheet = shadowSheet;
                }
            if (shadowCache.scale !== shadowScale){
                //console.log(this.token + ' | -> updating shadow scale from', shadowCache.scale, 'to', shadowScale);
                $shadow.setScale(shadowScale);
                shadowCache.scale = shadowScale;
                }
            if (shadowCache.originX !== spriteOriginX
                || shadowCache.originY !== spriteOriginY){
                //console.log(this.token + ' | -> updating shadow origin from', shadowCache.originX, shadowCache.originY, 'to', spriteOriginX, spriteOriginY);
                if (shadowStyle === 'drop'){
                    $shadow.setOrigin(spriteOriginX, spriteOriginY);
                    } else if (shadowStyle === 'perspective'){
                    // meshes don't support setOrigin so we do nothing here
                    }
                shadowCache.originX = spriteOriginX;
                shadowCache.originY = spriteOriginY;
                }
            if (shadowCache.alpha !== shadowAlpha){
                //console.log(this.token + ' | -> updating shadow alpha from', shadowCache.alpha, 'to', shadowAlpha);
                $shadow.setAlpha(shadowAlpha);
                shadowCache.alpha = shadowAlpha;
                }
            if (shadowCache.tint !== shadowTint){
                //console.log(this.token + ' | -> updating shadow tint from', shadowCache.tint, 'to', shadowTint);
                if (shadowTint === false){ $shadow.clearTint(); }
                else { $shadow.setTint(shadowTint); }
                shadowCache.tint = shadowTint;
                }
            if (shadowCache.x !== shadowX
                || shadowCache.y !== shadowY){
                //console.log(this.token + ' | -> updating shadow position from', shadowCache.x, shadowCache.y, 'to', shadowX, shadowY);
                $shadow.setPosition(shadowX, shadowY);
                shadowCache.x = shadowX;
                shadowCache.y = shadowY;
                }
            if (shadowCache.depth !== shadowDepth){
                //console.log(this.token + ' | -> updating shadow depth from', shadowCache.depth, 'to', shadowDepth);
                $shadow.setDepth(shadowDepth);
                shadowCache.depth = shadowDepth;
                if (useContainerForDepth){ sortSpriteContainer = true; }
                }
            if (shadowCache.frame !== shadowFrame){
                //console.log(this.token + ' | -> updating shadow frame from', shadowCache.frame, 'to', shadowFrame);
                $shadow.setFrame(shadowFrame);
                if (shadowStyle === 'perspective'){
                    // Phaser 3.80.1 has bug with meshes and setFrame() so we need to do a bit of extra work
                    $shadow.clear();
                    this.initSpriteShadow($shadow);
                    }
                shadowCache.frame = shadowFrame;
                }
            }

        // And finally, update any layer graphics that are present
        this.updateSpriteLayerGraphics();

        // If there's a container attached to this sprite, sort it by depth
        if (useContainerForDepth && sortSpriteContainer){
            //console.log(this.token + ' | -> sorting container:', typeof this.spriteContainer, this.spriteContainer);
            spriteContainer.sort('depth');
            }

    }


    // Update the graphics of this object's individual sprite layers, including position, scale, and visibility
    updateSpriteLayerGraphics ()
    {
        //console.log('MMRPG_Object.updateSpriteLayerGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);

        // ... nothing to do here for yet ... //

    }


    // Update the objects public properties with the current sprite settings for those that might be accessed externally
    updateSpriteProperties ()
    {
        //console.log('MMRPG_Object.updateSpriteProperties() called for ', this.kind, this.token);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        this.x = config.x;
        this.y = config.y;
        this.z = config.z;
        this.width = config.width;
        this.height = config.height;
        this.direction = config.direction;
        this.origin = config.origin;
        this.alpha = config.alpha;
        this.depth = config.depth;
    }

    // Refresh this sprite by updating sprite properties, graphics, and animations
    refreshSprite (clearCache = false)
    {
        //console.log('MMRPG_Object.refreshSprite() called for ', this.kind, this.token);
        if (clearCache){ this.cache = {}; }
        this.updateSpriteProperties();
        this.updateSpriteGraphics();
    }


    // -- SPRITE MANIPULATION -- //

    // Set the alpha property of the object's sprite and update the spriteConfig
    setAlpha (alpha)
    {
        //console.log('MMRPG_Object.setAlpha() called w/ alpha:', alpha);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setAlpha(alpha); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        if (alpha === false){ return this.clearAlpha(); }
        if (alpha === config.alpha){ return; }
        config.alpha = alpha;
        this.alpha = alpha;
        this.refreshSprite();
    }

    // Set the tint property of the object's sprite and update the spriteConfig
    setTint (tint)
    {
        //console.log('MMRPG_Object.setTint() called w/ tint:', tint);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setTint(tint); }); }
        if (tint === false){ return this.clearTint(); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.tint = tint;
        this.tint = tint;
        $sprite.clearTint();
    }

    // Clear the tint property of the object's sprite and update
    clearTint ()
    {
        //console.log('MMRPG_Object.clearTint() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.clearTint(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.tint = null;
        this.tint = null;
        $sprite.clearTint();
    }

    // Set the shadow property for this sprite and update the spriteConfig
    setShadow (enabled, usePerspective = false)
    {
        //console.log('MMRPG_Object.setShadow() called for', this.kind, this.token, 'w/ enabled:', enabled, 'usePerspective:', usePerspective);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setShadow(enabled, usePerspective); }); }
        let $sprite = this.sprite;
        let $shadow = this.spriteShadow;
        let config = this.spriteConfig;
        let styleChanged = config.shadowStyle !== (usePerspective ? 'perspective' : 'drop');
        config.shadow = enabled ? true : false;
        config.shadowStyle = usePerspective ? 'perspective' : 'drop';
        if (enabled && !$shadow){
            this.prepareSpriteShadow();
            } else if (!enabled && $shadow){
            $shadow.destroy();
            this.spriteShadow = null;
            } else if (enabled && $shadow){
            if (styleChanged){
                $shadow.destroy();
                this.spriteShadow = null;
                this.prepareSpriteShadow();
                }
            }
        this.refreshSprite();
    }

    // Set the position of this object's sprite and update the spriteConfig
    setPosition (x, y, z)
    {
        //console.log('MMRPG_Object.setPosition() called w/ x:', x, 'y:', y, 'z:', z);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setPosition(x, y, z); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        x = Graphics.parseRelativePosition(x, config.x);
        y = Graphics.parseRelativePosition(y, config.y);
        z = Graphics.parseRelativePosition(z, config.z);
        if (x === null && y === null && z === null){ return; }
        if (config.x === x && config.y === y && config.z === z){ return; }
        if (this.x === x && this.y === y && this.z === z){ return; }
        let deltaX = x - config.x, deltaY = y - config.y, deltaZ = z - config.z;
        config.x = x;
        config.y = y;
        config.z = z;
        this.x = x;
        this.y = y;
        this.z = z;
        if (deltaX || deltaY || deltaZ){
            this.refreshSprite();
            return;
            }
    }
    setPositionX (x)
    {
        //console.log('MMRPG_Object.setPositionX() called w/ x:', x);
        return this.setPosition(x, null);
    }
    setPositionY (y)
    {
        //console.log('MMRPG_Object.setPositionY() called w/ y:', y);
        return this.setPosition(null, y);
    }
    setPositionZ (z)
    {
        //console.log('MMRPG_Object.setPositionZ() called w/ z:', z);
        return this.setPosition(null, null, z);
    }

    // Return a given sprite's size-related offset position (used when sprites are larger than default)
    // Note: Origin takes care of most position-related calculations when centered (0.5), but because
    // character/object sprites appear in the center-bottom of the frame, we need to manually adjust
    // the offset when they're at aligned left/right or top/bottom instead of middle/center
    getSpriteSizeOffsets ()
    {
        //console.log('MMRPG_Object.getSpriteSizeOffsets() called for', this.kind, this.token);
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;
        let origin = spriteConfig.origin;
        let offsetX = 0, offsetY = 0;

        // If this is a field sprite, we do not deal with size offsets
        if (this.kind === 'field'){
            //console.log('-> sprite is a field, returning [0, 0]');
            return [ offsetX, offsetY ];
            }

        // Check to see if this sprite is already at the default size
        let [ baseWidth, baseHeight ] = objectConfig.baseSize;
        let [ spriteWidth, spriteHeight ] = [ spriteConfig.width, spriteConfig.height ];
        //console.log('-> baseWidth:', baseWidth, 'baseHeight:', baseHeight, 'spriteWidth:', spriteWidth, 'spriteHeight:', spriteHeight);
        if (spriteWidth === baseWidth && spriteHeight === baseHeight){
            //console.log('-> sprite is already at default size, returning [0, 0]');
            return [ offsetX, offsetY ];
            }

        // Otherwise, we need to adjust the values manually based on origin
        let widthDiff = spriteWidth - baseWidth, heightDiff = spriteHeight - baseHeight;
        //console.log('-> widthDiff:', widthDiff, 'heightDiff:', heightDiff);
        if (origin[0] === 0){ offsetX -= (widthDiff / 2); }
        else if (origin[0] === 1){ offsetX += (widthDiff / 2); }
        if (origin[1] === 0){ offsetY -= heightDiff; }
        else if (origin[1] === 1){ offsetY += heightDiff; }
        //console.log('-> returning offsetX:', offsetX, 'offsetY:', offsetY);
        return [ offsetX, offsetY ];

    }

    // Return adjusted X and Y positions based on this sprite's size offset settings
    applySpriteSizeOffsets (x, y)
    {
        //console.log('MMRPG_Object.getAdjustedOffsets() called w/ x:', x, 'y:', y);
        let [ offsetX, offsetY ] = this.getSpriteSizeOffsets();
        return [ x + offsetX, y + offsetY ];
    }

    // Return an adjusted X position based on this sprite's size offset settings
    applySpriteSizeOffsetX (x)
    {
        //console.log('MMRPG_Object.getAdjustedOffsetX() called w/ x:', x);
        let [ offsetX, offsetY ] = this.getSpriteSizeOffsets();
        return x + offsetX;
    }

    // Return an adjusted Y position based on this sprite's size offset settings
    applySpriteSizeOffsetY (y)
    {
        //console.log('MMRPG_Object.getAdjustedOffsetY() called w/ y:', y);
        let [ offsetX, offsetY ] = this.getSpriteSizeOffsets();
        return y + offsetY;
    }

    // Return a given sprite's adjusted x and y position based on it's origin and offset
    getOffsetPosition (x, y)
    {
        //console.log('MMRPG_Object.getOffsetPosition() called');
        let config = this.spriteConfig;
        let origin = config.origin;
        let offsetX = config.offsetX;
        let offsetY = config.offsetY;
        let adjustedX = x, adjustedY = y;

        // x origin is to the left
        if (origin[0] === 0){ adjustedX -= offsetX; }
        // x orgin is centered
        else if (origin[0] === 0.5){ adjustedX -= 0; }
        // x origin it to the right
        else if (origin[0] === 1){ adjustedX += offsetX; }

        // y origin is up top
        if (origin[1] === 0){ adjustedY -= offsetY; }
        // y origin is middle
        else if (origin[1] === 0.5){ adjustedY -= (offsetY / 2); }
        // y origin is at the bottom
        else if (origin[1] === 1){ adjustedY -= 0; }

        return [adjustedX, adjustedY];
    }

    // Return a given sprite's adjusted x position based on it's origin and offset
    getOffsetPositionX (x)
    {
        //console.log('MMRPG_Object.getOffsetPositionX() called');
        let config = this.spriteConfig;
        let origin = config.origin;
        let offsetX = config.offsetX;
        let adjustedX = x;

        // x origin is to the left
        if (origin[0] === 0){ adjustedX -= offsetX; }
        // x orgin is centered
        else if (origin[0] === 0.5){ adjustedX -= 0; }
        // x origin it to the right
        else if (origin[0] === 1){ adjustedX += offsetX; }

        return adjustedX;
    }

    // Return a given sprite's adjusted y position based on it's origin and offset
    getOffsetPositionY (y)
    {
        //console.log('MMRPG_Object.getOffsetPositionY() called');
        let config = this.spriteConfig;
        let origin = config.origin;
        let offsetY = config.offsetY;
        let adjustedY = y;

        // y origin is up top
        if (origin[1] === 0){ adjustedY -= offsetY; }
        // y origin is middle
        else if (origin[1] === 0.5){ adjustedY -= (offsetY / 2); }
        // y origin is at the bottom
        else if (origin[1] === 1){ adjustedY -= 0; }

        return adjustedY;
    }

    // Reverse the effects of offset positionion on a given sprite's x and y position based on it's origin and offset
    reverseOffsetPosition (x, y)
    {
        //console.log('MMRPG_Object.reverseOffsetPosition() called');
        let config = this.spriteConfig;
        let origin = config.origin;
        let offsetX = config.offsetX;
        let offsetY = config.offsetY;
        let adjustedX = x, adjustedY = y;

        // x origin is to the left
        if (origin[0] === 0){ adjustedX += offsetX; }
        // x orgin is centered
        else if (origin[0] === 0.5){ adjustedX += 0; }
        // x origin it to the right
        else if (origin[0] === 1){ adjustedX -= offsetX; }

        // y origin is up top
        if (origin[1] === 0){ adjustedY += offsetY; }
        // y origin is middle
        else if (origin[1] === 0.5){ adjustedY += (offsetY / 2); }
        // y origin is at the bottom
        else if (origin[1] === 1){ adjustedY += 0; }

        return [adjustedX, adjustedY];
    }

    // Get the current frame of this object's sprite, returned as a string if an alias exists, otherwise as an integer
    getFrame (returnAlias = true)
    {
        //console.log('MMRPG_Object.getFrame() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let frame = config.frame;
        if (!returnAlias){ return frame; }
        if (this.spriteFrameAliases[frame]){
            frame = this.spriteFrameAliases[frame];
            } else {
            frame = ('0' + frame).slice(-2);
            }
        return frame;
    }

    // Set the specific frame of this object's sprite to be shown right now and update the spriteConfig
    setFrame (frame)
    {
        //console.log('MMRPG_Object.setFrame() called for ', this.kind, this.token, 'w/ frame:', frame);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setFrame(frame); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        //console.log('-> this.spriteFrames:', this.spriteFrames);
        //console.log('-> this.spriteFrameAliases:', this.spriteFrameAliases);
        if (typeof frame === 'string') {
            if (this.spriteFrames.indexOf(frame) !== -1){
                frame = this.spriteFrames.indexOf(frame);
                } else if (this.spriteFrameAliases.indexOf(frame) !== -1){
                frame = this.spriteFrameAliases.indexOf(frame);
                } else {
                frame = 0;
                }
            }
        if (frame === config.frame){ return; }
        config.frame = frame;
        this.frame = frame;
        this.refreshSprite();
    }

    // Reset the object's sprite frame to the default of it's sheet and update the spriteConfig
    resetFrame ()
    {
        //console.log('MMRPG_Object.resetFrame() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.resetFrame(); }); }
        return this.setFrame(0);
    }

    // Set the scale of this object's sprite and update the spriteConfig
    setDirection (direction, callback = null)
    {
        //console.log('MMRPG_Object.setDirection() called w/ direction:', direction);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setDirection(direction, callback); }); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;

        // First we update the direction on the object and the config unless already done
        if (config.direction === direction && this.direction === direction) { return; }
        config.direction = direction;
        this.direction = direction;
        this.refreshSprite();

        // Now we check to see which sheet goes with this direction, if any, and reload it if needed when ready
        let newSheet = _this.getSpriteSheet('sprite');
        if (!newSheet || (config.sheet === newSheet && this.sheet === newSheet)) { return; }
        if (!scene.textures.exists(newSheet)){
            //console.log('-> sprite texture '+newSheet+' not loaded, deffering sheet change...');
            this.ready = false;
            this.spriteIsLoading = true;
            this.isWorkingOn('setDirection');
            this.loadSpriteTexture(this.data.token, direction, () => {
                //console.log('%c' + '-> sprite texture '+newSheet+' loaded!', 'color: #00FF00');
                config.sheet = newSheet;
                _this.sheet = newSheet;
                _this.refreshSprite(true);
                _this.isDoneWorkingOn('setDirection');
                _this.spriteIsLoading = false;
                _this.ready = true;
                _this.executeQueuedSpriteMethods();
                if (callback){ callback.call(_this); }
                });
            } else {
            //console.log('-> sprite texture '+newSheet+' already loaded, changing sheet now...');
            config.sheet = newSheet;
            this.sheet = newSheet;
            this.refreshSprite();
            }

    }

    // Flip the current direction of the robot sprite and update the spriteConfig
    flipDirection (callback = null)
    {
        //console.log('MMRPG_Object.flipDirection() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.flipDirection(callback); }); }
        let $sprite = this.sprite;
        let direction = this.direction || 'right';
        direction = (direction === 'right') ? 'left' : 'right';
        this.setDirection(direction, callback);
    }

    // Get the current image alt (string) for this object and return it
    getImageAlt ()
    {
        //console.log('MMRPG_Object.getImageAlt() called w/ token:', this.token);
        return this.data.image_alt;
    }

    // Change the image alt (string) for this object and then refresh the graphics when we're done updating variables
    setImageAlt (alt = null, callback = null)
    {
        //console.log('MMRPG_Object.setImageAlt() called w/ token:', this.token, 'alt:', alt);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setImageAlt(alt, callback); }); }
        let scene = this.scene;
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;
        let imageAlt = typeof alt === 'string' && alt.length > 0 ? alt : objectConfig.baseAltSheet;
        this.data.image_alt = imageAlt;
        objectConfig.currentAltSheet = imageAlt;
        objectConfig.currentAltSheetIsBase = objectConfig.currentAltSheet === objectConfig.baseAltSheet;
        this.preloadSpriteSheets();
        let newSheet = _this.getSpriteSheet('sprite', null, imageAlt);
        if (!newSheet || spriteConfig.sheet === newSheet) {
            if (callback){ callback.call(_this); }
            return;
            }
        spriteConfig.sheet = newSheet;
        //console.log(this.token + ' | -> imageAlt:', imageAlt, 'newSheet:', newSheet);
        //console.log(this.token + ' | checking if newSheet texture exists...');
        if (!scene.textures.exists(newSheet)){
            //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' not loaded, deffering sheet refreshing...', 'color: orange;');
            this.ready = false;
            this.spriteIsLoading = true;
            this.isWorkingOn('setImageAlt');
            this.loadSpriteTexture(() => {
                //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
                _this.createSpriteAnimations();
                _this.refreshSprite(true);
                _this.isDoneWorkingOn('setImageAlt');
                _this.spriteIsLoading = false;
                _this.ready = true;
                this.executeQueuedSpriteMethods();
                if (callback){ callback.call(_this); }
                });
            } else {
            //console.log('%c' + this.token + ' | -> sprite texture already '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
            _this.createSpriteAnimations();
            _this.refreshSprite();
            if (callback){ callback.call(_this); }
            }
    }

    // Reset an image alt (string) back to its base value and then refresh the graphics when we're done updating variables
    resetImageAlt (callback = null)
    {
        //console.log('MMRPG_Object.resetImageAlt() called w/ callback:', typeof callback);
        return this.setImageAlt(this.objectConfig.baseAltSheet, callback);
    }

    // Get the current image sheet (numeric) for this object and return it
    getImageSheet ()
    {
        //console.log('MMRPG_Object.getImageSheet() called w/ token:', this.token);
        return this.data.image_sheet;
    }

    // Change the image sheet (numeric) for this object and then refresh the graphics when we're done updating variables
    setImageSheet (sheet = null, callback = null)
    {
        //console.log('MMRPG_Object.setImageSheet() called w/ token:', this.token, 'sheet:', sheet);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setImageSheet(sheet, callback); }); }
        let scene = this.scene;
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;
        let imageSheet = typeof sheet === 'number' && sheet > 0 ? sheet : objectConfig.baseAltSheet;
        this.data.image_sheet = imageSheet;
        objectConfig.currentAltSheet = imageSheet;
        objectConfig.currentAltSheetIsBase = objectConfig.currentAltSheet === objectConfig.baseAltSheet;
        this.preloadSpriteSheets();
        let newSheet = _this.getSpriteSheet('sprite', null, imageSheet);
        if (!newSheet || spriteConfig.sheet === newSheet) {
            if (callback){ callback.call(_this); }
            return;
            }
        spriteConfig.sheet = newSheet;
        //console.log(this.token + ' | -> imageSheet:', imageSheet, 'newSheet:', newSheet);
        //console.log(this.token + ' | checking if newSheet texture exists...');
        if (!scene.textures.exists(newSheet)){
            //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' not loaded, deffering sheet refreshing...', 'color: orange;');
            this.isWorkingOn('setImageSheet');
            this.loadSpriteTexture(() => {
                //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
                _this.createSpriteAnimations();
                _this.refreshSprite();
                _this.isDoneWorkingOn('setImageSheet');
                if (callback){ callback.call(_this); }
                });
            } else {
            //console.log('%c' + this.token + ' | -> sprite texture already '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
            _this.createSpriteAnimations();
            _this.refreshSprite();
            if (callback){ callback.call(_this); }
            }
    }

    // Reset an image sheet (numeric) back to its base value and then refresh the graphics when we're done updating variables
    resetImageSheet (callback = null)
    {
        //console.log('MMRPG_Object.resetImageSheet() called w/ callback:', typeof callback);
        return this.setImageSheet(this.objectConfig.baseAltSheet, callback);
    }

    // Set the scale of this object's images and then redraw everything at the new size
    setScale (scale)
    {
        //console.log('MMRPG_Object.setScale() called for', this.token, 'w/ scale:', scale);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setScale(scale); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        if (scale === false){ return this.resetScale(); }
        if (config.scale === scale){ return; }
        config.scale = scale;
        this.scale = scale;
        this.refreshSprite();
    }

    // Reset the scale back to the default of 1 and then redraw everything at the new size
    resetScale ()
    {
        //console.log('MMRPG_Object.resetScale() called');
        return this.setScale(1);
    }

    // Set the origin of this object's images and then redraw everything at the new origin
    setOrigin (originX, originY)
    {
        //console.log('MMRPG_Object.setOrigin() called for', this.token, 'w/ originX:', originX, 'originY:', originY);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setOrigin(originX, originY); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        if (originX === null && originY === null){ return; }
        if (typeof originX !== 'number'){ originX = config.origin[0]; }
        if (typeof originY !== 'number'){ originY = config.origin[1]; }
        if (config.origin[0] === originX && config.origin[1] === originY){ return; }
        config.origin = [originX, originY];
        this.origin = [originX, originY];
        this.refreshSprite();
    }

    // Reset the origin back to the default of [0.5, 0.5] and then redraw everything at the new origin
    resetOrigin ()
    {
        //console.log('MMRPG_Object.resetOrigin() called');
        return this.setOrigin(0.5, 0.5);
    }

    // Set the depth of this object's images (and thus any sub images) and then redraw everything at the new depth
    setDepth (depth)
    {
        //console.log('MMRPG_Object.setDepth() called for', this.token, 'w/ depth:', depth);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setDepth(depth); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        if (config.depth === depth){ return; }
        config.depth = depth;
        this.depth = depth;
        this.refreshSprite();
    }

    // Set a sprite configuration value for this object and then redraw everything after
    setSpriteConfig (key, value)
    {
        //console.log('MMRPG_Object.setSpriteConfig() called for', this.token, 'w/ key:', key, 'value:', value);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setSpriteConfig(key, value); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        if (config[key] === value){ return; }
        config[key] = value;
        this.refreshSprite();
    }

    // Set (or get) the sprite config value for useContainerForDepth to the boolean value provided
    useContainerForDepth (bool)
    {
        //console.log('MMRPG_Object.useContainerForDepth() called for', this.token, 'w/ bool:', bool);
        let _this = this;
        let config = this.spriteConfig;
        // if no args were provided, assume this is a GET and return the current value
        if (typeof bool === 'undefined'){ return config.useContainerForDepth; }
        // otherwise we assume this is a SET and update the value
        if (!this.sprite) { return; }
        if (!this.spriteContainer){ return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.useContainerForDepth(bool); }); }
        if (config.useContainerForDepth === bool){ return; }
        config.useContainerForDepth = bool;
        this.refreshSprite();
    }

    // Set (or get) the sprite config value for useAnchorForPosition to the boolean value provided
    useAnchorForPosition (bool)
    {
        //console.log('MMRPG_Object.useAnchorForPosition() called for', this.token, 'w/ bool:', bool);
        if (!this.sprite) { return; }
        let _this = this;
        let config = this.spriteConfig;
        // if no args were provided, assume this is a GET and return the current value
        if (typeof bool === 'undefined'){ return config.useAnchorForPosition; }
        // otherwise we assume this is a SET and update the value
        if (config.useAnchorForPosition === bool){ return; }
        config.useAnchorForPosition = bool;
        this.refreshSprite();
    }

    // Get or set the anchored flag on this sprite and update (assumes useAnchorForPosition is true)
    isAnchored (bool)
    {
        //console.log('MMRPG_Object.setAnchored() called w/ bool:', bool);
        if (!this.sprite) { return; }
        let _this = this;
        let config = this.spriteConfig;
        // if no args were provided, assume this is a GET and return the current value
        if (typeof bool === 'undefined'){ return config.useAnchorForPosition && config.anchored; }
        // otherwise we assume this is a SET and update the value
        let $sprite = this.sprite;
        let anchored = config.useAnchorForPosition && bool ? true : false;
        if (config.anchored === anchored){ return; }
        config.anchored = anchored;
        this.refreshSprite();
    }


    // -- SPRITE LAYER HANDLING -- //

    // Return the config object for a given layer
    getLayerConfig (layer)
    {
        //console.log('MMRPG_Object.getLayerConfig() called for ', this.kind, this.token, '\nw/ layer:', layer);
        let layersConfig = this.spriteLayers;
        let layerConfig = layersConfig[layer] || {};
        return layerConfig;
    }

    // Update the properties of a given sprite layer object
    setLayerConfig (layer, props)
    {
        //console.log('MMRPG_Object.setLayerConfig() called for ', this.kind, this.token, '\nw/ layer:', layer, 'props:', props);
        let layersConfig = this.spriteLayers;
        let layerConfig = layersConfig[layer] || {};
        for (let key in props){
            layerConfig[key] = props[key];
            }
        layersConfig[layer] = layerConfig;
        this.refreshSprite();
    }

    // Update the offset values for a given layer of this sprite
    setLayerOffset (layer, x, y, z)
    {
        //console.log('MMRPG_Object.setLayerOffset() called for ', this.kind, this.token, '\nw/ layer:', layer, 'x:', x, 'y:', y);
        let layersConfig = this.spriteLayers;
        let layerConfig = layersConfig[layer] || {};
        let offset = layerConfig.offset || {x: 0, y: 0, z: 0};
        x = typeof x === 'number' || typeof x === 'string' ? Graphics.parseRelativePosition(x, offset.x) : offset.x;
        y = typeof y === 'number' || typeof y === 'string'  ? Graphics.parseRelativePosition(y, offset.y) : offset.y;
        z = typeof z === 'number' || typeof z === 'string'  ? Graphics.parseRelativePosition(z, offset.z) : offset.z;
        if (offset.x === x && offset.y === y && offset.z === z){ return; }
        layerConfig.offset = {x: x, y: y, z: z};
        layersConfig[layer] = layerConfig;
        this.refreshSprite();
    }
    setLayerOffsetX (layer, x) { this.setLayerOffset(layer, x, null, null); }
    setLayerOffsetY (layer, y) { this.setLayerOffset(layer, null, y, null); }
    setLayerOffsetZ (layer, z) { this.setLayerOffset(layer, null, null, z); }

    // Return the offset values for a given later of this sprite
    getLayerOffset (layer)
    {
        //console.log('MMRPG_Object.getLayerOffset() called for ', this.kind, this.token, '\nw/ layer:', layer);
        let layersConfig = this.spriteLayers;
        let layerConfig = layersConfig[layer] || {};
        let offset = layerConfig.offset || {x: 0, y: 0, z: 0};
        return Object.assign({}, offset);
    }
    getLayerOffsetX (layer) { return this.getLayerOffset(layer).x; }
    getLayerOffsetY (layer) { return this.getLayerOffset(layer).y; }
    getLayerOffsetZ (layer) { return this.getLayerOffset(layer).z; }


    // -- SPRITE ANIMATION -- //

    // Play a named animation on this sprite if it exists
    playAnim (anim)
    {
        //console.log('MMRPG_Object.playAnim() called for ', this.kind, this.token, '\nw/ anim:', anim);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.playAnim(anim); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let $shadow = this.spriteShadow;
        let config = this.spriteConfig;
        let animKey = this.getSpriteAnim('sprite', anim);
        if (!animKey){ console.warn('MMRPG_Object.playAnim() -> animation "'+anim+'" not found in SPRITES index for ', this.token); return; }
        if (!scene.anims.exists(animKey)){ console.warn('MMRPG_Object.playAnim() -> animation "'+animKey+'" not found in scene.anims for ', this.token); return; }
        let animData = scene.anims.get(animKey);
        //console.log('-> trying to $sprite.play(', animKey, ') w/ animData:', animData);
        $sprite.play(animKey);
        //console.log('-> did it play?');
    }

    // Start the idle animation for this sprite given all we know about it
    startIdleAnimation (bounce = true, emote = true)
    {
        //console.log('MMRPG_Object.startIdleAnimation() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.kind !== 'player' && this.kind !== 'robot'){ return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.startIdleAnimation(bounce, emote); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let transforms = config.transforms;
        let spritesIndex = this.SPRITES.index;
        this.stopMoving();
        this.stopIdleAnimation();
        const startBouncing = function(){
            let shiftY = config.scale * 1;
            let speedMod = this.data.baseStats.dividers.speed;
            let idleTrans = transforms.get('idle');
            let idleBounceTween = scene.tweens.addCounter({
                from: 0,
                to: shiftY,
                ease: 'Stepped',
                delay: Math.ceil(speedMod * 300),
                repeatDelay: 100 + Math.ceil(speedMod * 200),
                duration: 100 + Math.ceil(speedMod * 200),
                repeat: -1,
                yoyo: true,
                onUpdate: function(tween){
                    idleTrans.y = -1 * tween.getValue();
                    //console.log(_this.token + ' | -> idleBounceTween transforms y += ', idleTrans.y);
                    _this.refreshSprite();
                    }
                });
            $sprite.subTweens.idleBounceTween = idleBounceTween;
            this.isAnimating = true;
            };
        const startEmoting = function() {
            if (!this.hasSpriteAnim('sprite', 'idle')){ return; }
            this.playAnim('idle');
            this.isAnimating = true;
            };
        if (bounce) {
            this.isWorkingOn('startIdleAnimation/bounce');
            startBouncing.call(_this);
        }
        if (emote) {
            this.isWorkingOn('startIdleAnimation/emote');
            startEmoting.call(_this);
        }
    }

    // Stop the idle animation currently playing on this sprite if one exists
    stopIdleAnimation ()
    {
        //console.log('MMRPG_Object.stopIdleAnimation() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopIdleAnimation(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let transforms = config.transforms;
        // Stop the running any keyframe animations
        $sprite.stop();
        // Stop the idle bounce tween if running and remove the transform
        if ($sprite.subTweens.idleBounceTween){
            $sprite.subTweens.idleBounceTween.stop();
            delete $sprite.subTweens.idleBounceTween;
            }
        transforms.remove('idle');
        // Refresh the sprite now that we're done
        this.refreshSprite();
        this.isDoneWorkingOn('startIdleAnimation/bounce');
        this.isDoneWorkingOn('startIdleAnimation/emote');
        this.isAnimating = false;
    }

    // Start the slide animation for this sprite and move it laterally across the screen given it's next direction
    // If distance is not set (X-axis), the sprite will travel proportionally to its energy stat or equivalent
    // If elevation is not set (Y-axis), the sprite will travel horizontally without any vertical movement
    // If duration is not set, the sprite will advance proportionally to its speed stat or equivalent
    slideSpriteForward (callback, distance, elevation, duration)
    {
        //console.log('MMRPG_Object.slideToDestination() called for ', this.kind, this.token, '\nw/ distance:', distance, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.slideToDestination(distance, duration, callback); }); }
        if (this.kind === 'player'){ return this.runSpriteForward(callback, distance, elevation, duration); }
        else if (this.kind !== 'robot'){ return; }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let direction = this.direction;
        let useAnchorForPosition = this.useAnchorForPosition();

        // Stop any idle animations or movement that might be playing
        this.stopIdleAnimation();
        this.stopMoving();

        // Calculate the distance and duration if not already set
        let baseStats = this.data.baseStats;
        let speedMod = baseStats.multipliers.speed;
        let speedMod2 = baseStats.dividers.speed;
        let distanceMax = (config.hitbox[0] * config.scale * 2) + Math.ceil(config.hitbox[0] * config.scale * 2 * speedMod);
        let elevationMax = 0;
        let durationMax = 1000 + (1000 * speedMod2);
        let slideDistance = distance || distanceMax;
        let slideElevation = elevation || elevationMax;
        let slideDuration = duration || Math.ceil((slideDistance / distanceMax) * durationMax);
        //console.log(this.token+' | -> baseStats = ', baseStats);
        //console.log(this.token+' | -> distance:', distance, 'distanceMax:', distanceMax, 'slideDistance:', slideDistance);
        //console.log(this.token+' | -> elevation:', elevation, 'elevationMax:', elevationMax, 'slideElevation:', slideElevation);
        //console.log(this.token+' | -> duration:', duration, 'durationMax:', durationMax, 'slideDuration:', slideDuration);

        // Calcuylate the new X and Y positions for the sprite to slide to
        let newX = slideDistance ? ((direction === 'left' ? '-=' : '+=') + slideDistance) : null;
        let newY = slideElevation ? ((slideElevation > 0 ? '-=' : '+=') + slideElevation) : null;
        //console.log(this.token+' | -> newX = ', newX);
        //console.log(this.token+' | -> newY = ', newY);

        // Predefine the move configuration for the animation
        let moveConfig = {
            easing: 'Sine.easeOut',
            onUpdate: function($sprite, tween){
                if (tween.progress >= 0.8
                    && _this.frame !== 'defend'){
                    _this.setFrame('defend');
                    }
                }
            };

        // Kill any existing tweens for the run animation
        const killTweens = function(){
            if ($sprite.subTweens.slideMovement){
                $sprite.subTweens.slideMovement.stop();
                delete $sprite.subTweens.slideMovement;
                }
            };

        // Predefine the slide callback to run when everything is over
        let onSlideComplete = function(){
            killTweens();
            if (!callback){ return; }
            return callback.call(_this, $sprite);
            };

        // Remove any existing slide timers or tweens and then create a new one
        // to facilitate the windup animation when sliding the character forward
        killTweens();
        this.resetFrame();
        this.isMoving = true;
        this.isAnimating = true;

        // Perform the animation and movement to make it look like they're sliding
        this.setFrame('defend');
        this.isWorkingOn('slideSpriteForward');
        let slideMovementTimer = this.delayedCall(100, function(){
            this.setFrame('slide');
            if (useAnchorForPosition){ _this.isAnchored(false); }
            _this.moveToPosition(newX, newY, slideDuration, function(){
                if (useAnchorForPosition){ _this.isAnchored(true); }
                _this.delayedCall(100, function(){
                    this.setFrame('defend');
                    _this.delayedCall(200, function(){
                        _this.resetFrame();
                        _this.isMoving = false;
                        _this.isAnimating = false;
                        _this.isDoneWorkingOn('slideSpriteForward');
                        onSlideComplete.call(_this, $sprite);
                        });
                    });
                }, moveConfig);
            });
        $sprite.subTimers.slideMovement = slideMovementTimer;

        // Return now that the slide has been started
        return;

    }

    // Start the run animation for this sprite and move it laterally across the screen given it's next direction
    // If distance is not set (X-axis), the sprite will travel proportionally to its energy stat or equivalent
    // If elevation is not set (Y-axis), the sprite will travel horizontally without any vertical movement
    // If duration is not set, the sprite will advance proportionally to its speed stat or equivalent
    runSpriteForward (callback, distance, elevation, duration, moveConfig)
    {
        //console.log('MMRPG_Object.runToDestination() called for ', this.kind, this.token, '\nw/ distance:', distance, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.runToDestination(distance, duration, callback); }); }
        if (this.kind === 'robot'){ return this.slideSpriteForward(callback, distance, elevation, duration); }
        else if (this.kind !== 'player'){ return; }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let direction = this.direction;
        let useAnchorForPosition = this.useAnchorForPosition();

        // Stop any idle animations or movement that might be playing
        this.stopIdleAnimation();
        this.stopMoving();

        // Calculate the distance and duration if not already set
        let baseStats = this.data.baseStats;
        let speedMod = baseStats.multipliers.speed;
        let speedMod2 = baseStats.dividers.speed;
        let distanceMax = (config.hitbox[0] * config.scale * 2) + Math.ceil(config.hitbox[0] * config.scale * 2 * speedMod);
        let elevationMax = 0;
        let durationMax = 1000 + (1000 * speedMod2);
        let runDistance = distance || distanceMax;
        let runElevation = elevation || elevationMax;
        let runDuration = duration || Math.ceil((runDistance / distanceMax) * durationMax);
        //console.log(this.token+' | -> baseStats = ', baseStats);
        //console.log(this.token+' | -> distance:', distance, 'distanceMax:', distanceMax, 'runDistance:', runDistance);
        //console.log(this.token+' | -> elevation:', elevation, 'elevationMax:', elevationMax, 'runElevation:', runElevation);
        //console.log(this.token+' | -> duration:', duration, 'durationMax:', durationMax, 'runDuration:', runDuration);

        // Calcuylate the new X and Y positions for the sprite to run to
        let newX = runDistance ? ((direction === 'left' ? '-=' : '+=') + runDistance) : null;
        let newY = runElevation ? ((runElevation > 0 ? '-=' : '+=') + runElevation) : null;
        //console.log(this.token+' | -> newX = ', newX);
        //console.log(this.token+' | -> newY = ', newY);

        // Predefine the move configuration for the animation
        moveConfig = typeof moveConfig === 'object' ? moveConfig : {};
        moveConfig.easing = moveConfig.easing || 'Sine.easeOut';

        // Kill any existing tweens for the run animation
        const killTweens = function(){
            if ($sprite.subTweens.runBounceTween){
                $sprite.subTweens.runBounceTween.stop();
                delete $sprite.subTweens.runBounceTween;
                }
            if ($sprite.subTimers.runMovement){
                $sprite.subTimers.runMovement.remove();
                delete $sprite.subTimers.runMovement;
                }
            };

        // Remove any existing run timers or tweens and then create a new one
        // to facilitate the windup animation when moving the character forward
        killTweens();
        this.resetFrame();
        this.isMoving = true;
        this.isAnimating = true;

        // Start the running bounce tween to make it look like they're properly stepping
        let shiftY = config.scale * 1;
        let transforms = config.transforms;
        let bounceTrans = transforms.get('bounce');
        //console.log(this.token+' | -> transforms.data:', transforms.data, 'bounceTrans:', bounceTrans, 'shiftY:', shiftY);
        let runBounceTween = scene.tweens.addCounter({
            from: 0,
            to: 1,
            ease: 'Linear',
            delay: 100,
            duration: 800,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                let frame = $sprite.frame.name;
                bounceTrans.y = frame !== 8 ? (-1 * shiftY) : 0;
                //console.log(this.token+' | -> onUpdate(frame:', frame, ') transforms y += ', bounceTrans.y);
                _this.refreshSprite();
                },
            });
        $sprite.subTweens.runBounceTween = runBounceTween;

        // Predefine the run callback to run when everything is over
        let onRunComplete = function(){
            killTweens();
            transforms.remove('bounce');
            if (callback){ callback.call(_this, $sprite); }
            };

        // Perform the animation and movement to make it look like they're running
        this.setFrame('command');
        this.isWorkingOn('runSpriteForward');
        let runMovementTimer = this.delayedCall(100, function(){
            _this.playAnim('run');
            if (useAnchorForPosition){ _this.isAnchored(false); }
            _this.moveToPosition(newX, newY, runDuration, function(){
                if (useAnchorForPosition){ _this.isAnchored(true); }
                _this.delayedCall(100, function(){
                    $sprite.stop();
                    this.setFrame('base2');
                    _this.delayedCall(200, function(){
                        _this.resetFrame();
                        _this.isMoving = false;
                        _this.isAnimating = false;
                        _this.isDoneWorkingOn('runSpriteForward');
                        onRunComplete.call(_this, $sprite);
                        });
                    });
                }, moveConfig);
            });
        $sprite.subTimers.runMovement = runMovementTimer;

        // Return now that the run has been started
        return;

    }

    // Move this sprite to a new position on the canvas and then execute the callback if provided
    moveToPosition (x = null, y = null, duration = 0, callback = null, moveConfig = {})
    {
        //console.log('MMRPG_Object.moveToPosition() called for ', this.kind, this.token, '\nw/ x:', x, 'y:', y, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.moveToPosition(x, y, duration, callback, moveConfig); }); }
        if (x && !y){ return this.moveToPositionX(x, duration, callback, moveConfig); }
        if (!x && y){ return this.moveToPositionY(y, duration, callback, moveConfig); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;

        // If the sprite is already moving, stop it and move it to the new position instantly
        this.stopMoving();

        // Predefine some defaults for the move config
        moveConfig = typeof moveConfig === 'object' ? moveConfig : {};
        moveConfig.easing  = moveConfig.easing || 'Linear';
        moveConfig.onUpdate = moveConfig.onUpdate || null;

        // Parse any relative string values from the x and y to get rel values
        //console.log('-> provided sprite x:', x, 'y:', y, '\nvs. config x:', config.x, 'y:', config.y);
        let finalX = Math.round(Graphics.parseRelativePosition(x, config.x));
        let finalY = Math.round(Graphics.parseRelativePosition(y, config.y));
        let fromX = config.x, toX = finalX;
        let fromY = config.y, toY = finalY;
        //console.log('-> moving sprite fromX:', fromX, 'fromY:', fromY, 'toX:', toX, 'toY:', toY);

        // If the duration was not set or was zero, move the sprite instantly
        if (!duration) {
            //console.log(_this.token + ' | moveToPosition() \n-> moving sprite instantly to finalX:', finalX, 'finalY:', finalY);
            config.x = finalX;
            config.y = finalY;
            _this.x = finalX;
            _this.y = finalY;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to the new position
        //console.log(_this.token + ' | moveToPosition() \n-> tweening sprite to x:', x, 'y:', y, 'modX:', modX, 'modY:', modY, 'finalX:', finalX, 'finalY:', finalY);
        this.isWorkingOn('moveToPosition');
        let moveTween = scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                //console.log(_this.token + ' | moveToPosition() \n-> sprite tween to x:', toX, 'y:', toY, 'in progress... ');
                let progress = moveTween.getValue();
                //console.log(_this.token + ' | moveToPosition() \n-> progress:', progress);
                let currX = Math.ceil(Phaser.Math.Linear(fromX, toX, progress / 100));
                let currY = Math.ceil(Phaser.Math.Linear(fromY, toY, progress / 100));
                config.x = currX;
                config.y = currY;
                _this.x = currX;
                _this.y = currY;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => {
                //console.log(_this.token + ' | moveToPosition() \n-> sprite tween to x:', x, 'y:', y, 'completed!');
                config.x = finalX;
                config.y = finalY;
                _this.x = finalX;
                _this.y = finalY;
                _this.isMoving = false;
                _this.refreshSprite();
                _this.isDoneWorkingOn('moveToPosition');
                if (callback){ callback.call(_this, $sprite); }
                },
            });
        $sprite.subTweens.moveTween = moveTween;

    }

    // Move the sprite a a new X position on the canvas and then execute the callback if provided (do not touch the Y)
    moveToPositionX (x = null, duration = 0, callback = null, moveConfig = {})
    {
        //console.log('MMRPG_Object.moveToPositionX() called for ', this.kind, this.token, '\nw/ x:', x, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.moveToPositionX(x, duration, callback, moveConfig); }); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;

        // If the sprite is already moving, stop it and move it to the new position instantly
        this.stopMoving();

        // Predefine some defaults for the move config
        moveConfig.easing  = moveConfig.easing || 'Linear';
        moveConfig.onUpdate = moveConfig.onUpdate || null;

        // Parse any relative string values from the x and y to get rel values
        let finalX = Math.round(Graphics.parseRelativePosition(x, config.x));
        let fromX = config.x, toX = finalX;

        // If the duration was not set or was zero, move the sprite instantly
        if (!duration) {
            //console.log(_this.token + ' | moveToPositionX() \n-> moving sprite instantly to finalX:', finalX);
            config.x = finalX;
            _this.x = finalX;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to the new position
        //console.log(_this.token + ' | moveToPositionX() \n-> tweening sprite to x:', x, 'modX:', modX, 'finalX:', finalX);
        this.isWorkingOn('moveToPositionX');
        let moveTween = scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                //console.log(_this.token + ' | moveToPositionX() \n-> sprite tween to x:', x, 'in progress...');
                let progress = moveTween.getValue();
                //console.log(_this.token + ' | moveToPositionX() \n-> progress:', progress);
                let currX = Math.ceil(Phaser.Math.Linear(fromX, toX, progress / 100));
                config.x = currX;
                _this.x = currX;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => {
                //console.log(_this.token + ' | moveToPositionX() \n-> sprite tween to x:', x, 'completed!');
                config.x = finalX;
                _this.x = finalX;
                _this.isMoving = false;
                _this.refreshSprite();
                _this.isDoneWorkingOn('moveToPositionX');
                if (callback){ callback.call(_this, $sprite); }
                },
            });
        $sprite.subTweens.moveTween = moveTween;

    }

    // Move the sprite a a new Y position on the canvas and then execute the callback if provided (do not touch the X)
    moveToPositionY (y = null, duration = 0, callback = null, moveConfig = {})
    {
        //console.log('MMRPG_Object.moveToPositionY() called for ', this.kind, this.token, '\nw/ y:', y, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.moveToPositionY(y, duration, callback, moveConfig); }); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;

        // If the sprite is already moving, stop it and move it to the new position
        this.stopMoving();

        // Predefine some defaults for the move config
        moveConfig.easing  = moveConfig.easing || 'Linear';
        moveConfig.onUpdate = moveConfig.onUpdate || null;

        // Parse any relative string values from the x and y to get rel values
        let finalY = Math.round(Graphics.parseRelativePosition(y, config.y));
        let fromY = config.y, toY = finalY;

        // If the duration was not set or was zero, move the sprite instantly
        if (!duration) {
            //console.log(_this.token + ' | moveToPositionY() \n-> moving sprite instantly to finalY:', finalY);
            config.y = finalY;
            _this.y = finalY;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to the new position
        //console.log(_this.token + ' | moveToPositionY() \n-> tweening sprite to y:', y, 'modY:', modY, 'finalY:', finalY);
        this.isWorkingOn('moveToPositionY');
        let moveTween = scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                //console.log(_this.token + ' | moveToPositionY() \n-> sprite tween to y:', y, 'in progress...');
                let progress = moveTween.getValue();
                //console.log(_this.token + ' | moveToPositionY() \n-> progress:', progress);
                let currY = Math.ceil(Phaser.Math.Linear(fromY, toY, progress / 100));
                config.y = currY;
                _this.y = currY;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => {
                //console.log(_this.token + ' | moveToPositionY() \n-> sprite tween to y:', y, 'completed!');
                config.y = finalY;
                _this.y = finalY;
                _this.isMoving = false;
                _this.refreshSprite();
                _this.isDoneWorkingOn('moveToPositionY');
                if (callback){ callback.call(_this, $sprite); }
                },
            });
        $sprite.subTweens.moveTween = moveTween;

    }

    // Show the damage frame, shake animation, and amount inflicted on this object then execute a callback
    showDamage (amount, callback, damageConfig)
    {
        //console.log('MMRPG_Object.showDamage() called for ', this.kind, this.token, '\nw/ amount:', amount, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.showDamage(amount, strength, callback); }); }
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let onComplete = callback ? (callback.onComplete || callback) : null;
        let onUpdate = callback ? (callback.onUpdate || null) : null;
        let kind = this.kind;
        let xkind = this.xkind;
        let token = this.token;
        let direction = this.direction;

        // Stop any idle animations or movement that might be playing
        this.stopMoving();
        this.stopIdleAnimation();

        // Immediately set the frame to the damage frame before doing anything else
        this.setFrame('damage');

        // Create the damage text and add it to the scene using calculated settings
        damageConfig = damageConfig || {};
        damageConfig.color = damageConfig.color || '#ffffff';
        var text = '-' + amount.toString();
        var size = 8;
        var padding = 5;
        var width = ((12 * text.length) || 48) + (padding * 2);
        var height = (12) + (padding * 2);
        var x = config.x, y = config.y;
        x -= Math.round(width / 2);
        y -= ((config.hitbox[1] * config.scale) / 2) + (5 * config.scale);
        let $damage = Strings.addFormattedText(scene, x, y, text, {
            size: size,
            width: width,
            height: height,
            border: false,
            color: damageConfig.color,
            depth: _this.depth + 100,
            padding: 5,
            });

        // Create the damage animation to run on it's own and then execute the callback
        //console.log('-> about to animate the damage text with a damageTween');
        let damageTween = scene.tweens.addCounter({
            from: 100,
            to: 0,
            ease: 'Sine.easeOut',
            delay: 100,
            duration: 1000,
            onUpdate: function (tween) {
                //console.log('damageTween:', damageTween.getValue());
                let alpha = damageTween.getValue() / 100;
                $damage.setAlpha(alpha);
                $damage.setPosition(null, '-=2');
                if (onUpdate){ onUpdate.call(_this, tween); }
                },
            onComplete: function () {
                //console.log('damageTween complete for the damage text');
                $damage.destroy();
                }
            });

        // Define the callback to run after showing the damage
        let actionQueue = 0;
        this.isWorkingOn('showDamage');
        let showDamageCallback = function(){
            if (actionQueue > 0){ return; }
            //console.log('-> showDamageCallback w/ actionQueue:', actionQueue);
            _this.isDoneWorkingOn('showDamage');
            _this.stopFlashing();
            _this.stopFading();
            _this.stopShaking();
            if (onComplete){ onComplete.call(_this); }
            };

        // We know which animations we'll be running so we can preset the queue value
        actionQueue = 2;

        // Create the flash animation to run in sequence w/ its own callback
        //console.log('-> about to start flash, actionQueue:', actionQueue);
        this.flashSprite(2, function(){
            //console.log('-> flashSprite callback w/ actionQueue:', actionQueue);
            actionQueue--;
            showDamageCallback();
            });

        // Create the shake animation to run in sequence w/ its own callback
        //console.log('-> about to start shake, actionQueue:', actionQueue);
        let shakeStrength = 1;
        this.shakeSprite(shakeStrength, 2, function(){
            //console.log('-> shakeSprite callback w/ actionQueue:', actionQueue);
            actionQueue--;
            showDamageCallback();
            });

    }

    // Flash the sprite by changing its tint back and forth a set amount of times
    flashSprite (repeat = 1, callback = null, duration = 100)
    {
        //console.log('MMRPG_Object.flashSprite() called for ', this.kind, this.token, '\nw/ repeat:', repeat, 'duration:', duration);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading) { return this.whenReady(function() { _this.flashSprite(repeat, callback, duration); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let onComplete = callback ? (callback.onComplete || callback) : null;
        let onUpdate = callback ? (callback.onUpdate || null) : null;
        let flashLoops = repeat || 1;
        let flashDuration = duration || 100;
        let flashDuration2 = Math.floor(duration / 2); // because the yoyo effect
        const killTweens = function() {
            if ($sprite.subTweens.flashTween) {
                $sprite.subTweens.flashTween.stop();
                delete $sprite.subTweens.flashTween;
                }
            };
        killTweens();
        this.isAnimating = true;
        this.isWorkingOn('flashSprite');
        $sprite.setAlpha(1.0);
        $sprite.fx = $sprite.preFX.addColorMatrix();
        $sprite.fx.brightness(1.0);
        let flashTween = scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: flashDuration2,
            loop: flashLoops,
            ease: 'Linear',
            yoyo: true,
            onUpdate: (tween) => {
                let progress = tween.getValue() / 100;
                $sprite.alpha = 1.0 - 0.5 * progress;
                $sprite.fx.brightness(1.0 + 5.0 * progress);
                if (onUpdate) { onUpdate.call(_this, tween); }
                },
            onComplete: () => {
                //console.log('-> onComplete for flashTween');
                $sprite.alpha = 1.0;
                $sprite.fx.brightness(1.0);
                this.isAnimating = false;
                this.isDoneWorkingOn('flashSprite');
                if (onComplete) { onComplete.call(_this); }
                }
            });
        $sprite.subTweens.flashTween = flashTween;
    }

    // Shakes the sprite back and forth once and then executes a callback
    shakeSprite (strength = 1, repeat = 1, callback = null, duration = 100)
    {
        //console.log('MMRPG_Object.shakeSprite() called for ', this.kind, this.token, '\nw/ strength:', strength, 'repeat:', repeat, 'callback:', typeof callback, 'duration:', duration);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.shakeSprite(strength, repeat, duration, callback); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let onComplete = callback ? (callback.onComplete || callback) : null;
        let onUpdate = callback ? (callback.onUpdate || null) : null;
        let shakeVal = (strength || 1) * 2;
        let shakeOffset = shakeVal * config.scale; // Combined shake offset for both X and Y
        let shakeDuration = duration || 100;
        let shakeEase = 'Sine.easeInOut';
        let shakeRepeat = repeat || 1;
        let shakeYoyo = true;
        const killTweens = function(){
            if ($sprite.subTweens.shakeTween){
                $sprite.subTweens.shakeTween.stop();
                delete $sprite.subTweens.shakeTween;
                }
            };
        killTweens();
        this.isAnimating = true;
        this.isWorkingOn('shakeSprite');
        // Create a single counter for shaking both X and Y
        let xMod = 1, yMod = -1;
        let transforms = config.transforms;
        let shakeTrans = transforms.get('shake');
        //console.log('-> transforms.data:', transforms.data, 'shakeTrans:', shakeTrans);
        let shakeTween = this.scene.tweens.addCounter({
            from: 0,
            to: shakeOffset,
            duration: shakeDuration,
            ease: shakeEase,
            repeat: shakeRepeat,
            yoyo: shakeYoyo,
            onUpdate: (tween) => {
                let progress = Math.round(tween.getValue());
                shakeTrans.x = progress * xMod;
                shakeTrans.y = progress * yMod;
                _this.refreshSprite();
                if (onUpdate){ onUpdate.call(_this, tween); }
                },
            onYoyo: () => {
                xMod *= -1;
                yMod *= -1;
                },
            onComplete: () => {
                killTweens();
                transforms.remove('shake');
                _this.refreshSprite();
                _this.isAnimating = false;
                _this.isDoneWorkingOn('shakeSprite');
                if (onComplete){ onComplete.call(_this); }
                }
            });
        $sprite.subTweens.shakeTween = shakeTween;
    }

    // Kickback this sprite visually by moving it back slightly and then forward again
    kickbackSprite (strength = 1, repeat = 1, callback = null, duration = 100)
    {
        //console.log('MMRPG_Object.kickbackSprite() called for ', this.kind, this.token, '\nw/ strength:', strength, 'repeat:', repeat, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.kickbackSprite(strength, callback); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let onComplete = callback ? (callback.onComplete || callback) : null;
        let onUpdate = callback ? (callback.onUpdate || null) : null;
        let kickback = strength || 1;
        let kickbackX = kickback * 2;
        let kickbackDuration = duration || 100;
        let kickbackEase = 'Sine.easeInOut';
        let kickbackRepeat = repeat;
        let kickbackYoyo = true;
        const killTweens = function(){
            if ($sprite.subTweens.kickbackTween){
                $sprite.subTweens.kickbackTween.stop();
                delete $sprite.subTweens.kickbackTween;
                }
            };
        killTweens();
        this.isAnimating = true;
        this.isWorkingOn('kickbackSprite');
        let xMod = (this.direction === 'right' ? -1 : 1) * kickbackX;
        let transforms = config.transforms;
        let kickTrans = transforms.get('kickback');
        //console.log('-> xMod:', xMod, 'kickTrans:', kickTrans, 'transforms.data:', transforms.data);
        let kickbackTween = scene.tweens.addCounter({
            from: 0,
            to: kickbackX,
            duration: kickbackDuration,
            ease: kickbackEase,
            repeat: kickbackRepeat,
            yoyo: kickbackYoyo,
            onUpdate: (tween) => {
                let progress = Math.round(tween.getValue());
                kickTrans.x = progress * xMod;
                //console.log('-> onUpdate for kickbackTween progress:', progress, 'kickTrans.x:', kickTrans.x);
                _this.refreshSprite();
                if (onUpdate){ onUpdate.call(_this, tween); }
                },
            onComplete: () => {
                killTweens();
                transforms.remove('kickback');
                _this.refreshSprite();
                _this.isAnimating = false;
                _this.isDoneWorkingOn('kickbackSprite');
                if (onComplete){ onComplete.call(_this); }
                }
            });
        $sprite.subTweens.kickbackTween = kickbackTween;
    }

    // Fade a sprite's alpha value to a given amount over a set duration and then execute a callback
    fadeSprite (fromAlpha = 1, toAlpha = 0, callback = null, duration = 100)
    {
        //console.log('MMRPG_Object.fadeSprite() called for ', this.kind, this.token, '\nw/ alpha:', alpha, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.fadeSprite(alpha, duration, callback); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let onComplete = callback ? (callback.onComplete || callback) : null;
        let onUpdate = callback ? (callback.onUpdate || null) : null;
        let fadeDuration = duration || 100;
        fromAlpha = Phaser.Math.Clamp(fromAlpha, 0, 1);
        toAlpha = Phaser.Math.Clamp(toAlpha, 0, 1);
        const killTweens = function(){
            if ($sprite.subTweens.fadeTween){
                $sprite.subTweens.fadeTween.stop();
                delete $sprite.subTweens.fadeTween;
                }
            };
        killTweens();
        this.isAnimating = true;
        this.isWorkingOn('fadeSprite');
        let fadeTween = scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: fadeDuration,
            ease: 'Linear',
            onUpdate: (tween) => {
                let progress = tween.getValue() / 100;
                let alpha = Phaser.Math.Linear(fromAlpha, toAlpha, progress);
                _this.setAlpha(alpha);
                if (onUpdate){ onUpdate.call(_this, tween); }
                },
            onComplete: () => {
                killTweens();
                _this.setAlpha(toAlpha);
                _this.isAnimating = false;
                _this.isDoneWorkingOn('fadeSprite');
                if (onComplete){ onComplete.call(_this); }
                }
            });
        $sprite.subTweens.fadeTween = fadeTween;
    }

    // Stop a flashing sprite and reset it back to its original state
    stopFlashing ()
    {
        //console.log('MMRPG_Object.stopFlashing() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading) { return this.whenReady(function() { _this.stopFlashSprite(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        const killTweens = function() {
            if ($sprite.subTweens.flashTween) {
                $sprite.subTweens.flashTween.stop();
                delete $sprite.subTweens.flashTween;
                }
            }
        killTweens();
        $sprite.alpha = 1.0;
        $sprite.fx.brightness(1.0);
        this.refreshSprite();
    }

    // Stop a shaking sprite and reset it back to its original state
    stopShaking ()
    {
        //console.log('MMRPG_Object.stopShaking() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopShakeSprite(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        const killTweens = function(){
            if ($sprite.subTweens.shakeTween){
                $sprite.subTweens.shakeTween.stop();
                delete $sprite.subTweens.shakeTween;
                }
            };
        killTweens();
        let transforms = config.transforms;
        transforms.remove('shake');
        this.refreshSprite();
    }

    // Stop kickback on a sprite and reset it back to its original state
    stopKickback ()
    {
        //console.log('MMRPG_Object.stopKickback() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopKickbackSprite(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        const killTweens = function(){
            if ($sprite.subTweens.kickbackTween){
                $sprite.subTweens.kickbackTween.stop();
                delete $sprite.subTweens.kickbackTween;
                }
            };
        killTweens();
        let transforms = config.transforms;
        transforms.remove('kickback');
        this.refreshSprite();
    }

    // Stop a fading sprite and reset it back to its original state
    stopFading ()
    {
        //console.log('MMRPG_Object.stopFadeSprite() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopFadeSprite(); }); }
        let $sprite = this.sprite;
        const killTweens = function(){
            if ($sprite.subTweens.fadeTween){
                $sprite.subTweens.fadeTween.stop();
                delete $sprite.subTweens.fadeTween;
                }
            };
        killTweens();
        this.setAlpha(1);
        this.refreshSprite();
    }

    // Stop a sprite's move animation whichever way it might have been going abruptly
    stopMoving ()
    {
        //console.log('MMRPG_Object.stopMoving() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (!this.isMoving){ return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopMoving(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let transforms = config.transforms;
        if ($sprite.subTimers.slideMovement){
            $sprite.subTimers.slideMovement.remove();
            delete $sprite.subTimers.slideMovement;
            }
        if ($sprite.subTimers.runMovement){
            $sprite.subTimers.runMovement.remove();
            delete $sprite.subTimers.runMovement;
            }
        if ($sprite.subTweens.moveTween){
            $sprite.subTweens.moveTween.stop();
            delete $sprite.subTweens.moveTween;
            }
        this.isMoving = false;
        this.isDoneWorkingOn('moveToPosition');
        this.isDoneWorkingOn('moveToPositionX');
        this.isDoneWorkingOn('moveToPositionY');
        this.isDoneWorkingOn('slideSpriteForward');
        this.isDoneWorkingOn('runSpriteForward');
        this.refreshSprite();
    }

    // Stop a sprite's animation whichever way it might have been going abruptly
    stopAnimation ()
    {
        //console.log('MMRPG_Object.stopAnimation() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (!this.isAnimating){ return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopAnimation(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let transforms = config.transforms;
        $sprite.stop();
        if ($sprite.subTweens.idleBounceTween){
            $sprite.subTweens.idleBounceTween.stop();
            delete $sprite.subTweens.idleBounceTween;
            }
        if ($sprite.subTweens.runBounceTween){
            $sprite.subTweens.runBounceTween.stop();
            delete $sprite.subTweens.runBounceTween;
            }
        if ($sprite.subTweens.shakeTween){
            $sprite.subTweens.shakeTween.stop();
            delete $sprite.subTweens.shakeTween;
            }
        if ($sprite.subTweens.flashTween){
            $sprite.subTweens.flashTween.stop();
            delete $sprite.subTweens.flashTween;
            }
        if ($sprite.subTweens.kickbackTween){
            $sprite.subTweens.kickbackTween.stop();
            delete $sprite.subTweens.kickbackTween;
            }
        transforms.remove('idle');
        transforms.remove('shake');
        transforms.remove('flash');
        transforms.remove('bounce');
        transforms.remove('kickback');
        this.isAnimating = false;
        this.isDoneWorkingOn('flashSprite');
        this.isDoneWorkingOn('shakeSprite');
        this.isDoneWorkingOn('kickbackSprite');
        this.refreshSprite();
    }


    // -- SPRITE INTERACTIONS -- //

    // Make this sprite interactive by making the hitzone above it interactive (if not already done so)
    setInteractive ()
    {
        //console.log('MMRPG_Object.setInteractive() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setInteractive(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let $hitbox = this.spriteHitbox;
        if (config.interactive){ return; }
        $hitbox.setInteractive({ useHandCursor: true });
        $hitbox.on('pointerover', (pointer, localX, localY) => {
            //console.log('-> pointerover', pointer, localX, localY);
            document.body.style.cursor = 'pointer';
            });
        $hitbox.on('pointerout', (pointer, localX, localY) => {
            //console.log('-> pointerout', pointer, localX, localY);
            document.body.style.cursor = 'default';
            });
        config.interactive = true;
    }

    // Remove all interactive properties from this sprite and it's hitbox
    setNotInteractive ()
    {
        //console.log('MMRPG_Object.setNotInteractive() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setNotInteractive(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let $hitbox = this.spriteHitbox;
        if (!config.interactive){ return; }
        $hitbox.disableInteractive();
        $hitbox.removeAllListeners('pointerover');
        $hitbox.removeAllListeners('pointerout');
        config.interactive = false;
    }

    // Set a custom callback function to when when this sprite is clicked
    setOnClick (callback)
    {
        //console.log('MMRPG_Object.setOnClick() called w/ callback:', callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setOnClick(callback); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        this.setInteractive();
        $hitbox.on('pointerdown', (pointer, localX, localY) => {
            if ($hitbox){ $hitbox.emit('pointerout', $hitbox); }
            callback.call(this, $sprite, pointer, localX, localY);
            });
    }

    // Set a custom callback function for when this sprite is hovered over and then, optionally, hovered away from
    setOnHover (callback, callback2 = null)
    {
        //console.log('MMRPG_Object.setOnHover() called w/ callback:', callback, 'callback2:', callback2);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.setOnHover(callback, callback2); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        this.setInteractive();
        $hitbox.on('pointerover', (pointer, localX, localY) => {
            callback.call(_this, $sprite, pointer, localX, localY);
            });
        if (callback2) {
            $hitbox.on('pointerout', (pointer, localX, localY) => {
                callback2.call(_this, $sprite, pointer, localX, localY);
                });
            }
    }

    // Remove any click events this sprite may have assigned to it
    removeOnClicks ()
    {
        //console.log('MMRPG_Object.removeOnClick() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.removeOnClicks(); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        $hitbox.removeAllListeners('pointerdown');
    }

    // Remove any hover events this sprite may have assigned to it
    removeOnHovers ()
    {
        //console.log('MMRPG_Object.removeOnHover() called');
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.removeOnHovers(); }); }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        $hitbox.removeAllListeners('pointerover');
        $hitbox.removeAllListeners('pointerout');
    }


    // -- SPRITE DESTRUCTION -- //

    // Stop or halt any movement, animations, and callbacks for this object so we can destroy later
    stopAll (removeInteractivity = false)
    {
        //console.log('MMRPG_Object.stopAll() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.whenReady(function(){ _this.stopAll(removeInteractivity); }); }
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let $hitbox = this.spriteHitbox;
        this.stopMoving();
        this.stopIdleAnimation();
        this.spriteMethodsQueued = [];
        config.transforms.clear();
        if ($sprite.anims && $sprite.anims.stop){ $sprite.anims.stop(); }
        SPRITES.stopSpriteTweens(scene, $sprite, true);
        SPRITES.stopSpriteTimers(scene, $sprite, true);
        if (removeInteractivity){
            this.removeOnClicks();
            this.removeOnHovers();
            this.setNotInteractive();
            }
    }

    // Destroy this object's children and remove them from the scene and then itself
    destroy ()
    {
        //console.log('MMRPG_Object.destroy() called for ', this.kind, this.token);
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let $sprite = this.sprite;
        let $shadow = this.spriteShadow;
        let $hitbox = this.spriteHitbox;
        if ($sprite){
            SPRITES.destroySpriteAndCleanup(scene, $sprite);
            this.sprite = null;
            }
        if ($shadow){
            SPRITES.destroySpriteAndCleanup(scene, $shadow);
            this.spriteShadow = null;
            }
        if ($hitbox){
            $hitbox.destroy();
            this.spriteHitbox = null;
            }

    }

}

export default MMRPG_Object;
