# MMRPG Prototype R

This is the official repository for the Mega Man RPG Prototype Remake (MMRPG-R). This project aims to recreate and enhance the original browser-based fangame using modern web technologies and improved design principles.  Recycling of existing assets, rather than creating new ones, is of the utmost priority.

## Project Overview

MMRPG Prototype R is an in-progress remake of the existing [Mega Man RPG Prototype](https://prototype.mmrpg-world.net/) fan-game.  The original MMRPG features characters and locations from across the classic Mega Man series presented to the player as a gauntlet of turn-based battles, offering a quaint nostalgic gaming experience on any browser-equipped device, and this remake aims to build on that by providing a smoother, more professional gameplay experience than the original.  This will ideally make it more suitable for mirroring or otherwise hosting on other platforms like Newgrounds and allowing the game to live-on even after I do not.

![Dr. Cossack & Proto Man vs Skull Man](https://prototype.mmrpg-world.net/images/assets/home-page_game-screen-2k23_dr-cossack.png)

The final title of this game, once all work has been completed, will affectionately be changed to: "Mega Man RPG: Legacy of the Prototype".

## Features / Goals

- **Enhanced Visuals:** Improved graphics and animations using Phaser 3 (when compared to the original).
- **Mission Navigation:** Select missions from an interactive hub screen and replay old ones for better scores or loot.
- **Classic Mega Man Gameplay:** Experience turn-based battles with iconic with and against Mega Man characters, bosses, and enemies.
- **Lots of Collectibles:**  Hundreds of unlockable special weapons and battle items combined with multiple in-game shops to spend your in-game currency on facilitates a lot of extra replay value.
- **Modern Save System:** LocalStorage for saving progress, with optional Newgrounds API integration for cross-device saving.  Optional cloud-based storage and an "import save data" option for legacy players.
- **Expansive Soundtrack:** Enjoy over 100 tracks of game music, optimized for performance, mixed by TheLegendOfRenegade.
- **A Bajillion Character Sprites:**  Feast on over 700 unique robot master, fortress boss, and support mecha sprite sheets, lovingly crafted by Rhythm_BCA, MegaBossMan, BrashBuster, MMX100, MetalMan, and so many more.  
- **Efficient Resource Management:** Smarter handling of game assets to ensure a more seamless gaming experience.

## Technical Overview

MMRPG Prototype R is being re-developed using modern HTML5, ES6+, and [Phaser 3](https://github.com/phaserjs/phaser) as opposed to the original's mishmash of HTML4, CSS, jQuery, PHP, and MySQL.  

## Getting Started

At the moment, this game prototype cannot be cloned to any useful effect without some extra efforts.  The `content/sounds` directory has its assets `gitignore`'d because they would bloat the size of the repo to unreasonable levels and as a result the game will not compile.  I will provide a solution to this eventually.  

The other `content/` directories (`content/robots`, `content/abilities`, etc.) are included as submodules and should be fine as-is, however please note the JSON-format indexes found in `src/indexes/` are cached/compiled versions of the aforementioned repos at the time of building.  They should generally be in-sync with what's live, but I will work out a more reliable system for this in the future.  If you need to make updates to these for whatever reason, you can source your data from the [MMRPG Prototype API v2](https://prototype.mmrpg-world.net/api/v2/). 

That being said, for as long as MMRPG-R is a WIP, you can view a live demo here: 
-  [https://dev.mmrpg-world.net/prototype2k24/game](https://dev.mmrpg-world.net/prototype2k24/game/).  

## Questions, Comments, Feedback

Drop me a line on Discord, over email, or via the MMRPG Community forums.  Whatever your preference, [I'd love to hear from you](https://adrianmarceau.ca/).  :)


