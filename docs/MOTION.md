> Superseded by [Individual particle correction](INDIVIDUAL_MOTION.md). The timed hold/cooldown and protected-bark descriptions below are historical.

# Stage 4.1 — Expressive music response

The accepted static landscape is retained. Particle count is 891,746; no flowers, lakes, hills or unpublished crown-lighting experiments were added. The existing interface and camera controls are unchanged.

## Real-time signal path

Local File → object URL → media element → Web Audio analyser / rhythm worklet → reusable motion envelopes → GPU shader uniforms.

The media element streams and decodes the selected file. This revision does not call decodeAudioData on an entire recording, precompute animation frames or schedule choreography against track timestamps. Selected recordings and test media are not shipped in the build.

RMS is normalized against an 18-second decaying peak with a noise floor. Positive spectral flux, energy rise, worklet pulses and rhythmic activity supply novelty. A smoothed sustained-energy envelope gates bursts. A loud steady tone alone cannot trigger Burst. The output object and spectral-history buffer are reused.

## Main parameters

| Parameter | Current value / purpose |
| --- | --- |
| Normalization peak decay | 18 seconds; adapts to recording gain without instantly following every note |
| Audible floor | RMS 0.0025, with a gradual audibility ramp |
| Burst gate | Warmup > 2 s, sustained normalized energy > 0.36, current energy > 0.48, novelty > 0.58, plus rhythmic activity or a strong low-frequency novelty event |
| Burst cooldown | 3 seconds; avoids triggering on every onset |
| Burst hold | 0.75 seconds before exponential release |
| Release | Flow rate 0.85/s; Burst 1.1/s; pause release is faster, with visible recovery within a few seconds |
| Spatial flow | Phase-shifted horizontal flow and vertical waves; low and mid bands alter their scale |
| Burst spread | Per-point direction and radius, upward lift and local rotation; a fraction of points remain close to rest |
| Size hierarchy | Small points remain; the top hash-selected fraction gets soft larger discs, capped at 38 physical pixels |
| Main bark / roots | Motion weight 0.025, versus 0.9 for main foliage; branch topology stays a visual anchor |
| Background haze | Motion weight 0; no synchronized background explosion |

All offsets are computed from immutable rest positions plus the current envelope. No position integration accumulates between climaxes. Setting the existing Movement control to zero disables the added movement and size amplification. Reduced-motion preferences scale the existing movement control down.

Calm / Flow / Burst use hysteresis. They are read-only diagnostic states; the UI was not redesigned. Lighting modes remain independent from the motion model.

## Verification

- Nine automated audio / motion tests passed, including quiet versus fast passages, a loud steady tone, gain normalization, cooldown, pause recovery, buffer reuse and a simulated 20-minute run.
- The real browser played the original 48-second Demo, loaded MP4 audio, exercised file drops, settings, both lighting modes and camera controls, and captured Calm, Burst and returned states.
- A comparison regenerated the accepted static scene and confirmed every original position, color, size, seed and response group stayed identical. Per-point motion weights are additional metadata.
- A 48-second excerpt of the supplied local reference audio drove the model. The supplied 77.7-second MP4 visually showed a narrow media-player interface, so no particle-reference match is claimed from its video frames.
- A separate 660-second AAC/H.264 MP4 was generated outside the production tree. It was tested at normal speed for startup, pause and resume, then traversed at 16× to its natural end and replayed. This is not a claim of an eleven-minute normal-speed endurance run.
- Runtime animation data is fixed-size, independent of track length. Browser decoder memory remains browser-managed; this is not a cross-browser memory benchmark.

## Limits

Climax detection is an expressive heuristic, not recognition of musical form or a score BPM. Legato and quiet recordings may need the existing Sensitivity control. The first version intentionally allows strong local deconstruction; strength can be tuned after listening. The existing static shadow map does not follow every displaced particle. Rendering performance depends on GPU, viewport and device; no universal FPS promise is made.

No GitHub commit or push was performed.
