
import Banner from './Banner';

export default class BattleBanner extends Banner {

    constructor (scene, x, y, options = {})
    {
        console.log('BattleBanner.constructor() called');

        let bannerConfig = {
            baseWidth: 752,
            baseHeight: 251
            };

        options.width = typeof options.width === 'number' ? options.width : bannerConfig.baseWidth;
        options.height = typeof options.height === 'number' ? options.height : bannerConfig.baseHeight;

        super(scene, x, y, options);

        this.bannerConfig = bannerConfig;
        this.bannerBounds = super.getBounds();
        console.log('this.bannerConfig =', this.bannerConfig);
        console.log('this.bannerBounds =', this.bannerBounds);

        this.addBattleBannerElements();

    }

    update (options)
    {
        console.log('BattleBanner.update() called');
        super.update(options);
    }

    addBattleBannerElements ()
    {
        console.log('BattleBanner.addBattleBannerElements() called');

        // Add specific elements for the main banner
        let size = this.bannerSize;
        let config = this.bannerConfig;
        let bounds = this.bannerBounds;
        var x = bounds.centerX, y = bounds.centerY;
        var text = 'Battle Banner';
        var style = { fontSize: '32px', fill: '#fff' };
        this.title = this.scene.add.text(x, y, text, style).setOrigin(0.5, 0.5);

    }

}