/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'vercel.app', 'jobflow-2025.vercel.app'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
}

module.exports = nextConfig 