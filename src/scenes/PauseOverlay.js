// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: PauseOverlay.js (scene)
// Pause overlay for the game. This scene is responsible for
// adding the black overlay to the scene as well as allowing
// the user to click that overlay to resume the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export default class PauseOverlay extends Phaser.Scene
{
    constructor ()
    {
        super({ key: 'Pause', active: false });
    }

    init (data)
    {
        //console.log('PauseOverlay: init() called w/', data);
        // Pull or define necessary data from the provided object
        this.pauseKey = data.pauseKey || 'Title';
        this.resumeCallback = data.resumeCallback || null;
    }

    create ()
    {
        //console.log('PauseOverlay.create() called');
        let scene = this;
        let pauseKey = this.pauseKey;
        let resumeCallback = this.resumeCallback;
        // Create a semi-transparent background
        let $overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.3);
        $overlay.setOrigin(0);
        $overlay.setInteractive();
        $overlay.on('pointerdown', () => {
            //console.log('PauseOverlay: resume button clicked w/', pauseKey);
            scene.scene.resume(pauseKey);
            scene.scene.stop('Pause');
            if (resumeCallback){ resumeCallback(); }
            });

    }
}
