# Progression acceptance

Date: 2026-11-15.
Runtime source: `84fe218c98512dbcc0b901e224cd2e5120547d2a`.
Published Site: version 2, source `bd44058d90a71c16210a7da5a52bf468d694ffe3`.

## Complete simulation journey

Run `node --test tests/journey.test.js` or `mise run verify`.
The test starts a new game and advances it through fixed-step player inputs.
It uses the same dialogue action as the application.
It does not teleport, replace enemies, grant upgrades, or refill resources directly.

The route collects three echoes, defeats both bosses, and visits every room.
It unlocks dash, crosses the ivy barrier, unlocks the higher jump, and reaches the human ending.
It drinks a bottle and uses both fountains. It takes damage and completes without respawning.
Independent testing review found no actionable defects in this acceptance test.

## Published browser checks

Chrome on macOS checked Site version 2 through the visible interface.
The final-jump laboratory scenario reached the upper exit through Q, D, and E inputs.
The crossing dialogue appeared at x=2114 and y=171.8.
Dialogue advancement restored Fuyu's human form and displayed the theater ending.

The final map showed all seven rooms, their connections, and the current theater marker.
A restarted game showed only the initial room and one adjacent unknown room.
The other rooms remained hidden.

The laboratory scenario verifies browser controls, rendering, and the ending transition.
It does not constitute a complete browser playthrough from a new game.
The complete journey is covered by the separate simulation test above.
Physical mobile acceptance remains in GMD-25.
