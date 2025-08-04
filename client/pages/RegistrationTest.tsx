import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function RegistrationTest() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="btn-smooth">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Registration Test</h1>
              <p className="text-sm text-muted-foreground">
                Test user registration functionality
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6 text-blue-600" />
                <CardTitle>Test User Registration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Username *
                    </label>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Password *
                    </label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Last Name
                    </label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register User
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-800">
                    Registration Successful!
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-green-700">{result.message}</p>
                  {result.user && (
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold mb-2">User Details:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>ID:</strong> {result.user.id}
                        </div>
                        <div>
                          <strong>Username:</strong> {result.user.username}
                        </div>
                        <div>
                          <strong>User Hash:</strong>{" "}
                          {result.user.userHash?.substring(0, 16)}...
                        </div>
                        <div>
                          <strong>Session Token:</strong>{" "}
                          {result.user.sessionToken?.substring(0, 16)}...
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant={
                            result.user.secureSystemActivated
                              ? "default"
                              : "secondary"
                          }
                        >
                          Secure System:{" "}
                          {result.user.secureSystemActivated
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {result.securityFeatures && (
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold mb-2">Security Features:</h4>
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant={
                            result.securityFeatures.splitKeySystem
                              ? "default"
                              : "secondary"
                          }
                        >
                          Split Key System:{" "}
                          {result.securityFeatures.splitKeySystem
                            ? "Yes"
                            : "No"}
                        </Badge>
                        <Badge
                          variant={
                            result.securityFeatures.blockchainStorage
                              ? "default"
                              : "secondary"
                          }
                        >
                          Blockchain Storage:{" "}
                          {result.securityFeatures.blockchainStorage
                            ? "Yes"
                            : "No"}
                        </Badge>
                        <Badge variant="outline">
                          Encryption Layers:{" "}
                          {result.securityFeatures.encryptionLayers}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <CardTitle className="text-red-800">
                    Registration Failed
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Fill in the registration form with test data</li>
                <li>Click "Register User" to test the registration endpoint</li>
                <li>Check the response for success or error messages</li>
                <li>
                  Note that the system will work with in-memory storage if
                  database is unavailable
                </li>
                <li>
                  Security features may be limited if external services are
                  unavailable
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
