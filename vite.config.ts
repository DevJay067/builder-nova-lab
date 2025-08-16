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
        // Add simple API routes directly to Vite dev server
        server.middlewares.use('/api/auth/demo-login', (req, res, next) => {
          if (req.method === 'POST') {
            const demoSessionToken = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const demoUser = {
              id: "demo_user_id",
              username: "demo_user",
              userHash: "demo_hash_" + Math.random().toString(36).substr(2, 9),
              sessionToken: demoSessionToken,
              firstName: "Demo",
              lastName: "User",
              email: "demo@example.com",
              secureSystemActivated: true,
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', `healthchain_session=${demoSessionToken}; Path=/; Max-Age=3600; SameSite=Strict`);
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              message: "Demo login successful (direct mode)",
              user: demoUser,
              sessionToken: demoSessionToken,
            }));
          } else {
            next();
          }
        });

        server.middlewares.use('/api/auth/verify', (req, res, next) => {
          if (req.method === 'GET') {
            // Get session token from headers
            const authHeader = req.headers.authorization;
            const sessionHeader = req.headers['x-session-token'];
            const sessionToken = authHeader?.replace('Bearer ', '') || sessionHeader;

            res.setHeader('Content-Type', 'application/json');

            if (sessionToken && sessionToken.startsWith('demo_')) {
              // Valid demo session
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                user: {
                  id: "demo_user_id",
                  username: "demo_user",
                  firstName: "Demo",
                  lastName: "User",
                  email: "demo@example.com",
                  secureSystemActivated: true,
                }
              }));
            } else {
              // Invalid or missing session
              res.statusCode = 401;
              res.end(JSON.stringify({
                success: false,
                message: "Invalid session token"
              }));
            }
          } else {
            next();
          }
        });

        server.middlewares.use('/api/health', (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              status: "ok",
              mode: "direct",
              timestamp: new Date().toISOString(),
            }));
          } else {
            next();
          }
        });

        // Add basic health records endpoint
        server.middlewares.use('/api/health-records', (req, res, next) => {
          const authHeader = req.headers.authorization;
          const sessionHeader = req.headers['x-session-token'];
          const sessionToken = authHeader?.replace('Bearer ', '') || sessionHeader;

          res.setHeader('Content-Type', 'application/json');

          if (!sessionToken || !sessionToken.startsWith('demo_')) {
            res.statusCode = 401;
            res.end(JSON.stringify({ success: false, message: "Authentication required" }));
            return;
          }

          if (req.method === 'GET') {
            // Return mock health records for demo
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              records: [
                {
                  id: "1",
                  type: "checkup",
                  title: "Annual Health Checkup",
                  description: "Routine annual physical examination",
                  date: "2024-01-15",
                  doctor: "Dr. Smith",
                  data: { weight: "70kg", height: "175cm" }
                },
                {
                  id: "2",
                  type: "blood_test",
                  title: "Blood Panel Test",
                  description: "Comprehensive metabolic panel including cholesterol",
                  date: "2024-02-10",
                  doctor: "Dr. Johnson",
                  data: { cholesterol: "180mg/dL" }
                }
              ]
            }));
          } else if (req.method === 'POST') {
            // Mock saving a health record
            res.statusCode = 201;
            res.end(JSON.stringify({
              success: true,
              message: "Health record saved successfully",
              recordId: `demo_record_${Date.now()}`
            }));
          } else {
            next();
          }
        });

        console.log("✅ Direct API routes added to Vite server");

        import("./server").then(({ createServer }) => {
          console.log("🚀 Loading Express server...");
          const app = createServer();
          // Add Express app as middleware to Vite dev server
          server.middlewares.use(app);
          console.log("✅ Express server loaded successfully");
        }).catch(async (error) => {
          console.error("❌ Failed to load Express server:", error);
          try {
            // Create a minimal fallback server for API routes
            const express = await import('express');
            const fallbackApp = express.default();
            fallbackApp.use(express.default.json());

            // Add basic demo login route as fallback
            fallbackApp.post('/api/auth/demo-login', (req, res) => {
              const demoSessionToken = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const demoUser = {
                id: "demo_user_id",
                username: "demo_user",
                userHash: "demo_hash_" + Math.random().toString(36).substr(2, 9),
                sessionToken: demoSessionToken,
                firstName: "Demo",
                lastName: "User",
                email: "demo@example.com",
                secureSystemActivated: true,
              };

              res.cookie("healthchain_session", demoSessionToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 60 * 60 * 1000,
              });

              res.json({
                success: true,
                message: "Demo login successful (fallback mode)",
                user: demoUser,
                sessionToken: demoSessionToken,
              });
            });

            // Add health check
            fallbackApp.get('/api/health', (req, res) => {
              res.json({
                status: "ok",
                mode: "fallback",
                timestamp: new Date().toISOString(),
              });
            });

            server.middlewares.use(fallbackApp);
            console.log("⚠️ Using fallback Express server");
          } catch (fallbackError) {
            console.error("❌ Failed to create fallback server:", fallbackError);
          }
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
