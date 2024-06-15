// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Player.js (class)
// This is the primitive class for all player objects in the game.
// All player objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Player extends MMRPG_Object {

    // Define the class constructor for the player class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Player.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Call the parent constructor
        super(scene, 'player', token, customInfo, spriteConfig);

        // Add player-specific properties here
        // ...

    }

    // Add player-specific methods here
    // ...

}

export default MMRPG_Player;
