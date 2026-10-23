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
      // Optimized photo (100 KB) + thumbnail (100 KB) + the form fields and multipart overhead.
      bodySizeLimit: '1mb',
    },
  },
}


export default nextConfig
