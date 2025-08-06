import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Lock,
  LogIn,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallbackMessage?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = "/login",
  fallbackMessage,
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Check for session token
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        console.log("❌ No session token found");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      console.log("🔍 Found session token, verifying with server...");

      // Verify session with server
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setAuthError("Session expired");
          // Clear invalid session
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("healthchain_user");
          document.cookie =
            "healthchain_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      } else {
        console.error("❌ Session verification failed:", {
          status: response.status,
          statusText: response.statusText,
        });
        setIsAuthenticated(false);
        setAuthError("Authentication failed");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setAuthError("Network error during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4 fade-in">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Authenticating...
            </h3>
            <p className="text-sm text-muted-foreground">
              Verifying your secure session
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Store the attempted location for post-login redirect
  localStorage.setItem(
    "redirectAfterLogin",
    location.pathname + location.search,
  );

  // Authentication required but user is not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-colored-lg card-hover fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Authentication Required</CardTitle>
          <CardDescription className="text-muted-foreground">
            {fallbackMessage || "You need to be logged in to access this page."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {authError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">
                {authError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full btn-smooth shadow-colored">
              <a
                href={`${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>

            <Button variant="outline" asChild className="w-full btn-smooth">
              <a href="/">Return to Home</a>
            </Button>
          </div>

          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Private</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Encrypted</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your health data is protected with blockchain security and
              end-to-end encryption.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Redirect component for authenticated users
export function AuthenticatedRedirect({
  to = "/",
  children,
}: {
  to?: string;
  children?: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (sessionToken) {
        const response = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "x-session-token": sessionToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.success);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
