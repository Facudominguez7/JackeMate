/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.0.107'],
  // The home is the map. Serving it at `/` with a rewrite saves the browser the
  // extra round trip of a redirect before the page starts loading.
  async rewrites() {
    return [{ source: '/', destination: '/mapa' }]
  },
  experimental: {
    serverActions: {
      // Optimized photo (2.5 MB) + thumbnail (512 KB) + multipart overhead; Vercel caps requests at 4.5 MB.
      bodySizeLimit: '4mb',
    },
  },
}


export default nextConfig
