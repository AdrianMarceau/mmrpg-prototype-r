
import Banner from './Banner.js';

export default class BattleBanner extends Banner {

    constructor (scene, x, y, options = {})
    {
        console.log('BattleBanner.constructor() called');

        let defaults = {
            width: 752,
            height: 251,
            mainText: 'Battle Banner',
            mainTextStyle: { fontSize: '32px', fill: '#fff' }
            };

        if (typeof options !== 'object'){ options = {}; }

        options.width = typeof options.width === 'number' ? options.width : defaults.width;
        options.height = typeof options.height === 'number' ? options.height : defaults.height;

        options.mainText = typeof options.mainText !== 'undefined' ? options.mainText : defaults.mainText;

        options.mainTextStyle = typeof options.mainTextStyle === 'object' ? options.mainTextStyle : {};
        options.mainTextStyle.fontSize = options.mainTextStyle.fontSize || defaults.mainTextStyle.fontSize;
        options.mainTextStyle.fill = options.mainTextStyle.fill || defaults.mainTextStyle.fill;

        super(scene, x, y, options);

        //console.log('BattleBanner options =', options);
        //console.log('BattleBanner this.options =', this.options);
        //console.log('BattleBanner this.options == options:', this.options == options);

        this.addBattleBannerElements();

    }

    update (options)
    {
        //console.log('BattleBanner.update() called');
        super.update(options);

    }

    addBattleBannerElements ()
    {
        //console.log('BattleBanner.addBattleBannerElements() called');

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