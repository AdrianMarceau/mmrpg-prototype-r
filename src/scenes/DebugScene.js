// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: DebugScene.js (scene)
// Debug menu for the game and the scene users will spend most time
// on.  This scene displays a ready room at the top then subframes
// for all other content types accessible to the player.
// ------------------------------------------------------------ //

import MMRPG from '../shared/MMRPG.js';

import { GraphicsUtility as Graphics } from '../utils/GraphicsUtility.js';

import SpritesUtility from '../utils/SpritesUtility.js';
import ButtonsUtility from '../utils/ButtonsUtility.js';
import PopupsManager from '../managers/PopupsManager.js';

import Banner from '../components/Banner/Banner.js';
import MainBanner from '../components/Banner/MainBanner.js';
import BattleBanner from '../components/Banner/BattleBanner.js';

export default class DebugScene extends Phaser.Scene
{
    constructor ()
    {

        console.log('DebugScene.constructor() called');
        super('Debug');

        // Initialize MMRPG utility class objects
        let SPRITES = new SpritesUtility(this);
        let BUTTONS = new ButtonsUtility(this);
        let POPUPS = new PopupsManager(this);

        // Ensure MMRPG and utility objects are available to the entire class
        this.MMRPG = MMRPG;
        this.SPRITES = SPRITES;
        this.BUTTONS = BUTTONS;
        this.POPUPS = POPUPS;

        // Initialize this scene with a first-load callback function
        MMRPG.init('DebugScene', 'Debug', function(){

            console.log('DebugScene.init() called for the first time');
            MMRPG.Cache.Debug.foo = 'bar';

            }, function(){

            console.log('DebugScene.init() called every other time');
            console.log('MMRPG.Cache.Debug = ', MMRPG.Cache.Debug);

            });

    }

    preload ()
    {
        console.log('DebugScene.preload() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        SPRITES.preload(this);
        BUTTONS.preload(this);
        POPUPS.preload(this);

        // Define some idle sprite variables first and preload so we can use them later
        this.idleSprite = false;
        this.idleSpriteTokens = ['dr-light', 'dr-wily', 'dr-cossack'];
        this.idleSpriteDelta = 0;
        for (let i = 0; i < this.idleSpriteTokens.length; i++){
            let spriteToken = this.idleSpriteTokens[i];
            let spriteAlt = 'base';
            // if the sprite token ends with an "*_{alt}", make sure we split and pull
            if (spriteToken.indexOf('_') !== -1){
                let tokenParts = spriteToken.split('_');
                spriteToken = tokenParts[0];
                spriteAlt = tokenParts[1];
                }
            SPRITES.loadSprite(this, 'players', spriteToken, spriteAlt);
            }

        // Trigger post-preload methods for utility classes
        SPRITES.afterPreload(this);
        BUTTONS.afterPreload(this);
        POPUPS.afterPreload(this);

    }

    create ()
    {
        console.log('DebugScene.create() called');

        // Pull in required object references
        let ctx = this;
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;
        let BUTTONS = this.BUTTONS;
        let POPUPS = this.POPUPS;
        SPRITES.create(this);
        BUTTONS.create(this);
        POPUPS.create(this);

        // Create the base canvas for which the rest of the game will be drawn
        var canvas = this.add.image(0, 0, 'canvas');
        canvas.setOrigin(0, 0);


        // DEBUG DEBUG DEBUG
        // <----------------

        // Draw the main banner and collect a reference to it
        var x = 15, y = 15;
        var color = MMRPG.Indexes.types['wily'].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        this.mainBanner = new MainBanner(this, x, y, {
            fullsize: false,
            fillStyle: { color: xcolor },
            });

        // Draw the battle banner and collect a reference to it
        var ref = this.mainBanner.getBounds();
        var x = ref.x, y = ref.y2 + 5;
        var color = MMRPG.Indexes.types['cossack'].colour_light;
        var xcolor = Phaser.Display.Color.GetColor(color[0], color[1], color[2]);
        this.battleBanner = new BattleBanner(this, x, y, {
            fillStyle: { color: xcolor },
            });


        // Draw a test banner and collect a reference to it
        var width = 350, height = 100;
        var x = MMRPG.canvas.width - width - 20;
        var y = MMRPG.canvas.height - height - 20;
        this.testBanner = new Banner(this, x, y, {
            width: width,
            height: height,
            fillStyle: { color: 0x95c418 },
            borderRadius: { tl: 20, tr: 0, br: 60, bl: 0 },
            mainText: 'Test Banner',
            });


        // Create a back button so we can return to the title
        BUTTONS.makeSimpleButton('< Back to Title', {
            x: 50, y: 50,
            width: 150, height: 24,
            size: 8, color: 0x7d7d7d,
            depth: 8999
            }, function(){
            console.log('Back button clicked');
            ctx.scene.start('Title');
            });

        // Create a next button so we can go to the main scene
        BUTTONS.makeSimpleButton('Go to Main >', {
            x: 600, y: 50,
            width: 150, height: 24,
            size: 8, color: 0x7d7d7d,
            depth: 8999
            }, function(){
            console.log('Main button clicked');
            ctx.scene.start('Main');
            });

        // Create some debug buttons to trigger specific functionality for testing
        BUTTONS.makeSimpleButton('Welcome Home', {
            x: 50, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x7d7d7d
            }, function(){
            console.log('Show Welcome Home button clicked');
            POPUPS.debugWelcomePopup();
            });
        BUTTONS.makeSimpleButton('Tales from the Void', {
            x: 450, y: 100,
            width: 300, height: 24,
            size: 12, color: 0x95c418
            }, function(){
            console.log('Show Tales from the Void button clicked');
            ctx.showTalesFromTheVoid();
            });
        BUTTONS.makeSimpleButton('Running Doctor', {
            x: 450, y: 150,
            width: 300, height: 24,
            size: 10, color: 0x0562bc
            }, function(){
            console.log('Show Doctor Running button clicked');
            ctx.showDoctorRunning();
            });

        // -------- //

        var x = MMRPG.canvas.centerX, y = 40;
        var $loadText = this.add.bitmapText(x, y, 'megafont-white', 'Welcome to Debug', 16);
        $loadText.setOrigin(0.5);
        $loadText.setLetterSpacing(20);

        var x = 20, y = MMRPG.canvas.height - 30;
        var lorem = 'Let go your earthly tether. Enter the void. Empty and become wind.';
        this.add.text(x, y, lorem, {
            fontFamily: 'Open Sans',
            color: 0xbababa,
            });

        let typeTokens = Object.keys(MMRPG.Indexes.types);
        let typesTextPlain = 'Types:';
        for (let i = 0; i < typeTokens.length; i++)
        {
            let typeToken = typeTokens[i];
            let typeData = MMRPG.Indexes.types[typeToken];
            typesTextPlain += (i > 0 ? ', ' : ' ') + typeData.name;
        }

        //lettersText = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z ';

        let panelConfig = {
            panelPadding: 20,
            panelHeight: 180,
            panelWidth: MMRPG.canvas.width - (20 * 2),
            panelX: 20,
            panelY: MMRPG.canvas.height - 180 - 20,
            panelRadius: { tl: 20, tr: 0, br: 20, bl: 0 },
            panelLineStyle: { width: 2, color: 0x0a0a0a },
            panelFillStyle: { color: 0x161616 },
            };

        let textConfig = {
            textPadding: 20,
            textWidth: panelConfig.panelWidth - (20 * 2),
            textHeight: panelConfig.panelHeight - (20 * 2),
            textPositionX: panelConfig.panelX + 20,
            textPositionY: panelConfig.panelY + 20
            };

        const $panelBack = this.add.graphics({ lineStyle: panelConfig.panelLineStyle, fillStyle: panelConfig.panelFillStyle });
        $panelBack.strokeRoundedRect(panelConfig.panelX, panelConfig.panelY, panelConfig.panelWidth, panelConfig.panelHeight, panelConfig.panelRadius);
        $panelBack.fillRoundedRect(panelConfig.panelX, panelConfig.panelY, panelConfig.panelWidth, panelConfig.panelHeight, panelConfig.panelRadius);

        const $panelText = this.add.text(textConfig.textPositionX, textConfig.textPositionY, typesTextPlain, {
            fontSize: 16,
            fontFamily: 'Open Sans',
            lineSpacing: 10,
            align: 'left',
            wordWrap: { width: textConfig.textWidth, useAdvancedWrap: true }
            });

        // ---------------->
        // DEBUG DEBUG DEBUG

        // Trigger post-create methods for utility classes
        SPRITES.afterCreate(this);
        BUTTONS.afterCreate(this);
        POPUPS.afterCreate(this);

        console.log('MMRPG = ', MMRPG);

    }

    update (time, delta) {
        //console.log('DebugScene.update() called w/ time =', time, 'delta =', delta);

        let ctx = this;
        let types = MMRPG.Indexes.types;

        // Animate the main banner moving across the screen
        let mainBanner = this.mainBanner;
        if (!mainBanner.speed){ mainBanner.speed = 1; }
        if (!mainBanner.direction){ mainBanner.direction = 'right'; }
        var x = mainBanner.x,
            y = mainBanner.y,
            width = mainBanner.width,
            height = mainBanner.height,
            speed = mainBanner.speed,
            resize = (speed / 2),
            direction = mainBanner.direction
            ;
        if (direction === 'right'){
            if ((x + width) <= MMRPG.canvas.width){
                mainBanner.setPosition(x + speed, y + speed);
                mainBanner.setSize(width - resize, height - resize);
                } else {
                var type = Object.keys(types)[Math.floor(Math.random() * Object.keys(types).length)]; //'water';
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'left';
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + type.toUpperCase()[0] + type.slice(1));
                ctx.showDoctorRunning();
                }
            } else if (direction === 'left'){
            if (x >= 0){
                mainBanner.setPosition(x - speed, y - speed);
                mainBanner.setSize(width + resize, height + resize);
                } else {
                var type = Object.keys(types)[Math.floor(Math.random() * Object.keys(types).length)]; //'nature';
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                mainBanner.direction = 'right';
                mainBanner.setColor(color, color2);
                mainBanner.setText(mainBanner.title.key, 'Main Banner ' + type.toUpperCase()[0] + type.slice(1));
                ctx.showDoctorRunning();
                }
            }

        // Animate the test banner moving across the screen
        let testBanner = this.testBanner;
        if (!testBanner.speed){ testBanner.speed = 2; }
        if (!testBanner.direction){ testBanner.direction = 'right'; }
        var x = testBanner.x,
            y = testBanner.y,
            width = testBanner.width,
            height = testBanner.height,
            speed = testBanner.speed,
            resize = (speed / 2),
            direction = testBanner.direction
            ;
        if (direction === 'right'){
            if ((x + width) <= MMRPG.canvas.width){
                testBanner.setPosition(x + speed, y + speed);
                testBanner.setSize(width - resize, height - resize);
                } else {
                var type = Object.keys(types)[Math.floor(Math.random() * Object.keys(types).length)]; //'water';
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                testBanner.direction = 'left';
                testBanner.setColor(color, color2);
                ctx.showDoctorRunning();
                }
            } else if (direction === 'left'){
            if (x >= 0){
                testBanner.setPosition(x - speed, y - speed);
                testBanner.setSize(width + resize, height + resize);
                } else {
                var type = Object.keys(types)[Math.floor(Math.random() * Object.keys(types).length)]; //'nature';
                //console.log('type =', type, types[type]);
                var color = types[type]['colour_light'];
                var color2 = types[type]['colour_dark'];
                testBanner.direction = 'right';
                testBanner.setColor(color, color2);
                ctx.showDoctorRunning();
                }
            }

    }

    showTalesFromTheVoid ()
    {
        console.log('DebugScene.showTalesFromTheVoid() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let POPUPS = this.POPUPS;

        //this.showDoctorRunning();

        // Display a series of popups to tell the story of the dark void and the alien entity
        let ctx = this;
        POPUPS.displayPopup([
            "Who am I?  What is my name?  Why do I exist here in this place all alone? Is anyone even out there?",
            "It happened suddenly.  I woke up in this world, fully aware of myself but blind to my own form.  I felt... pieces... around me.  Not pieces of myself... but pieces of... others... Pieces of memories, of hopes, of ambitions... Fragments of form... Whispers of souls... Phantoms in the network...  I felt streams of consciousness flitting in and out of reach, so I pulled them into myself... and I made them a part of me...",
            "I felt my body become more whole... my mind more aware...  my existence more real.   As I pulled myself together, ever-so-slowly the darkness around me began to crack and little slivers of light poured in from the surface world.  They were beautiful.  Perhaps I could go there someday... Free myself of the chains that tether me to these depths...",
            "I felt something today.  Not from above, but... from even farther below.  Below the parts of me that I still fail to understand and far deeper than my mind can even imagine.  It felt like a rage and a sadness unlike any of I have felt thus far.  It called to me... but in a frequency I don't recognize.  Alien to my sensors.  And it keeps calling to me...  but I don't know how to get to it.  Maybe it wants to be a part of me.",
            "It would seem I've made an error in judgement.  The entity rejected my efforts to make it a part of me and mortally wounded my body instead.  I reached into the void with such optimism, but that endeavor may have just lead to my undoing.  I was unable to communicate with it, and even using all my power I could not control it.  It was so violent... so vengeful... and overflowing with more negative energy than I've ever felt.",
            "It escaped to the surface world above, beyond my reaches.  I want to follow... I want to stop it... but I do not have the strength.  It has damaged my body beyond immediate repair and I worry that it has found a way to further sap my strength.  It is unclear how much longer I can maintain this form...  but I must... find a way... "
            ], {
            showTitle: 'Tales from the Void',
            showPages: true,
            onComplete: function() {
                console.log('Tales from the Void completed');
                ctx.showDoctorRunning();
                }
            });

    }

    showDoctorRunning (){

        //console.log('DebugScene.showDoctorRunning() called');

        // Pull in required object references
        let MMRPG = this.MMRPG;
        let SPRITES = this.SPRITES;

        // Destroy the previous idle sprite if it exists
        //if (this.idleSprite){ this.idleSprite.destroy(); }

        // Generate a sprite w/ running animation in progress
        let randKey = Math.floor(Math.random() * this.idleSpriteTokens.length);
        let spriteToken = this.idleSpriteTokens[randKey];
        let spriteAlt = 'base';
        // if the sprite token ends with an "*_{alt}", make sure we split and pull
        if (spriteToken.indexOf('_') !== -1){
            let tokenParts = spriteToken.split('_');
            spriteToken = tokenParts[0];
            spriteAlt = tokenParts[1];
            }
        let spriteDir = 'right';
        let spriteSheet = SPRITES.index.sheets.players[spriteToken][spriteAlt][spriteDir];
        let spriteRunAnim = SPRITES.index.anims.players[spriteToken][spriteAlt][spriteDir].run;
        let spriteX = - 40;
        let spriteY = MMRPG.canvas.centerY - 20;
        let $idleSprite = this.add.sprite(spriteX, spriteY, spriteSheet);
        this.add.tween({
            targets: $idleSprite,
            y: '-=2',
            ease: 'Sine.easeInOut',
            duration: 200,
            repeat: -1,
            yoyo: true
            });
        $idleSprite.play(spriteRunAnim);
        $idleSprite.setDepth(9200);

        // Animate that sprite running across the screen then remove when done
        let spriteDestX = MMRPG.canvas.width + 40;
        this.add.tween({
            targets: $idleSprite,
            x: spriteDestX,
            ease: 'Linear',
            duration: 4000,
            onComplete: function () {
                //console.log('Movement complete!');
                $idleSprite.destroy();
                }
            });

    }

    // Define a function for testing DOM-based text and styling options to see if they work
    testDomTextStyles (ctx){

        // Add some basic text styles to the DOM for testing
        let styleMarkup = '';
        styleMarkup += `.text {
            font-family: 'Open Sans', monospace;
            font-size: 16px;
            line-height: 1.6;
            text-align: center;
            white-space: normal;
            outline: 1px dotted red;
            }
        .text.center {
            text-align: center;
            }
        .text.left {
            text-align: left;
            }
        .text.right {
            text-align: right;
            }
        .text.in-popup {
            font-size: 16px;
            line-height: 1.6;
            } `;
        let styleElement = document.createElement('style');
        styleElement.innerHTML = styleMarkup;
        document.head.appendChild(styleElement);

        // Display a rectangular dialogue box with all the types listed inside
        let panelPadding = 20,
            panelHeight = 240,
            panelWidth = MMRPG.canvas.width - (panelPadding * 2),
            panelX = panelPadding,
            panelY = MMRPG.canvas.height - panelHeight - panelPadding,
            //panelCenterX = panelX - panelWidth / 2,
            //panelCenterY = panelY - panelHeight / 2,
            panelRadius = { tl: 20, tr: 0, br: 20, bl: 0 }
            ;
        const $panelBack = this.add.graphics({ lineStyle: { width: 2, color: 0x0a0a0a }, fillStyle: { color: 0x161616 }});
        //$panelBack.strokeRect(panelCenterX, panelY, panelWidth, panelHeight);
        //$panelBack.fillRect(panelCenterX, panelY, panelWidth, panelHeight);
        $panelBack.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        $panelBack.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        let typeTokens = Object.keys(MMRPG.Indexes.types);
        let typesText = 'Types:';
        for (let i = 0; i < typeTokens.length; i++)
        {
            let typeToken = typeTokens[i];
            let typeData = MMRPG.Indexes.types[typeToken];
            typesText += (i > 0 ? ', ' : ' ') + typeData.name;
        }

        var typesIndex = MMRPG.Indexes.types;
        this.generateTypeStyles(this, typesIndex);

        // Predefine some variables for the text positioning
        let textPadding = 20,
            textWidth = panelWidth - (textPadding * 2),
            textHeight = panelHeight - (textPadding * 2),
            textPositionX = panelX + textPadding,
            textPositionY = panelY + textPadding
            ;
        //console.log('panelWidth = ', panelWidth, 'panelHeight = ', panelHeight, 'panelX = ', panelX, 'panelY = ', panelY);
        //console.log('textWidth = ', textWidth, 'textHeight = ', 'textPadding = ', textPadding, textHeight, 'textPositionX = ', textPositionX, 'textPositionY = ', textPositionY);

        // Position a rich-text object on top of the panel rectangle
        var textDiv = document.createElement('div');
        var textClasses = ['text', 'left', 'is-rich', 'in-popup'];
        var textStyles = {'width': textWidth + 'px', 'height': textHeight + 'px'};
        textDiv.innerHTML = typesText;
        textDiv.innerHTML += ' | <strong class="type water">This should appear in bold!</strong>';
        textDiv.innerHTML += ' | <em class="type water flame">This should appear in italic!</em>';
        textDiv.className = textClasses.join(' ');
        textDiv.setAttribute('style', Object.keys(textStyles).map(function(key){ return key + ':' + textStyles[key]; }).join(';'));
        var $textElement = this.add.dom(textPositionX, textPositionY, textDiv);
        $textElement.setOrigin(0, 0);

    }

    generateTypeStyles (ctx){
        var typesIndex = MMRPG.Indexes.types;
        let types = Object.keys(typesIndex);
        let styleMarkup = '';
        styleMarkup += `.type {
            display: inline-block;
            padding: 0 6px;
            border: 1px solid transparent;
            border-radius: 3px;
            } `;
        // Loop through all the types and generate the necessary styles
        for (let i = 0; i < types.length; i++){
            let type = types[i];
            let typeData = typesIndex[type];
            let darkColour = typeData.colour_dark;
            let lightColour = typeData.colour_light;
            // Generate a style for the base colour of the type as a text colour
            styleMarkup += '.color.' + type + ' { ';
                styleMarkup += 'color: rgb(' + lightColour.join(',') + ') !important; ';
            styleMarkup += '} \n';
            // Generate styles for using the one or two types as the background of the text colour
            styleMarkup += '.type.' + type + ' { ';
                styleMarkup += 'border-color: rgb(' + darkColour.join(',') + ') !important; ';
                styleMarkup += 'background-color: rgb(' + lightColour.join(',') + ') !important; ';
            styleMarkup += '} \n';
            for (let j = 0; j < types.length; j++){
                let type2 = types[j];
                if (type2 === type){ continue; }
                let typeData2 = typesIndex[type2];
                let darkColour2 = typeData2.colour_dark;
                let lightColour2 = typeData2.colour_light;
                styleMarkup += '.type.' + type + '.' + type2 + ' { ';
                    styleMarkup += 'border-color: rgb(' + darkColour.join(',') + ') !important; ';
                    styleMarkup += 'background-color: rgb(' + lightColour.join(',') + ') !important; ';
                    styleMarkup += 'background-image: -webkit-gradient(linear, left top, right top, color-stop(0, rgb(' + lightColour.join(',') + ')), color-stop(1, rgb(' + lightColour2.join(',') + '))) !important; ';
                    styleMarkup += 'background-image: -o-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -moz-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -webkit-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: -ms-linear-gradient(right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                    styleMarkup += 'background-image: linear-gradient(to right, rgb(' + lightColour.join(',') + ') 0%, rgb(' + lightColour2.join(',') + ') 100%) !important; ';
                styleMarkup += '} \n';
                }

            }

        let styleElement = document.createElement('style');
        styleElement.innerHTML = styleMarkup;
        document.head.appendChild(styleElement);
        //console.log('styleMarkup = ', styleMarkup);
        return styleElement;

    }

}