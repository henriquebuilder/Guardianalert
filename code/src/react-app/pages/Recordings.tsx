import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Download, MapPin, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface Alert {
  id: number;
  latitude: number;
  longitude: number;
  audio_url: string | null;
  status: string;
  created_at: string;
}

export default function Recordings() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/alerts', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only alerts with audio recordings
        const withAudio = data.results.filter((alert: Alert) => alert.audio_url);
        setAlerts(withAudio);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (alertId: number) => {
    if (playingId === alertId) {
      setPlayingId(null);
      // Pause audio
      const audio = document.getElementById(`audio-${alertId}`) as HTMLAudioElement;
      if (audio) audio.pause();
    } else {
      // Pause any currently playing audio
      if (playingId !== null) {
        const currentAudio = document.getElementById(`audio-${playingId}`) as HTMLAudioElement;
        if (currentAudio) currentAudio.pause();
      }
      setPlayingId(alertId);
      // Play new audio
      const audio = document.getElementById(`audio-${alertId}`) as HTMLAudioElement;
      if (audio) audio.play();
    }
  };

  const downloadAudio = (audioUrl: string, alertId: number) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `guardian-alert-${alertId}.webm`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando gravações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/app')}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Gravações de Áudio</h1>
        </div>

        {alerts.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-12 text-center">
              <p className="text-white/70 text-lg">
                Nenhuma gravação de áudio encontrada.
              </p>
              <p className="text-white/50 mt-2">
                As gravações aparecem aqui quando você aciona o botão de pânico.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(alert.created_at)}
                      </CardTitle>
                      <CardDescription className="text-white/70 flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(alert.created_at)}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      alert.status === 'resolved' 
                        ? 'bg-green-500/20 text-green-300'
                        : alert.status === 'in_progress'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {alert.status === 'resolved' ? 'Resolvido' : 
                       alert.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="h-4 w-4" />
                    <a
                      href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors underline"
                    >
                      {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    </a>
                  </div>

                  {alert.audio_url && (
                    <div className="space-y-3">
                      <audio
                        id={`audio-${alert.id}`}
                        src={alert.audio_url}
                        onEnded={() => setPlayingId(null)}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => togglePlay(alert.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {playingId === alert.id ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Reproduzir
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => downloadAudio(alert.audio_url!, alert.id)}
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
