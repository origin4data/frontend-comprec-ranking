// Fonte de dados do painel.
//
// Lida no servidor, em runtime. Não use NEXT_PUBLIC_* aqui: o define-env do Next inlina no bundle
// qualquer NEXT_PUBLIC_* presente no ambiente durante o build, e a partir daí a variável do Swarm
// passa a ser ignorada em silêncio.
//
// Ler uma env var server-only aqui tem um efeito colateral bem-vindo: /api/rankings deixa de ser
// pré-renderizada no build e passa a ser dinâmica. Antes ela era estática (o NEXT_PUBLIC_* sumia
// na inlinagem e não sobrava acesso a process.env), e o contêiner servia o corpo congelado do
// build nos primeiros ~10s de vida — janela que fez parecer, no passado, que a variável de
// ambiente era ignorada. O cache de 10s do fetch interno continua valendo, então o número de
// chamadas à origem não muda.
//
// O default existe para que um clone novo funcione sem configuração nenhuma.
//
// Rollback: RANKING_API_URL = LEGACY_APPS_SCRIPT_URL devolve a TV para a planilha sem rebuild nem
// nova imagem.
export const RANKING_API_URL_DEFAULT =
  "https://api.comprec.origindata.com.br/api/public/ranking";

export const LEGACY_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZbdBVsfetr33B8-CAfLBa29yywBu_pQOeyv6esuruwdXfefiQzya5DJkX7YQm0Aug/exec";

export function rankingSourceUrl(): string {
  return process.env.RANKING_API_URL?.trim() || RANKING_API_URL_DEFAULT;
}
