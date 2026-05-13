import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Volume2, Clock, Shield, Timer } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import { Switch } from '@/react-app/components/ui/switch';
import { Label } from '@/react-app/components/ui/label';
import { useSettings } from '@/react-app/hooks/useSettings';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

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
                  <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Configurações
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Audio Recording Setting */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="audio-recording" className="text-sm sm:text-base font-semibold text-gray-900">
                      Gravação de Áudio
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Gravar áudio como prova legal quando o pânico é acionado
                    </p>
                  </div>
                  <Switch
                    id="audio-recording"
                    checked={settings.audioRecordingEnabled}
                    onCheckedChange={(checked) => updateSettings({ audioRecordingEnabled: checked })}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Nota Legal:</strong> A gravação é aceita pelos tribunais brasileiros como prova em casos de legítima defesa. O áudio é criptografado e armazenado de forma segura.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Audio Duration Setting */}
          {settings.audioRecordingEnabled && (
            <Card className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm sm:text-base font-semibold text-gray-900 mb-2 block">
                    Duração da Gravação
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">
                    Tempo de gravação do áudio de emergência
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: 30, label: '30 segundos', desc: 'Rápido, arquivo menor' },
                      { value: 60, label: '1 minuto', desc: 'Recomendado' },
                      { value: 120, label: '2 minutos', desc: 'Mais detalhes' },
                      { value: 300, label: '5 minutos', desc: 'Máxima evidência' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ audioDurationSeconds: option.value })}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          settings.audioDurationSeconds === option.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{option.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({option.desc})</span>
                          </div>
                          {settings.audioDurationSeconds === option.value && (
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>Dica:</strong> Gravações mais longas capturam mais evidências, mas ocupam mais espaço. 1-2 minutos é suficiente na maioria dos casos.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Countdown Setting */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-sm sm:text-base font-semibold text-gray-900 mb-2 block">
                  Contagem Regressiva
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Tempo de espera antes de enviar o alerta (pode ser cancelado)
                </p>
                <div className="space-y-2">
                  {[3, 5, 10].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => updateSettings({ countdownSeconds: seconds })}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        settings.countdownSeconds === seconds
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{seconds} segundos</span>
                        {settings.countdownSeconds === seconds && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Dica:</strong> Uma contagem mais longa dá mais tempo para cancelar caso tenha acionado por engano.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy & Security Info */}
          <Card className="p-4 sm:p-6 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  Privacidade & Segurança
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 flex-shrink-0">✓</span>
                    <span>Todas as gravações são criptografadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 flex-shrink-0">✓</span>
                    <span>Seus dados nunca são compartilhados com terceiros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 flex-shrink-0">✓</span>
                    <span>Você pode deletar suas gravações a qualquer momento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 flex-shrink-0">✓</span>
                    <span>Localização GPS é usada apenas durante alertas</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
