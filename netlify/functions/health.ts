export default async function handler(request: Request): Promise<Response> {
  // Simple health check that doesn't require database
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "netlify-function",
    uptime: process.uptime(),
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
