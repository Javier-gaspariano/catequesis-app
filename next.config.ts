import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // en producción: agregar aquí el dominio del bucket/CDN de imágenes subidas por el admin
    ],
  },
};

export default nextConfig;
