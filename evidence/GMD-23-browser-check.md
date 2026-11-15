# Recovered prototype acceptance

Date: 2026-11-15.
Source snapshot: `01226cfcb67d3c866c604b91c21cffcaab96fc3f`.
Environment: macOS, Chrome, Node.js 24.18.0, Vite 8.3.8.

The recovered snapshot passed 21 Node tests and the Vite build.
The following checks used the local game in Chrome:

- A fresh page displayed Spanish and the introductory dialogue.
- The movement scenario moved from x=110 to x=234 after a half-second right input.
- Isometric movement changed both world coordinates.
- Attack consumed energy in the isometric scene.
- The Q key produced a visible isometric jump.
- The K key moved the upgraded character and consumed energy.
- The fountain restored health and energy to their limits.
- English remained selected after a page reload. Spanish selection was restored afterward.
- Fullscreen opened and the visible exit button returned to the normal page.
- The laboratory created a ten-second WebM recording and a downloadable JSON trace.

The downloaded trace contained 2,475 frames, movement and jump inputs, and a maximum jump height of 107.4 pixels.
These checks confirm selected controls and the laboratory. They do not prove a complete unaided playthrough.

Independent testing, correctness, architecture, security, production, and documentation reviews examined the recovered change.
They identified hybrid jump strength, cross-view dash direction, blocked storage startup, and error visibility defects.
GMD-28 and GMD-29 track the corrections and their acceptance.
The public snapshot also removes the external font request and uses the declared local font fallbacks.

## Corrected snapshot checks

The public snapshot passed 24 Node tests, the Vite production build, and the delivery checker self-test.
The added regressions cover all three jump forms, side dashes after isometric movement, and blocked storage access.
Independent correctness, testing, and production reviews checked the fixes. They reported no remaining findings.

Chrome also checked two synthetic failure pages against the production build:

- A throwing `localStorage` getter still permitted Spanish startup, dialogue, and movement to x=262.
- Removing the Pixi script displayed the Spanish startup error above the game overlays.

These fault pages are local test fixtures. They are not included in the published game.

Physical iOS and Android acceptance remains pending in GMD-25.
The narrative research note still needs its source review in GMD-22.
