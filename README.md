# Sound in the Arbor

An interactive, audio-reactive 3D particle landscape for people who want to explore a visual environment while listening to their own music. Upload a local recording, start playback, explore the meadow, and switch between Night and Dusk.

## Second upload — visual development

This revision focuses on three connected problems: grass density and volume, continuous slopes and depth, and the choice of lighting style. It keeps the landscape entirely particle-based.

- **Grass density:** the dense foreground patch previously ended abruptly. Its distribution now fades continuously into the distance. Some existing ground points form curved, upward-growing grass chains with varied heights and lean; other points remain as ground cover. The desktop landscape contains **891,746 points** after the accepted woodland reinforcement; the music-interaction upgrade adds no particles.
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

Real-time RMS, spectral novelty, frequency bands and rhythmic activity drive continuous damped motion envelopes. Every landscape point has an independent phase, sensitivity, trajectory frequency and return parameter; grass chains, branches and trunks can separate and then reassemble around unchanged rest positions. Sparse large points create soft size contrast. AudioWorklet tracks rhythm independently of rendering frame rate, with a spectral fallback. Night/Dusk switching retains these mappings.

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

Run `npm run check` for syntax and **11 audio/motion tests**. The latest real-browser run passed **26 checks**, covering lighting modes, live audio, independent return envelopes, MP4 loading, drag-and-drop, camera controls and mobile layout, with no captured console errors. See [browser results](docs/motion-browser-validation.json), [individual-particle implementation](docs/INDIVIDUAL_MOTION.md), and [PROCESS.md](PROCESS.md).

The result is stylized point-cloud art, not a photograph or trained Gaussian-splat reconstruction. Tree lighting normals are approximate. The shadow map uses the vegetation's rest pose and does not follow every music-driven movement. Particle shadow softness and detail are limited by a 2048-pixel depth map. First-load asset size and GPU performance vary by device; smaller displays reduce samples and sustained low frame rates reduce pixel ratio. No universal frame-rate claim is made.

Rhythm estimation can struggle with polyphony, legato and noise. MP4 needs a supported codec and an audio track. User feedback and planned improvements are summarized below; the available trial record and design response are documented in PROCESS.md.

## User Feedback and Future Improvements

After experiencing the prototype, users gave positive feedback on its visual aesthetics and immersive atmosphere. However, they also identified several areas for improvement.

**Music-Responsive Particle Movement**

- Particle movement sometimes feels intermittent rather than continuous and natural.
- The visual responses to moderately slow music and highly energetic music are not sufficiently distinct.
- The relationship between musical intensity and particle movement needs further refinement to create more expressive and responsive interactions.

**Customisable Interaction Settings**

Users also suggested adding more control over the visual experience, allowing them to adjust:

- **Particle Size:** Change the size of individual particles.
- **Movement Speed:** Control how quickly particles move and respond to music.
- **Movement Distance:** Adjust how far particles travel from their original positions.

These improvements could make the experience more responsive to different musical styles while giving users greater control over their personalised visual environment.

## Credits

The main tree is sampled from a CC0 model; the solid model is not rendered. See [CREDITS.md](CREDITS.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and [PROCESS.md](PROCESS.md) for sources, decisions and AI assistance. No hosting credentials, personal recordings or browser profiles belong in this repository.
