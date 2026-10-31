# Sound in the Arbor

An interactive, audio-reactive 3D particle landscape for people who want to explore a visual environment while listening to their own music. Upload a local recording, start playback, explore the meadow, and switch between Night and Dusk.

## Second upload — visual development

This revision focuses on three connected problems: grass density and volume, continuous slopes and depth, and the choice of lighting style. It keeps the landscape entirely particle-based.

- **Grass density:** the dense foreground patch previously ended abruptly. Its distribution now fades continuously into the distance. Some existing ground points form curved, upward-growing grass chains with varied heights and lean; other points remain as ground cover. The desktop landscape budget remains **848,496 points**, rather than adding unlimited particles.
- **Terrain and slopes:** one smooth height field creates broad rolling slopes and low hills. Grass roots, flowers, and trees use the same terrain height. Distant ground samples extend smoothly so a fixed boundary is less visible. Existing grass-cluster thickness is preserved; the camera and controls are retained.
- **Lighting choice:** Night retains the dark purple background and luminous point-cloud style. Dusk uses a low-angle warm directional light, environment fill, approximate particle normals, and a muted warm sky. After visual review, a stronger yellow-green treatment was rejected in favor of softer gray-gold transitions. Tree and grass shadows use a static point-cloud depth map.
- **Player surface:** frosted glass softly reveals a little of the particle background while keeping labels and controls readable.

![Dusk mode and frosted-glass music player](docs/screenshot.png)

[Night mode](docs/night.png) · [Terrain before](docs/terrain-before.png) · [Terrain after, same camera](docs/terrain-after.png)

## Run in VS Code

Requires Node.js 22 or newer and a current WebGL-capable browser. No package installation or API key is required.

Open the folder containing `package.json`, then run in its terminal:

```sh
npm start
```

Open **http://127.0.0.1:4173**. Do not open the HTML directly; the application uses ES modules and locally served assets. If the port is occupied, PowerShell users can run `$env:PORT = "4175"` before `npm start`.

## Controls

- **Night / Dusk:** change lighting without rebuilding the scene or interrupting playback. Dusk is the initial mode; the choice is not saved across reloads.
- Drag, scroll, or use arrow keys to explore. Press **R** or **Reset view** to return.
- Drop an MP4 or audio file, or click **Bring your own music**. Press Play or Space to start/pause; use the timeline to seek.
- **Try the demo** loads a 48-second original synthesized study; press Play after loading.
- **Response settings** controls sensitivity and movement; zero movement disables swaying.
- Volume changes playback output without changing the analysis input.

Selected files remain local in the browser and are not uploaded or retained after reloading.

## Audio response

RMS energy affects point size; onset-based rhythmic activity affects movement speed. Low frequencies influence grass, mid frequencies influence vegetation, and high frequencies influence luminous accents. AudioWorklet tracks rhythm independently of rendering frame rate, with a spectral fallback. Lighting modes retain these mappings.

## Project files

| File | Purpose |
| --- | --- |
| `dist/particle-meadow.js` | Continuous terrain, grass distribution and chains, sampled tree geometry |
| `dist/scene.js` | Particle rendering, lighting, sky, static shadows, camera and mode selection |
| `dist/app.js` | Local playback, audio connections, UI and lighting-button events |
| `dist/index.html`, `dist/style.css` | English interface, responsive layout and frosted player |
| `dist/audio-features.js`, `dist/rhythm-*.js` | Audio analysis and audio-clock timing |
| `dist/assets/` | Bundled Three.js runtime, licensed tree assets and original demo |
| `server.mjs` | Local server with media byte-range support |
| `tests/` | Audio behavior tests |

## Validation and limits

Run `npm run check` for syntax and four audio behavior tests. The latest real-browser run passed **23 checks**, including both lighting modes, playback continuity during switching, MP4 loading, drag-and-drop, camera controls and mobile layout. It reported no captured console errors. See [browser results](docs/browser-validation.json) and [PROCESS.md](PROCESS.md).

The result is stylized point-cloud art, not a photograph or trained Gaussian-splat reconstruction. Tree lighting normals are approximate. The shadow map uses the vegetation's rest pose and does not follow every music-driven movement. Particle shadow softness and detail are limited by a 2048-pixel depth map. First-load asset size and GPU performance vary by device; smaller displays reduce samples and sustained low frame rates reduce pixel ratio. No universal frame-rate claim is made.

Rhythm estimation can struggle with polyphony, legato and noise. MP4 needs a supported codec and an audio track. Participant usability testing has not yet been performed.

## Credits

The main tree is sampled from a CC0 model; the solid model is not rendered. See [CREDITS.md](CREDITS.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and [PROCESS.md](PROCESS.md) for sources, decisions and AI assistance. No hosting credentials, personal recordings or browser profiles belong in this repository.
