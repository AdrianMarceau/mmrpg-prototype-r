// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG.js
// Master MMRPG object for the game. This object contains all the
// global properties and methods that are shared across the entire
// game. This object is the root of the game's global namespace.
// ------------------------------------------------------------ //

class MMRPG {

    // The constructor for the global MMRPG object
    constructor() {

        // Define the game's core properties
        this.name = 'mmrpg-prototype-r';
        this.title = 'Mega Man RPG: Prototype (Remake)';
        this.created = '2024-05-20';
        this.modified = '2024-06-18';
        this.version = '4.0.162';

        // Define the absolute base width and height for the game canvas
        const baseWidth = 780;
        const baseHeight = 634;
        this.canvas = {
            width: baseWidth,
            height: baseHeight,
            centerX: baseWidth / 2,
            centerY: baseHeight / 2,
            xMin: 0,
            yMin: 0,
            xMax: baseWidth,
            yMax: baseHeight,
        };

        // Initialize the game's core arrays and objects
        this.Init = [];
        this.Utilities = {};
        this.Indexes = {};
        this.Managers = {};
        this.Cache = {};
        this.Data = {};

        // Initialize any hard-coded indexes that need to be created
        this.initContentKindsIndex();

    }

    // -- MMRPG INIT & PRELOAD/CREATE/UPDATE METHODS -- //

    // Define a global init function for all the MMRPG scenes and utilities
    init (source, namespace, onFirstLoad, onRepeatLoads)
    {
        let firstLoad = false;
        if (this.Init.indexOf(source) === -1) {
            this.Init.push(source);
            firstLoad = true;
        }

        if (firstLoad) {
            if (typeof this.tick === 'undefined') {
                this.tick = 0;
            }
            this.tick++;
            console.log('MMRPG.tick = ', this.tick, ' (', source, ')');

            if (typeof namespace === 'string' && namespace.length > 0) {
                this.Indexes[namespace] = {};
                this.Cache[namespace] = {};
                this.Data[namespace] = {};
            }

            if (typeof onFirstLoad === 'function') {
                onFirstLoad();
            }
        } else {
            if (typeof onRepeatLoads === 'function') {
                onRepeatLoads();
            }
        }
    }

    // Define a global preload function to run at the start of any MMRPG scene
    preload (scene, isPreloadPhase = false)
    {
        // Preload logic here
    }

    // Define a global create function to run at the start of any MMRPG scene
    create (scene, isPreloadPhase = false)
    {

        // Create the canvas for everything else to be drawn upon
        const canvas = scene.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);

    }

    // -- CONTENT INDEX KINDS & METHODS -- //


    // Define and/or return the content kinds index for this game
    initContentKindsIndex ()
    {
        // Define the different types of content in MMRPG as an object
        // players, robots, abilities, items, fields, skills, types, contentKinds
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
        this.Indexes.contentKinds = contentKindsIndex;
        return contentKindsIndex;

    }

    // Get the different content kinds but returned as keys only
    getContentKinds (returnKeysOnly = false)
    {
        const contentKindsIndex = this.Indexes.contentKinds;
        return returnKeysOnly ? Object.keys(contentKindsIndex) : contentKindsIndex;
    }

    // Define a global function for parsing a given content type string (either singular or plural)
    // and then returning the corresponding singlular and plural versions of that content type in
    // form of an array with [token, xtoken] (e.g., ['player', 'players'])
    parseKind (kind)
    {
        if (typeof kind !== 'string') {
            return [];
        }

        const contentKindsIndex = this.Indexes.contentKinds;
        const kindInfo = Object.values(contentKindsIndex).find(
            (kindInfo) => kindInfo.xtoken === kind || kindInfo.token === kind
        );
        return kindInfo ? [kindInfo.token, kindInfo.xtoken] : [];
    }

    // -- CONTENT INDEX LOOKUP METHODS -- //

    // Define a quick method for looking up a given player's info in the index
    getPlayerInfo (token)
    {
        const playerIndex = this.Indexes.players || null;
        const playerInfo = playerIndex ? playerIndex[token] : null;
        return playerInfo ? Object.assign({}, playerInfo) : null;
    }

    // Define a quick method for looking up a given robot's info in the index
    getRobotInfo (token)
    {
        const robotIndex = this.Indexes.robots || null;
        const robotInfo = robotIndex ? robotIndex[token] : null;
        return robotInfo ? Object.assign({}, robotInfo) : null;
    }

    // Define a quick method for looking up a given ability's info in the index
    getAbilityInfo (token)
    {
        const abilityIndex = this.Indexes.abilities || null;
        const abilityInfo = abilityIndex ? abilityIndex[token] : null;
        return abilityInfo ? Object.assign({}, abilityInfo) : null;
    }

    // Define a quick method for looking up a given item's info in the index
    getItemInfo (token)
    {
        const itemIndex = this.Indexes.items || null;
        const itemInfo = itemIndex ? itemIndex[token] : null;
        return itemInfo ? Object.assign({}, itemInfo) : null;
    }

    // Define a quick method for looking up a given field's info in the index
    getFieldInfo (token)
    {
        const fieldIndex = this.Indexes.fields || null;
        const fieldInfo = fieldIndex ? fieldIndex[token] : null;
        return fieldInfo ? Object.assign({}, fieldInfo) : null;
    }

    // Define a quick method for looking up a given skill's info in the index
    getSkillInfo (token)
    {
        const skillIndex = this.Indexes.skills || null;
        const skillInfo = skillIndex ? skillIndex[token] : null;
        return skillInfo ? Object.assign({}, skillInfo) : null;
    }

    // Define a quick method for looking up a given type's info in the index
    getTypeInfo (token) {
        const typeIndex = this.Indexes.types || null;
        const typeInfo = typeIndex ? typeIndex[token] : null;
        return typeInfo ? Object.assign({}, typeInfo) : null;
    }

}

// Ensure only one instance of MMRPG exists
const mmrpgInstance = new MMRPG();
if (typeof window.MMRPG === 'undefined') {
    window.MMRPG = mmrpgInstance;
}

export default mmrpgInstance;