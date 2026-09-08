import { NextResponse } from "next/server";
import { rankingSourceUrl } from "@/lib/config";

type Linha = Record<string, unknown>;

// Resumo por período: é o que se compara lado a lado com a fonte antiga na virada. Soma tanto
// total_repasse quanto "Coluna 2" porque a planilha nomeia a coluna mensal assim — é justamente
// por isso que o quadro mensal da TV mostra R$ 0 enquanto a fonte for ela.
function resumo(linhas: Linha[]) {
  const num = (v: unknown) => Number(v) || 0;
  return {
    total: linhas.length,
    soma_repasse: linhas.reduce((s, r) => s + num(r.total_repasse ?? r["Coluna 2"]), 0),
    soma_vendas: linhas.reduce((s, r) => s + num(r.qtd_vendas ?? r.qnt_venda ?? r.qtd_venda), 0),
    primeiros: linhas.slice(0, 2),
  };
}

export async function GET() {
  // searchParams.set em vez de concatenar "?_t=": a URL da API já traz ?ano=&mes=, e um segundo "?"
  // faria o backend receber mes="9?_t=..." e responder 400 — bem na hora em que esta rota é usada.
  const url = new URL(rankingSourceUrl());
  url.searchParams.set("_t", String(Date.now()));
  const origem = url.origin + url.pathname;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    // Sem esta checagem, um 429 do rate limit cairia em raw.slice() e viraria um 500 opaco.
    return NextResponse.json(
      { origem, status: res.status, corpo: (await res.text()).slice(0, 500) },
      { status: 502 },
    );
  }

  const raw = await res.json();

  // Formato novo: { mensal: [...], anual: [...] }
  if (!Array.isArray(raw) && raw.mensal !== undefined) {
    return NextResponse.json({
      origem,
      formato: "mensal/anual",
      mensal: resumo(raw.mensal ?? []),
      anual: resumo(raw.anual ?? []),
    });
  }

  // Formato antigo: array direto
  return NextResponse.json({
    origem,
    formato: "array_simples",
    ...resumo(Array.isArray(raw) ? raw : []),
  });
}
