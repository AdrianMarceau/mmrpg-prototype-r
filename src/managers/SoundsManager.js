// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: SoundsManager.js
// Sounds utility class for the game. This class contains methods
// for managing and playing sounds in the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class SoundsManager {

    // Static method to get the singleton instance of this class
    static getInstance (scene)
    {
        //console.log('SoundsManager.getInstance() called');
        if (!MMRPG.Managers.SOUNDS){ MMRPG.Managers.SOUNDS = new SoundsManager(scene); }
        return MMRPG.Managers.SOUNDS;
    }

    // Constructor for the SoundsManager class
    constructor(scene)
    {
        //console.log('SoundsManager.constructor() called');

        // Ensure passed context is available to the entire class
        this.MMRPG = MMRPG;
        this.scene = scene;

        // Predefine some internal variables for the sounds interface
        this.soundSprite = null;

        // Initialize this scene with a first-load callback function
        MMRPG.init('SoundsManager', 'Sounds', function(){

            /* ... */

            });
    }
    init (scene)
    {
        //console.log('SoundsManager.init() called');
        this.scene = scene;
        scene.events.on('preload', this.preload, this);
        scene.events.on('create', this.create, this);
        scene.events.on('update', this.update, this);
    }

    preload ()
    {
        //console.log('SoundsManager.preload() called');
        /* ... */
    }
    create ()
    {
        //console.log('SoundsManager.create() called');

        let MMRPG = this.MMRPG;
        let scene = this.scene;

        // Turn the base volumn down to start
        scene.sound.volume = 0.5;

        // Make it so sounds are paused whenever the game is inactive
        scene.sys.game.events.on('hidden', () => {
            scene.sound.pauseAll();
            });
        scene.sys.game.events.on('visible', () => {
            scene.sound.resumeAll();
            });
        document.addEventListener('visibilitychange', () => {
            scene.sound.mute = document.hidden;
            });

        // Create the sound sprite in the scene if not yet created
        if (this.soundSprite){
            this.soundSprite = scene.sound.addAudioSprite('sounds.effects');
            }

        // If the parent scene does not yet have a reference to sounds, create it
        if (!scene.SOUNDS){
            scene.SOUNDS = this;
            }

    }
    update ()
    {
        //console.log('SoundsManager.update() called');
        /* ... */
    }

    // Play a sound from the sound sprite
    play (token, options = {})
    {
        //console.log('SoundsManager.play() called');
        if (typeof token !== 'string'){ return; }
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let sfxToken = token;
        const sfxAliasIndex = MMRPG.Indexes.sounds.aliases || {};
        if (sfxAliasIndex[token]) { sfxToken = sfxAliasIndex[token]; }
        scene.sound.playAudioSprite('sounds.effects', sfxToken, options);
    }


}
