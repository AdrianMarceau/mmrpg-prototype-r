// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: Utilities.Graphics.js
// Graphic utility class for the MMRPG. This is a singleton class
// with miscellaneous graphic-related methods for the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

export class GraphicsUtility {

    // -- MATH-RELATED FUNCTIONS -- //

    static getProportionalRadiusObject (width, height, baseRadiusObject)
    {
        return {
            tl: this.calculateProportionalRadius(width, height, baseRadiusObject.tl),
            tr: this.calculateProportionalRadius(width, height, baseRadiusObject.tr),
            br: this.calculateProportionalRadius(width, height, baseRadiusObject.br),
            bl: this.calculateProportionalRadius(width, height, baseRadiusObject.bl)
            };
    }
    static calculateProportionalRadius (width, height, baseRadius)
    {
        let smallestSide = Math.min(width, height);
        return (smallestSide / 100) * (baseRadius / 5); // Adjust this ratio as needed
    }


    // -- COLOR-RELATED FUNCTIONS -- //

    static returnPhaserColor (input)
    {
        //console.log('GraphicsUtility.returnPhaserColor() called w/ input =', input);

        // Function to check if a value is a valid hex color in Phaser format
        function isPhaserHex(value) {
            return typeof value === 'number' && value >= 0x000000 && value <= 0xFFFFFF;
        }

        // Function to convert hex string to Phaser-compatible hex value
        function hexStringToPhaserHex(hexString) {
            if (hexString.startsWith('#')) {
                hexString = hexString.slice(1);
            }
            return parseInt(hexString, 16);
        }

        // Function to convert RGB string to Phaser-compatible hex value
        function rgbStringToPhaserHex(rgbString) {
            let match = rgbString.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
            if (match) {
                let [_, r, g, b] = match.map(Number);
                return (r << 16) + (g << 8) + b;
            }
            return null;
        }

        // Function to convert RGB array to Phaser-compatible hex value
        function rgbArrayToPhaserHex(rgbArray) {
            let [r, g, b] = rgbArray;
            return (r << 16) + (g << 8) + b;
        }

        // Check if the input is already a valid Phaser hex color
        //console.log('check isPhaserHex(', input, ')...');
        if (isPhaserHex(input)) {
            //console.log('...YES');
            return input;
        }
        //console.log('...no.');

        // Check if the input is a hex string
        //console.log('check hexStringToPhaserHex(', input, ')...');
        if (typeof input === 'string' && /^#?[0-9A-Fa-f]{6}$/.test(input)) {
            //console.log('...YES');
            return hexStringToPhaserHex(input);
        }
        //console.log('...no.');

        // Check if the input is an RGB string
        //console.log('check rgbStringToPhaserHex(', input, ')...');
        if (typeof input === 'string' && /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(input)) {
            let phaserHex = rgbStringToPhaserHex(input);
            //console.log('...maybe...');
            if (phaserHex !== null) {
                //console.log('...YES');
                return phaserHex;
            }
        }
        //console.log('...no.');

        // Check if the input is an RGB array
        //console.log('check rgbArrayToPhaserHex(', input, ')...');
        if (Array.isArray(input) && input.length === 3 && input.every(num => num >= 0 && num <= 255)) {
            //console.log('...YES');
            return rgbArrayToPhaserHex(input);
        }
        //console.log('...no.');

        // If none of the above, return black
        return 0x000000;

    }

}
