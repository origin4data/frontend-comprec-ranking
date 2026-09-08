"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { RankingEntry } from "@/lib/types";

const REFRESH_INTERVAL    = 15_000;
const CAROUSEL_INTERVAL   = 22_000;
const TRANSITION_MS       = 400;
const TABLE_PAGE_INTERVAL = 6_000;

// A TV em pé tem muito mais altura útil — cabe quase o dobro de linhas
const TABLE_PAGE_PORTRAIT  = 8;
const TABLE_PAGE_LANDSCAPE = 5;

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

// Retrato é o alvo (TV em pé) — inicia em true para o SSR bater com o 1º render
function useIsPortrait() {
  const [portrait, setPortrait] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return portrait;
}

type View = "mensal" | "anual";

// ── Avatar component ──────────────────────────────────────────
function PodiumAvatar({
  nome, foto, rankIdx, size, className = "",
}: { nome: string; foto?: string; rankIdx: number; size: string; className?: string }) {
  const t        = RANK[rankIdx] ?? RANK[2];
  const isFirst  = rankIdx === 0;
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
      className={`rounded-full flex items-center justify-center font-body font-semibold flex-shrink-0 ${className}`}
      style={{ ...ring, background: t.surface, color: t.color, fontSize: `calc(${size} * 0.3)`, letterSpacing: "0.07em" }}>
      {initials}
    </div>
  ) : (
    <div className={`rounded-full overflow-hidden flex-shrink-0 relative ${className}`} style={ring}>
      <Image
        src={foto!}
        alt={nome}
        fill
        sizes={size}
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
    <div className="text-center" style={{ padding: "0 var(--stat-gap)" }}>
      <p className="font-body font-medium uppercase mb-1.5"
        style={{ fontSize: "var(--fs-stat-label)", letterSpacing: "0.25em", color: "var(--text-3)" }}>
        {label}
      </p>
      <p className="font-body font-bold tabular-nums leading-none"
        style={{ fontSize: "var(--fs-stat-value)", color: accent ? "var(--gold)" : "var(--text-2)" }}>
        {value}
      </p>
    </div>
  );
}

// ── Podium card ───────────────────────────────────────────────
// `layout` decide a forma: "hero"/"row" (TV em pé) ou "stack" (paisagem)
function PodiumCard({
  entry, rankIdx, layout, fmt,
}: {
  entry: RankingEntry;
  rankIdx: number;
  layout: "hero" | "row" | "stack";
  fmt: (v: number) => string;
}) {
  const t         = RANK[rankIdx] ?? RANK[2];
  const isFirst   = rankIdx === 0;
  const horizontal = layout !== "stack";

  const avatarSize = isFirst ? "var(--avatar-1)" : "var(--avatar-2)";
  const nameSize   = isFirst ? "var(--fs-name-1)"  : "var(--fs-name-2)";
  const valueSize  = isFirst ? "var(--fs-value-1)" : "var(--fs-value-2)";
  const cardPad    = isFirst ? "var(--card-pad-1)" : "var(--card-pad-2)";

  const info = (
    <div className={horizontal ? "flex-1 min-w-0 text-left" : ""}>
      <p className="font-body font-semibold uppercase"
        style={{
          fontSize: "var(--fs-rank-label)",
          letterSpacing: "0.45em",
          color: t.dim,
          marginBottom: horizontal ? "0.8em" : "1.6em",
        }}>
        {rankIdx + 1}º Lugar
      </p>

      {!horizontal && (
        <PodiumAvatar nome={entry.nome} foto={entry.foto} rankIdx={rankIdx}
          size={avatarSize} className="mx-auto mb-5" />
      )}

      <p className="font-body font-semibold leading-tight mb-2 truncate"
        style={{ fontSize: nameSize, color: "var(--text)" }}>
        {entry.nome}
      </p>

      <p className="font-display italic"
        style={{ fontSize: valueSize, fontWeight: 700, color: t.color, lineHeight: 1.1 }}>
        {fmt(entry.total_repasse)}
      </p>

      <p className="font-body mt-2"
        style={{ fontSize: "var(--fs-sales)", color: t.dim }}>
        {entry.qtd_vendas} {entry.qtd_vendas === 1 ? "venda" : "vendas"}
      </p>
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden podium-enter ${isFirst ? "podium-first" : ""} ${horizontal ? "" : "text-center"}`}
      style={{
        padding:        cardPad,
        background:     `linear-gradient(${horizontal ? "100deg" : "170deg"}, ${t.surface} 0%, var(--bg) 70%)`,
        borderTop:      `2px solid ${t.border}`,
        animationDelay: `${rankIdx * 0.08}s`,
      }}>

      {/* Roman numeral watermark */}
      <span
        className="absolute font-display italic select-none pointer-events-none"
        style={{
          fontSize: "var(--roman-size)", lineHeight: 1, fontWeight: 600,
          color: `${t.color}0A`,
          bottom: "-0.1em", right: "-0.03em", zIndex: 0,
        }}>
        {t.roman}
      </span>

      {horizontal ? (
        <div className="relative flex items-center" style={{ zIndex: 1, gap: cardPad }}>
          <PodiumAvatar nome={entry.nome} foto={entry.foto} rankIdx={rankIdx} size={avatarSize} />
          {info}
        </div>
      ) : (
        <div className="relative" style={{ zIndex: 1 }}>{info}</div>
      )}
    </div>
  );
}

// ── Table column definitions ──────────────────────────────────
// Largura em % — o mesmo grid serve para 1080 de largura (em pé) e 1920 (deitado)
const COLS = [
  { label: "#",            align: "text-left"   as const, width: "8%"  },
  { label: "Vendedor",     align: "text-left"   as const, width: "33%" },
  { label: "Repasse",      align: "text-right"  as const, width: "21%" },
  { label: "Vendas",       align: "text-center" as const, width: "13%" },
  { label: "Última Venda", align: "text-center" as const, width: "25%" },
];

export default function TVPage() {
  const [mensalRanking, setMensalRanking] = useState<RankingEntry[]>([]);
  const [anualRanking,  setAnualRanking]  = useState<RankingEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [updatedAt,     setUpdatedAt]     = useState<string | null>(null);
  const [activeView,    setActiveView]    = useState<View>("mensal");
  const [transitioning, setTransitioning] = useState(false);
  const [tablePageIdx,  setTablePageIdx]  = useState(0);

  const isPortrait = useIsPortrait();
  const pageSize   = isPortrait ? TABLE_PAGE_PORTRAIT : TABLE_PAGE_LANDSCAPE;

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

  // Reset table page when view (mensal/anual) or page size changes
  useEffect(() => { setTablePageIdx(0); }, [activeView, pageSize]);

  // Table excludes top 3 (already in podium) and paginates in groups of pageSize
  const tableEntries = ranking.slice(3);
  const totalPages   = Math.max(1, Math.ceil(tableEntries.length / pageSize));
  const pageEntries  = tableEntries.slice(tablePageIdx * pageSize, (tablePageIdx + 1) * pageSize);

  // Auto-rotate table pages
  useEffect(() => {
    if (totalPages <= 1) return;
    const iv = setInterval(() => setTablePageIdx(p => (p + 1) % totalPages), TABLE_PAGE_INTERVAL);
    return () => clearInterval(iv);
  }, [totalPages]);

  const totalVendas  = ranking.reduce((s, r) => s + r.qtd_vendas, 0);
  const animVendas   = useCountUp(totalVendas, 900);

  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const podium = ranking.slice(0, 3);
  const runnersUp = podium.slice(1);
  const podiumCols =
    podium.length === 1 ? "grid-cols-1 max-w-xs" :
    podium.length === 2 ? "grid-cols-2 max-w-2xl" :
    "grid-cols-3 max-w-5xl";

  return (
    <div className="grain tv-shell relative w-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>

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

      <div
        className="relative z-10 mx-auto w-full h-full flex flex-col"
        style={{ maxWidth: isPortrait ? "none" : 1600, padding: "var(--pad-y) var(--pad-x)" }}>

        {/* ── Header ──────────────────────────────────── */}
        <header className="flex-shrink-0 text-center" style={{ marginBottom: "var(--stack)" }}>

          {/* Logo + live indicator */}
          <div className="flex items-center justify-center gap-5" style={{ marginBottom: "var(--stack)" }}>
            <div className="rule-teal" style={{ flex: 1, maxWidth: "var(--rule-w)" }} />
            <div className="flex items-center gap-4">
              <Image
                src="/images/logoNomeWhite.png"
                alt="Comprec"
                width={220} height={44}
                className="w-auto opacity-60"
                style={{ height: "var(--logo-h)" }}
                priority
              />
              <div style={{ width: 1, height: "var(--logo-h)", background: "rgba(255,255,255,0.12)" }} />
              <div className="flex items-center gap-2">
                <span className="relative flex" style={{ width: "0.6em", height: "0.6em", fontSize: "var(--fs-live)" }}>
                  <span className="animate-ping absolute inline-flex rounded-full w-full h-full opacity-55"
                    style={{ background: "var(--teal)" }} />
                  <span className="relative inline-flex rounded-full w-full h-full"
                    style={{ background: "var(--teal)" }} />
                </span>
                <span className="font-body font-medium uppercase"
                  style={{ fontSize: "var(--fs-live)", letterSpacing: "0.3em", color: "rgba(72,186,184,0.5)" }}>
                  Ao Vivo{time ? ` · ${time}` : ""}
                </span>
              </div>
            </div>
            <div className="rule-teal" style={{ flex: 1, maxWidth: "var(--rule-w)" }} />
          </div>

          {/* Main title */}
          <h1
            className="font-display italic leading-none"
            style={{ fontSize: "var(--fs-title)", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)", marginBottom: "var(--stack)" }}>
            Ranking de Vendedores
          </h1>

          {/* Gold rule */}
          <div className="rule-gold mx-auto" style={{ width: "var(--rule-w)", marginBottom: "var(--stack)" }} />

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
                      fontSize: "var(--fs-tab)",
                      letterSpacing: "0.22em",
                      padding: "var(--tab-pad)",
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
            <div className="flex items-center justify-center flex-shrink-0" style={{ marginBottom: "var(--stack)" }}>
              <StatItem label="Vendedores"      value={String(ranking.length)} />
              <div style={{ width: 1, height: "1.6em", fontSize: "var(--fs-stat-value)", background: "var(--border-hi)" }} />
              <StatItem label="Total de Vendas" value={String(animVendas)} />
            </div>
          )}

          {/* ── Podium ─────────────────────────────────── */}
          {!loading && podium.length > 0 && (
            isPortrait ? (
              /* TV em pé: 1º lugar em destaque de largura total, 2º e 3º lado a lado */
              <div className="flex flex-col gap-px flex-shrink-0 w-full"
                style={{ background: "var(--border)", marginBottom: "var(--stack)" }}>
                <PodiumCard entry={podium[0]} rankIdx={0} layout="hero" fmt={fmt} />
                {runnersUp.length > 0 && (
                  <div className={`grid gap-px ${runnersUp.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                    style={{ background: "var(--border)" }}>
                    {runnersUp.map((entry, i) => (
                      <PodiumCard key={entry.id ?? `${entry.nome}-${entry.pos}`} entry={entry} rankIdx={i + 1} layout="row" fmt={fmt} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Paisagem: três colunas clássicas */
              <div
                className={`grid gap-px flex-shrink-0 mx-auto w-full ${podiumCols}`}
                style={{ background: "var(--border)", overflow: "hidden", marginBottom: "var(--stack)" }}>
                {podium.map((entry, i) => (
                  <PodiumCard key={entry.id ?? `${entry.nome}-${entry.pos}`} entry={entry} rankIdx={i} layout="stack" fmt={fmt} />
                ))}
              </div>
            )
          )}

          {/* ── Table ──────────────────────────────────── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full animate-spin"
                  style={{ width: "3em", height: "3em", fontSize: "var(--fs-stat-value)", border: "3px solid rgba(72,186,184,0.18)", borderTopColor: "rgba(72,186,184,0.85)" }} />
                <span className="font-body font-medium uppercase"
                  style={{ fontSize: "var(--fs-name-2)", letterSpacing: "0.28em", color: "var(--text-2)" }}>
                  Carregando
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center px-10">
              <div className="text-center max-w-3xl">
                <p className="font-body font-semibold uppercase mb-4"
                  style={{ fontSize: "var(--fs-tab)", letterSpacing: "0.3em", color: "rgba(248,113,113,0.85)" }}>
                  Erro ao carregar
                </p>
                <p className="font-body" style={{ fontSize: "var(--fs-name-2)", color: "var(--text-2)", lineHeight: 1.4 }}>
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden relative min-h-0">
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                style={{ height: "var(--stack)", background: "linear-gradient(to top, var(--bg), transparent)" }} />

              <table className="w-full" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  {COLS.map(col => <col key={col.label} style={{ width: col.width }} />)}
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-hi)" }}>
                    {COLS.map((col, i) => (
                      <th key={col.label}
                        className={`font-body font-semibold uppercase whitespace-nowrap ${col.align}`}
                        style={{
                          fontSize: "var(--fs-th)", letterSpacing: "0.16em", color: "var(--text-3)",
                          paddingBottom: "var(--row-py)",
                          paddingLeft:  i === 0 ? "1.4em" : "0.6em",
                          paddingRight: i === COLS.length - 1 ? "1.4em" : "0.6em",
                        }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody key={`${activeView}-${tablePageIdx}`}>
                  {pageEntries.map((entry, i) => {
                    const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
                      paddingTop: "var(--row-py)", paddingBottom: "var(--row-py)",
                      paddingLeft: "0.6em", paddingRight: "0.6em", ...extra,
                    });
                    return (
                      <tr
                        key={entry.id ?? `${entry.nome}-${entry.pos}`}
                        className="row-animate"
                        style={{ borderBottom: "1px solid var(--border)", animationDelay: `${i * 0.05}s` }}>

                        {/* Position */}
                        <td className="text-left" style={cell({ paddingLeft: "1.4em" })}>
                          <span
                            className="font-body font-bold tabular-nums"
                            style={{ fontSize: "var(--fs-td-pos)", color: "var(--text-4)" }}>
                            {entry.pos}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="text-left" style={cell()}>
                          <span className="font-body font-semibold block truncate"
                            style={{ fontSize: "var(--fs-td)", color: "var(--text)" }}>
                            {entry.nome}
                          </span>
                        </td>

                        {/* Repasse */}
                        <td className="text-right" style={cell()}>
                          <span className="font-body font-semibold tabular-nums"
                            style={{ fontSize: "var(--fs-td)", color: "var(--text-2)" }}>
                            {fmt(entry.total_repasse)}
                          </span>
                        </td>

                        {/* Vendas */}
                        <td className="text-center" style={cell()}>
                          <span className="font-body tabular-nums"
                            style={{ fontSize: "var(--fs-td)", color: "var(--text-2)" }}>
                            {entry.qtd_vendas}
                          </span>
                        </td>

                        {/* Data */}
                        <td className="text-center" style={cell({ paddingRight: "1.4em" })}>
                          <span className="font-body tabular-nums"
                            style={{ fontSize: "var(--fs-td-date)", color: "var(--text-3)" }}>
                            {entry.ultima_venda}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="flex-shrink-0 flex items-center justify-center gap-4"
          style={{ paddingTop: "calc(var(--stack) * 0.6)" }}>

          {/* Indicador de página da tabela */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <span key={i} className="rounded-full transition-all duration-500"
                  style={{
                    width: i === tablePageIdx ? "1.4em" : "0.5em", height: "0.5em",
                    fontSize: "var(--fs-footer)",
                    background: i === tablePageIdx ? "var(--teal)" : "var(--text-4)",
                  }} />
              ))}
              <div style={{ width: 1, height: "1em", fontSize: "var(--fs-footer)", background: "var(--border-hi)", marginLeft: "0.5em" }} />
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <span className="inline-block rounded-full animate-pulse"
              style={{ width: "0.55em", height: "0.55em", fontSize: "var(--fs-footer)", background: "#34D399" }} />
            <span className="font-body" style={{ fontSize: "var(--fs-footer)", color: "var(--text-4)" }}>
              Atualiza a cada {REFRESH_INTERVAL / 1000}s
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
