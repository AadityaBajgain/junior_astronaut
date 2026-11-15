import { test, expect, type Page } from "@playwright/test";
import { anchors } from "../game/layout";
import { missions } from "../game/missions";

const field = (page: Page) => page.locator(".playfield");
async function ready(page: Page) {
  await expect(field(page)).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
}
// The title screen shows once per tab; Enter starts the game.
async function openMap(page: Page) {
  await page.goto("/");
  await expect(page.locator(".chart")).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
  if (await page.locator(".title-screen").isVisible())
    await page.keyboard.press("Enter");
  await expect(page.locator(".title-screen")).toHaveCount(0);
}
async function actAt(page: Page, spot: string, next: number) {
  await page.locator('[data-spot="' + spot + '"]').click();
  await expect(field(page)).toHaveAttribute("data-turn", String(next));
}
async function point(page: Page, x: number, y: number) {
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

test("four map islands enter four Moon missions; a finished task shows a credited NASA photo and fact", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [i, m] of missions.entries()) {
    await openMap(page);
    const canvas = page.locator("canvas");
    const box = (await canvas.boundingBox())!,
      node = anchors(box.width < 680)[i];
    if (i % 2 === 0)
      await page.mouse.click(
        box.x + box.width * node.x,
        box.y + box.height * node.y - 44,
      );
    else {
      const link = page.getByRole("link", { name: m.name + " · " + m.place });
      await link.focus();
      await page.keyboard.press("Enter");
    }
    await expect(page).toHaveURL(new RegExp("/missions/" + m.id + "$"));
    await ready(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(m.place);
    // The first task of each mission pops up a real NASA photo and fact by itself.
    await actAt(page, ["left", "right", "right", "middle"][i], 1);
    const toast = page.locator(".fact-toast");
    await expect(toast).toContainText("REAL NASA FACT");
    await expect(toast).toContainText("NASA");
    await expect
      .poll(() =>
        toast
          .locator("img")
          .evaluate((im: HTMLImageElement) => im.naturalWidth),
      )
      .toBeGreaterThan(200);
    const album = page.getByRole("button", { name: /Fact cards 1\// });
    await album.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Archive photo");
    await expect(dialog).toContainText("to find this card");
    await expect(
      dialog.getByRole("link", { name: "NASA source" }).first(),
    ).toHaveAttribute("href", /nasa\.gov\//);
    await expect(page.locator("body")).not.toContainText(/\bMars\b/);
    await page.keyboard.press("Escape");
    await expect(album).toBeFocused();
    await page.getByRole("link", { name: "Mission map", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  }
  expect(errors).toEqual([]);
});

test("scene click walks to the air tank; keys move the astronaut and Space uses nearby gear", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/missions/go");
  await ready(page);
  const canvas = page.locator("canvas"),
    before = await canvas.screenshot();
  await canvas.focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(220);
  await page.keyboard.up("ArrowRight");
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  const p = await point(page, 0.18, 0.68);
  await page.mouse.click(p.x, p.y);
  await expect(field(page)).toHaveAttribute("data-turn", "1");
  await page.keyboard.press("Space");
  await expect(field(page)).toHaveAttribute("data-turn", "2");
  await expect(page.locator(".dialogue-bar")).toContainText(
    "Suit check passed",
  );
  await actAt(page, "middle", 3);
  for (const turn of [4, 5, 6, 7]) await actAt(page, "right", turn);
  await expect(field(page)).toHaveAttribute("data-complete", "true");
  await page.reload();
  await ready(page);
  await expect(field(page)).toHaveAttribute("data-complete", "true");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Go to Moon landing site" })
    .click();
  await ready(page);
  await expect(page.locator(".dialogue-bar")).toContainText(
    "spare battery made it",
  );
});

test("landing, greenhouse and rover loops finish, replay, and show different consequences", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [id, moves, message] of [
    [
      "land",
      [
        "right",
        "right",
        "left",
        "middle",
        "middle",
        "left",
        "right",
        "middle",
        "middle",
      ],
      "Two nights done",
    ],
    [
      "live",
      [
        "right",
        "left",
        "right",
        "right",
        "middle",
        "right",
        "left",
        "middle",
        "right",
        "right",
        "middle",
        "right",
        "right",
        "left",
        "middle",
        "right",
        "left",
        "right",
        "right",
      ],
      "Two salads",
    ],
    [
      "explore",
      ["middle", "right", "right", "middle", "right", "left"],
      "Three rocks home",
    ],
  ] as const) {
    await page.goto("/missions/" + id);
    await ready(page);
    for (let i = 0; i < moves.length; i++) await actAt(page, moves[i], i + 1);
    await expect(field(page)).toHaveAttribute("data-complete", "true");
    await expect(page.locator(".dialogue-bar")).toContainText(message);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Play again" })
      .click();
    await expect(field(page)).toHaveAttribute("data-turn", "0");
    await expect(field(page)).toHaveAttribute("data-complete", "false");
  }
});

test("phone touch, larger words and archived field notes work with external traffic blocked", async ({
  browser,
}, testInfo) => {
  const ctx = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  await page.route("**/api/space-weather", (r) => r.abort());
  await page.goto("/");
  await expect(page.locator(".chart")).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
  await page.getByRole("button", { name: /to start/ }).tap();
  await page.getByRole("button", { name: "Settings" }).tap();
  await page.getByRole("checkbox", { name: "Larger words" }).check();
  await page.getByRole("button", { name: "Done" }).tap();
  await page.getByRole("link", { name: /Explore ·/ }).tap();
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.locator(".room")).toHaveClass(/large/);
  await page.getByRole("button", { name: /Fact cards/ }).tap();
  await expect(page.getByRole("dialog")).toContainText("1.37 mSv/day");
  await expect(page.getByRole("dialog")).toContainText("Archived NASA event");
  await page.getByRole("button", { name: "Close panel" }).tap();
  await page.getByRole("button", { name: "Pause game" }).tap();
  await expect(page.getByRole("dialog")).toContainText("Game paused");
  await page.getByRole("button", { name: "Keep playing" }).tap();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await ctx.close();
});

test("invalid or unavailable saves still allow play", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("JuniorAstronaut.room.v1.go", "{");
    localStorage.setItem("JuniorAstronaut.map.v1", "??");
  });
  await page.goto("/missions/go");
  await ready(page);
  await actAt(page, "left", 1);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/missions/live");
  await ready(page);
  await actAt(page, "right", 1);
});

test("Moon night visibly darkens the terrain and pause freezes the scene", async ({
  page,
}) => {
  await page.goto("/missions/land");
  await ready(page);
  await actAt(page, "right", 1);
  await actAt(page, "left", 2);
  const canvas = page.locator("canvas");
  async function groundLight() {
    return canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext("2d")!;
      const pixels = ctx.getImageData(
        el.width * 0.5,
        el.height * 0.89,
        18,
        9,
      ).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4)
        sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return sum / (pixels.length * 0.75);
    });
  }
  const day = await groundLight();
  await actAt(page, "middle", 3);
  await expect.poll(groundLight).toBeLessThan(day * 0.85);
  await page.getByRole("button", { name: "Pause game" }).click();
  const still = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await page.waitForTimeout(220);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(
    still,
  );
  await page.getByRole("button", { name: "Keep playing" }).click();
  await actAt(page, "middle", 4);
});

test("keyboard only: title, map, a whole mission, the star quiz and the next room", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openMap(page);
  // The next unfinished mission already has the focus.
  await expect(
    page.getByRole("link", { name: "Go · Earth launchpad" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("link", { name: "Land · Moon landing site" }),
  ).toBeFocused();
  await page.keyboard.press("a");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/missions\/go$/);
  await ready(page);
  const hold = async (key: string, ms: number) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  // The controller display announces the level, then each action and its result.
  const lcd = page.locator(".lcd-screen");
  await expect(lcd).toContainText("Earth launchpad");
  await expect(lcd).toContainText("reached!");
  await page.keyboard.press("Space"); // the gear case is closest
  await expect(field(page)).toHaveAttribute("data-turn", "1");
  await expect(lcd).toContainText("Pack battery");
  await expect(lcd).toContainText("Cargo 1/2");
  await expect(page.locator(".lcd-mirror")).toHaveAttribute(
    "data-green",
    "true",
  );
  await hold("a", 1700);
  await page.keyboard.press("Space"); // air tank
  await expect(field(page)).toHaveAttribute("data-turn", "2");
  await expect(page.locator(".fact-toast")).toContainText("3 astronauts");
  await page.keyboard.press("Space"); // suit check at the same station
  await expect(field(page)).toHaveAttribute("data-turn", "3");
  await page.keyboard.press("Space"); // nothing left to do there: red light
  await expect(lcd).toContainText("Not yet!");
  await expect(page.locator(".lcd-mirror")).toHaveAttribute("data-red", "true");
  await hold("ArrowRight", 3300);
  for (const turn of [4, 5, 6]) {
    await page.keyboard.press("Space"); // pump fuel
    await expect(field(page)).toHaveAttribute("data-turn", String(turn));
  }
  await expect(lcd).toContainText("Fuel 3/3");
  await page.keyboard.press("Space"); // blast off
  await expect(field(page)).toHaveAttribute("data-complete", "true");
  await expect(lcd).toContainText("Mission done!");
  await expect(page.locator(".lcd-mirror")).toHaveAttribute(
    "data-green",
    "true",
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Mission complete!");
  await expect(dialog).toContainText("New badge");
  await page.keyboard.press("Enter"); // a wrong answer switches off
  await expect(dialog).toContainText("Not quite");
  await page.keyboard.press("Enter"); // the next answer is right
  await expect(dialog).toContainText("Star question solved!");
  await expect(
    dialog.getByRole("link", { name: "Go to Moon landing site" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/missions\/land$/);
  await ready(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toContainText("Game paused");
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Trophy room/ })).toContainText(
    "3/15",
  );
});

test("a gamepad starts the game, enters a room, walks and uses things", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const pad = {
      connected: true,
      mapping: "standard",
      axes: [0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    Object.assign(window, { fakePad: pad });
    navigator.getGamepads = () => [pad as unknown as Gamepad];
  });
  const press = async (button: number) => {
    await page.evaluate((b) => {
      (
        window as unknown as { fakePad: { buttons: { pressed: boolean }[] } }
      ).fakePad.buttons[b].pressed = true;
    }, button);
    await page.waitForTimeout(120);
    await page.evaluate((b) => {
      (
        window as unknown as { fakePad: { buttons: { pressed: boolean }[] } }
      ).fakePad.buttons[b].pressed = false;
    }, button);
    await page.waitForTimeout(120);
  };
  await page.goto("/");
  await expect(page.locator(".chart")).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
  await press(0);
  await expect(page.locator(".title-screen")).toHaveCount(0);
  await expect(page.locator(".hints")).toContainText("STICK");
  await press(0);
  await expect(page).toHaveURL(/\/missions\/go$/);
  await ready(page);
  await press(0);
  await expect(field(page)).toHaveAttribute("data-turn", "1");
  await page.evaluate(() => {
    (window as unknown as { fakePad: { axes: number[] } }).fakePad.axes[0] = -1;
  });
  await page.waitForTimeout(1700);
  await page.evaluate(() => {
    (window as unknown as { fakePad: { axes: number[] } }).fakePad.axes[0] = 0;
  });
  await press(0);
  await expect(field(page)).toHaveAttribute("data-turn", "2");
  await press(1);
  await expect(page.getByRole("dialog")).toContainText("Game paused");
});

test("Outpost Commander: six days of balancing power, air, food, water and shelter with keys only", async ({
  page,
}) => {
  // The live feed is stubbed, so the test never depends on today's space weather.
  await page.route("**/api/space-weather", (r) =>
    r.fulfill({
      json: {
        kind: "empty",
        from: "2026-10-17",
        to: "2026-11-15",
        checkedAt: "2026-11-15T11:00:00.000Z",
        event: {
          id: "2024-05-10T13:35:00-SEP-001",
          time: "2024-05-10T13:35Z",
          instrument: "GOES-P: SEISS >10 MeV",
          source: "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1",
        },
        now: {
          flux: 0.25,
          time: "2026-11-15T10:55:00.000Z",
          satellite: "GOES-18",
          scale: 0,
        },
      },
    }),
  );
  await page.goto("/outpost");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Commander, your base!");
  await expect(dialog).toContainText("May 8 to 13, 2024");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".outpost-sky")).toContainText(
    "May 8, 2024: no Sun storm was recorded",
  );
  await expect(page.locator(".outpost-sky")).toContainText("LIVE");
  await page.keyboard.press("x");
  await expect(dialog).toContainText("0.25 pfu");
  await expect(dialog).toContainText("1.37 mSv/day");
  await expect(dialog).not.toContainText("Mars");
  await expect(dialog).toContainText("not live");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  // air, greenhouse, water, shelter, lab for each day
  const plans = [
    [1, 2, 0, 0, 2],
    [1, 1, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 0, 0],
    [1, 0, 0, 1, 2],
  ];
  await page.keyboard.press("f"); // full screen and back, from the keyboard
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.keyboard.press("f");
  const lcd = page.locator(".lcd-screen");
  await expect(lcd).toContainText("Day 1 calm");
  for (const [sol, plan] of plans.entries()) {
    await expect(page.locator(".system-list")).toHaveAttribute(
      "data-sol",
      String(sol + 1),
    );
    for (const sparks of plan) {
      for (let i = 0; i < sparks; i++) await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowDown");
    }
    await page.keyboard.press("Space");
    await expect(dialog).toContainText("Day " + (sol + 1) + " report");
    await expect(dialog).toContainText("REAL SPACE FACT");
    await page.keyboard.press("Enter");
  }
  await expect(dialog).toContainText("Outpost safe!");
  await expect(dialog.getByRole("img", { name: "3 of 3 stars" })).toBeVisible();
  await expect(dialog).toContainText("Base Commander");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("Moon gravity: X jumps and unlocks the gravity card; walking animates the controller display", async ({
  page,
}) => {
  await page.goto("/missions/land");
  await ready(page);
  await expect(page.locator(".gravity-chip")).toContainText("one-sixth");
  const lcd = page.locator(".lcd-screen");
  await expect(lcd).toContainText("Moon landing");
  await page.keyboard.down("ArrowRight");
  await expect(lcd).toContainText("Moving");
  await page.keyboard.up("ArrowRight");
  await expect(lcd).toContainText("reached!");
  const canvas = page.locator("canvas");
  const standing = await canvas.screenshot();
  await page.keyboard.press("x");
  await expect(page.locator(".fact-toast")).toContainText("one-sixth");
  // Still in the air well after an Earth jump would have landed (about 0.35 s).
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(standing)).toBe(false);
  await page.goto("/");
  await expect(page.locator(".chart")).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
});

test("the final mission stays hidden until all four missions are finished", async ({
  page,
}) => {
  await openMap(page);
  await expect(page.locator(".outpost-locked")).toContainText(
    "Finish all 4 missions",
  );
  await expect(page.locator(".outpost-card")).toHaveCount(0);
  // The map fills the whole window.
  const box = (await page.locator("canvas").boundingBox())!;
  const size = page.viewportSize()!;
  expect(box.width).toBe(size.width);
  expect(box.height).toBe(size.height);
  await expect(page.locator(".map-astronaut")).toBeVisible();
  await page.evaluate(() => {
    const done = [true, false, false];
    localStorage.setItem(
      "JuniorAstronaut.profile.v1",
      JSON.stringify({
        version: 1,
        stars: { go: done, land: done, live: done, explore: done },
        badges: [],
        cards: [],
      }),
    );
  });
  await page.reload();
  await expect(page.locator(".chart")).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
  const card = page.getByRole("link", { name: /Final mission/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/outpost$/);
});
