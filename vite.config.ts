import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  appType: "spa",
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
          ],
          charts: ["recharts"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          utils: ["clsx", "class-variance-authority", "tailwind-merge"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  publicDir: "public",
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  let expressApp: any = null;

  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      try {
        // Create Express app only once
        if (!expressApp) {
          console.log("🔧 Creating Express server instance...");
          expressApp = createServer();
        }

        // Add Express app as middleware to Vite dev server
        server.middlewares.use((req, res, next) => {
          try {
            expressApp(req, res, next);
          } catch (error) {
            console.error("❌ Express middleware error:", error);
            next(error);
          }
        });

        console.log("✅ Express middleware configured successfully");
      } catch (error) {
        console.error("❌ Failed to configure Express plugin:", error);
        // Don't throw, let Vite continue without Express
      }
    },
    buildStart() {
      console.log("🚀 Vite build starting...");
    },
    buildEnd() {
      console.log("✅ Vite build completed");
    },
  };
}
