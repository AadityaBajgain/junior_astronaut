import type { MissionId } from "./missions";

export type Spot = "left" | "middle" | "right";
export type Cargo = "none" | "battery" | "camera";
type Common = { message: string; steps: number; done: boolean };
export type Run = Common &
  (
    | { id: "go"; air: boolean; kit: Cargo }
    | {
        id: "land";
        phase: "arrival" | "day" | "night";
        site: "plain" | "rim";
        sun: number;
        battery: number;
        maps: number;
        fan: boolean;
        stalled: boolean;
      }
    | {
        id: "live";
        planted: boolean;
        wet: boolean;
        growth: number;
        sunny: boolean;
        route: "lamp" | "battery";
        battery: number;
        food: number;
        rested: boolean;
      }
    | {
        id: "explore";
        away: boolean;
        power: number;
        samples: number;
        camera: boolean;
      }
  );

export const goals: Record<MissionId, string> = {
  go: "Pack for the Moon",
  land: "Keep the air fan on",
  live: "Grow a space salad",
  explore: "Bring a space rock home",
};
export const questions: Record<MissionId, string> = {
  go: "What did you leave room for?",
  land: "What kept the fan on in the dark?",
  live: "What helped your leaf grow?",
  explore: "Why did you turn back?",
};
export function begin(id: MissionId, cargo: Cargo = "none"): Run {
  const base = { done: false, steps: 0 };
  switch (id) {
    case "go":
      return {
        ...base,
        id,
        air: false,
        kit: "none",
        message: "Our ship has two spaces. Pack air so we can breathe!",
      };
    case "land":
      return {
        ...base,
        id,
        phase: "arrival",
        site: "plain",
        battery: Number(cargo === "battery"),
        sun: 0,
        fan: false,
        stalled: false,
        maps: 0,
        message:
          cargo === "battery"
            ? "Your spare battery made it! Pick a place for our Moon home."
            : "Pick a place for our Moon home. Look for sun or a spare battery!",
      };
    case "live":
      return {
        ...base,
        id,
        planted: false,
        wet: false,
        growth: 0,
        sunny: true,
        route: "lamp",
        battery: 1,
        food: 0,
        rested: false,
        message: "Let’s grow lunch! Walk to the garden bed to plant a seed.",
      };
    case "explore":
      return {
        ...base,
        id,
        away: false,
        power: 4,
        samples: 0,
        camera: cargo === "camera",
        message:
          cargo === "camera"
            ? "Your camera is here! Ride out to take a rock photo."
            : "Hop in the rover. Let’s find a rock and bring it home!",
      };
  }
}

export type Station = { spot: Spot; label: string; hint: string; sign: string };
function station(
  spot: Spot,
  sign: string,
  label: string,
  hint: string,
): Station {
  return { spot, label, hint, sign };
}
export function stations(s: Run): Station[] {
  if (s.done) return [];
  switch (s.id) {
    case "go":
      return [
        station(
          "left",
          "AIR",
          s.air ? "Check air" : "Pack air",
          s.air ? "Already on board" : "Fills one space",
        ),
        station(
          "middle",
          "GEAR",
          s.kit === "battery"
            ? "Swap for camera"
            : s.kit === "camera"
              ? "Swap for battery"
              : "Pack battery",
          s.kit === "battery" ? "Take rock photos" : "Save Moon power",
        ),
        station("right", "SHIP", "Blast off", "Bring your air tank"),
      ];
    case "land":
      if (s.phase === "arrival")
        return [
          station(
            "left",
            "FLAT PAD",
            "Land on flat ground",
            "A spare battery here",
          ),
          station(
            "right",
            "SUNNY RIM",
            "Land in the sun",
            "More sunlight here",
          ),
        ];
      if (s.phase === "night")
        return [
          station(
            "middle",
            "CABIN",
            s.fan ? "Greet the Sun" : "Try a new day",
            s.fan ? "Finish the night" : "Sun refills the panel",
          ),
        ];
      return [
        station("left", "SOLAR", "Charge battery", "Save one sun spark"),
        station("middle", "CABIN", "Start night", "Air needs one spark"),
        station("right", "DISH", "Scan a crater", "Spend one sun spark"),
      ];
    case "live":
      return [
        station("left", "WATER", "Give water", "Wet the soil"),
        station(
          "middle",
          "SWITCH",
          s.route === "lamp" ? "Charge instead" : "Light the lamp",
          s.route === "lamp" ? "Save spare sun" : "Help the seed grow",
        ),
        station(
          "right",
          "GARDEN",
          !s.planted
            ? "Plant seed"
            : s.growth >= 2
              ? "Pick lettuce"
              : "Next shift",
          !s.planted
            ? "Start your garden"
            : s.growth >= 2
              ? "Lunch for the crew"
              : s.sunny
                ? "Use this sunny turn"
                : "Use this dark turn",
        ),
      ];
    case "explore":
      return [
        station("left", "SHELTER", "Go to shelter", "Keep one spark to return"),
        station(
          "middle",
          "ROVER",
          s.away ? "Check rover" : "Drive out",
          s.away ? "See the battery" : "Use one spark",
        ),
        station(
          "right",
          "ROCKS",
          s.camera ? "Rock + photo" : "Pick up a rock",
          "Use one spark",
        ),
      ];
  }
}
const hint = (s: Run, message: string): Run => ({ ...s, message });
const advance = <T extends Run>(
  s: T,
  change: Partial<T>,
  message: string,
): T => ({ ...s, ...change, steps: s.steps + 1, message });

// Only an arrival at an action station advances the simulation.
export function act(s: Run, spot: Spot): Run {
  if (s.done) return s;
  switch (s.id) {
    case "go": {
      if (spot === "left")
        return s.air
          ? hint(s, "The air tank is on board. Pick your gear or blast off!")
          : advance(
              s,
              { air: true },
              "Air is on board! Take a battery or swap it for a camera.",
            );
      if (spot === "middle") {
        const kit = s.kit === "battery" ? "camera" : "battery";
        return advance(
          s,
          { kit },
          kit === "battery"
            ? "Battery packed! Take it to the Moon, or swap it for a camera."
            : "Camera packed! We can take rock photos on Mars.",
        );
      }
      return s.air
        ? advance(
            s,
            { done: true },
            s.kit === "none"
              ? "Liftoff! You brought air and left one space empty."
              : s.kit === "battery"
                ? "Liftoff! Your spare battery is coming to the Moon."
                : "Liftoff! Your camera is coming on the rock hunt.",
          )
        : hint(s, "Wait! We need air to breathe. Bring the blue tank.");
    }
    case "land": {
      if (s.phase === "arrival") {
        if (spot === "middle")
          return hint(s, "Pick the flat pad or the sunny rim.");
        const flat = spot === "left";
        return advance(
          s,
          {
            phase: "day",
            site: flat ? "plain" : "rim",
            sun: flat ? 1 : 2,
            battery: Math.min(2, s.battery + Number(flat)),
            fan: true,
          },
          flat
            ? "Touchdown! We found a battery. The fan is on. One sun spark is free."
            : "Touchdown! The Sun runs our fan. Spend two spare sparks before night.",
        );
      }
      if (s.phase === "night") {
        if (spot !== "middle")
          return hint(s, "Visit the cabin to see the morning.");
        if (s.fan)
          return advance(
            s,
            { done: true },
            "You saved power. The air fan spun all night!",
          );
        return advance(
          s,
          { phase: "day", sun: s.site === "plain" ? 1 : 2, fan: true },
          "Good morning! Save one sun spark in the battery this time.",
        );
      }
      if (spot === "middle") {
        const fan = s.battery > 0;
        return advance(
          s,
          {
            phase: "night",
            sun: 0,
            battery: Math.max(0, s.battery - 1),
            fan,
            stalled: s.stalled || !fan,
          },
          fan
            ? "It’s dark! Your battery is turning the air fan. See it spin?"
            : "The fan is still. Our air packs help us wait for morning.",
        );
      }
      if (!s.sun)
        return hint(
          s,
          "All the spare sunshine is used. Visit the cabin to start night.",
        );
      if (spot === "left") {
        if (s.battery >= 2)
          return hint(
            s,
            "The battery is full. The dish can use the spare sunshine.",
          );
        return advance(
          s,
          { battery: s.battery + 1, sun: s.sun - 1 },
          "One spark saved for night. The dish waits for its turn.",
        );
      }
      return advance(
        s,
        { maps: s.maps + 1, sun: s.sun - 1 },
        "The dish found a crater! That spark went to the dish.",
      );
    }
    case "live": {
      if (spot === "left") {
        if (!s.planted) return hint(s, "Put a seed in the garden first.");
        if (s.wet) return hint(s, "The soil is wet. Try the next shift.");
        return advance(
          s,
          { wet: true },
          "Splash! The soil is wet. A seed needs light and time, too.",
        );
      }
      if (spot === "middle") {
        const route = s.route === "lamp" ? "battery" : "lamp";
        return advance(
          s,
          { route },
          route === "lamp"
            ? "Lamp connected. Spare power will help wet seeds grow."
            : "Battery connected. The lamp will wait this shift.",
        );
      }
      if (!s.planted)
        return advance(
          s,
          { planted: true },
          "A seed is tucked in! Give it a drink.",
        );
      if (s.growth === 2)
        return advance(
          s,
          { done: true, food: 1 },
          "Crunch! Water, light and time grew lunch for your crew.",
        );
      // Two daytime sparks, zero at night. Air takes the first spark.
      let battery = s.battery;
      let available: number;
      if (s.sunny) available = 1;
      else {
        battery = Math.max(0, battery - 1);
        available = battery;
      }
      const lit = s.route === "lamp" && available > 0;
      if (lit && !s.sunny) battery--;
      if (s.route === "battery" && s.sunny) battery = Math.min(2, battery + 1);
      const grows = s.wet && lit;
      const growth = s.growth + Number(grows);
      let message = "The seed waits. Give it water and turn the lamp on.";
      if (grows)
        message =
          growth === 1
            ? "A sprout! It drank the water. Give it another drink."
            : "Big green leaves! Pick your space salad.";
      else if (!s.sunny && !s.battery)
        message =
          "No sun or battery. The fan and lamp rested. Our air packs helped. The Sun is back!";
      else if (s.route === "battery" && s.sunny)
        message = "Power went to the battery. The lamp and plant waited.";
      else if (!lit)
        message =
          "The plant waited. The fan got power first. Try a sunny turn.";
      return advance(
        s,
        {
          growth,
          wet: s.wet && !grows,
          sunny: !s.sunny,
          battery,
          rested: s.rested || (!s.sunny && !s.battery),
        },
        message,
      );
    }
    case "explore": {
      if (spot === "middle")
        return s.away
          ? hint(s, "Save the last spark for the ride home.")
          : advance(
              s,
              { away: true, power: 3 },
              "Off we go! Pick a rock to bring back.",
            );
      if (!s.away) return hint(s, "Hop in the rover first.");
      if (spot === "left") {
        if (!s.samples)
          return hint(s, "Find one rock so we have a sample to bring home.");
        return advance(
          s,
          { done: true, away: false, power: s.power - 1 },
          s.samples === 1
            ? "Home with one rock! You took shelter early in our practice storm."
            : "Two rocks came home! You spent one more turn outside and used your last spark.",
        );
      }
      if (s.power <= 1)
        return hint(
          s,
          "That last spark is for the ride home. Head to shelter!",
        );
      const samples = s.samples + 1;
      return advance(
        s,
        { samples, power: s.power - 1 },
        samples === 1
          ? "Rock found! Practice storm ahead. Take shelter or stay for one more rock."
          : "Two rocks! Just enough power to drive home. Head to shelter.",
      );
    }
  }
}

export function meters(s: Run): [string, string][] {
  switch (s.id) {
    case "go":
      return [
        ["Cargo", Number(s.air) + Number(s.kit !== "none") + "/2"],
        [
          "Kit",
          s.kit === "none"
            ? "Empty"
            : s.kit === "battery"
              ? "Battery"
              : "Camera",
        ],
      ];
    case "land":
      return [
        ["Sun", String(s.sun)],
        ["Battery", s.battery + "/2"],
        ["Scans", String(s.maps)],
      ];
    case "live":
      return [
        ["Shift", s.sunny ? "Sun" : "Dark"],
        ["Battery", s.battery + "/2"],
        [
          "Bed",
          s.food
            ? "Picked"
            : s.growth === 2
              ? "Leafy"
              : s.growth === 1
                ? "Sprout"
                : s.planted
                  ? "Seed"
                  : "Empty",
        ],
      ];
    case "explore":
      return [
        ["Battery", s.power + "/4"],
        ["Rocks", s.samples + "/2"],
        ...(s.camera
          ? [["Photos", String(s.samples)] as [string, string]]
          : []),
      ];
  }
}
