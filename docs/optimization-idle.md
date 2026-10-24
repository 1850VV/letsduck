# Assembly idle rendering — 2026-10-24

## Scope and revisions

- Branch: `codex/optimization-idle`.
- Baseline and verified remote PR base `codex/personal-navigation`: `0699ccf96b7b101a57ab4cfb2754983f0d512a9a`.
- Implementation: `9103d2432a244c6a8b3c001c532bce8f1dab93ec`.
- Internal scheduling only. No model LOD, material/style, layout, copy, lesson or manufacturing changes. Production service was not switched.

The previous loop always submitted the main scene and detail view on every animation frame. The new standalone scheduler coalesces invalidations and stops requesting frames once visual work settles. Playback, reverse transitions, camera tweens and OrbitControls damping keep it awake. Focus exposes the remaining pulse duration independently of instantaneous brightness. The magnifier reports camera convergence and snaps only below 0.0001 world units. Input, quality controls, resize, resource completion, appearance updates and page activation invalidate rendering. Retained hidden pages still pause playback and cancel pending work.

## Comparable measurement

Local evidence folder: `output/playwright/opt-idle-1024/` (ignored, not published). The authoritative raw result is `render-metrics.txt`, with machine-readable `render-metrics.json` and reproducible `metrics-clean.js`. Other initial probe files are exploratory and must not be used: repeated page init scripts could wrap the counter more than once. The clean probe opens a new page, installs exactly one WebGL counter, and compares baseline source via a request route against the implementation using the same local assets and environment.

Apple M4, managed Chromium 155 / ANGLE Metal, 1440×1000, device scale 1. Step 0, progress 1, playback stopped; 3 seconds settling before each 2-second sample. Quality settings match before/after, including ultra scale 1.5 and 4096 shadows. The task acquired the shared benchmark lock and released only its own lock. Other application/browser load still existed (`load-clean.txt`); timings below are observations under that load, not a stable speedup estimate.

| Mode | Before WebGL draw submissions | After | Before CPU render callback median / p95 | After CPU render callbacks |
| --- | ---: | ---: | --- | ---: |
| current | 122,280 in 2000.3 ms | 0 in 2002.3 ms | 2.9 / 5.1 ms (120 callbacks) | 0 |
| ultra | 62,040 in 2001.1 ms | 0 in 2000.7 ms | 7.3 / 12.5 ms (120 callbacks) | 0 |

The counter covers native WebGL draw methods across render passes, including shadows. `renderStats` is the last main view report (516 calls, 7,620,284 triangles), not a cumulative idle counter. CPU callback duration measures JavaScript execution/submission; it is **not GPU time**, and requestAnimationFrame intervals are not GPU time. No GPU duration, energy saving, or whole-application CPU percentage was measured. An idle renderer has no frame timing samples; its median is absent, not zero milliseconds.

Pillow compared `clean-before-current.png` / `clean-after-current.png` and the ultra pair: both RGB pixel differences have empty bounding boxes (exact equality). These screenshots use the real model and are retained locally under the asset publication boundary.

## Acceptance evidence

| Criterion | Result and evidence |
| --- | --- |
| Stable 2 seconds without GPU draw submissions | Passed both modes in `render-metrics.txt`; actual GPU execution time was not queried. |
| Playback, pause/resume, next/back | Passed both modes in `interactions.txt`: progress advances, remains fixed while paused, resumes, and reverse transition settles. |
| Random jumps | Passed both modes for steps 9, 32, 64, 90 and 109; every resulting 2-second idle window submitted zero draws. |
| Camera dragging and inertia | Passed both modes: camera changes during drag and after release, then reaches zero-draw idle. Reset-view transition also passed. |
| Magnifier | Passed both modes: automatic view, toggle, drag/manual placement, camera following and settled idle. |
| Focus pulse | `pulse.txt`: step 12 green opacity changes at 200 and 550 ms, animating remains true; after the full pulse animating becomes false and the following 2 seconds draw zero. Both modes passed. The earlier step 11 focus sample is pending-fit red guidance and does not prove a green pulse. |
| Quality switching | Actual combobox switches current/ultra; quality state and screenshots verified in both modes. |
| Appearance synchronization | `appearance-both.txt`, real screenshot `appearance-red-<mode>.png`: retained page activation imports draft P4-01 `#FF3300`; visible head changes to red; then idle draws zero. Test browser storage restored afterwards. |
| Resource readiness | Fresh load produces complete textured model in both exact-match screenshot pairs; default loading-manager completion also invalidates future texture loads. |
| Resize | 1440×1000 → 1100×800 → original in both modes, with correct retained magnifier placement and zero idle draws. Additional 390×844 ultra screenshot and zero idle draws in `extra.txt`. |
| Hidden/visible restoration | Both modes retain state and draw zero while hidden, redraw on activation, then settle. Extra ultra test hides during playback: progress stays fixed and resumes after activation. |
| 111 steps / 14 chapters | Browser diagnostics retain 111/14 in both modes; unchanged lesson/state modules and existing Node state tests pass. Not all 111 steps were manually watched. |
| Same-state appearance | Exact pixel equality at step 0 in both modes. Human subjective visual acceptance and real mobile hardware remain unverified. |

`interactions.js`, `extra-checks.js`, `pulse-check.js` and `appearance-both.js` are local browser reproduction scripts. Their JSON results are in the corresponding text files. Functional windows use the original exploratory counter; zero remains reliable regardless of multiplicative wrapping. Only the clean single-probe run is used for absolute draw counts and CPU durations.

## Tests and limits

- `node --test tests/*.mjs tests/assembly/*.mjs`: 230 tests, **227 passed, 3 skipped, 0 failed**. Skips are existing missing packed-asset cases.
- Targeted scheduler tests: 3 passed; cover static sleep, coalescing, animation continuation, hidden cancellation/reactivation, and invalidation from inside a draw. Tests first failed because the required scheduler module did not exist, then passed after implementation.
- `python3 -m unittest discover -s tests -p test_personal.py -v`: **11 passed**.
- Initial system-Python full suite: 46 tests, **10 errors**, caused by unavailable httpx/sqlalchemy and the dependent server failing to start. Affected modules: test_api, test_api_i18n, test_export_transport, test_fastapi_i18n, test_i18n_errors, test_migration, test_mysql, test_startup, test_store, test_store_scaling. Full trace is retained in `python-all.txt`.
- Retried the full suite with the existing project virtual environment: 78 tests, **60 passed, 18 skipped, 0 failed**. Skips require `DUCK_TEST_DATABASE_URL`; no MySQL database was configured. `python-all-venv.txt` retains the result.
- `python3 scripts/publication_audit.py`: no findings, including newly staged code/tests. `git diff --check` and syntax checks passed.
- Browser console includes existing hidden paint preload 404s for missing `geometry.positions.bin` / `geometry.pack.bin`. Assembly assets loaded. Packed asset delivery is assigned to a separate task; this change does not synthesize or publish those assets.

GitHub CLI authentication initially failed; a later `gh auth status` succeeded, so native `git push` and authenticated `gh pr create` completed the delivery. Draft PR: https://github.com/1850VV/letsduck/pull/12, targeting `codex/personal-navigation`. No merge/deploy is authorized here.

Cleanup receipt: task session `opt-idle-1024` closed successfully. Its daemon PID 63566, browser PID 63576 and test server PID 63438 exited; port 8902 has no listener. The task benchmark lock was released after verifying its owner. Other browsers and the production service were preserved. The final full commit SHA is recorded in the delivery chat (this document identifies the implementation SHA independently).
