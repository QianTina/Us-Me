import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kqbqekcwlwqyhfcunezr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.supabase.co',
      },
    ],
  },
};

export default nextConfig;
