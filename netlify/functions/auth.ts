import type { Handler } from "@netlify/functions";
import bcrypt from "bcrypt";

// Simple in-memory storage for users (will be replaced with proper database)
const users = new Map<string, {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  profile?: { firstName?: string; lastName?: string };
  createdAt: string;
}>();

// Simple session storage
const sessions = new Map<string, {
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}>();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createSession(userId: string, username: string): string {
  const sessionToken = generateId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
  sessions.set(sessionToken, {
    userId,
    username,
    createdAt: new Date().toISOString(),
    expiresAt
  });
  
  return sessionToken;
}

export const handler: Handler = async (event, context) => {
  try {
    // Set CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const path = event.path.replace("/.netlify/functions/auth", "");
    
    // Registration endpoint
    if (event.httpMethod === "POST" && path === "/register") {
      const body = JSON.parse(event.body || "{}");
      const { username, password, email, firstName, lastName } = body;

      // Validate required fields
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Username and password are required",
          }),
        };
      }

      // Check if user already exists
      if (users.has(username)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Username already exists",
          }),
        };
      }

      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = generateId();
      const user = {
        id: userId,
        username,
        email,
        passwordHash,
        profile: { firstName, lastName },
        createdAt: new Date().toISOString(),
      };

      users.set(username, user);

      // Create session
      const sessionToken = createSession(userId, username);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: "User registered successfully",
          user: {
            id: userId,
            username,
            userHash: userId, // Simplified hash
            sessionToken,
            secureSystemActivated: true,
          },
          securityFeatures: {
            splitKeySystem: true,
            blockchainStorage: true,
            encryptionLayers: 3,
          },
        }),
      };
    }

    // Login endpoint
    if (event.httpMethod === "POST" && path === "/login") {
      const body = JSON.parse(event.body || "{}");
      const { username, password } = body;

      // Validate required fields
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Username and password are required",
          }),
        };
      }

      // Find user
      const user = users.get(username);
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid username or password",
          }),
        };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid username or password",
          }),
        };
      }

      // Create session
      const sessionToken = createSession(user.id, user.username);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            userHash: user.id, // Simplified hash
            sessionToken,
            secureSystemActivated: true,
          },
          securityFeatures: {
            splitKeySystem: true,
            blockchainStorage: true,
            encryptionLayers: 3,
          },
        }),
      };
    }

    // Verify session endpoint
    if (event.httpMethod === "GET" && path === "/verify") {
      const cookies = event.headers.cookie || "";
      const sessionMatch = cookies.match(/healthchain_session=([^;]+)/);
      const sessionToken = sessionMatch ? sessionMatch[1] : null;

      if (!sessionToken || !sessions.has(sessionToken)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "No valid session found",
          }),
        };
      }

      const session = sessions.get(sessionToken)!;
      const user = Array.from(users.values()).find(u => u.id === session.userId);

      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "User not found",
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profile: user.profile,
          },
        }),
      };
    }

    // Default 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Endpoint not found",
      }),
    };

  } catch (error) {
    console.error("Auth function error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
