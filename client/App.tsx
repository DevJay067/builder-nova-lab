import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BmaxAI from "./pages/BmaxAI";
import HealthHistory from "./pages/HealthHistory";
import FirstAid from "./pages/FirstAid";
import HealthAnalytics from "./pages/HealthAnalytics";
import Legal from "./pages/Legal";
import SecureAccess from "./pages/SecureAccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bmax" element={<BmaxAI />} />
          <Route path="/history" element={<HealthHistory />} />
          <Route path="/first-aid" element={<FirstAid />} />
          <Route path="/analytics" element={<HealthAnalytics />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/secure" element={<SecureAccess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
