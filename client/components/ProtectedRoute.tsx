import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  userHash: string;
  sessionToken: string;
  dataAccessHash: string;
  loginTime: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = async () => {
    try {
      setIsValidating(true);
      setError(null);

      // Check if user data exists in localStorage
      const storedUser = localStorage.getItem("healthchain_user");
      if (!storedUser) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      const user = JSON.parse(storedUser);

      // If no session token, user is not properly authenticated
      if (!user.sessionToken) {
        console.log("No session token found, user needs to login");
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Validate session with backend
      const response = await fetch("/api/auth/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserData(user);
          setIsAuthenticated(true);
          console.log(
            "✅ User authenticated successfully:",
            result.user.username,
          );
        } else {
          console.log("❌ Session validation failed:", result.error);
          localStorage.removeItem("healthchain_user");
          setIsAuthenticated(false);
        }
      } else {
        console.log("❌ Session validation request failed");
        localStorage.removeItem("healthchain_user");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error validating authentication:", error);
      setError("Authentication check failed");
      setIsAuthenticated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogin = () => {
    // Store current location to redirect back after login
    localStorage.setItem("healthchain_redirect", location.pathname);
    window.location.href = "/login";
  };

  const handleContinueAsGuest = () => {
    // Set demo mode
    localStorage.setItem("healthchain_demo_mode", "true");
    setIsAuthenticated(false);
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Verifying Authentication
                </h2>
                <p className="text-sm text-muted-foreground">
                  Checking your secure session...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authentication is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is authenticated, show protected content
  if (isAuthenticated && userData) {
    return <>{children}</>;
  }

  // If user is not authenticated, show login prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mx-auto">
              <Lock className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Authentication Required
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You need to login to access your secure health records and use
                personalized features.
              </p>

              {error && (
                <div className="flex items-center justify-center text-destructive text-sm mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-sm mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Why Login?
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                    Your personal health data with secure hash linking
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                    Split-key encryption for maximum security
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                    Personalized AI recommendations
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                    Blockchain-verified medical history
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleLogin} className="w-full" size="lg">
                  <Lock className="h-4 w-4 mr-2" />
                  Login to Access Your Data
                </Button>

                <Button
                  onClick={handleContinueAsGuest}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Continue as Guest (Limited Features)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
