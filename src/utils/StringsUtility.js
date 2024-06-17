// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: StringsUtility.js
// String utility class for the MMRPG. This is a singleton class
// with miscellaneous text-related methods for the game.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';

export class StringsUtility {

    static getDefaults ()
    {
        return {
            font: 'Open Sans',
            size: 16,
            line: 1.6,
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
        if (options.depth){ $loadText.setDepth(options.depth); }

    }

    static addPlainText (ctx, x, y, text, styles)
    {

        let defaults = this.getDefaults();
        text = text || '...';
        styles = styles || {};
        styles.fontFamily = styles.fontFamily || defaults.font;
        styles.fontSize = styles.fontSize || defaults.size + 'px';
        styles.lineHeight = styles.lineHeight || defaults.line + 'em';
        styles.color = styles.color || defaults.color;
        let $text = ctx.add.text(x, y, text, styles);
        if (styles.depth){ $text.setDepth(styles.depth); }
        return $text;

    }

    // Define a function for parsing formatted text
    static parseFormattedText (input)
    {
        //console.log('StringsUtility.parseFormattedText() w/', input);

        // First break the text apart into blocks
        let stringBlocks = this.parseFormattedStringBlocks(input);

        // Define a new array to hold the parsed text span objects
        let parsedStringBlocks = [];

        // Check if the string block tag formatting (format with "[z]...[/z]") and return it
        let tagRegex = /^\[([-_a-z0-9]+)\](.*)?\[\/([-_a-z0-9]+)\]$/i;
        function extractTagFormatting(string, parsedObject){
            //console.log('extractTagFormatting:', string);
            // check if there's tag formatting and extrac it if there is
            let tagFormatting = string.match(tagRegex);
            let hasTagFormatting = tagFormatting ? true : false;
            //console.log('hasTagFormatting:', hasTagFormatting, 'tagFormatting:', tagFormatting);
            if (hasTagFormatting){
                // extract the unformatted text and add it to the object
                string = tagFormatting[2];
                parsedObject.text = string;
                // extract the tag and add it to the object
                parsedObject.styles.push({
                    kind: 'tag',
                    tag: tagFormatting[1]
                    });
                }
            // if the string still has formatting, run it through again
            if (hasTagFormatting && tagRegex.test(string)){
                return extractTagFormatting(string, parsedObject);
                }
            return hasTagFormatting;
        }

        // Check if the string block type formatting (format with "[...]{z}") and return it
        let typeRegex = /^\[([^\[\]]+)\]\{([-_a-z0-9]+)\}$/i;
        function extractTypeFormatting(string, parsedObject){
            //console.log('extractTypeFormatting:', string);
            // check if there's type formatting and extrac it if there is
            let typeFormatting = string.match(typeRegex);
            let hasTypeFormatting = typeFormatting ? true : false;
            //console.log('hasTypeFormatting:', hasTypeFormatting, 'typeFormatting:', typeFormatting);
            if (hasTypeFormatting){
                // extract the unformatted text and add it to the object
                string = typeFormatting[1];
                parsedObject.text = string;
                // extract the type(s) and add them to the object
                let types = typeFormatting[2].split('_');
                for (let j = 0; j < types.length; j++){
                    parsedObject.styles.push({
                        kind: 'type',
                        type: types[j]
                        });
                    }
                }
            // if the string still has formatting, run it through again
            if (hasTypeFormatting && typeRegex.test(string)){
                return extractTypeFormatting(string, parsedObject);
                }
            return hasTypeFormatting;
        }

        // Loop through each string block and convert it to an object
        for (let i = 0; i < stringBlocks.length; i++){

            // Collect the base string block
            let stringBlock = stringBlocks[i];
            //console.log('%c' + 'stringBlock: = "'+stringBlock+'"', 'color: cyan;');

            // Create the object to hold the parsed block
            let parsedStringBlock = {};
            parsedStringBlock.text = stringBlock;
            parsedStringBlock.styles = [];
            parsedStringBlock.raw = stringBlock;

            // Extract tag and/or type formatting as long as there is some to extract
            extractTagFormatting(parsedStringBlock.text, parsedStringBlock);
            extractTypeFormatting(parsedStringBlock.text, parsedStringBlock);

            // If the text is still empty, we fallback to adding it directly
            if (!parsedStringBlock.text.length){ parsedStringBlock.text = stringBlock; }

            // If there were no styles, we can just null that field
            if (!parsedStringBlock.styles.length){ parsedStringBlock.styles = null; }

            // Add the parsed string block to the array
            parsedStringBlocks.push(parsedStringBlock);
            //console.log('parsedStringBlock:', parsedStringBlock);
            //console.log('%c' + 'parsedStringBlock.text: = "'+parsedStringBlock.text+'"', 'color: lime;');
            if (parsedStringBlock.styles){
                //console.log('%c' + 'parsedStringBlock.styles: = '+JSON.stringify(parsedStringBlock.styles)+'', 'color: lime;');
                }

        }

        // Return the fully-parsed string blocks
        return parsedStringBlocks;

    }


    // Define a function for parsing formatted text
    static parseFormattedStringBlocks (input)
    {
        //console.log('StringsUtility.parseFormattedStringBlocks() w/', input);

        // Define a regex pattern for matching the different types of blocks
        const regex = /(\[.*?\{.*?\}\])|(\[.*?\])|(\s)|([^\s\[\]]+)/g;
        let rawMatches = input.match(regex);

        //console.log('rawMatches:', rawMatches);
        let stringBlocks = [];
        let wordQueue = Object.values(rawMatches);

        // loop through the words and build the string blocks
        let simpleTags = ['b', 'i', 'u', 's'];
        while (wordQueue.length){
            let word = wordQueue.shift();
            // check if the word is a tag block with formatting
            let hasFormatting = word.match(/^\[(.*)?\]$/i);
            //console.log('%c' + 'word: "'+word+'", hasFormatting: '+(hasFormatting ? 'true' : 'false'), (hasFormatting ? 'color: orange;' : 'color: yellow;'));
            if (hasFormatting){
                let tagName = hasFormatting[1];
                let simpleTag = simpleTags.indexOf(tagName) !== -1;
                //console.log('tagName:', tagName);
                // as long as there are more words, seek to find the end of the tag block
                while (wordQueue.length){
                    let nextWord = wordQueue.shift();
                    //console.log('nextWord:', nextWord);
                    word += nextWord;
                    if (!simpleTag && nextWord.match(/^\{(.*)?\}/i)){ break; } // break if this was a quick type-block
                    if (simpleTag && nextWord.indexOf('[/'+tagName+']') === 0){ break; } // break if we found the matching tag
                    }
                // if the finalized word block ends with punctuation for some reason, break off that part and re-add it to the queue
                if (word.match(/[\.\,\!\?]+$/)){
                    let punctuation = word.match(/[\.\,\!\?]+$/)[0];
                    word = word.replace(/[\.\,\!\?]+$/, '');
                    wordQueue.unshift(punctuation);
                    }
                }
            //console.log('final word:', word);
            stringBlocks.push(word);
        }

        // Return the generated string blocks
        //console.log('stringBlocks:', stringBlocks);
        return stringBlocks;

    }

    // Define a function for adding formatted text to the screen at given coordinates and size
    static addFormattedText (ctx, x, y, text, options)
    {
        //console.log('StringsUtility.addFormattedText() w/', x, y, text, options);

        // Collect refs to required indexes
        let typesIndex = MMRPG.Indexes.types || {};

        // Compensate for any missing options
        options = Object.assign({}, options) || {};
        options.x = x || 0;
        options.y = y || 0;
        options.size = options.size || 8;
        options.font = options.font || 'megafont-white';
        options.margin = options.margin || 4;
        options.width = options.width || 0;
        options.height = options.height || 0;
        options.color = options.color || '#ffffff';
        options.shadow = options.shadow || '#000000';
        options.border = options.border || false;
        options.styles = Object.assign({}, this.getDefaults(), (options.styles || {}));
        options.depth = options.depth || 0;
        options.padding = options.padding || 0;
        //console.log('options:', options);

        // Create a container to hold all these items inside of
        // and make it so objects outside the container are hidden
        const maskGraphics = ctx.add.graphics();
        maskGraphics.fillStyle(0x660022);
        maskGraphics.fillRect(options.x, options.y, options.width, options.height);
        maskGraphics.setVisible(false);
        const textAreaMask = maskGraphics.createGeometryMask();
        const textAreaContainer = ctx.add.container();
        textAreaContainer.setMask(textAreaMask);
        textAreaContainer.setDepth(options.depth);

        // Create an array to hold all the elements
        let textAreaElements = [];

        // If a border was defined, make sure we draw one around the perimeter of the text
        if (options.border) {
            let borderSize = 1;
            let borderColour = 0xff0000;
            let $border = ctx.add.graphics();
            $border.lineStyle(borderSize, borderColour);
            $border.strokeRect(
                (x + borderSize),
                (y + borderSize),
                (options.width - (borderSize * 2)),
                (options.height - (borderSize * 2))
            );
            $border.setDepth(options.depth - 1);
            $border.setAlpha(0.5);
            textAreaContainer.add($border);
            textAreaContainer.sort('depth');
            textAreaElements.push({kind: 'border', elem: $border});
        }

        // Parse the formatted text into an array of objects
        let parsedStrings = this.parseFormattedText(text);
        //console.log('parsedStrings:', parsedStrings);

        // First pass: pre-render all text off-screen to measure
        let parsedStringObjects = [];
        for (let i = 0; i < parsedStrings.length; i++) {
            //console.log('%c' + '----------', 'color: magenta;');
            //console.log('%c' + 'parsedStrings['+i+'] = "' + parsedStrings[i].text + '"', 'color: pink;');

            let parsedString = parsedStrings[i];
            let stringObject = {};
            stringObject.text = parsedString.text;
            stringObject.size = [0, 0];
            stringObject.elems = [];

            let $text = ctx.add.bitmapText(-9999, -9999, options.font, parsedString.text, options.size);
            let $textMeta = {kind: 'text', elem: $text};
            $text.setOrigin(0);
            $text.setDepth(options.depth + 1 + (i * 3));
            $text.setLetterSpacing(20);
            $text.setTint(Graphics.returnHexColorValue(options.color));
            stringObject.size = [Math.ceil($text.width), Math.ceil($text.height)];
            stringObject.elems.push($textMeta);
            textAreaElements.push($textMeta);
            textAreaContainer.add($text);
            textAreaContainer.sort('depth');

            ////////////
            let $shadow = ctx.add.bitmapText(-9999, -9999, options.font, parsedString.text, options.size);
            let $shadowMeta = {kind: 'shadow', elem: $shadow, offset: [1, 1]};
            $shadow.setOrigin(0);
            $shadow.setDepth($text.depth - 2);
            $shadow.setLetterSpacing(22);
            $shadow.setTint(Graphics.returnHexColorValue(options.shadow));
            stringObject.elems.push($shadowMeta);
            textAreaElements.push($shadowMeta);
            textAreaContainer.add($shadow);
            textAreaContainer.sort('depth');
            ////////////

            // Apply styles to text
            let tagKey = -1, typeKey = -1;
            if (parsedString.styles) {

                // Loop through and collect and tag styles
                let panelTags = [];
                for (let j = 0; j < parsedString.styles.length; j++) {
                    let style = parsedString.styles[j];
                    if (!style.kind || style.kind !== 'tag'){ continue; }
                    tagKey++;
                    panelTags.push(style.tag);
                    }
                //console.log('panelTags:', panelTags);

                // Loop through and collect and type styles
                let panelTypes = [];
                for (let j = 0; j < parsedString.styles.length; j++) {
                    let style = parsedString.styles[j];
                    if (!style.kind || style.kind !== 'type'){ continue; }
                    typeKey++;
                    let typeInfo = typesIndex[style.type];
                    //console.log(typeInfo.name + ' is type key ' + typeKey);
                    panelTypes.push(typeInfo.token);
                    }
                //console.log('panelTypes:', panelTypes);

                // If there were any types, we should draw a type panel (with two colors if dual-typed)
                if (panelTypes.length > 0){

                    // Predefine some variables for the panel
                    let padding = 2;
                    let panelOffsetX = -1 * padding;
                    let panelOffsetY = 0;
                    let panelWidth = stringObject.size[0] + (padding * 2);
                    let panelHeight = $text.height;
                    let panelDepth = $text.depth - 1;
                    let typePanelConfig = {
                        x: -9999,
                        y: -9999,
                        offsetX: panelOffsetX,
                        offsetY: panelOffsetY,
                        width: panelWidth,
                        height: panelHeight,
                        depth: panelDepth,
                        border: null,
                        background: null,
                        background2: null
                        };

                    // If there are two types, we need to draw a dual-type panel, otherwise just a single type panel
                    if (panelTypes.length >= 2) {
                        let typeInfo1 = typesIndex[panelTypes[0]];
                        let typeInfo2 = typesIndex[panelTypes[1]];
                        typePanelConfig.border = Graphics.returnHexColorString(typeInfo1.colour_dark);
                        typePanelConfig.background = Graphics.returnHexColorString(typeInfo1.colour_light);
                        typePanelConfig.background2 = Graphics.returnHexColorString(typeInfo2.colour_dark);
                        } else if (panelTypes.length === 1){
                        let typeInfo = typesIndex[panelTypes[0]];
                        typePanelConfig.border = Graphics.returnHexColorString(typeInfo.colour_dark);
                        typePanelConfig.background = Graphics.returnHexColorString(typeInfo.colour_light);
                        typePanelConfig.background2 = Graphics.returnHexColorString(typeInfo.colour_dark);
                        }

                    // If this panel was bigger than the text, we need to update the size of the string object
                    if (panelWidth > stringObject.size[0]){ stringObject.size[0] = panelWidth; }
                    if (panelHeight > stringObject.size[1]){ stringObject.size[1] = panelHeight; }

                    // Create the type panel and add it to the text area container
                    let $typePanel = Graphics.addInlineTypePanel(ctx, typePanelConfig);
                    let $typePanelMeta = {kind: 'panel', elem: $typePanel};
                    if ($typePanel.elems){
                        for (let k = 0; k < $typePanel.elems.length; k++) {
                            let $typePanelElem = $typePanel.elems[k];
                            textAreaContainer.add($typePanelElem);
                            }
                        }
                    stringObject.elems.push($typePanelMeta);
                    textAreaElements.push($typePanelMeta);
                    textAreaContainer.sort('depth');

                    }

            }

            parsedStringObjects.push(stringObject);

        }

        // Second pass: position text on-screen
        let skipNextWord = false;
        let baseX = (x + options.padding);
        let baseY = (y + options.padding);
        let maxWidth = (options.width - (options.padding * 2))
        let maxHeight = (options.height - (options.padding * 2));
        let currentX = baseX;
        let currentY = baseY;
        for (let i = 0; i < parsedStringObjects.length; i++) {
            let stringObject = parsedStringObjects[i];
            //console.log('%c----------', 'color: green;');
            //console.log('parsedStringObjects[', i, '] "' + stringObject.text + '" =', typeof stringObject);

            // If we're skipping the next word, do so and reset the flag
            if (skipNextWord){
                skipNextWord = false;
                continue;
                }

            let $elems = stringObject.elems;
            for (let j = 0; j < $elems.length; j++) {
                let $elem = $elems[j];
                let offset = $elem.offset || [0, 0];
                let newX = currentX + offset[0];
                let newY = currentY + offset[1];
                //console.log('Setting position of $elem['+j+']:', $elem.kind, $elem);
                //console.log('-> currentX:', currentX, 'currentY:', currentY);
                //console.log('-> offset:', offset);
                //console.log('-> newX:', newX, 'newY:', newY);
                $elem.elem.setPosition((newX), (newY));
                //console.log('$elem['+j+'] position is now at:', $elem.x, $elem.y);
            }

            // Measure the width of the next word off-screen
            let nextWordText = '';
            let nextWordSize = 0;
            if (typeof parsedStringObjects[i + 1] !== 'undefined') {
                let nextStringObject = parsedStringObjects[i + 1];
                nextWordSize = nextStringObject.size[0];
                nextWordText = nextStringObject.text;
            }

            // Update the x and y for the next word
            currentX += stringObject.size[0];
            if ((currentX + nextWordSize) > (baseX + maxWidth)) {
                currentX = baseX;
                currentY += stringObject.size[1] + options.margin;
                if (nextWordText === ' '){ skipNextWord = true; }
            }

        }

        // Generate a return object for this collection of text elements
        const $formattedText = {
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height,
            container: textAreaContainer,
            elements: textAreaElements,
            parsedStrings: parsedStrings,
            parsedStringObjects: parsedStringObjects,
            options: options,
            };

        // Define some functions we can use for this
        function getSize(){
            return {
                width: $formattedText.width,
                height: $formattedText.height
                };
            };
        function getPosition(){
            return {
                x: $formattedText.x,
                y: $formattedText.y
                };
            };
        function setPosition(x, y){
            //console.log('setPosition(', x, y, ')');
            x = intFromString(x, options.x);
            y = intFromString(y, options.y);
            let xDiff = x - options.x;
            let yDiff = y - options.y;
            //console.log('-> setPosition(', x, y, ') w/ diff:', xDiff, yDiff);
            options.x = x;
            options.y = y;
            $formattedText.x = x;
            $formattedText.y = y;
            // Move the text area container and mask alongside with it
            //textAreaContainer.setPosition(x, y);
            maskGraphics.setPosition(maskGraphics.x + xDiff, maskGraphics.y + yDiff);
            // Move each of the elements relative to the amount moved here
            for (let i = 0; i < textAreaElements.length; i++) {
                let elemObj = textAreaElements[i];
                //console.log('updating elem['+i+']:', elemObj.kind, elemObj);
                elemObj.elem.setPosition(elemObj.elem.x + xDiff, elemObj.elem.y + yDiff);
                }
            };
        function setAlpha(alpha){
            for (let i = 0; i < textAreaElements.length; i++) {
                let elemObj = textAreaElements[i];
                if (elemObj.elem.setAlpha){ elemObj.elem.setAlpha(alpha); }
                }
            };
        function destroy(){
            //console.log('destroy() called');
            // Destroy the text area container and its mask
            textAreaContainer.destroy();
            maskGraphics.destroy();
            // Destroy each of the elements
            for (let i = 0; i < textAreaElements.length; i++) {
                let elemObj = textAreaElements[i];
                elemObj.elem.destroy();
                }
            // Nullify the elements array
            textAreaElements = [];
            };
        function intFromString(value, base = 0){
            if (typeof value === 'string' && value.match(/^(\+\=|\-=)/)){
                let dx = parseInt(value.replace(/^(\+\=|\-=)/, ''));
                value = base + (value.match(/^\+=/) ? dx : -dx);
                //console.log('re-calculated value:', value);
                }
            return value;
            };
        $formattedText.getSize = getSize;
        $formattedText.getPosition = getPosition;
        $formattedText.setAlpha = setAlpha;
        $formattedText.setPosition = setPosition;
        $formattedText.destroy = destroy;

        // Return the formatted text with some additional methods for positioning and sizing
        return $formattedText;

    }


    // -- DEBUG TESTER -- //

    // Define a function to run when you want to test that everything is functional in this class
    static test(){
        console.log('StringsUtility.test() called');

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

        // Example usage:
        //let text = "Hey there [Ice Man]{freeze}! I'm [b]good[/b], but how are [i]you[/i] today? I hear you got hit by an [Atomic Crasher]{flame_impact}! [b][i]Your weakness[/i][/b]!!! [b][Gravity Man]{space_electric}[/b] told me btw.";
        //let result = this.parseFormattedText(text);
        //console.log('%c' + 'Strings.parseFormattedText(text)', 'color: orange;');
        //console.log('text:', text);
        //console.log('result:', result);
        //console.log(JSON.stringify(result));

        // Test all the formatting-related functions in this class
        let testString = "[Ice Man]{freeze}";
        let parsedStrings = this.parseFormattedText(testString);
        let parsedStringObject = parsedStrings.length ? parsedStrings[0] : false;
        //console.log('testString:', testString, 'parsedStrings:', parsedStrings, 'parsedStringObject:', parsedStringObject);
        check('typeof parseFormattedText(testString:"' + testString + '")', 'object', typeof this.parseFormattedText(testString));
        check('typeof parseFormattedText(testString:"' + testString + '")[0]', 'object', typeof this.parseFormattedText(testString)[0]);
        check('parsedStringObject.text', "Ice Man", parsedStringObject ? parsedStringObject.text : undefined);
        check('parsedStringObject.styles[0].kind', "type", parsedStringObject ? parsedStringObject.styles[0].kind : undefined);
        check('parsedStringObject.styles[0].type', "freeze", parsedStringObject ? parsedStringObject.styles[0].type : undefined);

        // Print out the final results for this test
        results();

    }

}
