// As fotos vêm do upload da plataforma, que a API do Comprec serve em /uploads. Só essa origem passa
// pelo otimizador: com "**", como era na época da planilha, qualquer um usaria o painel como proxy de
// imagens por conta da cota da Vercel. O Next lê esta config no build, não em runtime — se a
// RANKING_API_URL mudar de host sem rebuild, a foto continua aparecendo, porque o avatar cai para a
// URL original quando o otimizador recusa. O default repete o de lib/config.ts.
const origemDasFotos = new URL(
  process.env.RANKING_API_URL?.trim() || "https://api.comprec.origindata.com.br/api/public/ranking",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: origemDasFotos.protocol.replace(":", ""),
        hostname: origemDasFotos.hostname,
        port: origemDasFotos.port,
        pathname: "/uploads/**",
      },
    ],
    // Só WebP: o processador da TV decodifica AVIF bem mais devagar, e numa foto de 300 px a
    // diferença de bytes não compensa.
    formats: ["image/webp"],
    // 30 dias. O nome do arquivo de upload leva um UUID, então foto trocada é URL nova e o cache
    // longo nunca serve a foto antiga.
    minimumCacheTTL: 2_592_000,
  },
};
export default nextConfig;
