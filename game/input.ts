// One input layer for the whole game. A keyboard, a standard gamepad and a
// home-made ESP32 controller (USB serial) all become the same eight buttons.
export const buttons = [
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "start",
  "x",
] as const;
export type Btn = (typeof buttons)[number];
export type Source = "keys" | "pad" | "serial";
export type Press = { btn: Btn; source: Source; key?: string };
// A handler returns true when it used the press. The newest handler is asked first.
export type Handler = (press: Press) => boolean;
export const isDirection = (btn: Btn) =>
  btn === "up" || btn === "down" || btn === "left" || btn === "right";

const keyMap: Record<string, Btn> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  " ": "a",
  Enter: "a",
  e: "a",
  Escape: "b",
  Backspace: "b",
  q: "b",
  p: "start",
  x: "x",
  i: "x",
};
export function keyToButton(key: string): Btn | null {
  return keyMap[key.length === 1 ? key.toLowerCase() : key] ?? null;
}

// Serial protocol, one message per line at 115200 baud:
//   U1 / U0   up pressed / released      (also D, L, R)
//   A1 / A0   action button              (also B = back, S = start, X = info)
//   J 80 -20  joystick x y from -100 to 100 (y grows downward)
const serialLetters: Record<string, Btn> = {
  U: "up",
  D: "down",
  L: "left",
  R: "right",
  A: "a",
  B: "b",
  S: "start",
  X: "x",
};
export type SerialChange = { btn: Btn; down: boolean };
export function parseSerialLine(raw: string): SerialChange[] {
  const line = raw.trim().toUpperCase();
  const stick = /^J\s*(-?\d{1,3})[\s,]+(-?\d{1,3})$/.exec(line);
  if (stick) {
    const x = Number(stick[1]),
      y = Number(stick[2]);
    return [
      { btn: "left", down: x <= -50 },
      { btn: "right", down: x >= 50 },
      { btn: "up", down: y <= -50 },
      { btn: "down", down: y >= 50 },
    ];
  }
  const button = /^([UDLRABSX])\s*([01])$/.exec(line);
  if (!button) return [];
  return [{ btn: serialLetters[button[1]], down: button[2] === "1" }];
}

type PadLike = {
  mapping: string;
  buttons: readonly { pressed: boolean }[];
  axes: readonly number[];
};
export function readPad(pad: PadLike): Set<Btn> {
  const on = (i: number) => !!pad.buttons[i]?.pressed;
  const held = new Set<Btn>();
  const [x = 0, y = 0] = pad.axes;
  if (x < -0.5 || on(14)) held.add("left");
  if (x > 0.5 || on(15)) held.add("right");
  if (y < -0.5 || on(12)) held.add("up");
  if (y > 0.5 || on(13)) held.add("down");
  if (on(0)) held.add("a");
  if (on(1)) held.add("b");
  if (on(2) || on(3)) held.add("x");
  if (on(9) || on(8)) held.add("start");
  return held;
}

export type Devices = {
  last: Source;
  pad: boolean;
  serial: "unsupported" | "off" | "connecting" | "on";
};
type SerialPortLike = {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};
type SerialLike = {
  getPorts(): Promise<SerialPortLike[]>;
  requestPort(): Promise<SerialPortLike>;
};

function makeInput() {
  const held: Record<Source, Set<Btn>> = {
    keys: new Set(),
    pad: new Set(),
    serial: new Set(),
  };
  const handlers: Handler[] = [];
  const listeners = new Set<() => void>();
  let devices: Devices = { last: "keys", pad: false, serial: "off" };
  let started = false;
  let port: SerialPortLike | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  const encoder = new TextEncoder();
  const opened = new Set<() => void>();
  const publish = (change: Partial<Devices>) => {
    if (
      (Object.keys(change) as (keyof Devices)[]).every(
        (k) => devices[k] === change[k],
      )
    )
      return;
    devices = { ...devices, ...change };
    listeners.forEach((f) => f());
  };
  function emit(press: Press) {
    publish({ last: press.source });
    for (let i = handlers.length - 1; i >= 0; i--)
      if (handlers[i](press)) return true;
    return false;
  }
  function set(source: Source, btn: Btn, down: boolean) {
    const had = held[source].has(btn);
    if (down === had) return;
    if (down) {
      held[source].add(btn);
      emit({ btn, source });
    } else held[source].delete(btn);
  }
  function keyDown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const btn = keyToButton(e.key);
    if (!btn) return;
    if (e.repeat) {
      if (isDirection(btn)) e.preventDefault();
      return;
    }
    held.keys.add(btn);
    if (emit({ btn, source: "keys", key: e.key })) e.preventDefault();
  }
  function keyUp(e: KeyboardEvent) {
    const btn = keyToButton(e.key);
    if (btn) held.keys.delete(btn);
    // A second key can share a button (W and ArrowUp); releasing either lets go.
  }
  function poll() {
    if (!started) return;
    let now = new Set<Btn>(),
      found = false;
    try {
      for (const pad of navigator.getGamepads?.() ?? [])
        if (pad?.connected) {
          found = true;
          now = new Set([...now, ...readPad(pad)]);
        }
    } catch {
      /* Gamepads are optional. */
    }
    publish({ pad: found });
    for (const btn of buttons) set("pad", btn, now.has(btn));
    requestAnimationFrame(poll);
  }
  async function listen(next: SerialPortLike) {
    publish({ serial: "connecting" });
    try {
      await next.open({ baudRate: 115200 });
      port = next;
      writer = next.writable?.getWriter() ?? null;
      publish({ serial: "on" });
      // The ESP32 restarts when the port opens. Give it time, then redraw its screen.
      setTimeout(() => opened.forEach((f) => f()), 2000);
      const reader = next.readable!.getReader();
      const text = new TextDecoder();
      let buffer = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += text.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = (lines.pop() ?? "").slice(-64);
          for (const line of lines)
            for (const c of parseSerialLine(line)) set("serial", c.btn, c.down);
        }
      } finally {
        reader.releaseLock();
      }
    } catch {
      /* Unplugged or busy. The keyboard still works. */
    }
    held.serial.clear();
    try {
      writer?.releaseLock();
    } catch {
      /* Already released. */
    }
    writer = null;
    try {
      await next.close();
    } catch {
      /* Already closed. */
    }
    port = null;
    publish({ serial: "off" });
  }
  const serial = () =>
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & { serial?: SerialLike }).serial;
  return {
    start() {
      if (started || typeof window === "undefined") return;
      started = true;
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", keyUp);
      window.addEventListener("blur", () => held.keys.clear());
      requestAnimationFrame(poll);
      const api = serial();
      if (!api) return publish({ serial: "unsupported" });
      // A controller that was allowed before reconnects by itself.
      void api
        .getPorts()
        .then((ports) => {
          if (ports[0] && !port) void listen(ports[0]);
        })
        .catch(() => {});
    },
    /** Must be called from a click or key press. The browser shows its own picker. */
    async connectSerial() {
      const api = serial();
      if (!api || port) return;
      try {
        void listen(await api.requestPort());
      } catch {
        /* The picker was closed. */
      }
    },
    /** Sends one line to the controller's display and lights. Does nothing when unplugged. */
    send(line: string) {
      if (!writer) return;
      void writer.write(encoder.encode(line + "\n")).catch(() => {});
    },
    /** Runs after a controller connects and has had time to restart. */
    onOpen(f: () => void) {
      opened.add(f);
      return () => {
        opened.delete(f);
      };
    },
    held: (btn: Btn) =>
      held.keys.has(btn) || held.pad.has(btn) || held.serial.has(btn),
    /** Adds a handler on top of the stack; returns its remover. */
    push(handler: Handler) {
      handlers.push(handler);
      return () => {
        const i = handlers.lastIndexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      };
    },
    devices: () => devices,
    subscribe(f: () => void) {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
  };
}
export const input = makeInput();
export const noDevices: Devices = { last: "keys", pad: false, serial: "off" };

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex="0"]';
export function focusables(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>(focusable)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
  );
}
/** Where focus lands when nothing is focused: the marked or main control, never a close button. */
function home(root: ParentNode, items: HTMLElement[]) {
  return (
    root.querySelector<HTMLElement>(
      "[data-autofocus]:not([disabled]), [data-next], .primary",
    ) ??
    items.find((el) => !el.classList.contains("icon-btn")) ??
    items[0]
  );
}
/** Moves focus to the next or previous control inside root, wrapping around. */
export function stepFocus(root: ParentNode, delta: 1 | -1) {
  const items = focusables(root);
  if (!items.length) return;
  const at = items.indexOf(document.activeElement as HTMLElement);
  const next =
    at < 0
      ? home(root, items)
      : items[(at + delta + items.length) % items.length];
  next.focus();
  next.scrollIntoView({ block: "nearest" });
}
/** Presses the focused control. Enter and Space on a keyboard keep their native behavior. */
export function pressFocused(root: ParentNode, press: Press) {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body || !root.contains(el)) {
    const items = focusables(root);
    if (items.length) home(root, items).focus();
    return true;
  }
  const checkbox = el instanceof HTMLInputElement;
  if (
    press.source === "keys" &&
    (press.key === " " || (press.key === "Enter" && !checkbox))
  )
    return false;
  el.click();
  return true;
}
/** Standard menu behavior: directions move focus, A presses, B or Start goes back. */
export function menuHandler(
  root: () => ParentNode | null,
  back?: () => void,
): Handler {
  return (press) => {
    const el = root();
    if (!el) return false;
    switch (press.btn) {
      case "up":
      case "left":
        stepFocus(el, -1);
        return true;
      case "down":
      case "right":
        stepFocus(el, 1);
        return true;
      case "a":
        return pressFocused(el, press);
      case "b":
      case "start":
        back?.();
        return true;
      default:
        return true;
    }
  };
}
