// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: SpritesManager.js
// Sprite utility class for the MMRPG. This class is responsible for
// creating and managing interactive buttons in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class SpritesManager {

    // Constructor for the SpritesManager class
    constructor(scene)
    {
        console.log('SpritesManager.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Initialize this scene with a first-load callback function
        MMRPG.init('SpritesManager', 'Sprites', function(){

            // Collect the sprites index from the global MMRPG object
            let index = MMRPG.Indexes.Sprites;
            //console.log('index:', index);

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

            });

        // Collect or define the sprites index from the global MMRPG object
        this.index = MMRPG.Indexes.Sprites;

        // Create a buffer for pending sheets, animations, etc.
        this.pendingSheets = [];
        this.pendingAnims = [];

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
        //console.log('SpritesManager.loadSprite() called w/ \n kind: '+kind+', token: '+token+', alt: '+alt);

        // Pull in index references
        let index = this.index;
        let kinds = index.kinds;
        let xkinds = index.xkinds;
        //console.log('(start) index:', index);

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

        // Collect info for the sprite given the kind it is
        //console.log('MMRPG.Indexes:', MMRPG.Indexes);
        //console.log('MMRPG.Indexes['+xkind+']:', MMRPG.Indexes[xkind]);
        let spriteInfo = MMRPG.Indexes[xkind][token] || {};
        //console.log('spriteInfo for xkind:', xkind, 'token:', token, ' =', spriteInfo);

        // Predefine some base paths and keys
        let pathToken = token === kind ? ('.' + kind) : token;
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (alt !== 'base' ? '_'+alt : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + alt;
        let spriteSize = spriteInfo.image_size || 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        index.prepForKeys(index.sizes, kind);
        index.sizes[kind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to index.sizes['+kind+']['+token+']')

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteDirections.length; i++){

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let direction = spriteDirections[i];
            let sheetKey = baseKey+'.'+direction;
            index.prepForKeys(index.sheets, xkind, token, alt);
            index.sheets[xkind][token][alt][direction] = sheetKey;
            //console.log('queued [ '+sheetKey+' ] to index.sheets['+xkind+']['+token+']['+alt+']['+direction+']');

            // Define the relative image path for this sprite sheet
            let image = 'sprite_'+direction+'_'+spriteSizeX+'.png';
            let imagePath = basePath+image;
            index.prepForKeys(index.paths, xkind, token, alt);
            index.paths[xkind][token][alt][direction] = imagePath;
            //console.log('queued [ '+imagePath+' ] to index.paths['+xkind+']['+token+']['+alt+']['+direction+']');

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
                let anim = 'run';
                let runAnimKey = sheetKey + '.' + anim;
                index.prepForKeys(index.anims, xkind, token, alt, direction);
                index.anims[xkind][token][alt][direction][anim] = runAnimKey;
                //console.log('queued [ '+runAnimKey+' ] to index.anims['+xkind+']['+token+']['+alt+']['+direction+']['+anim+']');

                // Immediately create the running animation for this sprite
                /* ctx.anims.create({ key: runAnimKey, frames: ctx.anims.generateFrameNumbers(sheetKey, { frames: [ 7, 8, 9 ] }), frameRate: 6, repeat: -1 }); */

                // Queue the creation of a running animation for this sprite
                this.pendingAnims.push({
                    key: runAnimKey,
                    sheet: sheetKey,
                    frames: [ 7, 8, 9 ],
                    frameRate: 6,
                    repeat: -1
                    });

                }
            else if (kind === 'robot'){

                // Generate the sliding animation string for re-use later
                let slideAnimKey = sheetKey + '.slide';
                index.prepForKeys(index.anims, xkind, token, alt, direction);
                index.anims[xkind][token][alt][direction]['slide'] = slideAnimKey;
                //console.log('queued [ '+slideAnimKey+' ] to index.anims['+xkind+']['+token+']['+alt+']['+direction+']');

                // Immediately create the slidening animation for this sprite
                /* ctx.anims.create({ key: slideAnimKey, frames: ctx.anims.generateFrameNumbers(sheetKey, { frames: [ 7, 8, 9 ] }), frameRate: 6, repeat: -1 }); */

                // Queue the creation of a sliding animation for this sprite
                this.pendingAnims.push({
                    key: slideAnimKey,
                    sheet: sheetKey,
                    frames: [ 8, 7, 7, 7, 7, 7, 7, 8 ],
                    frameRate: 6,
                    repeat: 0
                    });

                }

            }

        //console.log('(end) index:', index);

    }

    preloadPending (scene)
    {
        // Loop through any pending spritesheets to load and do it now
        if (!this.pendingSheets.length){ return; }
        let pendingSheets = this.pendingSheets;
        while (pendingSheets.length){
            let sheet = pendingSheets.shift();
            if (scene.textures.exists(sheet)){ continue; }
            //console.log('SpritesManager.preloadPending() loading sheet:', sheet);
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
            //console.log('SpritesManager.createPending() creating anim:', anim);
            scene.anims.create(Object.assign({}, anim, {
                key: anim.key,
                frames: scene.anims.generateFrameNumbers(anim.sheet, { frames: anim.frames }),
                }));
            }
    }

}