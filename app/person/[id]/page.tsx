import meta from "@/public/data/meta.json";
import index from "@/public/data/index.json";
import records2022 from "@/public/data/2022.json";
import records2023 from "@/public/data/2023.json";
import records2024 from "@/public/data/2024.json";
import records2025 from "@/public/data/2025.json";
import records2026 from "@/public/data/2026.json";
import type { WantedMeta, WantedRecord } from "@/lib/wanted";
import { PersonProfile } from "./person-profile";

const recordsByYear: Record<string, WantedRecord[]> = {
  "2022": records2022 as WantedRecord[],
  "2023": records2023 as WantedRecord[],
  "2024": records2024 as WantedRecord[],
  "2025": records2025 as WantedRecord[],
  "2026": records2026 as WantedRecord[],
};

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const year = (index as Record<string, string>)[id];
  const record = year
    ? recordsByYear[year]?.find((item) => item.id === id) || null
    : null;

  return <PersonProfile record={record} meta={meta as WantedMeta} />;
}
