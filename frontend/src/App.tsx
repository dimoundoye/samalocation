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
import ResetPassword from "./pages/ResetPassword";
import VerifyContract from "./pages/VerifyContract";
import Pricing from "./pages/Pricing";
import Maintenance from "./pages/Maintenance";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import Chatbot from "./components/Chatbot";
import OwnerPublicProfile from "./pages/OwnerPublicProfile";
import AcceptInvitation from "./pages/AcceptInvitation";

import { SocketProvider } from "@/contexts/SocketContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 secondes (pour un ressenti direct)
      gcTime: 5 * 60 * 1000, // 5 minutes (en mémoire)
      retry: 1,
      refetchOnWindowFocus: true, // Se rafraîchit quand on revient sur l'onglet
    },
  },
});

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
                <Route path="/search/:pageParam" element={<Recherche />} />
                <Route path="/property/:id" element={<DetailPropriete />} />
                <Route path="/proprio/:id" element={<OwnerPublicProfile />} />
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
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify/contract/:id" element={<VerifyContract />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="/maintenance" element={<Maintenance />} />
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
