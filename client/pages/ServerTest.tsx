import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Activity, Clock } from "lucide-react";

export default function ServerTest() {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<{ timestamp: string; status: string; uptime: number }[]>([]);

  const testServerHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/health");
      const data = await response.json();
      setHealthData(data);
      
      setTestHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        status: data.status,
        uptime: data.uptime
      }, ...prev.slice(0, 9)]); // Keep last 10 tests
      
    } catch (error) {
      setHealthData({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    setIsLoading(false);
  };

  const testStressLoad = async () => {
    setIsLoading(true);
    console.log("🧪 Starting stress test...");
    
    // Test multiple concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) => 
      fetch("/api/ping").then(r => r.json())
    );
    
    try {
      const results = await Promise.all(promises);
      console.log("✅ Stress test completed", results);
      await testServerHealth();
    } catch (error) {
      console.error("❌ Stress test failed", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Server Stability Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testServerHealth} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check Health
            </Button>
            <Button onClick={testStressLoad} disabled={isLoading} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Stress Test
            </Button>
          </div>

          {healthData && (
            <Alert className={healthData.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {healthData.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <strong>Status:</strong> 
                    <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'} className="ml-2">
                      {healthData.status}
                    </Badge>
                  </div>
                  {healthData.uptime && (
                    <div><strong>Uptime:</strong> {Math.floor(healthData.uptime)} seconds</div>
                  )}
                  {healthData.memory && (
                    <div><strong>Memory:</strong> {Math.round(healthData.memory.used / 1024 / 1024)}MB used</div>
                  )}
                  {healthData.version && (
                    <div><strong>Node Version:</strong> {healthData.version}</div>
                  )}
                </div>
                {healthData.error && (
                  <div className="mt-2 text-red-600">
                    <strong>Error:</strong> {healthData.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {testHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testHistory.map((test, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{test.timestamp}</span>
                      <Badge variant={test.status === 'healthy' ? 'default' : 'destructive'}>
                        {test.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {Math.floor(test.uptime)}s uptime
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Server Stability Improvements Applied:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Global error handlers prevent crashes</li>
                <li>• Request timeouts (30s) prevent hanging</li>
                <li>• Memory monitoring and limits</li>
                <li>• Single initialization to prevent duplicates</li>
                <li>• Enhanced Vite configuration for stability</li>
                <li>• Graceful shutdown handling</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
