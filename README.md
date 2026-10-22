# ownCloud PDF Viewer

<!-- OSPO-managed README | Generated: 2026-04-16 | v2 -->

[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE) [![ownCloud OSPO](https://img.shields.io/badge/OSPO-ownCloud-blue)](https://kiteworks.com/opensource) [![Docker Hub](https://img.shields.io/docker/pulls/owncloud)](https://hub.docker.com/r/owncloud/server)

An ownCloud Classic (OC10) app for in-browser PDF viewing. The document is parsed
and rasterized by [wasm-pdf-reader](https://github.com/dionaditya/wasm-pdf-reader),
a PDF engine written in C++ and compiled to WebAssembly, so nothing but the file
itself ever leaves the browser. Text is selectable and searchable, links are
clickable, annotations are drawn from their appearance streams (with a
`/QuadPoints` fallback for highlights and notes), encrypted documents prompt for
their password, CJK text is decoded through the Adobe CMaps, and scanned pages
decode JBIG2, JPEG and CCITT fax.

The app is a viewer, not a service: one route, static assets, and the bytes the
server already served.

## Getting Started

Enable the app in the ownCloud admin panel:

```bash
sudo -u www-data php occ app:enable files_pdfviewer
```

Scroll mode is the default (`?scroll=0` for single pages). There is no
bower/npm step at install time: the engine bundle is prebuilt under
`js/vendor/wasm-pdf-reader/` and checked in.

## Rendering engine

The viewer is a thin shell around
**[wasm-pdf-reader](https://github.com/dionaditya/wasm-pdf-reader)** (MIT, npm
`@dionaditya/wasm-pdf-reader`). This app adds the ownCloud route, the `?file=`
contract, the CSP-safe mounting script and the styling; parsing, rasterizing,
text extraction and annotation painting all happen in the engine.

- **Pinned version**: `js/vendor/wasm-pdf-reader/VERSION.json` records the
  package version, the upstream commit and the sha256 of every vendored file.
- **Updating**: `npm install && npm run sync-viewer` (or
  `npm run sync-viewer -- --from ../wasm-pdf-reader` against a checkout, and
  `--check` to verify the vendored copy). The resulting diff is the review.
- **Capabilities and gaps**: the upstream README lists what is supported and
  `ROADMAP.md` lists what is not yet — today tiling patterns, blend modes,
  colour-managed (ICC/CMYK) output and some JPEG 2000 codestreams. The app does
  not paper over them; pages render as they render and failures are reported.
- **Security**: the engine interprets fonts and colours in C++, generates no
  JavaScript from document data and is built with `-sDYNAMIC_EXECUTION=0`, so
  `eval`/`new Function` do not exist in the artifacts. The viewer page keeps
  `unsafe-eval` disabled and runs under the app's CSP; the CVE-2024-4367
  regression test in `tests/security/` asserts this against the bundle.

## Documentation

- [ownCloud Server Admin Manual](https://doc.owncloud.com/server/latest/admin_manual/)
- [wasm-pdf-reader](https://github.com/dionaditya/wasm-pdf-reader) — engine docs,
  supported features and the roadmap
- [Vendored bundle notes](js/vendor/wasm-pdf-reader/README.md) — provenance,
  update procedure and third-party licences

## Part of ownCloud Classic (OC10)

This app extends [ownCloud Server](https://github.com/owncloud/core) with PDF viewing capabilities. It is shipped as part of the [ownCloud Server Docker image](https://hub.docker.com/r/owncloud/server).

## Community & Support

**[Star](https://github.com/owncloud/files_pdfviewer)** this repo and **Watch** for release notifications!

- [ownCloud Website](https://owncloud.com)
- [Community Discussions](https://github.com/orgs/owncloud/discussions)
- [Matrix Chat](https://app.element.io/#/room/#owncloud:matrix.org)
- [Documentation](https://doc.owncloud.com)
- [Enterprise Support](https://owncloud.com/contact-us/)
- [OSPO Home](https://kiteworks.com/opensource)

## Contributing

We welcome contributions! Please read the [Contributing Guidelines](CONTRIBUTING.md)
and our [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

### Workflow

- **Rebase Early, Rebase Often!** We use a rebase workflow. Always rebase on the target branch before submitting a PR.
- **Dependabot**: Automated dependency updates are managed via Dependabot. Review and merge dependency PRs promptly.
- **Signed Commits**: All commits **must** be PGP/GPG signed. See [GitHub's signing guide](https://docs.github.com/en/authentication/managing-commit-signature-verification).
- **DCO Sign-off**: Every commit must carry a `Signed-off-by` line:
  ```
  git commit -s -S -m "your commit message"
  ```
- **GitHub Actions Policy**: Workflows may only use actions that are (a) owned by `owncloud`, (b) created by GitHub (`actions/*`), or (c) verified in the GitHub Marketplace.

## Translations

Help translate this project on Transifex:
**<https://explore.transifex.com/owncloud-org/owncloud/>**

Please submit translations via Transifex -- do not open pull requests for translation changes.

## Security

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities at **<https://security.owncloud.com>** -- see [SECURITY.md](SECURITY.md).

Bug bounty: [YesWeHack ownCloud Program](https://yeswehack.com/programs/owncloud-bug-bounty-program)

## License

This project is licensed under the [AGPL-3.0](LICENSE).

## About the ownCloud OSPO

The [Kiteworks Open Source Program Office](https://kiteworks.com/opensource), operating under
the [ownCloud](https://owncloud.com) brand, launched on May 5, 2026, to steward the open source
ecosystem around ownCloud's products. The OSPO ensures transparent governance, license compliance,
community health, and sustainable collaboration between the open source community and
[Kiteworks](https://www.kiteworks.com), which acquired ownCloud in 2023.

- **OSPO Home**: <https://kiteworks.com/opensource>
- **GitHub**: <https://github.com/owncloud>
- **ownCloud**: <https://owncloud.com>

For questions about the OSPO or licensing, contact ospo@kiteworks.com.

### License Migration to Apache 2.0

The OSPO is driving a strategic relicensing of ownCloud repositories toward the
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0), following
the [Apache Software Foundation's third-party license policy](https://www.apache.org/legal/resolved.html).

Individual repositories will migrate as their audit is completed. The LICENSE file
in each repo reflects its **current** license status (not the target).

**Current license: AGPL-3.0** (Category X per Apache policy -- cannot be included in Apache-2.0 works).

Migration prerequisites for this repository:

- **CLA/DCO coverage**: All past contributors must have signed agreements permitting relicensing
- **Copyleft dependency audit**: All AGPL/GPL dependencies must be replaced or isolated
- **KDE heritage review**: Any code with KDE-era copyrights requires legal analysis
- **Complete relicensing**: AGPL-3.0 is a strong copyleft license; migration requires full relicensing of all files, not just a header change
