# Controllers

The whole game runs on eight buttons. A mouse or touch screen is optional.

| Button | Keyboard | Gamepad (standard layout) | ESP32 serial letter | What it does |
| --- | --- | --- | --- | --- |
| Up / Down / Left / Right | Arrow keys or W A S D | D-pad or left stick | `U` `D` `L` `R` (or `J x y`) | Walk, move through menus, add or remove outpost sparks |
| A | Space, Enter or E | Button 0 (A / Cross) | `A` | Use the nearest thing, press the highlighted button |
| B | Esc, Backspace or Q | Button 1 (B / Circle) | `B` | Close a card, open the pause menu |
| Start | P | Start or Select | `S` | Pause menu |
| X | X or I | Button 2 or 3 | `X` | NASA photo card in a room, Trophy room on the map |

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

## Status

Keyboard play and the serial parser are covered by automated tests. The Gamepad and Web Serial paths were written against the browser APIs but have not been tested with physical hardware in this repository. Try your controller on the title screen first: the hint bar switches from keyboard names to A / B as soon as the game hears a controller button.
