import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthTest() {
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const testRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser" + Date.now(),
          password: "testpass123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        register: `${response.status}: ${JSON.stringify(result, null, 2)}`
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        register: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    setIsLoading(false);
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "testpass123",
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        login: `${response.status}: ${JSON.stringify(result, null, 2)}`
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        login: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    setIsLoading(false);
  };

  const testPing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ping");
      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        ping: `${response.status}: ${JSON.stringify(result, null, 2)}`
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        ping: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testPing} disabled={isLoading}>
              Test Ping API
            </Button>
            <Button onClick={testRegister} disabled={isLoading}>
              Test Registration
            </Button>
            <Button onClick={testLogin} disabled={isLoading}>
              Test Login
            </Button>
          </div>

          {Object.entries(testResults).map(([test, result]) => (
            <Alert key={test}>
              <AlertDescription>
                <strong>{test.toUpperCase()} Result:</strong>
                <pre className="mt-2 text-sm bg-muted p-2 rounded overflow-auto">
                  {result}
                </pre>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
