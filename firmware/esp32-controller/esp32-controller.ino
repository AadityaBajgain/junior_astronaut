// MoonSprout controller for an ESP32 with buttons, a 16x2 I2C LCD and two LEDs.
//
// Wiring
//   Buttons: each button connects its GPIO pin to GND (internal pull-ups, no resistors).
//   LCD:     16x2 with an I2C backpack. SDA -> GPIO 21, SCL -> GPIO 22, VCC -> 5V, GND -> GND.
//            Most backpacks answer at address 0x27; some use 0x3F.
//   LEDs:    green LED -> GPIO 18, red LED -> GPIO 19, each through a 220 ohm resistor to GND.
//   Change the pin numbers below to match your build.
//
// Library: "LiquidCrystal I2C" (Arduino Library Manager).
//
// Serial link, 115200 baud, one message per line.
//   Controller -> game
//     U1 / U0   up pressed / released          (also D, L, R)
//     A1 / A0   action                         (also B = back, S = start, X = jump)
//     J x y     joystick, each from -100 to 100 (y grows downward)
//   Game -> controller
//     LCD|top row|bottom row    show two rows (up to 16 characters each)
//     CLR                       clear the display
//     LED|G|1    LED|G|0        green LED on / off
//     LED|R|1    LED|R|0        red LED on / off
//
// In the game: Settings -> Connect USB controller (Chrome or Edge).

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define USE_JOYSTICK 0
#define LCD_ADDRESS 0x27
const uint8_t GREEN_LED = 18, RED_LED = 19;

LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

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
  {'X', 13, false, 0},  // jump / trophies (optional)
};
const uint32_t DEBOUNCE_MS = 15;

#if USE_JOYSTICK
const uint8_t JOY_X_PIN = 34, JOY_Y_PIN = 35;  // ADC1 pins
int lastX = 0, lastY = 0;
int readAxis(uint8_t pin) {
  int value = map(analogRead(pin), 0, 4095, -100, 100);
  return abs(value) < 15 ? 0 : value;  // dead zone
}
#endif

String line;  // text received from the game so far

void showRow(uint8_t row, String text) {
  text = text.substring(0, 16);
  while (text.length() < 16) text += ' ';  // overwrite what was there, no flicker
  lcd.setCursor(0, row);
  lcd.print(text);
}

void handleLine(String msg) {
  msg.trim();
  if (msg == "CLR") {
    lcd.clear();
  } else if (msg.startsWith("LCD|")) {
    int bar = msg.indexOf('|', 4);
    showRow(0, bar < 0 ? msg.substring(4) : msg.substring(4, bar));
    showRow(1, bar < 0 ? "" : msg.substring(bar + 1));
  } else if (msg.startsWith("LED|") && msg.length() >= 7) {
    bool on = msg.charAt(6) == '1';
    if (msg.charAt(4) == 'G') digitalWrite(GREEN_LED, on ? HIGH : LOW);
    if (msg.charAt(4) == 'R') digitalWrite(RED_LED, on ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  for (Button &b : buttons) pinMode(b.pin, INPUT_PULLUP);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  lcd.init();
  lcd.backlight();
  showRow(0, "MoonSprout");
  showRow(1, "Connect in game");
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
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      handleLine(line);
      line = "";
    } else if (c != '\r' && line.length() < 64) {
      line += c;
    }
  }
  delay(2);
}
