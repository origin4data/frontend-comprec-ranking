import { NextResponse } from "next/server";
import { fetchAllRankings } from "@/lib/sheets";
import { rankingSource, type Periodo } from "@/lib/config";

export const revalidate = 10;

type Payload = Awaited<ReturnType<typeof fetchAllRankings>> & { periodo: Periodo };

// O último payload bom desta instância.
//
// Enquanto a planilha existia, ela era o rollback. Agora a API é origem única, e um blip dela
// trocaria o ranking por uma mensagem de erro numa TV pendurada no meio do escritório — foi o que
// aconteceu com o Apps Script durante o diagnóstico. Servir o último bom, marcado como `stale`, é
// pior que o dado fresco e muito melhor que a tela de erro.
//
// Memória do processo de propósito: some no restart, que é justamente quando a origem tem de ser
// reconferida do zero.
let ultimoBom: Payload | null = null;

export async function GET() {
  const { url, periodo } = rankingSource();

  try {
    const data = await fetchAllRankings(url);
    ultimoBom = { ...data, periodo };

    return NextResponse.json(ultimoBom, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (e: any) {
    if (ultimoBom) {
      // Sem cache no intermediário: o corpo defasado não pode sobreviver ao restabelecimento da
      // origem.
      return NextResponse.json(
        { ...ultimoBom, stale: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ error: e.message ?? "Erro ao buscar dados" }, { status: 500 });
  }
}
