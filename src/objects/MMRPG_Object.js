// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Object.js (class)
// This is the primitive class for all objects in the game.
// All objects in the game that pull from the content directory
// should extend this class. This class is designed to be extended
// by other classes, and it should not be used directly in-game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import SpritesManager from '../managers/SpritesManager.js';

class MMRPG_Object {

    // Define the class constructor for the object class
    constructor (scene, _kind, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Object.constructor() called w/ _kind:', _kind, 'token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Initialize MMRPG utility class objects
        let SPRITES = scene.SPRITES || new SpritesManager(scene);

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
        this.spriteFrames = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'];
        this.spriteFrameAliases = [];
        if (spriteConfig) {

            // If the sprite config was not an object, just true, make it an object
            if (typeof spriteConfig !== 'object'){ spriteConfig = {}; }

            // Predefine spriteConfig properties to avoid errors
            spriteConfig.x = spriteConfig.x || 0;
            spriteConfig.y = spriteConfig.y || 0;
            spriteConfig.z = spriteConfig.z || 0;
            spriteConfig.width = spriteConfig.width || this.data.image_width;
            spriteConfig.height = spriteConfig.height || this.data.image_height;
            spriteConfig.origin = spriteConfig.origin || [0, 0];
            spriteConfig.alpha = spriteConfig.alpha || 1;
            spriteConfig.depth = spriteConfig.depth || 1;
            spriteConfig.scale = spriteConfig.scale || 1;

            // Automatically create the sprite with the spriteConfig provided
            this.createSprite(spriteConfig);

        }

    }

    // Define a function to run at object creation that generates internal data given index info vs custom info
    createData ()
    {
        //console.log('MMRPG_Object.createData() called w/ kind:', this.kind, 'token:', this.token, 'customInfo:', this.customInfo);

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
            this.data.image_dir = this.data.image_dir || 'right';
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

    // Define a function that creates a sprite for the object using known token and config
    createSprite (config)
    {
        //console.log('MMRPG_Object.createSprite() called w/ kind:', this.kind, 'token:', this.token, 'config:', config);

        // Update this object's x, y, z and props that may be accessed externally
        this.x = config.x;
        this.y = config.y;
        this.z = config.z;
        this.width = config.width;
        this.height = config.height;
        this.origin = config.origin;
        this.alpha = config.alpha;
        this.depth = config.depth;
        this.scale = config.scale;

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteSheets = SPRITES.index.sheets[this.xkind];
        let spriteAnims = SPRITES.index.anims[this.xkind];
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets, 'spriteAnims:', spriteAnims);

        // Sprites with directional logic are drawn differently then others
        let directionalKinds = ['players', 'robots', 'abilities', 'items'];
        if (directionalKinds.indexOf(this.xkind) !== -1){
            //console.log('-> this is a directional kind! xkind:', this.xkind, ' of ['+directionalKinds.join(', ')+']');

            // Pull in the sprite token and direction
            let spriteToken = this.data.token;
            let spriteDirection = this.data.image_dir || 'right';
            //console.log('-> spriteToken:', spriteToken, 'spriteDirection:', spriteDirection);

            // Define the sprite key and sheet token given context
            let spriteKey = 'sprite-'+spriteDirection;
            let spriteSheet, altToken, sheetNum;
            if (this.kind === 'robot' || this.kind === 'player'){
                altToken = this.data.image_alt || 'base';
                spriteSheet = spriteSheets[spriteToken][altToken][spriteKey];
                //console.log('-> altToken:', altToken, 'spriteSheet:', spriteSheet);
                } else if (this.kind === 'ability' || this.kind === 'item'){
                sheetNum = this.data.image_sheet || 1;
                spriteSheet = spriteSheets[spriteToken][sheetNum][spriteKey];
                //console.log('-> sheetNum:', sheetNum, 'spriteSheet:', spriteSheet);
                }

            // Create the sprite with the information we've collected
            this.sprite = this.scene.add.sprite(config.x, config.y, spriteSheet);
            this.sprite.setDepth(config.depth + config.z);
            this.sprite.setDisplaySize(config.width, config.height);
            this.sprite.setOrigin(config.origin[0], config.origin[1]);
            this.sprite.setAlpha(config.alpha);
            this.sprite.setScale(config.scale);
            if (config.tint){ this.sprite.setTint(config.tint); }

            // Update the sprite's position and bounds to match the new object
            this.x = this.sprite.x;
            this.y = this.sprite.y;
            this.z = this.sprite.depth;
            this.width = this.sprite.width;
            this.height = this.sprite.height;
            this.origin = this.sprite.origin;
            this.alpha = this.sprite.alpha;
            this.depth = this.sprite.depth;

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

    setAlpha (alpha)
    {
        //console.log('MMRPG_Object.setAlpha() called w/ alpha:', alpha);
        if (!this.sprite) { return; }
        this.sprite.setAlpha(alpha);
    }

    setTint (tint)
    {
        //console.log('MMRPG_Object.setTint() called w/ tint:', tint);
        if (!this.sprite) { return; }
        this.sprite.setTint(tint);
    }

    setPosition (x, y)
    {
        //console.log('MMRPG_Object.setPosition() called w/ x:', x, 'y:', y);
        if (!this.sprite) { return; }
        this.sprite.setPosition(x, y);
    }

    setFrame (frame)
    {
        //console.log('MMRPG_Object.setFrame() called w/ frame:', frame);
        if (!this.sprite) { return; }
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
        this.sprite.setFrame(frame);

    }

    resetFrame()
    {
        //console.log('MMRPG_Object.resetFrame() called');
        if (!this.sprite) { return; }
        this.sprite.setFrame(0);
    }

    setOnClick (callback)
    {
        //console.log('MMRPG_Object.setOnClick() called w/ callback:', callback);
        if (!this.sprite) { return; }
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.on('pointerdown', (pointer) => {
            callback.call(this, this.sprite, pointer);
            });
    }

    setOnHover (callback, callback2 = null)
    {
        //console.log('MMRPG_Object.setOnHover() called w/ callback:', callback, 'callback2:', callback2);
        if (!this.sprite) { return; }
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.on('pointerover', (pointer) => {
            callback.call(this, this.sprite, pointer);
            });
        if (callback2) {
            this.sprite.on('pointerout', (pointer) => {
                callback2.call(this, this.sprite, pointer);
                });
            }
    }

    moveToPosition (x, y, duration = 1000, callback = null)
    {
        //console.log('MMRPG_Object.moveToPosition() called w/ x:', x, 'y:', y, 'duration:', duration, 'callback:', callback);
        if (!this.sprite) { return; }
        this.scene.tweens.add({
            targets: this.sprite,
            x: x,
            y: y,
            duration: duration,
            ease: 'Linear',
            onComplete: () => { // Use arrow function to preserve `this`
                if (!callback) { return; }
                callback.call(this, this.sprite);
                }
            });
    }

}

export default MMRPG_Object;
