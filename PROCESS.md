# Development process

## Purpose and audience

The project began with the creator's experience of imagining scenes while practising piano. The provisional audience is listeners who want to explore a landscape while playing their own recordings. The implemented interaction is local media selection, listening, viewpoint exploration and visual feedback. It does not yet compare performances or capture a listener's personal interpretation of a piece.

Penderecki's Garden informed the point-cloud aesthetic; a meadow photograph informed the right-hand tree, rolling slopes, spatial depth and late-day light. The photograph is a visual reference, not a background image used to fake the scene.

## Earlier prototype

The first prototype was a particle pergola corridor with local playback and camera exploration. Loudness and rhythmic activity were separated so louder music would not automatically be interpreted as faster music. A later meadow prototype sampled a CC0 tree model into points and retained a fully particle-based landscape. A solid PBR direction was explored and rejected after the creator clarified the desired artistic medium.

## Second upload: grass density, slopes and lighting

### 1. Grass density and vertical volume

The grass initially looked like a flat dotted carpet. Two issues were identified separately: a dense rectangular near patch ended at a fixed depth, and most points sat within a few centimetres of the terrain surface.

The first fix redistributed the near density using a continuous depth falloff and lateral spread, removing the abrupt rectangular boundary. Independent deterministic randomness prevented this change from reshuffling subsequent tree and flower samples.

The second fix reused the grass point budget. Approximately 30% of the main grass samples remain ground cover; the others form clusters of curved particle chains. Each cluster contains several blades with varied height, direction and lean. Near clusters are taller and more detailed; distant ones become smaller and simpler through continuous distance-based changes. Ground flecks remain separate. The full desktop landscape stays at 848,496 points.

The decision was to add **vertical structure rather than just more surface points**. This improves volume while keeping batch rendering. The grass remains visibly made of individual points; it has not reached photographic grass detail. Numerical height checks alone were not considered sufficient: actual default-view screenshots were reviewed.

### 2. Terrain continuity, steepness and depth — Stage 3.1

The original shallow height function and fixed distant sampling edge made the landscape appear platform-like. One continuous height field now combines broad smooth hills, a shallow low area and gentle low-frequency variation. Sharp terraces and separate foreground/midground planes were avoided.

The initial terrain pass was visually too subtle, so the wide hill amplitudes were increased while retaining gentle gradients. A sampled slope check on the final field returned a maximum gradient of about 0.186 (roughly 10.6 degrees along the sampled axes); this is a sampled check, not a mathematical global bound. The aim was a rolling meadow, not a steep embankment.

All ground cover and blade roots use the same height field. Grass chains preserve their height above their roots. Flowers and the main tree are anchored to that field so their bases follow the terrain. Distant ground coverage extends smoothly beyond the previous cutoff. Near grass-cluster distribution and the default camera were retained.

Before/after screenshots were captured at the same 1440 × 1000 viewport and default camera. A moved-camera screenshot was also reviewed for parallax. The terrain-stage checks confirmed unchanged colors, point sizes, response attributes and point count; grass-chain thickness differed only by floating-point rounding.

### 3. Choosing the lighting form — Stage 3.2 and review

The existing custom ShaderMaterial did not receive ordinary Three.js lights automatically. A DirectionalLight placed to the left and behind the meadow now supplies a warm light direction and color to the particle shader. A HemisphereLight supplies environmental fill. Terrain gradients provide grass normals; approximate radial plant normals are used for the point-sampled tree. Grass-tip height and viewing direction add restrained backlighting.

The creator then requested a dusk background and ground-cast shadows. A static orthographic depth map of the existing vegetation was added, with a small filtered lookup in the particle shader. It uses existing grass and tree geometry, not decorative yellow particles or a painted random shadow pattern. This extends the original Stage 3.2 scope at the creator's request; it is not a claim that a complete animated canopy-shadow system was finished.

Bright backgrounds initially washed out the semi-transparent tree. A stronger yellow-green illumination treatment was then tried, but review found its light/dark transitions too harsh. The accepted direction returned to a lower-saturation gray-gold sky, cooler environmental fill and broader background transitions. **Night and Dusk are explicit user choices**, rather than replacing the original dark particle aesthetic. Switching changes lighting uniforms and sky visibility without regenerating geometry or interrupting audio.

Shadow limitations remain: the map uses the rest pose, tree normals are approximate, and small point shadows have limited resolution. The sky is a smooth background gradient, not a physical atmospheric-scattering simulation. The scene remains a lightweight particle artwork.

### 4. Player readability

The music panel was changed from an opaque dark surface to frosted glass. Backdrop blur and a tinted translucent background reveal only faint particle silhouettes. Text, status labels and buttons keep higher contrast. A more opaque fallback is supplied for browsers without backdrop-filter support. Existing playback controls and behavior remain intact.

## Validation of this saved revision

- The latest real-browser run passed 23 checks with no captured console errors, including initialization, both modes, audio continuity while switching, camera movement, demo playback, rhythmic activity, pause, help/settings, MP4 audio, valid/invalid drops and mobile layout.
- The existing four audio tests and JavaScript syntax checks passed during the lighting revision.
- Final desktop Night/Dusk screenshots and a mobile screenshot were inspected. Browser results and images are included in `docs/`.
- Geometry generation is unchanged by the lighting revision except that its existing height function is returned for normal calculation. The audio-analysis modules and camera-control code were checked against the saved terrain-stage baseline.
- These checks do not establish a guaranteed frame rate across devices or prove visual equivalence to the reference photograph.

## AI assistance and creator decisions

Codex assisted with implementation, debugging, code checks, browser automation, visual inspection, documentation and English translation. The creator supplied references, reviewed screenshots, restricted stage scope and selected/rejected visual treatments. Feedback directly led to grass-volume changes, continuous slopes, two lighting modes, softer dusk transitions and a readable frosted panel.

No participant quotes or test outcomes have been invented. Automated checks are implementation evidence, not user research.

## Participant testing — still required

Ask at least one other person to try the experience before explaining it. Observe discovery of upload, playback, camera movement and lighting modes, and whether the audio response makes sense. Record actual hesitation and actions, then document an improvement or a reason for retaining the design. No participant test has been performed for this revision.

## Saving and Git history

This snapshot was prepared on 31 October 2026 for the creator's second upload from the existing VS Code clone. Current code and English documentation are saved locally. The assistant has not committed or pushed to the creator's GitHub repository. Site publication uses a separate hosting repository and does not update GitHub. The creator should review the Source Control diff, commit the update and push it to retain the first upload's history.
