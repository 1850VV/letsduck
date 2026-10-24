# Approved Mock v1 A/B implementation

## Scope and dependency

Implements approved small-screen assembly teaching (A) and desktop continuity (B) in the existing real assembly route. Approval is Mock v1 A/B, recorded in the parent project's `docs/personal-optimization-20261024/approval-mock-v1-ab.json`. C–G, model LOD, home/backup, printing, paint refinement, lighting styles and full translation work are excluded.

The branch starts at state reliability commit `e7234ea01cc9d574136cc4f00bf5f2ec95e19fa7`. Local merge `4f2716af924456b7409e058df153b6ee57dbe622` incorporates fixed idle commit `2acf7e85f5ec607df2240f85c5a2caa8b5366d9a`. Its single conflict combines scope/position flushing and restoration with demand-render scheduler activity. This is a local dependency merge; neither upstream PR was merged remotely.

## Behavior

- Small screens use a full-width live 3D stage, a native modal sequence drawer and an inline teaching panel. The panel scrolls internally and collapses with an accessible button; previous/replay/next stay in its fixed footer.
- Desktop uses the same teaching order beside the live stage. Real actor selection, camera controls, magnifier, quality modes, autoplay, sound and source-video clips remain connected. Observation and playback controls are in expandable sections of the teaching panel.
- All 111 steps across 14 phases use existing titles, part labels/counts, direction/action text, checks and technical warnings. No screenshot or mock step data drives the product.
- Resume position keeps the old version-1 record and semantics. Explicit watched and physical confirmations use separate per-step/per-field keys scoped by tutorial version and scheme/draft identity. Old position never implies confirmations.
- Frozen script alignment: explicit previous/next mark the departing step watched; replay marks the current step watched. Drawer jumps, restore and automatic playback never infer confirmations. Watched can be manually unchecked. Physical completion is always explicit.
- Separate confirmation keys prevent one window from overwriting another step/field. Confirmation storage events update checks without seeking playback. Failed storage writes show a failure and restore the persisted checkbox value.

## Acceptance evidence

Local evidence stays in ignored `output/playwright/optimization-ab-ui/`; browser profiles, SQLite data, screenshots and recordings are not source-distribution assets.

| Criterion | Evidence / result |
| --- | --- |
| 390×844, 834×844, 1440×1000; no horizontal overflow; stage and fixed footer visible | `assembly-ab-browser.js` actual bounds and screenshots. Stage widths 374 / 446 / 988 px; heights 290 / 696 / 836 px. Controls remain inside viewport. |
| Drawer keyboard containment, Escape, close and focus return; panel touch/collapse | Native dialog and browser checks. Overlay-close focus regressions reproduced separately, corrected and passed on the real desktop page; source/sequence dialogs return focus. The magnifier explicitly checks whether its observation disclosure is open before choosing a return target. |
| All 14 phases / 111 steps and three approved head examples | Real phase picker + drawer navigates every step; checks displayed title, text, check and grouped part labels against tutorial data. |
| Independent watched/physical, next/replay semantics, jump without confirmations | Real clicks plus progress-store tests. |
| Refresh, browser reopen, multiwindow, scheme isolation, old/corrupt records | Refresh and second-window checks passed; real persistent Chromium close/reopen passed. Corrected scheme harness and final serialized integration passed, including active-playback confirmation events without pause/seek. Original draft record is restored rather than removed. Unit tests cover corruption, unsupported records, denied storage and tutorial/scheme isolation. |
| Real orbit/zoom, assembly animation, parts and magnifier, source clip/time | Browser checks on head wire: orbit/zoom change real camera, replay advances real progress, chips select actor, live magnifier visible; `full-head.mp4` seeks source time, Escape closes/pause. |
| Color synchronization, page hot navigation and hidden-page recovery | Passed: a real cross-window scheme event updates the printed material; assemble → home → paint → home → assemble retains its live iframe and state. Hidden assembly drawing stops. |
| Current/ultra static draw-stop and control invalidation | Final serialized run: current and ultra each had **0** additional actual WebGL draw calls over a 1.2-second observation after settling. Drawer interactions caused new draws. Exclusive lock held across integration and released in finally. No timing/speedup claim. |
| Actual visual/interaction acceptance | Frozen approved images beside actual screenshots in isolated worktree Ryugi Verify page. Awaiting human verdict; technical checks do not establish visual approval. |

## Repository checks

- `python3 -m unittest discover -s tests -p test_personal.py -v`: 11 passed.
- `.venv/bin/python -m unittest discover -s tests -v`: 78 total, 60 passed, 18 MySQL checks skipped because `DUCK_TEST_DATABASE_URL` is not configured.
- Initial full Python attempt using the shared mainline environment failed to import `test_api`, `test_export_transport`, `test_fastapi_i18n` and `test_mysql`: Starlette required missing `httpx2`. Created an isolated `.venv` from repository-pinned `requirements-dev.txt`; the rerun above passed. Shared environment was not modified.
- `node --test tests/*.mjs tests/assembly/*.mjs`: 242 total, **239 passed**, **3 skipped**, **0 failed**. The three skips are the optional geometry pack round-trip/mismatch and position-pack topology checks because the two optional packed assets are absent. The existing raw-geometry fallback and real assembly assets remain usable.
- `node tests/assembly-ab-browser.js`: passed, including all 111 real drawer states, all three widths, explicit watched semantics, physical isolation, source clip/time, focus restoration, refresh and confirmation synchronization during active playback.
- `node tests/assembly-ab-integration.js`: passed under the coordinated exclusive lock, including actual persistent-browser close/reopen, touch controls, orbit/zoom, replay, magnifier, camera buttons, source dialog, both static render modes, scheme isolation/material synchronization, hidden-frame recovery and page hot navigation.
- Browser page-script exceptions: none. The local asset bundle lacks optional studio `geometry.pack.bin` / `geometry.positions.bin`, producing two fallback HTTP 404 console entries on cold startup; the existing raw geometry loads. This is the same optional-pack boundary as the skipped Node checks.
- Publication audit: **299 tracked files**, **0 findings**. `git diff --check` passed.
- Fresh-context source review found no critical issue. Its overlay-focus finding was regraded as important under the explicit keyboard criterion and fixed in the review correction pass. Both failures were observed before their fixes; the full real-browser rerun then passed.
- Local native MySQL acceptance and human visual/interaction approval remain unverified. CI has a native MySQL service; its remote result is reported separately.
- The existing asset-free CI unit step now also runs personal-state and confirmation-store regressions. The existing explicit list did not run the new confirmation tests; this addition makes the new persistence contract a CI gate without requiring licensed models.

## Reproduction and preview

The isolated personal service uses port **8905** and explicit database `output/playwright/optimization-ab-ui/test.db`. The existing 8876 service is untouched. Start from this branch with:

```sh
DUCK_PERSONAL_DB="$PWD/output/playwright/optimization-ab-ui/test.db" python3 run.py --port 8905 --no-open
node tests/assembly-ab-browser.js
DUCK_BENCHMARK_LOCK=/path/to/project/output/optimization-benchmark.lock node tests/assembly-ab-integration.js
```

The integration lock is an exclusive directory with an `owner` file. Do not remove another task's lock. Acquire before browser measurements and release only the owned lock. No comparative performance benchmark is claimed.

Preview: <http://127.0.0.1:8905/assemble/>. The service is intentionally retained for human acceptance, Python PID **80511**. Stop that preview only with `kill 80511` (or Ctrl+C in its task terminal). Its explicit database is the isolated path above. Existing 8876 service PID **52333** was observed unchanged.

The CLI session `opt-ab-ui-1024` was closed; its browser PID 80716 exited. The final managed-browser regression recorded PID 6525 and verified its exit after `browser.close()`. Persistent-profile integration closed its contexts in finally; a process-list check found no task profile or headless-shell process left. No global browser-close or kill command was used. Other tasks' browsers were preserved. Ryugi's local evidence server on 59424 remains available; stop it through the Ryugi launcher for this worktree only.

The retained interaction clip is **19.68 seconds**, **390×844**, VP8 WebM, **1,296,024 bytes**. `ffprobe` verified its stream and a decoded frame was visually inspected. It is copied to the local Verify page beside the approved and actual images; all evidence is local and excluded from Git.

Implementation SHA: **`1896cac3e9a57ccf5202f046c26280f49d8dc85a`**. Earlier implementation commits: UI `c6513d6`, independent progress `8a581d2`, bounded confirmation keys `dc69272`. Delivery documentation and integration harness follow in a separate commit; the draft PR head is the delivery revision.

Storage capacity regression: the original repeated-list key layout hit the controlled 5 MiB store before all 30 schemes could be confirmed. For the same real tutorial and scope, computed UTF-16 key/value footprint for one fully confirmed scheme changed from 766,834 to 46,222 bytes. The test now writes all 30×111×2 fields within its controlled quota. This is deterministic string-storage evidence, not a physical disk measurement or runtime speedup.

## Stable integration points for E / F / G

The owning controller is `frontend/assemble/prototype-v3.mjs`; real step and actor data remain in `hardware-state.mjs`. No parallel controller or duplicated state layer was introduced.

| Interface | Contract |
| --- | --- |
| `createProgressStore(storage, steps, tutorial)` | Existing factory, viewing `key/read/write` kept unchanged. The caller currently supplies `hardware-v3`. |
| `readChecks(scope)` | Returns `{seen: string[], built: string[]}` containing confirmed valid step IDs in tutorial order. Unknown/corrupt records are unconfirmed. |
| `setCheck(scope, stepId, kind, checked)` | `kind` is `seen` or `built`; boolean `checked`; returns whether persistence succeeded. One independent field record per write. |
| `isChecksKey(scope, storageEvent.key)` | Identifies confirmation events. Update badges/checkboxes only; do not seek playback in response. Internal key encoding is private; use these APIs. |
| `progressScope(personalState(storage).draft)` | Existing scheme identity first, then stable draft identity; fallback unchanged. |
| `#sequence-open`, `#sequence-dialog`, `#sequence-close` | Native modal sequence drawer; `#phase-select` and `#step-list` keep existing phase and step wiring. |
| `.instruction-column`, `#instruction-toggle`, `#instruction-content` | Inline teaching panel, accessible collapse button (`aria-expanded`), internal scrolling content. Footer `.player-bar` remains outside the scroll area. |
| `#step-count`, `#step-title`, `#needed-parts`, `#step-description`, `#step-check` | Existing real-data teaching fields; `#progress-count`, `#confirm-seen`, `#confirm-built`, `#progress-status` add independent progress UI. |
| `#view-settings`, `.view-tools` | Expandable observation section; existing `#render-quality`, `#focus-zoom-toggle`, `#reset-view`, `#front-view`, `#back-view` IDs retained for F. No new LOD dependency here. |
| `#playback-settings`, `.playback-controls` | Existing rate/autoplay/sound and scrub controls retain IDs and events. Main previous/replay/pause/start/next/restart controls remain in the fixed footer. |
| `#source-step`, `#reference-toggle`, `#reference-panel`, `#reference-video` | Actual per-chapter source player; reference panel is now a native dialog. Close event hides, pauses video and resets expanded state. |
| `personal:appearance`, `PERSONAL_KEY` storage events, personal page activity | Existing scheme/material synchronization and retained-page lifecycle continue to operate. |
| `window.anklePrototype` | Existing read-only browser diagnostics retained. No extra test-only state-writing API. |

G should translate the new static labels/accessibility names together with data-driven fields; this branch does not create a second locale system. E should use the store methods, never parse private keys or infer explicit completion from the resume index. F should preserve the event IDs, live magnifier and scheduler invalidation when replacing its approved observation controls.
