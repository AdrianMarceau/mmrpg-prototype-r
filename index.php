<?
// Collect metadata from the shared meta file
$metaData = json_decode(file_get_contents('src/shared/MMRPG.meta'), true);
$version = $metaData['version'];
?>
<!DOCTYPE html>
<html>
<head>
    <title>Mega Man RPG: Prototype (Remake)</title>
    <meta name="robots" content="noindex,nofollow" />
    <meta name="darkreader-lock" content="already-dark-mode" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="viewport" content="width=780, initial-scale=1, user-scalable=yes" />
    <!-- <meta name="viewport" content="width=780, initial-scale=1, maximum-scale=1, user-scalable=no" /> -->
    <link rel="stylesheet" href="index.css" />
    <!-- <script src="//cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.js"></script> -->
    <script src="src/libs/phaser-3.80.1.js"></script>
    <link rel="icon" href="src/<?= $version ?>/assets/favicon.ico" />
    <link rel="stylesheet" href="src/<?= $version ?>/assets/fonts/fonts.css" />
    <script>
    let metaData = <?= str_replace(PHP_EOL, PHP_EOL.'    ', json_encode($metaData, JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK)) ?>;
    window.mmrpgMetaData = metaData;
    </script>
</head>
<body>

    <h1>Mega Man RPG: Prototype (Remake)</h1>

    <div class="font-loader open-sans">
        <span class="regular">.</span>
        <span class="bold">.</span>
        <span class="italic">.</span>
        <span class="bold-italic">.</span>
    </div>

    <div id="game-container" class="paused">
        <script type="module" src="src/<?= $version ?>/main.js"></script>
    </div>

</body>
</html>