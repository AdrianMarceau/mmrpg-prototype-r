// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Item.js (class)
// This is the primitive class for all item objects in the game.
// All item objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Field extends MMRPG_Object {

    // Define the class constructor for the field class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Field.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Predefine object configurations unique to the field class
        let objectConfig = {};
        objectConfig.baseSize = [1124, 768];

        // Call the parent constructor
        super(scene, 'field', token, customInfo, spriteConfig, objectConfig);

        // Add field-specific properties here
        // ...

    }

    // Add field-specific methods here
    // ...

}

export default MMRPG_Field;
