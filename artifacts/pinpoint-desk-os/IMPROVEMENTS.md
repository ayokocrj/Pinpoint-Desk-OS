# Pinpoint Desk OS: shell and workflow improvements

Foundation kept: engine, synthetic dataset, eight screens and their actions, Clerk refusals, self-check, sealed log, tour, `#s0` to `#s7`, `#tour`, `#paste`, `?ask=`, every label and figure.

## Structure
- `index.html`: markup, embedded fonts, embedded synthetic dataset and expected read-out.
- `public/desk/base.css`: the original styles, extracted unchanged except the 1300 px rule (the rail no longer collapses to bare numbers).
- `public/desk/shell.css`: new shell, finder, journey, scenarios and status styles.
- `public/desk/engine.js`: the engine, extracted unchanged.
- `public/desk/app.js`: the application, extracted unchanged apart from one line exposing read-only references as `window.PP_APP`.
- `public/desk/enhance.js`: new module. It drives existing screens by dispatching the clicks the app already handles, so rules, logging and refusals stay in one place.

## Improvements
1. Shell: named destinations with icons and one-line purposes, grouped by role; screen numbers kept as a quiet index. Find, New conversation and Scenarios at the top of the rail; layout switch (Split, Desk only, Clerk only); phone toolbar for Find, Scenarios and Status.
2. Record finder (`/` or Ctrl/Cmd K): search by code, firm, practice, city; filters for side, city, practice and five flags; three sorts; keyboard navigation; empty state with reset. Index is built from `E.recordFacts(rid, MY_DESK)`: records private to other desks are excluded and only counted (R-6). A full private code shows "Private to another desk"; opening it uses the existing drawer, which logs the block. Searches are not stored or logged.
3. Mandate journey on screen 1: Received, Evidence read, Ranked, Ambiguity, Named approval, computed live from `listFor`, `S.qback`, `S.approved`, `S.dismissed`, `S.agreed`; each step scrolls to and flashes its part of the screen.
4. Scenario launcher: follow-ups, M-0457 matching, duplicate review, CV-05, test bench; each opens the real screen and asks Clerk the existing sample question.
5. Connection status: synthetic data, in-browser engine, simulated registers, Microsoft 365 and Outlook not connected, Microdec not connected, no model provider, no send action, pasted text not stored.

## Checks run
- `node --check` on all four scripts: pass.
- `vite build`: pass.
- Engine figures recomputed in Node from the extracted files: M-0457 5,000 / 4,800 / 629 / 207 fit / 33 blocked / 2 private; M-0452 359 / 36 / 6; M-0453 343 / 49 / 5.
- No en or em dash in new files. No network calls, storage, or new actions added.
- Not run: browser tests (per instructions).
