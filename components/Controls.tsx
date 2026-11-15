"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Check, Rocket, X } from "lucide-react";
import { initial, makeStore, type Preferences } from "../game/state";

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
    return () => {
      dialog.close();
      origin?.focus({ preventScroll: true });
    };
  }, []);
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
export function chime() {
  try {
    const ctx = new AudioContext(),
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.055);
    gain.gain.setValueAtTime(0.038, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* Audio is optional. */
  }
}
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
      <button className="primary" onClick={close}>
        Done <Check size={18} />
      </button>
    </Dialog>
  );
}
