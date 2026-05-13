import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { LogOut, TrendingUp, AlertCircle, CheckCircle, Clock, Users, MapPin } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  municipality_id: number | null;
}

interface MetricsData {
  totals: {
    total_alerts: number;
    pending_alerts: number;
    in_progress_alerts: number;
    resolved_alerts: number;
    avg_resolution_time_minutes: number;
    total_operators: number;
    total_municipalities: number;
  };
  users: {
    total_users: number;
    trial_users: number;
    active_users: number;
    expired_users: number;
    annual_revenue: number;
  };
  daily_alerts: Array<{
    date: string;
    count: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  subscription_growth: Array<{
    date: string;
    new_users: number;
    new_subscribers: number;
  }>;
  top_municipalities: Array<{
    municipality_name: string;
    alert_count: number;
  }>;
  operator_performance: Array<{
    operator_name: string;
    resolved_count: number;
  }>;
}

const COLORS = {
  pending: "#ef4444",
  in_progress: "#f59e0b",
  resolved: "#10b981",
};

export default function Metrics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Unauthorized");
        
        const userData = await response.json();
        setUser(userData);
        await loadMetrics();
      } catch (err) {
        sessionStorage.removeItem("admin_user");
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadMetrics = async () => {
    try {
      const response = await fetch("/api/admin/metrics", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    }
  };

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

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const statusData = metrics.status_distribution.map(item => ({
    name: item.status === "pending" ? "Pendente" : item.status === "in_progress" ? "Em Atendimento" : "Resolvido",
    value: item.count,
    status: item.status,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard de Métricas</h1>
                <p className="text-sm text-slate-400">Análise e Estatísticas</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/alerts")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Central de Alertas
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.full_name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
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
        {/* User & Subscription Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Métricas de Usuários e Assinaturas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border-slate-700 bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-200">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{metrics.users.total_users}</p>
                    <p className="text-xs text-purple-300 mt-1">Cadastrados</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-gradient-to-br from-blue-900/50 to-blue-800/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-200">Em Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{metrics.users.trial_users}</p>
                    <p className="text-xs text-blue-300 mt-1">7 dias grátis</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-200">Assinantes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{metrics.users.active_users}</p>
                    <p className="text-xs text-emerald-300 mt-1">Pagando R$ 14,99/ano</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-gradient-to-br from-amber-900/50 to-amber-800/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-200">Expirados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{metrics.users.expired_users}</p>
                    <p className="text-xs text-amber-300 mt-1">Aguardando renovação</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-gradient-to-br from-green-900/50 to-green-800/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-200">Receita Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">
                      R$ {(metrics.users.annual_revenue || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-300 mt-1">
                      {metrics.users.active_users} × R$ 14,99
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Métricas de Alertas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{metrics.totals.total_alerts}</p>
                  <p className="text-xs text-slate-500 mt-1">Todos os tempos</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Alertas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-400">{metrics.totals.pending_alerts}</p>
                  <p className="text-xs text-slate-500 mt-1">Aguardando atendimento</p>
                </div>
                <Clock className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Taxa de Resolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">
                    {metrics.totals.total_alerts > 0
                      ? Math.round((metrics.totals.resolved_alerts / metrics.totals.total_alerts) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{metrics.totals.resolved_alerts} resolvidos</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Tempo Médio de Resolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-400">
                    {metrics.totals.avg_resolution_time_minutes > 0
                      ? Math.round(metrics.totals.avg_resolution_time_minutes)
                      : 0}
                    <span className="text-lg">min</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Média de atendimento</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Subscription Growth Chart */}
        <div className="mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Crescimento de Assinaturas (Últimos 30 dias)</CardTitle>
              <CardDescription className="text-slate-400">Novos usuários e assinantes por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.subscription_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="new_users" stroke="#8b5cf6" strokeWidth={2} name="Novos Usuários" />
                  <Line type="monotone" dataKey="new_subscribers" stroke="#10b981" strokeWidth={2} name="Novos Assinantes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Daily Alerts Trend */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Alertas por Dia (Últimos 30 dias)</CardTitle>
              <CardDescription className="text-slate-400">Tendência diária de alertas recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.daily_alerts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} name="Alertas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Distribuição por Status</CardTitle>
              <CardDescription className="text-slate-400">Status atual dos alertas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Top Municipalities */}
          {metrics.top_municipalities.length > 0 && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Municípios Mais Ativos</CardTitle>
                <CardDescription className="text-slate-400">Volume de alertas por município</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.top_municipalities}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="municipality_name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Bar dataKey="alert_count" fill="#3b82f6" name="Alertas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Operator Performance */}
          {metrics.operator_performance.length > 0 && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Performance dos Operadores</CardTitle>
                <CardDescription className="text-slate-400">Alertas resolvidos por operador</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.operator_performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="operator_name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Bar dataKey="resolved_count" fill="#10b981" name="Resolvidos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Operadores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{metrics.totals.total_operators}</p>
              <p className="text-sm text-slate-400 mt-2">Usuários administrativos no sistema</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                Municípios Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{metrics.totals.total_municipalities}</p>
              <p className="text-sm text-slate-400 mt-2">Municípios participantes do programa</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Em Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-400">{metrics.totals.in_progress_alerts}</p>
              <p className="text-sm text-slate-400 mt-2">Alertas sendo processados agora</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
