import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SHEETS_JSON_URL;
  if (!url) return NextResponse.json({ error: "URL não configurada" }, { status: 400 });

  const res = await fetch(`${url}?_t=${Date.now()}`, { cache: "no-store" });
  const raw = await res.json();

  // Formato novo: { mensal: [...], anual: [...] }
  if (!Array.isArray(raw) && raw.mensal !== undefined) {
    return NextResponse.json({
      formato: "mensal/anual",
      mensal: { total: raw.mensal?.length ?? 0, primeiros: raw.mensal?.slice(0, 2) ?? [] },
      anual:  { total: raw.anual?.length  ?? 0, primeiros: raw.anual?.slice(0, 2)  ?? [] },
    });
  }

  // Formato antigo: array direto
  return NextResponse.json({
    formato: "array_simples",
    total: raw.length,
    primeiros: raw.slice(0, 2),
  });
}
