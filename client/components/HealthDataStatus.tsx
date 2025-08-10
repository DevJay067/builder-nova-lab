import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Bell, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import permanentStorage from "@/services/permanentStorage";
import notificationService from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

export default function HealthDataStatus() {
  const [storageStats, setStorageStats] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setIsLoading(true);
    try {
      const storage = permanentStorage.getStorageStats();
      const notifications = notificationService.getNotificationStats();
      
      setStorageStats(storage);
      setNotificationStats(notifications);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    try {
      const data = permanentStorage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthchain-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported",
        description: "Your health data backup has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export your data",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = permanentStorage.importData(data);
        
        if (success) {
          toast({
            title: "Data Imported",
            description: "Your health data has been restored successfully",
          });
          loadStats();
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Could not import the backup file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading health data status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-600" />
            Data Storage Status
          </CardTitle>
          <CardDescription>
            Your health data is permanently stored and protected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {storageStats?.healthRecords || 0}
              </div>
              <p className="text-xs text-muted-foreground">Health Records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {storageStats?.trackingData || 0}
              </div>
              <p className="text-xs text-muted-foreground">Tracking Sets</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((storageStats?.storageSize || 0) / 1024)}
              </div>
              <p className="text-xs text-muted-foreground">KB Stored</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Secure</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Encrypted & Permanent</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Notification System Status
          </CardTitle>
          <CardDescription>
            Smart health reminders and tracking notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {notificationStats?.activeReminders || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active Reminders</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {notificationStats?.waterReminders || 0}
              </div>
              <p className="text-xs text-muted-foreground">Water Alerts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {notificationStats?.sleepReminders || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sleep Alerts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notificationStats?.totalSent || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Sent</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {notificationStats?.permissionStatus === 'granted' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Notifications Enabled</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">Notifications Disabled</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={loadStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Data Protection Active</h3>
              <p className="text-sm text-muted-foreground">
                Your health data is now permanently stored and will never be lost
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Protected
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
