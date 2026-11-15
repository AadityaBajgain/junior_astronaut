# JuniorAstronaut

A Moon mission game for children aged 7–12, built for the NASA Space Apps Junior Astronaut challenge. The player packs and launches a rocket, lands and powers a Moon base, grows food in Moon soil, drives a lunar rover, and finally commands the whole outpost through six days of real Sun storms. Real NASA photos and facts pop up by themselves as tasks are finished. The whole game plays on a keyboard, a gamepad or a home-made ESP32 controller with its own display and lights. A mouse or touch screen is optional.

A full first playthrough takes roughly 6 to 10 minutes: the four missions need about 41 actions between them, and the outpost adds six planned days.

## Run the game

Use Node 22 and npm. In the project folder:

```sh
npm ci
npm run dev -- --port 3173
```

Open [the mission map](http://127.0.0.1:3173). For an optimized build run `npm run build` and then `npm start -- --port 3173`. No API key, account or environment variable is needed.

## Controls

| Button     | Keyboard              | Gamepad        | Does                                                                                |
| ---------- | --------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Directions | Arrow keys or W A S D | D-pad or stick | Walk, move through menus, give or take outpost sparks                               |
| A          | Space, Enter or E     | A              | Use the closest thing (a bouncing prompt shows which), press the highlighted button |
| X          | X or I                | X / Y          | Jump in a mission, Trophy room on the map, space weather in the outpost             |
| B          | Esc, Backspace or Q   | B              | Close a card, open the pause menu                                                   |
| Start      | P                     | Start          | Pause                                                                               |
| —          | F                     | —              | Full screen                                                                         |

Touch and mouse also work. See [docs/controller.md](docs/controller.md) for the ESP32 controller: buttons in, and level names, actions, a walking animation and green/red lights out.

## The missions

Everything happens on the way to the Moon or on it. Each mission is a Phaser scene with three stations, and only arriving at a station changes the game. Nothing needs fast reflexes.

| Mission                       | What the player does                                                                                                                     | Constraints                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Go** · Earth launchpad      | Pack air, test the suit, choose a battery or a camera, pump three loads of fuel, launch                                                  | Two cargo spaces; no launch without air, a checked suit and a full tank. The chosen item changes a later mission.                                                         |
| **Land** · Moon landing site  | Pick a landing site, then spend each day's spare sun sparks on charging the battery or scanning dark craters, and survive **two** nights | Battery holds 2; each night uses 1; an empty battery pauses the fan (recoverable)                                                                                         |
| **Live** · Moon greenhouse    | Grow **two** salads in Moon soil: plant, water, and choose each shift whether sunlight feeds the lamp or the battery                     | 4 drinks of water, exactly enough; the fan takes battery power first in dark shifts; battery holds 3                                                                      |
| **Explore** · Moon rover trek | Drive out, collect up to three rocks, recharge the rover, get home                                                                       | Every job outside uses suit air (6); rocks and driving use rover power (4); charging trades air for power; running out of air is a safe automatic ride home with one rock |
| **Outpost Commander**         | Six days at a Moon base. Share each day's sparks between the air fan, greenhouse, water recycler, storm shelter and lab                  | Battery holds 3; the crew eats and drinks every day; real storm days need the shelter; missed needs cost a crew heart                                                     |

**Moon gravity.** Jumping uses real numbers: the same push-off speed under 9.81 m/s² on the launchpad and 1.62 m/s² on the Moon. A Moon jump rises six times higher and lasts six times longer, and walking on the Moon is a chain of slow hops. The first Moon jump unlocks the gravity fact card.

**Fact cards.** Thirteen cards appear automatically, each when a task is completed (packing air, filling the tank, touching down, the first scan, the first sprout, the first rock, and so on). A card shows an archive NASA photo, one sentence for children, the photo caption and credit. The **Fact cards** button and the pause menu open the album, where each card links to its source. `data/cards.ts` holds them.

**Stars and badges.** Each mission has three stars: finish it, reach its harder expert goal (for example, three rocks without a rescue), and solve the star question. Twelve badges reward different strategies. Stars raise the rank from Space Cadet to Mission Commander. Everything is stored on the device only: no timers, streaks, rankings, accounts or personal data. **Settings → Erase my stars and badges** resets them.

## Real data

| Where                  | What                                                                                                                                                                      | Source                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fact cards             | Apollo 8, 11, 12, 15, 16 and 17 photographs, the lunar south pole, the Lunar Reconnaissance Orbiter, the Veggie plant experiment and Space Station water recycling        | NASA Image and Video Library and nasa.gov pages, linked from every card                                                                               |
| Moon facts             | Gravity one-sixth of Earth's; average distance 384,400 km; about 127°C in full Sun and −173°C in darkness                                                                 | [NASA Moon facts](https://science.nasa.gov/moon/facts/)                                                                                               |
| Samples and soil       | 382 kg of Apollo samples; plants grown in lunar soil from Apollo 11, 12 and 17                                                                                            | [NASA curation](https://curator.jsc.nasa.gov/lunar/) · [NASA plant study](https://www.nasa.gov/humans-in-space/scientists-grow-plants-in-lunar-soil/) |
| Outpost storms         | The six days replay May 8–13, 2024. A day is a storm day only when an instrument recorded a solar energetic particle event (May 10, 11, 13). May 9 had model alerts only. | [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/), saved in `data/storm-week.json`                                                           |
| Space weather station  | **Live** count of fast Sun protons near Earth and the Moon (≥10 MeV, primary GOES satellite), refreshed every five minutes, with NOAA's storm scale                       | [NOAA SWPC](https://www.swpc.noaa.gov/products/goes-proton-flux)                                                                                      |
| Moon surface radiation | 1.37 mSv/day measured in 2019 by the Chang'E-4 lander's LND instrument. It is not a NASA instrument and the game says so.                                                 | Zhang et al., Science Advances, 2020                                                                                                                  |

No public feed gives a live radiation reading from the Moon's surface, so the game does not show one. If the live satellite feed fails or is more than three hours old, the game says it is unavailable. Sparks, hearts, suit air, food, water and sunlight amounts are game units, not NASA engineering values. Real Sun particles are invisible; the outpost draws them so a storm can be seen, and says so. Sources were read on November 15, 2026.

## Deploy to Vercel

The project is a standard Next.js app and needs no environment variables, API keys or database.

1. Push the repository to GitHub.
2. In Vercel choose **Add New → Project**, import the repository and keep the detected **Next.js** preset.
3. Deploy. Or from a terminal: `npx vercel` for a preview, then `npx vercel --prod`.

- `/api/space-weather` runs as a serverless function. Its response carries `s-maxage=300`, so Vercel's edge serves one reading for five minutes. Upstream calls time out after 4.5 seconds and fall back to the bundled archive.
- `next.config.ts` sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a `Permissions-Policy` that allows only gamepad, serial and fullscreen. There is no Content-Security-Policy header yet.
- The ESP32 USB connection (Web Serial) needs HTTPS or localhost, and Chrome or Edge. Vercel serves HTTPS.
- Stars and saves live in each visitor's browser. Nothing about a player is sent to the server.

## Project map

- `game/adventure.ts` holds the pure rules of the four missions, the expert goals and which move unlocks which fact card. `game/journal.ts` restores a validated action history per mission; time passing never changes a mission.
- `game/world.ts` and `game/world-art.ts` are the Phaser scene for the missions: walking, jumping under gravity, station use, gauges and effects. `game/base.ts` is the Phaser scene of the outpost. `game/chart.ts` is the map.
- `game/outpost.ts` holds the outpost rules. `game/profile.ts` holds stars, badges, ranks, collected cards and the star questions.
- `game/input.ts` turns the keyboard, the Gamepad API and ESP32 serial lines into the same eight buttons. `game/device.ts` formats what the game sends back to the controller's display and lights.
- `game/space-weather.ts` and `app/api/space-weather/route.ts` validate the DONKI catalog and the live GOES reading server-side.
- `components/` holds the map (`FlightDeck`), mission screen (`AdventureRoom`), outpost screen (`Outpost`), fact album and pop-up (`Science`), weather station (`SpaceWeather`) and shared controls.
- `public/art/world/` holds the game illustrations. The Moon greenhouse, rover trek, rock and garden-bed art were recoloured from earlier artwork to lunar grey. `public/art/nasa/` holds the NASA archive photographs used on the cards.
- `firmware/esp32-controller/` is an example Arduino sketch for buttons, an I2C LCD and two LEDs.
- Fonts are the bundled Press Start 2P and Space Grotesk (SIL Open Font License). Interface icons are Lucide (ISC).

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` and `npm run build`. Browser tests use port 3174 and local Chrome on macOS. If a dev server for this folder is already running, point the tests at it: `BASE_URL=http://127.0.0.1:3000 npm run test:e2e`. See [docs/verification.md](docs/verification.md) for what was and was not checked.
