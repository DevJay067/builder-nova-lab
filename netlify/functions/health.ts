import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        message: "Netlify function is working",
        event: {
          path: event.path,
          httpMethod: event.httpMethod,
          headers: Object.keys(event.headers || {}),
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
