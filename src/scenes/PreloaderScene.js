// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: PreloaderScene.js (scene)
// Preloader scene for the game. This scene is responsible for
// loading the game assets and then displaying the splash screen
// and start button to the user.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import SpritesUtility from '../utils/SpritesUtility.js';

export default class PreloaderScene extends Phaser.Scene
{

    constructor ()
    {
        console.log('PreloaderScene.constructor() called');
        super('Preloader');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesUtility(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;

        // Initialize this scene with a first-load callback function
        MMRPG.init('PreloaderScene', 'Preloader', function(){

            /* ... */

            });

    }

    preload ()
    {
        //console.log('PreloaderScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        SPRITES.preload(this);

        // Define which players, robots, items, etc. to preload before starting
        this.preloadSprites = {
            players: [
                'dr-light', 'dr-wily', 'dr-cossack'
                ],
            robots: [
                'mega-man', 'proto-man', 'bass',
                'roll', 'disco', 'rhythm',
                'trill', 'slur',
                'met'
                ],
            abilities: [
                'buster-shot',
                'mega-buster'
                ],
            };


        // Loop through each sprite type and preload the necessary assets
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

        // Define some idle sprite variables first and preload so we can use them later
        this.idleSprites = {};
        this.idleSpriteTokens = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.currentIdleSprite = this.idleSpriteTokens[0];
        this.currentIdleDelay = 0;

        // Trigger post-preload methods for utility classes
        SPRITES.afterPreload(this);

    }

    create ()
    {
        //console.log('PreloaderScene.create() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        SPRITES.create(this);

        // Create the base canvas for which the rest of the game will be drawn
        this.canvasImage = this.add.image(0, 0, 'canvas');
        this.canvasImage.setOrigin(0, 0);

        // Add a splash screen with the logo and the game's title
        this.splashImage = this.add.image(0, 0, 'splash');
        this.splashImage.setOrigin(0, 0);

        var x = MMRPG.canvas.centerX, y = MMRPG.canvas.centerY + 30;
        this.loadText = this.add.bitmapText(x, y, 'megafont-white', 'Loading...', 16);
        this.loadText.setOrigin(0.5);
        this.loadText.setLetterSpacing(20);

        // Generate some idle sprites to keep the user entertained
        var x = -40, y = MMRPG.canvas.centerY + 125;
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let spriteToken = this.idleSpriteTokens[i];
            let spriteAlt = 'base';
            let spriteDir = 'right';
            let spriteSheet = SPRITES.index.sheets.players[spriteToken][spriteAlt][spriteDir];
            let spriteRunAnim = SPRITES.index.anims.players[spriteToken][spriteAlt][spriteDir].run;
            let spriteY = y + 100 + (i * 25);
            //console.log('spriteSheet = ', spriteSheet);
            //console.log('spriteRunAnim = ', spriteRunAnim);
            let $idleSprite = this.add.sprite(x, y, spriteSheet);
            this.add.tween({
                targets: $idleSprite,
                y: '-=2',
                ease: 'Sine.easeInOut',
                duration: 200,
                repeat: -1,
                yoyo: true
                });
            $idleSprite.play(spriteRunAnim);
            this.idleSprites[spriteToken] = $idleSprite;
            }

        // Start the preload queue for the main assets
        let ctx = this;
        this.preloadMainAssets(function(){
            console.log('All preloader assets loaded!!!');
            ctx.scene.start('Title');
            });

        // Trigger post-create methods for utility classes
        SPRITES.afterCreate(this);

    }

    update ()
    {

        //console.log('PreloaderScene.update() called');

        // Animate the idle sprites to give the user something to look at
        //console.log('this.currentIdleSprite = ', this.currentIdleSprite);
        //console.log('this.idleSprites = ', this.idleSprites);
        if (this.currentIdleDelay > 0){
            this.currentIdleDelay--;
            } else {
            let idleSprite = this.currentIdleSprite;
            let $idleSprite = this.idleSprites[idleSprite];
            let spriteSpeed = this.idleSpriteTokens.indexOf(idleSprite) + 1;
            $idleSprite.x += spriteSpeed;
            if ($idleSprite.x > MMRPG.canvas.width){
                $idleSprite.x = -80;
                this.currentIdleDelay += 80;
                let options = this.idleSpriteTokens;
                let nextIdleSprite = options[(options.indexOf(this.currentIdleSprite) + 1) % options.length];
                this.currentIdleSprite = nextIdleSprite;
                }

            }

    }

    preloadMainAssets (onComplete)
    {

        // Set up the preload queue variables
        this.preloadQueue = [];
        this.preloadsQueued = 0;
        this.preloadsCompleted = 0;

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
            this.load.image('mockup_' + image, 'src/assets/mockup_' + image + '.png');
            });

        // Set up the loading progress listener
        this.load.on('progress', (value) => {
            this.loadText.setText(`Loading... ${Math.round(value * 100)}%`);
            });

        this.load.on('complete', () => {
            if (typeof onComplete === 'function'){ onComplete(); }
            });

        // Start loading the assets
        this.load.start();

    }

    queueIndex (index, name, alias = null)
    {
        //console.log('PreloaderScene.queueIndex() called w/ index = ' + index + ', name = ' + name);
        this.preloadQueue.push({ index: index, name: name });
        this.preloadsQueued++;

        let basePath = 'content/indexes/';
        let indexKey = 'indexes.' + name.replace('.json', '');
        let indexPath = basePath + name;
        this.load.json(indexKey, indexPath);
        //console.log('this.load.json(indexKey: '+indexKey+', indexPath: '+indexPath+');');

        if (typeof MMRPG.Indexes[index] === 'undefined'){ MMRPG.Indexes[index] = {}; }

        this.load.on('filecomplete', (file) => {

            //console.log(indexKey+' filecomplete event called!!!');
            this.preloadsCompleted++;

            let rawData = this.cache.json.get(indexKey);
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

    }

}