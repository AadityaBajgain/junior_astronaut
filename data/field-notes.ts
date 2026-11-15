import type { MissionId } from "../game/missions";
import curiosity from "./science.json";

export type FieldNote = {
  title: string;
  fact: string;
  child: string;
  question: string;
  image: string;
  alt: string;
  photoTitle: string;
  credit: string;
  photoSource: string;
  dataSource: string;
  datePlace: string;
  details: string;
  game: string;
};
export const fieldNotes: Record<MissionId, FieldNote> = {
  go: {
    title: "Who rode this rocket?",
    fact: "3 astronauts",
    child:
      "Three people rode this big rocket. All three needed air. Can you pack air for your crew?",
    question: "Can you spot the white rocket?",
    image: "/art/nasa-go.webp",
    alt: "Apollo 11 rising beside its launch tower, with bright flames and clouds below.",
    photoTitle: "Apollo 11 Lifts Off",
    credit: "NASA",
    photoSource: "https://www.nasa.gov/image-article/apollo-11-lifts-off-3/",
    dataSource: "https://www.nasa.gov/mission/apollo-11/",
    datePlace: "July 16, 1969 · Kennedy Space Center, Florida",
    details:
      "Apollo 11 launched from pad 39A on Saturn V vehicle SA-506. The three crew members were Neil Armstrong, Buzz Aldrin and Michael Collins. Three is a historical crew count.",
    game: "Our little rocket has two cargo spaces. We chose that number for the packing game.",
  },
  land: {
    title: "Where did the sunlight go?",
    fact: "2 days into night",
    child:
      "This Moon robot used sunlight for power. When it got dark, its calls stopped. Can your battery keep the fan spinning?",
    question: "Can you find the robot’s big shadow?",
    image: "/art/nasa-land.webp",
    alt: "Surveyor 3 resting on dusty lunar ground beside its long dark shadow.",
    photoTitle: "View of Surveyor III in Its Crater · AS12-48-7121",
    credit: "NASA/JSC",
    photoSource:
      "https://science.nasa.gov/resource/view-of-surveyor-iii-in-its-crater/",
    dataSource:
      "https://science.nasa.gov/solar-system/moon/footpads-and-footprints-humans-and-machine-meet-on-the-moon/",
    datePlace: "Photo · November 20, 1969 · Ocean of Storms, Moon",
    details:
      "NASA last heard from solar-powered Surveyor 3 on May 4, 1967, two Earth days into its first lunar night. The Apollo 12 crew photographed the robot on a later visit in 1969.",
    game: "Our short night, landing places, spare sparks and two-cell battery are game rules. They do not model a real landing site.",
  },
  live: {
    title: "How long to grow lunch?",
    fact: "28 days old",
    child:
      "This lettuce took four weeks to look like this! It needed water, light and time, just like your little seed.",
    question: "Can you see the leafy edges?",
    image: "/art/nasa-live.webp",
    alt: "A leafy red romaine lettuce plant growing from a NASA test planting pillow.",
    photoTitle: "Lettuce in a prototype Veggie plant pillow",
    credit: "NASA/Bryan Onate",
    photoSource:
      "https://www.nasa.gov/missions/station/veggie-will-expand-fresh-food-production-on-space-station/",
    dataSource:
      "https://www.nasa.gov/missions/station/veggie-will-expand-fresh-food-production-on-space-station/",
    datePlace:
      "Ground test · Kennedy Space Center, Florida · reported April 10, 2014",
    details:
      "The caption gives the age of this red romaine plant as 28 days. NASA tested a prototype Veggie growing pillow on Earth while preparing to grow food aboard the International Space Station.",
    game: "Our pretend Mars garden grows in two watered, lit turns so you can see each change. Real plants need many days.",
  },
  explore: {
    title: "What can a rover feel?",
    fact: "Tiny bits from space",
    child:
      "You can’t see these tiny bits. Curiosity has a tool that can count what hits it. A shelter helps protect a crew.",
    question: "Can you spot the rover’s wheels?",
    image: curiosity.image.file,
    alt: "Curiosity on rocky ground at Rocknest, photographed by its own arm camera.",
    photoTitle: curiosity.image.title + " · " + curiosity.image.id,
    credit: curiosity.image.credit,
    photoSource: curiosity.image.source,
    dataSource: curiosity.measurement.source,
    datePlace: "Photo · October 31, 2012 · Rocknest, Gale Crater, Mars",
    details:
      "NASA’s Curiosity Radiation Assessment Detector (RAD) measured an average of " +
      curiosity.measurement.value +
      " " +
      curiosity.measurement.unit +
      " at Gale Crater, " +
      curiosity.measurement.period +
      ". A millisievert is a unit of radiation dose. This is a historical average from one place. Photo instrument: Mars Hand Lens Imager (MAHLI). NASA radiation report 13-366, December 9, 2013.",
    game: "The shelter drill and battery sparks are pretend. Crew choices change time outside. They never calculate a child’s or astronaut’s dose.",
  },
};
