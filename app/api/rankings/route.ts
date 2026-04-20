import { NextResponse } from "next/server";
import { fetchAllRankings } from "@/lib/sheets";

export const revalidate = 10;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SHEETS_JSON_URL;
  if (!url) {
    return NextResponse.json({ error: "URL não configurada" }, { status: 400 });
  }

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
