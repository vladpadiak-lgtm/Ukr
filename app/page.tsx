import meta from "@/public/data/meta.json";
import records2026 from "@/public/data/2026.json";
import type { WantedMeta, WantedRecord } from "@/lib/wanted";
import { WantedDirectory } from "./wanted-directory";

export default function Home() {
  return (
    <WantedDirectory
      meta={meta as WantedMeta}
      initialRecords={records2026 as WantedRecord[]}
    />
  );
}
