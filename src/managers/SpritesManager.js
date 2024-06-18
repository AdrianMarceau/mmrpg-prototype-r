// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: SpritesManager.js
// Sprite utility class for the MMRPG. This class is responsible for
// creating and managing interactive buttons in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import MMRPG_Player from '../objects/MMRPG_Player.js';
import MMRPG_Robot from '../objects/MMRPG_Robot.js';
import MMRPG_Ability from '../objects/MMRPG_Ability.js';
import MMRPG_Item from '../objects/MMRPG_Item.js';
import MMRPG_Field from '../objects/MMRPG_Field.js';
import MMRPG_Skill from '../objects/MMRPG_Skill.js';
import MMRPG_Type from '../objects/MMRPG_Type.js';

export default class SpritesManager {

    // Static method to get the singleton instance of this class
    static getInstance (scene)
    {
        //console.log('SpritesManager.getInstance() called');
        //console.log('MMRPG.Managers:', MMRPG.Managers);
        if (!MMRPG.Managers.SPRITES){ MMRPG.Managers.SPRITES = new SpritesManager(scene); }
        return MMRPG.Managers.SPRITES;
    }

    // Constructor for the SpritesManager class
    constructor(scene)
    {
        console.log('SpritesManager.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Initialize this manager via the global MMRPG object
        MMRPG.init('SpritesManager', 'Sprites');

        // Define some base sprite settings for the rest of the game
        let config = {
            baseSize: 40,
            };
        this.config = config;

        // Collect the sprites index from the global MMRPG object
        if (!MMRPG.Indexes.Sprites){ MMRPG.Indexes.Sprites = {}; }
        let index = MMRPG.Indexes.Sprites;

        // Predefine the different kinds of sprites we'll be working with
        if (typeof index.kinds === 'undefined'){
            index.kinds = ['player', 'robot', 'ability', 'item', 'skill', 'field', 'type'];
            }
        if (typeof index.xkinds === 'undefined'){
            index.xkinds = ['players', 'robots', 'abilities', 'items', 'skills', 'fields', 'types'];
            }
        let kinds = index.kinds;
        let xkinds = index.xkinds;

        // Predefine the different sub-indexes for paths, sheets, animations, etc.
        if (typeof index.sizes === 'undefined'){ index.sizes = {}; }
        if (typeof index.paths === 'undefined'){ index.paths = {}; }
        if (typeof index.sheets === 'undefined'){ index.sheets = {}; }
        if (typeof index.anims === 'undefined'){ index.anims = {}; }
        if (typeof index.tweens === 'undefined'){ index.tweens = {}; }
        for (let i = 0; i < kinds.length; i++){
            let kind = kinds[i];
            let xkind = xkinds[i];
            if (typeof index.sizes[xkind]){ index.sizes[xkind] = {}; }
            if (typeof index.paths[xkind]){ index.paths[xkind] = {}; }
            if (typeof index.sheets[xkind]){ index.sheets[xkind] = {}; }
            if (typeof index.anims[xkind]){ index.anims[xkind] = {}; }
            if (typeof index.tweens[xkind]){ index.tweens[xkind] = {}; }
            }

        // Predefine the function for prepping an path for a given index key
        if (typeof index.prepForKey === 'undefined'){
            index.prepForKeys = function(obj, ...keys) {
                let current = obj;
                keys.forEach(key => {
                    if (typeof current[key] === 'undefined') {
                        current[key] = {};
                        }
                    current = current[key];
                    });
                };
            }

        // Collect or define the sprites index from the global MMRPG object
        this.index = MMRPG.Indexes.Sprites;

        // Create a buffer for pending sheets, animations, etc.
        this.pendingSheets = [];
        this.pendingAnims = [];

    }
    init (scene)
    {
        this.scene = scene;
        scene.events.on('preload', this.preload, this);
        scene.events.on('create', this.create, this);
        scene.events.on('update', this.update, this);
    }

    preload ()
    {
        //console.log('SpritesManager.preload() called');
        /* ... */
    }
    create ()
    {
        //console.log('SpritesManager.create() called');
        /* ... */
    }
    update ()
    {
        //console.log('SpritesManager.update() called');
        /* ... */
    }

    // Load a sprite sheet for a specific kind of object into the game
    loadSprite (ctx, _kind, token, alt = 'base')
    {
        //console.log('SpritesManager.loadSprite() called w/ \n _kind: '+_kind+', token: '+token+', alt: '+alt);

        // Pull in index references
        let SPRITES = this;
        let scene = ctx.scene;
        let index = SPRITES.index;

        // Normalize the kind token to ensure they it's valid
        let [ kind, xkind ] = MMRPG.parseKind(_kind);
        //console.log('token:', token, 'kind:', kind, 'xkind:', xkind);

        // Create a new object to use for loading this sprite's assets and dat
        let $mmrpgObject;
        let customInfo = {};
        customInfo.image_alt = alt;
        if (kind === 'player'){ $mmrpgObject = new MMRPG_Player(scene, token, customInfo, null); }
        else if (kind === 'robot'){ $mmrpgObject = new MMRPG_Robot(scene, token, customInfo, null); }
        else if (kind === 'ability'){ $mmrpgObject = new MMRPG_Ability(scene, token, customInfo, null); }
        else if (kind === 'item'){ $mmrpgObject = new MMRPG_Item(scene, token, customInfo, null); }
        else if (kind === 'field'){ $mmrpgObject = new MMRPG_Field(scene, token, customInfo, null); }
        else if (kind === 'skill'){ $mmrpgObject = new MMRPG_Skill(scene, token, customInfo, null); }
        else if (kind === 'type'){ $mmrpgObject = new MMRPG_Type(scene, token, customInfo, null); }
        else { return false; }
        //console.log('$mmrpgObject = ', $mmrpgObject);

        // Load the sprite sheets for this object
        $mmrpgObject.loadSpriteSheets(true);
        $mmrpgObject.loadSpriteAnimations(true);

        // Delete the newly created object so it doesn't waste memory
        $mmrpgObject.destroy();
        $mmrpgObject = null;

        //console.log('(end) index:', index);

    }

    // Define a function for preloading all pending spritesheets and animations
    preloadPending (scene, callback)
    {
        // Loop through any pending spritesheets to load and do it now
        let SPRITES = this;
        if (!SPRITES.pendingSheets.length){ return; }
        let pendingSheets = SPRITES.pendingSheets;
        let queuedSheets = [];
        // Define the file complete event to track when all sheets are loaded
        scene.load.on('filecomplete', (file) => {
            //console.log('SpritesManager.preloadPending().filecomplete\n file:', file, '\n queuedSheets:', queuedSheets);
            //console.log('SpritesManager.preloadPending().filecomplete\n file:', file, '\n queuedSheets:', queuedSheets.length);
            var index = queuedSheets.indexOf(file);
            if (index == -1){ return; }
            queuedSheets.splice(index, 1);
            if (!queuedSheets.length){
                if (SPRITES.pendingAnims.length){ SPRITES.createPending(scene, callback, file); }
                else if (typeof callback === 'function'){ callback(scene); }
                }
            });
        // Now that setup is done, loop through the pending sheets and load them
        while (pendingSheets.length){
            let sheet = pendingSheets.shift();
            if (scene.textures.exists(sheet)){ continue; }
            //console.log('SpritesManager.preloadPending() loading sheet:', sheet);
            scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: sheet.size, frameHeight: sheet.size });
            queuedSheets.push(sheet.key);
            }
        //console.log('SpritesManager.preloadPending() queuedSheets:', queuedSheets);
    }

    // Define a function for actually creating all the pending animations
    createPending (scene, callback, sheet)
    {
        // Loop through any pending animations to create and do it now
        let SPRITES = this;
        if (!SPRITES.pendingAnims.length){ return; }
        let pendingAnims = SPRITES.pendingAnims;
        while (pendingAnims.length){
            // if the sheet was provided, skip if this one doesn't match
            //if (sheet && sheet.key !== pendingAnims[0].sheet){ continue; }
            // Collect the next animation to create
            let anim = pendingAnims.shift();
            if (scene.anims.get(anim.key)){ continue; }
            //console.log('SpritesManager.createPending() creating anim:', anim);
            scene.anims.create(Object.assign({}, anim, {
                key: anim.key,
                frames: scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames }),
                }));
            if (typeof callback === 'function'){ callback(scene); }
            }
    }

    // Define a function that takes a given sprite kind, token, and alt and then provides all the sheets and animation data
    getSpriteInfo (kind, token, alt = 'base')
    {
        //console.log('SpritesManager.getSpriteInfo() called w/ \n kind: '+kind+', token: '+token+', alt: '+alt);

        // Pull in index references
        let SPRITES = this;
        let spriteIndex = SPRITES.index;
        let spriteSheets = spriteIndex.sheets;
        let spriteAnims = spriteIndex.anims;
        let kinds = spriteIndex.kinds;
        let xkinds = spriteIndex.xkinds;

        // Normalize the kind token to ensure they it's valid
        let xkind = '';
        if (kinds.includes(kind)){
            xkind = xkinds[kinds.indexOf(kind)];
            } else if (xkinds.includes(kind)){
            xkind = kind;
            kind = kinds[xkinds.indexOf(xkind)];
            } else {
            return false;
            }
        //console.log('token:', token, 'kind:', kind, 'xkind:', xkind);

        // -- INFO TEMPLATE -- //

        // Put it all together info an object with appropriate references
        let spriteInfo = {
            'sprite': {
                'left': {
                    'sheet': spriteSheets[xkind][token][alt]['sprite-left'],
                    'anim': {},
                    },
                'right': {
                    'sheet': spriteSheets[xkind][token][alt]['sprite-right'],
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
                    'sheet': spriteSheets[xkind][token][alt]['mug-left'],
                    'anim': {},
                    },
                'right': {
                    'sheet': spriteSheets[xkind][token][alt]['mug-right'],
                    'anim': {},
                    },
                };

            }
        // Otherwise if any other type, we should include icons instead
        else {

            // Include the icon sheets for the ability, item, skill, field, etc.
            spriteInfo.icon = {
                'left': {
                    'sheet': spriteSheets[xkind][token][alt]['icon-left'],
                    'anim': {},
                    },
                'right': {
                    'sheet': spriteSheets[xkind][token][alt]['icon-right'],
                    'anim': {},
                    },
                };

            }

        // -- CHARACTER & OBJECT SPRITES -- //

        // If this is a player, make sure we include appropriate sheets and animations
        if (kind === 'player'){

            // Include the running animations for the player
            spriteInfo.sprite.left.anim.run = spriteAnims[xkind][token][alt]['sprite-left']['run'];
            spriteInfo.sprite.right.anim.run = spriteAnims[xkind][token][alt]['sprite-right']['run'];

            }
        // If this is a robot, make sure we include appropriate sheets and animations
        else if (kind === 'robot'){

            // Include the shooting animations for the robot
            spriteInfo.sprite.left.anim.shoot = spriteAnims[xkind][token][alt]['sprite-left']['shoot'];
            spriteInfo.sprite.right.anim.shoot = spriteAnims[xkind][token][alt]['sprite-right']['shoot'];

            // Include the sliding animations for the robot
            spriteInfo.sprite.left.anim.slide = spriteAnims[xkind][token][alt]['sprite-left']['slide'];
            spriteInfo.sprite.right.anim.slide = spriteAnims[xkind][token][alt]['sprite-right']['slide'];

            }

        // Return the compiled sprite info
        return spriteInfo;

    }


    // -- SPRITE DESTRUCTION FUNCTIONS -- //

    // Define a function for stopping any tweens attached to a given sprite
    stopSpriteTweens (ctx, $sprite, recursive = true)
    {
        //console.log('stopSpriteTweens() w/ $sprite:', $sprite, 'recursive:', recursive);
        if (!$sprite){ return; }
        //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

        // Pull in required references
        let SPRITES = this;

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
                SPRITES.stopSpriteTweens($subSprite);
                }
            }

        // Return true on success
        return true;

    }

    // Define a function for stopping any timers attached to a given sprite
    stopSpriteTimers (ctx, $sprite, recursive = true)
    {
        //console.log('stopSpriteTimers() w/ $sprite:', $sprite, 'recursive:', recursive);
        if (!$sprite){ return; }
        //console.log('$sprite', typeof $sprite, $sprite, ($sprite ? true : false));

        // Pull in required references
        let SPRITES = this;

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
                SPRITES.stopSpriteTimers($subSprite);
                }
            }

        // Return true on success
        return true;

    }

    // Define a function for disabling a robot sprite and hiding it from view until destruction
    destroySprite (ctx, $sprite, actuallyDestroy = true)
    {
        //console.log('disableRobotSprite() w/ $sprite:', $sprite);
        if (!$sprite){ return; }

        // Pull in required references
        let SPRITES = this;

        // Hide the sprite visually and set it to be destroyed
        $sprite.x = -9999;
        $sprite.y = -9999;
        $sprite.setAlpha(0);
        $sprite.setActive(false);
        $sprite.setVisible(false);
        $sprite.toBeDestroyed = true;

        // Stop any animation playing on this sprite itself
        if ($sprite.anims && $sprite.anims.stop){
            $sprite.anims.stop();
            }

        // Stop and destroy any tweens attached to this sprite
        SPRITES.stopSpriteTweens(ctx, $sprite, true);

        // Stop and destroy any timers attached to this sprite
        SPRITES.stopSpriteTimers(ctx, $sprite, true);

        // As long as we're allowed, actually destroy this sprite
        if (actuallyDestroy){

            // Now we can destroy this actual sprite
            //console.log('$sprite.destroy() from destroySprite()');
            $sprite.destroy();

            // Set the sprite equal to null to ensure it's not used again
            $sprite = null;

            }


        // If we're not actually destroying the sprite, return it now
        return $sprite;
    }

    // Define a function for destroying a sprite as well as any children from the scene
    destroySpriteAndCleanup (ctx, $sprite, recursive = true)
    {
        //console.log('destroySpriteAndCleanup() w/ $sprite:', typeof $sprite, ', recursive:', recursive);
        //console.log('$sprite starts as \ntypeof:' + typeof $sprite + ' and sprite:', $sprite, ($sprite ? true : false));
        if (!$sprite){ return; }

        // Pull in required references
        let SPRITES = this;

        // Save backup refs for children in case not recusive
        let $echo = {};
        $echo.subTweens = $sprite.subTweens || {};
        $echo.subTimers = $sprite.subTimers || {};
        $echo.subSprites = $sprite.subSprites || {};

        // First we "destroy" the sprite by fully hiding it
        SPRITES.destroySprite(ctx, $sprite, false);

        // Recursively destroy any sub-sprites attached to this one
        if (recursive && $echo.subSprites){
            let keys = Object.keys($echo.subSprites);
            for (let i = 0; i < keys.length; i++){
                let $subSprite = $echo.subSprites[keys[i]];
                if (!$subSprite.subSprites){ continue; }
                SPRITES.destroySpriteAndCleanup(ctx, $subSprite, recursive);
                }
            }

        // Now we can destroy this actual sprite
        //console.log('$sprite.destroy() from destroySpriteAndCleanup()');
        $sprite.destroy();

        // Set the sprite equal to null to ensure it's not used again
        $sprite = null;

        // leftover from DebugScene implementation (might re-use later)
        //this.debugRemovedSprites++;
        //delete this.debugSprites[$sprite.debugKey];

        // Return the backup refs for children in case not recusive
        //console.log('$sprite is now:', typeof $sprite, $sprite, ($sprite ? true : false));
        return $echo;

    }

}