# wasm-pdf-reader (vendored viewer bundle)

The PDF engine and viewer this app renders with. Upstream:
**https://github.com/dionaditya/wasm-pdf-reader** — MIT, published on npm as
`@dionaditya/wasm-pdf-reader`.

Bundle version: `@dionaditya/wasm-pdf-reader@0.2.0` (60a9b52)

Nothing here is compiled at install time: ownCloud apps serve static assets, so
the built bundle is checked in. `VERSION.json` records the package version, the
upstream commit and the sha256 of every file, so the bytes in this directory can
always be traced back to a build.

## What it is

A PDF parser and rasterizer written in C++ and compiled to WebAssembly, plus a
vanilla-JS viewer on top of it. It replaces the parsing and rendering half of the
PDF.js integration; the Files app integration, the route and the `?file=` contract
are unchanged.

Properties that matter for this app:

- No JavaScript is generated from document data — charstrings and font matrices
  are interpreted in C++ — and the module is built with
  `-sDYNAMIC_EXECUTION=0`, so `eval`/`new Function` do not exist in the shipped
  artifacts. The page keeps `unsafe-eval` disabled in its CSP.
- One `pdf-reader.wasm` (2.9 MB) and no second binary: JBIG2 and fax decoding are
  compiled in, and the 179 Adobe CJK CMaps ship inside it, so scans and Japanese,
  Chinese or Korean text need no side module and no re-render.
- Handles RC4/AES-128/AES-256 encrypted files (the host passes the password),
  CFF/CID fonts and embedded CMap streams, annotations from `/AP` with a
  `/QuadPoints` fallback, links, `/SMask` and `/Mask`.

Known gaps, with their measured numbers and the order we intend to close them:
upstream `ROADMAP.md`. Most visible today: tiling patterns, blend modes and
colour-managed (ICC/CMYK) output; JPEG 2000 codestreams written by most encoders.

## Files

| file | purpose |
| --- | --- |
| `index.js` | entry point, re-exports `PdfDocument`, `mountPdfReader` |
| `mount.js`, `document.js`, `loader.js`, `text.js` | viewer, document API, wasm loader, text layer |
| `styles.css` | viewer styles |
| `index.d.ts` | TypeScript types |
| `wasm/pdf-reader.{mjs,wasm}` | the engine (JBIG2/fax decoders and CMaps included) |
| `VERSION.json` | provenance: package version, upstream commit, sha256 per file |

## Updating

From the app root:

```bash
npm install                        # fetches the engine pinned in package.json
npm run sync-viewer                # copies the bundle here, rewrites VERSION.json
npm run sync-viewer -- --check     # verify the vendored copy matches the pin
```

While developing against an engine checkout:

```bash
npm run sync-viewer -- --from ../wasm-pdf-reader
npm run sync-viewer -- --from ../wasm-pdf-reader --check
```

To move to a newer engine: build it upstream (`./build.sh && npm run build:js`),
bump the commit in `package.json`, `npm install`, `npm run sync-viewer`, and
commit the regenerated files together with `VERSION.json` — that diff is the
review. Emscripten is needed upstream only, never here.

## Licences

The bundle is MIT (upstream `LICENSE`) and links third-party decoders: PDFium's
JBIG2 + fax codecs (Apache-2.0, via `mozilla/pdf.js.jbig2`, translated to C with
wabt BSD-2; `simde` MIT), nanopdf's JPEG 2000 decoder and CFF tables
(Apache-2.0), `stb_image`/`stb_truetype` (MIT/Public Domain), and Adobe's CMap
resources (BSD-3-Clause). Those notices travel with the upstream repository in
`THIRD-PARTY.md`; this app is AGPL-3.0 and ships the bundle unmodified.
