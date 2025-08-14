import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BmaxAI from "./pages/BmaxAI";
import BmaxDemo from "./pages/BmaxDemo";

import HealthHistory from "./pages/HealthHistory";
import FirstAid from "./pages/FirstAid";
import HealthAnalytics from "./pages/HealthAnalytics";
import Legal from "./pages/Legal";
import SecureAccess from "./pages/SecureAccess";
import Login from "./pages/Login";
import WhyLogin from "./pages/WhyLogin";
import RealTimeMonitoring from "./pages/RealTimeMonitoring";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

// PWA Service Worker Registration
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("🚀 Service Worker registered successfully");
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }
};

const App = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/bmax" element={<BmaxAI />} />
              <Route path="/bmax-demo" element={<BmaxDemo />} />
              <Route
                path="/history"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <HealthHistory />
                  </ProtectedRoute>
                }
              />
              <Route path="/first-aid" element={<FirstAid />} />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <HealthAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-analytics"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <HealthAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route path="/legal" element={<Legal />} />
              <Route
                path="/secure"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <SecureAccess />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/why-login" element={<WhyLogin />} />
              <Route
                path="/monitoring"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <RealTimeMonitoring />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
