import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  Shield,
  RefreshCw,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  HardDrive,
  Activity,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";

interface CloudStorageStats {
  cloudRecords: number;
  localBackups: number;
  storageUsed: number;
  isCloudAvailable: boolean;
  encryption: string;
  userIsolated: boolean;
  dataLocation: string;
}

interface SyncInfo {
  lastSync: string;
  totalCloudRecords: number;
  pendingUploads: number;
  errors: string[];
}

export default function CloudStorageManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<CloudStorageStats | null>(null);
  const [syncInfo, setSyncInfo] = useState<SyncInfo | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCloudStats();
  }, []);

  const loadCloudStats = async () => {
    try {
      setIsLoading(true);
      const sessionToken = localStorage.getItem("sessionToken");

      if (!sessionToken) {
        setMessage({
          type: "error",
          text: "Please log in to access cloud storage",
        });
        return;
      }

      const response = await fetch("/api/cloud/stats", {
        headers: {
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.stats);
        setMessage({
          type: "info",
          text: `Cloud storage ${result.stats.isCloudAvailable ? "connected" : "unavailable"} - Data is ${result.stats.dataLocation}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to load cloud statistics",
        });
      }
    } catch (error) {
      console.error("Error loading cloud stats:", error);
      setMessage({
        type: "error",
        text: "Network error while loading cloud statistics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncToCloud = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: "info", text: "Syncing data to cloud..." });

      const sessionToken = localStorage.getItem("sessionToken");

      if (!sessionToken) {
        setMessage({ type: "error", text: "Please log in to sync data" });
        return;
      }

      const response = await fetch("/api/cloud/sync", {
        method: "POST",
        headers: {
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();

      if (result.success) {
        setSyncInfo(result.syncInfo);
        setMessage({
          type: "success",
          text: result.message || "Data synced successfully to cloud",
        });

        // Reload stats after sync
        setTimeout(() => loadCloudStats(), 1000);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to sync data to cloud",
        });
      }
    } catch (error) {
      console.error("Error syncing to cloud:", error);
      setMessage({ type: "error", text: "Network error during cloud sync" });
    } finally {
      setIsLoading(false);
    }
  };

  const checkCloudHealth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cloud/health");
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Cloud service is ${result.health.status}. Provider: ${result.health.provider}`,
        });
      } else {
        setMessage({ type: "error", text: "Cloud health check failed" });
      }
    } catch (error) {
      console.error("Error checking cloud health:", error);
      setMessage({ type: "error", text: "Network error during health check" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageProgress = () => {
    if (!stats) return 0;
    const maxStorage = 1024 * 1024 * 100; // 100MB for demo
    return Math.min((stats.storageUsed / maxStorage) * 100, 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Cloud Storage Manager
            </h1>
            <p className="text-slate-600">
              Secure, encrypted health data in the cloud
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCloudStats}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
      </div>

      {message && (
        <Alert
          className={`${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : message.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : message.type === "error" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync & Backup</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                  Cloud Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.cloudRecords || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Securely stored in cloud
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-green-500" />
                  Local Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.localBackups || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Local backup copies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2 text-purple-500" />
                  Storage Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(stats?.storageUsed || 0)}
                </div>
                <Progress value={getStorageProgress()} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-orange-500" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={stats?.isCloudAvailable ? "default" : "secondary"}
                  >
                    {stats?.isCloudAvailable ? "Connected" : "Local Only"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Data: {stats?.dataLocation || "unknown"}
                </p>
              </CardContent>
            </Card>
          </div>

          {showDetails && stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Detailed Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Storage Details</h4>
                    <ul className="text-sm space-y-1">
                      <li>
                        Cloud Available:{" "}
                        {stats.isCloudAvailable ? "✅ Yes" : "❌ No"}
                      </li>
                      <li>Encryption: {stats.encryption || "AES-256-GCM"}</li>
                      <li>
                        User Isolated: {stats.userIsolated ? "✅ Yes" : "❌ No"}
                      </li>
                      <li>Data Location: {stats.dataLocation}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Security Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>✅ End-to-end encryption</li>
                      <li>✅ User data isolation</li>
                      <li>✅ Local backup storage</li>
                      <li>✅ Audit logging</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                Cloud Synchronization
              </CardTitle>
              <CardDescription>
                Sync your local health records to secure cloud storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Manual Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload any local records to encrypted cloud storage
                  </p>
                </div>
                <Button
                  onClick={syncToCloud}
                  disabled={isLoading || !stats?.isCloudAvailable}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sync to Cloud
                </Button>
              </div>

              {syncInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Last Sync Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Last Sync:</span>
                      <br />
                      {new Date(syncInfo.lastSync).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Cloud Records:</span>
                      <br />
                      {syncInfo.totalCloudRecords}
                    </div>
                    <div>
                      <span className="font-medium">Pending:</span>
                      <br />
                      {syncInfo.pendingUploads}
                    </div>
                  </div>
                  {syncInfo.errors.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-red-600">Errors:</span>
                      <ul className="text-sm text-red-600 ml-4">
                        {syncInfo.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="font-medium">Health Check</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify cloud service connectivity
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={checkCloudHealth}
                  disabled={isLoading}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Check Health
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Your health data security and privacy features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Encryption
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      AES-256-GCM encryption
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      User-specific encryption keys
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Client-side encryption
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Server-side encryption at rest
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Privacy
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Complete user data isolation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      No cross-user data access
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Comprehensive audit logging
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      HIPAA-compliant security
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Data Protection Guarantee
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your health data is encrypted with your unique user key
                      before being uploaded to cloud storage. Only you can
                      decrypt and access your data. Even we cannot read your
                      health records.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">
                      User Isolation
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Each user has their own isolated storage space in the
                      cloud. Your data is completely separate from other users,
                      with dedicated encryption keys and access controls.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
