// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG.js
// Master MMRPG object for the game. This object contains all the
// global properties and methods that are shared across the entire
// game. This object is the root of the game's global namespace.
// ------------------------------------------------------------ //

class MMRPG {

    // The constructor for the global MMRPG object
    constructor () {
        //console.log('%c' + 'MMRPG global constructor called!', 'color: #00f; font-weight: bold;');

        // Define the game's core properties
        let metaData = window.mmrpgMetaData || {};
        this.name = metaData.name || 'mmrpg-prototype-r';
        this.title = metaData.title || 'Mega Man RPG: Prototype (Remake)';
        this.created = metaData.created || '20XX-XX-XX';
        this.modified = metaData.modified || '20XX-XX-XX';
        this.version = metaData.version || '0.0.1';
        this.developer = metaData.developer || 'Ageman20XX';
        this.contributors = metaData.contributors || [];
        this.copyright = metaData.copyright || 'Mega Man Trademarks & Characters © Capcom 1986 - 20XX';
        if (this.copyright.indexOf('20XX') !== -1){
            this.copyright = this.copyright.replace('20XX', (new Date().getFullYear()));
            }

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
        this.canvas.offscreen = {
            x: -9999,
            y: -9999,
            z: -9999,
            };

        // Define some paths we might find useful later
        this.paths = {};
        this.paths.base = 'game/';
        this.paths.content = 'content/';
        this.paths.sounds = 'content/sounds/';
        this.paths.source = 'src/'+this.version+'/';
        this.paths.assets = 'src/'+this.version+'/assets/';
        this.paths.indexes = 'src/'+this.version+'/indexes/';

        // Define some settings we can change later maybe
        this.settings = {};
        this.settings.volume = {};
        this.settings.volume.base = 0.5;
        this.settings.volume.music = 1.0;
        this.settings.volume.effects = 1.0;
        this.settings.volume.menus = 1.0;

        // Initialize the game's core arrays and objects
        this.Init = [];
        this.Utilities = {};
        this.Indexes = {};
        this.Managers = {};
        this.Cache = {};
        this.Data = {};
        this.SaveData = {};

        // Initialize any hard-coded indexes that need to be created
        this.initContentKindsIndex();

        // Initialize the save data index with necessary sub-indexes and values
        this.initSaveDataStructure();

        // Add some supplimentary methods to the MMRPG parent objects above
        this.Managers.init = this.initManagers.bind(this);
        this.Managers.preload = this.preloadManagers.bind(this);
        this.Managers.create = this.createManagers.bind(this);
        this.Managers.update = this.updateManagers.bind(this);
        this.Managers.getKeys = function (){
            let keys = Object.keys(this);
            let remove = ['getKeys', 'init', 'preload', 'create', 'update'];
            return keys.filter((key) => !remove.includes(key));
            };
        //console.log('-> MMRPG.Managers:', this.Managers);

        // Create this for storing debug stuff a dev might wanna see
        this.debug = {};

    }

    // -- MMRPG INIT & PRELOAD/CREATE/UPDATE METHODS -- //

    // Define a global constructor function for all the MMRPG scenes and utilities to use
    onload (source, namespace, onFirstLoad, onRepeatLoads)
    {
        //console.log('MMRPG.onload() called w/ source:', source, 'namespace:', namespace);
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
            //console.log('MMRPG.tick = ', this.tick, ' (', source, ')');

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

    // Define a global init function to run at the start of any MMRPG scene
    init (scene, isPreloadPhase = false)
    {
        //console.log('MMRPG.init() called w/ scene:', scene, 'isPreloadPhase:', isPreloadPhase);

        // Automatically run the init methods for any managers
        this.Managers.init(scene);

    }

    // Define a global preload function to run at the start of any MMRPG scene
    preload (scene, isPreloadPhase = false)
    {
        //console.log('MMRPG.preload() called w/ scene:', scene, 'isPreloadPhase:', isPreloadPhase);

        // Automatically run the preload methods for any managers in memory
        this.Managers.preload(scene);

    }

    // Define a global create function to run at the start of any MMRPG scene
    create (scene, isPreloadPhase = false)
    {
        //console.log('MMRPG.create() called w/ scene:', scene, 'isPreloadPhase:', isPreloadPhase);

        // Automatically run the create methods for any managers in memory
        this.Managers.create(scene);

        // Create the canvas for everything else to be drawn upon
        const canvas = scene.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);
        canvas.setDepth(0);

    }

    // Define a global update function to run at the start of any MMRPG scene
    update (scene, time, delta)
    {
        //console.log('MMRPG.update() called w/ scene:', scene, 'time:', time, 'delta:', delta);

        // Automatically run the update methods for any managers in memory
        this.Managers.update(scene, time, delta);

    }

    // -- MMRPG MANAGER METHODS -- //

    // Loop through any managers in memory and re-initialize them with the current scene
    initManagers (scene)
    {
        //console.log('MMRPG.initManagers() called w/ scene:', scene.scene.key);
        let managers = this.Managers;
        //console.log('-> managers:', managers);
        //console.log('-> this.Managers:', this.Managers);
        if (typeof managers === 'object' && Object.keys(managers).length > 0) {
            const managerKeys = managers.getKeys();
            //console.log('-> found', managerKeys.length, 'manager keys:', managerKeys);
            for (let i = 0; i < managerKeys.length; i++) {
                const managerKey = managerKeys[i];
                const manager = managers[managerKey];
                if (typeof manager.init === 'function') {
                    manager.init(scene);
                }
            }
        }
    }

    // Loop through any managers in memory and re-preload them with the current scene
    preloadManagers (scene)
    {
        //console.log('MMRPG.preloadManagers() called w/ scene:', scene.scene.key);
        let managers = this.Managers;
        //console.log('-> managers:', managers);
        if (typeof managers === 'object' && Object.keys(managers).length > 0) {
            const managerKeys = managers.getKeys();
            //console.log('-> found', managerKeys.length, 'manager keys:', managerKeys);
            for (let i = 0; i < managerKeys.length; i++) {
                const managerKey = managerKeys[i];
                const manager = managers[managerKey];
                if (typeof manager.preload === 'function') {
                    manager.preload(scene);
                }
            }
        }
    }

    // Loop through any managers in memory and re-create them with the current scene
    createManagers (scene)
    {
        //console.log('MMRPG.createManagers() called w/ scene:', scene.scene.key);
        let managers = this.Managers;
        //console.log('-> managers:', managers);
        if (typeof managers === 'object' && Object.keys(managers).length > 0) {
            const managerKeys = managers.getKeys();
            //console.log('-> found', managerKeys.length, 'manager keys:', managerKeys);
            for (let i = 0; i < managerKeys.length; i++) {
                const managerKey = managerKeys[i];
                const manager = managers[managerKey];
                if (typeof manager.create === 'function') {
                    manager.create(scene);
                }
            }
        }
    }

    // Loop through any managers in memory and re-update them with the current scene
    updateManagers (scene, time, delta)
    {
        //console.log('MMRPG.updateManagers() called w/ scene:', scene.scene.key, 'time:', time, 'delta:', delta);
        let managers = this.Managers;
        //console.log('-> managers:', managers);
        if (typeof managers === 'object' && Object.keys(managers).length > 0) {
            const managerKeys = managers.getKeys();
            //console.log('-> found', managerKeys.length, 'manager keys:', managerKeys);
            for (let i = 0; i < managerKeys.length; i++) {
                const managerKey = managerKeys[i];
                const manager = managers[managerKey];
                if (typeof manager.update === 'function') {
                    manager.update(scene, time, delta);
                }
            }
        }
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


    // -- OBJECT GENERATION & PARSING METHODS -- //

    // Calculate an object's proportional stat values given its kind and the starting data
    generateBaseStats (kind, data)
    {
        //console.log('MMRPG.generateBaseStats() called w/ kind:', kind, 'data:', data);

        // Predefine the counters and objects we'll be using for the stats
        let total = 0;
        let average = 0;
        let values = {};
        let ratios = {};
        let multipliers = {};
        let dividers = {};
        let baseStats = {};

        // If this is a player we need to manually adjust their stats due to
        // how their stats are coded like "bonus" values (ie. speed of 25 means +25%)
        if (kind === 'player'){

            // Start each stat at a flat value and work out way from there
            values.energy = 100;
            values.attack = 100;
            values.defense = 100;
            values.speed = 100;

            if (data.energy > 0){
                let val = data.energy;
                let modVal = Math.ceil(val / 3);
                values.energy += val;
                values.attack -= modVal;
                values.defense -= modVal;
                values.speed -= modVal;
                }
            if (data.attack > 0){
                let val = data.attack;
                values.attack += val;
                values.defense -= val;
                }
            if (data.defense > 0){
                let val = data.defense;
                values.defense += val;
                values.speed -= val;
                }
            if (data.speed > 0){
                let val = data.speed;
                values.speed += val;
                values.attack -= val;
                }

            }
        // Otherwise we can pull stats normally
        else {

            // Pull any existing stat values from the data object
            values.energy = data.energy || 100;
            values.attack = data.attack || 100;
            values.defense = data.defense || 100;
            values.speed = data.speed || 100;

            }

        // Add the collected values together to get the total and average
        total += values.energy;
        total += values.attack;
        total += values.defense;
        total += values.speed;
        average = Math.round(total / 4);

        // Calculate the proportional ratios for each stat
        ratios.energy = (values.energy / total);
        ratios.attack = (values.attack / total);
        ratios.defense = (values.defense / total);
        ratios.speed = (values.speed / total);

        // Calculate the "booster" values for when a stat is used beneficially
        multipliers.energy = values.energy === average ? 1 : (values.energy / average);
        multipliers.attack = values.attack === average ? 1 : (values.attack / average);
        multipliers.defense = values.defense === average ? 1 : (values.defense / average);
        multipliers.speed = values.speed === average ? 1 : (values.speed / average);

        // Calculate the "breaker" values for when a stat is used detrimentally
        dividers.energy = 1 - (multipliers.energy - 1);
        dividers.attack = 1 - (multipliers.attack - 1);
        dividers.defense = 1 - (multipliers.defense - 1);
        dividers.speed = 1 - (multipliers.speed - 1);

        // Quick inner function to round all values in an object to max 4 decimals
        const roundValues = function(obj){
            let newObj = {};
            let keys = Object.keys(obj);
            for (let i = 0; i < keys.length; i++){
                let key = keys[i];
                let val = obj[key];
                newObj[key] = Math.round(val * 10000) / 10000;
                }
            return newObj;
            };

        // Update the baseStats object with the calculated values
        baseStats.total = total;
        baseStats.average = average;
        baseStats.values = values;
        baseStats.ratios = roundValues(ratios);
        baseStats.multipliers = roundValues(multipliers);
        baseStats.dividers = roundValues(dividers);

        // Return the baseStats object
        return baseStats;

    }


    // -- USER SAVE FILE METHODS -- //

    // Define a function to be run at startup for crafting the save data structure
    initSaveDataStructure ()
    {
        //console.log('MMRPG.initSaveDataStructure() called.');

        // Pull in any existing save data from local storage
        let saveData = this.SaveData || {};
        if (saveData.init){ return; }
        saveData.init = true;

        // Define the VERSION this save file was last accessed
        saveData.version = this.version;

        // Define the DATES section and populate with defaults
        saveData.dates = {};
        let dates = saveData.dates;

            // Created, Modified, Accessed
            dates.created = Date.now();
            dates.modified = Date.now();
            dates.accessed = Date.now();

        // Define the FLAGS section and populate with defaults
        saveData.flags = {};
        let flags = saveData.flags;

            // Story Chapters
            flags.chaptersUnlocked = {};
            flags.chaptersVisited = {};
            flags.chaptersCurrent = {};

        // Define the COUNTERS section and populate with defaults
        saveData.counters = {};
        let counters = saveData.counters;

            // Points & Zenny
            counters.battlePoints = 0;
            counters.battleZenny = 0;

            // Battle Turns
            counters.battleTurns = {};
            counters.battleTurns.total = 0;

            // Battle Victories & Defeats
            counters.battleVictories = {};
            counters.battleVictories.total = 0;
            counters.battleDefeats = {};
            counters.battleDefeats.total = 0;

            // Star Force
            counters.starForce = {};
            counters.starForce.total = 0;

        // Define the VALUES section and populate with defaults
        saveData.values = {};
        let values = saveData.values;

            // Story Chapters
            flags.chaptersUnlocked = {};
            flags.chaptersVisited = {};
            flags.chaptersCurrent = {};

            // Last Load/Save
            values.lastLoad = Date.now();
            values.lastSave = Date.now();

            // Favourites
            values.playerFavs = {};
            values.robotFavs = {};

            // Star Force
            values.starForce = {};
            values.starForceStrict = {};


        // Define the RECORDS section and populate with defaults
        saveData.records = {};
        let records = saveData.records;

            // Battle Victories & Defeats
            records.battleVictories = {};
            records.battleDefeats = {};

            // Database Robots Encountered & Defeated
            records.robotsEncountered = {};
            records.robotsDefeated = {};

        // Define the PLAYERS section and populate with defaults
        saveData.players = {};
        let players = saveData.players;

            // Define the basic structures and method for adding new
            players.unlocked = [];
            players.index = {};
            players.getPlayer = function (token) { return players.index[token] || null; };
            players.addPlayer = function (token, data = {}) {
                let player = players.index[token] || {};
                // ----
                player.token = token;
                player.id = player.id || data.id || (100 + players.unlocked.length + 1);
                // basic
                player.level = player.level || data.level || 1;
                player.points = player.points || data.points || 0;
                player.flags = player.flags || data.flags || [];
                // rewards
                player.rewards = player.rewards || data.rewards || {};
                player.rewards.robots = player.rewards.robots || [];
                player.rewards.abilities = player.rewards.abilities || [];
                player.rewards.fields = player.rewards.fields || [];
                player.rewards.alts = player.rewards.alts || [];
                // settings
                player.settings = player.settings || data.settings || {};
                player.settings.image = player.settings.image || data.image || '';
                player.settings.robots = player.settings.robots || data.robots || [];
                player.settings.fields = player.settings.fields || data.fields || [];
                player.settings.challenges = player.settings.challenges || data.challenges || [];
                player.settings.assist = player.settings.assist || data.assist || '';
                // records
                player.records = player.records || data.records || {};
                player.records.summons = player.records.summons || 0;
                player.records.knockouts = player.records.knockouts || 0;
                player.records.victories = player.records.victories || 0;
                player.records.defeats = player.records.defeats || 0;
                // ----
                players.index[token] = player;
                if (!players.unlocked.includes(token)) { players.unlocked.push(token); }
                return player;
                };

        // Define the ROBOTS section and populate with defaults
        saveData.robots = {};
        let robots = saveData.robots;

            // Define the basic structures and method for adding new
            robots.unlocked = [];
            robots.index = {};
            robots.getRobot = function (token) { return robots.index[token] || null; };
            robots.addRobot = function (token, data = {}) {
                let robot = robots.index[token] || {};
                // ----
                robot.token = token;
                robot.id = robot.id || data.id || (100 + robots.unlocked.length + 1);
                // basic
                robot.level = robot.level || data.level || 1;
                robot.experience = robot.experience || data.experience || 0;
                robot.flags = robot.flags || data.flags || [];
                // rewards
                robot.rewards = robot.rewards || data.rewards || {};
                robot.rewards.abilities = robot.rewards.abilities || [];
                robot.rewards.fields = robot.rewards.fields || [];
                robot.rewards.alts = robot.rewards.alts || [];
                robot.rewards.energy = robot.rewards.energy || 0;
                robot.rewards.weapons = robot.rewards.weapons || 0;
                robot.rewards.attack = robot.rewards.attack || 0;
                robot.rewards.defense = robot.rewards.defense || 0;
                robot.rewards.speed = robot.rewards.speed || 0;
                // settings
                robot.settings = robot.settings || data.settings || {};
                robot.settings.image = robot.settings.image || data.image || '';
                robot.settings.item = robot.settings.item || data.item || '';
                robot.settings.abilities = robot.settings.abilities || data.abilities || [];
                robot.settings.player = robot.settings.player || data.player || '';
                robot.settings.firstPlayer = robot.settings.firstPlayer || data.firstPlayer || '';
                robot.settings.persona = robot.settings.persona || data.persona || '';
                robot.settings.personaImage = robot.settings.personaImage || data.personaImage || '';
                // pending
                robot.pending = robot.pending || data.pending || {};
                robot.pending.energy = robot.pending.energy || 0;
                robot.pending.weapons = robot.pending.weapons || 0;
                robot.pending.attack = robot.pending.attack || 0;
                robot.pending.defense = robot.pending.defense || 0;
                robot.pending.speed = robot.pending.speed || 0;
                // records
                robot.records = robot.records || robot.records || {};
                robot.records.summons = robot.records.summons || 0;
                robot.records.knockouts = robot.records.knockouts || 0;
                robot.records.victories = robot.records.victories || 0;
                robot.records.defeats = robot.records.defeats || 0;
                robot.records.damageDealt = robot.records.damageDealt || 0;
                robot.records.damageTaken = robot.records.damageTaken || 0;
                robot.records.maxDamageDealt = robot.records.maxDamageDealt || 0;
                robot.records.maxDamageTaken = robot.records.maxDamageTaken || 0;
                // ----
                robots.index[token] = robot;
                if (!robots.unlocked.includes(token)) { robots.unlocked.push(token); }
                return robot;
                };

        // Define the ABILITIES section and populate with defaults
        saveData.abilities = {};
        let abilities = saveData.abilities;

            // Define the basic structures and method for adding new
            abilities.unlocked = [];
            abilities.index = {};
            abilities.getAbility = function (token) { return abilities.index[token] || false; };
            abilities.addAbility = function (token) {
                let ability = abilities.index[token] || false;
                ability = true;
                abilities.index[token] = ability;
                if (!abilities.unlocked.includes(token)) { abilities.unlocked.push(token); }
                return ability;
                };

        // Define the FIELDS section and populate with defaults
        saveData.fields = {};
        let fields = saveData.fields;

            // Define the basic structures and method for adding new
            fields.unlocked = [];
            fields.index = {};
            fields.getField = function (token) { return fields.index[token] || false; };
            fields.addField = function (token) {
                let field = fields.index[token] || false;
                field = true;
                fields.index[token] = field;
                if (!fields.unlocked.includes(token)) { fields.unlocked.push(token); }
                return field;
                };

        // Define the ITEMS section and populate with defaults
        saveData.items = {};
        let items = saveData.items;

            // Define the basic structures and method for adding new
            items.unlocked = [];
            items.index = {};
            items.getItem = function (token) { return items.index[token] || 0; };
            items.addItem = function (token, quantity = 0) {
                let item = items.index[token] || 0;
                item = item + quantity;
                items.index[token] = item;
                if (!items.unlocked.includes(token)) { items.unlocked.push(token); }
                return item;
                };

        // Define the STARS section and populate with defaults
        saveData.stars = {};
        let stars = saveData.stars;

            // Define the basic structures and method for adding new
            stars.unlocked = [];
            stars.index = {};
            stars.getStar = function (token) { return stars.index[token] || null; };
            stars.addStar = function (token, data = {}) {
                let star = stars.index[token] || {};
                // ----
                star.token = token;
                star.name = star.name || data.name || '';
                star.kind = star.kind || data.kind || '';
                star.type = star.type || data.type || '';
                star.type2 = star.type2 || data.type2 || '';
                star.field = star.field || data.field || '';
                star.field2 = star.field2 || data.field2 || '';
                star.player = star.player || data.player || '';
                star.date = star.date || data.date || Date.now();
                // ----
                stars.index[token] = star;
                if (!stars.unlocked.includes(token)) { stars.unlocked.push(token); }
                return star;
                };

        // Define the REWARDS section and populate with defaults
        saveData.rewards = {};
        let rewards = saveData.rewards;

            // Story
            rewards.story = [];

        // Define the SETTINGS section and populate with defaults
        saveData.settings = {};
        let settings = saveData.settings;

            // Story
            settings.story = {};

            // Frames
            settings.frames = {};
            settings.frames.Database = {};
            settings.frames.Database.lastRobotToken = '';
            settings.frames.Database.lastPageKey = 0;

            // Sounds
            settings.sounds = {};
            settings.sounds.music = {};
            settings.sounds.music.volume = 1;
            settings.sounds.effects = {};
            settings.sounds.effects.volume = 1;

            // Other
            settings.other = {};
            settings.other.autoSave = true;

        // Add the save data to the global MMRPG object
        this.SaveData = saveData;
        //console.log('MMRPG.SaveData = ', this.SaveData);

    }

}

// Ensure only one instance of MMRPG exists
const mmrpgInstance = new MMRPG();
if (typeof window.MMRPG === 'undefined') {
    window.MMRPG = mmrpgInstance;
}

export default mmrpgInstance;