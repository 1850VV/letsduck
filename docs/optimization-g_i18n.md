# G — complete assembly languages

Approved scope: Mock v1 G. This task adds the existing twelve languages to the actual 14-chapter / 111-step assembly tutorial. Implementation and automated verification are complete. Human application acceptance and native-language expert review remain pending.

## Baselines and integration

- Initial source: `8a581d216871d699fba93090700d2802142ca096`.
- Coordinator-pinned A/B: `1e88b87e2c0874889a1d5a142873485681b3b7ad`, merged exactly into `codex/optimization-g-i18n` after coordinator handoff. A/B application acceptance is still pending.
- Independent corpus commits: `d0d88c8d554036c8de19d21bf4c2a71f8f1d2281`, `8cc731a3dede3728cf9cc43549b29819286d561d`.
- Only this worktree is modified. No E/F modules, main registry, remote PR merges, port 8876 or real personal database changes are included.

## Language and DOM contracts

`assembly-i18n.mjs` loads exactly one selected static `locales/<locale>.mjs` through an explicit allowlist. Each corpus has stable `steps[stepId]`, `chapters[chapterId]`, `actors[actorId]` records plus assembly-only UI messages. The existing state modules remain the authority for timing, geometry, part membership, motion and progress IDs. Translation adapters create display copies; they do not mutate those modules.

`assembly-language.mjs` consumes the existing shared `getLocale/setLocale/onLocale`, `dd-locale` preference, automatic browser matching and storage-event synchronization. It adds the approved native `#assembly-language` selector, not a separate stored preference. Stale asynchronous loads cannot overwrite a newer selection. A failed switch retains the effective copy, language and direction, with an alert in the requested language. A first-load failure keeps the existing language menu available and hides empty instructional content; reload or another selection can recover. The error notice participates in the viewport layout so the player stays reachable.

Static text has explicit `data-assembly` / `data-assembly-aria-label` / `data-assembly-title` bindings. `data-assembly-options` retains option copy after the existing custom controls upgrade to native selects. Their values and events stay unchanged. No page-wide text replacement runs. The common non-assembly catalogs are unchanged. Brand and user scheme names are preserved.

The A/B controller's existing IDs are retained: sequence drawer, inline teaching content, part chips, playback, independent `confirm-seen/confirm-built`, progress status, source video and focus magnifier. Locale refresh updates display only, preserves selected part and keyboard focus, and does not seek playback, write progress, infer completion, replace the scene or close/reseek a source clip. Save failure text is retained on language changes. These hooks are additive so E/F can continue using their existing DOM/event contracts.

`assembly-language.css` handles text wrapping and logical alignment. On phones, existing header overview/source actions remain available alongside the native locale selector; the repeated header-name is hidden while the assembly heading remains. Body, completion checks and warnings scroll in full. RTL changes interface flow only. Technical identifiers, ranges, timestamps, dimensions, quantities and parameter strings receive Unicode direction isolation; WebGL cameras and coordinates are unchanged.

## Translation provenance and review boundary

Static instructional copy was machine-drafted during authoring. Only source instructional/UI strings were used; no personal schemes, preferences, sessions, credentials or model assets were transmitted. Generated candidates ship as source files. Product runtime has no translator dependency, paid service or remote translation requests.

Technical-reference review corrected operator-left versus robot-left wording, ambiguous right-side/correct labels, physical-fit/fastener terminology, and Japanese size/quantity joining (`M2×64` → `M2×6` screws ×4). A fresh whole-branch review found robot mouth/jaw and body ambiguity, weakened force-fitting prohibitions, invented “press the video/subtitle” actions and an approximate timestamp misread as side evidence. Those source passages were clarified across the eleven translated corpora; English regressions and all-locale token/structure checks pass. The unpainted-state label was also corrected. This is targeted reference correction, not a claim of native-language validation. IDs, the mouth-servo 33/34 ambiguity, pin/polarity uncertainty, geometry-overlap notices and video/BOM fastener discrepancies are retained. Native-language and physical hardware expert review has not been performed. Completeness and layout checks do not certify language or hardware accuracy. Chinese embedded in the source video is outside this task.

## Acceptance evidence

| Criterion | Evidence and outcome |
| --- | --- |
| Twelve locales, 14 chapters, 111 steps | All twelve corpora pass `node scripts/check_assembly_i18n.mjs`: 111 stable step records, 14 chapters, 271 actor records and 405 assembly UI keys each |
| Original model/size/numeric tokens, placeholders and canonical source | Source-drift and token audit passes; non-CJK values contain no unexpected Chinese fallback |
| Geometry, timing, parts and progress semantics | Adapter reference-invariant tests pass; twelve actual language switches preserve step ID, progress, camera, physical confirmation, selected part and stored draft/progress |
| All focus labels and technical caveats | Unit traversal covers the action/status/title combinations; actual head wiring step retains localized pending-fit warnings |
| RTL technical ordering and model direction | Identifier/range/time/count/parameter isolation tests pass; Arabic browser camera matches other languages and the canvas has no CSS mirroring |
| Lazy tutorial loading | Fresh English browser visit requests only `en.mjs`; no remote translator or other external HTTP request is observed |
| Actual A/B integration | Managed Chromium, real retained `personal-assemble` iframe: twelve locale switches on `head-yaw-wire`, plus zh-Hans/en/de/ar at both 390×844 and 1440×1000; all 20 cases pass |
| Long copy and controls | All eight viewport cases have no horizontal overflow, a reachable fixed player and full scroll-to-end; phone scroll ranges are 236–480 px |
| Interactions | Drawer Escape focus return, instruction collapse, source clip staying open without reseek, clip pause on close, last language selection winning, persisted confirmation after refresh, and automatic browser-language selection pass |
| Failed language assets | Two actual 503 scenarios pass: first-load recovery via another language; failed Arabic switch retains English/LTR with Arabic alert; player remains in the viewport |
| User visual/interaction acceptance | Pending. Local Ryugi `artboard/duck-ui-pilot`, page `verify-g`, pairs approved Mock v1 with actual screenshots at identical sizes. Verify groups are not marked passed by the agent |
| Native-language / physical hardware review | Not executed. Embedded Chinese source-video subtitles are outside G |

## Final checks

- Targeted language regressions: 14 passed (included in the expanded Node total).
- Personal suite: 11 passed.
- Full Python: 78 total, 60 passed, 18 MySQL cases skipped because `DUCK_TEST_DATABASE_URL` is not configured.
- Expanded Node (`node --test tests/*.mjs tests/assembly/*.mjs`): 256 total, 253 passed, 3 optional geometry/position-pack cases skipped.
- Publication audit: 318 files checked, no findings. `git diff --check` passes.
- Browser reports: `output/playwright/opt-g-i18n-1024/report.json` and `errors-report.json`; both report owned browser/process cleanup. Screenshots and a 15.96-second silent VP8 recording are on the local artboard. Its manifest has no warnings or pending files. These local evidence files are intentionally outside the Git diff.

Commands used against the assigned temporary database service:

```sh
node scripts/check_assembly_i18n.mjs
node --test tests/test_assembly_i18n.mjs
python3 -m unittest discover -s tests -p test_personal.py -v
.venv/bin/python -m unittest discover -s tests -v
node --test tests/*.mjs tests/assembly/*.mjs
.venv/bin/python scripts/publication_audit.py
DUCK_I18N_URL=http://127.0.0.1:8909 node tests/assembly-i18n-browser.js
DUCK_I18N_URL=http://127.0.0.1:8909 node tests/assembly-i18n-errors.js
```

Heavy suites and browser runs acquired the shared benchmark lock serially. The service uses only `output/playwright/opt-g-i18n-1024/test.db`. Port 8876 and real personal data were not used.

## Review fixes and remaining boundary

The chapter picker regression was reproduced in the actual drawer (expected chapter `8`, actual empty). Display localization creates a chapter copy, so identity lookup was replaced by stable chapter-ID lookup. The twelve-language browser invariant now checks that value. First-load rejection and wrong effective-language metadata were fixed with a small recoverable controller. A real error-state screenshot also exposed a clipped player; a failing viewport assertion now passes with the error-only flex layout.

Early browser harness attempts targeted the outer personal shell and used a headless configuration that failed to create WebGL here. Those attempts are failures, not acceptance evidence. The final harness follows the repository's managed headed Chromium setup and targets the real iframe. It waits for the shell's existing paint-page warmup: initial draft creation intentionally changes the progress scope and must finish before measuring locale preservation. The source-clip close check waits for the native dialog close event before asserting paused playback.

Known coordinator follow-up: the existing selected-part card and focus magnifier overlap at their top-right positions. The comparison screenshots retain that combined state. This branch does not change their placement; no visual pass is claimed for that overlap. Full native-language fluency and the existing physical geometry/topology uncertainties also remain unverified.

Delivery is a draft PR from `codex/optimization-g-i18n` into `codex/optimization-ab-ui`, based on the pinned A/B SHA above. No merge or deployment is included.
