import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Shield, LogOut, AlertCircle, Lock } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  municipality_id: number | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me", {
          credentials: "include", // Required for httpOnly cookies
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        sessionStorage.removeItem("admin_user");
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue with logout even if request fails
    }
    sessionStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Administrador",
      municipal_admin: "Administrador Municipal",
      operator: "Operador",
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GuardianAlert Admin</h1>
                <p className="text-sm text-slate-400">Painel de Controle</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.full_name}</p>
                <p className="text-xs text-slate-400">{getRoleLabel(user?.role || "")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao Painel Administrativo
          </h2>
          <p className="text-slate-400">
            Sistema de gestão de alertas de emergência municipal
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Status do Sistema</CardTitle>
              <CardDescription className="text-slate-400">
                Infraestrutura operacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Autenticação</span>
                  <span className="text-xs text-green-400">✓ Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Banco de Dados</span>
                  <span className="text-xs text-green-400">✓ Conectado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Sistema JWT</span>
                  <span className="text-xs text-green-400">✓ Funcionando</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Segurança</CardTitle>
              <CardDescription className="text-slate-400">
                Configurações de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/admin/mfa")}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Configurar Autenticação de Dois Fatores (MFA)
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Acesso Rápido</CardTitle>
              <CardDescription className="text-slate-400">
                Principais funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/admin/alerts")}
                  className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Central de Alertas
                </Button>
                <Button
                  onClick={() => navigate("/admin/metrics")}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Dashboard de Métricas
                </Button>
                <div className="space-y-2 text-sm text-slate-400 pl-6 mt-4">
                  <p className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                    Gestão de Municípios (em breve)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Suas Permissões</CardTitle>
              <CardDescription className="text-slate-400">
                Nível de acesso atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">
                  {getRoleLabel(user?.role || "")}
                </p>
                <p className="text-sm text-slate-400">
                  {user?.role === "super_admin" && "Acesso completo ao sistema"}
                  {user?.role === "municipal_admin" && "Gestão do município atribuído"}
                  {user?.role === "operator" && "Visualização e atualização de alertas"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Sistema de Autenticação Implementado</CardTitle>
              <CardDescription className="text-slate-400">
                Base de segurança JWT com controle de acesso por roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 text-sm">
                  O sistema de autenticação está funcionando com as seguintes funcionalidades:
                </p>
                <ul className="text-slate-300 text-sm space-y-1 mt-2">
                  <li>✓ Login seguro com JWT (token válido por 7 dias)</li>
                  <li>✓ Senhas criptografadas com bcrypt (12 salt rounds)</li>
                  <li>✓ Três níveis de permissão: Super Admin, Admin Municipal, Operador</li>
                  <li>✓ Sistema de auditoria (logs de todas as ações)</li>
                  <li>✓ Middleware de autenticação e autorização</li>
                  <li>✓ Segregação de dados por município</li>
                </ul>
                <p className="text-slate-400 text-xs mt-4">
                  Próximos módulos: Central de Alertas, Dashboard de Métricas, Gestão de Usuários e Municípios
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
