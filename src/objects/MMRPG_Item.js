// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Item.js (class)
// This is the primitive class for all item objects in the game.
// All item objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Item extends MMRPG_Object {

    // Define the class constructor for the item class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //comsole.log('MMRPG_Item.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Call the parent constructor
        super(scene, 'item', token, customInfo, spriteConfig);

        // Add item-specific properties here
        // ...

    }

    // Add item-specific methods here
    // ...

}

export default MMRPG_Item;
