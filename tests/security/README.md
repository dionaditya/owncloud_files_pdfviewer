# Security regression fixtures

## CVE-2024-4367 — FontMatrix code injection (OC10-111)

`cve-2024-4367-poc.pdf` embeds a `/FontMatrix` whose sixth element is a
JavaScript string instead of a number. That only becomes code execution in a
viewer that compiles glyph commands into JavaScript source and runs it with
`new Function` — which is what pdf.js did before 4.2.67. The bundled payload is
benign: it sets `globalThis.__cve_2024_4367__` and the document title, so
exploitation can be confirmed without side effects.

The viewer no longer ships pdf.js. Rendering goes through a PDF engine written in
C++ and compiled to WebAssembly: `/FontMatrix` entries are parsed as numbers and
charstrings are interpreted, so there is no code-generation step to escape from.
The regression checks pin that down instead of trusting it:

* `verify-cve-2024-4367.mjs` — fails if `js/vendor/wasm-pdf-reader` contains any
  `eval(` or `new Function(` call, if the engine binary references either, or if
  opening the PoC sets `globalThis.__cve_2024_4367__`. It deliberately allows the
  PoC to be *refused*: throwing a clean error is a pass, executing is a failure.
* `test-viewer-url-guard.mjs` — the viewer fetches whatever `?file=` names, so
  this checks that only same-origin `http(s)` URLs are accepted and that
  `blob:`, `data:`, `javascript:` and foreign origins are refused.

## Running them

```bash
make test-security
```

Also runs on every PR via the `Security regression checks` CI job. Each script
exits non-zero on failure.
