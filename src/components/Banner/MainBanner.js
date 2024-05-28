
import Banner from './Banner.js';

let baseConfig = {
    baseWidth: 750,
    baseHeight: 184,
    maxHeight: 184,
    minHeight: 124
    };

export default class MainBanner extends Banner {

    constructor (scene, x, y, options = {}, config = {})
    {
        console.log('MainBanner.constructor() called');

        options = Object.assign({}, options);
        config = Object.assign({}, baseConfig, config);

        options.fullsize = typeof options.fullsize === 'boolean' ? options.fullsize : true;
        if (!options.fullsize){ options.height = config.minHeight; }
        else { options.height = config.maxHeight; }

        options.mainText = options.mainText || 'Main Banner';
        options.mainTextStyle = options.mainTextStyle || { fontSize: '32px', fill: '#fff' };

        super(scene, x, y, options);

        this.scene = scene;
        this.options = super.getOptions()
        this.config = super.getConfig();

        this.addMainBannerElements();

    }

    update (options)
    {
        //console.log('MainBanner.update() called');
        super.update(options);

        // Update the main banner elements
        let $title = this.title;
        $title.setText(this.options.mainText);

    }

    addMainBannerElements ()
    {
        //console.log('MainBanner.addMainBannerElements() called');

        // Add some title text to the main banner
        let options = this.options;
        let bounds = this.bounds;
        let $title = this.scene.add.text(bounds.centerX, bounds.centerY, options.mainText, options.mainTextStyle).setOrigin(0.5, 0.5);
        this.title = $title;

    }

    setSize (width, height)
    {
        //console.log('MainBanner.setSize() called w/ width =', width, 'height =', height);
        super.setSize(width, height);
        let bounds = this.bannerBounds;
        this.title.x = bounds.centerX;
        this.title.y = bounds.centerY;
    }
    setPosition (x, y)
    {
        //console.log('MainBanner.setPosition() called w/ x =', x, 'y =', y);
        super.setPosition(x, y);
        let bounds = this.bounds;
        this.title.x = bounds.centerX;
        this.title.y = bounds.centerY;
    }

    setTitleText (text)
    {
        //console.log('MainBanner.setTitleText() called w/ text =', text);
        let options = this.options;
        options.mainText = text;
        this.title.setText(options.mainText);
        this.update();
    }

}
