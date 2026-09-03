import { NextResponse } from "next/server";
import { fetchAllRankings } from "@/lib/sheets";
import { rankingSourceUrl } from "@/lib/config";

export const revalidate = 10;

export async function GET() {
  const url = rankingSourceUrl();

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
