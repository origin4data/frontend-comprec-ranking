"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { fetchRankingFromSheets } from "@/lib/sheets";
import { RankingEntry } from "@/lib/types";

const REFRESH_INTERVAL = 15_000;
const JSON_URL = process.env.NEXT_PUBLIC_SHEETS_JSON_URL ?? "";
const MESES = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function TVPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const mesAtual = MESES[new Date().getMonth() + 1];

  const fetchRanking = useCallback(async () => {
    if (!JSON_URL) {
      setError("URL da planilha não configurada. Defina NEXT_PUBLIC_SHEETS_JSON_URL no .env.local");
      setLoading(false);
      return;
    }
    try {
      const data = await fetchRankingFromSheets(JSON_URL);
      setRanking(data);
      setUpdatedAt(new Date().toISOString());
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
    const interval = setInterval(fetchRanking, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRanking]);

  const totalRepasse = ranking.reduce((s, r) => s + r.total_repasse, 0);
  const totalVendas = ranking.reduce((s, r) => s + r.qtd_vendas, 0);
  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="relative min-h-screen bg-forest-900 noise-overlay overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-comprec-400/[0.06] rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-comprec-400/[0.04] rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      <div className="relative z-10 max-w-[1320px] mx-auto px-8 lg:px-10 py-7 h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10 mb-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Image src="/images/logoWhite.png" alt="Comprec" width={44} height={44} className="h-11 w-auto" priority />
            <div className="hidden sm:block">
              <Image src="/images/logoNomeWhite.png" alt="Comprec" width={160} height={32} className="h-7 w-auto" priority />
              <p className="text-[9px] font-semibold uppercase tracking-extra-wide text-comprec-400/40 mt-1">Gestão de Ativos Judiciais</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 bg-comprec-400/10 border border-comprec-400/20 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-comprec-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-extra-wide text-comprec-400">{mesAtual} — Ao Vivo</span>
            </div>
            <span className="text-[11px] text-white/25">{time ? `Atualizado: ${time}` : "Conectando..."}</span>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mb-5 flex-shrink-0">
          <span className="inline-block text-comprec-400/60 text-[10px] font-bold uppercase tracking-extra-wide mb-2">Performance da Equipe</span>
          <h2 className="font-display text-3xl lg:text-4xl text-white">Ranking de Vendedores</h2>
          <div className="mx-auto mt-4 accent-line" />
        </div>

        {/* Stats bar */}
        {!loading && ranking.length > 0 && (
          <div className="flex items-center justify-center gap-8 mb-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-extra-wide text-white/25">Vendedores</span>
              <span className="text-sm font-bold text-white/60 tabular-nums">{ranking.length}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-extra-wide text-white/25">Total Vendas</span>
              <span className="text-sm font-bold text-white/60 tabular-nums">{totalVendas}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-extra-wide text-white/25">Repasse Geral</span>
              <span className="text-sm font-bold text-comprec-400 tabular-nums">{fmt(totalRepasse)}</span>
            </div>
          </div>
        )}

        {/* Podium Top 3 */}
        {!loading && ranking.length >= 3 && (
          <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden mb-6 flex-shrink-0 max-w-4xl mx-auto w-full">
            {ranking.slice(0, 3).map((entry, i) => (
              <div key={entry.nome} className="bg-forest-900 p-5 lg:p-6 text-center transition-colors duration-300 hover:bg-white/[0.04]">
                <span className="text-[10px] font-bold uppercase tracking-extra-wide text-white/25 block mb-3">{i + 1}º Lugar</span>
                <span className="text-3xl block mb-2">{medals[i]}</span>
                <p className={`font-semibold text-sm mb-1 ${i === 0 ? "text-comprec-400" : "text-white/80"}`}>{entry.nome}</p>
                <p className={`text-base font-bold tabular-nums ${i === 0 ? "text-comprec-400" : "text-white/60"}`}>{fmt(entry.total_repasse)}</p>
                <p className="text-white/30 text-[11px] mt-1 tabular-nums">{entry.qtd_vendas} {entry.qtd_vendas === 1 ? "venda" : "vendas"}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table / States */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-comprec-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/25 text-[10px] font-bold uppercase tracking-extra-wide">Carregando ranking...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-400/70 text-sm text-center max-w-sm">{error}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto relative">
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-forest-900 to-transparent pointer-events-none z-10" />
            <table className="w-full border-separate" style={{ borderSpacing: "0 5px" }}>
              <thead>
                <tr>
                  {["#", "Vendedor", "Total Repasse", "Qtd. Vendas", "Última Venda"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-[10px] font-bold uppercase tracking-extra-wide text-white/30 py-3 px-4 font-body sticky top-0 bg-forest-900 z-10 ${i <= 1 ? "text-left" : "text-center"} ${i === 0 ? "w-[70px]" : i === 2 ? "w-[180px]" : i === 3 ? "w-[140px]" : i === 4 ? "w-[130px]" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => {
                  const isTop1 = i === 0, isTop2 = i === 1, isTop3 = i === 2;
                  const rowBg = isTop1
                    ? "bg-comprec-400/[0.08] border-comprec-400/25"
                    : isTop2
                    ? "bg-white/[0.04] border-white/10"
                    : isTop3
                    ? "bg-white/[0.03] border-white/[0.08]"
                    : "bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.04]";
                  const posBadge = isTop1
                    ? "bg-comprec-400 text-forest-900 shadow-[0_2px_14px_rgba(72,186,184,0.35)] font-bold"
                    : isTop2
                    ? "bg-white/20 text-white font-bold"
                    : isTop3
                    ? "bg-white/10 text-white/80 font-bold"
                    : "bg-white/[0.04] text-white/25 border border-white/[0.06]";
                  return (
                    <tr key={entry.nome} className={`row-animate border ${rowBg} transition-all duration-300`} style={{ animationDelay: `${i * 0.07}s` }}>
                      <td className="py-4 px-5 rounded-l-xl">
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm ${posBadge}`}>{i + 1}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold text-[15px] ${isTop1 ? "text-comprec-400" : "text-white"}`}>{entry.nome}</span>
                        {i < 3 && <span className="ml-2 text-lg">{medals[i]}</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-bold text-[15px] tabular-nums ${isTop1 ? "text-comprec-400" : "text-white/80"}`}>{fmt(entry.total_repasse)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-[15px] text-white/70 tabular-nums">{entry.qtd_vendas}</span>
                        <span className="text-[10px] text-white/30 uppercase ml-1">{entry.qtd_vendas === 1 ? "venda" : "vendas"}</span>
                      </td>
                      <td className="py-4 px-5 rounded-r-xl text-center">
                        <span className="text-sm text-white/40 tabular-nums">{entry.ultima_venda}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-white/10 pt-4 mt-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image src="/images/logoNomeWhite.png" alt="Comprec" width={90} height={18} className="opacity-20 h-3.5 w-auto" />
              <span className="text-white/20 text-[11px]">© {new Date().getFullYear()} Comprec — Gestão de Ativos Judiciais</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/25">Atualiza a cada {REFRESH_INTERVAL / 1000}s</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
