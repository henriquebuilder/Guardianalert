import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import { Shield, LogOut, MapPin, Phone, User, CheckCircle, AlertTriangle, PlayCircle, RefreshCw } from "lucide-react";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/react-app/components/ui/dialog";

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  municipality_id: number | null;
}

interface Alert {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  message: string | null;
  police_notified: boolean;
  audio_url: string | null;
  municipality_id: number | null;
  assigned_to: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_age: number | null;
  user_notes: string | null;
  assigned_to_name: string | null;
  notifications_count: number;
}

export default function AlertsCenter() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [operators, setOperators] = useState<AdminUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [assigningTo, setAssigningTo] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Unauthorized");
        
        const userData = await response.json();
        setUser(userData);
        await loadAlerts();
        await loadOperators();
      } catch (err) {
        sessionStorage.removeItem("admin_user");
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const loadAlerts = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const response = await fetch("/api/admin/alerts", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Erro ao carregar alertas:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadAlerts(true);
  };

  const loadOperators = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setOperators(data);
      }
    } catch (err) {
      console.error("Erro ao carregar operadores:", err);
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

  const openAlertDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setAssigningTo(alert.assigned_to?.toString() || "");
    setResolutionNotes(alert.resolution_notes || "");
    setShowDetailsDialog(true);
  };

  const handleAssign = async () => {
    if (!selectedAlert || !assigningTo) return;
    
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/admin/alerts/${selectedAlert.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assignedTo: parseInt(assigningTo) }),
      });
      
      if (response.ok) {
        await loadAlerts();
        setShowDetailsDialog(false);
      }
    } catch (err) {
      console.error("Erro ao atribuir alerta:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedAlert) return;
    
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/admin/alerts/${selectedAlert.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          status: newStatus,
          resolutionNotes: newStatus === "resolved" ? resolutionNotes : undefined,
        }),
      });
      
      if (response.ok) {
        await loadAlerts();
        setShowDetailsDialog(false);
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: "destructive" as const, label: "Pendente", icon: AlertTriangle },
      in_progress: { variant: "default" as const, label: "Em Atendimento", icon: PlayCircle },
      resolved: { variant: "secondary" as const, label: "Resolvido", icon: CheckCircle },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === "all") return true;
    return alert.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-white">Central de Alertas</h1>
                <p className="text-sm text-slate-400">Gerenciamento de Emergências</p>
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
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Alertas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_progress">Em Atendimento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1" />
          
          <span className="text-slate-400 text-xs hidden md:block">
            Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <div className="text-slate-300 text-sm">
            {filteredAlerts.length} alerta(s) encontrado(s)
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid gap-4">
          {filteredAlerts.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Nenhum alerta encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
                onClick={() => openAlertDetails(alert)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">Alerta #{alert.id}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {new Date(alert.created_at).toLocaleString("pt-BR")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-400 mt-1" />
                      <div>
                        <p className="text-xs text-slate-500">Localização</p>
                        <p className="text-sm text-slate-300">
                          {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    
                    {alert.user_name && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-400 mt-1" />
                        <div>
                          <p className="text-xs text-slate-500">Usuária</p>
                          <p className="text-sm text-slate-300">
                            {alert.user_name}
                            {alert.user_age && `, ${alert.user_age} anos`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {alert.assigned_to_name && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-xs text-slate-500">Atribuído a</p>
                          <p className="text-sm text-slate-300">{alert.assigned_to_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {alert.notifications_count > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {alert.notifications_count} notificação(ões) enviada(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Alert Details Dialog */}
      {selectedAlert && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Alerta #{selectedAlert.id}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Recebido em {new Date(selectedAlert.created_at).toLocaleString("pt-BR")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Status atual */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Status Atual</p>
                {getStatusBadge(selectedAlert.status)}
              </div>
              
              {/* Localização */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Localização GPS</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">
                    {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(
                      `https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`,
                      "_blank"
                    )}
                    className="ml-auto border-slate-600 text-slate-300"
                  >
                    Abrir no Mapa
                  </Button>
                </div>
              </div>
              
              {/* Informações da usuária */}
              {selectedAlert.user_name && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Informações da Usuária</p>
                  <div className="bg-slate-900/50 p-3 rounded-lg space-y-1">
                    <p className="text-slate-300">
                      <strong>Nome:</strong> {selectedAlert.user_name}
                    </p>
                    {selectedAlert.user_age && (
                      <p className="text-slate-300">
                        <strong>Idade:</strong> {selectedAlert.user_age} anos
                      </p>
                    )}
                    {selectedAlert.user_notes && (
                      <p className="text-slate-300">
                        <strong>Observações:</strong> {selectedAlert.user_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Áudio */}
              {selectedAlert.audio_url && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Gravação de Áudio</p>
                  <audio controls className="w-full">
                    <source src={selectedAlert.audio_url} type="audio/webm" />
                    Seu navegador não suporta áudio.
                  </audio>
                </div>
              )}
              
              {/* Atribuição */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Atribuir a Operador</p>
                <div className="flex gap-2">
                  <Select value={assigningTo} onValueChange={setAssigningTo}>
                    <SelectTrigger className="flex-1 bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Selecione um operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.id} value={op.id.toString()}>
                          {op.full_name} ({op.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssign}
                    disabled={!assigningTo || processingAction}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Atribuir
                  </Button>
                </div>
              </div>
              
              {/* Ações de status */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Ações</p>
                <div className="flex gap-2">
                  {selectedAlert.status === "pending" && (
                    <Button
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={processingAction}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Iniciar Atendimento
                    </Button>
                  )}
                  
                  {selectedAlert.status === "in_progress" && (
                    <Button
                      onClick={() => handleUpdateStatus("resolved")}
                      disabled={processingAction}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Resolvido
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Notas de resolução */}
              {selectedAlert.status === "in_progress" && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Notas de Resolução</p>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Descreva as ações tomadas e o resultado..."
                    className="bg-slate-900 border-slate-700 text-white"
                    rows={4}
                  />
                </div>
              )}
              
              {/* Notas de resolução (visualização) */}
              {selectedAlert.status === "resolved" && selectedAlert.resolution_notes && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Notas de Resolução</p>
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-slate-300">{selectedAlert.resolution_notes}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Resolvido em {new Date(selectedAlert.resolved_at!).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
                className="border-slate-600 text-slate-300"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
