import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Key,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate login for demo
      if (loginForm.email && loginForm.password) {
        // Store user session
        localStorage.setItem('healthchain_user', JSON.stringify({
          id: 'user-123',
          email: loginForm.email,
          name: loginForm.email.split('@')[0],
          loginTime: new Date().toISOString()
        }));

        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Please fill in all fields' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate form
      if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
        setMessage({ type: 'error', text: 'Please fill in all required fields' });
        setIsLoading(false);
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        setIsLoading(false);
        return;
      }

      if (registerForm.password.length < 8) {
        setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
        setIsLoading(false);
        return;
      }

      // Simulate registration
      const userData = {
        id: 'user-' + Date.now(),
        email: registerForm.email,
        name: `${registerForm.firstName} ${registerForm.lastName}`,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        dateOfBirth: registerForm.dateOfBirth,
        phone: registerForm.phone,
        registrationTime: new Date().toISOString()
      };

      // Store user session
      localStorage.setItem('healthchain_user', JSON.stringify(userData));

      setMessage({ type: 'success', text: 'Registration successful! Setting up your secure keys...' });

      // Simulate key generation
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Secure keys generated! Redirecting to dashboard...' });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }, 2000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Registration failed. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            HealthChain Security
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure access to your blockchain-protected health data
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Login/Register Tabs */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="space-y-1 pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-9"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-9 pr-9"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => alert("Demo: Use any email/password to login")}
                    >
                      Forgot password?
                    </button>
                  </div>
                </CardContent>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-9"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={registerForm.dateOfBirth}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Security Benefits */}
        <Card className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold flex items-center justify-center">
                <Key className="h-4 w-4 mr-2" />
                Why Login Matters
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center justify-center">
                  <Shield className="h-3 w-3 mr-2 text-primary" />
                  Personal split-key generation for your data
                </div>
                <div className="flex items-center justify-center">
                  <Lock className="h-3 w-3 mr-2 text-primary" />
                  Secure access to your encrypted health records
                </div>
                <div className="flex items-center justify-center">
                  <User className="h-3 w-3 mr-2 text-primary" />
                  Personalized AI recommendations based on your history
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode */}
        <div className="text-center mt-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              Continue as Guest (Demo Mode)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
