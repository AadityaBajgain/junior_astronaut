# JuniorAstronaut — clean-start product brief
Audience: children aged 7–12. Product: a browser game for the NASA Space Apps Junior Astronaut Mission Trainer challenge. Treat Go → Land → Live → Explore as the organizing theme. The goal is for a child to make a choice, see its effect in the world, and explain one tradeoff in their own words.

## 1. Non-negotiable experience
- Open on a game interface. Show a compact mission map, four clearly named destinations and a prominent play/resume action. Do not build a marketing landing page, a wall of science text, or a dashboard with a decorative canvas.
- Use Phaser for every playable environment. Players interact with objects in the scene; the rocket, lander, crops, crew and rover visibly respond. HTML provides equivalent keyboard/touch controls, short instructions, settings and source notes. Either input path must operate the same game state.
- Make environments play differently. Four copies of a three-button checklist with different backgrounds do not meet the brief.
- Use real NASA imagery, video and scientific data where appropriate. Show real radiation measurements with units and context. Distinguish archive, recent observations, calculated data and game assumptions.
- Food production/life support, power generation/storage/use, and radiation protection must matter to play. At least the Moon and Mars scenarios must involve operating an outpost, not just flying or collecting items.

## 2. The four-part journey
The following are proposed mission designs. Keep the theme and learning goals; tune specific puzzles, numbers and artwork through play-testing.

| Chapter | Playable scene and player actions | Meaningful decision | Visible result / success |
|---|---|---|---|
| GO — Earth launchpad and transit | Load cargo into a fictional exploration vehicle within its capacity; pack a battery, life-support supplies or science gear. Launch and see the manifest arrive. | More reserve energy leaves less room for optional research gear. | Cargo fits, essentials are packed, launch animation plays (skippable) and choices affect the next stage. |
| LAND — lunar approach and base setup | Inspect a fictional map, select a landing zone and deploy a habitat, solar array and battery. | Use the available power for a terrain scan or retain it for base setup; decide when to charge before a scripted low-light shift. | Lander touches down, equipment appears and the habitat stays powered through low light. No claim that a simulated site is safe in reality. |
| LIVE — Mars greenhouse | Route power and water to a grow bed, plant seeds, operate lamps and harvest after multiple simulated shifts. Maintain essential air and food reserves. | With limited energy, run grow lights, charge the battery, or power research. Diverting power from life support has a predictable, recoverable cost. | Soil, sprouts, leaves and harvest appear in sequence. Food increases only after the crop has received water, power and time. |
| EXPLORE — surface expedition | Dispatch a rover or crew from the outpost, inspect samples, read a radiation science card and decide when to return to shelter. | Continue collecting science or interrupt the outing to protect the crew. Budget power for travel, communications and return. | Route, sample inventory, battery and crew location change. Finish with an explanation of what exploration cost and why sheltering helped. |

Design for both a guided journey and direct replay of available environments. If a chapter is not ready, label it clearly. Start replay with a valid default loadout; do not require a prior save.

## 3. Rules that make it a game
Use short, player-advanced shifts. Preview each action’s cost and benefit before committing. No essential action requires quick reflexes. Power cannot be spent twice. Solar generation depends on the scenario lighting; battery storage has a finite capacity. When supply falls short, explicitly show what ran and what paused. Different strategies should produce different outcomes.

Example for prototyping only: a shift supplies two game-energy units. The air system uses one. The child can spend the other on grow lights or save it for the next dark shift. Choosing lights advances a watered crop; choosing storage leaves the crop at its current stage but preserves reserve energy. Label these as game units, not NASA engineering values. If physical quantities are used, document their basis and compute energy from power × time.

Start with power, life-support reserves and crew protection. Reveal water and food when relevant. Use safe retries, not astronaut injury or frightening alarms. Show a short debrief: “You charged the battery, so the air system kept running in the dark.” Ask one learning question and allow replay.

## 4. NASA science and media
Use server-side adapters for external data. Prefer public, documented NASA sources. Verify returned records and usage/credit information before adding an asset. Never invent an observation, identifier, photo credit or scientific threshold. The following are candidates and examples, not a requirement to use every API:

| Source | Suitable use | What not to imply |
|---|---|---|
| NASA Image and Video Library: https://images.nasa.gov/ and https://images-api.nasa.gov/ | Distinct credited launch, spacecraft, lunar and Martian images. Show real mission video at a relevant decision, e.g. an optional Perseverance landing clip. | Archive photographs and footage are not live feeds. A Mars landing video is not lunar footage. |
| JPL Horizons: https://ssd-api.jpl.nasa.gov/doc/horizons.html | Query for a stated UTC date, target and observer; display Earth–Moon or Earth–Mars distance and one-way light time. Mars communications can use a documented time compression. | An ephemeris is a calculation, not direct spacecraft telemetry. Retrieval time is not the time of the calculation. |
| NASA DONKI: https://ccmc.gsfc.nasa.gov/tools/DONKI/ | A verified, dated solar energetic particle event can inspire a shelter decision. Cite the original event ID, instrument and event time. | DONKI is not a local surface dose meter; a flare is not automatically a particle event at the base. |
| Curiosity RAD: https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/ | Historical example: average 0.67 mSv/day at Gale Crater on Mars, August 2012–June 2013. Explain the location, instrument, unit and averaging interval. | Not today’s Mars level, not a Moon reading, and not a safe/unsafe cutoff. Keep educational shelter readiness distinct from measured dose. |

For each environment, include a compact “NASA connection” badge and expandable source card: asset or dataset title, agency/instrument, exact source link, ID when available, place, observation or reference date, retrieval date, units and game simplifications. Credit imagery next to where it appears; aggregate sources in a science log. Use opt-in video controls with captions or a text equivalent. No autoplay audio.

Implement at least one meaningful live API query and one verified archived fallback. Cache successful queries; validate schema, units, timestamps and identifiers; use bounded timeouts and fixed upstream endpoints. On failure, show “Archived” with the original date. On a successful empty query, say no matching records were returned. Never say conditions are safe because a feed is empty. Ship curated assets/fixtures so the core game works without internet access or API keys. Check current official challenge resources and submission rules before claiming award eligibility.

## 5. Child-friendly presentation and accessibility
Use a consistent 2D arcade art direction, a friendly NOVA helper and short verb-first instructions. Give children one clear objective and immediate visual feedback. Guided mode offers fewer choices and consequence previews; Explorer mode can expose more numbers or tighter budgets. Avoid long lectures, manipulative streaks, ads, public rankings and personal data collection.

Support mouse, touch and keyboard, visible focus, text labels on meters, non-color-only signals, large targets, pause, larger text and reduced motion. Audio is off by default. Ensure phone, tablet and desktop layouts work. Keep science details optional. No login, free-text child chat, paid service or AI key is needed.

## 6. Implementation and local delivery
Use Next.js App Router, React, TypeScript, Tailwind CSS and a compatible stable Phaser release. Load Phaser in the browser only. Keep simulation rules in pure TypeScript. React and Phaser dispatch typed actions against one authoritative state. Render frames may animate vehicles or leaves; they never consume oxygen, advance shifts or award a second harvest. Destroy scenes and listeners on navigation and retry.

Persist preferences and versioned progress locally. Validate saves; recover from corrupt or unavailable storage. Reloading or closing the tab cannot deplete resources. Keep API keys server-side; never commit secrets. Maintain source manifests, reviewed fixtures, architecture decisions and a feature/test ledger.

Deliver a complete local project with a lockfile, supported Node version and README. A clean installation must work with npm ci and npm run dev. Before modifying the existing Desktop/nasa project, create a separate sibling folder such as Desktop/JuniorAstronaut-Rebuild. Preserve the old project. Vercel preview and production are later milestones; do not deploy as part of the restart.

## 7. Build order and acceptance
1. Foundation and title screen: a Phaser-backed mission selector, NOVA, settings and accessible navigation. Honest availability labels. Review before proceeding.
2. First playable slice: LAND at the Moon outpost, including power allocation, a battery, a low-light shift, a verified NASA source and a debrief. Validate two different strategies before expanding scope.
3. LIVE greenhouse: verify water/power/time prerequisites, delayed harvest and reserve consequences.
4. EXPLORE: verified radiation context, an explicit simulated event and an actual exploration-versus-shelter choice.
5. GO: cargo, launch and transit, then connect the four chapters in journey order.
6. Final pass: save/resume, source audit, mobile/accessibility tests and preview review.

For each milestone: run lint, typecheck, relevant unit and browser tests, and a production build. Play through using scene input and equivalent HTML controls. Test data failure/empty results and offline fallback where relevant. Provide the local URL, exact steps, expected results and limitations. Mark ready for review; do not infer approval. A complete release lets a child play all four different environments, operate an outpost, encounter credible NASA science, and explain at least one resource tradeoff.
