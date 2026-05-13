import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, Users, Phone, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import { Badge } from '@/react-app/components/ui/badge';

interface Alert {
  id: number;
  latitude: number;
  longitude: number;
  audio_url?: string;
  status: string;
  police_notified: number;
  created_at: string;
  updated_at: string;
  notifications_count: number;
  notifications_sent: number;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAlerts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const response = await fetch('/api/alerts');

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[History] Resposta não é JSON:', text.substring(0, 200));
        throw new Error('API retornou HTML ao invés de JSON');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }
      
      const data = await response.json();

      // Garantir que data é um array
      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (data.results && Array.isArray(data.results)) {
        setAlerts(data.results);
      } else {
        console.error('[History] Formato de dados inesperado:', data);
        setAlerts([]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[History] Erro ao buscar alertas:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleManualRefresh = () => {
    fetchAlerts(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500">Pendente</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">Em Atendimento</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-500">Resolvido</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-400">{status || 'Desconhecido'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Histórico de Alertas
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:block">
                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-white border-rose-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Alertas Totais</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.status === 'pending' || a.status === 'in_progress').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Alertas Pendentes</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {alerts.reduce((sum, alert) => sum + (alert.notifications_sent || 0), 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Notificações</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum alerta registrado
            </h3>
            <p className="text-gray-600 mb-6">
              Quando você acionar o botão de pânico, os alertas aparecerão aqui
            </p>
            <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-rose-500 to-purple-600">
              Voltar para Início
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          Alerta #{alert.id}
                        </h3>
                        {getStatusBadge(alert.status)}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(alert.created_at)} às {formatTime(alert.created_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                  {/* Location */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Localização</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-blue-600 hover:underline"
                      >
                        Ver no mapa →
                      </a>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Notificações</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {alert.notifications_sent || 0} de {alert.notifications_count || 0} enviadas
                      </p>
                      {alert.police_notified === 1 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-600 font-medium">
                            Polícia (190)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar for notifications */}
                {alert.notifications_count > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${((alert.notifications_sent || 0) / alert.notifications_count) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Audio Recording */}
                {alert.audio_url && (
                  <div className="mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
                          Gravação de Áudio (Prova Legal)
                        </p>
                        <audio
                          controls
                          className="w-full h-8 sm:h-10"
                          preload="metadata"
                          src={alert.audio_url}
                        >
                          Seu navegador não suporta o elemento de áudio.
                        </audio>
                        <p className="text-xs text-amber-700 mt-2">
                          Esta gravação serve como prova legal e pode ser usada em processos judiciais
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Info Banner */}
        {alerts.length > 0 && (
          <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Você pode clicar em "Ver no mapa" para abrir a localização exata de cada alerta no Google Maps.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
