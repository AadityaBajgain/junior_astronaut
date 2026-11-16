import type { Metadata } from "next";
import Outpost from "../../components/Outpost";

export const metadata: Metadata = {
  title: "Outpost Commander · JuniorAstronaut",
};
export default function OutpostPage() {
  return <Outpost />;
}
