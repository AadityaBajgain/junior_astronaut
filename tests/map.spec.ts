import { test, expect, type Page } from "@playwright/test";
import { anchors } from "../game/layout";
import { missions } from "../game/missions";

const field = (page: Page) => page.locator(".playfield");
async function ready(page: Page) {
  await expect(field(page)).toHaveAttribute("data-status", "ready", {
    timeout: 35_000,
  });
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

test("four map islands enter four real pages, each with its own credited NASA photograph", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [i, m] of missions.entries()) {
    await page.goto("/");
    await expect(page.locator(".chart")).toHaveAttribute(
      "data-status",
      "ready",
      { timeout: 35_000 },
    );
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
    await page.getByRole("button", { name: "NASA photo" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Archive photo");
    await expect(dialog.locator("figcaption")).toContainText("NASA");
    await expect
      .poll(() =>
        dialog
          .locator("img")
          .evaluate((im: HTMLImageElement) => im.naturalWidth),
      )
      .toBeGreaterThan(200);
    await dialog.getByText("For curious grown-ups").click();
    await expect(
      dialog.getByRole("link", { name: "NASA science record" }),
    ).toHaveAttribute("href", /nasa\.gov\//);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "NASA photo" }),
    ).toBeFocused();
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
  await expect(page.locator(".dialogue-bar")).toContainText(
    "The air tank is on board",
  );
  await actAt(page, "middle", 2);
  await actAt(page, "right", 3);
  await expect(field(page)).toHaveAttribute("data-complete", "true");
  await page.reload();
  await ready(page);
  await expect(field(page)).toHaveAttribute("data-complete", "true");
  await page.getByRole("link", { name: "Go to Moon outpost" }).click();
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
      ["right", "right", "left", "middle", "middle"],
      "fan spun all night",
    ],
    [
      "live",
      ["right", "left", "right", "left", "right", "right", "right"],
      "grew lunch",
    ],
    ["explore", ["middle", "right", "right", "left"], "Two rocks came home"],
  ] as const) {
    await page.goto("/missions/" + id);
    await ready(page);
    for (let i = 0; i < moves.length; i++) await actAt(page, moves[i], i + 1);
    await expect(field(page)).toHaveAttribute("data-complete", "true");
    await expect(page.locator(".dialogue-bar")).toContainText(message);
    await page.getByRole("button", { name: "Play again" }).click();
    await expect(field(page)).toHaveAttribute("data-turn", "0");
    await expect(field(page)).toHaveAttribute("data-complete", "false");
  }
});

test("phone touch, larger words and archived field notes work with external traffic blocked", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
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
  await page.goto("http://127.0.0.1:3174/");
  await page.getByRole("button", { name: "Settings" }).tap();
  await page.getByRole("checkbox", { name: "Larger words" }).check();
  await page.getByRole("button", { name: "Done" }).tap();
  await page.getByRole("link", { name: /Explore ·/ }).tap();
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.locator(".room")).toHaveClass(/large/);
  const pt = await point(page, 0.09, 0.84);
  await page.touchscreen.tap(pt.x, pt.y);
  await expect(page.getByRole("dialog")).toContainText("0.67 mSv/day");
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
