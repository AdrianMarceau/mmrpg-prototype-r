
import MMRPG from '../../shared/MMRPG.js';

export default class Banner {

    constructor (scene, x, y, options = {})
    {
        console.log('Banner.constructor() called');

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.options = options;

        let defaultWidth = 750;
        let defaultHeight = 184;
        let defaultFillStyle = { color: 0x161616 };
        let defaultLineStyle = { width: 2, color: 0x0a0a0a };
        let defaultBorderRadius = { tl: 6, tr: 6, br: 6, bl: 6 };

        this.width = options.width ? options.width : defaultWidth;
        this.height = options.height ? options.height : defaultHeight;

        this.options.fillStyle = options.fillStyle ? Object.assign({}, defaultFillStyle, options.fillStyle) : defaultFillStyle;
        this.options.lineStyle = options.lineStyle ? Object.assign({}, defaultLineStyle, options.lineStyle) : defaultLineStyle;
        this.options.borderRadius = options.borderRadius ? Object.assign({}, defaultBorderRadius, options.borderRadius) : defaultBorderRadius;

        this.createBanner();
    }

    update (options)
    {
        console.log('Banner.update() called');

        /* ... */

    }

    createBanner()
    {
        console.log('Banner.createBanner() called');

        // Display a rectangular dialogue box with all the types listed inside
        let ctx = this.scene;
        let panelX = this.x, panelY = this.y;
        let panelWidth = this.width, panelHeight = this.height;
        const panelGraphics = ctx.add.graphics({ lineStyle: this.options.lineStyle, fillStyle: this.options.fillStyle });
        panelGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, this.options.borderRadius);
        panelGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, this.options.borderRadius);

    }

    getBounds ()
    {
        console.log('Banner.getBounds() called');
        return {
            x: this.x,
            y: this.y,
            x2: this.x + (this.width),
            y2: this.y + (this.height),
            width: this.width,
            height: this.height,
            centerX: this.x + (this.width / 2),
            centerY: this.y + (this.height / 2),
            };
    }

}
