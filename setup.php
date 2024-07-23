<?php
// ------------------------------------------------------------- //
// MMRPG-PROTOTYPE-R: setup.php
// Setup script for the entire game that compiles individual meta
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
        echo('<pre>w/ $content_meta = '.print_r($content_meta, true).'</pre>');
        return false;
    }

    // Define a function that saves indexed content to a JSON file at the specified path
    function mmrpg_save_content_index($content_index, $content_key, $content_index_file, $overwrite = false){
        echo('<pre>mmrpg_save_content_index($content_index: '.gettype($content_index).', $content_key: '.$content_key.', $content_index_file: '.hide_root_dir($content_index_file).', $overwrite: '.($overwrite ? 'true' : 'false').')</pre>');
        echo('<pre>w/ $content_index = '.print_r($content_index, true).'</pre>');
        return false;
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
    echo "<title>{$mmrpg_meta['title']} Setup Script</title>".PHP_EOL;
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

    // Print out the overall title for this setup script
    $pretext = empty($content_indexes_compiled) ? 'Building' : 'Rebuilding';
    echo "<h1>{$mmrpg_meta['title']} Setup Script</h1>".PHP_EOL;
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