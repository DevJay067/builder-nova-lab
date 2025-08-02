import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, TestTube, CheckCircle, AlertTriangle } from "lucide-react";

export default function LoginTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [credentials, setCredentials] = useState({
    username: "testuser" + Date.now(),
    password: "testpass123"
  });

  const runAuthTest = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      console.log("🧪 Starting authentication test...");
      
      // Test database health first
      const healthResponse = await fetch("/api/health/database");
      const healthData = await healthResponse.json();
      
      console.log("🧪 Database health:", healthData);

      // Test authentication
      const authResponse = await fetch("/api/test/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const authData = await authResponse.json();
      console.log("🧪 Auth test result:", authData);

      setResults({
        success: true,
        database: healthData,
        authentication: authData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("🧪 Test failed:", error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testActualLogin = async () => {
    setIsLoading(true);
    
    try {
      console.log("🧪 Testing actual login flow...");
      
      // First register
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          email: `${credentials.username}@test.com`,
          firstName: "Test",
          lastName: "User"
        }),
      });

      const registerData = await registerResponse.json();
      console.log("🧪 Registration result:", registerData);

      // Then login
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const loginData = await loginResponse.json();
      console.log("🧪 Login result:", loginData);

      setResults({
        success: true,
        registration: registerData,
        login: loginData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("🧪 Login test failed:", error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 text-white">
                  <TestTube className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Authentication Test
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Debug Login Issues
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
            <CardDescription>
              These credentials will be used for testing authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Authentication System</CardTitle>
            <CardDescription>
              Run tests to diagnose authentication and database issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runAuthTest} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Running..." : "Test Auth System"}
              </Button>
              <Button 
                onClick={testActualLogin} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? "Testing..." : "Test Login Flow"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!results.success && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {results.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="mt-6">
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            This page helps diagnose authentication issues. Check the browser console and server logs for detailed information.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
