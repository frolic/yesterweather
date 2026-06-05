import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // GITHUB_SHA is set automatically in GitHub Actions; empty for local builds.
  define: {
    __COMMIT_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? ""),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Yesterweather",
        short_name: "Yesterweather",
        description:
          "Compare how today will feel against the past few days you actually lived through.",
        theme_color: "#0b1120",
        background_color: "#0b1120",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
