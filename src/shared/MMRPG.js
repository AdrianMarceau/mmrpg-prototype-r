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


// -- MMRPG INIT & PRELOAD/CREATE/UPDATE METHODS -- //

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
                let sfxToken = token;
                let sfxAliasIndex = MMRPG.Indexes.sounds.aliases || {};
                //console.log('sfxAliasIndex =', sfxAliasIndex);
                if (sfxAliasIndex[token]){ sfxToken = sfxAliasIndex[token]; }
                scene.sound.playAudioSprite('sounds.effects', sfxToken, options);
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

// -- CONTENT INDEX KINDS & METHODS -- //

// Define the different types of content in MMRPG as an object
// players, robots, abilities, items, fields, skills, types
let contentKindsIndex = {
    'players': {
        'token': 'player',
        'xtoken': 'players',
        'name': 'Player',
        'xname': 'Players',
        'class': 'MMRPG_Player',
        },
    'robots': {
        'token': 'robot',
        'xtoken': 'robots',
        'name': 'Robot',
        'xname': 'Robots',
        'class': 'MMRPG_Robot',
        'subKinds': {
            'masters': {
                'token': 'master',
                'xtoken': 'masters',
                'name': 'Robot Master',
                'xname': 'Robot Masters'
                },
            'mechas': {
                'token': 'mecha',
                'xtoken': 'mechas',
                'name': 'Support Mecha',
                'xname': 'Support Mechas'
                },
            'bosses': {
                'token': 'boss',
                'xtoken': 'bosses',
                'name': 'Fortress Boss',
                'xname': 'Fortress Bosses'
                },
            }
        },
    'abilities': {
        'token': 'ability',
        'xtoken': 'abilities',
        'name': 'Ability',
        'xname': 'Abilities',
        },
    'items': {
        'token': 'item',
        'xtoken': 'items',
        'name': 'Item',
        'xname': 'Items',
        },
    'fields': {
        'token': 'field',
        'xtoken': 'fields',
        'name': 'Field',
        'xname': 'Fields',
        },
    'skills': {
        'token': 'skill',
        'xtoken': 'skills',
        'name': 'Skill',
        'xname': 'Skills',
        },
    'types': {
        'token': 'type',
        'xtoken': 'types',
        'name': 'Type',
        'xname': 'Types',
        },
    };
MMRPG.Indexes.contentKinds = contentKindsIndex;

// Define a global function for getting the different "kinds" of content in MMRPG
MMRPG.getContentKinds = function(returnKeysOnly = false){

    // Return the content index or array keys depending on what was requested
    let contentKindsIndex = MMRPG.Indexes.contentKinds;
    return (returnKeysOnly) ? Object.keys(contentKindsIndex) : contentKindsIndex;

    };

// Define a global function for parsing a given content type string (either singular or plural)
// and then returning the corresponding singlular and plural versions of that content type in
// form of an array with [token, xtoken] (e.g., ['player', 'players'])
MMRPG.parseKind = function(kind){

    // If the kind is not a string, return an empty array
    if (typeof kind !== 'string'){ return []; }

    // If the kind is a plural form, return the singular and plural forms
    let contentKindsIndex = MMRPG.Indexes.contentKinds;
    let kindInfo = Object.values(contentKindsIndex).find((kindInfo) => {
        return (kindInfo.xtoken === kind || kindInfo.token === kind);
        });
    if (kindInfo){
        return [kindInfo.token, kindInfo.xtoken];
        }

    // If the kind is not found, return an empty array
    return [];

    }


// -- CONTENT INDEX LOOKUP METHODS -- //

// Define a quick method for looking up a given player's info in the index
MMRPG.getPlayerInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let playerIndex = mmrpgIndex.players || null;
    if (!playerIndex){ return null; }
    let playerInfo = playerIndex[token] || null;
    if (!playerInfo){ return null; }
    return Object.assign({}, playerInfo);
    };

// Define a quick method for looking up a given robot's info in the index
MMRPG.getRobotInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let robotIndex = mmrpgIndex.robots || null;
    if (!robotIndex){ return null; }
    let robotInfo = robotIndex[token] || null;
    if (!robotInfo){ return null; }
    return Object.assign({}, robotInfo);
    };

// Define a quick method for looking up a given ability's info in the index
MMRPG.getAbilityInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let abilityIndex = mmrpgIndex.abilities || null;
    if (!abilityIndex){ return null; }
    let abilityInfo = abilityIndex[token] || null;
    if (!abilityInfo){ return null; }
    return Object.assign({}, abilityInfo);
    };

// Define a quick method for looking up a given item's info in the index
MMRPG.getItemInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let itemIndex = mmrpgIndex.items || null;
    if (!itemIndex){ return null; }
    let itemInfo = itemIndex[token] || null;
    if (!itemInfo){ return null; }
    return Object.assign({}, itemInfo);
    };

// Define a quick method for looking up a given field's info in the index
MMRPG.getFieldInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let fieldIndex = mmrpgIndex.fields || null;
    if (!fieldIndex){ return null; }
    let fieldInfo = fieldIndex[token] || null;
    if (!fieldInfo){ return null; }
    return Object.assign({}, fieldInfo);
    };

// Define a quick method for looking up a given skill's info in the index
MMRPG.getSkillInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let skillIndex = mmrpgIndex.skills || null;
    if (!skillIndex){ return null; }
    let skillInfo = skillIndex[token] || null;
    if (!skillInfo){ return null; }
    return Object.assign({}, skillInfo);
    };

// Define a quick method for looking up a given type's info in the index
MMRPG.getTypeInfo = function (token) {
    let mmrpgIndex = MMRPG.Indexes;
    let typeIndex = mmrpgIndex.types || null;
    if (!typeIndex){ return null; }
    let typeInfo = typeIndex[token] || null;
    if (!typeInfo){ return null; }
    return Object.assign({}, typeInfo);
    };


// -- EXPORT THE MMRPG OBJECT -- //

if (typeof window.MMRPG === 'undefined'){ window.MMRPG = MMRPG; }

export default MMRPG;