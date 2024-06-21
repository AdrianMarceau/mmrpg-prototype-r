// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Object.js (class)
// This is the primitive class for all objects in the game.
// All objects in the game that pull from the content directory
// should extend this class. This class is designed to be extended
// by other classes, and it should not be used directly in-game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';

import SpritesManager from '../managers/SpritesManager.js';

class MMRPG_Object {

    // Define the class constructor for the object class
    constructor (scene, _kind, token, customInfo = {}, spriteConfig = {}, objectConfig = {})
    {
        //console.log('MMRPG_Object.constructor() called w/ _kind:', _kind, 'token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig, 'objectConfig:', objectConfig);

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(scene);

        // Pull in references to required global objects
        let _this = this;
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        //console.log('-> MMRPG:', MMRPG);

        // Parse the kind so we have both the kind and xkind
        let [kind, xkind] = MMRPG.parseKind(_kind);
        //console.log('-> kind:', kind, 'xkind:', xkind);

        // Define the properties of the object
        this.scene = scene;
        this.kind = kind;
        this.xkind = xkind;
        this.token = token;
        this.data = {};

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

        // If spriteConfig is provided, create a new sprite with it
        this.sprite = null;
        this.spriteConfig = {};
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
            spriteConfig.width = spriteConfig.width || this.data.image_width || this.data.image_size;
            spriteConfig.height = spriteConfig.height || this.data.image_height || this.data.image_size;
            spriteConfig.direction = spriteConfig.direction || 'right';
            spriteConfig.frame = spriteConfig.frame || 0;
            spriteConfig.sheet = spriteConfig.sheet || 'sprites.default';
            spriteConfig.origin = spriteConfig.origin || [0, 0];
            spriteConfig.alpha = spriteConfig.alpha || 1;
            spriteConfig.depth = spriteConfig.depth || 1;
            spriteConfig.scale = spriteConfig.scale || 1;
            spriteConfig.offsetX = spriteConfig.offsetX || 0;
            spriteConfig.offsetY = spriteConfig.offsetY || 0;
            if (SPRITES.config.baseSize){
                let baseSize = SPRITES.config.baseSize;
                if (spriteConfig.width > baseSize){ spriteConfig.offsetX = (spriteConfig.width - baseSize) / 2; }
                if (spriteConfig.height > baseSize){ spriteConfig.offsetY = (spriteConfig.height - baseSize); }
                spriteConfig.offsetX *= spriteConfig.scale;
                spriteConfig.offsetY *= spriteConfig.scale;
                }
            if (spriteConfig.frameAliases){
                this.spriteFrameAliases = spriteConfig.frameAliases;
                } else if (objectConfig.frameAliases){
                this.spriteFrameAliases = objectConfig.frameAliases;
                }

            // Automatically create the sprite with the spriteConfig provided
            this.createSprite();

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
        if (this.spriteIsLoading){
            this.spriteMethodsQueued.push(callback);
            } else {
            callback.call(this);
            }
    }


    // -- DATA CREATION -- //

    // Generate internal data for this object given index info vs custom info provided at construction
    createData ()
    {
        //console.log('MMRPG_Object.createData() called w/ kind:', this.kind, 'token:', this.token, 'customInfo:', this.customInfo);

        // Pull in references to required global objects
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let indexInfo = this.indexInfo;
        let customInfo = this.customInfo;
        let spriteConfig = this.spriteConfig;
        let objectConfig = this.objectConfig;
        //console.log('-> spriteConfig:', spriteConfig, 'objectConfig:', objectConfig);

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
        let isCharacter = (this.kind === 'player' || this.kind === 'robot');
        objectConfig.iconPrefix = objectConfig.iconPrefix || 'icon';
        objectConfig.baseAlt = objectConfig.baseAlt || 'base';
        objectConfig.baseSheet = objectConfig.baseSheet || 1;
        objectConfig.baseAltSheet = isCharacter ? objectConfig.baseAlt : objectConfig.baseSheet;
        objectConfig.currentAltSheet = (isCharacter ? this.data.image_alt : this.data.image_sheet) || objectConfig.baseAltSheet;
        objectConfig.currentAltSheetIsBase = objectConfig.currentAltSheet === 'base' || objectConfig.currentAltSheet === '1' || objectConfig.currentAltSheet === 1;
        //console.log(this.token + ' | -> objectConfig.currentAltSheet:', objectConfig.currentAltSheet, 'objectConfig.currentAltSheetIsBase:', objectConfig.currentAltSheetIsBase);

        // Precalculate this object's speed modifier values if relevant
        if (isCharacter){
            let baseVal = 100;
            let relSpeed = 1;
            let speedMod = 1;
            if (this.kind === 'player'){
                let simSpeed = (((100) + this.data.speed) - this.data.defense);
                relSpeed = (simSpeed / baseVal);
                speedMod = 1 + (1 - relSpeed);
                } else if (this.kind === 'robot'){
                let energy = this.data.energy || 100;
                let attack = this.data.attack || 100;
                let defense = this.data.defense || 100;
                let speed = this.data.speed || 100;
                let baseTotal = (energy + attack + defense + speed);
                baseVal = (baseTotal / 4);
                relSpeed = (speed / baseVal);
                speedMod = 1 + (1 - relSpeed);
                }
            relSpeed = Math.round(relSpeed * 10000) / 10000;
            speedMod = Math.round(speedMod * 10000) / 10000;
            this.data.relSpeed = relSpeed;
            this.data.speedMod = speedMod;
            }

        // Make sure we also create kind-specific data entries as-needed
        let directionalKinds = ['players', 'robots', 'abilities', 'items'];
        if (directionalKinds.indexOf(this.xkind) !== -1){

            // Add default values for image direction and size
            this.data.image_size = this.data.image_size || 40;
            this.data.image_width = this.data.image_width || this.data.image_size;
            this.data.image_height = this.data.image_height || this.data.image_size;

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
            this.data.image_width = this.data.image_width || 1124;
            this.data.image_height = this.data.image_height || 248;

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

    // Set a counter in the data object for this object
    setCounter (counter, value = 0)
    {
        //console.log('MMRPG_Object.setCounter() called w/ counter:', counter, 'value:', value);
        this.data.counters[counter] = value;
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

    // Decrease a counter in the data object for this object, (create at zero if not exists first)
    decCounter (counter, decrement = 1){ this.decreaseCounter(counter, decrement); }
    decreaseCounter (counter, decrement = 1)
    {
        //console.log('MMRPG_Object.decreaseCounter() called w/ counter:', counter, 'decrement:', decrement);
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

    // Creates the main sprite for this object using known token and config values
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
            this.queueSpriteSheets();
            this.queueSpriteAnimations();
            //console.log(this.token + ' | this.queueSpriteSheets();');
            //console.log(this.token + ' | this.queueSpriteAnimations();');
            //console.log(this.token + ' | SPRITES.pendingSheets.length:', SPRITES.pendingSheets.length);
            //console.log(this.token + ' | SPRITES.pendingAnims.length:', SPRITES.pendingAnims.length);

            // Pull in the sprite token and direction then use it to update the current sheet
            let spriteToken = this.data.token;
            let spriteDirection = this.direction || 'right';
            let spriteSheet = _this.getSpriteSheet(spriteToken, spriteDirection, 'sprite');
            //console.log(this.token + ' | -> spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteSheet:', spriteSheet);
            config.sheet = spriteSheet;
            this.sheet = spriteSheet;

            // Create the sprite with the information we've collected when ready
            if (spriteSheet && scene.textures.exists(spriteSheet)) {
                //console.log('sprite texture for ' + this.token + ' already exists');

                // Texture is loaded, create sprite normally
                this.spriteIsLoading = false;
                this.spriteIsPlaceholder = false;
                this.createObjectSprite();

                } else {
                //console.log('sprite texture for ' + this.token + ' does not exist');

                // Texture is not loaded, create placeholder and load texture
                let tempAlt = objectConfig.baseAltSheet;
                let tempKey = 'sprite-' + this.direction;
                let tempSheet = spriteSheets[this.kind][tempAlt][tempKey];
                this.spriteIsLoading = true;
                this.spriteIsPlaceholder = true;
                this.createObjectSprite(tempSheet);
                this.loadSpriteTexture(spriteToken, spriteDirection, () => {
                    //console.log('%c' + '-> sprite texture '+spriteSheet+' loaded!', 'color: #00FF00');
                    _this.createObjectSprite();
                    _this.spriteIsLoading = false;
                    _this.spriteIsPlaceholder = false;
                    });

                }

            }
        // Otherwise, if this is field, it's a much much bigger "sprite" without direction
        else if (this.kind === 'field') {

            // ...

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
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (!altIsBase ? '_'+altSheet : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + altSheet;
        let spriteSize = indexInfo.image_size || 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        spritesIndex.prepForKeys(spritesIndex.sizes, kind);
        spritesIndex.sizes[kind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to spritesIndex.sizes['+kind+']['+token+']')
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

    // Queue all of this sprite's animations into memory using the sprite mamager utility
    queueSpriteAnimations ()
    {
        //console.log('MMRPG_Object.queueSpriteAnimations() called for ', this.kind, this.token);

        // Pull in index references
        let _this = this;
        let scene = this.scene;
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
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (!altIsBase ? '_'+altSheet : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + altSheet;
        let spriteSize = indexInfo.image_size || 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        spritesIndex.prepForKeys(spritesIndex.sizes, kind);
        spritesIndex.sizes[kind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to spritesIndex.sizes['+kind+']['+token+']')

        // Loop through each direction and load the sprite sheet, making note of the sheet created
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

                // Generate the running animation string for re-use later
                var anim = 'run';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a running animation for this sprite
                SPRITES.pendingAnims.push({
                    key: animKey,
                    sheet: sheetKey,
                    frames: [ 7, 8, 9 ],
                    frameRate: 5,
                    repeat: -1
                    });

                }
            else if (kind === 'robot'){

                // Generate the idle animation string for re-use later
                var anim = 'idle';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                SPRITES.pendingAnims.push({
                    key: animKey,
                    sheet: sheetKey,
                    frames: [ 0, 1, 0, 8, 0, 1, 0, 10 ],
                    frameRate: 1,
                    repeat: -1
                    });

                // Generate the sliding animation string for re-use later
                var anim = 'slide';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                SPRITES.pendingAnims.push({
                    key: animKey,
                    sheet: sheetKey,
                    frames: [ 8, 7, 7, 7, 7, 7, 7, 8 ],
                    frameRate: 6,
                    repeat: 0
                    });

                // Generate the shooting animation string for re-use later
                var anim = 'shoot';
                var animKey = sheetKey + '.' + anim;
                spritesIndex.prepForKeys(spritesIndex.anims, xkind, token, altSheet, sheetToken);
                spritesIndex.anims[xkind][token][altSheet][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to spritesIndex.anims['+xkind+']['+token+']['+altSheet+']['+sheetToken+']['+anim+']');

                // Queue the creation of a sliding animation for this sprite
                SPRITES.pendingAnims.push({
                    key: animKey,
                    sheet: sheetKey,
                    frames: [ 8, 4, 4, 4, 4, 4, 4, 4 ],
                    frameRate: 6,
                    repeat: 0
                    });

                }

            }

        // Return when done
        return;

    }

    // Load a given sprite texture (sheet) into memory and optionally execute a callback when done
    loadSpriteTexture (token, direction, onLoadCallback)
    {
        //console.log('MMRPG_Object.loadSpriteTexture() called w/ token:', token, 'direction:', direction);
        let _this = this;
        let scene = this.scene;
        let SPRITES = this.SPRITES;
        let spritePathsIndex = SPRITES.index.paths[this.xkind];
        let spriteSheetsIndex = SPRITES.index.sheets[this.xkind];
        //console.log('-> SPRITES:', SPRITES, 'spritePathsIndex:', spritePathsIndex);
        let spriteSheet = _this.getSpriteSheet(token, direction, 'sprite');
        let spritePath = _this.getSpritePath(token, direction, 'sprite');
        let spriteWidth = this.data.image_width;
        let spriteHeight = this.data.image_height;
        //console.log('-> token:', token, 'direction:', direction, 'spriteSheet:', spriteSheet, 'spritePath:', spritePath, 'spriteWidth:', spriteWidth, 'spriteHeight:', spriteHeight);
        this.spriteIsLoading = true;
        SPRITES.preloadPending(scene);
        //scene.load.spritesheet(spriteSheet, spritePath, { frameWidth: spriteWidth, frameHeight: spriteHeight });
        scene.load.once('complete', () => {
            //console.log('-> loadSpriteTexture() complete for token:', token, 'direction:', direction, 'spriteSheet:', spriteSheet, 'spritePath:', spritePath, 'spriteWidth:', spriteWidth, 'spriteHeight:', spriteHeight);
            // DEBUG check if the texture and animations were loaded
            //let textureExists = scene.textures.exists(spriteSheet);
            //let spriteAnims = SPRITES.index.anims[this.xkind];
            //let spriteAnimsIndex = spriteAnims[this.token] || null;
            //let animationsExist = spriteAnimsIndex ? true : false;
            //console.log('-> textureExists:', textureExists);
            //console.log('-> animationsExist:', animationsExist, spriteAnimsIndex);
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

    // Determining and return the texture name (sheet) for an object given kind and direction (we already know the rest)
    getSpriteSheet (spriteToken, spriteDirection = 'right', spriteKind = 'sprite')
    {
        //console.log('MMRPG_Object.getSpriteSheet() called w/ spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteKind:', spriteKind);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteSheets = SPRITES.index.sheets[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets, 'objectConfig:', objectConfig);

        // Define the sprite key and sheet token given context
        spriteToken = spriteToken || this.data.image;
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spriteSheet;
        let spriteKey = spriteKind+'-'+spriteDirection;
        let spriteAltOrSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        if (typeof spriteSheets[spriteToken] !== 'undefined'
            && typeof spriteSheets[spriteToken][spriteAltOrSheet] !== 'undefined'
            && typeof spriteSheets[spriteToken][spriteAltOrSheet][spriteKey] !== 'undefined'){
            spriteSheet = spriteSheets[spriteToken][spriteAltOrSheet][spriteKey];
            } else {
            spriteSheet = 'sprites.default';
            }
        //console.log('-> spriteAltOrSheet:', spriteAltOrSheet, 'spriteSheet:', spriteSheet);

        // Return the sheet token we found
        return spriteSheet;

    }

    // Determine and return the texture path (sheet) for an object given kind and direction (we already know the rest)
    getSpritePath (spriteToken, spriteDirection = 'right', spriteKind = 'sprite')
    {
        //console.log('MMRPG_Object.getSpritePath() called w/ spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteKind:', spriteKind);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spritePaths = SPRITES.index.paths[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spritePaths:', spritePaths, 'objectConfig:', objectConfig);

        // Define the sprite key and sheet token given context
        spriteToken = spriteToken || this.data.image;
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spritePath;
        let spriteKey = spriteKind+'-'+spriteDirection;
        let spriteAltOrSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        if (typeof spritePaths[spriteToken] !== 'undefined'
            && typeof spritePaths[spriteToken][spriteAltOrSheet] !== 'undefined'
            && typeof spritePaths[spriteToken][spriteAltOrSheet][spriteKey] !== 'undefined'){
            spritePath = spritePaths[spriteToken][spriteAltOrSheet][spriteKey];
            } else {
            let size = this.data.image_size || 40;
            let xSize = size+'x'+size;
            spritePath = 'content/' + this.xkind + '/' + this.kind + '/' + spriteKind + '_' + spriteDirection +  '_' + xSize + '.png';
            }

        // Return the sheet token we found
        return spritePath;

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

    // Create the new object sprite with the sprite sheet provided, else default, and config settings
    createObjectSprite (spriteSheet = null)
    {
        //console.log('MMRPG_Object.createObjectSprite() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig, 'spriteSheet:', spriteSheet);
        this.prepareSprite(spriteSheet);
        this.updateSpriteGraphics();
        this.updateSpriteProperties();
    }

    // Update the existing sprite with any changes that have been made to the spriteConfig object
    updateSpriteGraphics ()
    {
        //console.log('MMRPG_Object.updateSpriteGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        $sprite.setPosition(modX, modY);
        $sprite.setDepth(config.depth + config.z);
        $sprite.setOrigin(config.origin[0], config.origin[1]);
        $sprite.setAlpha(config.alpha);
        $sprite.setScale(config.scale);
        $sprite.setFrame(config.frame);
        if (config.tint) { $sprite.setTint(config.tint); }
        $sprite.setTexture(config.sheet);
    }

    // Update the objects public properties with the current sprite settings for those that might be accessed externally
    updateSpriteProperties ()
    {
        //console.log('MMRPG_Object.updateSpriteProperties() called for ', this.kind, this.token);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        this.x = $sprite.x;
        this.y = $sprite.y;
        this.z = $sprite.depth;
        this.width = $sprite.width;
        this.height = $sprite.height;
        this.direction = this.direction;
        this.origin = $sprite.origin;
        this.alpha = $sprite.alpha;
        this.depth = $sprite.depth;
    }

    // -- SPRITE MANIPULATION -- //

    // Set the alpha property of the object's sprite and update the spriteConfig
    setAlpha (alpha)
    {
        //console.log('MMRPG_Object.setAlpha() called w/ alpha:', alpha);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.alpha = alpha;
        this.alpha = alpha;
        $sprite.setAlpha(this.alpha);
    }

    // Set the tint property of the object's sprite and update the spriteConfig
    setTint (tint)
    {
        //console.log('MMRPG_Object.setTint() called w/ tint:', tint);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        config.tint = tint;
        this.tint = tint;
        $sprite.setTint(this.tint);
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

    }

    // Set the position of this object's sprite and update the spriteConfig
    setPosition (x, y)
    {
        //console.log('MMRPG_Object.setPosition() called w/ x:', x, 'y:', y);
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        x = Graphics.parseRelativePosition(x, config.x);
        y = Graphics.parseRelativePosition(y, config.y);
        config.x = x;
        config.y = y;
        this.x = x;
        this.y = y;
        let [ modX, modY ] = this.getOffsetPosition(x, y);
        $sprite.setPosition(modX, modY);
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
        config.frame = frame;
        this.frame = frame;
        $sprite.setFrame(frame);

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
        this.updateSpriteGraphics();
        this.updateSpriteProperties();

        // Now we check to see which sheet goes with this direction, if any, and reload it if needed when ready
        let newSheet = _this.getSpriteSheet(this.data.token, direction, 'sprite');
        if (!newSheet || (config.sheet === newSheet && this.sheet === newSheet)) { return; }
        if (!scene.textures.exists(newSheet)){
            //console.log('-> sprite texture '+newSheet+' not loaded, deffering sheet change...');
            this.loadSpriteTexture(this.data.token, direction, () => {
                //console.log('%c' + '-> sprite texture '+newSheet+' loaded!', 'color: #00FF00');
                config.sheet = newSheet;
                this.sheet = newSheet;
                this.updateSpriteGraphics();
                this.updateSpriteProperties();
                });
            } else {
            //console.log('-> sprite texture '+newSheet+' already loaded, changing sheet now...');
            config.sheet = newSheet;
            this.sheet = newSheet;
            this.updateSpriteGraphics();
            this.updateSpriteProperties();
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
        const startBouncing = function(){
            // Animate the doctor bouncing up and down as they walk forward
            let speed;
            let data = this.data;
            if (_this.kind === 'player'){ speed = (((100) + data.speed) - data.defense); }
            else { speed = data.speed; }
            let speedMod = speed / 100;
            //console.log('-> speed:', speed, 'speedMod:', speedMod);
            let spriteY = $sprite.y;
            $sprite.subTweens.idleBounceTween = scene.add.tween({
                targets: $sprite,
                y: {from: spriteY, to: spriteY - 2},
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
        if (bounce){ startBouncing.call(_this); }
        if (emote){ startEmoting.call(_this); }
        this.isAnimating = true;
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
    }

    // Move this sprite to a new position on the canvas and then execute the callback if provided
    moveToPosition (x, y, duration = 1000, callback = null)
    {
        //console.log('MMRPG_Object.moveToPosition() called for ', this.kind, this.token, '\nw/ x:', x, 'y:', y, 'duration:', duration, 'callback:', typeof callback);
        let _this = this;
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.moveToPosition(x, y, duration, callback); }); }
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;

        // If the sprite is already moving, stop it and move it to the new position instantly
        if ($sprite.subTweens.moveTween){
            $sprite.subTweens.moveTween.stop();
            delete $sprite.subTweens.moveTween;
            }

        // Parse any relative string values from the x and y to get rel values
        x = Graphics.parseRelativePosition(x, config.x);
        y = Graphics.parseRelativePosition(y, config.y);

        // If the duration was not set of was zero, move the sprite instantly
        if (!duration) {
            config.x = x;
            config.y = y;
            _this.x = x;
            _this.y = y;
            $sprite.x = x;
            $sprite.y = y;
            if (callback) { callback.call(_this, $sprite); }
            return;
            }

        // Otherwise we create a tween to move the sprite to the new position
        let [ modX, modY ] = this.getOffsetPosition(x, y);
        $sprite.subTweens.moveTween = scene.tweens.add({
            targets: $sprite,
            x: modX,
            y: modY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                config.x = $sprite.x;
                config.y = $sprite.y;
                _this.x = $sprite.x;
                _this.y = $sprite.y;
                _this.isMoving = true;
                },
            onComplete: () => { // Use arrow function to preserve `this`
                config.x = $sprite.x;
                config.y = $sprite.y;
                _this.x = $sprite.x;
                _this.y = $sprite.y;
                _this.isMoving = false;
                if (!callback) { return; }
                callback.call(_this, $sprite);
                },
            });

    }


    // -- SPRITE INTERACTIONS -- //

    // Set a custom callback function to when when this sprite is clicked
    setOnClick (callback)
    {
        //console.log('MMRPG_Object.setOnClick() called w/ callback:', callback);
        if (!this.sprite) { return; }
        let _this = this;
        let $sprite = this.sprite;
        $sprite.setInteractive({ useHandCursor: true });
        $sprite.on('pointerdown', (pointer, localX, localY) => {
            callback.call(this, _this.sprite, pointer, localX, localY);
            });
    }

    // Set a custom callback function for when this sprite is hovered over and then, optionally, hovered away from
    setOnHover (callback, callback2 = null)
    {
        //console.log('MMRPG_Object.setOnHover() called w/ callback:', callback, 'callback2:', callback2);
        if (!this.sprite) { return; }
        let _this = this;
        let $sprite = this.sprite;
        $sprite.setInteractive({ useHandCursor: true });
        $sprite.on('pointerover', (pointer, localX, localY) => {
            callback.call(_this, $sprite, pointer, localX, localY);
            });
        if (callback2) {
            $sprite.on('pointerout', (pointer, localX, localY) => {
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
        $sprite.removeAllListeners('pointerdown');
    }

    // Remove any hover events this sprite may have assigned to it
    removeOnHovers ()
    {
        //console.log('MMRPG_Object.removeOnHover() called');
        if (!this.sprite) { return; }
        let $sprite = this.sprite;
        $sprite.removeAllListeners('pointerover');
        $sprite.removeAllListeners('pointerout');
    }


    // -- SPRITE DESTRUCTION -- //

    // Destroy this object's children and remove them from the scene and then itself
    destroy ()
    {
        //console.log('MMRPG_Object.destroy() called for ', this.kind, this.token);
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let $sprite = this.sprite;
        if ($sprite) {
            SPRITES.destroySpriteAndCleanup(scene, $sprite);
            delete this.sprite;
            }

        // Perform any additional cleanup if needed
        this.scene = null;

    }

}

export default MMRPG_Object;
