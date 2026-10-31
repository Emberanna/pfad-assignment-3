# Development process

## Starting idea

The creator associated piano practice with imagined scenes and wanted to explore relationships between music and visual space. Penderecki's Garden provided a reference for point-cloud aesthetics. Early discussions considered conductor-like actions, comparing recordings, and recording personal interpretations. Those ideas were not accepted as implemented features.

## First prototype

The first version generated a particle pergola corridor. It supported local media selection and drag-and-drop, playback, camera exploration, and audio-reactive movement. Separating loudness from rhythmic activity avoided treating every louder passage as faster music.

## Second delivery

The landscape changed into a meadow with a mature tree on the right and an overarching canopy. A CC0 model supplies natural tree geometry and texture colors, which are sampled into points. The application still renders particles rather than the solid tree.

The creator requested smaller, flatter grass particles, a mixture of yellow and dark-green details, and a clearer rooted trunk. A later review found that distant trees were partly beyond the camera's far plane and excessively faded by fog. This revision extends the visible range, increases distant crown and trunk samples, and adds a pale-gold particle layer fading upward into the dark background. The accepted foreground palette is retained.

A solid PBR experiment was explored after a request for photographic realism, but the creator clarified that the result must remain particle-based. That experiment is not part of this delivery.

## English-language revision

All interface text, accessible labels, status messages, errors, demo titles, guides, documentation, and source comments in this delivery use English. The layout is adjusted only where longer English labels require space. Media filenames chosen by a user remain their original filenames.

## AI tools and decisions

Codex assisted with concept discussion, implementation, source research, original demo synthesis, code checks, browser automation, visual inspection, and English translation.

An adopted suggestion was to separate energy and rhythmic timing and use an audio processing thread for onset detection. Earlier browser testing showed that graphics frame rate could otherwise affect rhythm tracking.

A suggestion changed or rejected during development was the solid-material natural-scene route: the final direction remained particles. Recording comparison and subjective-interpretation controls were also left out of the delivered scope. These decisions should not be presented as evidence of participant research.

## Validation

The English revision passed 21 actual browser checks covering initialization, continuous rendering, viewpoint changes, demo playback, audio energy, faster versus slower passages, pause, settings, help, MP4 input, valid and invalid file drops, mobile layout, uncaught errors, English page language, and the absence of Chinese interface text. It also passed four audio behavior tests. Desktop and mobile screenshots were visually inspected. Results are recorded in `docs/browser-validation.json`.

Visual screenshots demonstrate the rendered state, not universal device performance or guaranteed aesthetic success. Rhythm is an activity estimate, not an accurate BPM measurement.

## Participant testing: not yet performed

At least one other person must try the experience before an explanation is given. Observe how they discover file selection, playback, viewpoint movement, and audio feedback. Record hesitation, unexpected actions, and whether the responses make sense. Make an improvement based on the observations, or explain why the design is retained. Add only actual observations here; do not invent a participant or feedback. No identity or recording is required.

## Development history

The first public upload was made separately by the creator. This delivery is intended to update that existing cloned repository through a new, descriptive commit. Future decisions and revisions should be committed as development continues rather than rewriting the first upload.
