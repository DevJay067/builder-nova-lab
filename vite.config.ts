import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  appType: "spa",
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      external: [
        // Node.js built-ins that should not be bundled
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        "zlib",
        "net",
        "tls",
        "dns",
        "assert",
        "constants",
        "domain",
        "punycode",
        "string_decoder",
        "timers",
        "tty",
        "vm",
        "worker_threads",
        // Server-side dependencies that should not be bundled with client
        "express",
        "cors",
        "cookie-parser",
        "dotenv",
        "bcrypt",
        "bcryptjs",
        "@neondatabase/serverless",
        "serverless-http",
        "zod",
      ],
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
  // Prevent server-side code from being processed
  optimizeDeps: {
    exclude: ["fs", "path", "crypto", "os", "util", "events", "stream", "buffer"],
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Only import and configure Express during development
      if (process.env.NODE_ENV !== "production") {
        import("./server").then(({ createServer }) => {
          const app = createServer();
          
          // Add Express app as middleware to Vite dev server
          // This will handle all requests and pass through to Vite if not handled
          server.middlewares.use((req, res, next) => {
            // Check if this is an API request
            if (req.url?.startsWith("/api")) {
              // Handle API requests with Express
              app(req, res, next);
            } else {
              // Pass through to Vite for non-API requests
              next();
            }
          });
          
          console.log("✅ Express server middleware configured");
        }).catch((error) => {
          console.error("❌ Failed to load Express server:", error);
        });
      }
    },
    // Prevent server-side code from being processed during client build
    transform(code, id) {
      if (id.includes("/server/") && process.env.NODE_ENV === "production") {
        return {
          code: "// Server-side code excluded from client build",
          map: null,
        };
      }
      return null;
    },
  };
}
