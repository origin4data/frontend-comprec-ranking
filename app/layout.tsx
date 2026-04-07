import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const fontDisplay = DM_Serif_Display({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-display" });
const fontBody = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Comprec — Ranking de Vendas",
  description: "Ranking de vendas — Comprec Gestão de Ativos Judiciais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
