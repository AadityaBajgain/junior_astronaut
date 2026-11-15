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
    place: "Moon outpost",
    color: "#8dd8ff",
  },
  {
    id: "live",
    name: "Live",
    place: "Mars greenhouse",
    color: "#86e8ab",
  },
  {
    id: "explore",
    name: "Explore",
    place: "Mars rock hunt",
    color: "#c5abff",
  },
] as const;
export type MissionId = (typeof missions)[number]["id"];
export const getMission = (id: MissionId) =>
  missions.find((mission) => mission.id === id)!;
