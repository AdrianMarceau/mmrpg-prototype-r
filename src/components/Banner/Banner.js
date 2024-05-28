
import MMRPG from '../../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../../utils/GraphicsUtility.js';

let baseConfig = {
    baseX: 15,
    baseY: 15,
    baseWidth: 750,
    baseHeight: 184,
    baseFillStyle: { color: 0x161616 },
    baseLineStyle: { width: 2, color: 0x0a0a0a },
    baseBorderRadius: { tl: 6, tr: 6, br: 6, bl: 6 }
    };

export default class Banner {

    constructor (scene, x, y, options = {}, config = {})
    {
        console.log('Banner.constructor() called');

        options = Object.assign({}, options)
        config = Object.assign({}, baseConfig, config);

        this.x = x;
        this.y = y;
        this.width = options.width ? options.width : config.baseWidth;
        this.height = options.height ? options.height : config.baseHeight;
        this.bounds = this.getBounds();

        options.fillStyle = options.fillStyle ? Object.assign({}, config.baseFillStyle, options.fillStyle) : config.baseFillStyle;
        options.lineStyle = options.lineStyle ? Object.assign({}, config.baseLineStyle, options.lineStyle) : config.baseLineStyle;
        options.borderRadius = options.borderRadius ? Object.assign({}, config.baseBorderRadius, options.borderRadius) : config.baseBorderRadius;

        options.lineStyle.color = Graphics.returnPhaserColor(options.lineStyle.color);
        options.fillStyle.color = Graphics.returnPhaserColor(options.fillStyle.color);

        this.scene = scene;
        this.options = options;
        this.config = config;
        console.log('this.options =', this.options);
        console.log('this.config =', this.config);

        this.createBanner();
    }

    create ()
    {
        //console.log('Banner.create() called');

        /* ... */

    }

    update (options)
    {
        //console.log('Banner.update() called');

        /* ... */

    }

    createBanner()
    {
        //console.log('Banner.createBanner() called');

        // Display a rectangular dialogue box with background and stroke color
        let ctx = this.scene;
        let options = this.options;
        let $panel = this.panel || ctx.add.graphics({ lineStyle: options.lineStyle, fillStyle: options.fillStyle });
        let radius = Graphics.getProportionalRadiusObject(this.width, this.height, options.borderRadius);
        $panel.strokeRoundedRect(this.x, this.y, this.width, this.height, radius);
        $panel.fillRoundedRect(this.x, this.y, this.width, this.height, radius);
        this.panel = $panel;

    }
    refreshBanner ()
    {
        //console.log('Banner.refreshBanner() called');

        // Refresh the rectangular dialogue box with background and stroke color
        let options = this.options;
        let $panel = this.panel;
        let radius = Graphics.getProportionalRadiusObject(this.width, this.height, options.borderRadius);
        $panel.clear();
        $panel.lineStyle(options.lineStyle.width, options.lineStyle.color);
        $panel.fillStyle(options.fillStyle.color);
        $panel.strokeRoundedRect(this.x, this.y, this.width, this.height, radius);
        $panel.fillRoundedRect(this.x, this.y, this.width, this.height, radius);

    }

    setSize (width, height)
    {
        //console.log('Banner.setSize() called w/ width =', width, 'height =', height);
        this.width = width;
        this.height = height;
        this.bounds = this.getBounds();
        this.refreshBanner();
    }
    setPosition (x, y)
    {
        //console.log('Banner.setPosition() called w/ x =', x, 'y =', y);
        this.x = x;
        this.y = y;
        this.bounds = this.getBounds();
        this.refreshBanner();
    }

    setColor (border, background)
    {
        console.log('Banner.setColor() called w/ border =', typeof border, border, 'background =', typeof background, background);
        border = Graphics.returnPhaserColor(border);
        background = Graphics.returnPhaserColor(background);
        console.log('revised border =', typeof border, border, 'background =', typeof background, background);
        this.options.lineStyle.color = border;
        this.options.fillStyle.color = background;
        this.refreshBanner();
    }

    getConfig ()
    {
        //console.log('Banner.getConfig() called');
        return this.config;
    }
    getOptions ()
    {
        //console.log('Banner.getOptions() called');
        return this.options;
    }
    getBounds ()
    {
        //console.log('Banner.getBounds() called');
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
