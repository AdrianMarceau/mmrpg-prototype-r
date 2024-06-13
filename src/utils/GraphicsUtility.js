// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: GraphicsUtility.js
// Graphic utility class for the MMRPG. This is a singleton class
// with miscellaneous graphic-related methods for the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export class GraphicsUtility {

    // -- MATH-RELATED FUNCTIONS -- //

    // Define a function for calculating the proportional radius of a rounded rectangle
    static getProportionalRadiusObject (width, height, radius)
    {
        let fallback = typeof radius === 'number' ? radius : 0;
        let radii = typeof radius === 'object' ? radius : {};
        let topLeft = typeof radii.tl !== 'undefined' ? radii.tl : fallback;
        let topRight = typeof radii.tr !== 'undefined' ? radii.tr : fallback;
        let bottomRight = typeof radii.br !== 'undefined' ? radii.br : fallback;
        let bottomLeft = typeof radii.bl !== 'undefined' ? radii.bl : fallback;
        return {
            tl: this.calculateProportionalRadius(width, height, topLeft),
            tr: this.calculateProportionalRadius(width, height, topRight),
            br: this.calculateProportionalRadius(width, height, bottomRight),
            bl: this.calculateProportionalRadius(width, height, bottomLeft)
            };
    }
    static calculateProportionalRadius (width, height, baseRadius)
    {
        let smallestSide = Math.min(width, height);
        return (smallestSide / 100) * (baseRadius / 5); // Adjust this ratio as needed
    }

    // Define a function filling an array with relative values based on a total
    static fillArrayWithRelativeValues(total, values)
    {
        var totalValue = values.reduce(function(a, b){ return a + b; }, 0);
        return values.map(function(value){ return Math.floor((value / totalValue) * total); });
    }

    // Define a function for adjusting a set of bounds by a certain amount to expand or inset and return it
    static getAdjustedBounds(bounds, amount)
    {
        let amounts;
        if (typeof amount === 'number'){
            amounts = [amount, amount, amount, amount];
            } else if (Array.isArray(amount)){
            if (amount.length === 4){ amounts = amount; }
            else if (amount.length === 3){ amounts = [amount[0], amount[1], amount[2], amount[1]]; }
            else if (amount.length === 2){ amounts = [amount[0], amount[1], amount[0], amount[1]]; }
            else { amounts = [0, 0, 0, 0]; }
            } else if (typeof amount === 'object'){
            amounts = [amount.top || 0, amount.right || 0, amount.bottom || 0, amount.left || 0];
            } else {
            amounts = [0, 0, 0, 0];
            }
        return {
            x: bounds.x + amounts[3],
            x2: bounds.x2 - amounts[1],
            y: bounds.y + amounts[0],
            y2: bounds.y2 - amounts[2],
            width: bounds.width - (amounts[1] + amounts[3]),
            height: bounds.height - (amounts[0] + amounts[2])
            };
    }

    // -- GRID and TABLE-RELATED FUNCTIONS -- //

    // Define a function for calculating relative column widths given a total
    static calculateColumnWidths(available, percents)
    {
        let values = percents.map(function(percent){ return Math.floor((percent / 100) * available); });
        return this.fillArrayWithRelativeValues(available, values);
    }


    // -- COLOR-SPAN and COLOR-PANEL FUNCTIONS -- //

    static addTypePanel (ctx, config)
    {

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

        // Define the panel configuration using above where possible
        let panelConfig = {
            x: config.x || 20,
            y: config.y || 20,
            width: config.width || 600,
            height: config.height || 150,
            radius: config.radius || { tl: 10, tr: 10, br: 10, bl: 10 },
            lineStyle: config.lineStyle || { width: 2, color: 0x0a0a0a },
            fillStyle: config.fillStyle || { color: 0x161616 },
            depth: config.depth || 1000,
            };

        // Draw the panel with the specified configuration
        const $panel = ctx.add.graphics({ lineStyle: panelConfig.lineStyle, fillStyle: panelConfig.fillStyle });
        const radius = this.getProportionalRadiusObject(panelConfig.width, panelConfig.height, panelConfig.radius);
        $panel.strokeRoundedRect(panelConfig.x, panelConfig.y, panelConfig.width, panelConfig.height, radius);
        $panel.fillRoundedRect(panelConfig.x, panelConfig.y, panelConfig.width, panelConfig.height, radius);
        if (typeof panelConfig.depth === 'number'){ $panel.setDepth(panelConfig.depth); }
        return $panel;

    }

    static addInlineTypePanel (ctx, config)
    {

        // Pull in refs to specific indexes
        let typesIndex = MMRPG.Indexes.types;
        let typesIndexTokens = Object.keys(typesIndex);

        // Define the panel configuration using above where possible
        let panelConfig = {
            x: typeof config.x === 'number' ? config.x : 20,
            y: typeof config.y === 'number' ? config.y : 20,
            width: typeof config.width === 'number' ? config.width : 600,
            height: typeof config.height === 'number' ? config.height : 150,
            depth: typeof config.depth === 'number' ? config.depth : 1000,
            border: typeof config.border === 'string' ? config.border : '#696969',
            background: typeof config.background === 'string' ? config.background : '#969696',
            background2: typeof config.background2 === 'string' ? config.background2 : '#969696',
            offsetX: typeof config.offsetX !== 'undefined' ? config.offsetX : 0,
            offsetY: typeof config.offsetY !== 'undefined' ? config.offsetY : 0
            };

        // Let's only work with whole values to make things easier
        panelConfig.width = Math.ceil(panelConfig.width);
        panelConfig.height = Math.ceil(panelConfig.height);

        // Create gradient texture
        const canvasTextureKey = 'gradient_' + panelConfig.width + 'x' + panelConfig.height;
        if (!ctx.textures.exists(canvasTextureKey)) {
            const canvas = ctx.textures.createCanvas(canvasTextureKey, panelConfig.width + 1, panelConfig.height);
            const grd = canvas.context.createLinearGradient(0, 0, panelConfig.width + 1, panelConfig.height);
            grd.addColorStop(0, panelConfig.background);
            grd.addColorStop(1, panelConfig.background2);
            canvas.context.fillStyle = grd;
            canvas.context.fillRect(0, 0, panelConfig.width, panelConfig.height);
            canvas.refresh();
        }

        // Create a sprite with the gradient texture
        const $gradient = ctx.add.image(panelConfig.x - 1, panelConfig.y, canvasTextureKey);
        $gradient.setOrigin(0, 0);
        $gradient.setDepth(panelConfig.depth - 1);

        // Draw the panel with the specified configuration
        //console.log('drawing a rounded rect at x:', panelConfig.x, 'y:', panelConfig.y, 'width:', panelConfig.width, 'height:', panelConfig.height);
        let $panel = ctx.add.graphics({ x: panelConfig.x, y: panelConfig.y });
        $panel.lineStyle(2, this.returnHexColorValue(panelConfig.border), 1);
        $panel.fillStyle(this.returnHexColorValue(panelConfig.background), 0); // transparent for background
        $panel.fillRoundedRect(panelConfig.offsetX, panelConfig.offsetY, panelConfig.width, panelConfig.height, 0);
        $panel.strokeRoundedRect(panelConfig.offsetX, panelConfig.offsetY, panelConfig.width, panelConfig.height, 0);

        if (typeof panelConfig.depth === 'number'){ $panel.setDepth(panelConfig.depth); }

        // Create a group with all the elements
        const $group = ctx.add.group();
        $group.add($panel);
        $group.add($gradient);

        // Create a typePanel object to return and populate with methods
        const $typePanel = {
            x: panelConfig.x,
            y: panelConfig.y,
            width: panelConfig.width,
            height: panelConfig.height,
            depth: panelConfig.depth,
            group: $group,
            elems: [$panel, $gradient],
            };
        function setDepth (depth){
            $typePanel.depth = depth;
            $panel.setDepth(depth);
            $gradient.setDepth(depth - 1);
            };
        function setPosition (x, y){
            $typePanel.x = x;
            $typePanel.y = y;
            $panel.x = x;
            $panel.y = y;
            $gradient.x = x - 1;
            $gradient.y = y;
            };
        function destroy (){
            $group.destroy(true);
            };
        $typePanel.setDepth = setDepth;
        $typePanel.setPosition = setPosition;
        $typePanel.destroy = destroy;

        // Return the typePanel object
        return $typePanel;

    }

    // -- COLOR-RELATED FUNCTIONS -- //

    static getColorFormat (input)
    {
        // take in input and check if it's in the following formats
        // `hex/string` "#0a0a0a" or `hex/number` (0x0a0a0a)
        // `rgb/string` "rgb(0, 0, 0)" or `rgb/array` ([0, 0, 0])
        // `hsl/string` "hsl(0, 0%, 0%) or `hsl/array` ([0, 0, 0])
        // return the format as one of the strings above in `backticks`
        // if it doesn't match any of these, return the string `unknown`
        let format = 'unknown';
        if (input && typeof input === 'string') {
            if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
                format = 'hex/string';
                } else if (/^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(input)) {
                format = 'rgb/string';
                } else if (/^hsl\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(input)) {
                format = 'hsl/string';
                }
            } else if (input && typeof input === 'number') {
            format = 'hex/number';
            } else if (input && Array.isArray(input)) {
            if (input.length === 3) {
                if (input.every(val => val <= 255)) {
                    format = 'rgb/array';
                    } else {
                    format = 'hsl/array';
                    }
                }
            }
        return format;
    }
    static returnHexColorString (input)
    {
        let format = this.getColorFormat(input);
        let hexString;
        if (format === 'hex/string')
        {
            hexString = input;
        }
        else if (format === 'hex/number')
        {
            hexString = '#' + input.toString(16).padStart(6, '0');
        }
        else if (format === 'rgb/string')
        {
            hexString = this.getColorHexFromRgb(input);
        }
        else if (format === 'rgb/array')
        {
            hexString = this.getColorHexFromRgb(input);
        }
        else if (format === 'hsl/string')
        {
            hexString = this.getColorHexFromHsl(input);
        }
        else if (format === 'hsl/array')
        {
            hexString = this.getColorHexFromHsl(input);
        }
        else
        {
            hexString = '#000000';
        }
        return hexString;
    }
    static returnHexColorValue (input) {
        let format = this.getColorFormat(input);
        let hexValue;
        if (format === 'hex/string') {
            hexValue = parseInt(input.slice(1), 16);
        } else if (format === 'hex/number') {
            hexValue = input;
        } else if (format === 'rgb/string') {
            hexValue = parseInt(this.getColorHexFromRgb(input).slice(1), 16);
        } else if (format === 'rgb/array') {
            hexValue = parseInt(this.getColorHexFromRgb(input).slice(1), 16);
        } else if (format === 'hsl/string') {
            hexValue = parseInt(this.getColorHexFromHsl(input).slice(1), 16);
        } else if (format === 'hsl/array') {
            hexValue = parseInt(this.getColorHexFromHsl(input).slice(1), 16);
        } else {
            hexValue = 0x000000;
        }
        return hexValue;
    }
    static getColorHexFromRgb (r, g, b)
    {
        // if there is one arg it must be an rgb string or array
        let hexValue;
        if (arguments.length === 1)
        {
            // if the first argument is a string, it must be in rgb(0, 0, 0) or rgba(0, 0, 0, 1) format
            if (arguments[0] && typeof arguments[0] === 'string')
            {
                let rgbString = arguments[0];
                let match = rgbString.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
                if (match)
                {
                    let [_, r, g, b] = match.map(Number);
                    hexValue = (r << 16) + (g << 8) + b;
                }
            }
            // else if the first argument is an array, it must be an rgb array
            else if (arguments[0] && Array.isArray(arguments[0]))
            {
                let rgbArray = arguments[0];
                hexValue = (rgbArray[0] << 16) + (rgbArray[1] << 8) + rgbArray[2];
            }
        }
        // if there are three+ args it's r, g, b, [a?]
        else if (arguments.length >= 3)
        {
            let r = arguments[0], g = arguments[1], b = arguments[2];
            hexValue = (r << 16) + (g << 8) + b;
        }
        // else the must be a mistake
        else
        {
            hexValue = 0x000000;
        }
        // return hex as string
        let hexString = '#' + hexValue.toString(16).padStart(6, '0');
        return hexString;
    }
    static getColorRgbFromHex ()
    {
        // if the first argument is a string, it must be in #0a0a0a format
        if (arguments[0] && typeof arguments[0] === 'string')
        {
            let hexString = arguments[0];
            let hexValue = parseInt(hexString.slice(1), 16);
            let r = (hexValue >> 16) & 255;
            let g = (hexValue >> 8) & 255;
            let b = hexValue & 255;
            return [r, g, b];
        }
        // else if the first argument is a raw hex value, it must be one of those 0x0a0a0a
        else if (arguments[0] && typeof arguments[0] === 'number')
        {
            let hexValue = arguments[0];
            let r = (hexValue >> 16) & 255;
            let g = (hexValue >> 8) & 255;
            let b = hexValue & 255;
            return [r, g, b];
        }
        // else return black
        else
        {
            return [0, 0, 0];
        }
    }
    static getColorRgbFromHsl ()
    {
        // if the first argument is a string, it must be in hsl(0, 0%, 0%) format
        if (arguments[0] && typeof arguments[0] === 'string')
        {
            let hslString = arguments[0];
            let match = hslString.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
            if (match)
            {
                let [_, h, s, l] = match.map(Number);
                let c = (1 - Math.abs(2 * l - 1)) * s;
                let x = c * (1 - Math.abs((h / 60) % 2 - 1));
                let m = l - c / 2;
                let rgb;
                if (h < 60) { rgb = [c, x, 0]; }
                else if (h < 120) { rgb = [x, c, 0]; }
                else if (h < 180) { rgb = [0, c, x]; }
                else if (h < 240) { rgb = [0, x, c]; }
                else if (h < 300) { rgb = [x, 0, c]; }
                else { rgb = [c, 0, x]; }
                return rgb.map(val => Math.round((val + m) * 255));
            }
        }
        // else if the first argument is an array, it must be an hsl array
        else if (arguments[0] && Array.isArray(arguments[0]))
        {
            let hslArray = arguments[0];
            let [h, s, l] = hslArray;
            let c = (1 - Math.abs(2 * l - 1)) * s;
            let x = c * (1 - Math.abs((h / 60) % 2 - 1));
            let m = l - c / 2;
            let rgb;
            if (h < 60) { rgb = [c, x, 0]; }
            else if (h < 120) { rgb = [x, c, 0]; }
            else if (h < 180) { rgb = [0, c, x]; }
            else if (h < 240) { rgb = [0, x, c]; }
            else if (h < 300) { rgb = [x, 0, c]; }
            else { rgb = [c, 0, x]; }
            return rgb.map(val => Math.round((val + m) * 255));
        }
        // else return black
        else
        {
            return [0, 0, 0];
        }
    }
    static getColorHexFromHsl (h, s, l) {
        if (arguments.length === 1 && typeof h === 'string') {
            let hslString = h;
            let match = hslString.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
            if (match) {
                h = Number(match[1]);
                s = Number(match[2]) / 100;
                l = Number(match[3]) / 100;
            } else {
                return '#000000';
            }
        } else if (arguments.length === 1 && Array.isArray(h)) {
            [h, s, l] = h;
            s /= 100;
            l /= 100;
        } else if (arguments.length === 3) {
            s /= 100;
            l /= 100;
        } else {
            return '#000000';
        }

        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c / 2;
        let rgb;

        if (h < 60) { rgb = [c, x, 0]; }
        else if (h < 120) { rgb = [x, c, 0]; }
        else if (h < 180) { rgb = [0, c, x]; }
        else if (h < 240) { rgb = [0, x, c]; }
        else if (h < 300) { rgb = [x, 0, c]; }
        else { rgb = [c, 0, x]; }

        let [r, g, b] = rgb.map(val => Math.round((val + m) * 255));
        return this.getColorHexFromRgb(r, g, b);
    }


    // -- DEBUG TESTER -- //

    // Define a function to run when you want to test that everything is functional in this class
    static test(){
        console.log('GraphicsUtility.test() called');

        // Define basic variables and simple functions for performing the tests
        let passed = 0, failed = 0;
        function check(label, expected, actual){
            let match = expected === actual;
            if (match){ passed++; }
            else { failed++; }
            console.log('%c' +
                label + ' expected: ' + expected + ' actual: ' + actual + ' ...match: ' + match,
                'color: ' + (match ? 'green' : 'red') // print in green if match or red if no match
                );
        }
        function results(){
            console.log('Results: Passed:', passed, 'Failed:', failed);
        }

        // Test all the colour-related functions in this class
        let testHexString = '#ff0000', testHexValue = 0xff0000;
        let testRgbString = 'rgb(255, 0, 0)', testRgbArray = [255, 0, 0];
        let testHslString = 'hsl(0, 100%, 50%)', testHslArray = [0, 100, 50];
        check('getColorFormat(testHexString:"' + testHexString + '")', 'hex/string', this.getColorFormat(testHexString));
        check('getColorFormat(testHexValue:"' + testHexValue + '")', 'hex/number', this.getColorFormat(testHexValue));
        check('getColorFormat(testRgbString:"' + testRgbString + '")', 'rgb/string', this.getColorFormat(testRgbString));
        check('getColorFormat(testRgbArray:' + JSON.stringify(testRgbArray) + ')', 'rgb/array', this.getColorFormat(testRgbArray));
        check('getColorFormat(testHslString:"' + testHslString + '")', 'hsl/string', this.getColorFormat(testHslString));
        check('getColorFormat(testHslArray:' + JSON.stringify(testHslArray) + ')', 'hsl/array', this.getColorFormat(testHslArray));
        check('getColorFormat("unknown")', 'unknown', this.getColorFormat('unknown'));
        check('returnHexColorString(testHexString:"' + testHexString + '")', testHexString, this.returnHexColorString(testHexString));
        check('returnHexColorString(testHexValue:' + testHexValue + ')', testHexString, this.returnHexColorString(testHexValue));
        check('returnHexColorString(testRgbString:"' + testRgbString + '")', testHexString, this.returnHexColorString(testRgbString));
        check('returnHexColorString(testRgbArray:' + JSON.stringify(testRgbArray) + ')', testHexString, this.returnHexColorString(testRgbArray));
        check('returnHexColorString(testHslString:"' + testHslString + '")', testHexString, this.returnHexColorString(testHslString));
        check('returnHexColorString(testHslArray:' + JSON.stringify(testHslArray) + ')', testHexString, this.returnHexColorString(testHslArray));
        check('returnHexColorValue(testHexString:"' + testHexString + '")', testHexValue, this.returnHexColorValue(testHexString));
        check('returnHexColorValue(testHexValue:' + testHexValue + ')', testHexValue, this.returnHexColorValue(testHexValue));
        check('returnHexColorValue(testRgbString:"' + testRgbString + '")', testHexValue, this.returnHexColorValue(testRgbString));
        check('returnHexColorValue(testRgbArray:' + JSON.stringify(testRgbArray) + ')', testHexValue, this.returnHexColorValue(testRgbArray));
        check('returnHexColorValue(testHslString:"' + testHslString + '")', testHexValue, this.returnHexColorValue(testHslString));
        check('returnHexColorValue(testHslArray:' + JSON.stringify(testHslArray) + ')', testHexValue, this.returnHexColorValue(testHslArray));

        // Print out the final results for this test
        results();

    }

}
