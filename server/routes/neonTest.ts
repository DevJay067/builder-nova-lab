import { RequestHandler } from "express";

/**
 * Test Neon database connection
 */
export const testNeonConnection: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Testing Neon database connection...");

    // Check if DATABASE_URL is properly set
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: "DATABASE_URL environment variable is not set",
        troubleshooting: {
          step1:
            "Get your Neon database connection string from https://console.neon.tech",
          step2:
            "Set the DATABASE_URL environment variable using DevServerControl tool",
          step3: "Restart the development server",
        },
      });
    }

    // Parse the connection string to check if it looks valid
    try {
      const url = new URL(databaseUrl);
      const connectionInfo = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        username: url.username
          ? url.username.substring(0, 5) + "***"
          : "not provided",
        hasPassword: !!url.password,
      };

      // Try to connect to the database
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(databaseUrl);

      // Simple test query
      const result = await sql`SELECT 1 as test, NOW() as current_time`;

      return res.json({
        success: true,
        message: "Neon database connection successful",
        connectionInfo,
        testResult: result[0],
        nextSteps: {
          step1: "Database connection is working",
          step2: "You can now use registration and login features",
          step3: "Try registering a new account to test the full system",
        },
      });
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: "Invalid DATABASE_URL format",
        error:
          parseError instanceof Error
            ? parseError.message
            : "Unknown parse error",
        troubleshooting: {
          expectedFormat:
            "postgresql://username:password@hostname/database?sslmode=require",
          currentValue: databaseUrl.substring(0, 20) + "...",
          getNewUrl:
            "Visit https://console.neon.tech to get a valid connection string",
        },
      });
    }
  } catch (error) {
    console.error("❌ Neon connection test failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    let troubleshooting = {};

    if (errorMessage.includes("password authentication failed")) {
      troubleshooting = {
        issue: "Authentication Failed",
        solution: "The username/password in your DATABASE_URL is incorrect",
        steps: [
          "1. Go to https://console.neon.tech",
          "2. Select your database project",
          "3. Go to the 'Connection string' section",
          "4. Copy the connection string with the correct password",
          "5. Update the DATABASE_URL environment variable",
        ],
      };
    } else if (errorMessage.includes("getaddrinfo ENOTFOUND")) {
      troubleshooting = {
        issue: "Hostname Not Found",
        solution: "The database hostname in your DATABASE_URL is incorrect",
        steps: [
          "1. Verify your database hostname in Neon console",
          "2. Make sure the database is not paused",
          "3. Check if the region is correct",
        ],
      };
    } else {
      troubleshooting = {
        issue: "Connection Error",
        solution: "General database connection issue",
        steps: [
          "1. Check if your Neon database is active (not paused)",
          "2. Verify the connection string format",
          "3. Ensure your IP is allowed (Neon allows all by default)",
        ],
      };
    }

    return res.status(500).json({
      success: false,
      message: "Failed to connect to Neon database",
      error: errorMessage,
      troubleshooting,
    });
  }
};

/**
 * Get current database configuration
 */
export const getDatabaseConfig: RequestHandler = (req, res) => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return res.json({
      success: false,
      message: "No database URL configured",
      config: {
        databaseUrl: "Not set",
        status: "No connection configured",
      },
      setupInstructions: {
        step1: "Create a Neon database at https://console.neon.tech",
        step2: "Copy your connection string",
        step3: "Set DATABASE_URL environment variable using DevServerControl",
        step4: "Restart the development server",
      },
    });
  }

  try {
    const url = new URL(databaseUrl);
    return res.json({
      success: true,
      message: "Database configuration found",
      config: {
        provider: "Neon PostgreSQL",
        hostname: url.hostname,
        database: url.pathname.replace("/", ""),
        username: url.username,
        port: url.port || "5432",
        ssl: url.searchParams.has("sslmode"),
      },
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Invalid database URL format",
      config: {
        databaseUrl: databaseUrl.substring(0, 20) + "...",
        status: "Invalid format",
      },
    });
  }
};
