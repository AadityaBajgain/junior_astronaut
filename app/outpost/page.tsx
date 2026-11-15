import type { Metadata } from "next";
import Outpost from "../../components/Outpost";

export const metadata: Metadata = {
  title: "Outpost Commander · MoonSprout",
};
export default function OutpostPage() {
  return <Outpost />;
}
