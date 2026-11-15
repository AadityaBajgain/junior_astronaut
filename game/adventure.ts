import type { MissionId } from "./missions";

// Pure rules for the four Moon missions. Only an arrival at an action station
// changes anything; time, walking and jumping never spend supplies.
export type Spot = "left" | "middle" | "right";
export type Cargo = "none" | "battery" | "camera";
type Common = { message: string; steps: number; done: boolean };
export type Run = Common &
  (
    | { id: "go"; air: boolean; suit: boolean; kit: Cargo; fuel: number }
    | {
        id: "land";
        phase: "arrival" | "day" | "night";
        site: "plain" | "rim";
        sun: number;
        battery: number;
        maps: number;
        fan: boolean;
        stalled: boolean;
        nights: number;
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
        water: number;
        rested: boolean;
      }
    | {
        id: "explore";
        away: boolean;
        power: number;
        samples: number;
        camera: boolean;
        air: number;
        rescued: boolean;
      }
  );
export const limits = {
  fuel: 3,
  nights: 2,
  landBattery: 2,
  liveBattery: 3,
  water: 4,
  food: 2,
  roverPower: 4,
  suitAir: 6,
  rocks: 3,
};

export const goals: Record<MissionId, string> = {
  go: "Pack, fuel up and launch",
  land: "Keep the air fan on for 2 nights",
  live: "Grow 2 space salads",
  explore: "Bring Moon rocks home",
};
/** The harder second star. It rewards planning, never speed. */
export const expertGoals: Record<MissionId, string> = {
  go: "Launch with both cargo spaces full",
  land: "Scan 2 craters and never let the fan stop",
  live: "Grow both salads and never let the fan rest",
  explore: "Bring home 3 rocks without a rescue",
};
export function expert(s: Run): boolean {
  if (!s.done) return false;
  switch (s.id) {
    case "go":
      return s.air && s.kit !== "none";
    case "land":
      return s.maps >= 2 && !s.stalled;
    case "live":
      return !s.rested;
    case "explore":
      return s.samples >= limits.rocks && !s.rescued;
  }
}
export const questions: Record<MissionId, string> = {
  go: "What did you leave room for?",
  land: "What kept the fan on in the dark?",
  live: "What helped your leaves grow?",
  explore: "What made you turn back?",
};
export function begin(id: MissionId, cargo: Cargo = "none"): Run {
  const base = { done: false, steps: 0 };
  switch (id) {
    case "go":
      return {
        ...base,
        id,
        air: false,
        suit: false,
        kit: "none",
        fuel: 0,
        message: "Our ship has two cargo spaces. Pack air so we can breathe!",
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
        nights: 0,
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
        water: limits.water,
        rested: false,
        message:
          "The crew needs two salads. Walk to the garden bed and plant a seed.",
      };
    case "explore":
      return {
        ...base,
        id,
        away: false,
        power: limits.roverPower,
        samples: 0,
        camera: cargo === "camera",
        air: limits.suitAir,
        rescued: false,
        message:
          cargo === "camera"
            ? "Your camera is here! Hop in the Moon rover to photograph rocks."
            : "Hop in the Moon rover. Watch your suit air and rover battery!",
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
          !s.air ? "Pack air" : !s.suit ? "Check suit" : "Suit ready",
          !s.air
            ? "Fills one cargo space"
            : !s.suit
              ? "Test it before launch"
              : "Air and suit are set",
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
        station(
          "right",
          "SHIP",
          s.fuel < limits.fuel ? "Pump fuel" : "Blast off",
          s.fuel < limits.fuel
            ? "Tank " + s.fuel + " of " + limits.fuel
            : "Needs air and a checked suit",
        ),
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
        station(
          "left",
          "WATER",
          "Give water",
          s.water + " of " + limits.water + " drinks left",
        ),
        station(
          "middle",
          "SWITCH",
          s.route === "lamp" ? "Charge instead" : "Light the lamp",
          s.route === "lamp" ? "Sun fills the battery" : "Help the seed grow",
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
        station(
          "left",
          "SHELTER",
          "Go to shelter",
          "The ride home uses one spark",
        ),
        station(
          "middle",
          "ROVER",
          s.away ? "Charge rover" : "Drive out",
          s.away ? "+2 sparks, uses 1 suit air" : "Uses one spark",
        ),
        station(
          "right",
          "ROCKS",
          s.camera ? "Rock + photo" : "Pick up a rock",
          "Uses 1 spark and 1 suit air",
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

export function act(s: Run, spot: Spot): Run {
  if (s.done) return s;
  switch (s.id) {
    case "go": {
      if (spot === "left") {
        if (!s.air)
          return advance(
            s,
            { air: true },
            "Air is on board! Now check your space suit here.",
          );
        if (!s.suit)
          return advance(
            s,
            { suit: true },
            "Suit check passed! No leaks. Pick your gear and fuel the ship.",
          );
        return hint(s, "Air and suit are ready. Fuel the ship to launch!");
      }
      if (spot === "middle") {
        const kit = s.kit === "battery" ? "camera" : "battery";
        return advance(
          s,
          { kit },
          kit === "battery"
            ? "Battery packed! It will help on the Moon. Or swap it for a camera."
            : "Camera packed! We can take rock photos on the Moon.",
        );
      }
      if (s.fuel < limits.fuel) {
        const fuel = s.fuel + 1;
        return advance(
          s,
          { fuel },
          fuel === limits.fuel
            ? "The tank is full! The Moon is a long trip away."
            : "Glug! Tank " + fuel + " of " + limits.fuel + ". Keep pumping.",
        );
      }
      if (!s.air)
        return hint(s, "Wait! We need air to breathe. Bring the tank.");
      if (!s.suit)
        return hint(s, "Wait! Check your space suit at the air station first.");
      return advance(
        s,
        { done: true },
        s.kit === "none"
          ? "Liftoff! You brought air and left one space empty."
          : s.kit === "battery"
            ? "Liftoff! Your spare battery is coming to the Moon."
            : "Liftoff! Your camera is coming on the rock hunt.",
      );
    }
    case "land": {
      const refill = s.site === "plain" ? 1 : 2;
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
            battery: Math.min(limits.landBattery, s.battery + Number(flat)),
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
        if (!s.fan)
          return advance(
            s,
            { phase: "day", sun: refill, fan: true },
            "Good morning! Save a sun spark in the battery this time.",
          );
        const nights = s.nights + 1;
        if (nights >= limits.nights)
          return advance(
            s,
            { done: true, nights },
            "Two nights done! Your saved power kept the air fan spinning.",
          );
        return advance(
          s,
          { phase: "day", sun: refill, nights },
          "Morning! One night down, one to go. Plan your sparks again.",
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
            ? "It’s dark and very cold! Your battery turns the air fan."
            : "The fan is still. Our air packs help us wait for morning.",
        );
      }
      if (!s.sun)
        return hint(
          s,
          "All the spare sunshine is used. Visit the cabin to start night.",
        );
      if (spot === "left") {
        if (s.battery >= limits.landBattery)
          return hint(s, "The battery is full. The dish can use the sunshine.");
        return advance(
          s,
          { battery: s.battery + 1, sun: s.sun - 1 },
          "One spark saved for night. The dish waits for its turn.",
        );
      }
      return advance(
        s,
        { maps: s.maps + 1, sun: s.sun - 1 },
        s.maps
          ? "Another dark crater mapped! Ice may hide in the shadows."
          : "The dish mapped a dark crater! That spark went to science.",
      );
    }
    case "live": {
      if (spot === "left") {
        if (!s.planted) return hint(s, "Put a seed in the garden first.");
        if (s.wet) return hint(s, "The soil is wet. Try the next shift.");
        if (!s.water) return hint(s, "The water tank is empty.");
        return advance(
          s,
          { wet: true, water: s.water - 1 },
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
            : "Battery connected. Sunny shifts will charge it by two.",
        );
      }
      if (!s.planted)
        return advance(
          s,
          { planted: true },
          "A seed is tucked into Moon soil! Give it a drink.",
        );
      if (s.growth === 2) {
        const food = s.food + 1;
        if (food >= limits.food)
          return advance(
            s,
            { done: true, food },
            "Crunch! Two salads. Water, light and time fed your crew.",
          );
        return advance(
          s,
          { food, planted: false, wet: false, growth: 0 },
          "One salad picked! The crew needs one more. Plant again.",
        );
      }
      // Sunny shift: the Sun runs the fan and gives one spare spark.
      // Dark shift: the fan takes one battery spark first.
      let battery = s.battery;
      let available: number;
      if (s.sunny) available = 1;
      else {
        battery = Math.max(0, battery - 1);
        available = battery;
      }
      const lit = s.route === "lamp" && available > 0;
      if (lit && !s.sunny) battery--;
      if (s.route === "battery" && s.sunny)
        battery = Math.min(limits.liveBattery, battery + 2);
      const grows = s.wet && lit;
      const growth = s.growth + Number(grows);
      const rest = !s.sunny && !s.battery;
      let message = "The seed waits. Give it water and turn the lamp on.";
      if (grows)
        message =
          growth === 1
            ? "A sprout! It drank the water. Give it another drink."
            : "Big green leaves! Pick your space salad.";
      else if (rest)
        message =
          "No sun and no battery. The fan rested. Our air packs helped. The Sun is back!";
      else if (s.route === "battery" && s.sunny)
        message = "Sunlight charged the battery. The lamp and plant waited.";
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
          rested: s.rested || rest,
        },
        message,
      );
    }
    case "explore": {
      if (spot === "middle" && !s.away)
        return advance(
          s,
          { away: true, power: s.power - 1 },
          "Off we go! Each job outside uses suit air. Pick up a rock.",
        );
      if (!s.away) return hint(s, "Hop in the Moon rover first.");
      if (spot === "left") {
        if (!s.samples)
          return hint(s, "Find one rock so we have a sample to bring home.");
        return advance(
          s,
          { done: true, away: false, power: s.power - 1 },
          s.samples >= limits.rocks
            ? "Three rocks home! You planned your power and air like a pro."
            : "Home safe with " +
                s.samples +
                (s.samples === 1 ? " rock!" : " rocks!") +
                " You saved air for the trip back.",
        );
      }
      let next: Run;
      if (spot === "middle") {
        if (s.power >= limits.roverPower)
          return hint(s, "The rover battery is full. Go find a rock!");
        next = advance(
          s,
          {
            power: Math.min(limits.roverPower, s.power + 2),
            air: s.air - 1,
          },
          "The rover’s panels soaked up sunlight. That took some suit air.",
        );
      } else {
        if (s.samples >= limits.rocks)
          return hint(s, "The sample bag is full. Head to the shelter!");
        if (s.power <= 1)
          return hint(
            s,
            "That last spark is for the ride home. Charge the rover or head back.",
          );
        const samples = s.samples + 1;
        next = advance(
          s,
          { samples, power: s.power - 1, air: s.air - 1 },
          samples === limits.rocks
            ? "Three rocks! The bag is full. Drive to the shelter."
            : "Rock " + samples + " is in the bag! Check your air and battery.",
        );
      }
      if (next.id !== "explore" || next.air > 0) return next;
      // Out of suit air: a safe automatic ride home, never an injury.
      return next.samples
        ? {
            ...next,
            done: true,
            away: false,
            rescued: true,
            samples: 1,
            message:
              "Suit air ran low, so NOVA drove you home fast. One rock made it back.",
          }
        : {
            ...next,
            away: false,
            rescued: true,
            air: limits.suitAir,
            power: limits.roverPower,
            message:
              "Suit air ran low, so NOVA drove you home. Fresh air is loaded. Try again!",
          };
    }
  }
}

/** The fact card a move unlocks, if any. Cards appear by themselves during play. */
export function milestone(before: Run, after: Run): string | null {
  if (after.steps === before.steps) return null;
  switch (after.id) {
    case "go": {
      const b = before as typeof after;
      if (after.done) return "go-launch";
      if (after.fuel === limits.fuel && b.fuel < limits.fuel) return "go-fuel";
      if (after.air && !b.air) return "go-air";
      return null;
    }
    case "land": {
      const b = before as typeof after;
      if (b.phase === "arrival") return "land-touchdown";
      if (after.maps === 1 && b.maps === 0) return "land-scan";
      if (after.phase === "night" && after.fan && after.nights === 0)
        return "land-night";
      return null;
    }
    case "live": {
      const b = before as typeof after;
      if (after.planted && !b.planted && after.food === 0) return "live-plant";
      if (after.growth === 1 && b.growth === 0 && after.food === 0)
        return "live-sprout";
      if (after.food === 1 && b.food === 0) return "live-harvest";
      return null;
    }
    case "explore": {
      const b = before as typeof after;
      if (after.away && !b.away) return "explore-drive";
      if (after.samples === 1 && b.samples === 0) return "explore-rock";
      if (after.done) return "explore-home";
      return null;
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
        ["Fuel", s.fuel + "/" + limits.fuel],
        ["Suit", s.suit ? "OK" : "Not checked"],
      ];
    case "land":
      return [
        ["Sun", String(s.sun)],
        ["Battery", s.battery + "/" + limits.landBattery],
        ["Scans", String(s.maps)],
        ["Nights", s.nights + "/" + limits.nights],
      ];
    case "live":
      return [
        ["Shift", s.sunny ? "Sun" : "Dark"],
        ["Battery", s.battery + "/" + limits.liveBattery],
        [
          "Bed",
          s.growth === 2
            ? "Leafy"
            : s.growth === 1
              ? "Sprout"
              : s.planted
                ? "Seed"
                : "Empty",
        ],
        ["Water", s.water + "/" + limits.water],
        ["Salads", s.food + "/" + limits.food],
      ];
    case "explore":
      return [
        ["Battery", s.power + "/" + limits.roverPower],
        ["Suit air", s.air + "/" + limits.suitAir],
        ["Rocks", s.samples + "/" + limits.rocks],
        ...(s.camera
          ? [["Photos", String(s.samples)] as [string, string]]
          : []),
      ];
  }
}
