import type { Handler } from "@netlify/functions";

let serverHandler: any = null;

const getServerHandler = async () => {
  if (!serverHandler) {
    try {
      console.log("Starting server initialization...");
      
      // Dynamic import to avoid bundling issues
      const serverless = await import("serverless-http");
      console.log("Serverless-http imported successfully");
      
      const { createServer } = await import("../../server");
      console.log("Server module imported successfully");
      
      console.log("Creating server instance...");
      const app = createServer();
      console.log("Server instance created successfully");
      
      serverHandler = serverless.default(app);
      console.log("Server handler initialized successfully");
      
    } catch (error) {
      console.error("Failed to initialize server handler:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // Return a fallback handler instead of throwing
      serverHandler = {
        async (event: any, context: any) {
          console.log("Using fallback handler for request:", event.path);
          
          // Handle CORS preflight requests
          if (event.httpMethod === 'OPTIONS') {
            return {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              },
              body: ""
            };
          }
          
          return {
            statusCode: 503,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            },
            body: JSON.stringify({
              error: "Server initialization failed",
              message: "The server is temporarily unavailable. Please try again later.",
              details: process.env.NODE_ENV === "development" ? error.message : undefined,
              timestamp: new Date().toISOString(),
            }),
          };
        }
      };
    }
  }
  return serverHandler;
};

export const handler: Handler = async (event, context) => {
  try {
    // Set longer timeout for initialization
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("Netlify function called:", {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers
    });

    const serverHandler = await getServerHandler();
    const result = await serverHandler(event, context);
    
    console.log("Request handled successfully:", {
      statusCode: result.statusCode,
      path: event.path
    });
    
    return result;
    
  } catch (error) {
    console.error("Netlify function error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

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
        message: "Server error occurred. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
