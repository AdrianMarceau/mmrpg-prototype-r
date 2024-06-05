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
    loadSprite (ctx, kind, token, alt = 'base')
    {
        //console.log('SpritesManager.loadSprite() called w/ \n kind: '+kind+', token: '+token+', alt: '+alt);

        // Pull in index references
        let SPRITES = this;
        let index = SPRITES.index;
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
        let altIsBase = alt === 'base' || alt === '1' || alt === 1 ? true : false;
        let pathToken = token === kind ? ('.' + kind) : token;
        let basePath = 'content/'+ xkind + '/' + pathToken + '/sprites' + (!altIsBase ? '_'+alt : '') + '/';
        let baseKey = 'sprites.' + xkind + '.' + token + '.' + alt;
        let spriteSize = spriteInfo.image_size || 40;
        let spriteSizeX = spriteSize+'x'+spriteSize;
        let spriteDirections = ['left', 'right'];
        index.prepForKeys(index.sizes, kind);
        index.sizes[kind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to index.sizes['+kind+']['+token+']')

        // Loop through each direction and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteDirections.length; i++){
            let direction = spriteDirections[i];

            // -- LOAD MAIN SPRITE SHEETS -- //

            // Define and register the key for this sprite sheet using direction, image, key, and path
            let sheetKey = baseKey+'.sprite-'+direction;
            let sheetToken = 'sprite-' + direction;
            index.prepForKeys(index.sheets, xkind, token, alt);
            index.sheets[xkind][token][alt][sheetToken] = sheetKey;
            //console.log('queued [ '+sheetKey+' ] to index.sheets['+xkind+']['+token+']['+alt+']['+sheetToken+']');

            // Define the relative image path for this sprite sheet
            let image = 'sprite_'+direction+'_'+spriteSizeX+'.png';
            let imagePath = basePath+image;
            index.prepForKeys(index.paths, xkind, token, alt);
            index.paths[xkind][token][alt][sheetToken] = imagePath;
            //console.log('queued [ '+imagePath+' ] to index.paths['+xkind+']['+token+']['+alt+']['+sheetToken+']');

            // Queue loading the sprite sheet into the game
            SPRITES.pendingSheets.push({
                key: sheetKey,
                path: imagePath,
                size: spriteSize,
                });

            // -- LOAD ICON SPRITE SHEETS -- //

            // Define and register the key for this icon sheet using direction, image, key, and path
            let iconPrefix = kind === 'player' || kind === 'robot' ? 'mug' : 'icon';
            let iconSheetKey = sheetKey.replace('sprites.', iconPrefix+'s.');
            let iconSheetToken = sheetToken.replace('sprite-', iconPrefix+'-');
            index.sheets[xkind][token][alt][iconSheetToken] = iconSheetKey;

            // Queue loading the icon sheet into the game
            let iconImage = iconPrefix+'_'+direction+'_'+spriteSizeX+'.png';
            let iconImagePath = basePath+iconImage;
            index.paths[xkind][token][alt][iconSheetToken] = iconImagePath;
            //console.log('queued [ '+iconImagePath+' ] to index.paths['+xkind+']['+token+']['+alt+']['+iconSheetToken+']');

            // Queue loading the icon sheet into the game
            SPRITES.pendingSheets.push({
                key: iconSheetKey,
                path: iconImagePath,
                size: spriteSize,
                });

            // -- DEFINE SPRITE ANIMATIONS -- //

            // Also create animations for this sprite depending on kind
            if (kind === 'player'){

                // Generate the running animation string for re-use later
                var anim = 'run';
                var animKey = sheetKey + '.' + anim;
                index.prepForKeys(index.anims, xkind, token, alt, sheetToken);
                index.anims[xkind][token][alt][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to index.anims['+xkind+']['+token+']['+alt+']['+sheetToken+']['+anim+']');

                // Queue the creation of a running animation for this sprite
                SPRITES.pendingAnims.push({
                    key: animKey,
                    sheet: sheetKey,
                    frames: [ 7, 8, 9 ],
                    frameRate: 6,
                    repeat: -1
                    });

                }
            else if (kind === 'robot'){

                // Generate the sliding animation string for re-use later
                var anim = 'slide';
                var animKey = sheetKey + '.' + anim;
                index.prepForKeys(index.anims, xkind, token, alt, sheetToken);
                index.anims[xkind][token][alt][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to index.anims['+xkind+']['+token+']['+alt+']['+sheetToken+']['+anim+']');

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
                index.prepForKeys(index.anims, xkind, token, alt, sheetToken);
                index.anims[xkind][token][alt][sheetToken][anim] = animKey;
                //console.log('queued [ '+animKey+' ] to index.anims['+xkind+']['+token+']['+alt+']['+sheetToken+']['+anim+']');

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

        //console.log('(end) index:', index);

    }

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

}