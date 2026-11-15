# Controllers

The whole game runs on eight buttons. A mouse or touch screen is optional.

| Button | Keyboard | Gamepad (standard layout) | ESP32 serial letter | What it does |
| --- | --- | --- | --- | --- |
| Up / Down / Left / Right | Arrow keys or W A S D | D-pad or left stick | `U` `D` `L` `R` (or `J x y`) | Walk, move through menus, add or remove outpost sparks |
| A | Space, Enter or E | Button 0 (A / Cross) | `A` | Use the nearest thing, press the highlighted button |
| B | Esc, Backspace or Q | Button 1 (B / Circle) | `B` | Close a card, open the pause menu |
| Start | P | Start or Select | `S` | Pause menu |
| X | X or I | Button 2 or 3 | `X` | Jump in a room (Moon gravity!), Trophy room on the map, space weather in the Outpost |

Only the four directions and **A** are needed to play and finish every mission. **B** is strongly recommended so a child can pause or leave a room.

## Three ways to connect an ESP32

1. **USB serial (works on any ESP32).** Flash `firmware/esp32-controller/esp32-controller.ino`, plug the board in, open the game in Chrome or Edge, then choose **Settings → Connect USB controller** and pick the board in the browser's list. The browser remembers the board, so next time it reconnects by itself. Web Serial is not available in Firefox or Safari.
2. **Bluetooth keyboard (zero setup in the game).** Make the ESP32 a BLE keyboard, for example with the ESP32-BLE-Keyboard Arduino library, and send the arrow keys, Space and Esc. Pair it in the computer's Bluetooth settings. The game treats it as a keyboard in every browser.
3. **Bluetooth or USB gamepad.** Make the ESP32 a BLE gamepad (ESP32-BLE-Gamepad library) or, on an ESP32-S2 / S3, a USB HID gamepad. The game reads it through the browser Gamepad API: axes 0 and 1 or the D-pad for directions, button 0 for A, button 1 for B. Browsers show a gamepad only after one of its buttons is pressed.

## Serial protocol

115200 baud, one message per line, sent when something changes:

```
U1      up pressed            U0   up released      (same for D, L, R)
A1      action pressed        A0   action released  (same for B, S, X)
J 80 -20   joystick x y, each -100..100; beyond ±50 counts as a direction
```

Unknown lines are ignored, so `Serial.println` debug text does no harm. The parser is `parseSerialLine` in `game/input.ts` and is covered by `tests/input.test.ts`.

## Display and lights (game → controller)

The game also talks back over the same USB serial link, so a controller with a 16×2 LCD and a green and a red LED shows what is happening. The example sketch in `firmware/esp32-controller/` handles all of it (I2C LCD on GPIO 21/22, green LED on GPIO 18, red LED on GPIO 19).

```
LCD|top row|bottom row    show two rows, at most 16 plain characters each
CLR                       clear the display
LED|G|1   LED|G|0         green LED on / off
LED|R|1   LED|R|0         red LED on / off
```

| When | Display | Lights |
| --- | --- | --- |
| Title screen | `MoonSprout` / `Press A to start` | off |
| Mission map | `Mission map` / `3/15 stars` | off |
| A level opens | level name / `reached! Lvl 2/5` | off |
| The astronaut walks | level or action name / a walking animation (`Moving  \o  >>`) that changes about four times a second | unchanged |
| A task works | action name (`Pump fuel`) / what changed (`Fuel 2/3`) | green for 1.5 s |
| A move does not work | action name / `Not yet! Look up` | red for 1.5 s |
| Mission complete | `Mission done!` / `Go complete` | green stays on |
| Outpost day | `Day 3 SUN STORM!` / machine in focus and sparks left | red stays on while a storm day has no powered shelter |
| Outpost day ends | `Day 3 done` / `Crew is safe!` or `Crew lost heart` | green or red for 2.5 s |

The page shows a small copy of the display and both lights next to the button hints, so you can check the messages without hardware. Text is cut to 16 characters and reduced to plain ASCII before sending. The formatters are `lcdLine` and `ledLine` in `game/device.ts`.

**About the `esp32Link` helper.** That helper uses the Node `serialport` package, which only runs in a Node program on the same computer. This game runs in the browser (and on Vercel), so it uses the browser's Web Serial connection instead and needs no install. Only one program can hold the port: close the Arduino serial monitor, PuTTY or any Node script using `esp32Link` before choosing **Connect USB controller**. If your board already runs firmware written for `esp32Link`, its message format may differ from the lines above; flash the sketch in this repository, or change `lcdLine` and `ledLine` to produce the format your firmware expects.

## Status

Keyboard play, the serial parser and the display and light messages are covered by automated tests. The Gamepad and Web Serial paths were written against the browser APIs but have not been tested with physical hardware in this repository. Try your controller on the title screen first: the hint bar switches from keyboard names to A / B as soon as the game hears a controller button.
