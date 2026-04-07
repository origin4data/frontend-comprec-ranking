import { RankingEntry } from "./types";

/** Aceita formatos: 15000 / 15000.50 / 15.000,50 / R$ 15.000 */
function parseNumber(s: unknown): number {
  if (typeof s === "number") return s;
  const v = String(s ?? "").trim().replace(/[R$\s]/g, "");
  if (v.includes(",") && v.includes(".")) {
    return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (v.includes(",")) {
    return parseFloat(v.replace(",", ".")) || 0;
  }
  return parseFloat(v) || 0;
}

/** Formata qualquer valor de data para DD/MM/AAAA */
function formatDate(val: unknown): string {
  if (val === null || val === undefined || val === "") return "-";
  const s = String(val).trim();
  if (!s || s === "Invalid Date") return "-";

  // ISO string vinda do Google Sheets (ex: "2026-07-04T03:00:00.000Z")
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }

  // Já está no formato esperado (DD/MM/AAAA ou similar)
  return s;
}

/**
 * Encontra o valor de uma linha pelo nome da coluna,
 * ignorando maiúsculas, espaços e underscores.
 */
function find(row: Record<string, unknown>, ...keys: string[]): unknown {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_]/g, "");
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find((k) => normalize(k) === normalize(key));
    if (match !== undefined) return row[match];
  }
  return undefined;
}

export async function fetchRankingFromSheets(jsonUrl: string): Promise<RankingEntry[]> {
  const res = await fetch(`${jsonUrl}?_t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`);

  const data: Record<string, unknown>[] = await res.json();

  const entries = data
    .map((row) => ({
      nome: String(find(row, "nome", "name", "vendedor") ?? "").trim(),
      total_repasse: parseNumber(find(row, "total_repasse", "totalrepasse", "repasse", "valor", "total")),
      qtd_vendas: parseInt(String(find(row, "qtd_venda", "qtd_vendas", "qtdvendas", "vendas", "quantidade") ?? "0"), 10) || 0,
      ultima_venda: formatDate(find(row, "ultima_venda", "ultimavenda", "data", "datavenda", "ultimadata", "dataultimavenda")),
    }))
    .filter((r) => r.nome !== "");

  entries.sort((a, b) => b.total_repasse - a.total_repasse);

  return entries.map((r, i) => ({ pos: i + 1, ...r }));
}
