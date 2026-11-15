// Four chapters, all on the way to and on the Moon.
export const missions = [
  {
    id: "go",
    name: "Go",
    place: "Earth launchpad",
    color: "#ffc65c",
  },
  {
    id: "land",
    name: "Land",
    place: "Moon landing site",
    color: "#8dd8ff",
  },
  {
    id: "live",
    name: "Live",
    place: "Moon greenhouse",
    color: "#86e8ab",
  },
  {
    id: "explore",
    name: "Explore",
    place: "Moon rover trek",
    color: "#c5abff",
  },
] as const;
export type MissionId = (typeof missions)[number]["id"];
export const getMission = (id: MissionId) =>
  missions.find((mission) => mission.id === id)!;
