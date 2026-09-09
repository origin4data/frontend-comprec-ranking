import { NextResponse, type NextRequest } from "next/server";

import { autorizado, credenciaisConfiguradas, desafio } from "./lib/basic-auth";

export const config = {
  // Tudo que sai do servidor, inclusive /api/rankings e /api/debug-csv. Ficam de fora só os
  // chunks estáticos do Next e as imagens otimizadas: não carregam dado nenhum e o navegador já
  // manda as credenciais guardadas em todo pedido same-origin de qualquer jeito.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
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
