import { cn } from "@/lib/utils";
import { Loader2, Heart, Brain, Shield, Activity } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "pulse" | "dots" | "medical" | "skeleton";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = "md",
  variant = "spinner",
  text,
  className,
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const containerClass = cn(
    "flex items-center justify-center",
    fullScreen &&
      "min-h-screen bg-gradient-to-br from-background via-background to-primary/5",
    className,
  );

  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return (
          <Loader2
            className={cn("animate-spin text-primary", sizeClasses[size])}
          />
        );

      case "pulse":
        return (
          <div
            className={cn(
              "bg-primary rounded-full animate-pulse",
              sizeClasses[size],
            )}
          />
        );

      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-primary rounded-full animate-bounce",
                  size === "sm" && "w-1.5 h-1.5",
                  size === "md" && "w-2 h-2",
                  size === "lg" && "w-3 h-3",
                  size === "xl" && "w-4 h-4",
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case "medical":
        return (
          <div className="relative">
            <div
              className={cn(
                "absolute inset-0 animate-ping bg-primary/20 rounded-full",
                sizeClasses[size],
              )}
            />
            <Heart
              className={cn("text-primary animate-pulse", sizeClasses[size])}
            />
          </div>
        );

      case "skeleton":
        return (
          <div className="space-y-3 w-full max-w-sm">
            <div className="h-4 bg-muted rounded skeleton"></div>
            <div className="h-4 bg-muted rounded skeleton w-4/5"></div>
            <div className="h-4 bg-muted rounded skeleton w-3/5"></div>
          </div>
        );

      default:
        return (
          <Loader2
            className={cn("animate-spin text-primary", sizeClasses[size])}
          />
        );
    }
  };

  if (fullScreen) {
    return (
      <div className={containerClass}>
        <div className="text-center space-y-4 fade-in">
          <div className="flex justify-center">{renderLoader()}</div>
          {text && (
            <div className="space-y-2">
              <p
                className={cn(
                  "font-medium text-foreground",
                  textSizeClasses[size],
                )}
              >
                {text}
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we load your data...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center space-x-3">
        {renderLoader()}
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

// Specialized loading components for different contexts
export function MedicalLoading({
  text = "Loading health data...",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4 fade-in">
        <div className="relative">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <Brain className="w-8 h-8 text-primary animate-pulse relative z-10" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">{text}</p>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecurityLoading({
  text = "Securing your data...",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4 fade-in">
        <div className="relative">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 bg-green-200 rounded-full animate-ping" />
            <Shield className="w-8 h-8 text-green-600 animate-pulse relative z-10" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">{text}</p>
          <p className="text-sm text-muted-foreground">
            Blockchain encryption in progress
          </p>
          <div className="w-48 h-2 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AILoading({ text = "AI is thinking..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center space-y-4 fade-in">
        <div className="relative">
          <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{text}</p>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-muted rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded skeleton w-1/3" />
          <div className="h-3 bg-muted rounded skeleton w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded skeleton" />
        <div className="h-3 bg-muted rounded skeleton w-4/5" />
        <div className="h-3 bg-muted rounded skeleton w-3/5" />
      </div>
    </div>
  );
}

// Loading state for lists
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}
