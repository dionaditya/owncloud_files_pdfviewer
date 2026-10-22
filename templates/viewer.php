<?php
/**
 * Viewer page.
 *
 * Renders the ?file= URL the Files app hands over, and lets the WebAssembly
 * engine parse and rasterize the document in the browser tab. No document data
 * is sent anywhere; the server only serves the bytes it already served before.
 *
 * @var array $_
 * @var OCP\IURLGenerator $urlGenerator
 */

$urlGenerator = $_['urlGenerator'];
$version = \OCP\App::getAppVersion('files_pdfviewer');
$asset = static function (string $path) use ($urlGenerator, $version): string {
	return $urlGenerator->linkTo('files_pdfviewer', $path) . '?v=' . $version;
};
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>PDF</title>
	<link rel="stylesheet" href="<?php p($asset('js/vendor/wasm-pdf-reader/styles.css')); ?>">
	<link rel="stylesheet" href="<?php p($asset('css/viewer.css')); ?>">
	<script type="module" src="<?php p($asset('js/viewer.js')); ?>"></script>
</head>
<body>
	<div id="wpdf-root" class="wpdf-host"></div>
	<noscript>This viewer needs JavaScript and WebAssembly.</noscript>
</body>
</html>
