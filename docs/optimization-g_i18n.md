# G assembly translation — implementation record

Approved scope: Mock v1 G; complete existing 14 chapters / 111 steps and twelve locales. Work remains in progress.

- Source baseline: `8a581d216871d699fba93090700d2802142ca096`.
- Branch: `codex/optimization-g-i18n`.
- Independent corpus and lazy loader under development. Stable step/chapter/actor IDs; geometry and timing remain in the existing state modules.
- Dependency: waiting for coordinator-selected fixed A/B UI SHA. No A/B integration or final browser acceptance claimed yet.
- Benchmark lock observed at start; no browser/GPU or heavy regression launched while owned by another task.
- Candidate translation authoring uses static instructional copy only. No personal schemes, preferences, model files or session data are sent. Runtime has no translator or remote translation requests.
- Translation coverage and automated structural checks are not native-speaker or physical hardware certification. Detailed evidence will be recorded before delivery.

## Independent module checkpoint

- Twelve static corpora: each covers 14 chapter names, 111 step records (`short/title/text/check/caption`), 271 actor records and explicit assembly UI copy.
- `node --test tests/test_assembly_i18n.mjs`: 5/5 passed. The initial missing-module and missing-corpus runs failed before implementation. RTL isolation and focus-warning adapters were separately exercised RED → GREEN.
- `node scripts/check_assembly_i18n.mjs`: twelve locales have identical key sets, populated required fields, matching placeholders, original numeric tokens and model/size identifiers. Source-drift check passes against the actual state modules. Non-CJK locales contain no Chinese fallback.
- Numeric audit caught Japanese `M2×64` formed by a translated quantity adjoining `M2×6`; corrected to an explicit screw/count phrase. Semantic review caught right-side labels translated as “correct”; corrected the affected Japanese, German, Spanish, Portuguese, Russian, Arabic, Hindi and Korean entries. Operator-left descriptions/checks/captions were reviewed separately in all languages.
- All candidates remain subject to native-language review. This checkpoint does not claim final A/B integration, real-browser acceptance or hardware validation.

## Repository regression checkpoint

- Personal: `python3 -m unittest discover -s tests -p test_personal.py -v` — 11 passed.
- Full Python in isolated Python 3.12 environment installed from pinned requirements: 78 total, 60 passed, 18 skipped (`DUCK_TEST_DATABASE_URL` not configured).
- Node repository suite at the independent-module checkpoint: 69 total, 66 passed, 3 skipped because optional geometry/position packs are not present. The additional all-locale dynamic focus test subsequently passed; a final full suite is still required after UI integration.
- Publication audit: 312 tracked/staged files checked, no findings at checkpoint.
- A pre-integration browser run waited for a language marker absent from the unconnected page. It was stopped; it is not counted as browser acceptance. Its owned Chromium parent/children were verified exited and its benchmark lock released immediately. Test timeouts were then bounded to prevent indefinite waits.
- Service 8909 uses only `output/playwright/opt-g-i18n-1024/test.db`. No real personal library or port 8876 is used.
- Further semantic review added explicit on/off/frame labels, physical-fit terminology and a regression covering all focus action labels across all locales (6 targeted tests now pass).
