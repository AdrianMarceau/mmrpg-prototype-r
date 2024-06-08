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
                if (word.match(/[\.\,\!\?]/)){
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
