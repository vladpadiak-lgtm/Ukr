import meta from "@/public/data/meta.json";
import type { WantedMeta } from "@/lib/wanted";
import { WantedDirectory } from "./wanted-directory";

export default function Home() {
  return <WantedDirectory meta={meta as WantedMeta} />;
}
