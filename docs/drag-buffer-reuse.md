# Drag 0.67 without resize stalls

Base: `d2d3caa` (main, merged PR #3). Date: 2026-10-23. Branch: `codex/drag-buffer-reuse`.

The user accepted the dynamic 0.67 preview and requested a separate PR only after resolving the start/release stalls. This change stays in the existing isolated performance worktree. The original studio service and main checkout are unchanged. The local preview at port 8897 is the candidate application; port 8898 remains the earlier quality experiment.

## Implementation

The main canvas keeps its full drawing-buffer dimensions. While the pointer is held, a retained 0.67-size, four-sample render target renders the same geometry, pose, lights, original material order and material parameters. One screen pass enlarges its encoded pixels. Releasing the pointer uses the original full-size draw, including during OrbitControls damping. The low-resolution camera has its own cached transmission target, so neither transition resizes the full-size transmission target.

Buffers and shaders are prepared after an ordinary full frame, when controls and animation have settled. `compileAsync` restores scene materials and renderer state before yielding. If the user interacts before preparation finishes, rendering stays full size. Preparation is cancelled if its dimensions/materials change or interaction resumes. New dimensions replace the retained target; repeated resizing does not accumulate textures. Failure retains the original full-size renderer. A/B split keeps its existing full-size rendering. There is no polling render loop at rest.

Three r180 normally disables display tone mapping for an ordinary render target. Private material adapters apply the existing ACES/sRGB operations before MSAA resolve, only for the final low-resolution pass. The transmission intermediate stays linear. Original material objects are restored synchronously. This adapter, like the shared-export adapter, requires image regression checks when upgrading Three.

Context-loss testing also exposed stale depth-timer extension/query state. After restoration, the depth policy now reacquires its extension and drops old queries before recalibrating.

## Matched desktop measurements

Managed Chromium 145 / Playwright 1.58.2, Apple M4 / ANGLE Metal. One actual-model viewer, 2500 × 1750, translucent PLA / TPU parts, transmission 0.5, original single color pass for every timing variant. Full size, old `setSize` drag and retained-target drag alternate order and use the same camera/rotation trajectory. Preparation precedes timing; the cold fallback is tested separately with real input. GPU queries include the resize or presentation pass. CPU is submission time, not end-to-end input latency; these are not measured display FPS.

| Phase | Full-size GPU median / p95 | Old resize GPU median / p95 | Reuse GPU median / p95 | Old → reuse CPU median |
| --- | --- | --- | --- | --- |
| start | 8.15 / 10.12 ms | 16.08 / 19.56 ms | 4.88 / 6.37 ms | 16.20 → 1.50 ms |
| moving | 9.27 / 10.40 ms | 5.68 / 7.44 ms | 5.04 / 6.04 ms | 2.20 → 1.80 ms |
| release | 9.59 / 10.85 ms | 24.30 / 40.20 ms | 10.47 / 11.21 ms | 14.60 → 3.10 ms |

20 start and 20 release samples per variant; 200 moving samples per variant. Raw samples are retained, including the first prepared transition.

The acceptance target is removal of transition-only allocation/stalls relative to the full-size control, while retaining the moving-frame saving. Release still costs a normal full-size frame. It does not guarantee 120 Hz at rest/inertia, or on Windows. No Windows or physical-phone GPU measurements were made.

## Image and functional evidence

- Six states (front, rear, posed, close-up, basic, mixed finishes): full → low → full restores exactly the original RGBA within the same context.
- The low buffer is compared with the accepted `setSize(1675,1172)` renderer before enlargement. Largest observed channel difference is 2/255; the close-up whole-image RGBA MAE is 0.01053/255. This is not a claim that moving images are byte-identical. The changed render-target shader variant introduces tiny rounding differences. The reviewed 0.67 resolution itself is unchanged.
- Real pointer start/release, after preparation: zero texture or renderbuffer storage allocations; the canvas remains 2500 × 1750. Cold pointer input retains full size without starting preparation. Hover's existing 1 × 1 picker is warmed separately when counting transition allocations.
- Highlight, side-copy and arrange drag paths work; split remains full size. Export while held returns 13 PNGs and preserves viewport, canvas size and interaction state. Blur and pointer cancellation restore full size; damping eventually stops all draws.
- Four window-size changes keep texture counts constant. Context loss/restoration renders again without GL errors. An already-onboarded 390 × 844 / DPR 3 touch emulation starts and ends drag without horizontal overflow; it runs on the Mac GPU.
- Delayed/cancelled compilation, resize-before-ready, injected low-pass failure and reset recovery retain original material identities and the full-size output.
- Existing browser regressions: six idle states, five exact depth comparisons and action settling; 3,920 CPU/GPU picking ID matches; export comparisons retain 22 exact images out of 26 and the previously accepted tiny differences; all shared-export failure/Worker fallback cases pass.

The initial mobile attempt could not click the first-visit coach button because the mobile sheet intercepted it. A separate run with the `d2d3caa` viewer reproduced the same obstruction. It is outside this rendering change; the touch check above uses the persisted onboarding-complete flag, not a forced click. This does not establish first-visit mobile onboarding acceptance.

## Costs and limits

At 2500 × 1750, the extra low target and its transmission target request approximately **104 MiB** of GPU storage if DEPTH24 storage uses four bytes per sample and mipmaps are counted. This is an estimate from the actual GL allocation dimensions/formats, not measured process VRAM; driver tiling/compression can differ. It scales with canvas area and stays allocated for reuse. The tradeoff removes reallocation at pointer transitions. Shader adapters add a small number of cached programs. No new engine, worker, model or dependency is introduced.

Preparation is not free. In the real-input run, its synchronous setup took 6.8 ms; the first low warm draw took 12.3 ms CPU, followed by a normal full draw. It occurs outside drag transitions. A user who starts earlier gets the original path until preparation can finish. The normal snapshot helper still temporarily resizes its canvas; this PR does not optimize snapshot generation itself.

## Reproduce and checks

With local licensed assets imported and the isolated server running:

```sh
DUCK_DRAG_BENCH=1 node tests/drag-render-browser.js
node tests/drag-interaction-browser.js
node tests/drag-resize-browser.js
node tests/performance-browser.js
node tests/picking-browser.js
node tests/export-browser.js
node tests/export-fallback-browser.js
```

Run GPU timing alone. Override `DUCK_BROWSER_URL` if needed. Raw timings, allocation traces, screenshots and the real-input recording are under ignored `output/drag-buffer/`; no licensed assets/media are committed. The contract test first failed against main because the drag renderer did not exist. Context recovery first failed with GL `INVALID_ENUM`; it passed after renewing the depth timer state. A tighter exploratory image threshold first failed on the close-up; the final bound explicitly allows at most 2/255 and whole-image MAE below 0.02/255, rather than asserting zero moving-image error.

Repository checks: Node 49 passed; Python 57 passed / 18 MySQL tests skipped because `DUCK_TEST_DATABASE_URL` is unset; system-Python personal edition 8 passed. Local MySQL was not started. CI and publication-audit results are recorded in the PR.
