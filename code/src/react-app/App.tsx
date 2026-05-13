import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/Landing";
import HomePage from "./pages/Home";
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login";
import ContactsPage from "./pages/Contacts";
import HistoryPage from "./pages/History";
import SettingsPage from "./pages/Settings";
import SafePlacesPage from "./pages/SafePlaces";
import ProfilePage from "./pages/Profile";
import SubscriptionPage from "./pages/Subscription";
import RecordingsPage from "./pages/Recordings";
import AdminSetup from "./pages/admin/Setup";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AlertsCenter from "./pages/admin/AlertsCenter";
import Metrics from "./pages/admin/Metrics";
import MFASetup from "./pages/admin/MFASetup";
import Calculator from "./components/Calculator";
import NotFound from "./components/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { DebugPanel } from "./components/DebugPanel";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DisguiseModeProvider, useDisguiseMode } from "./hooks/useDisguiseMode";
import { SettingsProvider } from "./hooks/useSettings";

/**
 * ARQUITETURA DE ROTEAMENTO (CORRIGIDA)
 * 
 * REGRA: Nunca usar <Routes> dentro de <Routes> sem <Outlet />
 * 
 * Solução: Rotas planas (flat routes)
 * - Rotas admin declaradas explicitamente com path completo
 * - AppWithDisguise usa Routes apenas para rotas públicas
 * - Zero nesting problemático
 */

// App público com lógica de disfarce
function AppWithDisguise() {
  const { isDisguised, unlock } = useDisguiseMode();

  // Modo disfarce só se aplica aqui (rotas públicas)
  if (isDisguised) {
    return (
      <>
        <Calculator onUnlock={unlock} />
        <InstallPrompt />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><RecordingsPage /></ProtectedRoute>} />
        <Route path="/safe-places" element={<ProtectedRoute><SafePlacesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound type="public" />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}

// Roteamento raiz - FLAT (sem nested Routes)
function AppRoutes() {
  return (
    <Routes>
      {/* Admin routes - Setup e Login são públicas (necessárias para autenticação) */}
      <Route path="/admin/setup" element={<AdminSetup />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Admin routes protegidas - requerem autenticação */}
      <Route path="/admin/dashboard" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/alerts" element={
        <ProtectedAdminRoute>
          <AlertsCenter />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/metrics" element={
        <ProtectedAdminRoute>
          <Metrics />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/mfa" element={
        <ProtectedAdminRoute>
          <MFASetup />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/*" element={<NotFound type="admin" />} />

      {/* Rotas públicas - podem ter disguise */}
      <Route path="/*" element={<AppWithDisguise />} />
    </Routes>
  );
}

// Raiz: Providers envolvem tudo, Router contém AppRoutes
export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DisguiseModeProvider>
          <Router>
            <AppRoutes />
            <DebugPanel />
          </Router>
        </DisguiseModeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
