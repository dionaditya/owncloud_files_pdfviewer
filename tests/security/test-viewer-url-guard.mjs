// Which ?file= values the viewer will fetch.
//
// The Files app passes a same-origin download URL and public shares do the
// same. Anything else - blob:, data:, javascript:, a foreign origin - must be
// refused, because the value arrives in the URL and an attacker can craft it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeFileUrl } from "../../js/viewer-url.js";

const base = "https://cloud.example.com/apps/files_pdfviewer/";
const cases = [
	["/index.php/apps/files/ajax/download.php?dir=%2F&files=a.pdf", true, "Files app download url"],
	["/index.php/s/TOKEN/download", true, "public share download"],
	["https://cloud.example.com/index.php/s/TOKEN/download", true, "absolute same-origin url"],
	["blob:https://cloud.example.com/uuid#a.pdf", false, "blob url"],
	["javascript:alert(1)", false, "javascript url"],
	["data:application/pdf;base64,AAAA", false, "data url"],
	["https://evil.example/index.php/s/TOKEN/download", false, "foreign origin"],
	["//evil.example/x.pdf", false, "protocol-relative foreign origin"],
	["", false, "empty"],
	[null, false, "null"],
];

for (const [input, accepted, label] of cases) {
	test(`?file=${label}`, () => {
		const out = safeFileUrl(input, base);
		if (accepted) {
			assert.equal(typeof out, "string");
			assert.equal(new URL(out).origin, new URL(base).origin);
		} else {
			assert.equal(out, null);
		}
	});
}
