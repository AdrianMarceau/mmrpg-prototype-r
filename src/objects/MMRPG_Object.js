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
    constructor (scene, _kind, token, customInfo = {}, spriteConfig = {}, objectConfig = {})
    {
        //console.log('MMRPG_Object.constructor() called w/ _kind:', _kind, 'token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig, 'objectConfig:', objectConfig);

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(scene);

        // Parse the kind so we have both the kind and xkind
        let [kind, xkind] = MMRPG.parseKind(_kind);
        //console.log('-> kind:', kind, 'xkind:', xkind);

        // Define the properties of the object
        this.token = token;
        this.kind = kind;
        this.xkind = xkind;
        this.scene = scene;
        this.data = {};
        this.cache = {};

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
        this.customInfo = customInfo || {};
        this.objectConfig = objectConfig || {};
        this.createData(indexInfo, customInfo, objectConfig);

        // Create some flags and a queue to help with lazy-loading
        this.spriteIsLoading = true;
        this.spriteIsPlaceholder = true;
        this.spriteMethodsQueued = [];
        this.spriteMethodsInProgress = [];
        this.spriteMethodsInProgress.add = function(method){ this.push(method); };
        this.spriteMethodsInProgress.remove = function(method){ this.splice(this.indexOf(method), 1); };

        // If spriteConfig is provided, create a new sprite with it
        this.sprite = null;
        this.spriteContainer = null;
        this.spriteLayers = {};
        this.spriteConfig = {};
        this.spriteHitbox = null;
        this.spriteFrames = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'];
        this.spriteFrameAliases = [];
        if (spriteConfig && Object.keys(spriteConfig).length > 0) {

            // If the sprite config was not an object, just true, make it an object
            if (typeof spriteConfig !== 'object'){ spriteConfig = {}; }
            this.spriteConfig = spriteConfig;

            // Predefine spriteConfig properties to avoid errors
            spriteConfig.x = spriteConfig.x || 0;
            spriteConfig.y = spriteConfig.y || 0;
            spriteConfig.z = spriteConfig.z || 0;
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
            spriteConfig.layers = spriteConfig.layers || {};
            spriteConfig.debug = spriteConfig.debug || false;

            // Also predefine some of the more complicated ones for later
            spriteConfig.useContainerForDepth = spriteConfig.useContainerForDepth || false;

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
            if (spriteConfig.frameAliases){
                this.spriteFrameAliases = spriteConfig.frameAliases;
                } else if (objectConfig.frameAliases){
                this.spriteFrameAliases = objectConfig.frameAliases;
                }

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
        //console.log('MMRPG_Object.whenReady() called for ', this.kind, this.token, 'w/ callback:', callback);
        this.spriteMethodsQueued.push(callback);
        if (this.spriteIsLoading){ return false; }
        else { this.executeQueuedSpriteMethods(); }
    }

    // Execute all queued sprite methods now that the sprite is ready
    executeQueuedSpriteMethods ()
    {
        //console.log('MMRPG_Object.executeQueuedSpriteMethods() called for ', this.kind, this.token);
        if (this.spriteMethodsQueued){
            for (let i = 0; i < this.spriteMethodsQueued.length; i++){
                let method = this.spriteMethodsQueued.shift();
                method.call(this);
                }
            }
    }

    // Execute a given callback after a certain amount of time gas passed
    delayedCall (delay, callback)
    {
        //console.log('MMRPG_Object.delayedCall() called for ', this.kind, this.token, 'w/ delay:', delay, 'callback:', typeof callback);
        let _this = this;
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let delayedCall = scene.time.delayedCall(delay, function(){
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
                this.spriteIsPlaceholder = false;
                this.createObjectSprite();

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
                    //console.log('%c' + '-> sprite texture '+spriteSheet+' loaded!', 'color: #00FF00');
                    _this.spriteIsLoading = false;
                    _this.spriteIsPlaceholder = false;
                    _this.createObjectSprite();
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
            let previewSheet = _this.getSpriteSheet('preview', backgroundVariant);
            let avatarSheet = _this.getSpriteSheet('avatar');
            //console.log(this.token + ' | -> spriteToken:', spriteToken, '\nbackgroundSheet:', backgroundSheet, '\nforegroundSheet:', foregroundSheet, '\npreviewSheet:', previewSheet, '\navatarSheet:', avatarSheet);
            config.sheet = avatarSheet;
            this.sheet = avatarSheet;
            config.backgroundSheet = backgroundSheet;
            config.foregroundSheet = foregroundSheet;
            config.previewSheet = previewSheet;
            config.avatarSheet = avatarSheet;
            this.backgroundSheet = backgroundSheet;
            this.foregroundSheet = foregroundSheet;
            this.previewSheet = previewSheet;
            this.avatarSheet = avatarSheet;

            // Create the sprite with the information we've collected when ready
            if (scene.textures
                && backgroundSheet && scene.textures.exists(backgroundSheet)
                && foregroundSheet && scene.textures.exists(foregroundSheet)
                && previewSheet && scene.textures.exists(previewSheet)
                && avatarSheet && scene.textures.exists(avatarSheet)
                ) {
                //console.log('field sprite textures for ' + this.token + ' already exist');

                // Texture is loaded, create sprite normally
                this.spriteIsLoading = false;
                this.spriteIsPlaceholder = false;
                this.createObjectSprite();

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
                    //console.log('%c' + '-> sprite texture '+spriteSheet+' loaded!', 'color: #00FF00');
                    _this.spriteIsLoading = false;
                    _this.spriteIsPlaceholder = false;
                    _this.createObjectSprite();
                    });

                }

            }
        // Otherwise it's unclear what this is or what to do with it
        else {

            // ...

            }

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

    // Generate animations for the sprite sheet currently loaded into memory
    createSpriteAnimations ()
    {
        //console.log('MMRPG_Object.createSpriteAnimations() called for ', this.kind, this.token);

        // Pull in index references
        let _this = this;
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
        //console.log('indexInfo for ', kind, token, '=', indexInfo);

        // Collect the sheet and base but be prepared to override
        // if we're still a placeholder sprite so we don't take the
        // real sprite's position in the index when ready
        let altSheet;
        let altIsBase;
        if (!this.spriteIsPlaceholder){
            altSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
            altIsBase = objectConfig.currentAltSheetIsBase ? true : false;
            } else {
            altSheet = 'base';
            altIsBase = true;
            token = kind;
            }

        // Predefine some base paths and keys
        let pathToken = token === kind ? ('.' + kind) : token;
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (!altIsBase ? '_'+altSheet : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + altSheet;
        let spriteSize = indexInfo.image_size || objectConfig.baseSize[0];
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        spritesIndex.prepForKeys(spritesIndex.sizes, xkind);
        spritesIndex.sizes[xkind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to spritesIndex.sizes['+kind+']['+token+']')

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        let pendingAnims = [];
        for (let i = 0; i < spriteDirections.length; i++){
            let direction = spriteDirections[i];

            // -- DEFINE SHEET KEYS & TOKENS -- //

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let sheetKey = baseKey+'.sprite-'+direction;
            let sheetToken = 'sprite-' + direction;

            // Define and register the key for this icon sheet using direction, image, key, and path
            let iconPrefix = objectConfig.iconPrefix;
            let iconSheetKey = sheetKey.replace('sprites.', iconPrefix+'s.');
            let iconSheetToken = sheetToken.replace('sprite-', iconPrefix+'-');

            // -- DEFINE SPRITE ANIMATIONS -- //

            // Also create animations for this sprite depending on kind
            if (kind === 'player'){

                // Collect this player's base stats so we can adjust animations
                let baseStats = objectData.baseStats || {};
                let speedMod = baseStats.dividers.speed || 1;
                //console.log(this.token + ' | baseStats:', baseStats);

                // Generate the idle animation string for re-use later
                var anim = 'idle';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log(this.token + ' | added "'+anim+'" anim [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of an idle animation for this sprite
                if (!scene.anims.get(animKey)){
                    //console.log(this.token + ' | queued "'+anim+'" anim [ '+animKey+' ]');
                    pendingAnims.push({
                        key: animKey,
                        sheet: sheetKey,
                        frames: [ 0, 1, 0, 6, 0, 1, 0, 1, 0, 6 ],
                        duration: Math.round(6000 * speedMod),
                        repeat: -1
                        });
                    }

                // Generate the running animation string for re-use later
                var anim = 'run';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log(this.token + ' | added "'+anim+'" anim [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a running animation for this sprite
                if (!scene.anims.get(animKey)){
                    //console.log(this.token + ' | queued "'+anim+'" anim [ '+animKey+' ]');
                    pendingAnims.push({
                        key: animKey,
                        sheet: sheetKey,
                        frames: [ 7, 8, 9 ],
                        frameRate: 5,
                        repeat: -1
                        });
                    }

                }
            else if (kind === 'robot'){

                // Collect this robot's base stats so we can adjust animations
                let baseStats = objectData.baseStats || {};
                let speedMod = baseStats.dividers.speed || 1;
                //console.log(this.token + ' | baseStats:', baseStats);

                // Generate the idle animation string for re-use later
                var anim = 'idle';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log(this.token + ' | added "'+anim+'" anim [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                if (!scene.anims.get(animKey)){
                    //console.log(this.token + ' | queued "'+anim+'" anim [ '+animKey+' ]');
                    pendingAnims.push({
                        key: animKey,
                        sheet: sheetKey,
                        frames: [ 0, 1, 0, 8, 0, 1, 0, 10, 0, 0 ],
                        duration: Math.round(10000 * speedMod),
                        repeat: -1
                        });
                    }

                // Generate the sliding animation string for re-use later
                var anim = 'slide';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log(this.token + ' | added "'+anim+'" anim [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                if (!scene.anims.get(animKey)){
                    //console.log(this.token + ' | queued "'+anim+'" anim [ '+animKey+' ]');
                    pendingAnims.push({
                        key: animKey,
                        sheet: sheetKey,
                        frames: [ 8, 7, 7, 7, 7, 7, 7, 8 ],
                        frameRate: 6,
                        repeat: 0
                        });
                    }

                // Generate the shooting animation string for re-use later
                var anim = 'shoot';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log(this.token + ' | added "'+anim+'" anim [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                if (!scene.anims.get(animKey)){
                    //console.log(this.token + ' | queued "'+anim+'" anim [ '+animKey+' ]');
                    pendingAnims.push({
                        key: animKey,
                        sheet: sheetKey,
                        frames: [ 8, 4, 4, 4, 4, 4, 4, 4 ],
                        frameRate: 6,
                        repeat: 0
                        });
                    }

                }

            }

        // Now that we've queued everything up, we can re-loop through the anims and create them
        while (pendingAnims.length){
            // Collect the next animation to create
            let anim = pendingAnims.shift();
            //console.log('%c' + this.token + ' | creating new animation for ' + anim.key, 'color: green;');
            //console.log(this.token + ' | creating new animation for ', anim.key, 'w/', anim);
            if (scene.anims.get(anim.key)){ console.warn(this.token + ' | anim.key: ' + anim.key + ' already exists'); continue; }
            scene.anims.create(Object.assign({}, anim, {
                key: anim.key,
                frames: scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames }),
                }));
            }

        // Return when done
        return;

    }

    // Load a given sprite texture (sheet) into memory and optionally execute a callback when done
    loadSpriteTexture (onLoadCallback)
    {
        //console.log('MMRPG_Object.loadSpriteTexture() called');
        let _this = this;
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        this.spriteIsLoading = true;
        SPRITES.preloadPending(scene);
        scene.load.once('complete', () => {
            //console.log('-> loadSpriteTexture() complete for token:', token);
            _this.createSpriteAnimations();
            _this.spriteIsLoading = false;
            if (onLoadCallback){ onLoadCallback.call(_this); }
            if (_this.spriteMethodsQueued){
                for (let i = 0; i < _this.spriteMethodsQueued.length; i++){
                    let method = _this.spriteMethodsQueued[i];
                    method.call(_this);
                    }
                }
            });
        scene.load.start();
    }

    // Get the current sprite sheet/texture key for the loaded object
    // Optionally accepts kind, direction, altOrSheet, and token to override defaults
    getSpriteSheet (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpriteSheet() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteSheets = SPRITES.index.sheets[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteDirection = spriteDirection || this.direction || 'right';
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet || 'base';
        //console.log('Using getSpriteSheet() w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteAltOrSheet:', spriteAltOrSheet)

        // Define the sprite key and sheet token given context
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spriteSheet;
        let spriteKey = spriteKind+'-'+spriteDirection;
        if (spriteSheets
            && spriteSheets[spriteToken]
            && spriteSheets[spriteToken][spriteAltOrSheet]
            && spriteSheets[spriteToken][spriteAltOrSheet][spriteKey]){
            spriteSheet = spriteSheets[spriteToken][spriteAltOrSheet][spriteKey];
            } else {
            spriteSheet = '~'+spriteKind+'s.'+this.xkind+'.'+spriteToken+'.'+spriteAltOrSheet+'.'+spriteDirection;
            }
        //console.log('-> spriteAltOrSheet:', spriteAltOrSheet, 'spriteSheet:', spriteSheet);

        // Return the sheet token we found
        //console.log('Returning spriteSheet:', spriteSheet);
        return spriteSheet;

    }

    // Determine and return the texture path (sheet) for an object given kind and direction (we already know the rest)
    getSpritePath (spriteKind = 'sprite', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpritePath() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spritePaths = SPRITES.index.paths[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spritePaths:', spritePaths, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'sprite';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteDirection = spriteDirection || this.direction || 'right';
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet || 'base';
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
            spritePath = 'content/' + this.xkind + '/' + this.kind + '/' + spriteKind + '_' + spriteDirection +  '_' + xSize + '.png';
            }

        // Return the sheet token we found
        //console.log('Returning spritePath:', spritePath);
        return spritePath;

    }

    // Get the animation key of a specific animation on this loaded object
    // Optionally accepts kind, direction, altOrSheet, and token to override defaults
    getSpriteAnim (spriteKind = 'sprite', spriteAnim = 'idle', spriteDirection = null, spriteAltOrSheet = null, spriteToken = null)
    {
        //console.log('MMRPG_Object.getSpriteAnim() called w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteAnim:', spriteAnim, 'spriteDirection:', spriteDirection);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteAnims = SPRITES.index.anims[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spriteAnims:', spriteAnims, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'sprite';
        spriteAnim = spriteAnim || 'idle';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteDirection = spriteDirection || this.direction || 'right';
        spriteAltOrSheet = spriteAltOrSheet || objectConfig.currentAltSheet || objectConfig.baseAltSheet || 'base';
        //console.log('Using getSpriteAnim() w/ spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteAnim:', spriteAnim, 'spriteDirection:', spriteDirection, 'spriteAltOrSheet:', spriteAltOrSheet)

        // Define the sprite key and sheet token given context
        //console.log('-> spriteToken:', spriteToken, 'spriteAnim:', spriteAnim, 'spriteDirection:', spriteDirection);
        let spriteAnimKey;
        let spriteKey = spriteKind+'-'+spriteDirection;
        if (typeof spriteAnims[spriteToken] !== 'undefined'
            && typeof spriteAnims[spriteToken][spriteAltOrSheet] !== 'undefined'
            && typeof spriteAnims[spriteToken][spriteAltOrSheet][spriteKey] !== 'undefined'
            && typeof spriteAnims[spriteToken][spriteAltOrSheet][spriteKey][spriteAnim] !== 'undefined'){
            spriteAnimKey = spriteAnims[spriteToken][spriteAltOrSheet][spriteKey][spriteAnim];
            } else {
            spriteAnimKey = '~'+spriteKind+'s.'+this.xkind+'.'+spriteToken+'.'+spriteAltOrSheet+'.'+spriteKey+'.'+spriteAnim;
            }
        //console.log('-> spriteAltOrSheet:', spriteAltOrSheet, 'spriteAnimKey:', spriteAnimKey);

        // Return the sheet token we found
        //console.log('Returning spriteAnimKey:', spriteAnimKey);
        return spriteAnimKey;

    }

    // Define a function that takes a given sprite kind, token, and alt and then provides all the sheets and animation data
    getSpriteInfo ()
    {
        //console.log('MMRPG_Object.getSpriteInfo() called for \n kind: '+this.kind+', token: '+this.token);

        // Pull in index references
        let _this = this;
        let SPRITES = this.SPRITES;
        let spriteIndex = SPRITES.index;
        let spriteSheets = spriteIndex.sheets;
        let spriteAnims = spriteIndex.anims;
        let kinds = spriteIndex.kinds;
        let xkinds = spriteIndex.xkinds;

        // Normalize the kind token to ensure they it's valid
        let kind = this.kind;
        let xkind = this.xkind;
        let token = this.token;
        //console.log('token:', token, 'kind:', kind, 'xkind:', xkind);
        //console.log('spriteSheets[' + xkind + ']:', spriteSheets[xkind]);
        //console.log('spriteSheets[' + xkind + '][' + token + ']:', spriteSheets[xkind][token]);

        // -- INFO TEMPLATE -- //

        // Put it all together info an object with appropriate references
        let spriteInfo = {
            'sprite': {
                'left': {
                    'sheet': this.getSpriteSheet('sprite', 'left'),
                    'anim': {},
                    },
                'right': {
                    'sheet': this.getSpriteSheet('sprite', 'right'),
                    'anim': {},
                    },
                },
            };

        // -- MUG & ICON SPRITES -- //

        // If this is either a player or a robot, we must include mugs
        if (kind === 'player' || kind === 'robot'){

            // Include the mug sheets for the player or robot
            spriteInfo.mug = {
                'left': {
                    'sheet': this.getSpriteSheet('mug', 'left'),
                    'anim': {},
                    },
                'right': {
                    'sheet': this.getSpriteSheet('mug', 'right'),
                    'anim': {},
                    },
                };

            }
        // Otherwise if any other type, we should include icons instead
        else {

            // Include the icon sheets for the ability, item, skill, field, etc.
            spriteInfo.icon = {
                'left': {
                    'sheet': this.getSpriteSheet('icon', 'left'),
                    'anim': {},
                    },
                'right': {
                    'sheet': this.getSpriteSheet('icon', 'right'),
                    'anim': {},
                    },
                };

            }

        // -- CHARACTER & OBJECT SPRITES -- //

        // If this is a player, make sure we include appropriate sheets and animations
        if (kind === 'player'){

            // Include the idle animations for the player
            spriteInfo.sprite.left.anim.idle = this.getSpriteAnim('sprite', 'idle', 'left');
            spriteInfo.sprite.right.anim.idle = this.getSpriteAnim('sprite', 'idle', 'right');

            // Include the running animations for the player
            spriteInfo.sprite.left.anim.run = this.getSpriteAnim('sprite', 'run', 'left');
            spriteInfo.sprite.right.anim.run = this.getSpriteAnim('sprite', 'run', 'right');

            }
        // If this is a robot, make sure we include appropriate sheets and animations
        else if (kind === 'robot'){

            // Include the idle animations for the robot
            spriteInfo.sprite.left.anim.idle = this.getSpriteAnim('sprite', 'idle', 'left');
            spriteInfo.sprite.right.anim.idle = this.getSpriteAnim('sprite', 'idle', 'right');

            // Include the shooting animations for the robot
            spriteInfo.sprite.left.anim.shoot = this.getSpriteAnim('sprite', 'shoot', 'left');
            spriteInfo.sprite.right.anim.shoot = this.getSpriteAnim('sprite', 'shoot', 'right');

            // Include the sliding animations for the robot
            spriteInfo.sprite.left.anim.slide = this.getSpriteAnim('sprite', 'slide', 'left');
            spriteInfo.sprite.right.anim.slide = this.getSpriteAnim('sprite', 'slide', 'right');

            }

        // Return the compiled sprite info
        //console.log('Returning ', this.token, ' spriteInfo:', spriteInfo);
        return spriteInfo;

    }

    // Prepare this object's sprite for use, creating it if it doesn't exist yet
    prepareSprite (spriteSheet = null)
    {
        //console.log('MMRPG_Object.prepareSprite() called for ', this.kind, this.token, '\nw/ spriteSheet:', spriteSheet, 'spriteConfig:', this.spriteConfig);
        if (this.sprite){ return; }
        let scene = this.scene;
        let config = this.spriteConfig;
        let sheet = spriteSheet || config.sheet;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        let $sprite = scene.add.sprite(modX, modY, sheet);
        $sprite.subTweens = {};
        $sprite.subTimers = {};
        $sprite.subSprites = {};
        this.sprite = $sprite;
        //console.log('-> created new sprite w/ sheet:', sheet, 'x:', config.x, 'y:', config.y);
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
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);

        // If this sprite is inside of a container and we're allowed to, track Z changes to that container
        if (this.spriteContainer
            && config.useContainerForDepth){
            //console.log(this.token + ' | -> tracking Z to container:', this.spriteContainer);
            let containerBounds = this.spriteContainer.getBounds() || null;
            let containerY = containerBounds.y || 0;
            let objectY = this.y || 0;
            let offsetZ = Math.ceil(objectY - containerY);
            //console.log(this.token + ' | -> containerY:', containerY, 'objectY:', objectY, 'offsetZ:', offsetZ);
            config.z = offsetZ;
            this.z = offsetZ;
            if (!this.cache.lastZ || this.cache.lastZ !== offsetZ){
                this.cache.lastZ = offsetZ;
                this.cache.sortContainer = true;
                }
            }

        // First update the sprite itself as that's most important
        //console.log(this.token + ' | -> attempting to update sheet from', this.cache.sheet, 'to', config.sheet);
        if (!this.cache.sheet || this.cache.sheet !== config.sheet || $sprite.texture.key !== config.sheet){
            $sprite.setTexture(config.sheet);
            this.cache.sheet = config.sheet;
            //console.log(this.token + ' | -> updated sheet to', config.sheet, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update frame from', this.cache.frame, 'to', config.frame);
        if (!this.cache.frame || this.cache.frame !== config.frame){
            $sprite.setFrame(config.frame);
            this.cache.frame = config.frame;
            //console.log(this.token + ' | -> updated frame to', config.frame, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update tint from', this.cache.tint, 'to', config.tint);
        if (!this.cache.tint || this.cache.tint !== config.tint){
            if (config.tint){ $sprite.setTint(config.tint); }
            else { $sprite.clearTint(); }
            this.cache.tint = config.tint;
            //console.log(this.token + ' | -> updated tint to', config.tint, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update alpha from', this.cache.alpha, 'to', config.alpha);
        if (!this.cache.alpha || this.cache.alpha !== config.alpha){
            $sprite.setAlpha(config.alpha);
            this.cache.alpha = config.alpha;
            //console.log(this.token + ' | -> updated alpha to', config.alpha, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update scale from', this.cache.scale, 'to', config.scale);
        if (!this.cache.scale || this.cache.scale !== config.scale){
            $sprite.setScale(config.scale);
            this.cache.scale = config.scale;
            //console.log(this.token + ' | -> updated scale to', config.scale, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update depth from', this.cache.depth, 'to', config.depth);
        if (!this.cache.depth || this.cache.depth !== config.depth){
            $sprite.setDepth(config.depth + config.z);
            this.cache.depth = config.depth;
            //console.log(this.token + ' | -> updated depth to', config.depth, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update origin from', this.cache.origin, 'to', config.origin);
        if (!this.cache.origin || this.cache.origin !== config.origin){
            $sprite.setOrigin(config.origin[0], config.origin[1]);
            this.cache.origin = config.origin;
            //console.log(this.token + ' | -> updated origin to', config.origin, 'and updated cache');
            }
        //console.log(this.token + ' | -> attempting to update position from', this.cache.x, this.cache.y, 'to', modX, modY);
        if (!this.cache.x || this.cache.x !== modX
            || !this.cache.y || this.cache.y !== modY){
            $sprite.setPosition(modX, modY);
            this.cache.x = modX;
            this.cache.y = modY;
            //console.log(this.token + ' | -> updated position to', modX, modY, 'and updated cache');
            }

        //console.log('-> updating sprite for ', this.token, ' w/ origin:', config.origin, 'x:', modX, 'y:', modY, 'config.frame:', config.frame, 'config:', config);

        // Now update the hitbox with relevant changes
        if ($hitbox){
            let [ hitX, hitY ] = [ config.x, config.y ];
            $hitbox.setPosition(hitX, hitY);
            $hitbox.setDepth(config.depth + config.z + 1);
            $hitbox.setOrigin(config.origin[0], config.origin[1]);
            //if (config.debug){ $hitbox.setVisible(true); }
            //else { $hitbox.setVisible(false); }
            //console.log('-> updating hitbox sprite for ', this.token, ' w/ origin:', config.origin, 'x:', hitX, 'y:', hitY, 'config:', config);
            }

        // And finally, update any layer graphics that are present
        this.updateSpriteLayerGraphics();

        // If there's a container attached to this sprite, sort it by depth
        if (this.spriteContainer
            && this.spriteContainer.sort
            && this.cache.sortContainer){
            //console.log(this.token + ' | -> sorting container:', typeof this.spriteContainer, this.spriteContainer);
            this.spriteContainer.sort('depth');
            delete this.cache.sortContainer;
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
        this.x = $sprite.x;
        this.y = $sprite.y;
        this.z = $sprite.z;
        this.width = $sprite.width;
        this.height = $sprite.height;
        this.direction = this.direction;
        this.origin = $sprite.origin;
        this.alpha = $sprite.alpha;
        this.depth = $sprite.depth;
    }

    // Refresh this sprite by updating sprite properties, graphics, and animations
    refreshSprite ()
    {
        //console.log('MMRPG_Object.refreshSprite() called for ', this.kind, this.token);
        this.updateSpriteProperties();
        this.updateSpriteGraphics();
    }


    // -- SPRITE MANIPULATION -- //

    // Set the alpha property of the object's sprite and update the spriteConfig
    setAlpha (alpha)
    {
        //console.log('MMRPG_Object.setAlpha() called w/ alpha:', alpha);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        if (alpha === false){ return this.clearAlpha(); }
        if (alpha === config.alpha){ return; }
        config.alpha = alpha;
        this.alpha = alpha;
        $sprite.setAlpha(this.alpha);
        this.refreshSprite();
    }

    // Set the tint property of the object's sprite and update the spriteConfig
    setTint (tint)
    {
        //console.log('MMRPG_Object.setTint() called w/ tint:', tint);
        if (!this.sprite) { return; }
        if (tint === false){ return this.clearTint(); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.tint = tint;
        this.tint = tint;
        $sprite.setTint(Graphics.returnHexColorValue(this.tint));
    }

    // Clear the tint property of the object's sprite and update
    clearTint ()
    {
        //console.log('MMRPG_Object.clearTint() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.tint = null;
        this.tint = null;
        $sprite.clearTint();
    }


    setShadow (kind)
    {
        //console.log('MMRPG_Object.setTint() called w/ tint:', tint);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;

        // support custom kinds here!!!
        // TEMP TEMP TEMP
        $sprite.preFX.addShadow();
        this.refreshSprite();

    }

    // Set the position of this object's sprite and update the spriteConfig
    setPosition (x, y, z)
    {
        //console.log('MMRPG_Object.setPosition() called w/ x:', x, 'y:', y, 'z:', z);
        if (!this.sprite) { return; }
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
        //console.log('MMRPG_Object.setFrame() called w/ frame:', frame);
        if (!this.sprite) { return; }
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
        $sprite.setFrame(frame);
        this.refreshSprite();
    }

    // Reset the object's sprite frame to the default of it's sheet and update the spriteConfig
    resetFrame ()
    {
        //console.log('MMRPG_Object.resetFrame() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        this.setFrame(0);
    }

    // Set the scale of this object's sprite and update the spriteConfig
    setDirection (direction)
    {
        //console.log('MMRPG_Object.setDirection() called w/ direction:', direction);
        if (!this.sprite) { return; }

        let _this = this;
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
            this.loadSpriteTexture(this.data.token, direction, () => {
                //console.log('%c' + '-> sprite texture '+newSheet+' loaded!', 'color: #00FF00');
                config.sheet = newSheet;
                this.sheet = newSheet;
                this.refreshSprite();
                });
            } else {
            //console.log('-> sprite texture '+newSheet+' already loaded, changing sheet now...');
            config.sheet = newSheet;
            this.sheet = newSheet;
            this.refreshSprite();
            }

    }

    // Flip the current direction of the robot sprite and update the spriteConfig
    flipDirection ()
    {
        //console.log('MMRPG_Object.flipDirection() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let direction = this.direction || 'right';
        direction = (direction === 'right') ? 'left' : 'right';
        this.setDirection(direction);
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
        if (!this.sprite) { return; }
        let _this = this;
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
            this.loadSpriteTexture(() => {
                //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
                _this.createSpriteAnimations();
                _this.refreshSprite();
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
        if (!this.sprite) { return; }
        let _this = this;
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
            this.loadSpriteTexture(() => {
                //console.log('%c' + this.token + ' | -> sprite texture '+newSheet+' loaded! refreshing sheet now...', 'color: green;');
                _this.createSpriteAnimations();
                _this.refreshSprite();
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
        if (!this.sprite) { return; }
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
        if (!this.sprite) { return; }
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
        if (!this.sprite) { return; }
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
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        let config = this.spriteConfig;
        if (config[key] === value){ return; }
        config[key] = value;
        this.refreshSprite();
    }

    // Set the sprite config value for useContainerForDepth to the boolean value provided
    useContainerForDepth (bool)
    {
        //console.log('MMRPG_Object.setUseContainerForDepth() called for', this.token, 'w/ bool:', bool);
        if (!this.sprite) { return; }
        if (!this.spriteContainer){ return; }
        let config = this.spriteConfig;
        if (config.useContainerForDepth === bool){ return; }
        config.useContainerForDepth = bool;
        this.refreshSprite();
    }


    // -- SPRITE LAYER HANDLING -- //

    // Update the offset values for a given layer of this sprite
    setLayerOffset (layer, x, y, z)
    {
        //console.log('MMRPG_Field.setLayerOffset() called for ', this.kind, this.token, '\nw/ layer:', layer, 'x:', x, 'y:', y);
        let layersConfig = this.spriteConfig.layers;
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
        //console.log('MMRPG_Field.getLayerOffset() called for ', this.kind, this.token, '\nw/ layer:', layer);
        let layersConfig = this.spriteConfig.layers;
        let layerConfig = layersConfig[layer] || {};
        let offset = layerConfig.offset || {x: 0, y: 0, z: 0};
        return offset;
    }
    getLayerOffsetX (layer) { return this.getLayerOffset(layer).x; }
    getLayerOffsetY (layer) { return this.getLayerOffset(layer).y; }
    getLayerOffsetZ (layer) { return this.getLayerOffset(layer).z; }


    // -- SPRITE ANIMATION -- //

    // Start the idle animation for this sprite given all we know about it
    startIdleAnimation (bounce = true, emote = true)
    {
        //console.log('MMRPG_Object.startIdleAnimation() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.kind !== 'player' && this.kind !== 'robot'){ return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.startIdleAnimation(bounce, emote); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let spritesIndex = this.SPRITES.index;
        this.stopMoving();
        this.stopIdleAnimation();
        const startBouncing = function(){
            // Animate the doctor bouncing up and down as they walk forward
            let data = this.data;
            let baseStats = data.baseStats;
            //console.log('-> speed | base:', baseStats.values.speed, 'average:', baseStats.average, 'multiplier:', baseStats.multipliers.speed, 'divider:', baseStats.dividers.speed);
            //let spriteY = $sprite.y;
            let speedMod = baseStats.dividers.speed;
            $sprite.subTweens.idleBounceTween = scene.add.tween({
                targets: $sprite,
                y: '-='+config.scale,
                ease: 'Stepped',
                delay: Math.ceil(speedMod * 300),
                repeatDelay: 100 + Math.ceil(speedMod * 200),
                duration: 100 + Math.ceil(speedMod * 200),
                repeat: -1,
                yoyo: true,
                });
            };
        const startEmoting = function(){
            let animationsIndex = spritesIndex.anims;
            let animationToken = 'idle';
            let xkind = this.xkind,
                token = this.data.token,
                alt = this.data.image_alt,
                direction = this.direction,
                key = 'sprite-'+direction;
                ;
            //console.log('-> spritesIndex:', spritesIndex);
            if (typeof animationsIndex[xkind] === 'undefined'){ return; }
            if (typeof animationsIndex[xkind][token] === 'undefined'){ return; }
            if (typeof animationsIndex[xkind][token][alt] === 'undefined'){ return; }
            if (typeof animationsIndex[xkind][token][alt][key] === 'undefined'){ return; }
            let spriteAnims = animationsIndex[xkind][token][alt][key];
            //console.log('-> spriteAnims:', spriteAnims);
            if (!spriteAnims) { return; }
            let animKey = spriteAnims[animationToken];
            //console.log('-> animKey for "'+animationToken+'":', animKey);
            if (!animKey) { return; }
            $sprite.play(animKey);
            };
        if (bounce){
            startBouncing.call(_this);
            this.isAnimating = true;
            }
        if (emote){
            startEmoting.call(_this);
            this.isAnimating = true;
            }
    }

    // Stop the idle animation currently playing on this sprite if one exists
    stopIdleAnimation ()
    {
        //console.log('MMRPG_Object.stopIdleAnimation() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.stopIdleAnimation(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        if ($sprite.subTweens.idleBounceTween){
            $sprite.subTweens.idleBounceTween.stop();
            delete $sprite.subTweens.idleBounceTween;
            }
        $sprite.stop();
        this.isAnimating = false;
        this.refreshSprite();
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
        if (this.kind === 'player'){ return this.runSpriteForward(callback, distance, elevation, duration); }
        else if (this.kind !== 'robot'){ return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.slideToDestination(distance, duration, callback); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let direction = this.direction;

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

        // Predefine the slide callback to run when everything is over
        let slideCallback = function(){
            if (!callback){ return; }
            return callback.call(_this, $sprite);
            };

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

        // Remove any existing slide timers or tweens and then create a new one
        // to facilitate the windup animation when sliding a character forward
        this.isMoving = true;
        this.isAnimating = true;
        this.setFrame('defend');
        if ($sprite.subTimers.slideAnimation){ $sprite.subTimers.slideAnimation.remove(); }
        $sprite.subTimers.slideAnimation = this.delayedCall(100, function(){
            this.setFrame('slide');
            _this.moveToPosition(newX, newY, slideDuration, function(){
                _this.delayedCall(100, function(){
                    this.setFrame('defend');
                    _this.delayedCall(200, function(){
                        _this.resetFrame();
                        _this.isMoving = false;
                        _this.isAnimating = false;
                        slideCallback.call(_this, $sprite);
                        });
                    });
                }, moveConfig);
            });

        // Return now that the slide has been started
        return;

    }

    // Start the run animation for this sprite and move it laterally across the screen given it's next direction
    // If distance is not set (X-axis), the sprite will travel proportionally to its energy stat or equivalent
    // If elevation is not set (Y-axis), the sprite will travel horizontally without any vertical movement
    // If duration is not set, the sprite will advance proportionally to its speed stat or equivalent
    runSpriteForward (callback, distance, elevation, duration)
    {
        //console.log('MMRPG_Object.runToDestination() called for ', this.kind, this.token, '\nw/ distance:', distance, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.kind === 'robot'){ return this.runSpriteForward(callback, distance, elevation, duration); }
        else if (this.kind !== 'player'){ return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.runToDestination(distance, duration, callback); }); }
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let direction = this.direction;

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

        // Predefine the run callback to run when everything is over
        let runCallback = function(){
            if (!callback){ return; }
            return callback.call(_this, $sprite);
            };

        // Predefine the move configuration for the animation
        let moveConfig = {
            easing: 'Sine.easeOut',
            };

        // Collect and play the appropriate animation for this run action
        let runKey = 'run';
        let runAnim = this.getSpriteAnim('sprite', runKey);
        this.resetFrame();
        //$sprite.play(runAnim);

        // Start the running bounce tween to make it look like they're properly stepping
        if ($sprite.subTweens.runBounceTween){ $sprite.subTweens.runBounceTween.stop(); }
        if (!newY){
            $sprite.subTweens.runBounceTween = scene.add.tween({
                targets: $sprite,
                y: '-='+config.scale,
                ease: 'Stepped',
                delay: 100,
                repeatDelay: 100,
                duration: 200,
                repeat: -1,
                yoyo: true
                });
            }

        // Remove any existing run timers or tweens and then create a new one
        // to facilitate the windup animation when sliding a character forward
        this.isMoving = true;
        this.isAnimating = true;
        this.setFrame('command');
        if ($sprite.subTimers.runAnimation){ $sprite.subTimers.runAnimation.remove(); }
        $sprite.subTimers.runAnimation = this.delayedCall(100, function(){
            $sprite.play(runAnim);
            _this.moveToPosition(newX, newY, runDuration, function(){
                _this.delayedCall(100, function(){
                    $sprite.stop();
                    this.setFrame('base2');
                    _this.delayedCall(200, function(){
                        _this.resetFrame();
                        _this.isMoving = false;
                        _this.isAnimating = false;
                        runCallback.call(_this, $sprite);
                        });
                    });
                }, moveConfig);
            });

        // Return now that the run has been started
        return;

    }

    // Move this sprite to a new position on the canvas and then execute the callback if provided
    moveToPosition (x = null, y = null, duration = 0, callback = null, moveConfig = {})
    {
        //console.log('MMRPG_Object.moveToPosition() called for ', this.kind, this.token, '\nw/ x:', x, 'y:', y, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (x && !y){ return this.moveToPositionX(x, duration, callback, moveConfig); }
        if (!x && y){ return this.moveToPositionY(y, duration, callback, moveConfig); }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.moveToPosition(x, y, duration, callback, moveConfig); }); }
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
        x = Math.round(Graphics.parseRelativePosition(x, config.x));
        y = Math.round(Graphics.parseRelativePosition(y, config.y));
        let [ modX, modY ] = this.getOffsetPosition(x, y);
        let [ finalX, finalY ] = [x, y];

        // If the duration was not set of was zero, move the sprite instantly
        if (!duration) {
            //console.log(_this.token + ' | moveToPosition() \n-> moving sprite instantly to x:', x, 'y:', y, 'modX:', modX, 'modY:', modY, 'finalX:', finalX, 'finalY:', finalY);
            _this.x = finalX;
            _this.y = finalY;
            config.x = finalX;
            config.y = finalY;
            $sprite.x = modX;
            $sprite.y = modY;
            $hitbox.x = modX;
            $hitbox.y = modY;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to the new position
        //console.log(_this.token + ' | moveToPosition() \n-> tweening sprite to x:', x, 'y:', y, 'modX:', modX, 'modY:', modY, 'finalX:', finalX, 'finalY:', finalY);
        let moveTween = scene.tweens.add({
            targets: $sprite,
            x: modX,
            y: modY,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                //console.log(_this.token + ' | moveToPosition() \n-> sprite tween to x:', x, 'y:', y, 'in progress...');
                let [ revModX, revModY ] = this.reverseOffsetPosition($sprite.x, $sprite.y);
                _this.x = revModX;
                _this.y = revModY;
                config.x = revModX;
                config.y = revModY;
                $hitbox.x = revModX;
                $hitbox.y = revModY;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => { // Use arrow function to preserve `this`
                //console.log(_this.token + ' | moveToPosition() \n-> sprite tween to x:', x, 'y:', y, 'completed!');
                _this.x = finalX;
                _this.y = finalY;
                config.x = finalX;
                config.y = finalY;
                $hitbox.x = finalX;
                $hitbox.y = finalY;
                _this.isMoving = false;
                _this.refreshSprite();
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
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.moveToPositionX(x, duration, callback, moveConfig); }); }
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
        x = Math.round(Graphics.parseRelativePosition(x, config.x));
        let modX = this.getOffsetPositionX(x);
        let finalX = x;

        // If the duration was not set of was zero, move the sprite instantly
        if (!duration) {
            _this.x = finalX;
            config.x = finalX;
            $sprite.x = modX;
            $hitbox.x = modX;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to
        let moveTween = scene.tweens.add({
            targets: $sprite,
            x: modX,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                let [ revModX, revModY ] = this.reverseOffsetPosition($sprite.x, $sprite.y);
                _this.x = revModX;
                config.x = revModX;
                $hitbox.x = revModX;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => { // Use arrow function to preserve `this`
                _this.x = finalX;
                config.x = finalX;
                $hitbox.x = finalX;
                _this.isMoving = false;
                _this.refreshSprite();
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
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.moveToPositionY(y, duration, callback, moveConfig); }); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;

        // If the sprite is already moving, stop it and move it to the new position
        this.stopMoving();

        // Parse any relative string values from the x and y to get rel values
        y = Math.round(Graphics.parseRelativePosition(y, config.y));
        let modY = this.getOffsetPositionY(y);
        let finalY = y;

        // Predefine some defaults for the move config
        moveConfig.easing  = moveConfig.easing || 'Linear';
        moveConfig.onUpdate = moveConfig.onUpdate || null;

        // If the duration was not set of was zero, move the sprite instantly
        if (!duration) {
            _this.y = finalY;
            config.y = finalY;
            $sprite.y = modY;
            $hitbox.y = modY;
            _this.refreshSprite();
            if (callback){ callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween
        let moveTween = scene.tweens.add({
            targets: $sprite,
            y: modY,
            duration: duration,
            ease: moveConfig.easing,
            onUpdate: () => {
                let [ revModX, revModY ] = this.reverseOffsetPosition($sprite.x, $sprite.y);
                _this.y = revModY;
                config.y = revModY;
                $hitbox.y = revModY;
                _this.isMoving = true;
                _this.refreshSprite();
                if (moveConfig.onUpdate){ moveConfig.onUpdate.call(_this, $sprite, moveTween); }
                },
            onComplete: () => { // Use arrow function to preserve `this`
                _this.y = finalY;
                config.y = finalY;
                $hitbox.y = finalY;
                _this.isMoving = false;
                _this.refreshSprite();
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
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.showDamage(amount, strength, callback); }); }
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let kind = this.kind;
        let xkind = this.xkind;
        let token = this.token;
        let direction = this.direction;
        damageConfig = damageConfig || {};
        damageConfig.color = damageConfig.color || '#ffffff';
        this.stopMoving();
        this.stopIdleAnimation();
        this.setFrame('damage');
        this.flashSprite(2);
        let shakeStrength = config.scale * 2;
        this.shakeSprite(shakeStrength, 2, function(){
            //console.log('-> shakeSprite callback');
            if (callback){ callback.call(_this); }
            });
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
        let damageTween = scene.tweens.addCounter({
            from: 100,
            to: 0,
            ease: 'Sine.easeOut',
            delay: 100,
            duration: 1000,
            onUpdate: function () {
                //console.log('damageTween:', damageTween.getValue());
                let alpha = damageTween.getValue() / 100;
                $damage.setAlpha(alpha);
                $damage.setPosition(null, '-=2');
                },
            onComplete: function () {
                //console.log('damageTween complete!');
                $damage.destroy();
                }
            });

    }

    // Define a function that "flashes" a sprite by changing it's tint back and forth a set amount of times
    flashSprite (repeat = 1, duration = 100, tintShift = true, callback = null)
    {
        //console.log('MMRPG_Object.flashSprite() called for ', this.kind, this.token, '\nw/ repeat:', repeat, 'duration:', duration);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.flashSprite(repeat, duration); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let flashRepeat = repeat;
        let flashDuration = duration;
        let flashCallback = function(){
            //console.log('-> flashCallback');
            _this.clearTint();
            if (callback){ callback.call(_this); }
            };
        if ($sprite.subTweens.flashTween){ $sprite.subTweens.flashTween.stop(); }
        let flashTween = this.scene.tweens.add({
            targets: $sprite,
            alpha: 0.5,
            duration: flashDuration,
            repeat: flashRepeat,
            yoyo: true,
            onComplete: flashCallback,
            onUpdate: function(){
                if (!tintShift){ return; }
                let progress = Math.round(flashTween.progress * 10);
                let alpha = $sprite.alpha;
                if (progress % 2 === 0){ _this.setTint('#000000'); }
                else { _this.setTint('#ffffff'); }
                }
            });
        $sprite.subTweens.flashTween = flashTween;
    }

    // Define a function that shakes a sprite back and forth once and then executes a callback
    shakeSprite (strength = 1, repeat = 1, callback)
    {
        //console.log('MMRPG_Object.shakeSprite() called for ', this.kind, this.token, '\nw/ strength:', strength, 'repeat:', repeat, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.shakeSprite(strength, callback); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let shake = strength || 1;
        let shakeX = shake * 2;
        let shakeY = shake * 2;
        let shakeDuration = 100;
        let shakeEase = 'Sine.easeInOut';
        let shakeRepeat = repeat;
        let shakeYoyo = true;
        let shakeCallback = function(){
            if (callback){ callback.call(_this); }
            };
        if ($sprite.subTweens.shakeTween){ $sprite.subTweens.shakeTween.stop(); }
        let shakeTween = this.scene.tweens.add({
            targets: $sprite,
            x: '+='+shakeX,
            y: '+='+shakeY,
            duration: shakeDuration,
            ease: shakeEase,
            repeat: shakeRepeat,
            yoyo: shakeYoyo,
            onComplete: shakeCallback
            });
        $sprite.subTweens.shakeTween = shakeTween;
    }

    // Stop a sprite's move animation whichever way it might have been going abruptly
    stopMoving ()
    {
        //console.log('MMRPG_Object.stopMoving() called for ', this.kind, this.token);
        let _this = this;
        if (!this.sprite) { return; }
        if (!this.isMoving){ return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.stopMoving(); }); }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        if ($sprite.subTweens.moveTween){
            //console.log('-> stopping moveTween');
            $sprite.subTweens.moveTween.stop();
            delete $sprite.subTweens.moveTween;
            }
        if ($sprite.subTimers.slideAnimation){
            //console.log('-> stopping slideAnimation');
            $sprite.subTimers.slideAnimation.remove();
            delete $sprite.subTimers.slideAnimation;
            }
        if ($sprite.subTimers.runAnimation){
            //console.log('-> stopping runAnimation');
            $sprite.subTimers.runAnimation.remove();
            delete $sprite.subTimers.runAnimation;
            }
        if ($sprite.subTweens.runBounceTween){
            //console.log('-> stopping runBounceTween');
            $sprite.subTweens.runBounceTween.stop();
            delete $sprite.subTweens.runBounceTween;
            }
        this.isMoving = false;
    }


    // -- SPRITE INTERACTIONS -- //

    // Make this sprite interactive by making the hitzone above it interactive (if not already done so)
    setInteractive ()
    {
        //console.log('MMRPG_Object.setInteractive() called');
        if (!this.sprite) { return; }
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
        if (!this.sprite) { return; }
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
        if (!this.sprite) { return; }
        let _this = this;
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
        if (!this.sprite) { return; }
        let _this = this;
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
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        $hitbox.removeAllListeners('pointerdown');
    }

    // Remove any hover events this sprite may have assigned to it
    removeOnHovers ()
    {
        //console.log('MMRPG_Object.removeOnHover() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        $hitbox.removeAllListeners('pointerover');
        $hitbox.removeAllListeners('pointerout');
    }


    // -- SPRITE DESTRUCTION -- //

    // Stop or halt any movement, animations, and callbacks for this object so we can destroy later
    stopAll (removeInteractivity = false)
    {
        //console.log('MMRPG_Object.halt() called for ', this.kind, this.token);
        let _this = this;
        let scene = this.scene;
        if (!this.sprite) { return; }
        let SPRITES = this.SPRITES;
        let $sprite = this.sprite;
        let $hitbox = this.spriteHitbox;
        this.stopMoving();
        this.stopIdleAnimation();
        this.spriteMethodsQueued = [];
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
        let $hitbox = this.spriteHitbox;
        if ($sprite) {
            SPRITES.destroySpriteAndCleanup(scene, $sprite);
            this.sprite = null;
            }
        if ($hitbox) {
            $hitbox.destroy();
            this.spriteHitbox = null;
            }

    }

}

export default MMRPG_Object;
