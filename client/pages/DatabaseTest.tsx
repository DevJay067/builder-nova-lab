import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Settings,
  User,
  Key,
} from "lucide-react";

export default function DatabaseTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [configResults, setConfigResults] = useState<any>(null);
  const [registrationTest, setRegistrationTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/neon/test");
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        message: "Failed to connect to test endpoint",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/neon/config");
      const result = await response.json();
      setConfigResults(result);
    } catch (error) {
      setConfigResults({
        success: false,
        message: "Failed to get database config",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRegistration = async () => {
    setIsLoading(true);
    try {
      const testUser = {
        username: `testuser_${Date.now()}`,
        password: "securepassword123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUser),
      });

      const result = await response.json();
      setRegistrationTest({
        ...result,
        testUser: testUser.username,
        httpStatus: response.status,
      });
    } catch (error) {
      setRegistrationTest({
        success: false,
        message: "Failed to test registration",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (
    result: any,
    title: string,
    icon: React.ReactNode,
  ) => {
    if (!result) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
            {result.success ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Success
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert
            className={
              result.success
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            <AlertDescription>
              <strong>Message:</strong> {result.message}
            </AlertDescription>
          </Alert>

          {result.error && (
            <Alert className="mt-2 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {result.error}
              </AlertDescription>
            </Alert>
          )}

          {result.connectionInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-semibold mb-2">Connection Info:</h4>
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result.connectionInfo, null, 2)}
              </pre>
            </div>
          )}

          {result.config && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-semibold mb-2">Database Config:</h4>
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result.config, null, 2)}
              </pre>
            </div>
          )}

          {result.troubleshooting && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
              <h4 className="font-semibold mb-2">Troubleshooting:</h4>
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result.troubleshooting, null, 2)}
              </pre>
            </div>
          )}

          {result.setupInstructions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-semibold mb-2">Setup Instructions:</h4>
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result.setupInstructions, null, 2)}
              </pre>
            </div>
          )}

          {result.nextSteps && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <h4 className="font-semibold mb-2">Next Steps:</h4>
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result.nextSteps, null, 2)}
              </pre>
            </div>
          )}

          {result.testUser && (
            <div className="mt-4 p-3 bg-purple-50 rounded-md">
              <h4 className="font-semibold mb-2">Test Details:</h4>
              <p>
                <strong>Test Username:</strong> {result.testUser}
              </p>
              <p>
                <strong>HTTP Status:</strong> {result.httpStatus}
              </p>
              {result.user && (
                <div className="mt-2">
                  <strong>Created User:</strong>
                  <pre className="text-sm text-gray-700 mt-1">
                    {JSON.stringify(result.user, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-6 h-6" />
            <span>Database & Authentication Testing</span>
          </CardTitle>
          <CardDescription>
            Test your Neon database connection and authentication system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={checkDatabaseConfig}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Check DB Config
            </Button>

            <Button
              onClick={testDatabaseConnection}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Test DB Connection
            </Button>

            <Button
              onClick={testRegistration}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <User className="w-4 h-4 mr-2" />
              )}
              Test Registration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Configuration Results */}
      {renderTestResult(
        configResults,
        "Database Configuration",
        <Settings className="w-5 h-5" />,
      )}

      {/* Connection Test Results */}
      {renderTestResult(
        testResults,
        "Connection Test",
        <Database className="w-5 h-5" />,
      )}

      {/* Registration Test Results */}
      {renderTestResult(
        registrationTest,
        "Registration Test",
        <User className="w-5 h-5" />,
      )}

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Setup Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">To Set Up Neon Database:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 mt-2">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.neon.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://console.neon.tech
                  </a>
                </li>
                <li>Create a new project or select existing one</li>
                <li>Go to "Connection string" section</li>
                <li>Copy the connection string with password</li>
                <li>
                  Use DevServerControl tool to set DATABASE_URL environment
                  variable
                </li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Current Status:</h4>
              <p className="text-sm text-gray-600 mt-1">
                The system is currently running in fallback mode with in-memory
                storage. This means registration and login work, but data is not
                persisted between server restarts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
