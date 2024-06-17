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
    constructor (scene, _kind, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Object.constructor() called w/ _kind:', _kind, 'token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(scene);

        // Pull in references to required global objects
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
        this.createData(indexInfo, customInfo);

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

            // Automatically create the sprite with the spriteConfig provided
            this.createSprite();

        }

    }

    // Generate internal data for this object given index info vs custom info provided at construction
    createData ()
    {
        //console.log('MMRPG_Object.createData() called w/ kind:', this.kind, 'token:', this.token, 'customInfo:', this.customInfo);

        // Pull in references to required global objects
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Start the data as a clone of the index info
        this.data = Object.assign({}, this.indexInfo);

        // Next, collect custom keys and loop through them, assigning values
        let customKeys = Object.keys(this.customInfo);
        for (let i = 0; i < customKeys.length; i++) {
            let key = customKeys[i];
            let value = this.customInfo[key];
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

        // Make sure we also create kind-specific data entries as-needed
        let directionalKinds = ['players', 'robots', 'abilities', 'items'];
        if (directionalKinds.indexOf(this.xkind) !== -1){

            // Add default values for image direction and size
            this.data.image_size = this.data.image_size || 40;
            this.data.image_width = this.data.image_width || this.data.image_size;
            this.data.image_height = this.data.image_height || this.data.image_size;

            // If this is a robot or player, add default values for the alt
            if (this.kind === 'robot' || this.kind === 'player') {
                this.data.image_alt = this.data.image_alt || 'base';
                }
            // If this is an ability or item, add default values for the sheet instead
            else if (this.kind === 'ability' || this.kind === 'item') {
                this.data.image_sheet = this.data.image_sheet || 1;
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

        //console.log('-> data:', this.data);

    }

    // Creates the main sprite for this object using known token and config values
    createSprite ()
    {
        //console.log('MMRPG_Object.createSprite() called for ', this.kind, this.token, '\nw/ config:', this.spriteConfig);

        // Update this object's x, y, z and props that may be accessed externally
        let _this = this;
        let scene = this.scene;
        let config = this.spriteConfig;
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

            // Pull in the sprite token and direction then use it to update the current sheet
            let spriteToken = this.data.token;
            let spriteDirection = this.direction || 'right';
            let spriteSheet = _this.getSpriteSheet(spriteToken, spriteDirection, 'sprite');
            //console.log('-> spriteToken:', spriteToken, 'spriteDirection:', spriteDirection, 'spriteSheet:', spriteSheet);
            config.sheet = spriteSheet;
            this.sheet = spriteSheet;

            // Create the sprite with the information we've collected when ready
            if (spriteSheet && scene.textures.exists(spriteSheet)) {

                // Texture is loaded, create sprite normally
                this.createObjectSprite();

                } else {

                // Texture is not loaded, create placeholder and load texture
                let tempAlt = (this.kind === 'player' || this.kind === 'robot') ? 'base' : 1;
                let tempKey = 'sprite-' + this.direction;
                let tempSheet = spriteSheets[this.kind][tempAlt][tempKey];
                this.spriteIsPlaceholder = true;
                this.createObjectSprite(tempSheet);
                this.loadSpriteTexture(spriteToken, spriteDirection, () => {
                    //console.log('%c' + '-> sprite texture '+spriteSheet+' loaded!', 'color: #00FF00');
                    _this.createObjectSprite();
                    delete _this.spriteIsPlaceholder;
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
        scene.load.spritesheet(spriteSheet, spritePath, { frameWidth: spriteWidth, frameHeight: spriteHeight });
        scene.load.once('complete', () => {
            if (onLoadCallback){ onLoadCallback.call(_this); }
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
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets);

        // Define the sprite key and sheet token given context
        spriteToken = spriteToken || this.data.image;
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spriteKey = spriteKind+'-'+spriteDirection;
        let spriteSheet, altToken, sheetNum;
        if (this.kind === 'robot' || this.kind === 'player'){
            altToken = this.data.image_alt || 'base';
            spriteSheet = spriteSheets[spriteToken][altToken][spriteKey];
            //console.log('-> altToken:', altToken, 'spriteSheet:', spriteSheet);
            } else if (this.kind === 'ability' || this.kind === 'item'){
            sheetNum = this.data.image_sheet || 1;
            spriteSheet = spriteSheets[spriteToken][sheetNum][spriteKey];
            //console.log('-> sheetNum:', sheetNum, 'spriteSheet:', spriteSheet);
            } else {
            spriteSheet = 'sprites.default';
            }

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
        //console.log('-> SPRITES:', SPRITES, 'spritePaths:', spritePaths);

        // Define the sprite key and sheet token given context
        spriteToken = spriteToken || this.data.image;
        //console.log('-> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteDirection:', spriteDirection);
        let spriteKey = spriteKind+'-'+spriteDirection;
        let spritePath, altToken, sheetNum;
        if (this.kind === 'robot' || this.kind === 'player'){
            altToken = this.data.image_alt || 'base';
            spritePath = spritePaths[spriteToken][altToken][spriteKey];
            //console.log('-> altToken:', altToken, 'spritePath:', spritePath);
            } else if (this.kind === 'ability' || this.kind === 'item'){
            sheetNum = this.data.image_sheet || 1;
            spritePath = spritePaths[spriteToken][sheetNum][spriteKey];
            //console.log('-> sheetNum:', sheetNum, 'spritePath:', spritePath);
            } else {
            spritePath = 'sprites.default';
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


    // Set a custom callback function to when when this sprite is clicked
    setOnClick (callback)
    {
        //console.log('MMRPG_Object.setOnClick() called w/ callback:', callback);
        if (!this.sprite) { return; }
        let _this = this;
        let $sprite = this.sprite;
        $sprite.setInteractive({ useHandCursor: true });
        $sprite.on('pointerdown', (pointer) => {
            callback.call(this, _this.sprite, pointer);
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
        $sprite.on('pointerover', (pointer) => {
            callback.call(_this, $sprite, pointer);
            });
        if (callback2) {
            $sprite.on('pointerout', (pointer) => {
                callback2.call(_this, $sprite, pointer);
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

    // Move this sprite to a new position on the canvas and then execute the callback if provided
    moveToPosition (x, y, duration = 1000, callback = null)
    {
        //console.log('MMRPG_Object.moveToPosition() called for ', this.kind, this.token, '\nw/ x:', x, 'y:', y, 'duration:', duration, 'callback:', typeof callback);
        if (!this.sprite) { return; }
        let _this = this;
        let scene = this.scene;
        let config = this.spriteConfig;
        let $sprite = this.sprite;

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
        scene.tweens.add({
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

    // Destroy this object's children and remove them from the scene and then itself
    destroy ()
    {
        //console.log('MMRPG_Object.destroy() called for ', this.kind, this.token);
        if (this.sprite) {
            this.sprite.destroy();
            delete this.sprite;
            }

        // Perform any additional cleanup if needed
        this.scene = null;

    }

}

export default MMRPG_Object;
