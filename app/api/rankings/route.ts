import { NextResponse } from "next/server";
import { fetchAllRankings } from "@/lib/sheets";

export const revalidate = 10;

// URL pública do Apps Script — pode ser sobrescrita via env var em dev/preview
const DEFAULT_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzZbdBVsfetr33B8-CAfLBa29yywBu_pQOeyv6esuruwdXfefiQzya5DJkX7YQm0Aug/exec";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SHEETS_JSON_URL || DEFAULT_SHEETS_URL;

  try {
    const data = await fetchAllRankings(url);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro ao buscar dados" }, { status: 500 });
  }
}
