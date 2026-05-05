import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
      {
        source: '/api/ai/:path*',
        destination: 'http://localhost:3010/api/:path*',
      },
    ]
  },
}

export default nextConfig
