import meta from "@/public/data/meta.json";
import type { WantedMeta } from "@/lib/wanted";
import { PersonProfile } from "./person-profile";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonProfile id={id} meta={meta as WantedMeta} />;
}
