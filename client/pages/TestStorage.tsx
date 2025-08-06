import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function TestStorage() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [storageData, setStorageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testCreateRecord = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        setMessage({ type: "error", text: "No session token found" });
        setIsLoading(false);
        return;
      }

      const testRecord = {
        type: "test-diagnosis",
        title: "Test Health Record",
        description: "Testing storage system",
        data: {
          diagnosis: "Test diagnosis for storage verification",
          doctor: "Dr. Test",
          symptoms: ["storage-test", "debugging"],
          timestamp: new Date().toISOString(),
        },
        metadata: {
          testRecord: true,
          created: new Date().toISOString(),
        },
        sessionToken: sessionToken,
      };

      console.log("🧪 Creating test health record...");

      const response = await fetch("/api/supabase/health-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
        body: JSON.stringify(testRecord),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Test record created: ${result.recordId}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to create test record",
        });
      }
    } catch (error) {
      console.error("Test create error:", error);
      setMessage({
        type: "error",
        text: "Error creating test record",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRetrieveRecords = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        setMessage({ type: "error", text: "No session token found" });
        setIsLoading(false);
        return;
      }

      console.log("🔍 Retrieving health records...");

      const response = await fetch("/api/supabase/health-records", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Retrieved ${result.records?.length || 0} records`,
        });
        setStorageData(result);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to retrieve records",
        });
      }
    } catch (error) {
      console.error("Test retrieve error:", error);
      setMessage({
        type: "error",
        text: "Error retrieving records",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkMockStorage = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      console.log("🔍 Checking mock storage...");

      const response = await fetch("/api/debug/mock-storage");
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Mock storage has ${result.totalHealthRecords} health records`,
        });
        setStorageData(result);
      } else {
        setMessage({
          type: "error",
          text: "Failed to check mock storage",
        });
      }
    } catch (error) {
      console.error("Mock storage check error:", error);
      setMessage({
        type: "error",
        text: "Error checking mock storage",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-colored-lg">
          <CardHeader>
            <CardTitle>Storage Debug Test</CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={testCreateRecord}
                disabled={isLoading}
                className="btn-smooth"
              >
                Create Test Record
              </Button>

              <Button
                onClick={testRetrieveRecords}
                disabled={isLoading}
                variant="outline"
                className="btn-smooth"
              >
                Retrieve Records
              </Button>

              <Button
                onClick={checkMockStorage}
                disabled={isLoading}
                variant="outline"
                className="btn-smooth"
              >
                Check Mock Storage
              </Button>
            </div>

            {storageData && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Storage Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-slate-100 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(storageData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
