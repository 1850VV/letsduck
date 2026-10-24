# C/D paint and delivery implementation — Mock v1

Scope: approved C/D flow, based on `8a581d216871d699fba93090700d2802142ca096`, on `codex/optimization-cd-ui`. This branch changes the studio only. A/B teaching layout, E save/backup state, F observation settings and G assembly translation remain with their owners.

## Behavior and integration

- C puts real part groups before color choices. Scope comes from actual unique instance IDs, materials and locks. Brush scope follows its real hit targets. Eight groups remain available; the prototype's three example groups and fixed counts are not copied.
- Quick swatches keep real assignments and material compatibility. Full catalog, free colors, selection scopes, locks, brush, eyedropper, focus and side magnification remain available through progressive disclosure. V/B/I/F/P and native button Space/Enter work; typing does not activate tools. Phone sheet and footer leave swatches visible in the default state.
- D keeps real nod/quack/sway and the full advanced action/pose controls. Save uses `saveScheme(false)`. Poster uses the existing `poster.open()` and downloads a real PNG. Printing opens review before download.
- Review counts plates, parts and used materials from the actual plan. Both material-allocation and slicing-review acknowledgements are required for BOM and 3MF. Replacement/reopen/failure invalidates approval. Current design identity is checked again at download; stale asynchronous plan responses are ignored.
- Both editions keep their existing save/API behavior. New non-assembly copy uses the existing locale catalog and preference system in all 12 locales.

E integration: C/D save buttons use `#finish-save` and call the existing save function. D's `[data-save-status]` currently mirrors the existing header state on render; E owns shared pending/success/failure feedback and naming. No second storage is introduced. F can keep using the existing toolbar hooks; this branch changes neither lighting nor quality nor LOD. The frozen A/B head `1e88b87e2c0874889a1d5a142873485681b3b7ad` is merged locally as `9cf0f53b387a22d6127190b46f6185de7d087c8f`; C/D source changes were preserved without conflicts. The stacked PR base remains `codex/optimization-ab-ui`.

## Acceptance evidence

Local evidence is ignored under `output/cd-ui-1024/`; it contains the isolated test database, browser logs, screenshots, videos and generated files. No assets, database, screenshot or manufacturing archive is committed.

| Criterion | Result and evidence |
|---|---|
| Actual selected-part painting, other parts unchanged, undo/redo, retained context | Passed in managed Chromium; renderer material colors compared with saved colors after their existing transition completes |
| V/B/I/F/P, typing guard, native Space activation, canvas selection, brush and eyedropper | Passed real browser actions plus targeted unit tests |
| Desktop 1440 and touch 390 layout | Passed model/panel geometry, complete default swatch visibility above footer, touch part/tool/review controls and no horizontal document overflow; screenshots captured |
| Save and save failure keep edits | Actual isolated SQLite write passed; injected HTTP 503 retained edited colors. E's new shared save-state UI is not integrated here |
| Actions and sound | Real nod/quack/sway started; real nonzero audio buffers started in a running AudioContext. Subjective speaker output/listening quality not verified |
| Actual poster | PNG downloaded, signature verified, 1080×1440 |
| Material replacement and confirmation reset | Passed real illustrative PLA→catalog matching; TPU colors preserved; reopened/failed review exposes no approved stale downloads |
| Actual 3MF and BOM | Downloaded and inspected: 35 instances, 6 plates, 27 `3D/` ZIP members identical to source, BOM UUID/color mapping matches exported report, four TPU 90A soft parts retained, source machine speed preserved |
| 12 existing locales | New delivery surfaces switched through all 12; catalog completeness and no unexpected Chinese fallback checks passed. Human language review not performed |
| Human comparison with approved Mock v1 | Actual screenshots and interaction videos prepared; human implementation visual/interaction verdict pending |

## Checks

- `node --test tests/test_paint_delivery.mjs`: 6/6, after observed RED→GREEN for scope/shortcuts and review identity/reset.
- `node --test tests/*.mjs`: 68 passed, 3 skipped, 0 failed. Three optional compressed-geometry tests skip because the independent asset copy contains only the compatible original geometry.
- `node --test tests/assembly/*.test.mjs`: 177/177 passed.
- `.venv/bin/python -m unittest discover -s tests -v`: 78 run, 60 passed, 18 MySQL checks skipped because `DUCK_TEST_DATABASE_URL` is not configured. Initial borrowed environment failed four imports (missing required test dependencies); an owned environment synced from `requirements-dev.txt` passed.
- `.venv/bin/python scripts/publication_audit.py`: no findings.
- `tests/cd-ui-browser.js`: 54 real browser assertions passed; `tests/cd-scope-browser.js`: 26 scope/lock/locale assertions passed; `tests/cd-review-browser.js`: 4 async/locale/export regressions passed. `tests/cd-ab-integration.js`: 8 frozen-A/B handoff/return assertions passed. Browser logs additionally show the two expected optional-geometry 404 fallbacks and intentionally injected 503 failure paths.
- Observed browser RED→GREEN: grid auto-placement squeezed stage to zero width; Space was intercepted by compare shortcut; brush scope incorrectly named the selected group; phone default swatches were covered by footer. All have browser reproductions and verified fixes.

No performance benefit is claimed. The benchmark lock was respected before browser/heavy checks. No source or manufacturing geometry was modified. The production service and real personal database were not used.

## Delivery status

Implementation committed locally. Independent review found two Important export-dialog state issues; both were fixed with observed RED→GREEN regressions. No Critical or deferred Minor findings. The remote A/B branch was absent at the initial base check and appeared during final handoff. Its fixed head is `1e88b87e2c0874889a1d5a142873485681b3b7ad`; the verified common ancestor with this branch is the required `8a581d216871d699fba93090700d2802142ca096`. The three-dot PR diff contains only C/D files. The coordinator subsequently authorized local merge of that exact A/B SHA for integrated acceptance. It merged without conflicts. No remote PR merge, deployment or live-service switch occurred.

## Final review decisions and remaining boundaries

- The established three-step navigation and complete advanced controls remain. C/D changes hierarchy rather than removing capabilities. The cost is one extra disclosure step for advanced operations.
- The shared design artboard is coordinator-owned. This worktree has its own local verification board with copies of the frozen approved reference and real app evidence. The coordinator can attach those groups to the shared board; no shared board was edited.
- Withdrawing either acknowledgement invalidates the in-flight export result even if it is rechecked before the response. The user must confirm and retry. A successful but outdated response is discarded without downloading.
- A locale change refreshes idle review bodies immediately. During an active export, body refresh waits until completion, then presents fresh unchecked review controls. This preserves active status but temporarily retains its previous body language.
- The reviewer did not run browser/GPU or regenerate assets. Executor browser evidence supplies technical checks and inspected actual downloads. Human visual/touch, listening quality and native-language quality remain separate pending checks.
- A/B implementation remains owned by its original task; C/D now consumes its frozen merge. E, F and G integration remains with their owners. MySQL runtime was not verified without a configured test database. No remote PR merge, deployment or live-service switch is included in this delivery.

Review fixes also prevent checkbox toggles from re-enabling a busy 3MF button, add an independent handler guard, and recheck the original review generation after both thumbnail generation and response/blob reads. No re-review was requested; the skill requires one independent review followed by a tested fix pass.

## Confirmed handoff receipt

- Source and review fixes: `d6d37fedc02b0d897faa296f374f562a7a68034d`. Own branch push succeeded; `git ls-remote` returned that SHA. GitHub API readback confirmed both commit identities use the repository no-reply email. Repository visibility readback was `PRIVATE`; no visibility setting was changed.
- A/B dependency resolved on the last remote recheck: `codex/optimization-ab-ui` exists at `1e88b87e2c0874889a1d5a142873485681b3b7ad`, with expected common baseline and disjoint source scope. Draft PR uses that branch as requested; the confirmed URL is recorded below. No substitute base or another owner's branch was created.
- Browser session `opt-cd-ui-1024` closed. Its daemon and seven descendant processes exited. Isolated 8906 service stopped; the preview server remains only for static visual review.
- Local verification artifact: `.ryugi/artifacts/artboard/verify-cd-ui/`, four pending human groups (C desktop, C phone, D delivery, D materials), approved screenshots paired with actual screenshots and real desktop/touch recordings. Artifact warnings and pending-file lists are empty. This pending verdict is separate from initial Mock v1 design approval.
- Evidence summary: 54 main browser checks + 26 scope/locale checks + 4 review regressions + 8 A/B handoff/return checks; full suites as listed above. The final desktop recording decodes cleanly. Manufacturing exports and PNGs remain local and uncommitted.

Draft PR receipt: [#16](https://github.com/1850VV/letsduck/pull/16), `OPEN`, `isDraft=true`, base `codex/optimization-ab-ui` at `1e88b87e2c0874889a1d5a142873485681b3b7ad`, head `codex/optimization-cd-ui`. Readback reported `MERGEABLE`; attachment to this chat succeeded. CI was still running at that readback. The earlier base dependency is resolved; human implementation visual review remains pending.


## Frozen A/B integration follow-up

The coordinator requested actual integration after the first draft receipt. Exact A/B commit `1e88b87e2c0874889a1d5a142873485681b3b7ad` was merged without conflicts in `9cf0f53b387a22d6127190b46f6185de7d087c8f`. It is an ancestor of this branch; the PR diff against it still contains only C/D work. Node now reports 68 passed and 3 optional-geometry skips; assembly Node remains 177/177; Python remains 60 passed and 18 MySQL skips. Standard-library-only personal tests additionally passed 11/11. Publication audit has no findings.

After a coordinated pause for another task, this task atomically acquired its own browser lock and repeated all 92 browser checks in one serialized batch. Real delivery→A/B navigation exposes the frozen inline teaching UI; actual printed-part material colors match the C/D draft. Returning through home reuses the studio iframe and preserves all colors, undo history and selected-part context. The human implementation verdict remains pending. The self-owned lock was verified and released only after the browser daemon, seven descendants and isolated 8906 service exited. No further GPU or heavy checks were started in the resource task's priority window.

Integrated receipts: `output/cd-ui-1024/` files `browser-integrated.json`, `review-integrated.json`, `scope-integrated.json`, `ab-handoff.json`, `cleanup-integrated.json` and `export-verification-integrated.json`. New teaching UI is consumed, not reimplemented or declared visually accepted by this task.
