# letsduck development

This repository includes application source and the project resources in `assets/`. Private deployment data, profiles and credentials stay outside it. Use README.md as the current entry point. Historical paths are redacted placeholders.

- Preserve user changes. Stage owned paths explicitly, never broad-add an unreviewed folder.
- Maintenance and releases focus only on Windows x64 EXE and Apple silicon Mac arm64 DMG installers. Server-specific development, adaptation, updates and deployment are paused until the owner explicitly resumes them. Maintain shared code needed by the client; retain existing server code and regression checks without treating them as a server support commitment. This scope prevents client work from expanding into server delivery.
- UI changes require a reviewable prototype and approval of its version/scope before implementation. Do not repeat approval for an already accepted scope.
- After UI changes, exercise a basic user journey through the real entry and container, including homepage iframes. Test native dropdown opening, mouse/keyboard selection, cancel/reopen and focus. Programmatic `selectOption()` or value changes do not prove those interactions. Run relevant browser checks from README and state any coverage gaps.
- Run README checks appropriate to each change. Report technical checks separately from human visual/interaction acceptance.
- Required resources are included in `assets/` and retain their source notices. Never force-add ignored exports, alternate asset bundles, screenshots, archives or browser files. Original code licensing does not relicense third-party assets.
- README screenshots and GIFs live only in `docs/media/` (owner-approved 2026-10-23; they show the separately licensed model, not MIT). Keep each file at most 3 MB, use sample data only, and keep the publication audit passing.
- Use native git and authenticated gh for repository operations. Confirm external writes and read back publication visibility and commit identity.
- Use managed Chromium in isolated test sessions; close task-owned sessions and verify process cleanup.
- Keep author contact details private where appropriate; use a verified GitHub no-reply identity for public commits.

## Keep it simple (added 2026-10-25 after the Codex optimization round was rolled back)

- The personal edition is one person on one computer. Do not add machinery a single local user never needs: hidden prewarmed iframes, extra caches or integrity manifests, write-ahead journals, locks, conflict dialogs, per-request hashing.
- A change must earn its place with a user-visible win (first frame, battery, fewer clicks). Measure it, say the number in the PR, and prefer deleting code to adding it.
- Never add steps, checkboxes or confirmations to a user flow. Printing ends at exporting the recoloured 3MF + BOM; no print-workflow features.
- Fewer words on screen. Do not put development version labels or internal notes into the product UI.
- New languages ship only after a native speaker reviews them; Chinese stays the built-in source and fallback.
- One focused branch and PR per change, based on `main`. No stacked draft PRs, no integration branches.
- Verification goes in the PR description. Do not commit evidence ledgers, review indexes, acceptance logs or per-task docs to `docs/`.
