# MMRPG Prototype R

This is the official repository for the Mega Man RPG Prototype Remake (MMRPG-R). This project aims to recreate and enhance the original browser-based fangame using modern web technologies and improved design principles.  Recycling of existing assets, rather than creating new ones, is of the utmost priority.

## Project Overview

MMRPG Prototype R is an in-progress remake of the existing [Mega Man RPG Prototype](https://prototype.mmrpg-world.net/) fan-game.  The original MMRPG features characters and locations from across the classic Mega Man series presented to the player as a gauntlet of turn-based battles, offering a quaint nostalgic gaming experience on any browser-equipped device, and this remake aims to build on that by providing a smoother, more professional gameplay experience than the original.  This will ideally make it more suitable for mirroring or otherwise hosting on other platforms like Newgrounds and allowing the game to live-on even after I do not.

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

At the moment, this game cannot be cloned to any useful effect without some extra efforts.  The `content/` directory's assets are `gitignore`'d because they would bloat the size of the repo to unreasonable levels at the early stage and would be largely duplicated content of what's already stored elsewhere on GitHub.  If you are curious however and don't mind getting your hands dirty, these are the repositories that need to be cloned into your `content/` directory:

-  [mmrpg-prototype_types](https://github.com/AdrianMarceau/mmrpg-prototype_types) must be cloned to `content/types/`
-  [mmrpg-prototype_robots](https://github.com/AdrianMarceau/mmrpg-prototype_robots) must be cloned to `content/robots/`
-  [mmrpg-prototype_players](https://github.com/AdrianMarceau/mmrpg-prototype_players) must be cloned to `content/players/`
-  [mmrpg-prototype_items](https://github.com/AdrianMarceau/mmrpg-prototype_items) must be cloned to `content/items/`
-  [mmrpg-prototype_abilities](https://github.com/AdrianMarceau/mmrpg-prototype_abilities) must be cloned to `content/abilities/`
-  [mmrpg-prototype_skills](https://github.com/AdrianMarceau/mmrpg-prototype_skills) must be cloned to `content/skills/`
-  [mmrpg-prototype_fields](https://github.com/AdrianMarceau/mmrpg-prototype_fields) must be cloned to `content/fields/`

The JSON-format content indexes found in `src/indexes/` are cached versions of the above repos at the time of commit.  They should generally be in-sync with what's above, but I will work out a more reliable system for this in the future.  If you need to make any updates to these for whatever reason, you can do so manually or use the [MMRPG Prototype API v2](https://prototype.mmrpg-world.net/api/v2/) to source your data. 

## Questions, Comments, Feedback

Drop me a line on Discord, over email, or via the MMRPG Community forums.  Whatever your preference, [I'd love to hear from you](https://adrianmarceau.ca/).  :)


