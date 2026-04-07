import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SHEETS_JSON_URL;
  if (!url) return NextResponse.json({ error: "URL não configurada" }, { status: 400 });

  const res = await fetch(`${url}?_t=${Date.now()}`, { cache: "no-store" });
  const data = await res.json();

  return NextResponse.json({ total_linhas: data.length, primeiras_linhas: data.slice(0, 3) });
}
