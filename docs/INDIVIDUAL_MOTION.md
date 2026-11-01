# Individual particle motion correction

This supersedes the original Stage 4.1 timed hold/cooldown design. The current implementation does not use scheduled burst events.

## Findings

The landscape was already drawn as one Points geometry rather than moving grass Groups. However, a whole grass chain reused a seed, spatial sine waves dominated Flow, and bark had a 0.025 weight. A common 0.75-second burst hold and 3-second cooldown made motion feel synchronized.

## Current data and GPU implementation

Original positions, colors, sizes and landscape seeds remain unchanged. A separate deterministic `aIndividual` vec4 gives every vertex an independent phase, audio sensitivity, return interpolation and trajectory frequency. Adjacent points in the same grass chain receive different tuples.

`particle-motion.js` exports the attribute generator and the exact GLSL inserted into `scene.js`. The shader computes a separate drift, curl, 3D direction, separation threshold, orbit speed and size multiplier for each particle. There is no shared grass-chain or crown displacement. Grass, branches, roots and trunks with nonzero scene weights all participate at normal response strength; the old bark weight no longer suppresses its movement. Atmospheric haze retains zero movement weight.

`expressive-motion.js` uses continuous energy, spectral novelty, rhythm and decaying momentum. Critically damped springs keep the global targets continuous. Fast and slow response banks are mixed independently per particle to produce different return rates. No fixed hold/cooldown starts or stops an animation.

Motion is evaluated around immutable rest positions. It does not integrate a permanent positional offset, so repeated passages cannot accumulate drift. The inertia is an analytical trajectory plus damped response approximation, not a full per-particle collision/physics simulation. A shared clock remains necessary, but phases, frequencies, directions, sensitivities and return rates differ per vertex.

## Parameters

| Attribute / parameter | Range or purpose |
| --- | --- |
| Individual phase | 0–2π, deterministic per vertex |
| Audio sensitivity | 0.65–1.40 |
| Return mixture | 0–1 between fast and slow response banks |
| Trajectory frequency | 0.60–1.45 |
| Flow spring frequency | 3.0/s |
| Looseness spring frequency | 2.4/s |
| Fast / slow flow banks | 3.8/s and 0.95/s |
| Fast / slow looseness banks | 3.4/s and 0.72/s |
| Big-point selection | Sparse per-particle hash; existing 38-physical-pixel cap |

## Validation

WebGL2 transform feedback executed the production GLSL using real Demo audio features. Samples included 12 consecutive points from one grass chain, 20 crown points and 20 trunk points at the same musical instant. The readback showed distinct neighboring offsets, trunk displacement, per-particle size differences, continuous adjacent-frame movement and zero displacement when the response envelopes were zero.

The actual browser was recorded with audio, including full view, grass close-up, trunk close-up, crown close-up and a ten-second pause/reassembly. Temporary magnification and captions existed only in the test browser and are not application UI changes. The recording is not pre-rendered choreography.

Eleven audio/motion tests cover retained audio behavior, independent attribute tuples, smooth sustained motion without repetitive resets, different return rates, normalization and a simulated twenty-minute bounded-state run. Browser checks cover local MP4, both lighting modes, playback, pause, controls, resizing and console errors.

The static particle shadow map remains a rest-pose approximation and does not follow each displaced particle. No static landscape redesign or GitHub push was performed.
