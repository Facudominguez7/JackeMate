/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.0.107'],
  // The home is the map. Config redirects run before the proxy, so `/` answers
  // without a Supabase Auth round trip or a page render.
  async redirects() {
    return [{ source: '/', destination: '/mapa', permanent: false }]
  },
  experimental: {
    serverActions: {
      // Optimized photo (2.5 MB) + thumbnail (512 KB) + multipart overhead; Vercel caps requests at 4.5 MB.
      bodySizeLimit: '4mb',
    },
  },
}


export default nextConfig
