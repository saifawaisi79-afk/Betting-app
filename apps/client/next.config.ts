import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@betting/types'],
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

export default nextConfig;
