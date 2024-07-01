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
        let baseVolume = MMRPG.settings.volume.base || 1.0;
        scene.sound.volume = baseVolume;

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

    // Execute a given callback after a certain amount of time gas passed
    delayedCall (delay, callback)
    {
        //console.log('SoundsManager.delayedCall() called for w/ delay:', delay, 'callback:', typeof callback);
        let _this = this;
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let delayedCall = scene.time.delayedCall(delay, function(){
            //console.log('SoundsManager.delayedCall() callback triggered after delay:', delay, 'callback:', typeof callback, 'scene:', scene);
            return callback.call(_this);
            }, [], scene);
        return delayedCall;
    }

    // Play a sound from the sound sprite
    play (token, options = {})
    {
        //console.log('SoundsManager.play() called w/ token:', token, 'options:', options);
        if (typeof token !== 'string'){ return; }
        if (options.delay){
            let delay = options.delay;
            delete options.delay;
            return this.delayedCall(delay, this.play.bind(this, token, options));
            }
        let MMRPG = this.MMRPG;
        let scene = this.scene;
        let sfxToken = token;
        const sfxAliasIndex = MMRPG.Indexes.sounds.aliases || {};
        if (sfxAliasIndex[token]) { sfxToken = sfxAliasIndex[token]; }
        scene.sound.playAudioSprite('sounds.effects', sfxToken, options);
    }

    // Play a "music" sound effect with predefined volume and settings
    playMusic (token, options = {})
    {
        //console.log('SoundsManager.playMusic() called w/ token:', token, 'options:', options);
        let MMRPG = this.MMRPG;
        let baseVolume = MMRPG.settings.volume.base || 1.0;
        let musicVolume = MMRPG.settings.volume.music || 1.0;
        let volume = (options.volume || 1.0) * (baseVolume * musicVolume);
        //console.log(token + ' | -> baseVolume:', baseVolume, 'musicVolume:', musicVolume, 'volume:', volume);
        options.volume = volume;
        return this.play(token, options);
    }

    // Play an "battle" sound effect with predefined volume and settings
    playSoundEffect (token, options = {})
    {
        //console.log('SoundsManager.playSoundEffect() called w/ token:', token, 'options:', options);
        let MMRPG = this.MMRPG;
        let baseVolume = MMRPG.settings.volume.base || 1.0;
        let effectsVolume = MMRPG.settings.volume.effects || 1.0;
        let volume = (options.volume || 1.0) * (baseVolume * effectsVolume);
        //console.log(token + ' | -> baseVolume:', baseVolume, 'effectsVolume:', effectsVolume, 'volume:', volume);
        options.volume = (options.volume || 1.0) * volume;
        return this.play(token, options);
    }

    // Play a "menu" sound effect with predefined volume and settings
    playMenuSound (token, options = {})
    {
        //console.log('SoundsManager.playMenuSound() called w/ token:', token, 'options:', options);
        let MMRPG = this.MMRPG;
        let baseVolume = MMRPG.settings.volume.base || 1.0;
        let menusVolume = MMRPG.settings.volume.menus || 1.0;
        let volume = (options.volume || 1.0) * (baseVolume * menusVolume);
        //console.log(token + ' | -> baseVolume:', baseVolume, 'menusVolume:', menusVolume, 'volume:', volume);
        options.volume = (options.volume || 1.0) * volume;
        return this.play(token, options);
    }


}
