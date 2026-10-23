# Approved performance integration

Base: `4cdc08d` (main); experiment reference: `d1e5bc7`. Preserve all UI and material presets.

Approved stages: (1) full-resolution position pack + Worker normals + exact print matrices; (2) demand rendering, no preserved framebuffer, original-sort depth prepass where measurements justify it; (3) asynchronous GPU hover picking with coarse bounds and stale-result suppression; (4) ZIP entry reuse and binary thumbnail upload.

Not approved for integration: transmission at 0.5, drag resolution at 0.67, or shared export geometry. Rejected: near-to-far sorting and transmission at 0.33. No automatic quality reduction may cross this boundary. Windows GPU/CPU performance remains unmeasured.

## 1. Model

- 66 meshes, 253,834 triangles. Generated position pack: 869,922 bytes, Brotli 588,915 bytes (575.1 KiB), gzip 640,279 bytes. Compression library: meshoptimizer 1.0.1, vertex level 2, verified byte round trips; no level 3.
- All oriented triangle positions and print coordinates match the existing DDG1 decode. This is zero **additional** coordinate error, not zero error relative to the original unquantized source.
- Browser: all 66 prepared meshes and 35 print matrices arrive from a terminated Worker. Startup does not fetch legacy geometry. Missing position pack correctly falls back to DDG1. No page errors.
- Export deliberately loads legacy geometry lazily and retains the independent renderer. The unapproved shared-geometry export speedup is not claimed; first export incurs this additional download.
- Checks: Node 44 passed; Python 67 total, 49 passed / 18 MySQL checks skipped (no dedicated MySQL test database). Baseline had the same skips.
- Generated assets and browser evidence are local-only under ignored `assets/` and `output/integration/`.

## 2. Rendering

- The viewer sleeps after controls, camera/layout/colour tweens and actions settle. Invalidations cover resize, pose, colours, finishes, highlights, side copies, split comparison, turntable, snapshot restoration, and animated props. Main framebuffer preservation is disabled; snapshots copy immediately after an explicit render.
- At 2500 × 1750, depth prepass and the original pass produced identical RGBA in five current-geometry states (hero, rear, pose, mixed finishes, close-up). The six idle checks (initial, pose, arrange, side copy, split, snapshot) submitted zero draws during each 300 ms quiet interval; an action rendered and then settled.
- Depth prepass samples only during existing frames and never changes resolution, sorting or materials. It requires at least 12 samples per mode, >7% median GPU savings and <1 ms added median CPU submission cost. Outlines, split, side-copy and prop states retain the original single pass. Missing/disjoint timers also retain it. These conservative thresholds are implementation choices, not Windows measurements. A fresh isolated M4 run at 2500 × 1750 measured original-pass median 10.96 ms GPU / 2.95 ms CPU (102 calls), depth 9.62 / 3.35 ms (168 calls), and calibrated adaptive 9.54 / 3.25 ms (168 calls). The adaptive path selected depth on this device. This still exceeds the 8.33 ms budget for 120 Hz.
- The browser harness initially failed on its own unqualified `studioProto` wait after reload. Corrected to `window.studioProto`; the full rerun passed without page errors.

## 3. Picking

- GPU hover uses a 1 × 1 ID target and `readRenderTargetPixelsAsync`. Conservative screen boxes skip blank regions, and a latest-only queue coalesces moves. Camera/view invalidations and pointer cancellation suppress stale results. Click/double-click keep the immediate CPU path; GPU failures fall back to it.
- Managed Chromium / Apple M4: 3,920 sampled rays across hero, rear, pose, side copy, split, explode and arrange all matched CPU IDs. Blank corner: zero GPU draws. Main-thread submission p95 for hits was 0.3–0.6 ms versus CPU raycast 2.3–5.0 ms. Async completion p95 was 5.5–5.9 ms; this is reduced blocking, not a claim of lower result latency.
- Full viewer regression rerun: idle checks, five depth images and action settling pass. Windows behavior still requires hardware validation.

## 4. Export

- Both server and dependency-free personal editions accept bounded multipart uploads. Existing JSON/data-URL clients continue to work. Both formats use the same PNG, material and 3MF validation and the existing bounded export queue.
- Real model / same original geometry: 26 PNG comparisons were RGBA-identical after async encoding. Request body: JSON 542,984 bytes; multipart 409,103 bytes, including 406,081 bytes of PNGs. A real studio download returned HTTP 200 and a CRC-valid 3MF.
- Alternating seven-run native exporter comparison on M4: original median 492.65 ms, raw-entry reuse 45.18 ms, including the existing geometry/configuration verification. All 64 pre-existing output entries and CRCs match; the added manifest matches after removing `createdAt`. Archive sizes are equal (3,403,093 bytes).
- This does not eliminate first-renderer shader/environment preparation. Sequential browser sampling showed ~538 ms for first legacy capture (including lazy geometry), and ~482 ms for the following independent-renderer binary capture. Order differs, so this is not a clean cold-vs-cold speedup claim. Shared renderer/geometry remains excluded.
- Streaming data descriptors, deflated/stored entries, Unicode names, archive comments, additions and replacements have stdlib ZIP tests. ZIP64/split cases fall back to the conventional writer.

## Correction from integrated visual comparison

The model coordinate/topology checks are exact, but new-vs-main images are **not** RGBA-identical. At 800 × 800: basic and silk each differ in 3 channels; translucent differs in 2,575 channels (2,559 are alpha), with 2 channels differing by more than 8. Translucent whole-image RGBA MAE is 0.001018/255; this is not a foreground-only metric. The depth prepass comparison above uses the same current geometry on both sides and remains exact.

Actual before/after images are on the existing local performance artboard, in the integration page. These small newly observed differences require visual acceptance before merging the model integration into main. The source changes stay on the integration branch; the running original service is unchanged.

## Reproduction

With local assets imported: `npm ci && npm run pack:positions`. Start an isolated backend with its own SQLite database and static frontend, then set `DUCK_BROWSER_URL` (default port 8897). `tests/model-browser.js` additionally uses `DUCK_BASELINE_URL` (default port 8896) for the untouched original studio.

Run `node tests/model-browser.js`, `node tests/performance-browser.js`, `node tests/picking-browser.js`, and `node tests/export-browser.js` sequentially, not concurrently (GPU timing is shared). Each closes its own managed browser in `finally`. Results and images stay under ignored `output/integration/`. Browser scripts use `.js` so the existing `node --test tests/*.mjs` command stays independent of running servers and licensed assets.

## Final validation

- Node unit suite: 47 passed. Python suite: 72 total, 54 passed and 18 MySQL tests skipped without `DUCK_TEST_DATABASE_URL`. Personal edition: 8/8 using isolated system Python, with no third-party packages.
- Desktop and phone / 12-locale acceptance: 279 checks, no errors or external requests; draft, selection, locks, camera, account names and private saves retained. Locale smoke, live-state and surface audits also passed. The acceptance script now opens the existing phone More menu before changing language.
- Browser suites close owned Chromium instances in `finally`. Browser tests are separate from asset-free CI unit contracts.
- A final regression test found that an action prop attached inside a joint could accidentally enter depth prepass. The test first failed, then passed after checking visible meshes throughout the rig, not only root children. Prop states now retain the original pass.
- Export UI smoke initially omitted the existing Print tab, then attempted to read multipart bytes through Playwright's nullable request body API. Both were harness issues; the corrected real tab/click/download flow passed (HTTP 200). Transfer size is measured from the serialized FormData, not guessed from that API.

## Architecture recommendation

Keep Three.js and the existing Python service for this integration. The measured gains come from the asset pipeline, frame scheduling, picking and ZIP reuse. Keep original material shaders and source 3MF validation. Defer the renderer/language rewrite until Windows measurements demonstrate a remaining bottleneck that these changes cannot address. Shared export rendering is the next direct opportunity for cold-export latency, once its image differences are accepted; per-language loading and bundle trimming remain separate unimplemented work.

## Remaining acceptance

All four implementation stages have targeted checks. Windows hardware, real mobile GPU timing, public-network cold starts, and local MySQL integration were not measured here. Per-language bundles and Three.js trimming are not included. Final visual/interaction acceptance and Windows hardware measurements are separate from automated checks. The existing running studio is not switched by these source changes.
