# E implementation ledger

Approved Mock v1 E; baseline 8a581d2; branch codex/optimization-e-data. Only this worktree is writable.

Tasks: (1) validated versioned backup and transactional SQLite import/recovery; (2) browser progress adapter and recovery journal; (3) home/save integration and 12-language text; (4) full verification, reviewer, draft PR.

Ruling: store normalized backup progress separately from raw browser keys and use the existing progress-store API on restore. This prevents unrelated localStorage data from entering backups; tutorial mismatch stops import.

Browser/GPU checks wait while the shared benchmark lock exists. No performance claims.

Task 1/2: backup roundtrip, keep-both, overwrite, durable recovery and stale SQLite preview passed (3 Python tests); browser adapter/controller and save status passed (7 Node tests). RED evidence: missing store methods/modules, concurrent-draft recovery rejected before fix, missing copyProgress export. Personal edition regression: 11/11 passed.
Ruling: an interrupted import keeps an explicit recovery journal and blocks a second import/export until recovery; an unrelated browser edit stops rollback of changed keys. This trades automatic completion for recoverability without overwriting another window.
Ruling: exact tutorial step IDs are validated against a small generated metadata file; it must be regenerated if tutorial identity/order changes. This avoids loading the 3D lesson on the home page.

## Delivered independent E scope

- Personal-only `/api/backup/export|preview|import|restore|recovery`. Version 1 JSON, creation app/version/time, SHA-256 checksum over canonical JSON, 2 MB limit, strict design/ID/tutorial/relationship validation. No assets, credentials or sessions.
- SQLite import is one transaction. Preview revision rejects intervening named changes. Keep-both remaps IDs and names; overwrite shows original/incoming designs and retains durable SQLite recovery snapshots. Ambiguous duplicate existing names reject overwrite safely; keep-both remains available.
- Browser adapter uses the existing progress-store interfaces and exact hardware-v3 step IDs. Seen/built remain independent. Sparse writes, shared-prefix journal encoding, quota reservation before SQLite commit, explicit recovery, and downloadable pre-import recovery copy protect storage boundaries.
- Pending operations retain a write-ahead journal. Recovery compensates browser rollback on API error; concurrent browser edits stop unsafe restoration. SQLite changes after import reject rollback; download the recovery copy and import with keep-both to preserve both histories. No silent conflict overwrite.
- Home displays actual resume step and separate counts, browser draft and SQLite save entry. Named save reuses studio menu, exposes `window.requestSchemeSave()` and `duck:save-status` (`saving/saved/failed`). First naming copies progress before SQLite write; metadata/storage failure preserves original draft identity and permits retry.
- Edit guard and per-scheme optimistic API revisions prevent stale retained windows/in-flight saves overwriting imported data. Delete undo uses a fresh expected revision.
- New E copy covers existing 12 locales through the shared i18n mechanism. No assembly tutorial prose changed.

## Verification evidence

| Criterion | Result / evidence |
| --- | --- |
| Two independent databases, colors/counts, API roundtrip, keep both, overwrite, durable recovery, invalid IDs/relations and injected SQLite transaction failure | 6 targeted Python tests passed; `output/playwright/e-data/python-tests-final.log` full suite below |
| Whole Python suite | 84 tests, OK, 18 skipped because no configured MySQL test database. Initial shared venv run had 4 import errors for missing httpx2; rerun in this worktree's own locked-dependency venv passed. |
| Top-level Node checks (initial report; not complete assembly coverage) | 80 tests: 77 passed, 3 skipped by existing environment guards; 0 failed. Targeted modules include max-confirmation compact journal, sparse writes, capacity failure before DB commit, concurrent progress, recovery API compensation, edit guard, migration and save states. |
| Publication audit | 311 files checked, zero findings. No binaries or test databases staged. |
| Actual UI backup export/import | `browser-check.log`: real download, same-name keep-both and review-before-overwrite, scheme ID remap, resume + seen/built preserved, truncated and newer-version files rejected. Actual 35-part design used. |
| Actual save + localization | `save-check.log`: home opens real save menu, injected PUT 500 retains edit, retry writes SQLite, all 12 locale switches and 390px horizontal-overflow checks pass. |
| First save migration and windows | `migration-check.log`: metadata 503 creates no named scheme and keeps draft identity; retry retains resume/physical checks; second editor cannot overwrite newer browser draft; actual assembly page resumes at step 8. |
| Cross-boundary failure and recovery | `recovery-check.log`: actual SQLite import followed by injected browser QuotaExceededError retains journal; recovery download works; explicit recovery restores exact browser draft and original SQLite count. |
| Desktop/mobile comparison and interaction | Actual PNGs and `backup-flow.webm` (360 KB) under `output/playwright/e-data/`; local verification artboard below. Technical evidence only; user visual/interaction verdict remains pending. |
| Console limitations | Expected injected 500/503 and future-version 422; baseline optional packed geometry requests return 404 and use existing geometry fallback. No manufacturing data changed. |
| Cleanup | Managed Chromium opt-e-data-1024 closed; daemon PID 99675 absent; test server stopped, 8907 no listener. E verification lock released after browser work, before docs/commit. Other browser PID 94539 left untouched. |

## Review and rulings

Fresh read-only reviewer identified five risks: recovery compensation, excessive false progress records/journal size, progress modified after preview, migration failure changing identity, and stale home draft card. All received a fix pass with regression checks; capacity reservation and compact journal additionally cover maximum-confirmation inputs. Per-scheme optimistic revision also closes in-flight stale-save writes.

Ruling: preserve the existing home navigation and add approved E flows below it. The approved E mock's toolbar/demo/error simulation controls do not enter the product. User acceptance must assess the actual combined home.
Ruling: recovery refuses to discard intervening SQLite/browser edits. A downloadable pre-import recovery backup provides a keep-both recovery route when automatic rollback cannot safely complete. Cost: a conflict may require an explicit import rather than one-click rollback.
Ruling: keep all recovery snapshots in the local database; no automatic cleanup that could erase the last recoverable copy. Cost: repeated imports add local database storage.
Ruling: capacity checks reject a backup that cannot fit this browser before writing SQLite. A maximum valid backup can exceed browser quota because browser capacity is finite; valid format does not promise available disk/quota. The frozen A/B integration below replaces the baseline’s repeated confirmation keys with bounded keys.

## Initial handoff status (superseded by frozen A/B integration below)

A/B fixed UI SHA has not been supplied. `git ls-remote --heads origin codex/optimization-ab-ui` returned no branch during delivery. Do not claim final A/B integration or final E acceptance. The independent implementation currently targets the handed-off 8a581d2 baseline. No official 8876 service, actual personal database, other writer tree, or remote merge/deployment was changed.

The requested draft PR's recommended base (`codex/optimization-ab-ui`) is absent. Push only this branch; record dependency wait rather than inventing/pushing the other writer's base. Retarget/create the stacked draft after the coordinator supplies and verifies the fixed base SHA.

Local review artifact: `.ryugi/artifacts/artboard/e-data-verification/` (local access link is supplied in the chat, not committed).
Screenshots/recording are local, ignored and uncommitted. This separate verification artifact respects the coordinator's exclusive ownership of the original shared artboard/registry.

Final fix-pass regression: interrupted first-save progress migration removes partial destination records, retains source progress and keeps the draft identity; RED→GREEN.

## Verification correction: assembly Node suite included

The original 80-test Node result covered only `tests/*.mjs`. Calling that the whole Node suite was incomplete; it did not establish the required assembly regression result.

Ran `node --test tests/*.mjs tests/assembly/*.mjs` on the delivered E branch: **257 tests, 254 passed, 3 skipped, 0 failed**, exit code 0. No production change was required. The original combined output is retained locally at `output/playwright/e-data/node-tests-with-assembly.log` (SHA-256 `b8783c78fb50f0dcb48806a38165b0abba41dcd7c0f6726fad10f2829b23f4e9`). The three skips remain the existing top-level environment guards; all 177 additional assembly tests passed. No browser or test service was started for this follow-up.

## Frozen A/B integration

Coordinator supplied and remotely verified `1e88b87e2c0874889a1d5a142873485681b3b7ad` on `codex/optimization-ab-ui`. Merged that exact commit into this branch without resetting E changes (`14ccbd8`). The A/B confirmation-store factory and public interfaces are unchanged; E continues using those APIs rather than decoding private confirmation keys. The frozen A/B changes shorten confirmation keys, so the old E test's 4× compression-ratio assumption no longer applies. Its first combined run failed only that assertion. The corrected test checks lossless journal decoding, reduced encoded size, and a concrete 5 MiB peak string-storage budget using all 30 schemes × 111 steps × both confirmation types and maximum-length IDs. This is controlled quota evidence, not a physical-disk or GPU performance claim.

Non-GPU combined regression after integration: `node --test tests/*.mjs tests/assembly/*.mjs` → **258 tests, 255 passed, 3 skipped, 0 failed**; `.venv/bin/python -m unittest discover -s tests -v` → **84 tests, OK, 18 skipped**. Original outputs: `output/playwright/e-data/node-tests-ab-integration.log` and `python-tests-ab-integration.log`.

The first new combined browser harness clicked the hidden Next button at the overview step; the real A/B control is Start. The run stopped before backup operations, closed its managed browser/service, and released the lock. The harness now follows Start; the failed run remains in `browser-ab-integration-failed-start.log` and `output/playwright/e-data-ab/failed-start-result.json`. No product behavior was changed to accommodate that harness error.

Browser coordination correction: one retry was accidentally launched after an external shell lock-acquisition failure. It was immediately terminated, its own browser/service PIDs exited, and its output is discarded (`browser-ab-integration-discarded-lock.log`). No timing or acceptance claim uses that run. The persistent harness now acquires the lock inside the same process before starting either the service or browser, refuses an occupied lock, and closes/relinquishes only its own resources in `finally`.


## Final A/B + E combined result

The managed-browser two-database regression is **passed**: eight acceptance groups, no page-script exceptions, no cleanup errors. `tests/assembly-e-integration.js` creates only synthetic `source.db` and `target.db` under `output/playwright/e-data-ab/`, binds only port 8907 with no fallback, acquires the shared lock before starting any service/browser, and closes both contexts/browser and its service in `finally` before releasing only its own lock.

| Combined acceptance | Actual result |
| --- | --- |
| Real A/B controls and three identities | Watched and physical confirmations stay independent for scheme A, scheme B, and the current unsaved draft. Start/advance never infer physical completion. |
| Complete export and empty-library import | The real downloaded file restores both SQLite schemes, all 35 colors per scheme, voice salt, the current draft, and every viewing/seen/built record. New named IDs and the draft ID map to the related progress together. |
| Continue assembly after restore | The actual Home link resumes draft step 3. Switching to restored scheme A resumes step 2; scheme B resumes step 1. A cross-window confirmation update changes the checkbox without seeking playback. |
| Stale real editor | An already-open studio cannot overwrite the imported browser draft or send a stale SQLite PUT. |
| Both same-name choices | Keep-both produces four distinct schemes; reviewing differences before overwrite retains the correct four IDs/copies. |
| Cross-boundary failure and recovery | An injected browser QuotaExceededError after a real SQLite commit retains the journal; the downloaded recovery copy passes real API validation. Recovery restores the complete original SQLite rows, all browser draft fields and all progress; the completed journal is removed. |
| Small/desktop evidence | Actual 1440/390 screenshots for Home and the A/B teaching page are in the local verification artboard. |
| Cleanup | Both isolated 8907 services and every owned managed-browser context/process exited; the script reports `lockReleased: true`. Other tasks' locks/previews and 8876 were preserved. |

The integration exposed a concrete false conflict: the retained studio adds empty editor preferences/default fields after preview. The original check compared the entire raw personal-state string and misclassified that initialization as an edit. E now compares a normalized draft plus actual progress, preserving unrelated metadata. A reproducing unit test was observed failing with `backup.stale` before the fix and now passes; a separate actual-draft-edit regression still rejects import before SQLite writes. Conflict text now identifies changed data rather than describing a valid file as damaged.

Other failed harness checks were corrected without changing product behavior: the fixture now includes the studio's standard null provenance, and recovery compares complete JSON field/value content rather than object-property serialization order. The final recovery additionally compares every progress record. Earlier raw runs remain in `browser-ab-integration-failed-fixture.log`, `browser-ab-integration-failed-metadata.log`, and `browser-ab-integration-failed-json-order.log`; none is presented as a passing run.

Final checks after the runtime fix:
- `node --test tests/*.mjs tests/assembly/*.mjs`: **260 tests, 257 passed, 3 optional-asset environment skips, 0 failures** (`output/playwright/e-data/node-tests-ab-final.log`).
- `.venv/bin/python -m unittest discover -s tests -v`: **84 tests, 18 MySQL-environment skips, 0 failures** (`python-tests-ab-final.log`). Native MySQL acceptance remains unverified locally.
- `python3 -I -m unittest discover -s tests -p test_personal_backup.py -v` with an empty `DUCK_ASSETS`: **6 passed**, no third-party packages/assets (`stdlib-backup-asset-free.log`).
- Existing CI now runs the stdlib backup tests and E Node contracts explicitly; the existing lists previously omitted them. The real-model browser check remains local because it needs licensed assets.

Original final browser output: `output/playwright/e-data/browser-ab-integration.log`; structured result: `output/playwright/e-data-ab/result.json`. The actual VP9 interaction recording is 960×600, 58.04 seconds, 4,270,392 bytes; ffprobe and a decoded frame were inspected. All local artifacts together are below the 20 MB artboard bound; warnings/pending file entries are empty. Actual human visual/interaction acceptance remains pending; no final user verdict is inferred from technical checks.

Reproduce the browser regression after making Playwright available to Node (or set `DUCK_PLAYWRIGHT_MODULE` to the managed runtime's module path):

```sh
DUCK_BENCHMARK_LOCK=/path/to/context/output/optimization-benchmark.lock node tests/assembly-e-integration.js
```

This uses the task-owned scratch databases and will replace only those synthetic fixtures. It never uses the normal personal database path.

Final raw-log SHA-256:

- `browser-ab-integration.log`: `955ed716702e3ddc3a660072bc171de465edb201ebf207d0bcd402a769e5e44a`
- `node-tests-ab-final.log`: `32421c601267cf29b0cb9dae83702e892cad7fe7f65829f6fd5cd39adfa31adb`
- `python-tests-ab-final.log`: `d68f0d5ec42fa15fda6ea6d10aed45eee2fe371cf66377a10c4cb66a0530598a`
- `stdlib-backup-asset-free.log`: `2ae77c6d7206faac7afeeb44c42310f9199dd04dbe36d982bd553afe7749632f`

Final publication boundary: **316 tracked/staged files, zero findings**; `git diff --cached --check` passed. No assets, screenshots, videos, access keys, browser storage or databases are staged.

## Draft PR receipt

Draft PR [#18](https://github.com/1850VV/letsduck/pull/18) was created against `codex/optimization-ab-ui` and attached to this chat. The base was remotely verified as `1e88b87e2c0874889a1d5a142873485681b3b7ad`; the implementation/test head is `d749a9d4a1d7a4e12f3307a263f9466f2aa4508f`. This final documentation receipt follows as a separate commit. The PR is draft/open; it has not been merged or deployed. Human actual-UI acceptance and local native-MySQL execution remain pending.
