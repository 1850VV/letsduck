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
| Whole Node suite | 80 tests: 77 passed, 3 skipped by existing environment guards; 0 failed. Targeted modules include max-confirmation compact journal, sparse writes, capacity failure before DB commit, concurrent progress, recovery API compensation, edit guard, migration and save states. |
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
Ruling: capacity checks reject a backup that cannot fit this browser before writing SQLite. A maximum valid backup can exceed browser quota because the inherited progress-store keys include all tutorial step IDs; valid format does not promise available disk/quota.

## Integration and acceptance still pending

A/B fixed UI SHA has not been supplied. `git ls-remote --heads origin codex/optimization-ab-ui` returned no branch during delivery. Do not claim final A/B integration or final E acceptance. The independent implementation currently targets the handed-off 8a581d2 baseline. No official 8876 service, actual personal database, other writer tree, or remote merge/deployment was changed.

The requested draft PR's recommended base (`codex/optimization-ab-ui`) is absent. Push only this branch; record dependency wait rather than inventing/pushing the other writer's base. Retarget/create the stacked draft after the coordinator supplies and verifies the fixed base SHA.

Local review artifact: `.ryugi/artifacts/artboard/e-data-verification/` (local access link is supplied in the chat, not committed).
Screenshots/recording are local, ignored and uncommitted. This separate verification artifact respects the coordinator's exclusive ownership of the original shared artboard/registry.

Final fix-pass regression: interrupted first-save progress migration removes partial destination records, retains source progress and keeps the draft identity; RED→GREEN.
