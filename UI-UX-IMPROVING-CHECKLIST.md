# UI/UX Improving — start snapshot, 2026-11-17

Open at start: H-422, H-427, H-428, H-429, H-431, H-432, H-433, H-434 (all Todo).
Preserve pre-existing H-424 changes and src/styles/tokens.css, plus concurrent wizard button variants.

Checked boxes mean implementation complete; visual verification remains blocked as recorded below.

Final checks: yarn typecheck passed; focused lint passed; existing minute precision validation test passed. Browser UI checks blocked: connected Playwright requires approval under policy never; local Chromium previously fails MachPortRendezvous permission denied (1100). No backend edits.

- [x] H-422: identity images use cover in shared tile, directory/profile/header and studio-link rows. Solo avatars already cover. Visual verification blocked (Playwright requires approval; session policy never).
- [x] H-427: wizard initial time 18:30; editable picker and payload formatting preserved. Code path checked; browser smoke blocked by environment.
- [x] H-428: full-width semantic template card button; static without callback; switch regression selector updated. Lint passed; mobile/desktop visual and keyboard checks blocked by browser access.
- [x] H-429: creation-only time pills and compact wrapping time input; shared edit behavior retained. Extended time regression for default/preset/custom selection; lint passed, browser execution blocked.
- [x] H-431: shared separators after template, time/room and instructor; solo has one rule before capacity. Creation only. Layout reviewed in source; visual check blocked.
- [x] H-432: gap-x-3 for the two creation segmented groups; shared defaults unchanged. Lint passed; narrow visual check blocked.
- [x] H-433: muted creation labels/local headings; preview date text-base and time/overflow text-sm. Shared room label opt-in; colors retained. Lint passed; preview visual check blocked.
- [x] H-434: pinned cancel button content width; save fills remaining space. Inline row unchanged. Focused lint passed; mobile footer visual check blocked.

## Continuation audit

- Rechecked the current worktree; unrelated changes remain intact.
- H-431: creation uses a flex column with balanced separator margins to retain the existing section spacing.
- H-432: creation end-date buttons can wrap long labels within their three-column cells.
- H-429: added mobile regressions at 320px for both Raz and Co tydzień: preset → preview → back → custom time → preview/create, asserting actual payload time values.
- Fresh checks: yarn typecheck passed; focused lint passed; git diff --check passed; existing minute validation test passed.
- Attempted the two new mobile browser cases. Both stopped before page creation at Chromium launch: MachPortRendezvous Permission denied (1100). Log: /tmp/ui-ux-browser-check.log.
- Connected browser access was rechecked and still reports: MCP tool call requires approval, but approval policy is never.
- Remaining acceptance work: rendered mobile/desktop checks for H-422/H-428, studio/solo form separators, narrow selector wrapping, preview typography (>4 occurrences), pinned create/edit footers, plus browser time/picker interaction and request assertions. These are unverified, not passed.

Goal status: blocked after three consecutive goal turns encountered the same browser-access restriction. All independent implementation and static checks are finished. Resume acceptance checks when browser execution is available; do not treat the milestone as fully verified.
