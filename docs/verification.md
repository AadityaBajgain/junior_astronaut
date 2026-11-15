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


## Game-feel and controller update · November 15, 2026

| Check | Result |
| --- | --- |
| `npm run lint`, `npm test` | ESLint passed. 18 unit tests passed, adding key, serial-line and gamepad mapping, stars, badges, ranks, corrupt reward saves and the Outpost Commander rules (budget limits, battery cap, a losing all-science plan, a three-star plan and a missed shelter). |
| `npm run test:e2e` | 9 Chrome tests passed against the running dev server. New tests play from the title screen through the Go mission, the star question and into the next room using keys only; drive the title, map and a room with a simulated standard gamepad; and win Outpost Commander with three stars using keys only. |
| Not verified | No physical gamepad or ESP32 board was connected. The Web Serial connection was not exercised in a browser; only its line parser is tested. Sounds were not listened to. Playtesting with children remains open. |

## Real data and full-screen update · November 15, 2026

| Check | Result |
| --- | --- |
| Live feed | `/api/space-weather` returned a GOES-18 ≥10 MeV reading of 0.25 pfu stamped 10:55 UTC (scale S0) alongside the DONKI report. |
| Sources | The DONKI query for May 8–13, 2024 was run and its 14 records saved to `data/storm-week.json`. The NASA pages for the water recovery, exercise and bone facts and the NOAA scale and GOES pages were fetched and the quoted figures found in them. The Chang'E-4 figure comes from published coverage of Zhang et al. 2020; the journal page itself blocked automated access. |
| Tests | 20 unit tests and 9 Chrome tests passed, covering live-reading validation (stale, future, malformed), storm days derived from the records, the weather station text, the F key and a three-star Outpost run on the real storm dates. |
| Not verified | A storm-level live reading has not been seen in the UI because the Sun was calm; only the calm state was viewed. Full-screen layout was viewed at 1280 × 760 only. |

## Animation and production update · November 15, 2026

| Check | Result |
| --- | --- |
| Tests and build | ESLint, TypeScript, 20 unit tests, 9 Chrome tests and `npm run build` passed after the room animations, the Phaser base scene and the production settings were added. |
| Headers | The dev server returned the `Permissions-Policy` and `X-Content-Type-Options` headers, `s-maxage=300` on `/api/space-weather`, the web manifest and a 404 page for an unknown path. |
| Not verified | The app has not been deployed to Vercel from this repository. Confetti, launch shake and floating labels were not watched frame by frame; the base scene was viewed at 1280 × 800. |

## All-Moon redesign · November 15, 2026

Earlier sections of this file describe versions that included Mars missions. Those missions, the Curiosity photograph and the Mars radiation figure have been removed.

| Check | Result |
| --- | --- |
| Tests and build | ESLint, TypeScript, 23 unit tests and 10 Chrome tests passed. They cover the harder rules of all four missions (including an expert route and a failure route for each), fact-card unlock order, card collection, the outpost water recycler with a three-star plan, the display and light message formats, the on-screen copy of the controller display during a keyboard playthrough (level name, action, result, red and green lights, walking animation) and a Moon jump that is still in the air after 0.9 seconds. |
| Facts | Each new fact was found on its source page the same day (NASA Moon facts, NASA curation, the NASA lunar-soil plant article, NASA Moon water and ices, the Apollo 15 mission page, NASA image-library captions). |
| Not verified | No ESP32, LCD or LED hardware was connected, so the firmware sketch is untested and the serial messages were checked only through the on-screen copy. The existing firmware written for the Node `esp32Link` helper was not available, so its message format could not be matched. Play time was estimated from action counts, not measured with children. |
