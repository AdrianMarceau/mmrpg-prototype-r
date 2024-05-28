
import Banner from './Banner.js';

let baseConfig = {
    baseWidth: 752,
    baseHeight: 251
    };

export default class BattleBanner extends Banner {

    constructor (scene, x, y, options = {}, config = {})
    {
        console.log('BattleBanner.constructor() called');

        options = Object.assign({}, options);
        config = Object.assign({}, baseConfig, config);

        options.mainText = options.mainText || 'Battle Banner';
        options.mainTextStyle = options.mainTextStyle || { fontSize: '32px', fill: '#fff' };

        super(scene, x, y, options);

        this.scene = scene;
        this.options = super.getOptions()
        this.config = super.getConfig();

        this.addBattleBannerElements();

    }

    update (options)
    {
        //console.log('BattleBanner.update() called');
        super.update(options);

        // Update the main banner elements
        let $title = this.title;
        $title.setText(this.options.mainText);

    }

    addBattleBannerElements ()
    {
        //console.log('BattleBanner.addBattleBannerElements() called');

        // Add some title text to the main banner
        let options = this.options;
        let bounds = this.bounds;
        let $title = this.scene.add.text(bounds.centerX, bounds.centerY, options.mainText, options.mainTextStyle).setOrigin(0.5, 0.5);
        this.title = $title;

    }

    setSize (width, height)
    {
        //console.log('BattleBanner.setSize() called w/ width =', width, 'height =', height);
        super.setSize(width, height);
        let bounds = this.bannerBounds;
        this.title.x = bounds.centerX;
        this.title.y = bounds.centerY;
    }
    setPosition (x, y)
    {
        //console.log('BattleBanner.setPosition() called w/ x =', x, 'y =', y);
        super.setPosition(x, y);
        let bounds = this.bounds;
        this.title.x = bounds.centerX;
        this.title.y = bounds.centerY;
    }

    setTitleText (text)
    {
        //console.log('BattleBanner.setTitleText() called w/ text =', text);
        let options = this.options;
        options.mainText = text;
        this.title.setText(options.mainText);
        this.update();
    }

}