import type { Handler } from "@netlify/functions";

let serverHandler: any = null;

const getServerHandler = async () => {
  if (!serverHandler) {
    try {
      // Dynamic import to avoid bundling issues
      const serverless = await import("serverless-http");
      const { createServer } = await import("../../server");

      console.log("Initializing server handler...");
      const app = createServer();
      serverHandler = serverless.default(app);
      console.log("Server handler initialized successfully");
    } catch (error) {
      console.error("Failed to initialize server handler:", error);
      throw error;
    }
  }
  return serverHandler;
};

export const handler: Handler = async (event, context) => {
  try {
    // Set longer timeout for initialization
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("Netlify function called:", event.path);

    const serverHandler = await getServerHandler();
    return await serverHandler(event, context);
  } catch (error) {
    console.error("Netlify function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Server error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
