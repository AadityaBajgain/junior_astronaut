import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdventureRoom from "../../../components/AdventureRoom";
import { missions } from "../../../game/missions";
type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return missions.map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = missions.find((item) => item.id === id);
  return { title: m ? m.place + " · MoonSprout" : "MoonSprout" };
}
export default async function MissionPage({ params }: Props) {
  const { id } = await params;
  const mission = missions.find((item) => item.id === id);
  if (!mission) notFound();
  return <AdventureRoom key={mission.id} id={mission.id} />;
}
