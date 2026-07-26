import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Реєстр розшуку — відкриті дані України",
      template: "%s · Реєстр розшуку",
    },
    description:
      "Каталог офіційних записів про осіб, оголошених у розшук українськими правоохоронними органами з 2022 року.",
    openGraph: {
      title: "Реєстр розшуку",
      description: "Офіційні відкриті дані. Без домислів.",
      type: "website",
      locale: "uk_UA",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1731,
          height: 909,
          alt: "Реєстр розшуку — офіційні відкриті дані 2022–2026",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Реєстр розшуку",
      description: "Офіційні відкриті дані. Без домислів.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
