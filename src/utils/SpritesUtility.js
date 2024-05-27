// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: Utilities.Sprites.js
// Sprite utility class for the MMRPG. This class is responsible for
// creating and managing interactive buttons in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class SpritesUtility {

    // Constructor for the PopupsUtility class
    constructor(scene)
    {
        console.log('SpritesUtility.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Collect or define the sprites index from the global MMRPG object
        if (typeof MMRPG.Indexes.SPRITES === 'undefined'){ MMRPG.Indexes.SPRITES = {}; }
        this.index = MMRPG.Indexes.SPRITES;
        let index = this.index;

        // Predefine the different kinds of sprites we'll be working with
        if (typeof index.kinds === 'undefined'
            || typeof index.xkinds === 'undefined'){
            let kinds = ['player', 'robot', 'ability', 'item', 'skill', 'field', 'type'];
            let xkinds = ['players', 'robots', 'abilities', 'items', 'skills', 'fields', 'types'];
            index.kinds = kinds;
            index.xkinds = xkinds;
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

        // Create a buffer for pending sheets, animations, etc.
        this.pendingSheets = [];
        this.pendingAnims = [];

        // Initialize this scene with a first-load callback function
        MMRPG.init('SpritesUtility', 'Sprites', function(){

            /* ... */

            });

    }

    preload (scene)
    {
        this.scene = scene;
        this.preloadPending(scene);
    }
    afterPreload (scene)
    {
        this.preloadPending(scene);
    }

    create (scene)
    {
        this.scene = scene;
        this.createPending(scene);
    }
    afterCreate (scene)
    {
        this.createPending(scene);
    }

    // Load a sprite sheet for a specific kind of object into the game
    loadSprite (ctx, kind, token, alt = 'base')
    {
        //console.log('SpritesUtility.loadSprite() called w/ \n kind: '+kind+', token: '+token+', alt: '+alt);

        // Pull in index references
        let index = this.index;
        let kinds = index.kinds;
        let xkinds = index.xkinds;

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

        // Predefine some base paths and keys
        let pathToken = token === kind ? ('.' + kind) : token;
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (alt !== 'base' ? '_'+alt : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + alt;
        let spriteSize = 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        if (typeof index.sizes[kind] === 'undefined'){ index.sizes[kind] = {}; }
        index.sizes[kind][token] = spriteSize;

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteDirections.length; i++){

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let direction = spriteDirections[i];
            let sheetKey = baseKey+'.'+direction;
            if (typeof index.sheets[xkind] === 'undefined'){ index.sheets[xkind] = {}; }
            if (typeof index.sheets[xkind][token] === 'undefined'){ index.sheets[xkind][token] = {}; }
            if (typeof index.sheets[xkind][token][alt] === 'undefined'){ index.sheets[xkind][token][alt] = {}; }
            index.sheets[xkind][token][alt][direction] = sheetKey;

            // Define the relative image path for this sprite sheet
            let image = 'sprite_'+direction+'_'+spriteSizeX+'.png';
            let imagePath = basePath+image;
            if (typeof index.paths[xkind] === 'undefined'){ index.paths[xkind] = {}; }
            if (typeof index.paths[xkind][token] === 'undefined'){ index.paths[xkind][token] = {}; }
            if (typeof index.paths[xkind][token][alt] === 'undefined'){ index.paths[xkind][token][alt] = {}; }
            index.paths[xkind][token][alt][direction] = imagePath;

            // Immediately load the sprite sheet into the game
            //ctx.load.spritesheet(sheetKey, imagePath, { frameWidth: spriteSize, frameHeight: spriteSize });
            this.pendingSheets.push({
                key: sheetKey,
                path: imagePath,
                size: spriteSize,
                });

            // Also create animations for this sprite depending on kind
            if (kind === 'player'){

                // Generate the running animation string for re-use later
                let runAnimKey = sheetKey + '.run';
                if (typeof index.anims[xkind] === 'undefined'){ index.anims[xkind] = {}; }
                if (typeof index.anims[xkind][token] === 'undefined'){ index.anims[xkind][token] = {}; }
                if (typeof index.anims[xkind][token][alt] === 'undefined'){ index.anims[xkind][token][alt] = {}; }
                if (typeof index.anims[xkind][token][alt][direction] === 'undefined'){ index.anims[xkind][token][alt][direction] = {}; }
                index.anims[xkind][token][alt][direction]['run'] = runAnimKey;

                // Immediately create the running animation for this sprite
                /* ctx.anims.create({ key: runAnimKey, frames: ctx.anims.generateFrameNumbers(sheetKey, { frames: [ 7, 8, 9 ] }), frameRate: 6, repeat: -1 }); */
                this.pendingAnims.push({
                    key: runAnimKey,
                    sheet: sheetKey,
                    //frames: ctx.anims.generateFrameNumbers(sheetKey, { frames: [ 7, 8, 9 ] }),
                    frames: [ 7, 8, 9 ],
                    frameRate: 6,
                    repeat: -1
                    });

                }

            }

    }

    preloadPending (scene)
    {
        // Loop through any pending spritesheets to load and do it now
        if (!this.pendingSheets.length){ return; }
        let pendingSheets = this.pendingSheets;
        while (pendingSheets.length){
            let sheet = pendingSheets.shift();
            if (scene.textures.exists(sheet)){ continue; }
            //console.log('SpritesUtility.preloadPending() loading sheet:', sheet);
            scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: sheet.size, frameHeight: sheet.size });
            }
    }

    createPending (scene)
    {
        // Loop through any pending animations to create and do it now
        if (!this.pendingAnims.length){ return; }
        let pendingAnims = this.pendingAnims;
        while (pendingAnims.length){
            let anim = pendingAnims.shift();
            if (scene.anims.get(anim.key)){ continue; }
            //console.log('SpritesUtility.createPending() creating anim:', anim);
            scene.anims.create(Object.assign({}, anim, {
                key: anim.key,
                frames: scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames }),
                }));
            }
    }

}