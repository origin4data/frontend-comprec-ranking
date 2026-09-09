/**
 * Basic auth do painel, ligado só quando BASIC_AUTH_USER e BASIC_AUTH_PASSWORD estão preenchidos
 * (ambos: um só não basta). Puro e sem dependência do Next, para o middleware ficar com uma linha e
 * a regra poder ser testada isolada.
 */

export const REALM = "Ranking Comprec";

export type Credenciais = { usuario: string; senha: string };

/** Lê as credenciais do ambiente; `null` quando o basic auth está desligado. */
export function credenciaisConfiguradas(env: Record<string, string | undefined>): Credenciais | null {
  const usuario = env.BASIC_AUTH_USER?.trim() ?? "";
  const senha = env.BASIC_AUTH_PASSWORD ?? "";
  if (!usuario || !senha) return null;
  return { usuario, senha };
}

/**
 * Compara em tempo constante para o mesmo comprimento: o laço não para no primeiro byte diferente,
 * então o tempo de resposta não conta quantos caracteres da senha estão certos.
 */
function iguais(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diferenca = 0;
  for (let i = 0; i < x.length; i++) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}

/** Decodifica o `Basic <base64>` como UTF-8; `null` se o header não é basic auth válido. */
export function decodificar(header: string | null): Credenciais | null {
  if (!header) return null;
  const [esquema, valor] = header.split(" ");
  if (esquema !== "Basic" || !valor) return null;
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(valor), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  const texto = new TextDecoder().decode(bytes);
  const separador = texto.indexOf(":");
  if (separador < 0) return null;
  return { usuario: texto.slice(0, separador), senha: texto.slice(separador + 1) };
}

export function autorizado(header: string | null, esperado: Credenciais): boolean {
  const recebido = decodificar(header);
  if (!recebido) return false;
  // Sem curto-circuito: usuário errado e senha errada custam o mesmo tempo.
  const usuarioBate = iguais(recebido.usuario, esperado.usuario);
  const senhaBate = iguais(recebido.senha, esperado.senha);
  return usuarioBate && senhaBate;
}

/** 401 com o desafio que faz o navegador da TV pedir usuário e senha (uma vez; ele guarda). */
export function desafio(): Response {
  return new Response("Autenticação necessária", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
