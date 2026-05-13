import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isPending } = useAuth();

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect to login page if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow access even if expired (users can still view history/settings)
  // Only block certain actions in the UI
  return <>{children}</>;
}
