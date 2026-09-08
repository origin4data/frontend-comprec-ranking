// Fonte de dados do painel.
//
// Lida no servidor, em runtime. Não use NEXT_PUBLIC_* aqui: o define-env do Next inlina no bundle
// qualquer NEXT_PUBLIC_* presente no ambiente durante o build, e a partir daí a variável do Swarm
// passa a ser ignorada em silêncio.
//
// /api/rankings continua sendo pré-renderizada no build (ela exporta revalidate = 10), então o
// contêiner serve o corpo gerado no build até a primeira revalidação, ~10s depois de subir. Uma
// troca de RANKING_API_URL vale a partir daí, não no primeiro request — é essa janela que já fez
// parecer, no passado, que a variável era ignorada.
//
// Por isso o default aponta para a API e não para a planilha: assim até o corpo pré-renderizado
// sai da fonte certa, e a janela deixa de importar na prática. Também faz um clone novo funcionar
// sem configuração nenhuma.
//
// Rollback: RANKING_API_URL = LEGACY_APPS_SCRIPT_URL devolve a TV para a planilha sem rebuild nem
// nova imagem.
export const RANKING_API_URL_DEFAULT =
  "https://api.comprec.origindata.com.br/api/public/ranking";

export const LEGACY_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZbdBVsfetr33B8-CAfLBa29yywBu_pQOeyv6esuruwdXfefiQzya5DJkX7YQm0Aug/exec";

// Chave do painel, quando o backend exigir. Hoje o servidor esta com RANKING_PUBLIC_KEY vazia e a
// rota publica esta aberta, entao o header so e enviado se esta variavel existir - ligar depois e
// preencher a env var e reiniciar, sem novo deploy de codigo.
//
// Server-only, como a URL: esta chave e um segredo de verdade (quem busca e este servidor Next,
// nao o navegador do visitante) e nao pode acabar no bundle do cliente.
export function rankingApiKey(): string | undefined {
  return process.env.RANKING_API_KEY?.trim() || undefined;
}

export function rankingSourceUrl(): string {
  return process.env.RANKING_API_URL?.trim() || RANKING_API_URL_DEFAULT;
}
