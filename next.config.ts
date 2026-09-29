import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export" supprimé → active le SSR (Server Components, generateMetadata)
  // Nécessaire pour les meta OpenGraph dynamiques par article
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
