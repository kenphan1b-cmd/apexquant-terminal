import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable cacheComponents to allow Math.random() in client components */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
