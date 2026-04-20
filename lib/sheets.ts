import { RankingEntry } from "./types";

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
  // https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  // https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return url;
}

function parseRows(rows: Record<string, unknown>[]): RankingEntry[] {
  const entries = rows
    .map((row) => {
      const rawFoto = String(find(row, "foto", "foto_url", "foto_link", "imagem", "photo", "avatar") ?? "").trim();
      return {
        nome: String(find(row, "nome", "name", "vendedor") ?? "").trim(),
        total_repasse: parseNumber(find(row, "total_repasse", "totalrepasse", "repasse", "valor", "total")),
        qtd_vendas: parseInt(String(find(row, "qnt_venda", "qtd_venda", "qtd_vendas", "qntvendas", "qtdvendas", "vendas", "quantidade") ?? "0"), 10) || 0,
        ultima_venda: formatDate(find(row, "ultima_venda", "ultimavenda", "data", "datavenda", "ultimadata")),
        foto: normalizePhotoUrl(rawFoto) || undefined,
      };
    })
    // Remove quem não tem nome ou ainda não vendeu nada
    .filter((r) => r.nome !== "" && (r.total_repasse > 0 || r.qtd_vendas > 0));

  entries.sort((a, b) => b.total_repasse - a.total_repasse);
  return entries.map((r, i) => ({ pos: i + 1, ...r }));
}

export async function fetchAllRankings(jsonUrl: string): Promise<{
  mensal: RankingEntry[];
  anual: RankingEntry[];
}> {
  const res = await fetch(`${jsonUrl}?_t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`);

  const text = await res.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      "O Apps Script retornou HTML em vez de JSON. " +
      "Verifique se o deployment tem acesso definido como \"Qualquer pessoa\" (Anyone)."
    );
  }

  // Suporte ao formato antigo (array) e novo ({ mensal, anual })
  if (Array.isArray(raw)) {
    return { mensal: parseRows(raw), anual: [] };
  }

  return {
    mensal: parseRows(Array.isArray(raw.mensal) ? raw.mensal : []),
    anual: parseRows(Array.isArray(raw.anual) ? raw.anual : []),
  };
}
