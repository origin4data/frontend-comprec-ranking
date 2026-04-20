"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { RankingEntry } from "@/lib/types";

const REFRESH_INTERVAL    = 15_000;
const CAROUSEL_INTERVAL   = 22_000;
const TRANSITION_MS       = 400;
const TABLE_PAGE_SIZE     = 5;
const TABLE_PAGE_INTERVAL = 6_000;

const MESES = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// Design tokens — matches .interface-design/system.md
const RANK = [
  {
    color: "#C8A040", glow: "rgba(200,160,64,0.42)",
    surface: "rgba(200,160,64,0.07)", border: "#C8A040",
    dim: "rgba(200,160,64,0.5)", roman: "I",
  },
  {
    color: "#91A0AC", glow: "rgba(145,160,172,0.3)",
    surface: "rgba(145,160,172,0.05)", border: "#91A0AC",
    dim: "rgba(145,160,172,0.45)", roman: "II",
  },
  {
    color: "#9C6242", glow: "rgba(156,98,66,0.3)",
    surface: "rgba(156,98,66,0.06)", border: "#9C6242",
    dim: "rgba(156,98,66,0.5)", roman: "III",
  },
] as const;

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

type View = "mensal" | "anual";

// ── Avatar component ──────────────────────────────────────────
function PodiumAvatar({ nome, foto, rankIdx }: { nome: string; foto?: string; rankIdx: number }) {
  const t        = RANK[rankIdx] ?? RANK[2];
  const isFirst  = rankIdx === 0;
  const size     = isFirst ? 220 : 168;
  const initials = nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const [imgFailed, setImgFailed] = useState(false);

  const ring: React.CSSProperties = {
    width: size, height: size,
    border:    `2px solid ${t.border}`,
    boxShadow: `0 0 ${isFirst ? 40 : 26}px ${t.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
  };

  const showFallback = !foto || imgFailed;

  return showFallback ? (
    <div
      className="mx-auto mb-5 rounded-full flex items-center justify-center font-body font-semibold flex-shrink-0"
      style={{ ...ring, background: t.surface, color: t.color, fontSize: isFirst ? 48 : 38, letterSpacing: "0.07em" }}>
      {initials}
    </div>
  ) : (
    <div className="mx-auto mb-5 rounded-full overflow-hidden flex-shrink-0 relative" style={ring}>
      <Image
        src={foto!}
        alt={nome}
        fill
        sizes={`${size}px`}
        quality={92}
        className="object-cover"
        unoptimized
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

// ── Stats item ────────────────────────────────────────────────
function StatItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center px-10">
      <p className="font-body font-medium uppercase mb-1.5"
        style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--text-3)" }}>
        {label}
      </p>
      <p className="font-body font-bold tabular-nums leading-none"
        style={{ fontSize: "2rem", color: accent ? "var(--gold)" : "var(--text-2)" }}>
        {value}
      </p>
    </div>
  );
}

// ── Table column definitions — full static classes for Tailwind scanner ──
const COLS = [
  { label: "#",            cls: "text-left   pl-7 pr-3 w-20" },
  { label: "Vendedor",     cls: "text-left   px-4" },
  { label: "Repasse",      cls: "text-right  px-4 w-56" },
  { label: "Vendas",       cls: "text-center px-4 w-36" },
  { label: "Última Venda", cls: "text-center px-4 w-48" },
] as const;

export default function TVPage() {
  const [mensalRanking, setMensalRanking] = useState<RankingEntry[]>([]);
  const [anualRanking,  setAnualRanking]  = useState<RankingEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [updatedAt,     setUpdatedAt]     = useState<string | null>(null);
  const [activeView,    setActiveView]    = useState<View>("mensal");
  const [transitioning, setTransitioning] = useState(false);
  const [tablePageIdx,  setTablePageIdx]  = useState(0);

  const mesAtual = MESES[new Date().getMonth() + 1];
  const ranking  = activeView === "mensal" ? mensalRanking : anualRanking;
  const hasAnual = anualRanking.length > 0;
  const hasBoth  = mensalRanking.length > 0 && hasAnual;

  const fetchRanking = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch("/api/rankings", { signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro HTTP ${res.status}`);
      }
      const { mensal, anual } = await res.json();
      setMensalRanking(mensal ?? []);
      setAnualRanking(anual ?? []);
      setUpdatedAt(new Date().toISOString());
      setError(null);
    } catch (e: any) {
      const msg = e.name === "AbortError"
        ? "Tempo esgotado ao carregar (12s) — verifique a conexão"
        : e.message ?? "Erro ao carregar dados";
      setError(msg);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
    const iv = setInterval(fetchRanking, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [fetchRanking]);

  useEffect(() => {
    if (!hasBoth) return;
    const iv = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setActiveView(v => v === "mensal" ? "anual" : "mensal");
        setTransitioning(false);
      }, TRANSITION_MS);
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(iv);
  }, [hasBoth]);

  // Reset table page when view (mensal/anual) changes
  useEffect(() => { setTablePageIdx(0); }, [activeView]);

  // Table excludes top 3 (already in podium) and paginates in groups of TABLE_PAGE_SIZE
  const tableEntries = ranking.slice(3);
  const totalPages   = Math.max(1, Math.ceil(tableEntries.length / TABLE_PAGE_SIZE));
  const pageEntries  = tableEntries.slice(tablePageIdx * TABLE_PAGE_SIZE, (tablePageIdx + 1) * TABLE_PAGE_SIZE);

  // Auto-rotate table pages
  useEffect(() => {
    if (totalPages <= 1) return;
    const iv = setInterval(() => setTablePageIdx(p => (p + 1) % totalPages), TABLE_PAGE_INTERVAL);
    return () => clearInterval(iv);
  }, [totalPages]);

  const totalRepasse = ranking.reduce((s, r) => s + r.total_repasse, 0);
  const totalVendas  = ranking.reduce((s, r) => s + r.qtd_vendas, 0);
  const animRepasse  = useCountUp(totalRepasse);
  const animVendas   = useCountUp(totalVendas, 900);

  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const podium = ranking.slice(0, 3);
  const podiumCols =
    podium.length === 1 ? "grid-cols-1 max-w-xs" :
    podium.length === 2 ? "grid-cols-2 max-w-2xl" :
    "grid-cols-3 max-w-5xl";

  return (
    <div className="grain relative min-h-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Background atmosphere ──────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Top teal glow — brand presence */}
        <div style={{ background: "radial-gradient(ellipse 120% 45% at 50% -5%, rgba(72,186,184,0.07) 0%, transparent 60%)" }}
          className="absolute inset-0" />
        {/* Bottom-right gold whisper — awards warmth */}
        <div style={{ background: "radial-gradient(ellipse 55% 40% at 90% 95%, rgba(200,160,64,0.04) 0%, transparent 60%)" }}
          className="absolute inset-0" />
        {/* Bottom-left teal echo */}
        <div style={{ background: "radial-gradient(ellipse 45% 35% at 10% 95%, rgba(72,186,184,0.03) 0%, transparent 55%)" }}
          className="absolute inset-0" />
        {/* Vignette */}
        <div style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)" }}
          className="absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-14 py-7 h-screen flex flex-col">

        {/* ── Header ──────────────────────────────────── */}
        <header className="flex-shrink-0 text-center mb-5">

          {/* Logo + live indicator */}
          <div className="flex items-center justify-center gap-5 mb-5">
            <div className="rule-teal" style={{ flex: 1, maxWidth: 120 }} />
            <div className="flex items-center gap-4">
              <Image
                src="/images/logoNomeWhite.png"
                alt="Comprec"
                width={110} height={22}
                className="h-5 w-auto opacity-60"
                priority
              />
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.12)" }} />
              <div className="flex items-center gap-2">
                <span className="relative flex" style={{ width: 5, height: 5 }}>
                  <span className="animate-ping absolute inline-flex rounded-full w-full h-full opacity-55"
                    style={{ background: "var(--teal)" }} />
                  <span className="relative inline-flex rounded-full w-full h-full"
                    style={{ background: "var(--teal)" }} />
                </span>
                <span className="font-body font-medium uppercase"
                  style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(72,186,184,0.5)" }}>
                  Ao Vivo{time ? ` · ${time}` : ""}
                </span>
              </div>
            </div>
            <div className="rule-teal" style={{ flex: 1, maxWidth: 120 }} />
          </div>

          {/* Main title — Cormorant Garamond italic */}
          <h1
            className="font-display italic leading-none mb-5"
            style={{ fontSize: "clamp(3.5rem, 5.2vw, 5rem)", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>
            Ranking de Vendedores
          </h1>

          {/* Gold rule */}
          <div className="rule-gold mx-auto mb-5" style={{ width: 80 }} />

          {/* Period selector — underline tabs */}
          {!loading && (
            <div className="flex items-center justify-center">
              {(["mensal", "anual"] as View[]).map((v, i) => {
                const disabled = v === "anual" && !hasAnual;
                const isActive = activeView === v;
                return (
                  <button
                    key={v}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setTransitioning(true);
                      setTimeout(() => { setActiveView(v); setTransitioning(false); }, TRANSITION_MS);
                    }}
                    className="font-body font-semibold uppercase transition-all duration-300"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      padding: "8px 28px",
                      color:        isActive  ? "#ffffff"      : disabled ? "var(--text-4)" : "var(--text-3)",
                      borderBottom: isActive  ? `1px solid rgba(72,186,184,0.6)` : "1px solid transparent",
                      borderLeft:   i > 0     ? "1px solid var(--border)" : "none",
                      cursor:       disabled  ? "not-allowed" : "pointer",
                    }}>
                    {v === "mensal" ? `Mês · ${mesAtual}` : "Ano"}
                    {disabled && <span className="ml-2 font-normal normal-case tracking-normal opacity-40 text-xs">sem dados</span>}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* ── Body — fades between mensal/anual ──────── */}
        <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-[400ms] ${transitioning ? "opacity-0" : "opacity-100"}`}>

          {/* ── Stats strip ────────────────────────────── */}
          {!loading && ranking.length > 0 && (
            <div className="flex items-center justify-center mb-5 flex-shrink-0">
              <StatItem label="Vendedores"      value={String(ranking.length)} />
              <div style={{ width: 1, height: 28, background: "var(--border-hi)", margin: "0 4px" }} />
              <StatItem label="Total de Vendas" value={String(animVendas)} />
              <div style={{ width: 1, height: 28, background: "var(--border-hi)", margin: "0 4px" }} />
              <StatItem label="Repasse Total"   value={fmt(animRepasse)} accent />
            </div>
          )}

          {/* ── Podium ─────────────────────────────────── */}
          {!loading && podium.length > 0 && (
            <div
              className={`grid gap-px mb-5 flex-shrink-0 mx-auto w-full ${podiumCols}`}
              style={{ background: "var(--border)", overflow: "hidden" }}>
              {podium.map((entry, i) => {
                const t       = RANK[i];
                const isFirst = i === 0;
                return (
                  <div
                    key={entry.nome}
                    className={`relative overflow-hidden text-center podium-enter ${isFirst ? "podium-first" : ""}`}
                    style={{
                      padding:        isFirst ? "32px 32px 36px" : "24px 28px 28px",
                      background:     `linear-gradient(170deg, ${t.surface} 0%, var(--bg) 70%)`,
                      borderTop:      `2px solid ${t.border}`,
                      animationDelay: `${i * 0.08}s`,
                    }}>

                    {/* Roman numeral watermark */}
                    <span
                      className="absolute font-display italic select-none pointer-events-none"
                      style={{
                        fontSize: 190, lineHeight: 1, fontWeight: 600,
                        color: `${t.color}0A`,
                        bottom: -18, right: -6, zIndex: 0,
                      }}>
                      {t.roman}
                    </span>

                    <div className="relative" style={{ zIndex: 1 }}>
                      {/* Rank label */}
                      <p className="font-body font-semibold uppercase mb-4"
                        style={{ fontSize: 9, letterSpacing: "0.45em", color: t.dim }}>
                        {i + 1}º Lugar
                      </p>

                      <PodiumAvatar nome={entry.nome} foto={entry.foto} rankIdx={i} />

                      {/* Name */}
                      <p className="font-body font-semibold leading-tight mb-2"
                        style={{ fontSize: isFirst ? "1.35rem" : "1.2rem", color: "var(--text)" }}>
                        {entry.nome}
                      </p>

                      {/* Value — Cormorant Garamond italic, rank color */}
                      <p className="font-display italic"
                        style={{ fontSize: isFirst ? "2.1rem" : "1.85rem", fontWeight: 700, color: t.color, lineHeight: 1.1 }}>
                        {fmt(entry.total_repasse)}
                      </p>

                      {/* Sales count */}
                      <p className="font-body mt-2"
                        style={{ fontSize: 12, color: t.dim }}>
                        {entry.qtd_vendas} {entry.qtd_vendas === 1 ? "venda" : "vendas"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Table ──────────────────────────────────── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full animate-spin"
                  style={{ width: 64, height: 64, border: "3px solid rgba(72,186,184,0.18)", borderTopColor: "rgba(72,186,184,0.85)" }} />
                <span className="font-body font-medium uppercase"
                  style={{ fontSize: 22, letterSpacing: "0.28em", color: "var(--text-2)" }}>
                  Carregando
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center px-10">
              <div className="text-center max-w-3xl">
                <p className="font-body font-semibold uppercase mb-4"
                  style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(248,113,113,0.85)" }}>
                  Erro ao carregar
                </p>
                <p className="font-body" style={{ fontSize: 22, color: "var(--text-2)", lineHeight: 1.4 }}>
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden relative min-h-0">
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10"
                style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />

              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-hi)" }}>
                    {COLS.map(col => (
                      <th key={col.label}
                        className={`font-body font-semibold uppercase pb-3 ${col.cls}`}
                        style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--text-3)" }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody key={`${activeView}-${tablePageIdx}`}>
                  {pageEntries.map((entry, i) => (
                      <tr
                        key={entry.nome}
                        className="row-animate"
                        style={{ borderBottom: "1px solid var(--border)", animationDelay: `${i * 0.05}s` }}>

                        {/* Position */}
                        <td className="py-3.5 pl-7 pr-3">
                          <span
                            className="font-body font-bold tabular-nums"
                            style={{ fontSize: "1.5rem", color: "var(--text-4)" }}>
                            {entry.pos}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-body font-semibold"
                            style={{ fontSize: "1.25rem", color: "var(--text)" }}>
                            {entry.nome}
                          </span>
                        </td>

                        {/* Repasse */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-body font-semibold tabular-nums"
                            style={{ fontSize: "1.25rem", color: "var(--text-2)" }}>
                            {fmt(entry.total_repasse)}
                          </span>
                        </td>

                        {/* Vendas */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-body tabular-nums"
                            style={{ fontSize: "1.25rem", color: "var(--text-2)" }}>
                            {entry.qtd_vendas}
                          </span>
                        </td>

                        {/* Data */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-body tabular-nums"
                            style={{ fontSize: "1.15rem", color: "var(--text-3)" }}>
                            {entry.ultima_venda}
                          </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="flex-shrink-0 pt-3 flex items-center justify-center gap-2.5">
          <span className="inline-block rounded-full animate-pulse"
            style={{ width: 6, height: 6, background: "#34D399" }} />
          <span className="font-body" style={{ fontSize: 11, color: "var(--text-4)" }}>
            Atualiza a cada {REFRESH_INTERVAL / 1000}s
          </span>
        </footer>

      </div>
    </div>
  );
}
