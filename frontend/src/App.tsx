import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SocketProvider } from "@/contexts/SocketContext";
import { HelmetProvider } from "react-helmet-async";
import { OfflineStatus } from "./components/OfflineStatus";
import ScrollToTop from "./components/ScrollToTop";
import Chatbot from "./components/Chatbot";

// Lazy loading components for performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Recherche = lazy(() => import("./pages/Recherche"));
const DetailPropriete = lazy(() => import("./pages/DetailPropriete"));
const DashboardProprietaire = lazy(() => import("./pages/DashboardProprietaire"));
const DashboardLocataire = lazy(() => import("./pages/DashboardLocataire"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const SetupProfile = lazy(() => import("./pages/SetupProfile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyContract = lazy(() => import("./pages/VerifyContract"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OwnerPublicProfile = lazy(() => import("./pages/OwnerPublicProfile"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const About = lazy(() => import("./pages/About"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const DossierDigital = lazy(() => import("./pages/DossierDigital"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

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
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-right" closeButton richColors expand={true} />
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <SocketProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
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
                      path="/owner-dashboard/:tab"
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
                      path="/tenant-dashboard/:tab"
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
                      path="/admin-dashboard/:tab"
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
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dossier-digital"
                      element={
                        <ProtectedRoute>
                          <Navigate to="/tenant-dashboard/dossier" replace />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify/contract/:id" element={<VerifyContract />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Chatbot />
                <OfflineStatus />
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
