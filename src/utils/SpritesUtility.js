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

        // Predefine the different kinds of sprites we'll be working with
        let kinds = ['player', 'robot', 'ability', 'item', 'skill', 'field', 'type'];
        let xkinds = ['players', 'robots', 'abilities', 'items', 'skills', 'fields', 'types'];
        this.kinds = kinds;
        this.xkinds = xkinds;

        // Make sure we create required internal indexes for later population
        let sizes = {};
        let paths = {};
        let sheets = {};
        let anims = {};
        for (let i = 0; i < kinds.length; i++){
            sizes[xkinds[i]] = {};
            paths[xkinds[i]] = {};
            anims[xkinds[i]] = {};
            sheets[xkinds[i]] = {};
            }
        this.sizes = sizes;
        this.paths = paths;
        this.sheets = sheets;
        this.anims = anims;

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

        // Normalize the kind token to ensure they it's valid
        let xkind = '';
        if (this.kinds.includes(kind)){
            xkind = this.xkinds[this.kinds.indexOf(kind)];
            } else if (this.xkind.includes(kind)){
            xkind = kind;
            kind = this.kinds[this.xkind.indexOf(xkind)];
            } else {
            return false;
            }

        // Predefine some base paths and keys
        let basePath = 'content/'+xkind+'/'+token+'/sprites/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + alt;
        let spriteSize = 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        if (typeof this.sizes[kind] === 'undefined'){ this.sizes[kind] = {}; }
        this.sizes[kind][token] = spriteSize;

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteDirections.length; i++){

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let direction = spriteDirections[i];
            let sheetKey = baseKey+'.'+direction;
            if (typeof this.sheets[xkind] === 'undefined'){ this.sheets[xkind] = {}; }
            if (typeof this.sheets[xkind][token] === 'undefined'){ this.sheets[xkind][token] = {}; }
            if (typeof this.sheets[xkind][token][alt] === 'undefined'){ this.sheets[xkind][token][alt] = {}; }
            this.sheets[xkind][token][alt][direction] = sheetKey;

            // Define the relative image path for this sprite sheet
            let image = 'sprite_'+direction+'_'+spriteSizeX+'.png';
            let imagePath = basePath+image;
            if (typeof this.paths[xkind] === 'undefined'){ this.paths[xkind] = {}; }
            if (typeof this.paths[xkind][token] === 'undefined'){ this.paths[xkind][token] = {}; }
            if (typeof this.paths[xkind][token][alt] === 'undefined'){ this.paths[xkind][token][alt] = {}; }
            this.paths[xkind][token][alt][direction] = imagePath;

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
                if (typeof this.anims[xkind] === 'undefined'){ this.anims[xkind] = {}; }
                if (typeof this.anims[xkind][token] === 'undefined'){ this.anims[xkind][token] = {}; }
                if (typeof this.anims[xkind][token][alt] === 'undefined'){ this.anims[xkind][token][alt] = {}; }
                if (typeof this.anims[xkind][token][alt][direction] === 'undefined'){ this.anims[xkind][token][alt][direction] = {}; }
                this.anims[xkind][token][alt][direction]['run'] = runAnimKey;

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
            console.log('SpritesUtility.preloadPending() loading sheet:', sheet);
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
            if (scene.anims.get(anim)){ continue; }
            console.log('SpritesUtility.createPending() creating anim:', anim);
            scene.anims.create(Object.assign({}, anim, {
                key: anim.key,
                frames: scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames }),
                }));
            }
    }

}