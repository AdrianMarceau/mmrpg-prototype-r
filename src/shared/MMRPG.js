// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG.js
// Master MMRPG object for the game. This object contains all the
// global properties and methods that are shared across the entire
// game. This object is the root of the game's global namespace.
// ------------------------------------------------------------ //

// Define the master MMRPG object for the game
const MMRPG = {
    name: 'mmrpg-prototype-r',
    title: 'Mega Man RPG: Prototype (Remake)',
    created: '2024-05-20',
    modified: '2024-06-14',
    version: '4.0.125'
    };

// Define the absolute base width and height for the game canvas
const baseWidth = 780;
const baseHeight = 634;
MMRPG.canvas = {
    width: baseWidth,
    height: baseHeight,
    centerX: baseWidth / 2,
    centerY: baseHeight / 2,
    xMin: 0,
    yMin: 0,
    xMax: baseWidth,
    yMax: baseHeight
    };


// Pre-define some global MMRPG objects for use in the game
MMRPG.Init = [];
MMRPG.Utilities = {};
MMRPG.Indexes = {};
MMRPG.Cache = {};
MMRPG.Data = {};

// Define a global init function for all the MMRPG scenes and utilities
MMRPG.init = function(source, namespace, onFirstLoad, onRepeatLoads){

    // Register this utility with the MMRPG object
    let firstLoad = false;
    if (MMRPG.Init.indexOf(source) === -1){
        MMRPG.Init.push(source);
        firstLoad = true;
        }

    // Only run the first-load callback if this is the first time the utility is being initialized
    if (firstLoad){

        // Increment the MMRPG tick to track object persistence
        if (typeof MMRPG.tick === 'undefined'){ MMRPG.tick = 0; }
        MMRPG.tick++;
        console.log('MMRPG.tick = ', MMRPG.tick, ' (', source, ')');
        //console.log('MMRPG = ', MMRPG);

        // Reserve persistent storage if a namespace was provided
        if (typeof namespace === 'string'
            && namespace.length > 0){
            MMRPG.Indexes[namespace] = {};
            MMRPG.Cache[namespace] = {};
            MMRPG.Data[namespace] = {};
            }

        // Run the first-load callback function if it exists
        if (typeof onFirstLoad === 'function'){ onFirstLoad(); }

        }
    // Otherwise if this utility has already been initialized, run the every-load callback function
    else {

        // Run the repeat-loads callback function if it exists
        if (typeof onRepeatLoads === 'function'){ onRepeatLoads(); }

        }

    };

// Define a global preload function to run at the start of any MMRPG scene
MMRPG.preload = function(scene, isPreloadPhase = false){

    // ... //

    };

// Define a global create function to run at the start of any MMRPG scene
MMRPG.create = function(scene, isPreloadPhase = false){

    // Create the base canvas for which the rest of the game will be drawn
    var canvas = scene.add.image(0, 0, 'canvas');
    canvas.setOrigin(0, 0);

    // If we're still in the preload phase, we should return early
    // before trying to use more complex game objects
    if (isPreloadPhase){ return; }

    // Create the sound effects object for the scene if not exists
    if (!scene.SOUNDS){
        let soundSprite = scene.sound.addAudioSprite('sounds.effects');
        scene.SOUNDS = {
            sprite: soundSprite,
            play: function(token, options){
                if (typeof token !== 'string'){ return; }
                if (typeof options !== 'object'){ options = {}; }
                scene.sound.playAudioSprite('sounds.effects', token, options);
                }
            };
        }

    // Set the master sound volume to only 50% to start for ears' sake
    scene.sound.volume = 0.5;

    // Toggle sound on and off when the game is hidden or visible
    scene.sys.game.events.on('hidden', () => {
        scene.sound.pauseAll();
        });
    scene.sys.game.events.on('visible', () => {
        scene.sound.resumeAll();
        });

    // Toggle sound on and off when the browser tab is hidden or visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            scene.sound.mute = true;
            } else {
            scene.sound.mute = false;
            }
        });

    };

export default MMRPG;