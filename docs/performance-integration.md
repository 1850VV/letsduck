# Approved performance integration

Base: `4cdc08d` (main); experiment reference: `d1e5bc7`. Preserve all UI and material presets.

Approved stages: (1) full-resolution position pack + Worker normals + exact print matrices; (2) demand rendering, no preserved framebuffer, original-sort depth prepass where measurements justify it; (3) asynchronous GPU hover picking with coarse bounds and stale-result suppression; (4) ZIP entry reuse and binary thumbnail upload. On 2026-10-23 the user also explicitly approved shared export geometry and all three candidate image groups on the “正式集成” artboard page (basic, silk, translucent). The artboard records all three as passed. The user subsequently approved transmission at 0.5; its separate integration and measurements are recorded in [Transmission 0.5](transmission-half.md).

The user subsequently accepted the dynamic drag resolution at 0.67, conditional on removing transition stalls before a separate PR. Its implementation and measurements are in [Drag buffer reuse](drag-buffer-reuse.md). Rejected: near-to-far sorting and transmission at 0.33. No automatic quality reduction may cross this boundary. Windows GPU/CPU performance remains unmeasured.

## 1. Model

- 66 meshes, 253,834 triangles. Generated position pack: 869,922 bytes, Brotli 588,915 bytes (575.1 KiB), gzip 640,279 bytes. Compression library: meshoptimizer 1.0.1, vertex level 2, verified byte round trips; no level 3.
- All oriented triangle positions and print coordinates match the existing DDG1 decode. This is zero **additional** coordinate error, not zero error relative to the original unquantized source.
- Browser: all 66 prepared meshes and 35 print matrices arrive from a terminated Worker. Startup does not fetch legacy geometry. Missing position pack correctly falls back to DDG1. No page errors.
- Export reuses the downloaded position pack and the main view geometry. Print normals are prepared in a separate Worker only when exporting. The 870 KB packed input remains in memory for this purpose. Successful startup and first export fetch neither DDG1 nor `geometry.bin`; both remain available for compatibility fallback.
- The Worker starts before model/catalog downloads complete. Startup failure terminates it; early script errors are retained until fallback can run, without unhandled rejected promises. Build-time hashing covers the Worker entry and its imports, including transitive decoder changes. The browser verifies the stamped URLs and immutable cache headers.
- Generated assets and browser evidence are local-only under ignored `assets/` and `output/integration/`.

## Asset delivery follow-up

Native nginx 1.27.5, using the repository config with only local paths/listener/API upstream substituted, served the actual model as 588,915 Brotli bytes and 640,279 gzip bytes. Both payloads match their sidecar files and decompress byte-for-byte to the 869,922-byte input. The response includes `Vary: Accept-Encoding`, the selected `Content-Encoding`, and distinct ETags. Synthetic HTTP checks cover absent/unsupported encodings, q=0, case-insensitive tokens, conditional requests, missing sidecars/original, and blocked source 3MF variants. The new native nginx CI test uses no licensed assets. No Docker was run locally and no deployed server was changed. Direct sidecar delivery requires no Brotli module; see [nginx gzip_static documentation](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html) for the fallback asset handler.

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
- Follow-up shared export: same renderer/context, environment and assembled geometry; a cached 512 × 512 target and export materials. Print coordinates/normals are computed lazily in the Worker. The output shader retains the pinned r180 ACES/sRGB conversion before MSAA resolve. Renderer viewport, scissor, clear state, target and exposure are restored synchronously before asynchronous readback/PNG encoding. Concurrent calls are serialized, palettes are captured per call, and failures dispose the session and fall back to the independent renderer.
- Three alternating fresh-page runs per version on M4 / managed Chromium: original first capture 505.8–520.2 ms (median 516.7), shared first capture 157.8–168.6 ms (median 158.0). Repeat medians: 488.0 → 45.6 ms. This measures the production capture path for all 13 PNGs after studio startup; upload and server ZIP work are excluded. It is not a Windows or public-network measurement.
- Shared export image check: 22/26 PNGs are RGBA-identical; the other 4 each differ in at most 3 channels, maximum difference 8/255, within the explicitly accepted experiment. Current multipart is 409,102 bytes (PNG bytes 406,080). A real UI export returns HTTP 200, makes no legacy geometry request and yields a CRC-valid 65-entry 3MF. Injected async-read and print-Worker failures fall back successfully; subsequent shared export recovers. Main-view snapshots remain exact through export, including pose, split and side-copy state. Repeated/concurrent exports preserve changed palette inputs.
- Streaming data descriptors, deflated/stored entries, Unicode names, archive comments, additions and replacements have stdlib ZIP tests. ZIP64/split cases fall back to the conventional writer.

## Correction from integrated visual comparison

The model coordinate/topology checks are exact, but new-vs-main images are **not** RGBA-identical. At 800 × 800: basic and silk each differ in 3 channels; translucent differs in 2,575 channels (2,559 are alpha), with 2 channels differing by more than 8. Translucent whole-image RGBA MAE is 0.001018/255; this is not a foreground-only metric. The depth prepass comparison above uses the same current geometry on both sides and remains exact.

Actual before/after images are on the existing local performance artboard, in the integration page. The user explicitly accepted all three groups on 2026-10-23; this resolves the model visual-acceptance gate. The source changes stay on the integration branch; the running original service is unchanged.

## Reproduction

With local assets imported: `npm ci && npm run pack:positions`. Start an isolated backend with its own SQLite database and static frontend, then set `DUCK_BROWSER_URL` (default port 8897). `tests/model-browser.js` additionally uses `DUCK_BASELINE_URL` (default port 8896) for the untouched original studio.

Run `node tests/model-browser.js`, `node tests/performance-browser.js`, `node tests/picking-browser.js`, and `node tests/export-browser.js` sequentially, not concurrently (GPU timing is shared). `tests/export-cold-browser.js` alternates fresh pages against the experiment baseline. `tests/export-fallback-browser.js` tests concurrent palettes, view restoration, readback/Worker failure and recovery. `DUCK_NGINX_BIN=/path/to/nginx node tests/delivery-browser.js` builds a temporary stamped site and checks actual wire payloads, Worker download overlap and shared export; it closes both nginx and Chromium. Each closes its own managed browser in `finally`. Results and images stay under ignored `output/integration/`. Browser scripts use `.js` so the existing `node --test tests/*.mjs` command stays independent of running servers and licensed assets.

## Final validation

- Follow-up Node unit suite: 49 passed. Python suite: 75 total, 57 passed and 18 MySQL tests skipped without `DUCK_TEST_DATABASE_URL` (native nginx supplied through `DUCK_NGINX_BIN`). Personal edition: 8/8 using isolated system Python, with no third-party packages.
- Desktop and phone / 12-locale acceptance: 279 checks, no errors or external requests; draft, selection, locks, camera, account names and private saves retained. Locale smoke, live-state and surface audits also passed. The acceptance script now opens the existing phone More menu before changing language.
- Browser suites close owned Chromium instances in `finally`. Browser tests are separate from asset-free CI unit contracts.
- A final regression test found that an action prop attached inside a joint could accidentally enter depth prepass. The test first failed, then passed after checking visible meshes throughout the rig, not only root children. Prop states now retain the original pass.
- Export UI smoke initially omitted the existing Print tab, then attempted to read multipart bytes through Playwright's nullable request body API. Both were harness issues; the corrected real tab/click/download flow passed (HTTP 200). Transfer size is measured from the serialized FormData, not guessed from that API.

## Architecture recommendation

Keep Three.js and the existing Python service for this integration. The measured gains come from the asset pipeline, frame scheduling, picking and ZIP reuse. Keep original material shaders and source 3MF validation. Defer the renderer/language rewrite until Windows measurements demonstrate a remaining bottleneck that these changes cannot address. Shared export rendering now addresses cold-export latency. Per-language loading and bundle trimming remain separate unimplemented work.

## Remaining acceptance

The additional gallery-detail locale-switch assertion remains a known pre-existing failure: both untouched baseline and candidate drift about 0.9 mm in the largest camera coordinate; their final positions differ by less than 0.002 mm. It was reproduced before this follow-up, not claimed as fixed or reclassified as a pass. Gallery code is unchanged.

All four implementation stages have targeted checks. Windows hardware, real mobile GPU timing, public-network cold starts, and local MySQL integration were not measured here. Per-language bundles and Three.js trimming are not included. The three integrated main-view image groups, shared export geometry, subsequent transmission 0.5 and dynamic drag 0.67 quality are accepted. Windows hardware measurements remain separate from automated checks. The existing running studio is not switched by these source changes.
