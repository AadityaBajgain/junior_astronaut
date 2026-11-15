// Real findings shown inside the game. Each one was read on its source page on
// November 15, 2026. Game units (sparks, hearts, stars) are never mixed in here.
export type Fact = {
  id: string;
  topic: string;
  kid: string;
  detail: string;
  agency: string;
  link: string;
};
export const facts: Fact[] = [
  {
    id: "water",
    topic: "Air and water",
    kid: "On the Space Station, 98% of the crew’s water is cleaned and used again. Even sweat!",
    detail:
      "NASA reported in June 2023 that the station’s life support system reached its 98% water recovery goal.",
    agency: "NASA",
    link: "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/",
  },
  {
    id: "exercise",
    topic: "Crew health",
    kid: "Station astronauts exercise about two hours every day to keep muscles and bones strong.",
    detail:
      "NASA says crew members average two hours of exercise per day on the International Space Station.",
    agency: "NASA",
    link: "https://www.nasa.gov/general/astronaut-exercise/",
  },
  {
    id: "bones",
    topic: "Crew health",
    kid: "With no weight to carry, bones get about 1% weaker each month in space unless astronauts protect them.",
    detail:
      "NASA: weight-bearing bones become roughly 1% less dense for every month in space without precautions.",
    agency: "NASA",
    link: "https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/",
  },
  {
    id: "moon-dose",
    topic: "Radiation",
    kid: "A lander measured radiation on the Moon: about 1.37 mSv each day. That is why crews plan shelters.",
    detail:
      "The LND instrument on the Chang’E-4 lander measured an average of 1,369 microsieverts per day in 2019 (Zhang et al., Science Advances, 2020). It is not a NASA instrument.",
    agency: "Chang’E-4 LND",
    link: "https://www.sci.news/space/radiation-dose-rates-lunar-surface-08893.html",
  },
  {
    id: "moon-temps",
    topic: "Power",
    kid: "In full Sun the Moon reaches about 127°C. In the dark it falls to about −173°C. Night needs saved power.",
    detail:
      "NASA: the Moon reaches about 260°F (127°C) in full Sun and about −280°F (−173°C) in darkness.",
    agency: "NASA",
    link: "https://science.nasa.gov/moon/facts/",
  },
  {
    id: "storm-week",
    topic: "Sun storms",
    kid: "The storms in this game are real. NASA’s storm list recorded them in May 2024.",
    detail:
      "NASA DONKI lists instrument-recorded solar energetic particle events on May 10, 11 and 13, 2024.",
    agency: "NASA CCMC DONKI",
    link: "https://ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP?startDate=2024-05-08&endDate=2024-05-13",
  },
  {
    id: "lettuce",
    topic: "Food",
    kid: "NASA grows red lettuce in a space garden called Veggie. Astronauts need light, water and patience too.",
    detail:
      "NASA’s Veggie system was built to grow fresh food such as red romaine lettuce on the Space Station.",
    agency: "NASA",
    link: "https://www.nasa.gov/missions/station/veggie-will-expand-fresh-food-production-on-space-station/",
  },
];

// Measured surface radiation. These are archives, not live readings.
export const surfaceDose = {
  moon: {
    value: 1.37,
    unit: "mSv/day",
    where: "Moon, Von Kármán crater (far side)",
    when: "early 2019",
    by: "Chang’E-4 lander, LND instrument (China and Germany). Not a NASA instrument.",
    exact: "1,369 microsieverts per day (Zhang et al., Science Advances, 2020)",
    link: "https://www.sci.news/space/radiation-dose-rates-lunar-surface-08893.html",
  },
} as const;

// Plain-language words, shown where the words are used.
export const words: [string, string][] = [
  [
    "Radiation",
    "Tiny, fast bits of energy from the Sun and deep space. Too much can hurt living things.",
  ],
  [
    "mSv",
    "Millisievert. A unit that counts how much radiation a body soaks up.",
  ],
  [
    "Sun storm",
    "A burst of speedy particles from the Sun. Scientists call it a solar particle event.",
  ],
  [
    "Gravity",
    "The pull that holds you down. The Moon’s pull is one-sixth of Earth’s, so you feel light and bouncy.",
  ],
  [
    "Regolith",
    "The grey dust and broken rock that covers the Moon. It is the Moon’s soil.",
  ],
  [
    "Life support",
    "The machines that make air and clean water so a crew can live.",
  ],
];
