import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Moon,
  Monitor,
  ArrowLeft,
  Palette,
  CheckCircle,
  Star,
  Heart,
  Brain,
  Shield,
  Stethoscope,
  Activity,
  Zap,
} from "lucide-react";
import { ThemeToggle, SimpleThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeDemo() {
  const { theme, actualTheme } = useTheme();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = [
    {
      name: "Cards",
      description: "Showcase card components in different themes",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Monitoring
              </CardTitle>
              <CardDescription>Real-time health tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor your vital signs and health metrics continuously.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <CardDescription>Intelligent health insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get personalized health recommendations powered by AI.
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      name: "Buttons",
      description: "Various button styles and states",
      component: (
        <div className="flex flex-wrap gap-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      ),
    },
    {
      name: "Badges",
      description: "Status indicators and labels",
      component: (
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        </div>
      ),
    },
    {
      name: "Alerts",
      description: "Information and status messages",
      component: (
        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your data is protected with end-to-end encryption.
            </AlertDescription>
          </Alert>
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
            <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Health monitoring is currently active.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
      {/* Header */}
      <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Theme Showcase
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Dark & Light Mode Demo
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Badge variant="outline" className="text-xs">
                Current: {theme === "system" ? `System (${actualTheme})` : theme}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Theme Status */}
        <Alert className="mb-8">
          <Palette className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Theme:</strong> {theme} 
            {theme === "system" && ` (resolved to ${actualTheme})`}
            <br />
            <strong>Theme Toggle:</strong> Use the theme selector in the header to switch between light, dark, and system preference.
          </AlertDescription>
        </Alert>

        {/* Theme Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Theme Controls
            </CardTitle>
            <CardDescription>
              Different theme toggle variations available in the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Full Theme Toggle (with System option)</h4>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">
                  Dropdown with Light, Dark, and System options
                </span>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Simple Theme Toggle</h4>
              <div className="flex items-center gap-4">
                <SimpleThemeToggle />
                <span className="text-sm text-muted-foreground">
                  Simple toggle between Light and Dark modes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Component List */}
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
              <CardDescription>
                Click to see how each component looks in the current theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {components.map((comp) => (
                <Button
                  key={comp.name}
                  variant={selectedComponent === comp.name ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedComponent(comp.name)}
                >
                  {comp.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Component Display */}
          <div className="lg:col-span-2">
            {selectedComponent ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedComponent}</CardTitle>
                  <CardDescription>
                    {components.find((c) => c.name === selectedComponent)?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {components.find((c) => c.name === selectedComponent)?.component}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a component to preview it</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Theme Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dark Mode Features</CardTitle>
            <CardDescription>
              Enhanced features included in the theme system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Automatic Features
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• System preference detection</li>
                  <li>• Smooth theme transitions</li>
                  <li>• Persistent theme selection</li>
                  <li>• Meta theme-color updates</li>
                  <li>• Accessibility announcements</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Enhanced Styling
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• CSS variable-based colors</li>
                  <li>• Optimized gradients</li>
                  <li>• Enhanced glass effects</li>
                  <li>• Improved contrast ratios</li>
                  <li>• Mobile-friendly PWA themes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Info */}
        <Alert className="mt-8">
          <Stethoscope className="h-4 w-4" />
          <AlertDescription>
            <strong>Healthcare Focus:</strong> The theme system is optimized for healthcare applications with careful attention to accessibility, readability, and professional appearance in both light and dark modes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
