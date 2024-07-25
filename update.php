 <?php
// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: update.php
// Update script for the entire game that compiles individual meta
// files into large indexes for easier caching and parsing. This
// script can also be re-run whenever content indexes need to be
// manually refreshed to include new updates or content.
// ------------------------------------------------------------ //

// Start an output buffer to collect debug info
ob_start();

// Pull in meta-data for this game instance
$mmrpg_meta = json_decode(file_get_contents('src/shared/MMRPG.meta'), true);
echo('<pre>$mmrpg_meta = '.print_r($mmrpg_meta, true).'</pre>');

// Define the root directory and URL for the game
$root_dir = rtrim(dirname(__FILE__), '/').'/';
$root_url = ($_SERVER['HTTPS'] ? 'https://' : 'http://').$_SERVER['HTTP_HOST'].dirname($_SERVER['REQUEST_URI']).'/';
echo('<pre>$root_dir = '.print_r($root_dir, true).'</pre>');
echo('<pre>$root_url = '.print_r($root_url, true).'</pre>');
define('MMRPG_ROOT_DIR', $root_dir);
define('MMRPG_ROOT_URL', $root_url);
function hide_root_dir ($dir) { return str_replace(MMRPG_ROOT_DIR, '', $dir); }

// Define the content-path variables we'll be using in this script
$content_base_dir = $root_dir.'content/';
$content_indexes_dir = $root_dir.'src/indexes/';
echo('<pre>$content_base_dir = '.print_r(hide_root_dir($content_base_dir), true).'</pre>');
echo('<pre>$content_indexes_dir = '.print_r(hide_root_dir($content_indexes_dir), true).'</pre>');


// ------------------------------------------------------------ //
// Collect Content Indexes
// ------------------------------------------------------------ //

    try {

        // Collect the content index and see what has already been compiled
        $content_index_raw = file_get_contents($content_base_dir.'index.json');
        $content_index_parsed = json_decode($content_index_raw, true);
        $content_indexes_required = array();
        $content_indexes_compiled = array();
        if (!empty($content_index_parsed)){
            foreach ($content_index_parsed AS $kind => $meta){
                //echo('<pre>$kind = '.print_r($kind, true).'</pre>');
                $required = array();
                $compiled = array();
                $subclasses = !empty($meta['object_subclasses']) ? $meta['object_subclasses'] : array();
                if (empty($subclasses)){
                    $filename = $meta['xkind'].'.json';
                    $required[] = $filename;
                    $content_indexes_required[] = $filename;
                    if (file_exists($content_indexes_dir.$filename)){
                        $compiled[] = $filename;
                        $content_indexes_compiled[] = $filename;
                    }
                } else {
                    foreach ($subclasses AS $subclass){
                        $filename = $meta['xkind'].'.'.$subclass.'.json';
                        $required[] = $filename;
                        $content_indexes_required[] = $filename;
                        if (file_exists($content_indexes_dir.$filename)){
                            $compiled[] = $filename;
                            $content_indexes_compiled[] = $filename;
                        }
                    }
                }
                $content_index_parsed[$kind]['required'] = $required;
                $content_index_parsed[$kind]['compiled'] = $compiled;
            }
        }
        //echo('<pre>$content_index_parsed = '.print_r($content_index_parsed, true).'</pre>');
        //echo('<pre>$content_indexes_required = '.print_r($content_indexes_required, true).'</pre>');
        //echo('<pre>$content_indexes_compiled = '.print_r($content_indexes_compiled, true).'</pre>');

    } catch (Exception $e) {

        echo "Error: " . $e->getMessage() . "\n";
        exit;

    }

    // ...


// ------------------------------------------------------------ //
// Parse Content Indexes
// ------------------------------------------------------------ //

    // Define a function to generate an index array for a specific content type
    function mmrpg_generate_content_index($content_dir, $content_meta, $content_subclass = null){
        echo('<pre>mmrpg_generate_content_index($content_dir: '.hide_root_dir($content_dir).', $content_meta: '.gettype($content_meta).', $content_subclass: '.($content_subclass ? $content_subclass : 'false').')</pre>');
        //echo('<pre>w/ $content_meta = '.print_r($content_meta, true).'</pre>');
        // Pull the kind and xkind from the content meta
        $content_kind = $content_meta['kind'];
        $content_xkind = $content_meta['xkind'];
        // Collect the groups if they exist and then generate the overall token order
        $groups_filename = '_groups/';
        $groups_filename .= (!empty($content_subclass) ? $content_subclass : $content_kind).'/';
        $groups_filename .= 'data.json';
        $content_groups = file_exists($content_dir.$groups_filename) ? json_decode(file_get_contents($content_dir.$groups_filename), true) : array();
        $content_tokens = array();
        $content_groups_by_token = array();
        if (!empty($content_groups)){
            // first make sure they're sorted by group_order
            uasort($content_groups, function($a, $b){ return $a['group_order'] - $b['group_order']; });
            foreach ($content_groups AS $group_token => $group_meta){
                if (!empty($group_meta['group_child_tokens'])){
                    $group_tokens = $group_meta['group_child_tokens'];
                    foreach ($group_tokens AS $token){
                        if (in_array($token, $content_tokens)){ continue; }
                        $content_tokens[] = $token;
                        $content_groups_by_token[$token] = $group_token;
                    }
                }
            }
        }
        //echo('<pre>$groups_filename = '.print_r($groups_filename, true).'</pre>');
        //echo('<pre>$content_groups = '.print_r($content_groups, true).'</pre>');
        //echo('<pre>$content_tokens = '.print_r($content_tokens, true).'</pre>');
        //echo('<pre>$content_groups_by_token = '.print_r($content_groups_by_token, true).'</pre>');
        // Scan the actual content folder and loop through applicable folders to generate the index
        $next_order = 0;
        $content_index = array();
        $scanned_folders = scandir($content_dir);
        //echo('<pre>$scanned_folders = '.print_r($scanned_folders, true).'</pre>');
        foreach ($scanned_folders AS $folder){
            // Skip any folders that are not valid content folders
            if ($folder === '.' || $folder === '..'){ continue; }
            if (!is_dir($content_dir.$folder)){ continue; }
            if ($folder !== '.'.$content_kind){ // if not template folder, be strict
                if (substr($folder, 0, 1) === '.'){ continue; }
                if (substr($folder, 0, 1) === '_'){ continue; }
            }
            //echo('<pre>allowed $folder = '.print_r($folder, true).'</pre>');
            // Check if there's a data.json file in this subfolder
            $data_file = $content_dir.$folder.'/data.json';
            if (!file_exists($data_file)){ continue; }
            // Load the data file and parse it
            $data_raw = file_get_contents($data_file);
            $data_parsed = json_decode($data_raw, true);
            //echo('<pre>$data_file = '.print_r(hide_root_dir($data_file), true).'</pre>');
            //echo('<pre>$data_parsed = '.print_r($data_parsed, true).'</pre>');
            // Check if the data file is valid and contains an ID
            $primary_key_name = $content_kind.'_'.$content_meta['primary_key'];
            $subclass_key_name = $content_kind.'_class';
            if (empty($data_parsed) || empty($data_parsed[$primary_key_name])){ continue; }
            $primary_key_value = $data_parsed[$primary_key_name];
            $data_subclass = !empty($data_parsed[$subclass_key_name]) ? $data_parsed[$subclass_key_name] : false;
            //echo('<pre>$primary_key_value = '.print_r($primary_key_value, true).'</pre>');
            //echo('<pre>$data_subclass = '.print_r($data_subclass, true).' vs. $content_subclass = '.print_r($content_subclass, true).'</pre>');
            // If we're filtering by subclass and this ain't it, we skip
            if ($data_subclass === 'system'){
                if ($primary_key_value !== $content_kind){ continue; } // skip if system object is not THE template
            } elseif (!empty($content_subclass) && !empty($data_subclass)){
                if ($content_subclass !== $data_subclass){ continue; } // skip if subclass provided but does not match
            }
            //echo('<pre>allowed $primary_key_value = '.print_r($primary_key_value, true).'</pre>');
            // Clean the parsed data by removing any prefixes and cleaning values where applicable
            foreach ($data_parsed AS $key => $value){
                // Remove the prefix if it's at the start of the key
                $prefix = $content_kind.'_';
                if (substr($key, 0, strlen($prefix)) === $prefix){
                    $clean_key = str_replace($prefix, '', $key);
                    $data_parsed[$clean_key] = $value;
                    unset($data_parsed[$key]);
                }
            }
            // If the data is not empty, we should parse the values
            if (!empty($data_parsed)){
                // RE-ORDER BASE KEYS
                $data_template = array('id' => 0, 'token' => '', 'name' => '', 'class' => '', 'kind' => '', 'game' => '');
                $data_parsed = array_merge($data_template, $data_parsed);
                if ($content_xkind !== 'challenges'){ unset($data_parsed['id']); }
                if ($content_xkind !== 'challenges' && $content_xkind !== 'items'){ unset($data_parsed['kind']); }
                if ($content_xkind === 'challenges'){ unset($data_parsed['token'], $data_parsed['game']); }
                // FIX CLASS/SUBCLASS/KIND: There wasn't a lot of consistency before so let's fix it
                if ($content_xkind === 'challenges' && empty($data_parsed['class'])){
                    $data_parsed['class'] = $content_kind;
                } elseif ($content_xkind !== 'challenges' && isset($data_parsed['subclass'])){
                    if (isset($data_parsed['kind']) && !empty($data_parsed['subclass'])){ $data_parsed['kind'] = $data_parsed['subclass']; }
                    unset($data_parsed['subclass']);
                }
                // FIX NONE/NEUTRAL: This is annoying I know but we need to manually fix the "none" name
                if ($content_xkind === 'types'
                    && $primary_key_value === 'none'){
                    $data_parsed['name'] = 'Neutral';
                }
                // HAS TYPES: If this is an object type with types, make sure we format them correctly
                if ($content_xkind === 'players'
                    || $content_xkind === 'robots'
                    || $content_xkind === 'abilities'
                    || $content_xkind === 'items'
                    || $content_xkind === 'fields'){
                    $types = array();
                    $colors = array();
                    if ($content_xkind === 'robots'){
                        if (!empty($data_parsed['core'])){ $types[] = $data_parsed['core']; }
                        if (!empty($data_parsed['core2'])){
                            if (!empty($types)){ $types[] = $data_parsed['core2']; }
                            elseif (empty($types)){ $colors[] = $data_parsed['core2']; }
                        }
                        unset($data_parsed['core'], $data_parsed['core2']);
                    } else {
                        if (!empty($data_parsed['type'])){ $types[] = $data_parsed['type']; }
                        if (!empty($data_parsed['type2'])){
                            if (!empty($types)){ $types[] = $data_parsed['type2']; }
                            elseif (empty($types)){ $colors[] = $data_parsed['type2']; }
                        }
                        unset($data_parsed['type'], $data_parsed['type2']);
                    }
                    $data_parsed['types'] = $types;
                    $data_parsed['colors'] = !empty($colors) ? $colors : $types;
                }
                // HAS STATS: If this is an object type with stats, make sure we format them correctly
                if ($content_xkind === 'players'
                    || $content_xkind === 'robots'){
                    $stats_types = array('energy', 'weapons', 'attack', 'defense', 'speed');
                    $stats = array();
                    foreach ($stats_types AS $stat_type){
                        $field_key = $stat_type;
                        $field_value = !empty($data_parsed[$field_key]) ? $data_parsed[$field_key] : 0;
                        $stats[$stat_type] = $field_value;
                        unset($data_parsed[$field_key]);
                    }
                    if ($content_xkind === 'robots'){
                        $stats_subtypes = array('weaknesses', 'resistances', 'affinities', 'immunities');
                        foreach ($stats_subtypes AS $stat_subtype){
                            $field_key = $stat_subtype;
                            $field_value = !empty($data_parsed[$field_key]) ? $data_parsed[$field_key] : array();
                            $stats[$stat_subtype] = $field_value;
                            unset($data_parsed[$field_key]);
                        }
                    }
                    $data_parsed['stats'] = $stats;
                } elseif ($content_xkind === 'abilities'){
                    $stats = array();
                    $stats['target'] = !empty($data_parsed['target']) ? $data_parsed['target'] : 0;
                    unset($data_parsed['target']);
                    $stats['speed'] = array();
                    $stats['speed']['value'] = !empty($data_parsed['speed']) ? $data_parsed['speed'] : 0;
                    $stats['speed']['real'] = !empty($data_parsed['speed2']) ? $data_parsed['speed2'] : 0;
                    unset($data_parsed['speed'], $data_parsed['speed2']);
                    $stats['accuracy'] = array();
                    $stats['accuracy']['value'] = !empty($data_parsed['accuracy']) ? $data_parsed['accuracy'] : 0;
                    unset($data_parsed['accuracy']);
                    $stat_types = array('energy', 'damage', 'damage2', 'recovery', 'recovery2');
                    foreach ($stat_types AS $stat_type){
                        $stats[$stat_type] = array();
                        $stats[$stat_type]['value'] = !empty($data_parsed[$stat_type]) ? $data_parsed[$stat_type] : 0;
                        $stats[$stat_type]['percent'] = !empty($data_parsed[$stat_type.'_percent']) ? $data_parsed[$stat_type.'_percent'] : 0;
                        unset($data_parsed[$stat_type], $data_parsed[$stat_type.'_percent']);
                    }
                    $data_parsed['stats'] = $stats;
                } elseif ($content_xkind === 'items'){
                    $stats = array();
                    $stats['target'] = !empty($data_parsed['target']) ? $data_parsed['target'] : 0;
                    unset($data_parsed['target']);
                    $stat_types = array('damage', 'damage2', 'recovery', 'recovery2');
                    foreach ($stat_types AS $stat_type){
                        $stats[$stat_type] = array();
                        $stats[$stat_type]['value'] = !empty($data_parsed[$stat_type]) ? $data_parsed[$stat_type] : 0;
                        $stats[$stat_type]['percent'] = !empty($data_parsed[$stat_type.'_percent']) ? $data_parsed[$stat_type.'_percent'] : 0;
                        unset($data_parsed[$stat_type], $data_parsed[$stat_type.'_percent']);
                    }
                    $data_parsed['stats'] = $stats;
                } elseif ($content_xkind === 'fields'){
                    $stats = array();
                    $stats['multipliers'] = !empty($data_parsed['multipliers']) ? $data_parsed['multipliers'] : array();
                    unset($data_parsed['multipliers']);
                    $data_parsed['stats'] = $stats;
                }
                // HAS FLAVOR: If this is an object type with flavor text, make sure we format it correctly
                if ($content_xkind !== 'types'){
                    $flavor = array();
                    // HAS GENDER: If this is an object type with a gender, make sure we format it correctly
                    if ($content_xkind === 'players'
                        || $content_xkind === 'robots'){
                        $flavor['gender'] = !empty($data_parsed['gender']) ? $data_parsed['gender'] : '';
                        unset($data_parsed['gender']);
                    }
                    // HAS DESCRIPTIONS: If this is an object type with descriptions, make sure we format them correctly
                    if ($content_xkind === 'players'){
                        $flavor['title'] = !empty($data_parsed['description']) ? $data_parsed['description'] : '';
                        $flavor['fullname'] = !empty($data_parsed['name_full']) ? $data_parsed['name_full'] : '';
                        $flavor['description'] = !empty($data_parsed['description2']) ? $data_parsed['description2'] : '';
                        unset($data_parsed['description'], $data_parsed['description2'], $data_parsed['name_full']);
                    } elseif ($content_xkind === 'robots'){
                        $flavor['model'] = !empty($data_parsed['number']) ? $data_parsed['number'] : '';
                        $flavor['title'] = !empty($data_parsed['description']) ? $data_parsed['description'] : '';
                        $flavor['description'] = !empty($data_parsed['description2']) ? $data_parsed['description2'] : '';
                        unset($data_parsed['description'], $data_parsed['description2'], $data_parsed['number']);
                    } elseif ($content_xkind === 'abilities'
                        || $content_xkind === 'items'){
                        $flavor['description'] = array();
                        $flavor['description']['short'] = !empty($data_parsed['description2']) ? $data_parsed['description2'] : '';
                        $flavor['description']['full'] = !empty($data_parsed['description']) ? $data_parsed['description'] : '';
                        if ($content_xkind === 'items'){
                            $flavor['description']['use'] = !empty($data_parsed['description_use']) ? $data_parsed['description_use'] : '';
                            $flavor['description']['hold'] = !empty($data_parsed['description_hold']) ? $data_parsed['description_hold'] : '';
                            $flavor['description']['shop'] = !empty($data_parsed['description_shop']) ? $data_parsed['description_shop'] : '';
                        }
                        unset($data_parsed['description'], $data_parsed['description2'], $data_parsed['description_use'], $data_parsed['description_hold'], $data_parsed['description_shop']);
                    } elseif ($content_xkind === 'skills'){
                        $flavor['description'] = array();
                        $flavor['description']['short'] = !empty($data_parsed['description']) ? $data_parsed['description'] : '';
                        $flavor['description']['full'] = !empty($data_parsed['description2']) ? $data_parsed['description2'] : '';
                        unset($data_parsed['description'], $data_parsed['description2']);
                    } else {
                        $flavor['description'] = !empty($data_parsed['description']) ? $data_parsed['description'] : '';
                        $flavor['description2'] = !empty($data_parsed['description2']) ? $data_parsed['description2'] : '';
                        unset($data_parsed['description'], $data_parsed['description2']);
                    }
                    // HAS QUOTES: If this is an object type with quotes, make sure we format them correctly
                    if ($content_xkind === 'players'
                        || $content_xkind === 'robots'){
                        //echo('<pre>$data_parsed = '.print_r($data_parsed, true).'</pre>');
                        $qtypes = array('start', 'taunt', 'victory', 'defeat');
                        $quotes = !empty($data_parsed['quotes']) ? $data_parsed['quotes'] : array();
                        foreach ($qtypes As $qtype){
                            $field_key = 'quotes_'.$qtype;
                            $field_value = !empty($data_parsed[$field_key]) ? $data_parsed[$field_key] : '';
                            $quotes['battle_'.$qtype] = $field_value;
                            unset($data_parsed[$field_key]);
                        }
                        //echo('<pre>$quotes = '.print_r($quotes, true).'</pre>');
                        unset($data_parsed['quotes'], $data_parsed['quotes_custom']);
                        $flavor['quotes'] = $quotes;
                    }
                    // HAS MUSIC: If this is an object type with music, make sure we format it correctly
                    if ($content_xkind === 'fields'){
                        $flavor['music'] = !empty($data_parsed['music']) ? $data_parsed['music'] : '';
                        unset($data_parsed['music'], $data_parsed['music_link']);
                    }
                    unset($data_parsed['flavor']);
                    $data_parsed['flavor'] = $flavor;
                }
                // HAS IMAGE: If this is an object type with an image, let's recombine all its details into one array
                if ($content_xkind === 'players'
                    || $content_xkind === 'robots'
                    || $content_xkind === 'abilities'
                    || $content_xkind === 'items'
                    || $content_xkind === 'fields'){
                    $image = array();
                    $image['token'] = !empty($data_parsed['image']) ? $data_parsed['image'] : $primary_key_value;
                    if ($content_xkind !== 'fields'){ $image['size'] = !empty($data_parsed['image_size']) ? $data_parsed['image_size'] : ''; }
                    $image['editors'] = array();
                    if (!empty($data_parsed['image_editor'])){ $image['editors'][] = $data_parsed['image_editor']; }
                    if (!empty($data_parsed['image_editor2'])){ $image['editors'][] = $data_parsed['image_editor2']; }
                    if (!empty($data_parsed['image_editor3'])){ $image['editors'][] = $data_parsed['image_editor3']; }
                    if ($content_xkind === 'players' || $content_xkind === 'robots'){ $image['alts'] = !empty($data_parsed['image_alts']) ? $data_parsed['image_alts'] : array(); }
                    elseif ($content_xkind === 'abilities' || $content_xkind === 'items'){ $image['sheets'] = !empty($data_parsed['image_sheets']) ? $data_parsed['image_sheets'] : 0; }
                    if (!empty($image['alts'])){
                        foreach ($image['alts'] AS $key => $alt){
                            if (!isset($alt['colour'])){ continue; }
                            $alt['color'] = $alt['colour'];
                            unset($alt['colour']);
                            $image['alts'][$key] = $alt;
                        }
                    }
                    unset($data_parsed['image'], $data_parsed['image_size'], $data_parsed['image_editor'], $data_parsed['image_editor2'], $data_parsed['image_editor3'], $data_parsed['image_alts'], $data_parsed['image_sheets']);
                    $data_parsed['image'] = $image;
                }
                // HAS SKILL: If this is an object type with a skill, let's recombine all its details into one array
                if ($content_xkind === 'robots'){
                    $skill = array();
                    $has_skill = !empty($data_parsed['skill']);
                    $skill['token'] = $has_skill ? $data_parsed['skill'] : '';
                    $skill['name'] = $has_skill && !empty($data_parsed['skill_name']) ? $data_parsed['skill_name'] : '';
                    $skill['description'] = array();
                    $skill['description']['short'] = $has_skill && !empty($data_parsed['skill_description']) ? $data_parsed['skill_description'] : '';
                    $skill['description']['full'] = $has_skill && !empty($data_parsed['skill_description2']) ? $data_parsed['skill_description2'] : '';
                    $skill['parameters'] = $has_skill && !empty($data_parsed['skill_parameters']) ? $data_parsed['skill_parameters'] : array('auto' => true);
                    unset($data_parsed['skill'], $data_parsed['skill_name'], $data_parsed['skill_description'], $data_parsed['skill_description2'], $data_parsed['skill_parameters']);
                    $data_parsed['skill'] = $skill;
                }
                // HAS ABILTIES: If this is an object type that has it's own abilities, let's recombine all its details into one array
                if ($content_xkind === 'players'
                    || $content_xkind === 'robots'){
                    $abilities = array();
                    $abilities['rewards'] = !empty($data_parsed['abilities_rewards']) ? $data_parsed['abilities_rewards'] : array();
                    $abilities['compatible'] = !empty($data_parsed['abilities_compatible']) ? $data_parsed['abilities_compatible'] : array();
                    unset($data_parsed['abilities'], $data_parsed['abilities_rewards'], $data_parsed['abilities_compatible']);
                    $data_parsed['abilities'] = $abilities;
                }
                // HAS ROBOTS: If this is an object type that has it's own robots, let's recombine all its details into one array
                if ($content_xkind === 'players'){
                    $robots = array();
                    $robots['hero'] = !empty($data_parsed['robot_hero']) ? $data_parsed['robot_hero'] : '';
                    $robots['support'] = !empty($data_parsed['robot_support']) ? $data_parsed['robot_support'] : '';
                    $robots['rewards'] = !empty($data_parsed['robots_rewards']) ? $data_parsed['robots_rewards'] : array();
                    $robots['compatible'] = !empty($data_parsed['robots_compatible']) ? $data_parsed['robots_compatible'] : array();
                    unset($data_parsed['robots'], $data_parsed['robots_rewards'], $data_parsed['robots_compatible'], $data_parsed['robot_hero'], $data_parsed['robot_support']);
                    $data_parsed['robots'] = $robots;
                } elseif ($content_xkind === 'robots'){
                    $robots = array();
                    $robots['support'] = !empty($data_parsed['support']) ? $data_parsed['support'] : '';
                    unset($data_parsed['support']);
                    $data_parsed['robots'] = $robots;
                } elseif ($content_xkind === 'abilities'){
                    $robots = array();
                    $robots['master'] = !empty($data_parsed['master']) ? $data_parsed['master'] : '';
                    unset($data_parsed['master']);
                    $data_parsed['robots'] = $robots;
                } elseif ($content_xkind === 'fields'){
                    $robots = array();
                    $robots['masters'] = !empty($data_parsed['masters']) ? $data_parsed['masters'] : array();
                    $robots['mechas'] = !empty($data_parsed['mechas']) ? $data_parsed['mechas'] : array();
                    if (!empty($data_parsed['master'])){ $robots['masters'][] = $data_parsed['master']; }
                    if (!empty($data_parsed['master2'])){ $robots['masters'][] = $data_parsed['master2']; }
                    if (!empty($data_parsed['mecha'])){ $robots['mechas'][] = $data_parsed['mecha']; }
                    if (!empty($data_parsed['mecha2'])){ $robots['mechas'][] = $data_parsed['mecha2']; }
                    unset($data_parsed['masters'], $data_parsed['mechas'], $data_parsed['master'], $data_parsed['master2'], $data_parsed['mecha'], $data_parsed['mecha2']);
                    $data_parsed['robots'] = $robots;
                }
                // HAS FIELDS: If this is an object type with fields, let's recombine all its details into one array
                if ($content_xkind === 'players'
                    || $content_xkind === 'robots'){
                    $fields = array();
                    if ($content_xkind === 'players'){
                        $fields['home'] = !empty($data_parsed['field_home']) ? $data_parsed['field_home'] : '';
                        $fields['intro'] = !empty($data_parsed['field_intro']) ? $data_parsed['field_intro'] : '';
                        } elseif ($content_xkind === 'robots'){
                        $fields['home'] = !empty($data_parsed['field']) ? $data_parsed['field'] : '';
                        $fields['echo'] = !empty($data_parsed['field2']) ? $data_parsed['field2'] : '';
                        }
                    unset($data_parsed['field'], $data_parsed['field2'], $data_parsed['field_home'], $data_parsed['field_intro']);
                    $data_parsed['fields'] = $fields;
                }
                // HAS BACKGROUND/FOREGROUND: If this is an object type with background details, let's recombine all its details into one array
                if ($content_xkind === 'fields'){
                    $preview = array();
                    $preview['token'] = !empty($data_parsed['image']['token']) ? $data_parsed['image']['token'] : 'field';
                    $avatar = array();
                    $avatar['token'] = !empty($data_parsed['image']['token']) ? $data_parsed['image']['token'] : 'field';
                    $background = array();
                    $background['token'] = !empty($data_parsed['background']) ? $data_parsed['background'] : $content_kind;
                    $background['attachments'] = !empty($data_parsed['background_attachments']) ? array_values($data_parsed['background_attachments']) : array();
                    $foreground = array();
                    $foreground['token'] = !empty($data_parsed['foreground']) ? $data_parsed['foreground'] : '';
                    $foreground['attachments'] = !empty($data_parsed['foreground_attachments']) ? array_values($data_parsed['foreground_attachments']) : array();
                    $get_clean_attachments = function($old_attachments){
                        $new_attachments = array();
                        foreach ($old_attachments AS $key => $old){
                            $new = array();
                            $cls = $new['class'] = !empty($old['class']) ? $old['class'] : '';
                            $new['token'] = !empty($old[$cls.'_token']) ? $old[$cls.'_token'] : '';
                            $new['size'] = !empty($old['size']) ? $old['size'] : 40;
                            $new['frame'] = !empty($old[$cls.'_frame']) && is_array($old[$cls.'_frame']) ? $old[$cls.'_frame'][0] : 0;
                            $new['direction'] = !empty($old[$cls.'_direction']) ? $old[$cls.'_direction'] : 'left';
                            $new['offset'] = array();
                            $new['offset']['x'] = !empty($old['offset_x']) ? $old['offset_x'] : 0;
                            $new['offset']['y'] = !empty($old['offset_y']) ? $old['offset_y'] : 0;
                            $new_attachments[] = $new;
                        }
                        return $new_attachments;
                        };
                    if (!empty($background['attachments'])){ $background['attachments'] = $get_clean_attachments($background['attachments']); }
                    if (!empty($foreground['attachments'])){ $foreground['attachments'] = $get_clean_attachments($foreground['attachments']); }
                    unset($data_parsed['background'], $data_parsed['background_frame'], $data_parsed['background_attachments']);
                    unset($data_parsed['foreground'], $data_parsed['foreground_frame'], $data_parsed['foreground_attachments']);
                    $data_parsed['preview'] = $preview;
                    $data_parsed['avatar'] = $avatar;
                    $data_parsed['background'] = $background;
                    $data_parsed['foreground'] = $foreground;
                }
                // HAS COLORS/COLOURS: If this is an object type with colors, let's recombine all its details into one array
                if ($content_xkind === 'types'){
                    $colors = array();
                    $colors['dark'] = !empty($data_parsed['color_dark']) ? $data_parsed['color_dark'] : (!empty($data_parsed['colour_dark']) ? $data_parsed['colour_dark'] : '');
                    $colors['light'] = !empty($data_parsed['color_light']) ? $data_parsed['color_light'] : (!empty($data_parsed['colour_light']) ? $data_parsed['colour_light'] : '');
                    unset($data_parsed['color_dark'], $data_parsed['color_light'], $data_parsed['colour_dark'], $data_parsed['colour_light']);
                    $data_parsed['colors'] = $colors;
                }
                // HAS SHOP: If this is an object type with shop details, let's recombine all its details into one array
                if ($content_xkind === 'abilities'
                    || $content_xkind === 'items'){
                    $shop = array();
                    $shop['price'] = !empty($data_parsed['price']) ? $data_parsed['price'] : 0;
                    $shop['value'] = !empty($data_parsed['value']) ? $data_parsed['value'] : 0;
                    $shop['tab'] = !empty($data_parsed['shop_tab']) ? $data_parsed['shop_tab'] : '';
                    $shop['level'] = !empty($data_parsed['shop_level']) ? $data_parsed['shop_level'] : 0;
                    unset($data_parsed['price'], $data_parsed['value'], $data_parsed['shop_tab'], $data_parsed['shop_level']);
                    $data_parsed['shop'] = $shop;
                }
                // FLAGS: Resort parsed data so all flag_* are at the end of the data
                if (true){
                    $flags = array();
                    foreach ($data_parsed AS $field => $value){
                        if (substr($field, 0, 5) === 'flag_'){
                            $flag = substr($field, 5);
                            $flags[$flag] = $value;
                            unset($data_parsed[$field]);
                        }
                    }
                    $data_parsed['flags'] = $flags;
                }
            }
            // If we have groups, we need to update the order value for this object
            $order_backup = isset($data_parsed['order']) ? $data_parsed['order'] : -1;
            unset($data_parsed['group'], $data_parsed['order'], $data_parsed['number']);
            if ($data_subclass !== 'system'){
                if ($content_xkind !== 'types'){
                    $data_parsed['group'] = !empty($content_groups_by_token[$primary_key_value]) ? $content_groups_by_token[$primary_key_value] : '';
                    $data_parsed['order'] = !empty($content_tokens) ? array_search($primary_key_value, $content_tokens) : $next_order;
                } elseif ($content_xkind === 'types'){
                    $data_parsed['group'] = 'Types/'.ucfirst($data_parsed['class']);
                    $data_parsed['order'] = $order_backup > -1 ? $order_backup : $next_order;
                }
                $data_parsed['number'] = $data_parsed['order'] + 1;
                $next_order = $data_parsed['order'] + 1;
            } else {
                $data_parsed['group'] = 'System';
                $data_parsed['order'] = -1;
                $data_parsed['number'] = 0;
            }
            // Generate the index entry for this content object
            $content_index[$primary_key_value] = $data_parsed;
        }
        uasort($content_index, function($a, $b){ return $a['order'] - $b['order']; });
        //echo('<pre>$content_index('.$content_xkind.') = '.print_r($content_index, true).'</pre>');
        return $content_index;
    }

    // Define a function that saves indexed content to a JSON file at the specified path
    function mmrpg_save_content_index($content_index, $content_key, $content_index_file, $overwrite = false){
        echo('<pre>mmrpg_save_content_index($content_index: '.gettype($content_index).', $content_key: '.$content_key.', $content_index_file: '.hide_root_dir($content_index_file).', $overwrite: '.($overwrite ? 'true' : 'false').')</pre>');
        //echo('<pre>w/ $content_index = '.print_r($content_index, true).'</pre>');
        $content_index_json = array();
        $content_index_json['status'] = 'success';
        $content_index_json['updated'] = time();
        $real_total = count($content_index);
        $visible_total = count(array_filter($content_index, function($a){ return empty($a['flag_hidden']) && strtolower($a['group']) !== 'hidden'; }));
        $content_index_json['data'] = array(
            $content_key => $content_index,
            'total' => $real_total,
            'visible' => $visible_total,
            );
        //echo('<pre>$content_index_json = '.print_r($content_index_json, true).'</pre>');
        //$content_index_json = json_encode($content_index_json, JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
        $content_index_json = json_encode($content_index_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
        if (file_exists($content_index_file)){
            if ($overwrite){ unlink($content_index_file); }
            else { return false; }
        }
        file_put_contents($content_index_file, $content_index_json);
        return file_exists($content_index_file);
    }

    try {

        // Loop through the required content indexes and parse them
        if (!empty($content_index_parsed)){
            foreach ($content_index_parsed AS $content_xkind => $content_meta){
                echo('<h2>Processing '.ucfirst($content_xkind).' Content...</h2>');
                //if ($content_xkind !== 'abilities'){ continue; } // TEMP TEMP TEMP
                // Generate an index array for this content type
                list ($kind, $xkind) = array($content_meta['kind'], $content_meta['xkind']);
                $subclasses = !empty($content_meta['object_subclasses']) ? $content_meta['object_subclasses'] : array();
                if (empty($subclasses)){
                    $filename = $xkind.'.json';
                    $this_content_dir = $content_base_dir.$xkind.'/';
                    $this_content_index = mmrpg_generate_content_index($this_content_dir, $content_meta, false);
                    if (!empty($this_content_index)){ echo('<pre style="color: green;">Successfully parsed '.count($this_content_index).' '.$xkind.' from '.hide_root_dir($content_indexes_dir.$filename).'</pre>'); }
                    else { echo('<pre style="color: red;">Failed to parse '.$xkind.' from '.hide_root_dir($content_indexes_dir.$filename).'</pre>'); }
                    //echo('<pre>$this_content_index('.$content_xkind.') = '.print_r($this_content_index, true).'</pre>');
                    $saved = mmrpg_save_content_index($this_content_index, $xkind, $content_indexes_dir.$filename, true);
                    if ($saved){ echo('<pre style="color: green;">Successfully saved '.$xkind.' content index to '.$content_indexes_dir.$filename.'</pre>'); }
                    else { echo('<pre style="color: red;">Failed to save '.$xkind.' content index to '.$content_indexes_dir.$filename.'</pre>'); }
                } else {
                    foreach ($subclasses AS $subclass){
                        $filename = $xkind.'.'.$subclass.'.json';
                        $this_content_dir = $content_base_dir.$xkind.'/';
                        $this_content_index = mmrpg_generate_content_index($this_content_dir, $content_meta, $subclass);
                        if (!empty($this_content_index)){ echo('<pre style="color: green;">Successfully parsed '.count($this_content_index).' '.$subclass.' '.$xkind.' from '.hide_root_dir($content_indexes_dir.$filename).'</pre>'); }
                        else { echo('<pre style="color: red;">Failed to parse '.$subclass.' '.$xkind.' from '.hide_root_dir($content_indexes_dir.$filename).'</pre>'); }
                        //echo('<pre>$this_content_index('.$content_xkind.'/'.$subclass.') = '.print_r($this_content_index, true).'</pre>');
                        $saved = mmrpg_save_content_index($this_content_index, $xkind, $content_indexes_dir.$filename, true);
                        if ($saved){ echo('<pre style="color: green;">Successfully saved '.$subclass.' '.$xkind.' content index to '.$content_indexes_dir.$filename.'</pre>'); }
                        else { echo('<pre style="color: red;">Failed to save '.$subclass.' '.$xkind.' content index to '.$content_indexes_dir.$filename.'</pre>'); }
                    }
                }
            }
        }

    } catch (Exception $e) {

        echo "Error: " . $e->getMessage() . "\n";
        exit;

    }

    // ...

// ------------------------------------------------------------ //
// Print Debug Output
// ------------------------------------------------------------ //

    // Collect the content of the output buffer and clear it
    $debug_info = ob_get_clean();

    // Print out some basic HTML headers for readability
    echo "<!DOCTYPE html>".PHP_EOL;
    echo "<html>".PHP_EOL;
    echo "<head>".PHP_EOL;
    echo "<title>{$mmrpg_meta['title']} Update Script</title>".PHP_EOL;
    echo "<style type=\"text/css\"> ".
        "html { font-size: 16px; line-height: 1.6; } ".
        "body { font-size: 100%; line-height: inherit; } ".
        "h1 { font-size: 140%; line-height: 1; margin: 0 auto 15px; } ".
        "h2 { font-size: 120%; line-height: 1; margin: 0 auto 10px; } ".
        "p { font-size: 100%; margin: 0 auto 5px; } ".
        "pre { font-size: 90%; margin: 0 auto 12px; } ".
        "h1 + p { margin-top: -10px; font-size: 120%; margin-bottom: 15px; } ".
        "</style>".PHP_EOL;
    echo "</style>".PHP_EOL;
    echo "</head>".PHP_EOL;
    echo "<body>".PHP_EOL;

    // Print out the overall title for this update script
    $pretext = empty($content_indexes_compiled) ? 'Building' : 'Rebuilding';
    echo "<h1>{$mmrpg_meta['title']} Update Script</h1>".PHP_EOL;
    echo "<p>{$pretext} content indexes...</p>".PHP_EOL;
    echo "<div style=\"border: 1px dotted #dedede; padding: 10px;\">".PHP_EOL;

        // Print out any debug info that was collected in the buffer during execution
        echo $debug_info;

    // End the preformatted text block
    echo "</div>".PHP_EOL;

    // ...

// ------------------------------------------------------------ //

// Print out closing HTML tags to ensure syntax is valid
echo "</body>".PHP_EOL;
echo "</html>".PHP_EOL;

?>