import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, User, Key } from "lucide-react";

export default function TestAuth() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createTestUser = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          password: "password123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the session
        localStorage.setItem("sessionToken", result.user.sessionToken);
        localStorage.setItem("healthchain_user", JSON.stringify(result.user));
        document.cookie = `healthchain_session=${result.user.sessionToken}; path=/; max-age=86400; samesite=strict`;
        
        setMessage({
          type: "success",
          text: "Test user created and logged in successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to create test user",
        });
      }
    } catch (error) {
      console.error("Error creating test user:", error);
      setMessage({
        type: "error",
        text: "Network error creating test user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginTestUser = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          password: "password123",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the session
        localStorage.setItem("sessionToken", result.user.sessionToken);
        localStorage.setItem("healthchain_user", JSON.stringify(result.user));
        document.cookie = `healthchain_session=${result.user.sessionToken}; path=/; max-age=86400; samesite=strict`;
        
        setMessage({
          type: "success",
          text: "Test user logged in successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to login test user",
        });
      }
    } catch (error) {
      console.error("Error logging in test user:", error);
      setMessage({
        type: "error",
        text: "Network error logging in test user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const sessionToken = localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        setMessage({
          type: "error",
          text: "No session token found in localStorage",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Session is valid! User: ${result.user?.username}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Session verification failed",
        });
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      setMessage({
        type: "error",
        text: "Network error verifying session",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("healthchain_user");
    document.cookie = "healthchain_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    setMessage({
      type: "success",
      text: "Session cleared successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-colored-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-6 h-6 text-primary" />
              <span>Authentication Test</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {message && (
              <Alert
                className={`${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={createTestUser}
                disabled={isLoading}
                className="btn-smooth"
              >
                <User className="w-4 h-4 mr-2" />
                Create Test User
              </Button>

              <Button
                onClick={loginTestUser}
                disabled={isLoading}
                variant="outline"
                className="btn-smooth"
              >
                <Key className="w-4 h-4 mr-2" />
                Login Test User
              </Button>

              <Button
                onClick={checkSession}
                disabled={isLoading}
                variant="outline"
                className="btn-smooth"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Check Session
              </Button>

              <Button
                onClick={clearSession}
                disabled={isLoading}
                variant="destructive"
                className="btn-smooth"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Clear Session
              </Button>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium mb-2">Test Credentials:</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Username:</strong> testuser<br />
                <strong>Password:</strong> password123<br />
                <strong>Email:</strong> test@example.com
              </p>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-800">Steps to fix authentication:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click "Create Test User" to register a test account</li>
                <li>2. Click "Check Session" to verify authentication is working</li>
                <li>3. Navigate to /history to test protected routes</li>
                <li>4. If issues persist, click "Clear Session" and try again</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
