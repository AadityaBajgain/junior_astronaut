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
    id: "dust",
    topic: "Power",
    kid: "A giant dust storm on Mars blocked the Sun in 2018. The solar-powered rover Opportunity went quiet.",
    detail:
      "NASA: Opportunity stopped communicating after a severe Mars-wide dust storm blanketed its location in June 2018.",
    agency: "NASA",
    link: "https://science.nasa.gov/mission/mer-opportunity/",
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
    id: "mars-dose",
    topic: "Radiation",
    kid: "The Curiosity rover measured radiation on Mars: about 0.67 mSv each day. That is why crews plan shelters.",
    detail:
      "Curiosity’s RAD instrument averaged 0.67 millisieverts per day at Gale Crater, August 2012 to June 2013.",
    agency: "NASA/JPL-Caltech",
    link: "https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/",
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
  mars: {
    value: 0.67,
    unit: "mSv/day",
    where: "Mars, Gale Crater",
    when: "August 2012 to June 2013",
    by: "NASA Curiosity rover, RAD instrument",
    exact: "Average dose equivalent rate, NASA release 13-366",
    link: "https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/",
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
    "Sol",
    "One day on Mars. It is about 40 minutes longer than a day on Earth.",
  ],
  [
    "Life support",
    "The machines that make air and clean water so a crew can live.",
  ],
];
