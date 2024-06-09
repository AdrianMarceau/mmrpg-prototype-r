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
    modified: '2024-06-09',
    version: '4.0.61'
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

export default MMRPG;