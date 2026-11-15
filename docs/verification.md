# Local verification · November 15, 2026

The update turns the four map destinations into independent playable pages. The Desktop project retains its original lockfile and supported Node 22 runtime.

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run typecheck` | ESLint and Next route generation plus TypeScript passed. |
| `npm test` | 11 tests passed. Coverage includes versioned map preferences, corrupt saves, both cargo choices, two lunar strategies and recovery, crop prerequisites, the return battery reserve, and NASA catalog validation. |
| `npm run test:e2e` | 6 Chrome browser tests passed. They enter every page, use canvas and equivalent HTML controls, verify real photo loading and credit links, move with the keyboard, complete and replay the missions, and restore progress. One test compares terrain brightness across lunar sunset and verifies that the paused picture stays still. |
| `npm run build` | The local Next production build generated the map and four mission routes plus the server-side space-weather endpoint. |
| Normal-motion playthrough | Chrome at 1366 × 860 completed all four missions using automatic walking and visible effects. The map, start views, Moon night, leafy garden, Mars shelter decision and end states were visually inspected. |
| Small display | A 390 × 844 touch-emulated Chrome session opened the NASA note from the scene, used larger words and persistent settings, and checked for horizontal overflow. |
| Offline path | Browser tests blocked external requests and the weather route. Core play, the Curiosity photo, the archived dose figure and the dated archived SEP record remained available locally. |
| Live query | The production endpoint successfully queried NASA CCMC DONKI for October 17 through November 15, 2026 UTC. NASA returned an empty list. The radio identified the empty interval and displayed the archived May 10, 2024 event for the drill. Unit tests also exercised a valid in-window instrument record, malformed data and model-only alerts. |

## Repeat the visual checks

1. In Go, choose gear twice. A battery and a camera occupy the same cargo space in turn. Pack air and launch.
2. In Land, use the sunny site. Charge once, scan once and start night. Watch the ground darken and the fan turn. Repeat a fresh direct run without a delivered battery, spend both sparks on the dish and check the recoverable fan pause.
3. In Live, compare a watered sunny turn with power sent to the lamp against a turn sent to storage. Look for a sprout or a still plant and a fuller battery.
4. In Explore, collect one rock and open the radio report. Compare returning immediately to taking a second sample. Inspect the sample pile and remaining battery when the astronaut reaches shelter.
5. Open each NASA photo, read the short child-facing idea, then expand the original record. The rover’s ten-month radiation average and a dated solar-particle event describe different observations.

These checks used installed Chrome and touch emulation. Physical-device testing, a screen-reader listening session and playtesting with children remain open.

