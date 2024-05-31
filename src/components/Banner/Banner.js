
import MMRPG from '../../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../../utils/GraphicsUtility.js';

export default class Banner {

    constructor (scene, x, y, options = {})
    {
        console.log('Banner.constructor() called');

        let defaults = {
            width: 750,
            height: 184,
            fillStyle: { color: 0x161616 },
            lineStyle: { width: 2, color: 0x0a0a0a },
            borderRadius: { tl: 6, tr: 6, br: 6, bl: 6 }
            };

        if (typeof options !== 'object'){ options = {}; }

        this.x = x;
        this.y = y;

        this.width = options.width ? options.width : defaults.width;
        this.height = options.height ? options.height : defaults.height;

        options.fillStyle = typeof options.fillStyle === 'object' ? options.fillStyle : {};
        options.fillStyle.color = options.fillStyle.color || defaults.fillStyle.color;
        options.fillStyle.color = Graphics.returnPhaserColor(options.fillStyle.color);

        options.lineStyle = typeof options.lineStyle === 'object' ? options.lineStyle : {};
        options.lineStyle.width = options.lineStyle.width || defaults.lineStyle.width;
        options.lineStyle.color = options.lineStyle.color || defaults.lineStyle.color;
        options.lineStyle.color = Graphics.returnPhaserColor(options.lineStyle.color);

        options.borderRadius = typeof options.borderRadius === 'object' ? options.borderRadius : {};
        options.borderRadius.tl = options.borderRadius.tl || defaults.borderRadius.tl;
        options.borderRadius.tr = options.borderRadius.tr || defaults.borderRadius.tr;
        options.borderRadius.br = options.borderRadius.br || defaults.borderRadius.br;
        options.borderRadius.bl = options.borderRadius.bl || defaults.borderRadius.bl;

        this.bounds = this.getBounds();
        this.scene = scene;
        this.options = options;
        //console.log('this.options =', this.options);

        this.elements = {};
        this.elements.texts = [];
        this.elements.images = [];
        this.elements.sprites = [];

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

        // Refresh any text elements
        this.refreshBannerTexts();

    }

    addBannerText (x, y, text, align, styles)
    {
        //console.log('Banner.addBannerText() called w/ text =', text, 'styles =', styles);

        // Collect a reference to the scene and bounds
        let ctx = this.scene;
        let bounds = this.bounds;

        // Set default values for text, alignment, and styles
        x = x || bounds.centerX;
        y = y || bounds.centerY;
        text = text || 'Banner Text';
        align = align || 'center';
        styles = styles || {};

        // Determine the origin point based on the alignment
        let origin = [0, 0];
        if (align === 'center'){ origin = [0.5, 0.5]; }
        else if (align === 'left'){ origin = [0, 0.5]; }
        else if (align === 'right'){ origin = [1, 0.5]; }

        // Add the text to the canvas, save the reference, and return it
        let texts = this.elements.texts;
        let $text = ctx.add.text(x, y, text, styles);
        $text.setOrigin(origin[0], origin[1]);
        texts.push($text);
        return {
            key: texts.length - 1,
            element: $text,
            };

    }
    refreshBannerTexts ()
    {
        //console.log('Banner.refreshBannerTexts() called');

        // Loop through and adjust any text with new position and size values
        let $text;
        let texts = this.elements.texts;
        let bounds = this.bounds;
        for (let i = 0; i < texts.length; i++){
            $text = texts[i];
            $text.x = bounds.centerX;
            $text.y = bounds.centerY;
            }

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
        //console.log('Banner.setColor() called w/ border =', typeof border, border, 'background =', typeof background, background);
        border = Graphics.returnPhaserColor(border);
        background = Graphics.returnPhaserColor(background);
        //console.log('revised border =', typeof border, border, 'background =', typeof background, background);
        this.options.lineStyle.color = border;
        this.options.fillStyle.color = background;
        this.refreshBanner();
    }
    setText (key, text)
    {
        //console.log('Banner.setBannerText() called w/ key =', key, 'text =', text);
        let texts = this.elements.texts;
        let $text = texts[key];
        if ($text){
            $text.setText(text);
            this.refreshBanner();
            }

    }

}
