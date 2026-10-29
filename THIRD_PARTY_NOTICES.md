# Third-party notices and asset boundaries

## Included source

`frontend/vendor/` contains Three.js revision 180: `three.core.js`, `three.module.js`, `OrbitControls.js`, `BufferGeometryUtils.js`, `RoomEnvironment.js`, and `GLTFLoader.js`. Copyright remains with the Three.js authors. These files retain the accompanying [MIT license](frontend/vendor/THREE-LICENSE.txt). Source: [mrdoob/three.js, r180](https://github.com/mrdoob/three.js/tree/r180).

`frontend/shared/duck-voice.ts` is a TypeScript port of MicroDuck's voice synthesizer (`sounds/src/rng.rs`, `synth.rs`, `personality.rs`, `voices.rs`), Copyright Pollen Robotics, under the [Apache License 2.0](frontend/shared/MICRODUCK-LICENSE.txt). Source: [pollen-robotics/microduck at 942e58e](https://github.com/pollen-robotics/microduck/tree/942e58e3aa6dbb28e7037203fff11866122c7567/sounds). Changes: translated from Rust to JavaScript, with u64 arithmetic and f32 rounding emulated; WAV output, the hardware seed and the chorale/stream modules are not ported. The earlier Python original (`apirrone/microduck_sounds`) carries no license and is not used. No MicroDuck scores or recordings are included.

letsduck's (formerly DoodleDuck / DuckPalette) original software and documentation are MIT licensed. Imported libraries retain their own notices. Historical research documents quote and link external sources; those sources and trademarks do not become letsduck's intellectual property.

## Bundled project assets

The project resources in `assets/` are included with the repository owner's confirmed authorization. They retain their source terms and attribution; inclusion does not relicense them under the software's MIT licence.

- **XGO Duck V2 3MF and derived meshes/manifests:** the fixed project, model manifest and display geometry are included in `assets/`. The source metadata identifies `MakerWorld Exclusive License`; keep the original notices. Upstream hardware provenance is recorded in the [XGO hardware licensing statement](https://github.com/LuwuDynamics/xgoduck_hardware/blob/cd3358d96945c6ff2b713c7c2f3084321b9537ca/LICENSING.md).
- **Bambu catalog and export schema:** the catalog was derived from [Bambu Studio color codes at a pinned revision](https://github.com/bambulab/BambuStudio/blob/79df7ae309be398ed30c9f397c13c9911c2edc57/resources/profiles/BBL/filament/filaments_color_codes.json). Bambu Studio uses [AGPL-3.0](https://github.com/bambulab/BambuStudio/blob/master/LICENSE). The bundled catalog, presets and export data retain their respective terms; they are not relicensed under MIT.
- **Assembly preview assets** (`assets/assembly/`): tutorial videos are clips of the owner's recordings; the Arduino UNO Q model is converted from Arduino's official STEP under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); other hardware models are hand-built approximations. The piano pieces are Kevin MacLeod's *Gymnopedie No. 1* ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)) and a public-domain rendering of Mozart K.545. Keep `assets/assembly/hardware-v2/ATTRIBUTION.txt` and the credits at `frontend/assemble/audio-credits.html`.
- **Other robot repositories:** unrelated models and design assets are outside this bundle. Their software licences do not automatically cover design assets.

## Credits

XGO-Duck by Luwu Dynamics builds on the MicroDuck ecosystem by Pollen Robotics. The workspace references Bambu Lab product color identifiers. The blue-white-black design uses a DeepSeek brand-blue reference. These names identify compatibility and inspiration, not endorsement, affiliation, or trademark permission.

The [2026-10-22 licensing research](docs/history/outputs/MicroDuck-XGODuck-授权核查-2026-10-22.md) is a historical record from before the bundled project assets were authorized for this distribution.

## QR Code generator

`frontend/vendor/qrcodegen.mjs` contains Project Nayuki's MIT-licensed QR Code generator, compiled from TypeScript. Source: [official library](https://www.nayuki.io/page/qr-code-generator-library), [JavaScript download](https://www.nayuki.io/res/qr-code-generator-library/qrcodegen.js), retrieved 2026-10-22. Download SHA-256: `2511bc17f40a3c41d4a0578995db956b38997334d3d20113a5d4dc5c49c69480`. The original MIT notice is retained in the file; the sole adaptation adds an ES module export. QR generation runs locally without an external image service.

The screenshots and animated clips in `docs/media/` (used by the README) show renders of the separately licensed XGO Duck V2 model. The repository owner approved publishing them; they are not covered by the MIT licence. The people, works and ratings shown are sample data.

## Project mark

The 来做鸭 / letsduck mark (`frontend/shared/brand/logo.svg`, drawn inline by `frontend/shared/brand.ts`) embeds the original white-and-orange MicroDuck full-body product render by Pollen Robotics, sourced from the [MicroDuck website](https://pollen-robotics.com/microduck/) ([original PNG](https://pollen-robotics.com/assets/microduck/moves-portrait-alpha/posters/walk.png)). The PNG bytes are unchanged; the SVG viewport fits the complete robot into the existing avatar background. This third-party artwork is excluded from this repository's MIT licence; its copyright and applicable upstream terms remain with their respective owners. Use of this reference does not imply endorsement or trademark permission. The project name uses the visitor's system font; no font files are shipped.

## meshoptimizer 1.0.1

The position decoder in `frontend/vendor/meshopt_decoder.mjs` is from meshoptimizer 1.0.1 (MIT); see `frontend/vendor/MESHOPT-LICENSE.txt`. The encoder is a build-only npm dependency.

## Desktop and bundled runtimes

Electron 45.0.0 and electron-updater 6.8.11 retain their upstream MIT licenses and dependency notices. electron-builder 26.18.0 and @electron/asar 3.4.1 are build/test dependencies. Portable browser packages include the official Node 24.20.0 binary with its complete upstream LICENSE file. These runtime licenses do not grant redistribution rights for the separate model and manufacturer assets described above.
