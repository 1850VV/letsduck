# F — observation settings and approved screw LOD

Scope: approved Mock v1 F from the coordinator handoff. Baseline `8a581d216871d699fba93090700d2802142ca096`; fixed LOD `d1decc2cc458ff278bd2d2bbdca0b8dd0e840b42` merged without conflicts. No manufacturing geometry/threshold changes. `hardwareLod=0` remains the original geometry comparison.

## Implementation and interfaces

`observation-settings.mjs` owns versioned browser preference `dd-observation-v1`: quality current/ultra and lighting neutral/display. Settings never enter schemes or tutorial progress. Unknown versions/malformed data fall back safely. A quality-only stored record retains its corresponding previous illumination; prior application did not persist quality. Blocked browser storage allows in-session controls. External refresh is atomic and never writes intermediate pairs back.

`observation-controller.mjs` exports `observationSettings` and `refreshObservationSettings`. The existing assembly quality entry becomes an observation dialog. Native pressed buttons work with touch and keyboard; Escape closes the modal and focus returns to its trigger. `observation-ui.mjs` binds this dialog and locale updates. The 12-language messages live in their own dictionary, using the existing locale controller.

Neutral copies captured current illumination. Display reuses exact existing ultra environment, exposure and light values. Quality controls existing materials, pixel ratio, shadow budget and contact rendering independently. Printed colors remain unchanged. Default current/neutral retains the prior initial look. No new lighting design or performance benefit is claimed. Preference changes emit `observation:change` to wake the on-demand scheduler; normal inactivity returns it to sleep.

A/B integration hook: retain `#observation-open`, `#observation-dialog`, the hidden `#render-quality` select, and `observation-ui.mjs`. The final entry is integrated into the delivered A/B `#view-settings` area. The prior A/B quality control is replaced by this entry; view/focus controls and the sequence drawer retain their A/B placement.

## Acceptance evidence

| Criterion | Result and evidence |
| --- | --- |
| Fixed approved LOD; source geometry/detail/transparent/exception fallback | Merged fixed SHA without conflicts. Existing hardware LOD unit tests pass. Actual `hardwareLod=0` reports disabled. No threshold changes. |
| Independent four combinations | Actual 1440px page exercised all four at the same overview step/camera/white scheme. Exposure and hemisphere intensity follow lighting; shadow resolution follows quality. Four labeled screenshots retained locally. |
| Persistent settings; default/older records | Unit tests cover default current/neutral, quality-only migration, malformed/new versions and storage failure. Actual refresh restores ultra/display. External refresh atomically applies a pair without writes. |
| Page/window synchronization and demand rendering | Actual retained shell switches to home and back with restored settings. Second window synchronizes a pair. Instrumented real render function: each static combination draws zero frames over a 350ms observation after settling. Hidden page preference sync draws zero frames; return wakes drawing. These are functional scheduling checks, not a performance benchmark. |
| Keyboard, touch, small/desktop | Actual 1440×1000 and 390×844; Enter changes the focused setting, Escape closes and returns focus. Touch tap changes lighting. The initial small-screen entry overlap was captured and corrected before final screenshots. |
| Material explanation and locales | Separate catalog/illustrative explanation in all 12 locales. Browser cycles every locale; German and Arabic 390px evidence retained. No claim of native-speaker review or physical color matching. |
| Source checks | Personal Python 11/11. Complete Python 78 tests: 60 pass, 18 skipped (MySQL database not configured). Complete Node with assembly tests: 247 pass, 3 skipped. Publication audit: 298 files, no findings. |
| Final A/B entry | Merged fixed `1e88b87e2c0874889a1d5a142873485681b3b7ad`; conflict resolution retains A/B heading/sequence drawer and places F inside its real observation area. Combined browser validation passed as recorded below. |
| Human implementation acceptance | Pending. Approved Mock is compared with real screenshots/recording in the local verification artboard. No human implementation verdict is inferred from passing tests. |

Independent fresh-context review found the current+display shadow camera far plane did not cover the moved light. Fixed under RED→GREEN by making coverage follow existing lighting positions (display 1100, neutral captured baseline), while resolution/filter/contact remain quality settings. No deferred minor findings. Storage refresh/write-failure issues were also reproduced and fixed under RED→GREEN.

The headless managed Chromium run failed to create a WebGL context (ANGLE SwiftShader `BindToCurrentSequence failed`). The actual successful acceptance run used headed managed Chromium, matching existing project browser scripts. All contexts/browsers closed in finally blocks; owned 8908 server stopped and owned browser processes confirmed absent. Shared performance lock was respected, acquired only for this task's real browser validation, and released immediately afterward. Local evidence and test databases are ignored and are not published.

Local evidence: `.ryugi/sdd/f-settings/` (browser.json, navigation.json, full logs, screenshots, short recording). Review artboard: `.ryugi/artifacts/artboard/optimization-f-settings/`; warnings and pending files empty. Copied approved reference images are kept inside this owned evidence tree because the coordinator's artboard is read-only to this task.

## Integration dependencies and delivery boundaries

- A/B dependency resolved: fixed `1e88b87e2c0874889a1d5a142873485681b3b7ad` merged on F. Draft PR base: `codex/optimization-ab-ui`. Only the owned F branch is pushed.
- User-accepted depth repair `27b0c00a1b8a1e9f704a6a06dcacee379b6f57c7` (source `9b24e8b`) merged without conflicts. This updates both main and detail near planes; F does not duplicate the repair or change its values. Approved LOD remains enabled and unchanged.
- No remote PR merge, deployment, production 8876 change or real personal database access. No manufacturing asset changes and no inferred GPU time/memory benefit.

## Fixed dependency integration verification

Combined source: fixed A/B + user-accepted camera depth repair + approved default LOD. Non-GPU checks: Node 253 tests (250 pass, 3 skip); Python 78 tests (60 pass, 18 MySQL skips). The integrated browser regression is `tests/observation-integration-browser.js`, using a task-owned managed Chromium profile, port 8908 and an explicit synthetic SQLite database. It serializes GPU use through `DUCK_BENCHMARK_LOCK`, closes its owned context in finally, and releases only its own lock.

The browser initially refused to start because E had acquired the shared lock (EEXIST); no browser was launched in that attempt. The regression was then queued behind the lock without removing it. Final combined real-page results are recorded below. Human implementation visual acceptance remains pending.

Independent integration review found no new Critical/Important issues. Its suggested missing summary-click coverage was added: the final browser script opens the actual A/B summary with a user click before opening F. No deferred minor findings.

An early combined batch passed the entry controls, then the test attempted magnification at step 69 progress 0.50. The actual fine-operation cue starts at 0.55, so the disabled control was correct. The test fixture now uses 0.72; application logic was not changed. The failed batch closed its context and released its lock. Its queued retry was cancelled before browser launch to give the coordinator-prioritized resource measurement a clear window.

Final combined run **passed**, using normal home-to-shell navigation and explicitly asserting that the retained guide was active. Directly reloading the iframe in an intermediate test had bypassed the parent activation lifecycle; its apparent idle/render results were invalid and are excluded. Another intermediate check observed the old ready flag during navigation. These harness failures are retained as summaries in `output/playwright/optimization-f-settings/failure-history.json`, not counted as product passes.

- Four overview combinations: quality alone controls pixel ratio (1 / 1.5), shadow map (2048 / 4096) and existing material/contact behavior; lighting alone selects the captured neutral versus existing studio environment/exposure. Approved LOD stays enabled. Screenshots use the same overview step, view and white scheme.
- Four close/detail combinations: real step 69 at 72%, zoomed main view and separate connector magnifier. Both actual camera near planes match 1% of their viewing distance (with existing 0.1 minimum); main ~1.05028 mm, detail ~0.15728 mm in this fixture. Both camera images retained. Each combination returns to zero additional render calls after settling. This verifies preserved depth behavior, not universal absence of all possible surface artifacts.
- Actual A/B summary click, modal open/close and Escape focus return pass. Refresh restores Ultra/Display. Hidden-page preference update draws zero frames; returning through the retained shell applies Current/Neutral. 390px dialog bounds, touch setting change and Enter on the focused quality button pass. Page script errors: zero.
- Combined screenshots, the 4.2 MB interaction recording and machine-readable `integration.json` are in ignored `output/playwright/optimization-f-settings/`. Final evidence is on the artboard’s A/B integrated Verify page. Earlier pre-A/B groups remain as historical evidence, not active acceptance groups. Artboard total ~12.6 MB; warnings/pending files empty after update. Human implementation visual verdict remains pending.
- Final Node: 250 passed / 3 skipped. Full Python on the integrated source: 60 passed / 18 MySQL skips. Publication audit after staging the integrated source: 312 files, no findings. All owned contexts/browsers closed in finally; no F browser process or 8908 listener remains. F’s lock was released before documentation/PR updates.

Draft PR #17 targets `codex/optimization-ab-ui`; no remote merge or deployment performed.
