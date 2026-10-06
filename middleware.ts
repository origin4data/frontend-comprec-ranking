import { NextResponse, type NextRequest } from "next/server";

import { autorizado, credenciaisConfiguradas, desafio } from "./lib/basic-auth";

export const config = {
  // Tudo que sai do servidor, inclusive /api/rankings e /api/debug-csv. Ficam de fora só os
  // chunks estáticos do Next, as imagens otimizadas e os logos de public/images: não carregam dado
  // nenhum e o navegador já manda as credenciais guardadas em todo pedido same-origin de qualquer
  // jeito.
  //
  // Os logos precisam ficar de fora por outro motivo: na Vercel, o otimizador busca o arquivo local
  // num pedido próprio, que passa por este middleware. Com /images protegido, o
  // /_next/image?url=/images/... voltava o 401 daqui (conferido em 06/10/2026).
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"],
};

/**
 * Lê BASIC_AUTH_USER/BASIC_AUTH_PASSWORD em runtime (não são NEXT_PUBLIC_*, então não entram no
 * bundle): trocar na stack e redeployar basta, sem rebuild. Vazias, o painel fica aberto como antes.
 */
export function middleware(request: NextRequest) {
  const esperado = credenciaisConfiguradas(process.env);
  if (!esperado) return NextResponse.next();
  if (autorizado(request.headers.get("authorization"), esperado)) return NextResponse.next();
  return desafio();
}
