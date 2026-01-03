import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Syllabi from "./pages/Syllabi";
import Analyze from "./pages/Analyze";
import BatchAnalyze from "./pages/BatchAnalyze";
import PaperComparison from "./pages/PaperComparison";
import YearOverYear from "./pages/YearOverYear";
import Questions from "./pages/Questions";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/syllabi" element={<Syllabi />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/batch-analyze" element={<BatchAnalyze />} />
            <Route path="/compare" element={<PaperComparison />} />
            <Route path="/year-over-year" element={<YearOverYear />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
