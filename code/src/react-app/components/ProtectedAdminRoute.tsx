import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

/**
 * Componente de proteção de rotas administrativas
 * 
 * IMPORTANTE: Esta proteção é CLIENT-SIDE e NÃO substitui a proteção do backend.
 * O backend SEMPRE valida o token JWT em cada requisição.
 * 
 * Esta proteção serve para:
 * 1. Evitar vazamento de estrutura da UI admin
 * 2. Melhorar UX redirecionando usuários não autenticados
 * 3. Prevenir engenharia reversa da interface
 */
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Validate session via httpOnly cookie (automatically sent with credentials: include)
        const response = await fetch("/api/admin/auth/me", {
          credentials: "include", // Required for httpOnly cookies
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Session invalid - clear any cached user info
          sessionStorage.removeItem("admin_user");
          setIsAuthenticated(false);
        }
      } catch {
        // Network error - assume not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyToken();
  }, []);

  // Enquanto verifica, mostrar loading mínimo (não expor estrutura)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Não autenticado = redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Autenticado = mostrar conteúdo
  return <>{children}</>;
}
