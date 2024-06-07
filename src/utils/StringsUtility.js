// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: StringsUtility.js
// String utility class for the MMRPG. This is a singleton class
// with miscellaneous text-related methods for the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export class StringsUtility {

    static getDefaults ()
    {
        return {
            font: 'Open Sans',
            size: 16,
            color: '#ffffff',
            align: 'center',
            bitmapFont: 'megafont-white',
            bitmapSize: 16,
            bitmapSpacing: 20,
            bitmapOrigin: 0.5
            };
    }

    static addBitmapText (ctx, x, y, text, options)
    {

        let defaults = this.getDefaults();
        text = text || '...';
        options = options || {};
        size = options.size || defaults.bitmapSize;
        font = options.font || defaults.bitmapFont;
        spacing = options.spacing || defaults.bitmapSpacing;
        origin = options.origin || defaults.bitmapOrigin;
        var $loadText = this.add.bitmapText(x, y, font, text, size);
        $loadText.setLetterSpacing(spacing);
        $loadText.setOrigin(origin);

    }

    static addPlainText (ctx, x, y, text, styles)
    {

        let defaults = this.getDefaults();
        text = text || '...';
        styles = styles || {};
        styles.fontFamily = styles.fontFamily || defaults.font;
        styles.fontSize = styles.fontSize || defaults.size + 'px';
        styles.color = styles.color || defaults.color;
        let $text = ctx.add.text(x, y, text, styles);
        return $text;

    }

}
