/**
 * Mounts the PDF viewer.
 *
 * The Files app opens this page as ?file=<download url>. The engine parses and
 * rasterizes the document in this tab; nothing is sent back to the server.
 */
import { safeFileUrl } from './viewer-url.js';

const root = document.getElementById('wpdf-root');
const bundle = new URL('./vendor/wasm-pdf-reader/index.js', import.meta.url).href;
const params = new URLSearchParams(window.location.search);
// Scroll mode is the default: pages stacked, the way a document viewer is
// expected to behave. ?scroll=0 keeps the single-page layout.
const scroll = params.get('scroll') !== '0';

function fail(message) {
	root.className = 'wpdf-host wpdf-host--error';
	root.textContent = message;
}

const file = safeFileUrl(params.get('file'), window.location.href);

if (!file) {
	fail('No file given.');
} else {
	import(bundle)
		.then(({ mountPdfReader }) => {
			mountPdfReader(root, { file, continuous: scroll, fit: 'width' });
		})
		.catch((err) => {
			fail('Could not open this PDF — ' + (err && err.message ? err.message : err));
		});
}
