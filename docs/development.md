# Development

## Setup and commands

Use the Node.js version supported by the installed Vite release, then install the lockfile's dependencies:

```sh
npm ci
npm run dev
```

Available package scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite on `127.0.0.1` for local development. |
| `npm test` | Run Node's test runner over `tests/*.test.js`. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run validate` | Run tests followed by the production build. |
| `npm run preview` | Serve the built site locally. |

## Source map

```text
src/
  domain/game.js          deterministic game state and simulation rules
  application/input.js    keyboard mapping into simulation inputs
  application/i18n.js     Spanish/English strings and dialogue
  application/main.js     browser wiring, UI, lab, and animation loop
  presentation/map.js     discovered-room SVG map
  presentation/render.js  Canvas 2D scene rendering
  presentation/style.css  page and HUD styling
```

## Design boundaries

The project keeps the simulation independent from browser APIs and rendering. `src/domain/game.js` owns the game state, constants, movement, combat, damage, room transitions, upgrades, and scenario setup. Its `tick(state, input, dt)` function advances the simulation using explicit input and elapsed time. It does not read the DOM, local storage, or the clock.

The application layer translates browser input, calls the simulation at a fixed 60 updates per second, manages dialogue and language selection, and connects game state to the UI. The presentation modules draw the scene and map from that state. This is a deliberately small, DDD-inspired separation: keep game rules testable without turning the prototype into a framework.

The world has side-scrolling exploration and two small isometric rooms. Isometric movement converts the four directional inputs into diagonal screen-space movement. Both modes share run, jump, attack, and unlocked dash actions. Boss encounters remain in the side-scrolling world; defeating a boss opens its corresponding room. The first room unlocks dash and the second unlocks the higher jump.

## QA scenarios and evidence

`scenario(name)` in the domain module creates ready-to-play state for the scenarios exposed in the Gameplay laboratory. Scenarios use the same `tick` rules as a normal session. Lab traces contain sampled input and movement/status metrics; exported JSON includes a state snapshot and the trace. WebM recording captures the gameplay canvas for up to ten seconds, without microphone or camera capture.

## Assets and build

Vite builds the static app to `dist/`. PixiJS is checked in at `public/vendor/pixi.min.js` and copied into the build. Canvas 2D renders the procedural game scene, which PixiJS displays in the page. Keep static-hosting requirements in mind: the built output should run without a server-side application.

## Mobile controls (GMD-24)

The left thumb stick moves in eight directions. Push to its outer ring to run while using the right thumb for jump, attack, dash or interaction; a separate hold-to-run button is also available. Dash remains disabled until unlocked. Both scene types consume the same gameplay input. Touches reset on cancellation, lost capture, blur, hidden document, pause, map or dialogue.

The game header has an explicit fullscreen/exit toggle. Unsupported or rejected native fullscreen uses a fixed viewport layout (browser chrome may remain). The exit button remains available during dialogue and pause. Controls respect safe-area insets, with a landscape overlay on coarse-pointer devices.

Validation: `npm run validate`, including pointer ownership/cancellation and fullscreen fallback tests. Desktop Chrome at 390 × 844 verified layout, entering/exiting fullscreen, and on-screen isometric jump (88.7 px observed height). See `evidence/GMD-24-mobile.jpg` and `evidence/GMD-24-validation.txt`. Physical iOS/Android multitouch and landscape behavior still need device testing; simulated pointer tests are not a substitute for that check.
