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
