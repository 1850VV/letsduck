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
- Depth prepass samples only during existing frames and never changes resolution, sorting or materials. It requires at least 12 samples per mode, >7% median GPU savings and <1 ms added median CPU submission cost. Outlines, split, side-copy and prop states retain the original single pass. Missing/disjoint timers also retain it. These conservative thresholds are implementation choices, not Windows measurements.
- The browser harness initially failed on its own unqualified `studioProto` wait after reload. Corrected to `window.studioProto`; the full rerun passed without page errors.

## Remaining acceptance

Picking and export stages are still in progress. Final visual/interaction acceptance and Windows hardware measurements are separate from automated checks. The existing running studio is not switched by these source changes.
