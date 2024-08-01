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
        //console.log('PreloaderScene.constructor() called');
        super('Preloader');

        // Initialize MMRPG utility class objects
        let SPRITES = SpritesManager.getInstance(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;

        // Define the preload steps if they haven't been
        this.preloadComplete = [];
        //this.preloadSteps = ['indexes', 'sprites', 'players', 'robots', 'abilities', 'items', 'fields', 'sounds', 'other', 'start'];
        this.preloadSteps = ['indexes', 'sprites', 'sounds', 'other', 'start'];
        this.preloadStep = this.preloadSteps[0];

        // Set up the preload queue variables
        this.preloadQueue = [];
        this.preloadsQueued = 0;
        this.preloadsCompleted = 0;

        // Define which players, robots, items, etc. to preload before starting
        this.preloadSprites = {
            players: [
                'dr-light', 'dr-wily', 'dr-cossack'
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
            fields: [
                //'light-laboratory', 'wily-castle'
                ],
            };

        // Initialize this scene with a first-load callback function
        MMRPG.onload('PreloaderScene', 'Preloader', function(){

            /* ... */

            });

    }

    init ()
    {
        //console.log('PreloaderScene.init() called');
        let MMRPG = this.MMRPG;
        MMRPG.init(this, true);
    }

    preload ()
    {
        //console.log('PreloaderScene.preload() called @ ', this.preloadStep);
        //console.log('WE ARE IN ', this.preloadStep.toUpperCase(), ' PRELOAD STEP');

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.preload(this, true);

        // Pull in other required objects and references
        let ctx = this;
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
            this.queueIndex('robots', 'robots.master.json');
            this.queueIndex('robots', 'robots.mecha.json');
            this.queueIndex('robots', 'robots.boss.json');
            this.queueIndex('abilities', 'abilities.master.json');
            this.queueIndex('abilities', 'abilities.mecha.json');
            this.queueIndex('abilities', 'abilities.boss.json');
            this.queueIndex('items', 'items.json');
            this.queueIndex('skills', 'skills.json');
            this.queueIndex('fields', 'fields.json');
            this.queueIndex('sounds', 'sounds.json');

            }
        // Preload all the default sprites if explicitly requested
        else if (this.preloadStep === 'sprites'){
            let kinds = SPRITES.index.kinds;
            let xkinds = SPRITES.index.xkinds;
            for (let i = 0; i < kinds.length; i++){
                let kind = kinds[i];
                let xkind = xkinds[i];
                if (!this.preloadSprites[xkind]){ continue; }
                SPRITES.loadSprite(ctx, kind, kind, 'base');
                let tokens = this.preloadSprites[xkind];
                let numTokens = tokens.length;
                for (let i = 0; i < numTokens; i++){
                    let token = tokens[i];
                    SPRITES.loadSprite(ctx, kind, token, 'base');
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
                if (!info.flags.complete){ return; }
                //console.log('Preload player ', token);
                SPRITES.loadSprite(ctx, 'player', token, 'base');
                let alts = [];
                if (info.image.alts){ alts = alts.concat(info.image.alts); }
                if (alts.length){
                    let altKeys = Object.keys(alts);
                    altKeys.forEach((key) => {
                        let alt = alts[key];
                        //console.log('Preload player ', token, ' w/ ', alt.token);
                        SPRITES.loadSprite(ctx, 'player', token, alt.token);
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
                if (!info.flags.complete){ return; }
                //console.log('Preload robot ', token);
                SPRITES.loadSprite(ctx, 'robot', token, 'base');
                let alts = [];
                if (info.image.alts){ alts = alts.concat(info.image.alts); }
                if (info.types[0] === 'copy'){
                    copySafeTypeTokens.forEach((typeToken) => {
                        let typeInfo = MMRPG.Indexes.types[typeToken];
                        alts.push({token: typeInfo.token, name: typeInfo.name + ' Core', color: typeToken, summons: 0});
                        });
                    alts.push({token: 'alt9', name: 'Empty Core', color: 'empty', summons: 0});
                    //console.log('Preload w/ copy alts ', alts);
                    }
                info.image.alts = alts; // MOVE THIS LATER (to the appropriate index loader class maybe?)
                if (alts.length){
                    //console.log('Preload alts ', alts);
                    let altKeys = Object.keys(alts);
                    altKeys.forEach((key) => {
                        let alt = alts[key];
                        //console.log('Preload robot ', token, ' w/ ', alt.token);
                        SPRITES.loadSprite(ctx, 'robot', token, alt.token);
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
                if (!info.flags.complete){ return; }
                //console.log('Preload ability ', token);
                if (info.image_sheets > 0){
                    for (let sheet = 1; sheet <= info.image_sheets; sheet++){
                        //console.log('Preload ability ', token, ' s/ ', sheet);
                        SPRITES.loadSprite(ctx, 'ability', token, sheet);
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
                if (!info.flags.complete){ return; }
                //console.log('Preload item ', token);
                if (info.image_sheets > 0){
                    for (let sheet = 1; sheet <= info.image_sheets; sheet++){
                        //console.log('Preload item ', token, ' s/ ', sheet);
                        SPRITES.loadSprite(ctx, 'item', token, sheet);
                        }
                    }
                });
            }
        // Else make sure we load all SOUNDS if it's their turn
        else if (this.preloadStep === 'sounds'){
            //console.log('Time to preload sounds...');

            // Also preload the sound effects for the game here (?)
            // Load the sound sprite and JSON configuration
            //let soundsPath = 'content/sounds/misc/sound-effects-curated/';
            //this.load.audioSprite('sounds', soundsPath+'audio.json', [soundsPath+'audio.mp3', soundsPath+'audio.ogg']);
            let sfxPath = 'misc/sound-effects-curated/';
            this.queueAudioSprite('effects', sfxPath+'audio.json', [sfxPath+'audio.mp3', sfxPath+'audio.ogg']);
            let sfxAliasIndex = {};
            if (typeof MMRPG.Indexes.sounds !== 'undefined'){
                let soundsIndex = MMRPG.Indexes.sounds;
                let soundCategories = Object.keys(soundsIndex);
                for (let i = 0; i < soundCategories.length; i++){
                    let token = soundCategories[i];
                    let category = soundsIndex[token];
                    let label = category.label;
                    let index = category.index;
                    let aliases = Object.keys(index);
                    for (let j = 0; j < aliases.length; j++){
                        let alias = aliases[j];
                        let sound = index[alias];
                        sfxAliasIndex[alias] = sound;
                        }
                    }
                }
            MMRPG.Indexes.sounds.aliases = sfxAliasIndex;
            //console.log('sfxAliasIndex =', sfxAliasIndex);

            }
        // Make sure we preload others on the final step
        else if (this.preloadStep === 'other'){

            // Queue misc image assets for building parts of the game later
            let miscImages = [
                'sprite-grid',
                'battle-grid',
                'battle-grid_debug',
                ];
            miscImages.forEach((image) => {
                this.queueMiscImage(image, 'misc_' + image + '.png');
                });

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
                this.queueMockupImage(image, 'mockup_' + image + '.png');
                });

            }

    }

    create ()
    {
        //console.log('PreloaderScene.create() called @ ', this.preloadStep);

        // Pull in global MMRPG object and trigger the create function
        let MMRPG = this.MMRPG;
        MMRPG.create(this, true);

        // Pull in other required objects and references
        let ctx = this;
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
                // If the browser URL has a debug flag, show the debug scene immediately
                if (window.location.hash.indexOf('debug') > -1){
                    ctx.scene.start('Debug');
                    }
                // Otherwise we can show the title screen now instead
                else {
                    ctx.scene.start('Title');
                    }
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
        this.loadQueuedMockupImages();
        this.loadQueuedMiscImages();
        this.loadQueuedAudio();
        this.loadQueuedAudioSprites();

        // Preload indexes if we're on the indexes step
        if (this.preloadComplete.includes('indexes')){
            //console.log('PreloaderScene().create() - indexes have been loaded!!!');

            // Create a variable to hold parsed indexes if not already there
            if (typeof this.parsedIndexes === 'undefined'){ this.parsedIndexes = []; }

            // Collect the types index as we need it for basically everything
            let typesIndex = MMRPG.Indexes.types;
            let typesTokens = Object.keys(typesIndex);

            // If the players index has loaded but has not been parsed, do so now
            if (MMRPG.Indexes.players
                && !this.parsedIndexes.includes('players')){
                //console.log('PreloaderScene().create() - parsing players index...');

                // Collect the player keys and then loop through them
                let playersIndex = MMRPG.Indexes.players;
                let playersIndexTokens = Object.keys(playersIndex);
                for (let i = 0; i < playersIndexTokens.length; i++){

                    // Collect the player token and info at present
                    let playerToken = playersIndexTokens[i];
                    let playerInfo = playersIndex[playerToken];

                    // Generate the base stats and assign them to the player
                    let baseStats = MMRPG.generateBaseStats('player', playerInfo);
                    playerInfo.baseStats = baseStats;
                    //console.log('Player name:', playerInfo.name, 'baseStats:', baseStats);

                    }

                // Add the player index to the parsed indexes list
                this.parsedIndexes.push('players');

                }

            // If the robots index has loaded but has not been parsed, do so now
            if (MMRPG.Indexes.robots
                && !this.parsedIndexes.includes('robots')){
                //console.log('PreloaderScene().create() - parsing robots index...');

                // Collect the robot keys and then loop through them
                let robotsIndex = MMRPG.Indexes.robots;
                let robotsIndexTokens = Object.keys(robotsIndex);
                for (let i = 0; i < robotsIndexTokens.length; i++){

                    // Collect the robot token and info at present
                    let robotToken = robotsIndexTokens[i];
                    let robotInfo = robotsIndex[robotToken];

                    // Generate the base stats and assign them to the robot
                    let baseStats = MMRPG.generateBaseStats('robot', robotInfo);
                    robotInfo.baseStats = baseStats;
                    //console.log('Robot name:', robotInfo.name, 'baseStats:', baseStats);

                    // If this is a copy core and they don't their alts, generate them
                    if (robotInfo.types[0] === 'copy'){
                        let imageAlts = robotInfo.image.alts || [];
                        let altTokens = imageAlts.map((alt) => alt.token);
                        //imageAlts.push({token: 'none', name: 'None', summons: 0, color: 'none'});
                        for (let i = 0; i < typesTokens.length; i++){
                            let typeToken = typesTokens[i];
                            let typeInfo = typesIndex[typeToken];
                            if (typeToken === 'copy'){ continue; }
                            if (typeInfo.class !== 'normal'){ continue; }
                            if (altTokens.includes(typeToken)){ continue; }
                            imageAlts.push({token: typeToken, name: typeInfo.name + ' Core', color: typeToken, summons: 0});
                            }
                        robotInfo.image.alts = imageAlts;
                        //console.log('Copy-core robot name:', robotInfo.name, 'imageAlts:', imageAlts);
                        }

                    }

                // Add the robot index to the parsed indexes list
                this.parsedIndexes.push('robots');

                }

        }

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
        let MMRPG = this.MMRPG;
        let basePath = MMRPG.paths.indexes;
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
    queueMockupImage (name, file)
    {
        let ctx = this;
        let MMRPG = this.MMRPG;
        let basePath = MMRPG.paths.assets;
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
    queueMiscImage (name, file)
    {
        let ctx = this;
        let MMRPG = this.MMRPG;
        let basePath = MMRPG.paths.assets;
        let miscKey = 'misc.' + name;
        let miscPath = basePath + file;
        ctx.load.on('filecomplete', (file) => {
            if (file !== miscKey){ return; }
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
        //ctx.load.image(miscKey, miscPath);
        ctx.preloadQueue.push({ kind: 'misc', name: name, key: miscKey, path: miscPath });
        ctx.preloadsQueued++;
    }
    queueAudio (name, file)
    {
        let ctx = this;
        let MMRPG = this.MMRPG;
        let basePath = MMRPG.paths.sounds;
        let audioKey = 'sounds.' + name;
        let audioPath = basePath + file;
        ctx.load.on('filecomplete', (file) => {
            if (file !== audioKey){ return; }
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
        //ctx.load.audio(audioKey, audioPath);
        ctx.preloadQueue.push({ kind: 'audio', name: name, key: audioKey, path: audioPath });
        ctx.preloadsQueued++;
    }
    queueAudioSprite (name, jsonFile, audioFiles)
    {
        //console.log('PreloaderScene.queueAudioSprite() called w/ name = ' + name + ', jsonFile = ' + jsonFile + ', audioFiles = ', audioFiles);
        let ctx = this;
        let MMRPG = this.MMRPG;
        let basePath = MMRPG.paths.sounds;
        let audioKey = 'sounds.' + name;
        let jsonPath = basePath + jsonFile;
        let audioPaths = audioFiles.map((file) => basePath + file);
        ctx.load.on('filecomplete', (file) => {
            if (file !== audioKey){ return; }
            //console.log('Audio sprite filecomplete event called!!!\n file =', file, '\n audioKey =', audioKey);
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
        ctx.preloadQueue.push({ kind: 'audio-sprite', name: name, key: audioKey, path: jsonPath, sources: audioPaths });
        ctx.preloadsQueued++;
    }

    loadQueuedIndexes ()
    {
        let ctx = this;
        let queue = ctx.preloadQueue.filter((item) => item.kind === 'index');
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
        SPRITES.preloadPending(ctx, function(){
            ctx.preloadsCompleted++;
            ctx.preloadQueue = ctx.preloadQueue.filter((item) => item.name !== name);
            });
    }
    loadQueuedMockupImages ()
    {
        let ctx = this;
        let queue = ctx.preloadQueue.filter((item) => item.kind === 'mockup');
        queue.forEach((item) => {
            let key = item.key;
            let path = item.path;
            ctx.load.image(key, path);
            });
    }
    loadQueuedMiscImages ()
    {
        let ctx = this;
        let queue = ctx.preloadQueue.filter((item) => item.kind === 'misc');
        queue.forEach((item) => {
            let key = item.key;
            let path = item.path;
            //console.log('Preload misc image ', key, ' from ', path);
            ctx.load.image(key, path);
            });
    }
    loadQueuedAudio ()
    {
        let ctx = this;
        let queue = ctx.preloadQueue.filter((item) => item.kind === 'audio');
        queue.forEach((item) => {
            let key = item.key;
            let path = item.path;
            ctx.load.audio(key, path);
            });
    }
    loadQueuedAudioSprites ()
    {
        let ctx = this;
        let queue = ctx.preloadQueue.filter((item) => item.kind === 'audio-sprite');
        queue.forEach((item) => {
            let key = item.key;
            let path = item.path;
            let sources = item.sources;
            ctx.load.audioSprite(key, path, sources);
            });
    }


}