import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Recherche from "./pages/Recherche";
import DetailPropriete from "./pages/DetailPropriete";
import DashboardProprietaire from "./pages/DashboardProprietaire";
import DashboardLocataire from "./pages/DashboardLocataire";
import AdminDashboard from "./pages/AdminDashboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import SetupProfile from "./pages/SetupProfile";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import Chatbot from "./components/Chatbot";

import { SocketProvider } from "@/contexts/SocketContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <SocketProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<Recherche />} />
                <Route path="/property/:id" element={<DetailPropriete />} />
                <Route
                  path="/owner-dashboard"
                  element={
                    <ProtectedRoute requiredRole="owner">
                      <DashboardProprietaire />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tenant-dashboard"
                  element={
                    <ProtectedRoute requiredRole="tenant">
                      <DashboardLocataire />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/setup-profile"
                  element={
                    <ProtectedRoute>
                      <SetupProfile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Chatbot />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
