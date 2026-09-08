// Fonte de dados do painel: a API do Comprec, que apura venda lançada mais ajuste manual sobre o
// banco da plataforma. Não existe outra — a planilha do Apps Script deixou de ser origem, e foi ela
// que manteve o quadro mensal em R$ 0 por ter renomeado a coluna de valor para "Coluna 2".
//
// Lida no servidor, em runtime. Não use NEXT_PUBLIC_* aqui: o define-env do Next inlina no bundle
// qualquer NEXT_PUBLIC_* presente no ambiente durante o build, e a partir daí a variável do Swarm
// passa a ser ignorada em silêncio — foi assim que NEXT_PUBLIC_SHEETS_JSON_URL virou enfeite no
// docker-compose.
//
// /api/rankings é pré-renderizada no build (ela exporta revalidate = 10), então o contêiner serve o
// corpo gerado no build até a primeira revalidação, ~10s depois de subir. Uma troca de
// RANKING_API_URL vale a partir daí, não no primeiro request.
//
// O default aponta para produção para que um clone novo funcione sem configuração nenhuma; a env
// var existe para apontar o painel a um ambiente de teste.
export const RANKING_API_URL_DEFAULT =
  "https://api.comprec.origindata.com.br/api/public/ranking";

// Chave do painel, quando o backend exigir. Hoje o servidor esta com RANKING_PUBLIC_KEY vazia e a
// rota publica esta aberta, entao o header so e enviado se esta variavel existir - ligar depois e
// preencher a env var e reiniciar, sem novo deploy de codigo.
//
// Server-only, como a URL: esta chave e um segredo de verdade (quem busca e este servidor Next,
// nao o navegador do visitante) e nao pode acabar no bundle do cliente.
export function rankingApiKey(): string | undefined {
  return process.env.RANKING_API_KEY?.trim() || undefined;
}

/** A URL da origem, sem período. Serve de base para resolver caminho relativo de foto. */
export function rankingSourceUrl(): string {
  return process.env.RANKING_API_URL?.trim() || RANKING_API_URL_DEFAULT;
}

export type Periodo = { ano: number; mes: number };

/**
 * Ano e mês correntes **em São Paulo**, não no fuso do contêiner.
 *
 * O contêiner roda em UTC: dia 30 às 21h de Brasília já é dia 1º em UTC. Deixar o servidor decidir
 * o mês faria o quadro virar três horas antes de o cabeçalho da TV trocar o rótulo — o painel
 * diria "Setembro" exibindo outubro. Mesmo cálculo do `hojeEmSaoPaulo()` da plataforma, para que
 * os dois lados peçam sempre o mesmo recorte.
 */
export function periodoAtual(): Periodo {
  const [ano, mes] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })
    .format(new Date())
    .split("-")
    .map(Number);
  return { ano, mes };
}

/**
 * A URL a buscar e o período que ela de fato pede.
 *
 * O período vai explícito na query em vez de deixar o backend assumir "o mês corrente": é o que faz
 * o rótulo do cabeçalho e os números serem sempre o mesmo mês, e alinha a chave de cache com a da
 * plataforma, que já chama com `?ano=&mes=`.
 *
 * Um `ano`/`mes` já presente em RANKING_API_URL é respeitado — é como se fixa o painel num mês
 * específico para conferência, sem mexer no código.
 */
export function rankingSource(): { url: string; periodo: Periodo } {
  const base = rankingSourceUrl();
  const agora = periodoAtual();

  try {
    const url = new URL(base);
    const periodo: Periodo = {
      ano: Number(url.searchParams.get("ano")) || agora.ano,
      mes: Number(url.searchParams.get("mes")) || agora.mes,
    };
    url.searchParams.set("ano", String(periodo.ano));
    url.searchParams.set("mes", String(periodo.mes));
    return { url: url.toString(), periodo };
  } catch {
    // URL inválida na env var: devolve como veio e deixa o fetch falhar com a mensagem dele, que
    // diz mais do que um erro de parsing daqui.
    return { url: base, periodo: agora };
  }
}
