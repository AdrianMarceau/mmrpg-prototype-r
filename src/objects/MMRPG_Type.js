// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Type.js (class)
// This is the primitive class for all type objects in the game.
// All type objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Type extends MMRPG_Object {

    // Define the class constructor for the player class
    constructor (scene, token)
    {
        //console.log('MMRPG_Type.constructor() called w/ token:', token);

        // Call the parent constructor
        super(scene, 'type', token, null, null);

        // Add type-specific properties here
        // ...

    }

    // Add type-specific methods here
    // ...

}

export default MMRPG_Type;
