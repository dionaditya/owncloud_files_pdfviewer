/**
 * Which ?file= values the viewer will fetch.
 *
 * The Files app passes a same-origin download URL, and public shares do the
 * same. Anything else - blob:, data:, javascript:, a foreign origin - is
 * refused, because the value arrives in the URL and an attacker can craft it.
 *
 * @param {string|null|undefined} raw
 * @param {string} base absolute page URL, used to resolve relative values
 * @returns {string|null} absolute, same-origin http(s) URL, or null
 */
export function safeFileUrl(raw, base) {
	if (!raw) {
		return null;
	}
	let url;
	try {
		url = new URL(raw, base);
	} catch (err) {
		return null;
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return null;
	}
	const page = new URL(base);
	if (url.origin !== page.origin) {
		return null;
	}
	return url.href;
}
