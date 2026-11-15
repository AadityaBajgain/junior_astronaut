"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Check, Gamepad2, Rocket, Star, Usb, X } from "lucide-react";
import { initial, makeStore, type Preferences } from "../game/state";
import {
  input,
  menuHandler,
  noDevices,
  type Btn,
  type Handler,
} from "../game/input";
import { play } from "../game/sfx";
import { profileStore, type Stars } from "../game/profile";

/** Routes keyboard, gamepad and ESP32 presses to this screen while it is mounted. */
export function useGameInput(handler: Handler) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    input.start();
    return input.push((press) => latest.current(press));
  }, []);
}
export const useDevices = () =>
  useSyncExternalStore(input.subscribe, input.devices, () => noDevices);
export const useProfile = () =>
  useSyncExternalStore(
    profileStore.subscribe,
    profileStore.get,
    profileStore.empty,
  );

const glyphs: Record<"keys" | "pad", Partial<Record<Btn | "move", string>>> = {
  keys: { move: "W A S D / ARROWS", a: "SPACE", b: "ESC", x: "X", start: "P" },
  pad: { move: "STICK", a: "A", b: "B", x: "X", start: "START" },
};
/** A strip of button hints that matches the device the player touched last. */
export function Hints({ items }: { items: [Btn | "move", string][] }) {
  const { last } = useDevices();
  const set = glyphs[last === "keys" ? "keys" : "pad"];
  return (
    <p className="hints" aria-label="Controls">
      {items.map(([btn, label]) => (
        <span key={btn}>
          <kbd>{set[btn]}</kbd> {label}
        </span>
      ))}
    </p>
  );
}
export function StarRow({
  stars,
  names,
  size = 18,
}: {
  stars: Stars;
  names?: readonly string[];
  size?: number;
}) {
  const count = stars.filter(Boolean).length;
  return (
    <span
      className="star-row"
      role="img"
      aria-label={count + " of 3 stars"}
      title={names?.map((n, i) => (stars[i] ? "★ " : "☆ ") + n).join(" · ")}
    >
      {stars.map((on, i) => (
        <Star
          key={i}
          size={size}
          className={on ? "star on" : "star"}
          fill={on ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!,
      origin = document.activeElement as HTMLElement | null;
    dialog.showModal();
    (
      dialog.querySelector<HTMLElement>("[data-autofocus]") ??
      dialog.querySelector<HTMLElement>(".primary")
    )?.focus();
    return () => {
      dialog.close();
      origin?.focus({ preventScroll: true });
    };
  }, []);
  useGameInput((press) => menuHandler(() => ref.current, close)(press));
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialog-body">
        <header>
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close panel">
            <X />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function Brand() {
  return (
    <span className="brand" aria-label="JuniorAstronaut">
      <span className="brand-mark">
        <Rocket size={24} />
      </span>
      <span>
        Junior<span className="gold">Astronaut</span>
      </span>
    </span>
  );
}
export const chime = () => play("ok");
export function usePreferences() {
  const [store] = useState(makeStore);
  const state = useSyncExternalStore(store.subscribe, store.get, () => initial);
  useEffect(() => {
    store.restore();
  }, [store]);
  function toggle(key: keyof Preferences) {
    const value = !store.get().prefs[key];
    store.dispatch({ type: "preference", key, value });
    if (key === "sound" && value) chime();
  }
  return { store, state, toggle };
}
export function Settings({
  prefs,
  toggle,
  close,
}: {
  prefs: Preferences;
  toggle: (key: keyof Preferences) => void;
  close: () => void;
}) {
  const devices = useDevices();
  const [erase, setErase] = useState(false);
  return (
    <Dialog title="Settings" close={close}>
      {(
        [
          ["largeText", "Larger words"],
          ["reducedMotion", "Reduced motion"],
          ["sound", "Game sounds"],
        ] as const
      ).map(([key, name]) => (
        <label className="setting" key={key}>
          <strong>{name}</strong>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={() => toggle(key)}
          />
          <span className="switch" aria-hidden="true">
            {prefs[key] && <Check size={14} />}
          </span>
        </label>
      ))}
      <section className="controller-box" aria-label="Controller">
        <h3>
          <Gamepad2 size={18} /> Controller
        </h3>
        <p>
          Keyboard: <b>ready</b> · Gamepad:{" "}
          <b>{devices.pad ? "connected" : "press any button to wake it"}</b>
        </p>
        {devices.serial === "unsupported" ? (
          <p className="source-meta">
            USB controllers need Chrome or Edge. A Bluetooth keyboard or gamepad
            controller works in every browser.
          </p>
        ) : (
          <button
            className="menu-choice"
            disabled={devices.serial !== "off"}
            onClick={() => void input.connectSerial()}
          >
            <Usb size={17} />
            {devices.serial === "on"
              ? "USB controller connected"
              : devices.serial === "connecting"
                ? "Connecting…"
                : "Connect USB controller"}
          </button>
        )}
      </section>
      <button
        className="menu-choice"
        onClick={() => {
          if (erase) profileStore.reset();
          setErase(!erase);
        }}
      >
        {erase ? "Tap again to erase all stars" : "Erase my stars and badges"}
      </button>
      <button className="primary" onClick={close}>
        Done <Check size={18} />
      </button>
    </Dialog>
  );
}
