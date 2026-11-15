// Fact cards pop up by themselves when the player completes a task.
// Every fact was read on its source page on November 15, 2026. Photos are
// archives from NASA's image library; the caption says what each one shows.
import type { MissionId } from "../game/missions";

export type Card = {
  id: string;
  mission: MissionId;
  /** What the player did to unlock it. */
  task: string;
  title: string;
  kid: string;
  image: string;
  alt: string;
  caption: string;
  credit: string;
  source: string;
};
const lib = (id: string) => "https://images.nasa.gov/details/" + id;
const moonFacts = "https://science.nasa.gov/moon/facts/";

export const cards: Card[] = [
  {
    id: "go-air",
    mission: "go",
    task: "Pack the air tank",
    title: "3 astronauts, one rocket",
    kid: "Three astronauts rode this rocket to the Moon. All three needed air for the whole trip.",
    image: "/art/nasa-go.webp",
    alt: "Apollo 11 rising beside its launch tower, with bright flames and clouds below.",
    caption: "Apollo 11 lifts off, July 16, 1969, Kennedy Space Center.",
    credit: "NASA",
    source: "https://www.nasa.gov/mission/apollo-11/",
  },
  {
    id: "go-fuel",
    mission: "go",
    task: "Fill the fuel tank",
    title: "384,400 km to go",
    kid: "The Moon is about 384,400 kilometers away. That is why the ship needs a full tank!",
    image: "/art/nasa/as08-14-2383.jpg",
    alt: "The blue Earth rising over the grey edge of the Moon.",
    caption: "Earth seen from Apollo 8 near the Moon, December 24, 1968.",
    credit: "NASA/JSC · AS08-14-2383",
    source: moonFacts,
  },
  {
    id: "go-launch",
    mission: "go",
    task: "Blast off",
    title: "People walked on the Moon",
    kid: "Astronauts have walked on the Moon. This is Buzz Aldrin beside his lander in 1969.",
    image: "/art/nasa/as11-40-5903.jpg",
    alt: "An astronaut in a white suit walking on grey ground near a lander leg.",
    caption: "Edwin “Buzz” Aldrin on the Moon, Apollo 11, July 20, 1969.",
    credit: "NASA/JSC · AS11-40-5903",
    source: lib("as11-40-5903"),
  },
  {
    id: "land-touchdown",
    mission: "land",
    task: "Land the cabin",
    title: "A robot landed first",
    kid: "A robot lander called Surveyor 3 reached the Moon first. Later, Apollo 12 astronauts walked over to visit it.",
    image: "/art/nasa-land.webp",
    alt: "An astronaut standing beside the Surveyor 3 lander in a crater.",
    caption: "Surveyor 3 with an Apollo 12 astronaut, November 20, 1969.",
    credit: "NASA/JSC · AS12-48-7121",
    source:
      "https://science.nasa.gov/resource/view-of-surveyor-iii-in-its-crater/",
  },
  {
    id: "land-scan",
    mission: "land",
    task: "Scan a crater",
    title: "Craters that never see the Sun",
    kid: "Some craters near the Moon’s south pole never get sunlight. Scientists study these dark places for water ice.",
    image: "/art/nasa/PIA13523.jpg",
    alt: "A grey map of the Moon’s south pole with deep black shadows in its craters.",
    caption: "The lunar south pole, image released September 27, 2010.",
    credit: "NASA/JPL · PIA13523",
    source: "https://science.nasa.gov/moon/moon-water-and-ices/",
  },
  {
    id: "land-night",
    mission: "land",
    task: "Keep the fan on through a night",
    title: "Hot days, freezing nights",
    kid: "In full Sun the Moon reaches about 127°C. In darkness it drops to about −173°C. Solar panels get no light at night.",
    image: "/art/nasa/PIA18163.jpg",
    alt: "A drawing of a gold spacecraft flying above the grey Moon.",
    caption:
      "Artist’s picture of NASA’s Lunar Reconnaissance Orbiter, which has studied the Moon since 2009.",
    credit: "NASA/JPL · PIA18163",
    source: moonFacts,
  },
  {
    id: "moon-jump",
    mission: "land",
    task: "Jump on the Moon",
    title: "Moon gravity is one-sixth",
    kid: "The Moon pulls only one-sixth as hard as Earth. Your jump goes six times higher and comes down slowly!",
    image: "/art/nasa/as16-113-18339.jpg",
    alt: "An astronaut jumping off the ground and saluting beside a flag on the Moon.",
    caption: "John Young leaps and salutes, Apollo 16, April 21, 1972.",
    credit: "NASA/JSC · AS16-113-18339",
    source: moonFacts,
  },
  {
    id: "live-plant",
    mission: "live",
    task: "Plant a seed",
    title: "Plants grew in real Moon soil",
    kid: "Scientists grew plants in real Moon soil for the first time. The soil came home with Apollo 11, 12 and 17.",
    image: "/art/nasa/as17-145-22157.jpg",
    alt: "An astronaut scooping grey Moon soil with a long tool.",
    caption:
      "Harrison Schmitt scoops lunar samples, Apollo 17, December 12, 1972.",
    credit: "NASA/JSC · AS17-145-22157",
    source:
      "https://www.nasa.gov/humans-in-space/scientists-grow-plants-in-lunar-soil/",
  },
  {
    id: "live-sprout",
    mission: "live",
    task: "Grow a sprout",
    title: "A space garden called Veggie",
    kid: "NASA grows red lettuce in a space garden called Veggie. It needs light, water and patience, like yours.",
    image: "/art/nasa-live.webp",
    alt: "Red romaine lettuce growing in a small plant pillow under pink light.",
    caption: "Red romaine lettuce in a Veggie test at Kennedy Space Center.",
    credit: "NASA/Bryan Onate",
    source:
      "https://www.nasa.gov/missions/station/veggie-will-expand-fresh-food-production-on-space-station/",
  },
  {
    id: "live-harvest",
    mission: "live",
    task: "Pick the first salad",
    title: "Every drop is used again",
    kid: "On the Space Station, 98% of the crew’s water is cleaned and used again. A Moon base must save water too.",
    image: "/art/nasa/iss034e031130.jpg",
    alt: "An astronaut working on water recycling equipment inside the Space Station.",
    caption:
      "Tom Marshburn works on the station’s Urine Processor Assembly, January 17, 2013.",
    credit: "NASA/JSC · ISS034-E-031130",
    source:
      "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/",
  },
  {
    id: "explore-drive",
    mission: "explore",
    task: "Drive the rover out",
    title: "The first Moon car",
    kid: "Apollo 15 was the first mission to bring a car to the Moon: the Lunar Roving Vehicle.",
    image: "/art/nasa/as15-86-11603.jpg",
    alt: "An astronaut working beside a four-wheeled Moon rover.",
    caption:
      "James Irwin at the Lunar Roving Vehicle, Apollo 15, July 31, 1971.",
    credit: "NASA/JSC · AS15-86-11603",
    source: "https://www.nasa.gov/mission/apollo-15/",
  },
  {
    id: "explore-rock",
    mission: "explore",
    task: "Collect a rock",
    title: "382 kilograms of Moon",
    kid: "Six Apollo missions brought home 382 kilograms of Moon rocks, pebbles, sand and dust. Scientists still study them.",
    image: "/art/nasa/as17-140-21496.jpg",
    alt: "An astronaut standing next to a giant split boulder on the Moon.",
    caption:
      "Harrison Schmitt beside a huge boulder, Apollo 17, December 13, 1972.",
    credit: "NASA/JSC · AS17-140-21496",
    source: "https://curator.jsc.nasa.gov/lunar/",
  },
  {
    id: "explore-home",
    mission: "explore",
    task: "Return to the shelter",
    title: "Watching radiation from orbit",
    kid: "NASA’s orbiter LRO carries seven tools. They map the Moon and measure its radiation, which helps crews plan shelter.",
    image: "/art/nasa/PIA18163.jpg",
    alt: "A drawing of a gold spacecraft flying above the grey Moon.",
    caption: "Artist’s picture of the Lunar Reconnaissance Orbiter.",
    credit: "NASA/JPL · PIA18163",
    source: lib("PIA18163"),
  },
];
export const cardById = (id: string) => cards.find((c) => c.id === id);
export const cardsFor = (mission: MissionId) =>
  cards.filter((c) => c.mission === mission);
