/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Permite qualquer host HTTPS — fotos vêm da planilha (URLs livres)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
};
export default nextConfig;
