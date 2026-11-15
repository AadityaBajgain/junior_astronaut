# JuniorAstronaut

A local astronaut adventure game for children aged 7–12, built for the NASA Space Apps Junior Astronaut challenge. Press start, pick an island on the mission map and walk into its world. Four training missions (Go, Land, Live, Explore) lead to a final mission, **Outpost Commander**, where the player balances power, air, food and a storm shelter at a Moon base. The whole game plays on a keyboard, a gamepad or a home-made ESP32 controller. A mouse or touch screen is optional.

## Run the game

Use Node 22 and npm. In the project folder:

```sh
npm ci
npm run dev -- --port 3173
```

Open [the mission map](http://127.0.0.1:3173). To run an optimized build, stop the dev server, run `npm run build` and then `npm start -- --port 3173`. Both servers listen on loopback. Installation requires access to the npm registry or a populated npm cache. Once installed, the worlds, character, equipment, fonts, photographs and archive records are local.

## Play

| Button | Keyboard | Gamepad | Does |
| --- | --- | --- | --- |
| Directions | Arrow keys or W A S D | D-pad or stick | Walk, move through menus, give or take outpost sparks |
| A | Space, Enter or E | A | Use the closest thing (a bouncing prompt shows which), press the highlighted button |
| B | Esc, Backspace or Q | B | Close a card, open the pause menu |
| X | X or I | X / Y | NASA photo card in a room, Trophy room on the map |
| Start | P | Start | Pause |

Touch and mouse still work: tap the ground to walk, tap an object to use it, or use the action buttons below the scene. See [docs/controller.md](docs/controller.md) for connecting an ESP32 controller (USB serial, Bluetooth keyboard or gamepad) and `firmware/esp32-controller/` for an example sketch.

**Rewards.** Each training mission has three stars: finish the mission, find its NASA photo card (walk to NOVA), and solve the star question on the results screen. Wrong answers simply switch off, so every child can earn the star. Different strategies earn different badges, which encourages a second try. Stars raise the astronaut rank from Space Cadet to Mission Commander. Everything is stored on this device only. There are no timers, streaks, rankings, accounts or personal data. **Settings → Erase my stars and badges** resets the rewards for the next player.

**Outpost Commander.** Six player-advanced sols at a Moon base. Each sol the forecast shows the sunlight and whether a practice Sun storm is coming. The player shares that sol's sparks between the air fan (life support), greenhouse (food), storm shelter (radiation protection) and science lab; leftover sparks charge a battery that holds three. Every row previews its consequence before the sol ends, and a report explains what ran and what paused. Missed needs cost a crew heart, never an injury, and a lost run is a friendly retry. Stars: finish, keep all three hearts, earn four science points. All quantities are game units.

| Page | A short play-test |
| --- | --- |
| [Go · Earth launchpad](http://127.0.0.1:3173/missions/go) | Load an air tank. Pack the battery or swap it for the camera. Launch and watch the rocket lift off. A delivered battery gives a new Moon run an extra reserve. A delivered camera lets a new Mars rock hunt photograph each sample. |
| [Land · Moon outpost](http://127.0.0.1:3173/missions/land) | On the sunny rim, charge once and scan once. Start night and watch the fan use the battery. Replay and spend both spare sun sparks on scans. With no other battery, the fan pauses and air packs let the crew wait for a new day. The flat site offers a different starting reserve. |
| [Live · Mars greenhouse](http://127.0.0.1:3173/missions/live) | Plant a seed, water it, and advance a sunny shift with the lamp connected. The seed sprouts. Water again and let the next sunny shift grow the leaves. Pick the lettuce. Try sending the spare sunlight to the battery and see the watered plant wait. |
| [Explore · Mars rock hunt](http://127.0.0.1:3173/missions/explore) | Ride out, collect a rock and check the dated NASA report during the practice storm. Head home or spend one more spark to bring back another rock. Watch the rover, samples and shelter. |

**Pause** freezes movement and animations. **Settings** controls larger words, reduced motion and sound. Sound starts off. Reduced motion moves the astronaut straight to the chosen object and keeps the outcome visible. The photo card offers **Read to me** on browsers with an installed English speech voice. A short completed room can be replayed immediately.

Each room saves completed decisions on this device. Refreshing replays those decisions without spending extra power. **Pause → Start this room again** begins a fresh run and picks up the gear from the most recently completed launch when available. The four rooms also have independent default loadouts. Blocked storage allows play in the open room.

## NASA data, photos and why they are here

Each room has one picture, one idea in child-friendly language, a nearby credit, and expandable source details. Photographs and reports are educational archives unless a dated DONKI catalog response is explicitly identified. The pixel landscapes, equipment, power sparks, growth speed, storm drill and fan behavior are game representations. The map illustrates a journey and uses no calculated planetary positions.

| Room | What is used and why | Original NASA records |
| --- | --- | --- |
| Go | Apollo 11’s three-person crew makes packing air concrete. The archive photo shows Saturn V vehicle SA-506 lifting off from Kennedy Space Center on July 16, 1969. Credit NASA. | [Launch photograph and caption](https://www.nasa.gov/image-article/apollo-11-lifts-off-3/) · [Mission and crew](https://www.nasa.gov/mission/apollo-11/) |
| Land | Solar-powered Surveyor 3 last contacted Earth on May 4, 1967, two Earth days into lunar night. The player can see how a stored supply keeps a game device working after sunset. The later Apollo 12 photo AS12-48-7121 shows Surveyor 3 in the Ocean of Storms on November 20, 1969. Credit NASA/JSC. | [Mission account and last contact](https://science.nasa.gov/solar-system/moon/footpads-and-footprints-humans-and-machine-meet-on-the-moon/) · [Lunar photograph](https://science.nasa.gov/resource/view-of-surveyor-iii-in-its-crater/) |
| Live | This red romaine lettuce was 28 days old in a prototype Veggie planting pillow at Kennedy Space Center on Earth. The photo and age connect light, water and patience to a real plant experiment. The NASA article dates to April 10, 2014. Credit NASA/Bryan Onate. | [Veggie prototype photograph and experiment](https://www.nasa.gov/missions/station/veggie-will-expand-fresh-food-production-on-space-station/) |
| Explore | Curiosity’s Radiation Assessment Detector (RAD) measured an average dose equivalent rate of **0.67 mSv/day** at Gale Crater on Mars from **August 2012 through June 2013**. A child can meet the rover that carried the instrument and see why crews plan shelter. NASA release 13-366 was published December 9, 2013. The separate MAHLI self-portrait PIA16238 was taken at Rocknest on October 31, 2012 (Sol 84). Credit NASA/JPL-Caltech/Malin Space Science Systems. | [Radiation report](https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/) · [Archive photo record](https://science.nasa.gov/resource/preliminary-self-portrait-of-curiosity-by-rovers-arm-camera/) |
| Explore space radio | The server queries the latest 30 UTC calendar dates for instrument-reported solar energetic particle events. A dated event supplies the radio story for the child's shelter decision. Local Mars dose and safe exposure limits cannot be derived from an event entry. The drill always gives the child time to choose. | [NASA CCMC DONKI system, contributors and use policy](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · [Web service docs](https://ccmc.gsfc.nasa.gov/DONKI/api/) |

**When the catalog is unavailable.** The bundled example is the May 10, 2024 particle event at 13:35 UTC, ID `2024-05-10T13:35:00-SEP-001`, recorded by `GOES-P: SEISS >10 MeV`. MeV is particle energy. The interface labels the example **Archived NASA event**. If NASA returns an empty list, the card reports the empty observation window and uses the dated archive for the drill. An empty catalog response provides no safety assessment. NASA CCMC DONKI and the Moon to Mars Space Weather Analysis Office supply the catalog. [Individual event](https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1) · [Reproducible archive query](https://ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP?startDate=2024-05-09&endDate=2024-05-14)

**API keys.** No API key, signup, account, environment variable or paid service is needed. On entering Explore, the browser calls the local `/api/space-weather` route. Its fixed public NASA CCMC endpoint accepts dates without a key. It has a 4.5-second timeout and a 15-minute cache for successful queries. Responses retain the check time and original event time. Each candidate must have a valid in-window UTC timestamp, matching SEP identifier, observing instrument and official NASA event URL. Model-only alerts are excluded. If the local server has no internet access, all four rooms and their archived science remain playable. External source links need internet access.

Archive fixtures and photos were checked November 14, 2026. Credits beside each photograph link to the official source. [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) · [JPL image use policy](https://www.jpl.nasa.gov/jpl-image-use-policy/)

## Project map

- `game/input.ts` turns the keyboard, the browser Gamepad API and ESP32 serial lines into the same eight buttons and routes them to the open screen or dialog. `game/profile.ts` holds stars, badges, ranks and the star questions. `game/outpost.ts` holds the Outpost Commander rules. All three are pure TypeScript with unit tests. `game/sfx.ts` synthesizes the optional sounds.
- `components/Outpost.tsx` and `app/outpost/page.tsx` are the final mission. Unlike the four rooms it is an HTML board rather than a Phaser scene.

- `app/missions/[id]/page.tsx` supplies the four direct Next.js routes. `components/AdventureRoom.tsx` connects React controls, preferences, progress and the browser-only Phaser scene.
- `game/adventure.ts` contains pure mission rules. `game/journal.ts` restores a validated versioned action history per room. Time passing or rendering a frame never advances a simulation.
- `game/world.ts` and `game/world-art.ts` implement walking, pointer hit tests, station use, sprite poses and action-specific effects. Interactive objects and their consequences are rendered by Phaser. The engine and listeners are disposed on navigation.
- `components/Science.tsx`, `data/field-notes.ts`, `data/science.json` and `data/sep-archive.json` hold the in-room photo cards and source records. `app/api/space-weather/route.ts` reads NASA’s catalog server-side.
- `public/art/world/` contains original game illustrations. The backdrops came from a four-room art sheet. The OpenAI image generation tool produced a twelve-object equipment sheet and six walking poses of the same small astronaut. Each image was cropped and bundled locally. The custom plant, cargo indicators, scan, plume and particle effects render in Phaser. The four mission islands, NOVA and star chart come from the original JuniorAstronaut build.
- Fonts are the locally bundled Press Start 2P and Space Grotesk (SIL Open Font License). Interface icons are Lucide (ISC). NASA photographic assets retain the source credits above.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` and `npm run build`. Browser tests use port 3174 and local Chrome on macOS. If a dev server for this folder is already running, point the tests at it instead: `BASE_URL=http://127.0.0.1:3000 npm run test:e2e`. You can select another Chromium executable with `CHROME_PATH` or install Playwright Chromium. See `docs/verification.md` for the verified paths and limits.

