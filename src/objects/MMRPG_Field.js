// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Item.js (class)
// This is the primitive class for all item objects in the game.
// All item objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';

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
        spriteConfig.showGridlines = spriteConfig.showGridlines || true;
        spriteConfig.showAvatar = spriteConfig.showAvatar || false;
        spriteConfig.depth = spriteConfig.depth || 1000;

        // Call the parent constructor
        super(scene, 'field', token, customInfo, spriteConfig, objectConfig);

        // Define the class-specific properties unique to the field
        this.fieldObjects = [];

        // Add more field-specific properties here
        // ...

    }

    // Return defined image sizes for the various field layers
    getSpriteLayersMeta ()
    {
        if (!this.spriteLayersMeta){ this.spriteLayersMeta = {}; }
        let spriteLayersMeta = this.spriteLayersMeta;
        // Define the preview layer meta data
        if (!spriteLayersMeta['preview']){
            spriteLayersMeta['preview'] = {
                size: [1124, 248],
                offset: { z: 10 }
                };
            }
        // Define the background layer meta data
        if (!spriteLayersMeta['background']){
            spriteLayersMeta['background'] = {
                size: [1124, 248],
                offset: { z: 20 }
                };
            }
        // Define the foreground layer meta data
        if (!spriteLayersMeta['foreground']){
            spriteLayersMeta['foreground'] = {
                size: [1124, 248],
                offset: { z: 30 }
                };
            }
        // Define the gridlines layer meta data
        if (!spriteLayersMeta['gridlines']){
            spriteLayersMeta['gridlines'] = {
                size: [1290, 84],
                offset: { y: 47, z: 35 }, //y: 95,
                alpha: 0.1
                };
            }
        // Define the avatar layer meta data
        if (!spriteLayersMeta['avatar']){
            spriteLayersMeta['avatar'] = {
                size: [100, 100],
                offset: { z: 40 }
                };
            }
        return spriteLayersMeta;
    }

    // Function to get the base key
    getBaseSpriteKey (xkind, spriteToken, spriteKind, spriteVariant)
    {
        //console.log('MMRPG_Field.getBaseSpriteKey() called w/ xkind:', xkind, 'spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteVariant:', spriteVariant);
        let objectConfig = this.objectConfig;
        xkind = xkind || this.xkind;
        let dataImage = this.data.image || {};
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data[spriteKind].token || dataImage.token || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind].variant || 'base';
        if (this.spriteIsPlaceholder){ spriteToken = this.kind; spriteVariant = 'base'; }
        //console.log(this.token + ' | -> spriteIsPlaceholder:', this.spriteIsPlaceholder, '-> spriteToken:', spriteToken, 'spriteVariant:', spriteVariant);
        let baseKey = 'sprites.' + xkind + '.' + spriteToken + '.' + spriteKind + '.' + spriteVariant;
        //console.log(this.token + ' | -> returning baseKey:', baseKey);
        return baseKey;
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
        let dataImage = this.data.image || {};
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data[spriteKind].token || dataImage.token || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind].variant || 'base';
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
        let dataImage = this.data.image || {};
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data[spriteKind].token || dataImage.token || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind].variant || 'base';
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

    // Check if a sprite animation exists for specified layer of the loaded object
    hasSpriteLayerAnim (spriteKind = 'preview', animName = 'loop', spriteVariant = null, spriteToken = null)
    {
        //console.log('MMRPG_Field.hasSpriteLayerAnim() called w/ spriteKind:', spriteKind, 'animName:', animName, 'spriteVariant:', spriteVariant, 'spriteToken:', spriteToken);
        let xkind = this.xkind;
        let SPRITES = this.SPRITES;
        let spritesIndex = SPRITES.index;
        let animationsIndex = spritesIndex.anims;
        let objectConfig = this.objectConfig;
        let dataImage = this.data.image || {};
        animName = animName || 'loop';
        spriteKind = spriteKind || 'preview';
        spriteToken = spriteToken || this.data[spriteKind].token || dataImage.token || this.token;
        spriteVariant = spriteVariant || this.data[spriteKind].variant || 'base';
        //console.log(this.token + ' | -> looking for animName:', animName, 'spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'spriteVariant:', spriteVariant, 'in animationsIndex:', animationsIndex);
        if (!animationsIndex[xkind]) return false;
        if (!animationsIndex[xkind][spriteToken]) return false;
        let spriteAnims = animationsIndex[xkind][spriteToken] || {};
        return spriteAnims
            && spriteAnims[spriteKind]
            && spriteAnims[spriteKind][spriteVariant]
            && spriteAnims[spriteKind][spriteVariant][animName]
            ? true : false;
    }

    // Function to add a sprite animation externally using config objects
    addSpriteLayerAnimation (layer, name, config)
    {
        //console.log('MMRPG_Field.addSpriteAnimation() called w/ name:', name, 'config:', config);
        let pendingAnims = [];
        config.spriteKind = layer;
        this.queueAnimation(name, config, pendingAnims);
        this.createPendingAnimations(pendingAnims);
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
        let contentPath = MMRPG.paths.content;
        let pathToken = token === kind ? ('.' + kind) : token;
        let baseKey = 'sprites.' + xkind + '.' + token;
        let basePath = contentPath + xkind + '/' + pathToken + '/sprites/';
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

                // Backgrounds and foregrounds can be mixed-and-matches so we need alternate base key and path
                let spriteToken = this.data[spriteKind].token || token;
                let altPathToken = token === kind ? ('.' + kind) : spriteToken;
                let altBaseKey = 'sprites.' + xkind + '.' + spriteToken;
                let altBasePath = contentPath + xkind + '/' + altPathToken + '/sprites/';
                //console.log(this.token + ' | -> spriteKind:', spriteKind, 'spriteToken:', spriteToken, 'altPathToken:', altPathToken, 'altBaseKey:', altBaseKey, 'altBasePath:', altBasePath);

                // Define and register the key for this sprite sheet using kind, image, key, and path
                let spriteVariant = this.data[spriteKind].variant || 'base';
                let sheetKey = altBaseKey + '.' + spriteKind + '.' + spriteVariant;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, spriteToken, sheetToken);
                spritesIndex.sheets[xkind][spriteToken][sheetToken][spriteVariant] = sheetKey;
                //console.log(this.token + ' | -> queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+spriteToken+']['+sheetToken+']['+spriteVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + '_base' + (spriteVariant !== 'base' ? ('_' + spriteVariant) : '') + '.png';
                let imagePath = altBasePath + image;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, spriteToken, sheetToken);
                spritesIndex.paths[xkind][spriteToken][sheetToken][spriteVariant] = imagePath;
                //console.log(this.token + ' | -> queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+spriteToken+']['+sheetToken+']['+spriteVariant+']');

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
                let spriteVariant = this.data[spriteKind].variant || 'base';
                let sheetKey = baseKey + '.' + spriteKind;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, sheetToken);
                spritesIndex.sheets[xkind][token][sheetToken][spriteVariant] = sheetKey;
                //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+sheetToken+']['+spriteVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + (spriteVariant !== 'base' ? ('_' + spriteVariant) : '') + '.png';
                let imagePath = basePath + image;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, sheetToken);
                spritesIndex.paths[xkind][token][sheetToken][spriteVariant] = imagePath;
                //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+sheetToken+']['+spriteVariant+']');

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
                let spriteVariant = this.data[spriteKind].variant || 'base';
                let sheetKey = baseKey + '.' + spriteKind;
                let sheetToken = spriteKind;
                spritesIndex.prepForKeys(spritesIndex.sheets, xkind, token, sheetToken);
                spritesIndex.sheets[xkind][token][sheetToken][spriteVariant] = sheetKey;
                //console.log('queued [ '+sheetKey+' ] to spritesIndex.sheets['+xkind+']['+token+']['+sheetToken+']['+spriteVariant+']');

                // Define the relative image path for this sprite sheet
                let image = 'battle-field_' + spriteKind + (spriteVariant !== 'base' ? ('_' + spriteVariant) : '') + '.png';
                let imagePath = basePath + image;
                let imageSize = 100;
                spritesIndex.prepForKeys(spritesIndex.paths, xkind, token, sheetToken);
                spritesIndex.paths[xkind][token][sheetToken][spriteVariant] = imagePath;
                //console.log('queued [ '+imagePath+' ] to spritesIndex.paths['+xkind+']['+token+']['+sheetToken+']['+spriteVariant+']');

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

    // Function to queue animations using config objects
    queueAnimation (name, config, pendingAnims = [])
    {
        //console.log('MMRPG_Field.queueAnimation() called w/ name:', name, 'config:', config);
        let scene = this.scene;
        let objectConfig = this.objectConfig;
        let spritesIndex = this.SPRITES.index;
        let spriteAnims = spritesIndex.anims;
        let kind = this.kind;
        let xkind = this.xkind;
        let dataImage = this.data.image || {};
        let spriteToken = config.token || this.data[spriteKind].token || dataImage.token || this.token;
        let spriteKind = config.spriteKind || 'preview';
        let spriteVariant = config.spriteVariant || this.data[spriteKind].variant || 'base';
        //console.log(this.token + ' | -> about to call getBaseSpriteKey w/ spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteVariant:', spriteVariant);
        //console.log(this.token + ' | -> spriteKind:', spriteKind, 'config.spriteVariant:', config.spriteVariant, 'this.data[spriteKind]:', this.data[spriteKind], 'spriteVariant:', spriteVariant);
        let sheetKey = this.getBaseSpriteKey(null, null, spriteKind, spriteVariant);
        let animKey = sheetKey + '.' + name;
        //console.log(this.token + ' | -> spriteToken:', spriteToken, 'spriteKind:', spriteKind, 'spriteVariant:', spriteVariant, 'sheetKey:', sheetKey, 'animKey:', animKey);
        spritesIndex.prepForKeys(spriteAnims, xkind, spriteToken, spriteKind, spriteVariant);
        spriteAnims[xkind][spriteToken][spriteKind][spriteVariant][name] = animKey;
        //console.log(this.token + ' | -> queued [ '+animKey+' ] to spriteAnims['+xkind+']['+spriteToken+']['+spriteKind+']['+spriteVariant+']');
        //console.log(this.token + ' | -> spriteAnims:', spriteAnims);
        if (!scene.anims.get(animKey)){
            let pendingAnim = {
                name: name,
                key: animKey,
                sheet: sheetKey,
                frames: config.frames
                };
            if (config.frameRate){ pendingAnim.frameRate = config.frameRate; }
            if (config.duration){ pendingAnim.duration = config.duration; }
            if (config.repeat){ pendingAnim.repeat = config.repeat; }
            //console.log(this.token + ' | -> queued [ '+animKey+' ] to pendingAnims w/ pendingAnim:', pendingAnim);
            pendingAnims.push(pendingAnim);
            }
    }

    // Prepare this object's individual sprite layers for use, creating them if they doesn't exist yet
    prepareSpriteLayers ()
    {
        //console.log('MMRPG_Field.prepareSpriteLayers() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite){ return; }
        if (!this.spriteLayers){ return }
        let _this = this;
        let SPRITES = this.SPRITES;
        let scene = this.scene;
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let objectConfig = this.objectConfig;
        let [ parentWidth, parentHeight ] = [ this.width, this.height ];
        let [ baseWidth, baseHeight ] = objectConfig.baseSize;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        let $layers = this.spriteLayers;
        let layerKeys = Object.keys($layers);
        let layerMeta = this.getSpriteLayersMeta();
        let layerMetaKeys = Object.keys(layerMeta);
        // Loop through defined sprite layers in the meta and create if not exists
        for (let i = 0; i < layerMetaKeys.length; i++){
            // Collect the meta key and info for this sprite layer
            let metaKey = layerMetaKeys[i];
            let metaInfo = layerMeta[metaKey];
            //console.log(this.token + ' | ' + metaKey + ' | Creating new layer w/ key = "' + metaKey + '"');
            // If the layer already exists, skip it
            if (layerKeys.includes(metaKey)){
                //console.log(this.token + ' | ' + metaKey + ' | -> '+metaKey+' layer already exists, skipping...');
                continue;
                } else {
                //console.log(this.token + ' | ' + metaKey + ' | Creating new layer w/ key = "' + metaKey + '"');
                }
            // Collect the sheet, visibility, etc. if defined in the meta or config
            let layerSheet = metaInfo.sheet || config[metaKey+'Sheet'] || null;
            let layerVisible = metaInfo.visible || config[ 'show' + metaKey[0].toUpperCase() + metaKey.slice(1) ] || false;
            let layerSize = metaInfo.size || [baseWidth, baseHeight];
            // Define a base offset and then collect overrides if necessary
            let layerOffset = { x: 0, y: 0, z: 10 + (i * 10) };
            // If there were any predefined offsets, merge them in
            if (metaInfo.offset){
                let definedOffsets = Object.keys(metaInfo.offset);
                //console.log(this.token + ' | ' + metaKey + ' | -> definedOffsets:', definedOffsets, 'metaInfo.offset:', metaInfo.offset);
                // Assign whatever raw values were provided in the meta
                layerOffset = Object.assign({}, layerOffset, metaInfo.offset);
                // If the parent and layer width are not the same, adjust
                if (parentWidth !== layerSize[0]){
                    //console.log(this.token + ' | ' + metaKey + ' | -> parent vs layer width are different (', parentWidth, 'vs.', layerSize[0], ')!');
                    let layerOffsetX = Math.round((parentWidth - layerSize[0]) / 2);
                    if (!definedOffsets.includes('x')){ layerOffset.x = layerOffsetX; }
                    else { layerOffset.x = metaInfo.offset.x + layerOffsetX; }
                    //console.log(this.token + ' | ' + metaKey + ' | -> calculated layerOffsetX:', layerOffsetX, 'and adjusted layerOffset.x to:', layerOffset.x);
                    }
                // If the parent and layer height are not the same, adjust
                if (parentHeight !== layerSize[1]){
                    //console.log(this.token + ' | ' + metaKey + ' | -> parent vs layer height are different (', parentHeight, 'vs.', layerSize[1], ')!');
                    let layerOffsetY = Math.round((parentHeight - layerSize[1]) / 2);
                    if (!definedOffsets.includes('y')){ layerOffset.y = layerOffsetY; }
                    else { layerOffset.y = metaInfo.offset.y + layerOffsetY; }
                    //console.log(this.token + ' | ' + metaKey + ' | -> calculated layerOffsetY:', layerOffsetY, 'and adjusted layerOffset.y to:', layerOffset.y);
                    }
                }
            //console.log(this.token + ' | ' + metaKey + ' | -> creating the new layer', '\n& w/ metaKey:', metaKey, '\n& w/ metaInfo:', metaInfo, '\n& w/ layerSheet:', layerSheet, '\n& w/ layerVisible:', layerVisible, '\n& w/ layerSize:', layerSize, '\n& w/ layerOffset:', layerOffset);
            // Create the new layer data given what we've collected above
            let $layer = { kind: metaKey, sheet: layerSheet, visible: layerVisible, offset: layerOffset };
            // If an alpha was defined in the meta, add it to the layer
            if (metaInfo.alpha){ $layer.alpha = metaInfo.alpha; }
            // Now that we've created the new layer data, add it to the sprite layers
            $layers[metaKey] = $layer;
            //console.log(this.token + ' | ' + metaKey + ' | -> created new layer:', metaKey, $layer);
        }
        //console.log('-> creating $layers:', $layers);
        $sprite.setVisible(true);
        layerKeys = Object.keys($layers);
        for (let i = 0; i < layerKeys.length; i++){
            let layer = layerKeys[i];
            let $layer = $layers[layer];
            if ($layer.sprite){ continue; }
            //console.log('-> creating ', $layer.kind, '...');
            let layerKind = $layer.kind;
            let layerSheet = $layer.sheet;
            //console.log('-> ', $layer.kind, ' $layer before:', JSON.stringify($layer));
            let layerOffset = Object.assign({}, $layer.offset) || {};
            layerOffset.x = layerOffset.x || 0;
            layerOffset.y = layerOffset.y || 0;
            layerOffset.z = layerOffset.z || 0;
            let layerAlpha = $layer.alpha || 1;
            let layerX = modX + layerOffset.x;
            let layerY = modY + layerOffset.y;
            let layerDepth = config.depth + config.z + layerOffset.z;
            let $layerSprite = SPRITES.add(layerX, layerY, layerSheet);
            //console.log('-> creating ', layerKind, ' w/ layerX:', layerX, 'layerY:', layerY, 'layerDepth:', layerDepth, 'layerOffset:', layerOffset, 'layerAlpha:', layerAlpha);
            $layerSprite.setVisible(false);
            $layerSprite.setDepth(layerDepth);
            $layerSprite.setAlpha(layerAlpha);
            $layerSprite.subTweens = {};
            $layerSprite.subTimers = {};
            $layerSprite.subSprites = {};
            $layer.sprite = $layerSprite;
            $layer.offset = layerOffset;
            $layer.alpha = layerAlpha;
            //console.log('-> ', $layer.kind, ' $layer after:', JSON.stringify($layer));
            //console.log('-> created new ', layerKind, ' w/ sheet:', layerSheet, 'and $layer:', $layer);
            }
        //console.log('-> done creating $layers:', $layers);
    }

    // Update the graphics of this object's individual sprite layers, including position, scale, and visibility
    updateSpriteLayerGraphics ()
    {
        //console.log('MMRPG_Field.updateSpriteLayerGraphics() called for ', this.kind, this.token, '\nw/ spriteConfig:', this.spriteConfig);
        if (!this.sprite){ return; }
        let $sprite = this.sprite;
        let config = this.spriteConfig;
        let [ modX, modY ] = this.getOffsetPosition(config.x, config.y);
        let $layers = this.spriteLayers;
        // Initialize the cache layers if not already present
        if (!this.cache.layers) { this.cache.layers = {}; }
        $sprite.setVisible(false);
        let layerKeys = Object.keys($layers);
        for (let i = 0; i < layerKeys.length; i++){
            let layer = layerKeys[i];
            let $layer = $layers[layer];
            let layerKind = $layer.kind;
            let layerSheet = $layer.sheet;
            let layerVisible = $layer.visible;
            let layerOffset = $layer.offset;
            let layerDepth = config.depth + config.z + layerOffset.z;
            let layerAlpha = $layer.alpha * config.alpha;
            let $layerSprite = $layer.sprite;

            // Initialize layer cache if not already present
            if (!this.cache.layers[layer]) { this.cache.layers[layer] = {}; }
            let layerCache = this.cache.layers[layer];

            // Check and update visibility
            if (typeof layerCache.visible === 'undefined') { layerCache.visible = null; }
            if (layerCache.visible !== layerVisible) {
                $layerSprite.setVisible(layerVisible);
                layerCache.visible = layerVisible;
            }

            // Check and update texture
            if (typeof layerCache.sheet === 'undefined') { layerCache.sheet = null; }
            if (layerCache.sheet !== layerSheet || $layerSprite.texture.key !== layerSheet) {
                $layerSprite.setTexture(layerSheet);
                layerCache.sheet = layerSheet;
            }

            // Check and update position
            if (typeof layerCache.x === 'undefined') { layerCache.x = null; }
            if (typeof layerCache.y === 'undefined') { layerCache.y = null; }
            if (layerCache.x !== modX || layerCache.y !== modY) {
                $layerSprite.setPosition(modX, modY);
                layerCache.x = modX;
                layerCache.y = modY;
            }

            // Check and update depth
            if (typeof layerCache.depth === 'undefined') { layerCache.depth = null; }
            if (layerCache.depth !== layerDepth) {
                $layerSprite.setDepth(layerDepth);
                layerCache.depth = layerDepth;
            }

            // Check and update origin
            if (typeof layerCache.origin === 'undefined') { layerCache.origin = null; }
            if (!layerCache.origin || layerCache.origin[0] !== config.origin[0] || layerCache.origin[1] !== config.origin[1]) {
                $layerSprite.setOrigin(config.origin[0], config.origin[1]);
                layerCache.origin = config.origin.slice(); // Clone the origin array
            }

            // Check and update alpha
            if (typeof layerCache.alpha === 'undefined') { layerCache.alpha = null; }
            if (layerCache.alpha !== layerAlpha) {
                $layerSprite.setAlpha(layerAlpha);
                layerCache.alpha = layerAlpha;
            }

            // Check and update scale
            if (typeof layerCache.scale === 'undefined') { layerCache.scale = null; }
            if (layerCache.scale !== config.scale) {
                $layerSprite.setScale(config.scale);
                layerCache.scale = config.scale;
            }

            // Check and update frame
            if (typeof layerCache.frame === 'undefined') { layerCache.frame = null; }
            if (layerCache.frame !== config.frame) {
                $layerSprite.setFrame(config.frame);
                layerCache.frame = config.frame;
            }

            // Check and update tint
            if (typeof layerCache.tint === 'undefined') { layerCache.tint = null; }
            if (layerCache.tint !== config.tint) {
                if (config.tint) { $layerSprite.setTint(config.tint); }
                else { $layerSprite.clearTint(); }
                layerCache.tint = config.tint;
            }

            // Calculate offset position for the layer
            let [ offsetX, offsetY ] = this.getOffsetPosition(layerOffset.x, layerOffset.y);
            let finalX = modX + offsetX;
            let finalY = modY + offsetY;
            if (layerCache.finalX !== finalX || layerCache.finalY !== finalY) {
                $layerSprite.setPosition(finalX, finalY);
                layerCache.finalX = finalX;
                layerCache.finalY = finalY;
            }

            //console.log('-> updating ', layerKind, ' w/ sheet:', layerSheet, 'x:', finalX, 'y:', finalY, 'depth:', $layerSprite.depth, 'alpha:', $layerSprite.alpha, 'scale:', $layerSprite.scale, 'frame:', $layerSprite.frame, 'tint:', $layerSprite.tint);
        }
    }

    // Play a named animation on this sprite if it exists
    playAnim (layer, anim)
    {
        if (!this.sprite) { return; }
        if (this.spriteIsLoading){ return this.spriteMethodsQueued.push(function(){ _this.playAnim(anim); }); }
        //console.log('MMRPG_Field.playAnim() called for ', this.kind, this.token, '\nw/ layer:', layer, 'anim:', anim);
        let scene = this.scene;
        let $sprite = this.sprite;
        let $layers = this.spriteLayers;
        let config = this.spriteConfig;
        let animKey = this.getSpriteAnim(layer, anim);
        if (!$layers[layer]){ console.warn(this.token + ' | MMRPG_Field.playAnim() -> layer "'+layer+'" not found in spriteLayers for ', this.token); return; }
        if (!animKey){ console.warn(this.token + ' | MMRPG_Field.playAnim() -> animation "'+anim+'" not found in SPRITES index for ', this.token); return; }
        if (!scene.anims.exists(animKey)){ console.warn(this.token + ' | MMRPG_Field.playAnim() -> animation "'+animKey+'" not found in scene.anims for ', this.token); return; }
        let animData = scene.anims.get(animKey);
        //console.log(this.token + ' | -> trying to $sprite.play(', animKey, ') w/ animData:', animData);
        let $layer = $layers[layer];
        let $layerSprite = $layer.sprite;
        $layerSprite.play(animKey);
    }

    // Update or return the offset values for the preview layer of this sprite
    setPreviewOffset (x, y, z) { return this.setLayerOffset('preview', x, y, z); }
    getPreviewOffset () { let offset = this.getLayerOffset('preview'); return { x: offset.x, y: offset.y, z: offset.z }; }
    setPreviewOffsetX (x) { this.setPreviewOffset(x, null, null); }
    setPreviewOffsetY (y) { this.setPreviewOffset(null, y, null); }
    setPreviewOffsetZ (z) { this.setPreviewOffset(null, null, z); }
    getPreviewOffsetX () { return this.getPreviewOffset().x; }
    getPreviewOffsetY () { return this.getPreviewOffset().y; }
    getPreviewOffsetZ () { return this.getPreviewOffset().z; }

    // Update or return the offset values for the background layer of this sprite
    setBackgroundOffset (x, y, z) { return this.setLayerOffset('background', x, y, z); }
    getBackgroundOffset () { let offset = this.getLayerOffset('background'); return { x: offset.x, y: offset.y, z: offset.z }; }
    setBackgroundOffsetX (x) { this.setBackgroundOffset(x, null, null); }
    setBackgroundOffsetY (y) { this.setBackgroundOffset(null, y, null); }
    setBackgroundOffsetZ (z) { this.setBackgroundOffset(null, null, z); }
    getBackgroundOffsetX () { return this.getBackgroundOffset().x; }
    getBackgroundOffsetY () { return this.getBackgroundOffset().y; }
    getBackgroundOffsetZ () { return this.getBackgroundOffset().z; }

    // Update or return the offset values for the foreground layer of this sprite
    setForegroundOffset (x, y, z) { return this.setLayerOffset('foreground', x, y, z); }
    getForegroundOffset () { let offset = this.getLayerOffset('foreground'); return { x: offset.x, y: offset.y, z: offset.z }; }
    setForegroundOffsetX (x) { this.setForegroundOffset(x, null, null); }
    setForegroundOffsetY (y) { this.setForegroundOffset(null, y, null); }
    setForegroundOffsetZ (z) { this.setForegroundOffset(null, null, z); }
    getForegroundOffsetX () { return this.getForegroundOffset().x; }
    getForegroundOffsetY () { return this.getForegroundOffset().y; }
    getForegroundOffsetZ () { return this.getForegroundOffset().z; }

    // Update or return the offset values for the gridlines layer of this sprite
    setGridlinesOffset (x, y, z) { return this.setLayerOffset('gridlines', x, y, z); }
    getGridlinesOffset () { let offset = this.getLayerOffset('gridlines'); return { x: offset.x, y: offset.y, z: offset.z }; }
    setGridlinesOffsetX (x) { this.setGridlinesOffset(x, null, null); }
    setGridlinesOffsetY (y) { this.setGridlinesOffset(null, y, null); }
    setGridlinesOffsetZ (z) { this.setGridlinesOffset(null, null, z); }
    getGridlinesOffsetX () { return this.getGridlinesOffset().x; }
    getGridlinesOffsetY () { return this.getGridlinesOffset().y; }
    getGridlinesOffsetZ () { return this.getGridlinesOffset().z; }

    // Update or return the offset values for the avatar layer of this sprite
    setAvatarOffset (x, y, z) { return this.setLayerOffset('avatar', x, y, z); }
    getAvatarOffset () { let offset = this.getLayerOffset('avatar'); return { x: offset.x, y: offset.y, z: offset.z }; }
    setAvatarOffsetX (x) { this.setAvatarOffset(x, null, null); }
    setAvatarOffsetY (y) { this.setAvatarOffset(null, y, null); }
    setAvatarOffsetZ (z) { this.setAvatarOffset(null, null, z); }
    getAvatarOffsetX () { return this.getAvatarOffset().x; }
    getAvatarOffsetY () { return this.getAvatarOffset().y; }
    getAvatarOffsetZ () { return this.getAvatarOffset().z; }

    // Update the offset values for a given layer of this sprite by delegating to the super method
    // But also track the differences in the offset values and apply to any child field objects
    setLayerOffset (layer, x, y, z)
    {
        //console.log('MMRPG_Field.setLayerOffset() called for ', this.kind, this.token, '\nw/ layer:', layer, 'x:', x, 'y:', y);

        // Ensure the requested layer exists and then collect a ref to it
        let $layers = this.spriteLayers;
        if (!$layers[layer]){ console.warn(this.token + ' | MMRPG_Field.setLayerOffset() -> layer "'+layer+'" not found in spriteLayers for ', this.token); return; }
        let $layer = $layers[layer];

        // Track the x/y/z values before and the after running the super method so we can use the offset changes
        let startX = $layer.offset.x, startY = $layer.offset.y, startZ = $layer.offset.z;
        //console.log(this.token + ' | -> start offset for layer:', layer, 'is [', startX, ',', startY, ',', startZ, ']');
        super.setLayerOffset(layer, x, y, z);
        let endX = $layer.offset.x, endY = $layer.offset.y, endZ = $layer.offset.z;
        let diffX = endX - startX, diffY = endY - startY, diffZ = endZ - startZ;
        //console.log(this.token + ' | -> updated offset for layer:', layer, 'to [', endX, ',', endY, ',', endZ, ']');
        //console.log(this.token + ' | -> layer offset diffs are x:', diffX, 'y:', diffY, 'z:', diffZ);
        //console.log(this.token + ' | -> parent x/y:', this.x, this.y);
        //console.log(this.token + ' | -> layer position x/y:', $layer.sprite.x, $layer.sprite.y, 'bounds:', $layer.sprite.getBounds());

        // Check if there are any field objects scoped to this layer and update their offsets accordingly
        let fieldObjects = this.fieldObjects;
        let fieldObjectCount = fieldObjects.length;
        for (let i = 0; i < fieldObjectCount; i++){
            let fieldObject = fieldObjects[i];
            //console.log('-> checking if fieldObject:', fieldObject.token, 'is anchored to layer:', layer);
            if (fieldObject.layer === layer){
                let $object = fieldObject.object;
                //console.log('-> checking $object(', $object.kind, '/', $object.token, '/', $object.id, ') for isAnchored:', $object.isAnchored());
                if (!$object.isAnchored()){ continue; }
                if (diffX){ $object.setPositionX(diffX > 0 ? '+='+diffX : '-='+Math.abs(diffX)); }
                if (diffY){ $object.setPositionY(diffY > 0 ? '+='+diffY : '-='+Math.abs(diffY)); }
                if (diffZ){ $object.setPositionZ(diffZ > 0 ? '+='+diffZ : '-='+Math.abs(diffZ)); }
            }
        }

    }

    // Add another MMRPG object (that isn't a field) to this one as a child so we can update it along with this object
    addObject ($object, anchorToLayer = null)
    {
        //console.log('MMRPG_Field.addObject() called for', this.kind, this.token, '\nw/ $object:', typeof $object, 'anchorToLayer:', anchorToLayer);
        let allowKinds = ['player', 'robot', 'ability', 'item', 'attachment'];
        if (!allowKinds.includes($object.kind)){ console.warn(this.token + ' | MMRPG_Field.addObject() -> cannot add a ', $object.kind, '-type child object to a field'); return; }
        if (!this.sprite) { console.warn(this.token + ' | MMRPG_Field.addObject() -> cannot add a child object without a sprite'); return; }
        //console.log(this.token + ' | -> adding $object(', $object.kind, '/', $object.token, '/', $object.id, ') to field(', this.token, ') as a child object');

        // Collect the current list of field objects
        let fieldObjects = this.fieldObjects;

        // Prepare the object to be added as a child to this field
        let child = {kind: $object.kind, token: $object.token, id: $object.id, object: $object, layer: anchorToLayer};
        $object.spriteAnchor = this;
        $object.useAnchorForPosition(true);
        $object.isAnchored(true);
        //console.log('We just anchored this object:', $object);

        // If this object is already in the field objects, assume we're updating it and delete existing entry
        let existingIndex = fieldObjects.findIndex((o) => o.id === $object.id && o.kind === $object.kind && o.token === $object.token);
        if (existingIndex >= 0){
            //console.log(this.token + ' | -> $object(', $object.kind, '/', $object.token, '/', $object.id, ') already exists in fieldObjects, updating...');
            fieldObjects.splice(existingIndex, 1);
            }

        // Add the object to the field objects list
        fieldObjects.push(child);

        // Update the field objects list
        this.fieldObjects = fieldObjects;

    }

    // Remove an object that has been added to this as a child object so that it no longer updates with this parent field
    removeObject ($object)
    {
        //console.log('MMRPG_Field.removeObject() called for', this.kind, this.token, '\nw/ $object:', typeof $object);
        if (!this.sprite) { console.warn(this.token + ' | MMRPG_Field.removeObject() -> cannot remove a child object without a sprite'); return; }
        //console.log(this.token + ' | -> removing $object(', $object.kind, '/', $object.token, '/', $object.id, ') from field(', this.token, ') as a child object');

        // Collect the current list of field objects
        let fieldObjects = this.fieldObjects;

        // Find the object in the field objects list
        let existingIndex = fieldObjects.findIndex((o) => o.id === $object.id && o.kind === $object.kind && o.token === $object.token);
        if (existingIndex < 0){
            //console.log(this.token + ' | -> $object(', $object.kind, '/', $object.token, '/', $object.id, ') does not exist in fieldObjects, skipping...');
            return;
            }

        // Remove the object from the field objects list
        fieldObjects.splice(existingIndex, 1);

        // Update the field objects list
        this.fieldObjects = fieldObjects;

    }

    // Get an x/y position on the battle grid given a column and row number (0,0 cell is at center of image)
    static getGridOffsetByPosition (col, row)
    {
        //console.log('MMRPG_Field.getGridOffsetByPosition() called \nw/ col:', col, 'row:', row);

        // Constants
        const baseGridWidth = 1290; // original image width
        const baseGridHeight = 1004; // original image height
        const gridWidth = 1290; // image width after perspective
        const gridHeight = 84; // image height after perspective
        const numRows = 7; // number of rows top-to-bottom (back-to-front)
        const numCols = 4; // number of columns per side (overlap in center)
        //const rowHeights = [ 19, 16, 13, 10, 9, 8, 6 ]; // the height of each cell from bottom to top
        //const colWidths = [ 132, 117, 106, 98, 91, 85, 79 ]; // the width of each cell from bottom to top
        const rowHeights = [ 6, 8, 9, 10, 13, 16, 19 ]; // the height of each cell from top to bottom
        const colWidths = [ 79, 85, 91, 98, 106, 117, 132 ]; // the width of each cell from top to bottom
        const side = col === 0 ? 'center' : (col < 0 ? 'left' : 'right');
        //console.log('-> side:', side);

        // Calculate center of the grid
        const centerX = gridWidth / 2;
        const centerY = gridHeight / 2;

        // Collect the real grid positions in case we need them

        // Start at the top and calculate how far down we are on the Y axis
        let offsetY = 0;
        let realRow = row + Math.floor(numRows / 2);
        let rowHeight = 0;
        //console.log('-> row:', (row > 0 ? '+' : '')+row, '(realRow:', realRow, ')');
        for (let i = 0; i < realRow; i++){
            rowHeight = rowHeights[i];
            offsetY += rowHeight;
            //console.log('inc-y-offset by '+rowHeight);
            }
        let nextRowHeight = typeof rowHeights[realRow] !== 'undefined' ? rowHeights[realRow] : Math.ceil(rowHeight * 1.3);
        let halfNextRowHeight = nextRowHeight / 2;
        offsetY += halfNextRowHeight;
        //console.log('inc-y-offset by '+halfNextRowHeight);
        //console.log('-> row/offsetY:', offsetY);

        // Given the real row, calculate how far back we are on the X axis
        let offsetX = centerX;
        if (col !== 0){
            let absCol = Math.abs(col);
            let colWidth = colWidths[realRow];
            //console.log('-> col:', (col > 0 ? '+' : '')+col, '(absCol:', absCol, ')');
            for (let j = 0; j < absCol; j++){
                if (side === 'left'){
                    offsetX -= colWidth;
                    //console.log('dec-x-offset by '+colWidth);
                    }
                else if (side === 'right'){
                    offsetX += colWidth;
                    //console.log('inc-x-offset by '+colWidth);
                    }
                }
            }
        //console.log('-> col/offsetX:', offsetX);

        // Always account for the 2px border at the top
        offsetY += 2;

        // Return the calculated grid offset
        let returnOffset = { x: offsetX, y: offsetY };
        //console.log('-> calculated grid offset:', returnOffset);
        return returnOffset;

    }

}

export default MMRPG_Field;
