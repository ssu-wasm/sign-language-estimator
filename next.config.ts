import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath,
  reactCompiler: true,
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // 클라이언트 사이드에서 require를 처리
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }

    return config;
  },
};

export default nextConfig;
