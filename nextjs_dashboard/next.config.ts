import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cho phép Leaflet chạy (tắt strict mode để tránh double-mount)
  reactStrictMode: false,
  webpack: (config) => {
    // Cần để @meshsdk/core hoạt động
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
