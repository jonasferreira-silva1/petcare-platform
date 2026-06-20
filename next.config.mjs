/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Gera um bundle standalone para o Docker (inclui server.js próprio)
  output: "standalone",
}

export default nextConfig
