
import Banner from './Banner.js';

export default class MainBanner extends Banner {

    constructor (scene, x, y, options = {})
    {
        //console.log('MainBanner.constructor() called');

        let defaults = {
            width: 750,
            height: 184,
            maxHeight: 184,
            minHeight: 124,
            fullsize: false,
            mainText: 'Main Banner',
            mainTextStyle: { fontSize: '32px', fill: '#fff' }
            };

        if (typeof options !== 'object'){ options = {}; }

        options.width = typeof options.width === 'number' ? options.width : defaults.width;
        options.height = typeof options.height === 'number' ? options.height : (options.fullsize ? defaults.maxHeight : defaults.minHeight);

        options.fullsize = typeof options.fullsize === 'boolean' ? options.fullsize : defaults.fullsize;

        options.mainText = typeof options.mainText !== 'undefined' ? options.mainText : defaults.mainText;

        options.mainTextStyle = typeof options.mainTextStyle === 'object' ? options.mainTextStyle : {};
        options.mainTextStyle.fontSize = options.mainTextStyle.fontSize || defaults.mainTextStyle.fontSize;
        options.mainTextStyle.fill = options.mainTextStyle.fill || defaults.mainTextStyle.fill;

        super(scene, x, y, options);

        //console.log('MainBanner options =', options);
        //console.log('MainBanner this.options =', this.options);
        //console.log('MainBanner this.options == options:', this.options == options);

        this.addMainBannerElements();

    }

    update (options)
    {
        //console.log('MainBanner.update() called');
        super.update(options);

    }

    addMainBannerElements ()
    {
        //console.log('MainBanner.addMainBannerElements() called');

        // Add some title text to the banner
        let bounds = this.bounds;
        let options = this.options;
        let align = 'center',
            x = bounds.centerX,
            y = bounds.centerY,
            text = options.mainText,
            styles = options.mainTextStyle
            ;
        this.title = this.addBannerText(x, y, text, align, styles);

    }

}
