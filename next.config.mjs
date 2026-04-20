/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Permite qualquer host HTTPS — fotos vêm da planilha (URLs livres)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    // Cacheia imagens otimizadas por 24h — evita bombardear o Imgur (rate limit 429)
    minimumCacheTTL: 86_400,
  },
};
export default nextConfig;
