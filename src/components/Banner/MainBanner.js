
import Banner from './Banner.js';

export default class MainBanner extends Banner {

    constructor (scene, x, y, options = {})
    {
        console.log('MainBanner.constructor() called');

        let bannerConfig = {
            baseWidth: 750,
            baseHeight: 184,
            minHeight: 124
            };

        options.fullsize =  typeof options.fullsize === 'boolean' ? options.fullsize : true;
        options.width = typeof options.width === 'number' ? options.width : bannerConfig.baseWidth;
        options.height = typeof options.height === 'number' ? options.height : (options.fullsize ? bannerConfig.baseHeight : bannerConfig.minHeight);

        super(scene, x, y, options);

        this.bannerConfig = bannerConfig;
        this.bannerBounds = super.getBounds();
        this.bannerSize = options.fullsize ? 'full' : 'small';
        console.log('this.bannerConfig =', this.bannerConfig);
        console.log('this.bannerBounds =', this.bannerBounds);
        console.log('this.bannerSize =', this.bannerSize);

        this.addMainBannerElements();

    }

    update (options)
    {
        console.log('MainBanner.update() called');
        super.update(options);
    }

    addMainBannerElements ()
    {
        console.log('MainBanner.addMainBannerElements() called');

        // Add specific elements for the main banner
        let size = this.bannerSize;
        let config = this.bannerConfig;
        let bounds = this.bannerBounds;
        var x = bounds.centerX, y = bounds.centerY;
        var text = 'Main Banner';
        var style = { fontSize: '32px', fill: '#fff' };
        this.title = this.scene.add.text(x, y, text, style).setOrigin(0.5, 0.5);

    }

}
