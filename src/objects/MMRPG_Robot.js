// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: MMRPG_Robot.js (class)
// This is the primitive class for all robot objects in the game.
// All robot objects in the game should extend this class.
// ------------------------------------------------------------- //

import MMRPG_Object from './MMRPG_Object.js';

class MMRPG_Robot extends MMRPG_Object {

    // Define the class constructor for the robot class
    constructor (scene, token, customInfo = {}, spriteConfig = {})
    {
        //console.log('MMRPG_Robot.constructor() called w/ token:', token, 'customInfo:', customInfo, 'spriteConfig:', spriteConfig);

        // Predefine object configurations unique to the robot class
        let objectConfig = {};
        objectConfig.baseAlt = 'base';
        objectConfig.iconPrefix = 'mug';
        objectConfig.frameAliases = ['base', 'taunt', 'victory', 'defeat', 'shoot', 'throw', 'summon', 'slide', 'defend', 'damage', 'base2'];

        // Call the parent constructor
        super(scene, 'robot', token, customInfo, spriteConfig, objectConfig);

        // Add robot-specific properties here
        // ...

    }

    // Example robot-specific method
    levelUp() {

        // Implement level-up logic here
        console.log(`${this.token} leveled up!`);

    }

    // Add other robot-specific methods here
    // ...

}

export default MMRPG_Robot;
