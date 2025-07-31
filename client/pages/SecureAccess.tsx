import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Shield,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Activity,
  Database,
  Scan,
} from "lucide-react";

interface SystemStatus {
  keyManagement: {
    status: string;
    activeKeys: number;
    scheduledRotations: number;
    lastRotation: string;
  };
  blockchain: {
    status: string;
    lastBlockTime: string;
    integrityChecks: {
      passed: number;
      failed: number;
      lastCheck: string;
    };
  };
  security: {
    threatLevel: string;
    encryptionStrength: string;
    complianceStatus: string;
  };
  performance: {
    uptime: string;
    dataEncrypted: string;
    successfulAccesses: number;
    deniedAccesses: number;
  };
}

export default function SecureAccess() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [keyGenForm, setKeyGenForm] = useState({
    patientId: '',
    providerId: '',
    patientEmail: '',
    providerEmail: ''
  });
  
  const [dataStoreForm, setDataStoreForm] = useState({
    patientId: '',
    dataType: '',
    data: '',
    keyId: '',
    createdBy: '',
    accessLevel: 'provider'
  });
  
  const [dataRetrieveForm, setDataRetrieveForm] = useState({
    recordId: '',
    requestedRole: '',
    purpose: '',
    patientKey: '',
    providerKey: '',
    keyId: ''
  });

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/secure/system/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const handleGenerateKeys = async () => {
    if (!keyGenForm.patientId || !keyGenForm.providerId) {
      setMessage({ type: 'error', text: 'Patient ID and Provider ID are required' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/secure/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyGenForm)
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Split keys generated successfully! Key ID: ${result.keyId}` 
        });
        // Clear form
        setKeyGenForm({ patientId: '', providerId: '', patientEmail: '', providerEmail: '' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate keys' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreData = async () => {
    if (!dataStoreForm.patientId || !dataStoreForm.dataType || !dataStoreForm.data || !dataStoreForm.keyId) {
      setMessage({ type: 'error', text: 'All fields are required for data storage' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/secure/data/store', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-patient-key': 'dummy-patient-key',
          'x-provider-key': 'dummy-provider-key'
        },
        body: JSON.stringify({
          ...dataStoreForm,
          data: JSON.parse(dataStoreForm.data)
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Data stored securely! Record ID: ${result.record.id}` 
        });
        // Clear form
        setDataStoreForm({
          patientId: '',
          dataType: '',
          data: '',
          keyId: '',
          createdBy: '',
          accessLevel: 'provider'
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to store data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieveData = async () => {
    if (!dataRetrieveForm.recordId || !dataRetrieveForm.requestedRole || !dataRetrieveForm.purpose) {
      setMessage({ type: 'error', text: 'Record ID, role, and purpose are required' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/secure/data/retrieve/${dataRetrieveForm.recordId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'current-user'
        },
        body: JSON.stringify(dataRetrieveForm)
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Data retrieved successfully! Integrity verified: ${result.dataIntegrity}` 
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to retrieve data' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Secure Data Access
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Split-Key Cryptography & Blockchain Security
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              HIPAA Compliant
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Status Messages */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* System Status Dashboard */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Key Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className={`text-sm font-medium ${getStatusColor(systemStatus.keyManagement.status)}`}>
                    {systemStatus.keyManagement.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.keyManagement.activeKeys} active keys
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.keyManagement.scheduledRotations} scheduled rotations
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className={`text-sm font-medium ${getStatusColor(systemStatus.blockchain.status)}`}>
                    {systemStatus.blockchain.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.blockchain.integrityChecks.passed} checks passed
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.blockchain.integrityChecks.failed} failed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Badge variant="outline" className={`text-xs ${getThreatLevelColor(systemStatus.security.threatLevel)}`}>
                    {systemStatus.security.threatLevel.toUpperCase()} THREAT
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.security.encryptionStrength}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.security.complianceStatus}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-green-600">
                    {systemStatus.performance.uptime} UPTIME
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.performance.dataEncrypted} encrypted
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemStatus.performance.successfulAccesses} successful accesses
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Interface */}
        <Tabs defaultValue="generate-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate-keys">Generate Keys</TabsTrigger>
            <TabsTrigger value="store-data">Store Data</TabsTrigger>
            <TabsTrigger value="retrieve-data">Retrieve Data</TabsTrigger>
          </TabsList>

          {/* Generate Split Keys */}
          <TabsContent value="generate-keys">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Generate Split Keys
                </CardTitle>
                <CardDescription>
                  Create a new set of split keys for secure data access control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient ID</Label>
                    <Input
                      id="patientId"
                      value={keyGenForm.patientId}
                      onChange={(e) => setKeyGenForm(prev => ({ ...prev, patientId: e.target.value }))}
                      placeholder="Enter patient identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerId">Provider ID</Label>
                    <Input
                      id="providerId"
                      value={keyGenForm.providerId}
                      onChange={(e) => setKeyGenForm(prev => ({ ...prev, providerId: e.target.value }))}
                      placeholder="Enter provider identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Patient Email (Optional)</Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={keyGenForm.patientEmail}
                      onChange={(e) => setKeyGenForm(prev => ({ ...prev, patientEmail: e.target.value }))}
                      placeholder="patient@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerEmail">Provider Email (Optional)</Label>
                    <Input
                      id="providerEmail"
                      type="email"
                      value={keyGenForm.providerEmail}
                      onChange={(e) => setKeyGenForm(prev => ({ ...prev, providerEmail: e.target.value }))}
                      placeholder="provider@hospital.com"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGenerateKeys} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Generate Split Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Secure Data */}
          <TabsContent value="store-data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Store Secure Data
                </CardTitle>
                <CardDescription>
                  Encrypt and store healthcare data with blockchain immutability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePatientId">Patient ID</Label>
                    <Input
                      id="storePatientId"
                      value={dataStoreForm.patientId}
                      onChange={(e) => setDataStoreForm(prev => ({ ...prev, patientId: e.target.value }))}
                      placeholder="Enter patient identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select
                      value={dataStoreForm.dataType}
                      onValueChange={(value) => setDataStoreForm(prev => ({ ...prev, dataType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical_history">Medical History</SelectItem>
                        <SelectItem value="ai_report">AI Report</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="lab_result">Lab Result</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keyId">Key ID</Label>
                    <Input
                      id="keyId"
                      value={dataStoreForm.keyId}
                      onChange={(e) => setDataStoreForm(prev => ({ ...prev, keyId: e.target.value }))}
                      placeholder="Enter key identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="createdBy">Created By</Label>
                    <Input
                      id="createdBy"
                      value={dataStoreForm.createdBy}
                      onChange={(e) => setDataStoreForm(prev => ({ ...prev, createdBy: e.target.value }))}
                      placeholder="Provider/doctor identifier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data (JSON format)</Label>
                  <Textarea
                    id="data"
                    value={dataStoreForm.data}
                    onChange={(e) => setDataStoreForm(prev => ({ ...prev, data: e.target.value }))}
                    placeholder='{"diagnosis": "example", "treatment": "example"}'
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleStoreData} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Store Secure Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retrieve Secure Data */}
          <TabsContent value="retrieve-data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Unlock className="h-5 w-5 mr-2" />
                  Retrieve Secure Data
                </CardTitle>
                <CardDescription>
                  Access encrypted healthcare data with proper authorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recordId">Record ID</Label>
                    <Input
                      id="recordId"
                      value={dataRetrieveForm.recordId}
                      onChange={(e) => setDataRetrieveForm(prev => ({ ...prev, recordId: e.target.value }))}
                      placeholder="Enter record identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestedRole">Requested Role</Label>
                    <Select
                      value={dataRetrieveForm.requestedRole}
                      onValueChange={(value) => setDataRetrieveForm(prev => ({ ...prev, requestedRole: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retrieveKeyId">Key ID</Label>
                    <Input
                      id="retrieveKeyId"
                      value={dataRetrieveForm.keyId}
                      onChange={(e) => setDataRetrieveForm(prev => ({ ...prev, keyId: e.target.value }))}
                      placeholder="Enter key identifier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    value={dataRetrieveForm.purpose}
                    onChange={(e) => setDataRetrieveForm(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="Describe the purpose for accessing this data"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientKey">Patient Key Fragment</Label>
                    <Input
                      id="patientKey"
                      value={dataRetrieveForm.patientKey}
                      onChange={(e) => setDataRetrieveForm(prev => ({ ...prev, patientKey: e.target.value }))}
                      placeholder="Enter patient key fragment"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerKey">Provider Key Fragment</Label>
                    <Input
                      id="providerKey"
                      value={dataRetrieveForm.providerKey}
                      onChange={(e) => setDataRetrieveForm(prev => ({ ...prev, providerKey: e.target.value }))}
                      placeholder="Enter provider key fragment"
                      type="password"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleRetrieveData} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Retrieve Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
