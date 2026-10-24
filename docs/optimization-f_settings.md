# F — observation settings and approved screw LOD

Scope: approved Mock v1 F from the coordinator handoff. Baseline `8a581d216871d699fba93090700d2802142ca096`; fixed LOD `d1decc2cc458ff278bd2d2bbdca0b8dd0e840b42` merged without conflicts. No manufacturing geometry/threshold changes. `hardwareLod=0` remains the original geometry comparison.

## Implementation and interfaces

`observation-settings.mjs` owns versioned browser preference `dd-observation-v1`: quality current/ultra and lighting neutral/display. Settings never enter schemes or tutorial progress. Unknown versions/malformed data fall back safely. A quality-only stored record retains its corresponding previous illumination; prior application did not persist quality. Blocked browser storage allows in-session controls. External refresh is atomic and never writes intermediate pairs back.

`observation-controller.mjs` exports `observationSettings` and `refreshObservationSettings`. The existing assembly quality entry becomes an observation dialog. Native pressed buttons work with touch and keyboard; Escape closes the modal and focus returns to its trigger. `observation-ui.mjs` binds this dialog and locale updates. The 12-language messages live in their own dictionary, using the existing locale controller.

Neutral copies captured current illumination. Display reuses exact existing ultra environment, exposure and light values. Quality controls existing materials, pixel ratio, shadow budget and contact rendering independently. Printed colors remain unchanged. Default current/neutral retains the prior initial look. No new lighting design or performance benefit is claimed. Preference changes emit `observation:change` to wake the on-demand scheduler; normal inactivity returns it to sleep.

A/B integration hook: retain `#observation-open`, `#observation-dialog`, the hidden `#render-quality` select, and `observation-ui.mjs`. The final A/B placement requires the coordinator's fixed delivered SHA. Do not substitute an uncommitted A/B working tree.

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
| Final A/B entry | Pending coordinator-delivered fixed SHA. This branch verifies the existing entry only; A/B source was not copied or edited. |
| Human implementation acceptance | Pending. Approved Mock is compared with real screenshots/recording in the local verification artboard. No human implementation verdict is inferred from passing tests. |

Independent fresh-context review found the current+display shadow camera far plane did not cover the moved light. Fixed under RED→GREEN by making coverage follow existing lighting positions (display 1100, neutral captured baseline), while resolution/filter/contact remain quality settings. No deferred minor findings. Storage refresh/write-failure issues were also reproduced and fixed under RED→GREEN.

The headless managed Chromium run failed to create a WebGL context (ANGLE SwiftShader `BindToCurrentSequence failed`). The actual successful acceptance run used headed managed Chromium, matching existing project browser scripts. All contexts/browsers closed in finally blocks; owned 8908 server stopped and owned browser processes confirmed absent. Shared performance lock was respected, acquired only for this task's real browser validation, and released immediately afterward. Local evidence and test databases are ignored and are not published.

Local evidence: `.ryugi/sdd/f-settings/` (browser.json, navigation.json, full logs, screenshots, short recording). Review artboard: `.ryugi/artifacts/artboard/optimization-f-settings/`; warnings and pending files empty. Copied approved reference images are kept inside this owned evidence tree because the coordinator's artboard is read-only to this task.

## Integration dependencies and delivery boundaries

- A/B final controls must be integrated only after the coordinator supplies a fixed delivered SHA. At verification time the remote A/B branch was absent; do not create or push that branch from F. The intended draft PR base remains `codex/optimization-ab-ui` once it exists and is verified.
- The coordinator separately authorized idle to repair control-board/servo surface flicker. F does not implement that work or import uncommitted idle changes. Recheck all four settings combinations with its fixed SHA during unified integration, especially approved hardware materials, depth/shadow behavior, transparency and detail rendering.
- No merge, deployment, production 8876 change or real personal database access. No manufacturing asset changes and no inferred GPU time/memory benefit.
