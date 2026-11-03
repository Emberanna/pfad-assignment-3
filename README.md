# Sound in the Arbor

An interactive, audio-reactive 3D particle landscape for people who want to explore a visual environment while listening to their own music. Upload a local recording, start playback, explore the meadow, and switch between Night and Dusk.

## Live website

**[Open Sound in the Arbor](https://emberanna.github.io/pfad-assignment-3/)**

The public HTTPS site is hosted on GitHub Pages. It opens without signing in or running a local server. Choose a local audio file or MP4, or load the demo and press Play. Personal recordings are read locally by the browser.

The deployment workflow in .github/workflows/deploy-pages.yml checks the application and publishes only the dist directory. Changes to dist on main automatically update the website after a successful GitHub Actions run. The Node.js server remains available for local development and is not required by the hosted site.


## Second upload — visual development

This revision focuses on three connected problems: grass density and volume, continuous slopes and depth, and the choice of lighting style. It keeps the landscape entirely particle-based.

- **Grass density:** the dense foreground patch previously ended abruptly. Its distribution now fades continuously into the distance. Some existing ground points form curved, upward-growing grass chains with varied heights and lean; other points remain as ground cover. The desktop landscape contains **891,746 points** after the accepted woodland reinforcement; the music-interaction upgrade adds no particles.
- **Terrain and slopes:** one smooth height field creates broad rolling slopes and low hills. Grass roots, flowers, and trees use the same terrain height. Distant ground samples extend smoothly so a fixed boundary is less visible. Existing grass-cluster thickness is preserved; the camera and controls are retained.
- **Lighting choice:** Night retains the dark purple background and luminous point-cloud style. Dusk uses a low-angle warm directional light, environment fill, approximate particle normals, and a muted warm sky. After visual review, a stronger yellow-green treatment was rejected in favor of softer gray-gold transitions. Tree and grass shadows use a static point-cloud depth map.
- **Player surface:** frosted glass softly reveals a little of the particle background while keeping labels and controls readable.

![Current Dusk scene with the particle controls panel and music player](docs/screenshot.png)

[Night mode](docs/night.png) · [Terrain before](docs/terrain-before.png) · [Terrain after, same camera](docs/terrain-after.png)

## Player return control update

Building on the existing player, a small, unframed arrow now appears in its top-left corner after loading the demo or a personal track, replacing the status text in that position. Selecting it stops playback and returns to **Bring your own music**, where another local recording can be selected. The panel keeps its original width, with a more transparent background and clearer rounded corners. The existing scene, lighting modes, camera controls and playback controls are retained.

The screenshot above shows the current saved interface. See also the [current mobile player](docs/mobile.png). The default response preserves the landscape structure. Wider interwoven movement and near-camera motion are available only through deliberate extreme settings in the new Controls panel.

## Particle controls and an unobstructed listening view

In response to users asking for more control over the particle experience, a **Controls** panel has been added on the right. Listeners can adjust animation speed, movement distance, scene zoom, beat pulse, local looseness, particle size, camera rotation and audio color reactivity while music plays. **Reset to defaults** restores the original settings. The panel uses fine white sliders, the same serif typeface as the main title, and a colorless frosted background with rounded corners.

Both panels can be folded away to reduce visual obstruction and support a more immersive audiovisual experience:

- **Controls panel:** select the title row or arrow to collapse it. Only a small circular arrow remains on the right; select it to reopen the panel. The panel starts collapsed on smaller screens.
- **Music player:** during playback, it automatically folds away after a short delay when the pointer is outside its area. Moving the pointer back into the original player area reveals it; moving away lets it fold again. Pausing keeps playback controls visible. On touchscreens, select the small **Music player** tab to reveal them.

Default settings retain bounded, independent particle movement around a stable landscape. Raising animation speed, movement distance and local looseness near their maximum values deliberately blends in wider, interwoven trajectories and a sparse near-camera approach. Lowering these settings or resetting them smoothly restores the default movement. This effect is under the listener's control rather than being forced by every fast passage.

[Controls folded to the circular arrow](docs/controls-folded.png)

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
- **Try the demo** loads the creator-selected 77.72-second recording (`叙事曲4部分.mp4`); press Play after loading.
- **Response settings** controls sensitivity and movement; zero movement disables swaying.
- **Controls** on the right provides eight live visual settings and a reset button. Both the Controls panel and music player can fold away as described above.
- Volume changes playback output without changing the analysis input.

Selected files remain local in the browser and are not uploaded or retained after reloading.

## Audio response

The default audio response smoothly changes local movement amplitude while preserving the landscape. Quiet passages retain gentle movement, and near-silence lets it settle. Musical tempo alone does not automatically accelerate or dissolve the scene; listeners can adjust speed and looseness through Controls. Grass, tree crowns, branches, trunks and distant trees move along independent fixed axes in the XY plane, with different phases, frequencies, base amplitudes and sensitivities.

Each participating landscape particle follows the same core rule:

> P_i(t) = P0_i + A_i(t) × sin(ω_i × t + φ_i) × D_i

- **P0_i:** the original position of particle i.
- **A_i(t):** its back-and-forth amplitude, which changes with the music.
- **ω_i:** its independent oscillation frequency.
- **φ_i:** its independent initial phase.
- **D_i:** its fixed movement direction vector.

The shared rule gives each particle an independent back-and-forth path. Every frame calculates position from its rest position, so movement does not accumulate into drift. Music changes amplitude smoothly within a bounded local range, and quieter passages let activity contract. The implementation uses a continuously integrated clock scaled by the listener's animation-speed setting, so changing speed does not reset the phase or cause position jumps. The horizon veil and decorative airborne motes retain their existing behavior.

Motion amplitude and small local looseness are tracked separately. Default movement remains bounded even during strong or fast music. The wider, interwoven effect is an optional extension enabled by extreme user settings; the fixed-axis formula above describes the default motion. AudioWorklet tracks rhythm independently of rendering frame rate, with a spectral fallback. Night/Dusk switching retains these mappings.


## Project files

| File | Purpose |
| --- | --- |
| `dist/particle-meadow.js` | Continuous terrain, grass distribution and chains, sampled tree geometry |
| `dist/scene.js` | Particle rendering, lighting, sky, static shadows, camera and mode selection |
| `dist/app.js` | Local playback, audio connections, UI and lighting-button events |
| `dist/controls.js` | Live visual settings, panel folding, player hover reveal and reset |
| `dist/index.html`, `dist/style.css` | English interface, responsive layout and frosted player |
| `dist/audio-features.js`, `dist/rhythm-*.js` | Audio analysis and audio-clock timing |
| `dist/assets/` | Bundled Three.js runtime, licensed tree assets and demo recordings |
| `server.mjs` | Local server with media byte-range support |
| `tests/` | Audio behavior tests |

## Validation and limits

Run `npm run check` for syntax and **10 audio/motion tests**. Historical browser reports in `docs/` describe earlier saved revisions. The default motion revision uses bounded XY-axis oscillation and preserves the landscape structure. Browser checks have also verified live settings, reset, both folding interfaces and the optional maximum-settings effect. Normal UI hides all diagnostic overlays. The default demo is now the creator-selected MP4 recording; earlier 48-second demo validation records do not describe this new asset.

The result is stylized point-cloud art, not a photograph or trained Gaussian-splat reconstruction. Tree lighting normals are approximate. The shadow map uses the vegetation's rest pose and does not follow every music-driven movement. Particle shadow softness and detail are limited by a 2048-pixel depth map. First-load asset size and GPU performance vary by device; smaller displays reduce samples and sustained low frame rates reduce pixel ratio. No universal frame-rate claim is made.

Rhythm estimation can struggle with polyphony, legato and noise. MP4 needs a supported codec and an audio track. User feedback and planned improvements are summarized below; the available trial record and design response are documented in PROCESS.md.

## User Feedback and Future Improvements

Earlier feedback praised the visual aesthetics and immersive atmosphere, but described particle movement as intermittent and found the contrast between calmer and more energetic music insufficiently clear. This led to independent oscillation, more visible displacement, and faster movement and structural release during sustained fast rhythms.

**Feedback after the latest revision**

After trying the updated experience, users reported a clear improvement in the particle effects compared with the previous version. They identified the following areas for improvement:

- **Clearer visual contrast between musical examples:** the differences between examples could be more visually pronounced, making changes in musical pace and intensity easier to see.
- **Returning from the demo to personal music:** users reported that after choosing the demo, they could not return to playing their own preferred songs. In response, the top-left return arrow was added. It now stops the current track and restores the music picker. Browser checks confirmed that a personal recording can be loaded and played after returning from the demo; further user feedback on the revised control is still welcome.

This feedback reflects the creator's summary of user trials, rather than validation of every musical style or playback path.

**Previously requested controls**

Earlier users requested separate settings for particle size, movement speed and movement distance. These have now been implemented in the right-hand Controls panel, alongside the additional visual settings described above. Foldable panels respond to the desire for a less obstructed listening view. The creator judged the updated experience substantially better than the previous version; this does not replace further user trials across different recordings.

## Credits

The main tree is sampled from a CC0 model; the solid model is not rendered. See [CREDITS.md](CREDITS.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and [PROCESS.md](PROCESS.md) for sources, decisions and AI assistance. No hosting credentials, personal recordings or browser profiles belong in this repository.
