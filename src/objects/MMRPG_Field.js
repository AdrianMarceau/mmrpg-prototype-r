// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Item.js (class)
// This is the primitive class for all item objects in the game.
// All item objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Field extends MMRPG_Object {

    // Define the class constructor for the field class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Field.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Predefine object configurations unique to the field class
        let objectConfig = {};
        objectConfig.baseSize = [1124, 248];

        // Predefine sprite configurations unique to the field
        spriteConfig = spriteConfig || {};
        spriteConfig.showPreview = spriteConfig.showPreview || false;
        spriteConfig.showBackground = spriteConfig.showBackground || true;
        spriteConfig.showForeground = spriteConfig.showForeground || true;
        spriteConfig.showAvatar = spriteConfig.showAvatar || false;

        // Call the parent constructor
        super(scene, 'field', token, customInfo, spriteConfig, objectConfig);

        // Add field-specific properties here
        // ...

    }

    // Queue all of this sprite's sheets unique to field objects into the memory using the sprite manager utility
    queueSpriteSheets ()
    {
        //console.log('MMRPG_Field.queueSpriteSheets() called for ', this.kind, this.token);

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
        //let altSheet = objectConfig.currentAltSheet || objectConfig.baseAltSheet;
        //let altIsBase = objectConfig.currentAltSheetIsBase ? true : false;
        //let backgroundSheet = this.data.background_variant || 'base';
        //let foregroundSheet = this.data.foreground_variant || 'base';
        let pathToken = token === kind ? ('.' + kind) : token;
        let contentPath = MMRPG.paths.content;
        let basePath = contentPath + xkind + '/' + pathToken + '/sprites/';
        let baseKey = 'sprites.' + xkind + '.' + token;
        let spriteKinds = ['background', 'foreground', 'preview', 'avatar'];
        let spriteSize = objectConfig.baseSize[0];
        let avatarSize = objectConfig.baseAvatarSize || 100;
        spritesIndex.prepForKeys(spritesIndex.sizes, xkind);
        spritesIndex.sizes[xkind][token] = spriteSize;
        //console.log('queued [ '+spriteSize+' ] to spritesIndex.sizes['+xkind+']['+token+']')
        //console.log(this.token + ' | -> pathToken:', pathToken, 'basePath:', basePath, 'baseKey:', baseKey);

        // Loop through each kind and load the sprite sheet, making note of the sheet created
        for (let i = 0; i < spriteKinds.length; i++){
            let spriteKind = spriteKinds[i];

            // -- LOAD MAIN SPRITE SHEETS -- //

            // examples: battle-field_background_base.png, battle-field_foreground_base.png, battle-field_foreground_base_cool-variant.png,
            if (spriteKind === 'background' || spriteKind === 'foreground'){

                // Define and register the key for this sprite sheet using kind, image, key, and path
                let sheetVariant = this.data[spriteKind+'_variant'] || 'base';
                let sheetKey = baseKey + '.' + spriteKind + '.' + sheetVariant;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, sheetToken);
                spritesIndex.sheets[xkind][token][sheetToken][sheetVariant] = sheetKey;
                //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + '_base' + (sheetVariant !== 'base' ? ('_' + sheetVariant) : '') + '.png';
                let imagePath = basePath + image;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, sheetToken);
                spritesIndex.paths[xkind][token][sheetToken][sheetVariant] = imagePath;
                //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Queue loading the sprite sheet into the game
                let pendingSheet = {
                    key: sheetKey,
                    path: imagePath,
                    size: spriteSize,
                    width: objectConfig.baseSize[0],
                    height: objectConfig.baseSize[1],
                    };
                //console.log('SPRITES.pendingSheets.push() w/', pendingSheet);
                SPRITES.pendingSheets.push(pendingSheet);

                }
            // examples: battle-field_preview.png, battle-field_preview_cool-variant.png
            else if (spriteKind === 'preview'){

                // Define and register the key for this sprite sheet using kind, image, key, and path
                let sheetVariant = this.data[spriteKind+'_variant'] || 'base';
                let sheetKey = baseKey + '.' + spriteKind;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, sheetToken);
                spritesIndex.sheets[xkind][token][sheetToken][sheetVariant] = sheetKey;
                //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + (sheetVariant !== 'base' ? ('_' + sheetVariant) : '') + '.png';
                let imagePath = basePath + image;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, sheetToken);
                spritesIndex.paths[xkind][token][sheetToken][sheetVariant] = imagePath;
                //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Queue loading the sprite sheet into the game
                let pendingSheet = {
                    key: sheetKey,
                    path: imagePath,
                    size: spriteSize,
                    width: objectConfig.baseSize[0],
                    height: objectConfig.baseSize[1],
                    };
                //console.log('SPRITES.pendingSheets.push() w/', pendingSheet);
                SPRITES.pendingSheets.push(pendingSheet);

                }
            // examples: battle-field_avatar.png, battle-field_avatar_cool-variant.png
            else if (spriteKind === 'avatar'){

                // Define and register the key for this sprite sheet using kind, image, key, and path
                let sheetVariant = this.data[spriteKind+'_variant'] || 'base';
                let sheetKey = baseKey + '.' + spriteKind;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, sheetToken);
                spritesIndex.sheets[xkind][token][sheetToken][sheetVariant] = sheetKey;
                //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + (sheetVariant !== 'base' ? ('_' + sheetVariant) : '') + '.png';
                let imagePath = basePath + image;
                let imageSize = 100;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, sheetToken);
                spritesIndex.paths[xkind][token][sheetToken][sheetVariant] = imagePath;
                //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+sheetToken+']['+sheetVariant+']');

                // Queue loading the sprite sheet into the game
                let pendingSheet = {
                    key: sheetKey,
                    path: imagePath,
                    size: avatarSize
                    };
                //console.log('SPRITES.pendingSheets.push() w/', pendingSheet);
                SPRITES.pendingSheets.push(pendingSheet);

                }

            }

        //console.log(this.token + ' done queueing sprites from MMRPG_Field.queueSpriteSheets()');
        //console.log(this.token + ' | SPRITES.pendingSheets.length:', SPRITES.pendingSheets.length);
        //console.log(this.token + ' | SPRITES.pendingAnims.length:', SPRITES.pendingAnims.length);

        // Return when done
        return;

    }

    // Get the current sprite sheet/texture key for the loaded field object
    // Optionally accepts kind, variant, and token to override defaults
    getSpriteSheet (spriteKind = 'preview', spriteVariant = null, spriteToken = null)
    {
        //console.log('MMRPG_Field.getSpriteSheet() called w/ spriteKind:', spriteKind, 'spriteVariant:', spriteVariant, 'spriteToken:', spriteToken);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteSheets = SPRITES.index.sheets[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spriteSheets:', spriteSheets, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind+'_variant'] || 'base';
        //console.log('-> spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteVariant:', spriteVariant);

        // Check if the sprite sheet exists in the index
        let spriteSheet;
        if (spriteSheets
            && spriteSheets[spriteToken]
            && spriteSheets[spriteToken][spriteKind]
            && spriteSheets[spriteToken][spriteKind][spriteVariant]){
            spriteSheet = spriteSheets[spriteToken][spriteKind][spriteVariant];
            } else {
            spriteSheet = '~sprites.'+this.xkind+'.'+spriteToken+'.'+spriteKind+'.'+spriteVariant;
            }
        //console.log('-> spriteSheet:', spriteSheet);

        // Return the sheet token we found
        //console.log('Returning spriteSheet:', spriteSheet);
        return spriteSheet;

    }

    // Get the animation key of a specific animation on this loaded field object
    // Optionally accepts kind, variant, and token to override defaults
    getSpriteAnim (spriteKind = 'preview', spriteAnim = 'idle', spriteVariant = null, spriteToken = null)
    {
        //console.log('MMRPG_Field.getSpriteAnim() called w/ spriteKind:', spriteKind, 'spriteAnim:', spriteAnim, 'spriteVariant:', spriteVariant, 'spriteToken:', spriteToken);

        // Pull in references to required global objects
        let SPRITES = this.SPRITES;
        let spriteAnims = SPRITES.index.anims[this.xkind];
        let objectConfig = this.objectConfig;
        //console.log('-> SPRITES:', SPRITES, 'spriteAnims:', spriteAnims, 'objectConfig:', objectConfig);

        // Compensate for missing fields with obvious values
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data.image || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind+'_variant'] || 'base';
        //console.log('-> spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteVariant:', spriteVariant);

        // Check if the sprite animation exists in the index
        let spriteAnimKey;
        if (spriteAnims
            && spriteAnims[spriteToken]
            && spriteAnims[spriteToken][spriteKind]
            && spriteAnims[spriteToken][spriteKind][spriteVariant]
            && spriteAnims[spriteToken][spriteKind][spriteVariant][spriteAnim]){
            spriteAnimKey = spriteAnims[spriteToken][spriteKind][spriteVariant][spriteAnim];
            } else {
            spriteAnimKey = '~anims.'+this.xkind+'.'+spriteToken+'.'+spriteKind+'.'+spriteVariant+'.'+spriteAnim;
            }
        //console.log('-> spriteAnimKey:', spriteAnimKey);

        // Return the animation key we found
        return spriteAnimKey;

    }

    // Prepare this object's sprite for use, creating it if it doesn't exist yet
    prepareSprite (spriteSheet = null)
    {
        //console.log('MMRPG_Field.prepareSprite() called for ', this.kind, this.token, '\nw/ spriteSheet:', spriteSheet, 'spriteConfig:', this.spriteConfig);
        super.prepareSprite(spriteSheet);
        this.prepareSpriteLayers();
    }

    // Prepare this object's individual sprite layers for use, creating them if they doesn't exist yet
    prepareSpriteLayers ()
    {
        //console.log('MMRPG_Field.prepareSpriteLayers() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite){ return; }
        if (this.spriteLayers){ return }
        let _this = this;
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        this.spriteLayers = [];
        let $layers = this.spriteLayers;
        $layers.push({kind: 'preview', sheet: config.previewSheet, visible: config.showPreview});
        $layers.push({kind: 'background', sheet: config.backgroundSheet, visible: config.showBackground});
        $layers.push({kind: 'foreground', sheet: config.foregroundSheet, visible: config.showForeground});
        $layers.push({kind: 'avatar', sheet: config.avatarSheet, visible: config.showAvatar});
        //console.log('-> creating $layers:', $layers);
        $sprite.setVisible(true);
        for (let i = 0; i < $layers.length; i++){
            let $layer = $layers[i];
            let layerKind = $layer.kind;
            let layerSheet = $layer.sheet;
            let $layerSprite = scene.add.sprite(modX, modY, layerSheet);
            $layerSprite.setVisible(false);
            $layerSprite.subTweens = {};
            $layerSprite.subTimers = {};
            $layerSprite.subSprites = {};
            $layer.sprite = $layerSprite;
            _this[layerKind] = $layerSprite;
            //console.log('-> created new ', layerKind, ' w/ sheet:', layerSheet, 'x:', config.x, 'y:', config.y);
            }
        //console.log('-> done creating $layers:', $layers);
    }

    // Update the graphics of this object's sprite layers, including position, scale, and visibility
    updateSpriteGraphics ()
    {
        //console.log('MMRPG_Field.updateSpriteGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        super.updateSpriteGraphics();
        this.updateSpriteLayerGraphics();
    }

    // Update the graphics of this object's individual sprite layers, including position, scale, and visibility
    updateSpriteLayerGraphics ()
    {
        //console.log('MMRPG_Field.updateSpriteLayerGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite){ return; }
        let _this = this;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        let $layers = this.spriteLayers;
        //console.log('-> updating $layers:', $layers);
        $sprite.setVisible(false);
        for (let i = 0; i < $layers.length; i++){
            let $layer = $layers[i];
            let layerKind = $layer.kind;
            let layerSheet = $layer.sheet;
            let layerVisible = $layer.visible;
            let $layerSprite = $layer.sprite;
            $layerSprite.setVisible(layerVisible);
            $layerSprite.setTexture($layer.sheet);
            $layerSprite.setPosition(modX, modY);
            $layerSprite.setDepth(config.depth + config.z + (i * 10));
            $layerSprite.setOrigin(config.origin[0], config.origin[1]);
            $layerSprite.setAlpha(config.alpha);
            $layerSprite.setScale(config.scale);
            $layerSprite.setFrame(config.frame);
            if (config.tint) { $layerSprite.setTint(config.tint); }
            //console.log('-> updating ', layerKind, ' w/ sheet:', layerSheet, 'x:', modX, 'y:', modY, 'depth:', $layerSprite.depth, 'alpha:', $layerSprite.alpha, 'scale:', $layerSprite.scale, 'frame:', $layerSprite.frame, 'tint:', $layerSprite.tint);
            }
    }

}

export default MMRPG_Field;
