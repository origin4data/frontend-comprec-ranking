import { NextResponse } from "next/server";
import { rankingSource } from "@/lib/config";

type Linha = Record<string, unknown>;

// Resumo por quadro. As `chaves` da primeira linha estão aqui de propósito: foi uma coluna
// renomeada na origem que manteve o painel em R$ 0, e é olhando o nome real dos campos que se
// descobre isso em cinco segundos.
function resumo(linhas: Linha[]) {
  const num = (v: unknown) => Number(v) || 0;
  return {
    total: linhas.length,
    soma_repasse: linhas.reduce((s, r) => s + num(r.total_repasse), 0),
    soma_vendas: linhas.reduce((s, r) => s + num(r.qtd_vendas), 0),
    chaves: Object.keys(linhas[0] ?? {}),
    primeiros: linhas.slice(0, 2),
  };
}

export async function GET() {
  // A mesma URL que /api/rankings busca, período incluído — um diagnóstico que consulta endereço
  // diferente do painel não diagnostica o painel.
  const { url: fonte, periodo } = rankingSource();

  // searchParams.set em vez de concatenar "?_t=": a URL já traz ?ano=&mes=, e um segundo "?" faria
  // o backend receber mes="9?_t=..." e responder 400 — bem na hora em que esta rota é usada.
  const url = new URL(fonte);
  url.searchParams.set("_t", String(Date.now()));
  const origem = url.origin + url.pathname;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    // Sem esta checagem, um 429 do rate limit cairia em raw.slice() e viraria um 500 opaco.
    return NextResponse.json(
      { origem, periodo, status: res.status, corpo: (await res.text()).slice(0, 500) },
      { status: 502 },
    );
  }

  const raw = await res.json();

  if (!Array.isArray(raw) && raw?.mensal !== undefined) {
    return NextResponse.json({
      origem,
      periodo,
      formato: "mensal/anual",
      mensal: resumo(raw.mensal ?? []),
      anual: resumo(raw.anual ?? []),
    });
  }

  // Qualquer coisa fora do envelope { mensal, anual } é justamente o que /api/rankings recusa —
  // esta rota mostra o que chegou em vez de esconder.
  return NextResponse.json({
    origem,
    periodo,
    formato: "inesperado",
    corpo: JSON.stringify(raw).slice(0, 500),
  });
}
