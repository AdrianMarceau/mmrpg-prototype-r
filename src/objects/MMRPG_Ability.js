// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Ability.js (class)
// This is the primitive class for all ability objects in the game.
// All ability objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Ability extends MMRPG_Object {

    // Define the class constructor for the ability class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Ability.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Predefine object configurations unique to the ability class
        let objectConfig = {};
        objectConfig.baseSheet = 1;
        objectConfig.iconPrefix = 'icon';

        // Call the parent constructor
        super(scene, 'ability', token, customInfo, spriteConfig, objectConfig);

        // Add ability-specific properties here
        // ...

    }

    // Add ability-specific methods here
    // ...

}

export default MMRPG_Ability;
