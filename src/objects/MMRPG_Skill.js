// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Skill.js (class)
// This is the primitive class for all skill objects in the game.
// All skill objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Skill extends MMRPG_Object {

    // Define the class constructor for the skill class
    constructor (scene, token, customInfo = {})
    {
        //console.log('MMRPG_Skill.constructor() called w/ token:', token, 'customInfo:', customInfo);

        // Call the parent constructor
        super(scene, 'skill', token, customInfo, null);

        // Add skill-specific properties here
        // ...

    }

    // Add skill-specific methods here
    // ...

}

export default MMRPG_Skill;
