import { RankingEntry } from "./types";
import { rankingApiKey, rankingSourceUrl } from "./config";

function parseNumber(s: unknown): number {
  if (typeof s === "number") return s;
  const v = String(s ?? "").trim().replace(/[R$\s]/g, "");
  if (v.includes(",") && v.includes(".")) return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
  if (v.includes(",")) return parseFloat(v.replace(",", ".")) || 0;
  return parseFloat(v) || 0;
}

function formatDate(val: unknown): string {
  if (val === null || val === undefined || val === "") return "-";
  const s = String(val).trim();
  if (!s || s === "Invalid Date") return "-";
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
}

function find(row: Record<string, unknown>, ...keys: string[]): unknown {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_]/g, "");
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find((k) => norm(k) === norm(key));
    if (match !== undefined) return row[match];
  }
  return undefined;
}

// Converte links de compartilhamento do Google Drive para URL de imagem direta
function normalizePhotoUrl(url: string): string {
  if (!url) return "";
  // Cinto e suspensorio: se o backend emitir caminho relativo, o next/image resolveria contra o
  // dominio da TV, daria 404 e todo o podio cairia no fallback de iniciais - sem erro visivel.
  if (url.startsWith("/")) {
    try {
      return new URL(url, rankingSourceUrl()).toString();
    } catch {
      return url;
    }
  }
  // https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  // https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return url;
}

// Os nomes aceitos para a coluna de valor. Ficam aqui fora porque a guarda abaixo precisa saber
// exatamente o que foi procurado para dizer o que faltou.
const CHAVES_DE_VALOR = ["total_repasse", "totalrepasse", "repasse", "valor", "total"] as const;

function parseRows(rows: Record<string, unknown>[], quadro: string): RankingEntry[] {
  const brutas = rows.map((row) => {
    const rawFoto = String(find(row, "foto", "foto_url", "foto_link", "imagem", "photo", "avatar") ?? "").trim();
    const rawId = find(row, "id", "vendedor_id", "vendedorid");
    const rawValor = find(row, ...CHAVES_DE_VALOR);
    return {
      rawValor,
      entry: {
        id: rawId === undefined || rawId === null || rawId === "" ? undefined : String(rawId),
        nome: String(find(row, "nome", "name", "vendedor") ?? "").trim(),
        total_repasse: parseNumber(rawValor),
        qtd_vendas: parseInt(String(find(row, "qnt_venda", "qtd_venda", "qtd_vendas", "qntvendas", "qtdvendas", "vendas", "quantidade") ?? "0"), 10) || 0,
        ultima_venda: formatDate(find(row, "ultima_venda", "ultimavenda", "data", "datavenda", "ultimadata")),
        foto: normalizePhotoUrl(rawFoto) || undefined,
      },
    };
  });

  // O que deixou a TV meses exibindo R$ 0 não foi um valor errado: foi o silêncio. A planilha
  // renomeou a coluna de valor para "Coluna 2", find() devolveu undefined, parseNumber virou 0 e o
  // pódio passou a ordenar um monte de empate — errado, mas com cara de certo.
  //
  // "Não vendeu no mês" e "a coluna sumiu do payload" são coisas diferentes, e só a primeira é
  // normal. Quem tem venda e não tem a chave de valor é contrato quebrado: melhor a TV mostrar um
  // erro que alguém conserta do que um ranking na ordem errada que ninguém questiona.
  const semValor = brutas.filter((b) => b.rawValor === undefined && b.entry.qtd_vendas > 0);
  if (semValor.length > 0) {
    throw new Error(
      `A origem não trouxe a coluna de valor no quadro ${quadro}: ` +
      `${semValor.length} de ${brutas.length} linhas têm venda mas nenhuma das chaves ` +
      `${CHAVES_DE_VALOR.join("/")}. Chaves recebidas: ${Object.keys(rows[0] ?? {}).join(", ")}.`
    );
  }

  const entries = brutas
    .map((b) => b.entry)
    // Remove quem não tem nome ou ainda não vendeu nada
    .filter((r) => r.nome !== "" && (r.total_repasse > 0 || r.qtd_vendas > 0));

  entries.sort((a, b) => b.total_repasse - a.total_repasse);
  return entries.map((r, i) => ({ pos: i + 1, ...r }));
}

export async function fetchAllRankings(jsonUrl: string): Promise<{
  mensal: RankingEntry[];
  anual: RankingEntry[];
}> {
  const chave = rankingApiKey();
  const res = await fetch(jsonUrl, {
    next: { revalidate: 10 },
    headers: chave ? { "X-Ranking-Key": chave } : undefined,
  });
  if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`);

  const text = await res.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    // So chega aqui com HTTP 200 e corpo que nao e JSON; erro de status e tratado acima. A
    // mensagem aparece na TV, no meio do escritorio: precisa apontar para algo que exista.
    throw new Error(
      `A origem respondeu 200 com um corpo que nao e JSON (${text.slice(0, 80)}...). ` +
      "Verifique se RANKING_API_URL aponta para o endpoint certo."
    );
  }

  // O envelope é sempre { mensal, anual }. O array solto era o formato da planilha e não existe
  // mais: continuar aceitando-o faria um payload estranho virar "anual vazio" em silêncio, que é
  // exatamente a classe de defeito que esta migração veio encerrar.
  const obj = (raw ?? {}) as { mensal?: unknown; anual?: unknown };
  if (!Array.isArray(obj.mensal) || !Array.isArray(obj.anual)) {
    throw new Error(
      "A origem respondeu num formato inesperado: esperava { mensal: [...], anual: [...] } e " +
      `recebeu ${JSON.stringify(raw).slice(0, 120)}...`
    );
  }

  return {
    mensal: parseRows(obj.mensal, "mensal"),
    anual: parseRows(obj.anual, "anual"),
  };
}
