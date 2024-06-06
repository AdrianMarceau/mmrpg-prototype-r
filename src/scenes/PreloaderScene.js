// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: PreloaderScene.js (scene)
// Preloader scene for the game. This scene is responsible for
// loading the game assets and then displaying the splash screen
// and start button to the user.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';
import { StringsUtility as Strings } from '../utils/StringsUtility.js';

import SpritesManager from '../managers/SpritesManager.js';

export default class PreloaderScene extends Phaser.Scene
{

    constructor ()
    {
        console.log('PreloaderScene.constructor() called');
        super('Preloader');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesManager(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;

        // Define the preload steps if they haven't been
        this.preloadComplete = [];
        this.preloadSteps = ['indexes', 'sprites', 'players', 'robots', 'abilities', 'items', 'fields', 'other', 'start'];
        this.preloadStep = this.preloadSteps[0];

        // Set up the preload queue variables
        this.preloadQueue = [];
        this.preloadsQueued = 0;
        this.preloadsCompleted = 0;

        // Define which players, robots, items, etc. to preload before starting
        this.preloadSprites = {
            players: [
                //'dr-light', 'dr-wily', 'dr-cossack'
                ],
            robots: [
                //'mega-man', 'proto-man', 'bass',
                //'roll', 'disco', 'rhythm',
                //'trill', 'slur',
                //'met'
                ],
            abilities: [
                //'buster-shot', 'mega-buster'
                ],
            items: [
                //'small-screw', 'large-screw'
                ],
            };

        // Initialize this scene with a first-load callback function
        MMRPG.init('PreloaderScene', 'Preloader', function(){

            /* ... */

            });

    }

    init ()
    {
        //console.log('PreloaderScene.init() called');

        // Initialize any objects that need it
        this.SPRITES.init(this);

    }

    preload ()
    {
        //console.log('PreloaderScene.preload() called @ ', this.preloadStep);
        //console.log('WE ARE IN ', this.preloadStep.toUpperCase(), ' PRELOAD STEP');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Pull in some indexes for later use
        let typesIndex = MMRPG.Indexes.types;
        //console.log('typesIndex =', typesIndex);

        // Define a list of types safe for randomizing with
        let copySafeTypeTokens = [];
        for (let typeToken in typesIndex){
            let typeData = typesIndex[typeToken];
            if (typeData.class !== 'normal'){ continue; }
            copySafeTypeTokens.push(typeToken);
        }

        // Preload indexes if we're on the indexes step
        if (this.preloadStep === 'indexes'){

            // Queue the indexes for object types we know
            this.queueIndex('types', 'types.json');
            this.queueIndex('players', 'players.json');
            this.queueIndex('robots', 'robots.masters.json', 'robots');
            this.queueIndex('robots', 'robots.mechas.json', 'mechas');
            this.queueIndex('robots', 'robots.bosses.json', 'bosses');
            this.queueIndex('abilities', 'abilities.json');
            this.queueIndex('items', 'items.json');
            this.queueIndex('skills', 'skills.json');
            this.queueIndex('fields', 'fields.json');

            }
        // Preload all the default sprites if explicitly requested
        else if (this.preloadStep === 'sprites'){
            let kinds = SPRITES.index.kinds;
            let xkinds = SPRITES.index.xkinds;
            for (let i = 0; i < kinds.length; i++){
                let kind = kinds[i];
                let xkind = xkinds[i];
                if (!this.preloadSprites[xkind]){ continue; }
                SPRITES.loadSprite(this, kind, kind, 'base');
                let tokens = this.preloadSprites[xkind];
                let numTokens = tokens.length;
                for (let i = 0; i < numTokens; i++){
                    let token = tokens[i];
                    SPRITES.loadSprite(this, kind, token, 'base');
                    }
                }
            }
        // Else make we sure load all PLAYERS if it's their turn
        else if (this.preloadStep === 'players'){
            //console.log('Time to preload player sprites...');
            let playersIndex = MMRPG.Indexes.players;
            let playerTokens = Object.keys(playersIndex);
            playerTokens.forEach((token) => {
                var info = playersIndex[token];
                //console.log('token = ', token, 'info = ', info);
                if (!info.flag_complete){ return; }
                //console.log('Preload player ', token);
                SPRITES.loadSprite(this, 'players', token, 'base');
                let alts = [];
                if (info.image_alts){ alts = alts.concat(info.image_alts); }
                if (alts.length){
                    let altKeys = Object.keys(alts);
                    altKeys.forEach((key) => {
                        let alt = alts[key];
                        //console.log('Preload player ', token, ' w/ ', alt.token);
                        SPRITES.loadSprite(this, 'players', token, alt.token);
                        });
                    }
                });
            }
        // Else make sure we load all ROBOTS if it's their turn
        else if (this.preloadStep === 'robots'){
            //console.log('Time to preload robot sprites...');
            let robotsIndex = MMRPG.Indexes.robots;
            let robotTokens = Object.keys(robotsIndex);
            robotTokens.forEach((token) => {
                var info = robotsIndex[token];
                //console.log('token = ', token, 'info = ', info);
                if (info.class !== 'master'){ return; }
                if (!info.flag_complete){ return; }
                //console.log('Preload robot ', token);
                SPRITES.loadSprite(this, 'robots', token, 'base');
                let alts = [];
                if (info.image_alts){ alts = alts.concat(info.image_alts); }
                if (info.core === 'copy'){
                    copySafeTypeTokens.forEach((typeToken) => {
                        let typeInfo = MMRPG.Indexes.types[typeToken];
                        alts.push({token: typeInfo.token, name: typeInfo.name + ' Core', colour: typeToken, summons: 0});
                        });
                    //console.log('Preload w/ copy alts ', alts);
                    }
                if (alts.length){
                    //console.log('Preload alts ', alts);
                    let altKeys = Object.keys(alts);
                    altKeys.forEach((key) => {
                        let alt = alts[key];
                        //console.log('Preload robot ', token, ' w/ ', alt.token);
                        SPRITES.loadSprite(this, 'robots', token, alt.token);
                        });
                    }
                });
            }
        // Else make sure we load all ABILITIES if it's their turn
        else if (this.preloadStep === 'abilities'){
            //console.log('Time to preload ability sprites...');
            let abilitiesIndex = MMRPG.Indexes.abilities;
            let abilityTokens = Object.keys(abilitiesIndex);
            abilityTokens.forEach((token) => {
                var info = abilitiesIndex[token];
                //console.log('token = ', token, 'info = ', info);
                if (!info.flag_complete){ return; }
                //console.log('Preload ability ', token);
                if (info.image_sheets > 0){
                    for (let sheet = 1; sheet <= info.image_sheets; sheet++){
                        //console.log('Preload ability ', token, ' s/ ', sheet);
                        SPRITES.loadSprite(this, 'abilities', token, sheet);
                        }
                    }
                });
            }
        // Else make sure we load all ITEMS if it's their turn
        else if (this.preloadStep === 'items'){
            //console.log('Time to preload item sprites...');
            let itemsIndex = MMRPG.Indexes.items;
            let itemTokens = Object.keys(itemsIndex);
            itemTokens.forEach((token) => {
                var info = itemsIndex[token];
                //console.log('token = ', token, 'info = ', info);
                if (!info.flag_complete){ return; }
                //console.log('Preload item ', token);
                if (info.image_sheets > 0){
                    for (let sheet = 1; sheet <= info.image_sheets; sheet++){
                        //console.log('Preload item ', token, ' s/ ', sheet);
                        SPRITES.loadSprite(this, 'items', token, sheet);
                        }
                    }
                });
            }
        // Make sure we preload others on the final step
        else if (this.preloadStep === 'other'){

            // Queue the mockup images for building the main menu later
            let mockupImages = [
                'main_composite',
                    'main_banner_sub-menu',
                    'main_banner_ready-room_small',
                    'main_banner_ready-room_full',
                    'main_content_home',
                    'main_content_shops',
                    'main_content_robots',
                    'main_content_players',
                    'main_content_abilities',
                    'main_content_items',
                    'main_content_stars',
                    'main_content_database',
                    'main_content_settings',
                    'main_content_rankings',
                'battle_composite',
                ];
            mockupImages.forEach((image) => {
                //this.load.image('mockup_' + image, 'src/assets/mockup_' + image + '.png');
                this.queueMockup(image, 'mockup_' + image + '.png');
                });

            }

    }

    create ()
    {
        //console.log('PreloaderScene.create() called @ ', this.preloadStep);

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Create the base canvas for which the rest of the game will be drawn
        this.canvasImage = this.add.image(0, 0, 'canvas');
        this.canvasImage.setOrigin(0, 0);

        // Add a splash screen with the logo and the game's title
        this.splashImage = this.add.image(0, 0, 'splash');
        this.splashImage.setOrigin(0, 0);

        // We should also show the current version just to be safe
        var x = MMRPG.canvas.centerX - 50, y = MMRPG.canvas.height - 30;
        var version = 'v ' + MMRPG.version;
        let $version = Strings.addPlainText(this, x, y, version, {color: '#696969', fontSize: '12px'});
        $version.x = MMRPG.canvas.centerX - ($version.width / 2);
        $version.setDepth(9999);

        var x = MMRPG.canvas.centerX, y = MMRPG.canvas.centerY + 30;
        this.loadText = this.add.bitmapText(x, y, 'megafont-white', 'Loading '+this.preloadStep+'...', 16);
        this.loadText.setOrigin(0.5);
        this.loadText.setLetterSpacing(20);

        // Predefine the onComplete event for when all assets are loaded
        let onComplete = function(){
            //console.log('All preloader '+ctx.preloadStep+' have been loaded!!!');
            ctx.preloadComplete.push(ctx.preloadStep);
            if (ctx.preloadComplete.length >= ctx.preloadSteps.length){
                //console.log('MMRPG = ', MMRPG);
                //console.log('SPRITES = ', SPRITES);
                //console.log('!!!!!!! START TITLE SCENE !!!!!');
                ctx.scene.start('Title');
                } else {
                let nextStep = ctx.preloadSteps[ctx.preloadSteps.indexOf(ctx.preloadStep) + 1];
                //console.log('>>> NEXT STEP = ', nextStep, ' <<<');
                ctx.preloadStep = nextStep;
                ctx.scene.start('Preloader');
                }
            };

        // Set up the loading progress listener then start loading assets
        this.load.on('progress', (value) => {
            //console.log('PreloaderScene.load.on(progress) event called!!! w/ value = ', value);
            ctx.loadText.setText(`Loading ${ctx.preloadStep}... ${Math.round(value * 100)}%`);
            });
        this.load.on('complete', () => {
            //console.log('PreloaderScene.load.on(complete) event called!!!');
            if (typeof onComplete === 'function'){ onComplete(); }
            });

        // Star loading whatever queued assets we're supposed to be loading
        this.loadQueuedIndexes();
        this.loadQueuedSprites();
        this.loadQueuedMockups();

        // Start loading and pending assets now that we're setup
        this.load.start();

    }

    update ()
    {

        //console.log('PreloaderScene.update() called');

        /* ... */

    }

    queueIndex (index, file, alias = null)
    {
        //console.log('PreloaderScene.queueIndex() called w/ index = ' + index + ', file = ' + file);
        let ctx = this;
        let basePath = 'src/indexes/';
        let indexName = file.replace('.json', '');
        let indexKey = 'indexes.' + indexName;
        let indexPath = basePath + file;
        if (typeof MMRPG.Indexes[index] === 'undefined'){ MMRPG.Indexes[index] = {}; }
        ctx.load.on('filecomplete', (file) => {
            //console.log(indexKey+' filecomplete event called!!!\n file =', file, '\n indexKey =', indexKey);
            if (file !== indexKey){ return; }
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== indexName);

            let rawData = ctx.cache.json.get(indexKey);
            if (!rawData){ return; }
            //console.log('rawData = ', rawData);
            let indexData = {};
            let indexDataAlias = alias ? alias : index;
            if (typeof rawData.status !== 'undefined'
                && rawData.status === 'success'){
                if (typeof rawData.data !== 'undefined'
                    && typeof rawData.data[indexDataAlias] !== 'undefined'){
                    indexData = rawData.data[indexDataAlias];
                    }
                }

            let indexDataTokens = Object.keys(indexData);
            indexDataTokens.forEach((token) => { MMRPG.Indexes[index][token] = indexData[token]; });
            //console.log('MMRPG.Indexes['+index+'] = ', MMRPG.Indexes[index]);

            });
        //ctx.load.json(indexKey, indexPath);
        //console.log('ctx.load.json(indexKey: '+indexKey+', indexPath: '+indexPath+');');
        ctx.preloadQueue.push({ kind: 'index', index: index, key: indexKey, path: indexPath });
        ctx.preloadsQueued++;
    }
    queueMockup (name, file)
    {
        let ctx = this;
        let basePath = 'src/assets/';
        let mockupKey = 'mockups.' + name;
        let mockupPath = basePath + file;
        ctx.load.on('filecomplete', (file) => {
            if (file !== mockupKey){ return; }
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
        //ctx.load.image(mockupKey, mockupPath);
        ctx.preloadQueue.push({ kind: 'mockup', name: name, key: mockupKey, path: mockupPath });
        ctx.preloadsQueued++;
    }

    loadQueuedIndexes ()
    {
        let ctx = this;
        let queue = this.preloadQueue.filter((item) => item.kind === 'index');
        queue.forEach((item) => {
            let indexKey = item.key;
            let indexPath = item.path;
            ctx.load.json(indexKey, indexPath);
            });
    }
    loadQueuedSprites ()
    {
        let ctx = this;
        let SPRITES = this.SPRITES;
        ctx.preloadQueue.push({ kind: 'sprites', name: 'sprites.' + ctx.preloadStep });
        ctx.preloadsQueued++;
        SPRITES.preloadPending(this, function(){
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
    }
    loadQueuedMockups ()
    {
        let ctx = this;
        let queue = this.preloadQueue.filter((item) => item.kind === 'mockup');
        queue.forEach((item) => {
            let key = item.key;
            let path = item.path;
            ctx.load.image(key, path);
            });
    }

}