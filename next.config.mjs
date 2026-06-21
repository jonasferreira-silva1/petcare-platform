/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: "standalone" só é necessário para Docker.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
}

export default nextConfig
