# Transmission 0.5 integration

Base: `ef79369` (main, merged PR #2). Date: 2026-10-23. Branch: `codex/transmission-half`.

The user explicitly accepted “透射 0.5”. The existing performance artboard records all four reviewed groups (`r3-half-hero`, `r3-half-rear`, `r3-half-posed`, `r3-half-mixed`) as passed. This follow-up applies that setting to the main viewer's Three.js renderer. A 2500 × 1750 canvas now uses a 1250 × 875 transmission background target, one quarter of its previous pixel area. Main canvas resolution, materials, sorting, adaptive depth policy and export implementation are unchanged. Drag downscaling remains unimplemented.

## Matched measurements

Managed Chromium 145 / Playwright 1.58.2, Apple M4 / ANGLE Metal, 2500 × 1750, actual production model and translucent material. The browser harness changes only `transmissionResolutionScale` between 1 and 0.5. It reverses scale/mode order in its second round, uses the same rotation sequence, discards 15 warmup frames per round and retains 80 GPU-query samples per row. CPU time is submission time; GPU time excludes presentation and the rest of the UI.

| Rendering path | Scale 1 GPU median / p95 | Scale 0.5 GPU median / p95 | CPU median, 1 → 0.5 |
| --- | --- | --- | --- |
| Existing adaptive policy | 9.95 / 11.57 ms | 6.50 / 7.92 ms | 3.10 → 3.70 ms |
| Fixed original single pass | 10.72 / 11.78 ms | 7.44 / 9.17 ms | 3.30 → 2.80 ms |
| Fixed depth prepass | 9.53 / 10.50 ms | 6.57 / 7.34 ms | 3.40 → 3.60 ms |

The adaptive policy chose the original pass in one baseline round and depth in the other; it chose depth in both candidate rounds. Its 35% median reduction includes that existing policy decision. Holding the pass constant still reduces the median by 31%. Draw calls remain 102 for single pass and 168 for depth. The policy itself was not tuned for this result.

This is not a stable 120 Hz claim: total frame time is not GPU time. An earlier candidate run had adaptive p95 8.70 ms, and the fixed single-pass p95 above exceeds 8.33 ms. Windows hardware, real mobile GPUs and public-network performance were not tested.

## Image checks

Each pair uses the same current geometry, camera, pose and finish map. MAE is foreground RGB error on a 0–255 scale; the foreground is the union of pixels with alpha >127. “Pixels >8” means at least one RGB channel differs by more than 8. This differs from older whole-image RGBA metrics.

| State | Foreground MAE | Pixels >8 |
| --- | --- | --- |
| Front | 0.5685 | 1.547% |
| Rear | 0.6842 | 2.379% |
| Pose | 0.5895 | 1.707% |
| Mixed finishes | 0.2264 | 0.731% |
| Close-up | 0.2102 | 0.738% |
| Basic material | 0 | 0% |

All five translucent comparisons remain within the reviewed experiment's error envelope. All six candidate images are RGBA-identical between single pass and depth prepass. Basic material is RGBA-identical between scale 1 and 0.5. Actual front-view baseline/candidate captures are appended to the same local artboard; the approved experiment images are preserved.

## Validation and reproduction

With imported local assets and the isolated server running, use `DUCK_BROWSER_URL=http://127.0.0.1:8897 node tests/transmission-browser.js`. Run it alone for GPU measurements. PNGs, raw timings and errors are written under ignored `output/transmission-half/`; no licensed assets or images are committed.

The test first failed on the unmodified baseline: the transmission target was 2500 × 1750 instead of 1250 × 875. It passed after the setting was applied. A 390 × 844 mobile emulation with DPR 3 also rendered the actual translucent duck with the existing canvas pixel-ratio policy and a half-size transmission target. This is a compatibility smoke check on the Mac GPU, not phone performance evidence.

Follow-up regression results:

- Node unit suite: 49 passed. Python: 75 total, 57 passed and 18 MySQL tests skipped without `DUCK_TEST_DATABASE_URL`; native nginx was supplied for delivery tests. Dependency-free personal edition: 8 passed. No Docker or local MySQL was started.
- Viewer: six idle states submit zero draws, five depth comparisons are RGBA-identical, action props bypass depth and animations settle.
- Picking: 3,920 sampled GPU IDs match CPU rays across seven view states; blank areas submit no picking draw.
- Export: all 13 thumbnails are present, 22/26 comparison images are exact and the other four retain the previously accepted differences of at most three channels. The real UI export succeeds without DDG1. Concurrent palette capture, shared-renderer restoration, readback/Worker failure fallback and subsequent recovery pass.
- No page errors. All test-owned managed Chromium instances close in `finally`.
- Source publication audit: 208 tracked/staged files, zero findings. Artboard validation: zero warnings or pending files; previous approval images were not modified.

The original port-8876 service and main checkout remain separate from this branch's port-8897 preview. The previously documented gallery locale-camera drift was not changed or reclassified as passing.
