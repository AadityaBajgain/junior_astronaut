// JuniorAstronaut controller for an ESP32 (any board with USB serial).
//
// Wiring: each button connects its GPIO pin to GND. The pins use the internal
// pull-up, so no resistors are needed. Change the pin numbers to match your build.
// An analog joystick is optional: set USE_JOYSTICK to 1 and wire VRx / VRy.
//
// The game reads one short line per change at 115200 baud:
//   U1 / U0  up pressed / released   (also D, L, R)
//   A1 / A0  action                  (also B = back/menu, S = start, X = NASA card)
//   J x y    joystick, each from -100 to 100 (y grows downward)
//
// In the game: Settings -> Connect USB controller (Chrome or Edge).

#define USE_JOYSTICK 0

struct Button {
  char letter;
  uint8_t pin;
  bool down;
  uint32_t changedAt;
};

Button buttons[] = {
  {'U', 32, false, 0},  // up
  {'D', 33, false, 0},  // down
  {'L', 25, false, 0},  // left
  {'R', 26, false, 0},  // right
  {'A', 27, false, 0},  // action: use / choose
  {'B', 14, false, 0},  // back / menu
  {'S', 12, false, 0},  // start / pause   (optional)
  {'X', 13, false, 0},  // NASA card / trophies (optional)
};
const uint32_t DEBOUNCE_MS = 15;

#if USE_JOYSTICK
const uint8_t JOY_X_PIN = 34, JOY_Y_PIN = 35;  // ADC1 pins
int lastX = 0, lastY = 0;
int readAxis(uint8_t pin) {
  // 12-bit ADC: 0..4095, centre near 2048. Returns -100..100.
  int value = map(analogRead(pin), 0, 4095, -100, 100);
  return abs(value) < 15 ? 0 : value;  // dead zone
}
#endif

void setup() {
  Serial.begin(115200);
  for (Button &b : buttons) pinMode(b.pin, INPUT_PULLUP);
}

void loop() {
  uint32_t now = millis();
  for (Button &b : buttons) {
    bool down = digitalRead(b.pin) == LOW;
    if (down != b.down && now - b.changedAt > DEBOUNCE_MS) {
      b.down = down;
      b.changedAt = now;
      Serial.print(b.letter);
      Serial.println(down ? '1' : '0');
    }
  }
#if USE_JOYSTICK
  int x = readAxis(JOY_X_PIN), y = readAxis(JOY_Y_PIN);
  if (abs(x - lastX) > 8 || abs(y - lastY) > 8 || (x == 0 && lastX != 0) || (y == 0 && lastY != 0)) {
    lastX = x;
    lastY = y;
    Serial.print("J ");
    Serial.print(x);
    Serial.print(' ');
    Serial.println(y);
  }
#endif
  delay(2);
}
