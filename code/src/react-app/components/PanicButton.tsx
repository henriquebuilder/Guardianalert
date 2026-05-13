import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Volume2, AlertCircle, Zap, CheckCircle, Mic, XCircle, MicOff } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/react-app/components/ui/alert-dialog';
import { useAudioRecorder, savePendingUpload } from '@/react-app/hooks/useAudioRecorder';
import { useSettings } from '@/react-app/hooks/useSettings';

interface PanicButtonProps {
  location: { lat: number; lng: number } | null;
}

export default function PanicButton({ location }: PanicButtonProps) {
  const { settings } = useSettings();
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const { isRecording, startRecording, stopRecording, error: audioError, recordingDuration, audioLevel, hasPendingUpload, retryPendingUpload } = useAudioRecorder();
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [alertError, setAlertError] = useState<string | null>(null);

  // Check microphone permission on mount
  const checkMicPermission = useCallback(async () => {
    if (!settings.audioRecordingEnabled) {
      setMicPermission('granted');
      return;
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      
      result.onchange = () => {
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      };
    } catch {
      // If permissions API is not supported, try to get stream directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');
      } catch {
        setMicPermission('denied');
      }
    }
  }, [settings.audioRecordingEnabled]);

  useEffect(() => {
    checkMicPermission();
  }, [checkMicPermission]);

  const handlePanicClick = () => {
    setShowConfirm(true);
  };

  const cancelCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setCountdown(null);
    setIsPressed(false);
  };

  const sendAlert = async () => {
    if (!location) return;
    
    setAlertError(null);
    
    try {
      // CRITICAL: Send alert IMMEDIATELY - don't wait for audio recording
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTimeout(() => {
          setAlertSent(true);
          setIsPressed(false);
          setCountdown(null);
        }, 1000);
        
        // Start audio recording in background AFTER alert is sent
        if (settings.audioRecordingEnabled && result.alertId) {
          const alertId = result.alertId;

          const audioDuration = settings.audioDurationSeconds || 60; // default 60s
          
          startRecording().then(() => {
            setTimeout(async () => {
              try {
                const audioBlob = await stopRecording();
                
                if (audioBlob && audioBlob.size > 0) {
                  // Determine file extension based on blob type
                  const mimeType = audioBlob.type;
                  const extension = mimeType.includes('mp4') ? 'mp4' : 
                                   mimeType.includes('aac') ? 'aac' : 
                                   mimeType.includes('ogg') ? 'ogg' : 'webm';
                  
                  // Save to IndexedDB as backup before attempting upload
                  await savePendingUpload(alertId, audioBlob, mimeType);
                  
                  const formData = new FormData();
                  formData.append('audio', audioBlob, `emergency-${alertId}-${Date.now()}.${extension}`);

                  // Retry logic: try up to 3 times
                  let uploadSuccess = false;
                  
                  for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                      const uploadResponse = await fetch('/api/audio/upload', {
                        method: 'POST',
                        body: formData,
                      });

                      const contentType = uploadResponse.headers.get('content-type');
                      if (!contentType || !contentType.includes('application/json')) {
                        const text = await uploadResponse.text();
                        console.error('[PanicButton] Upload retornou HTML:', text.substring(0, 100));
                        continue;
                      }
                      
                      if (uploadResponse.ok) {
                        const uploadResult = await uploadResponse.json();

                        const patchResponse = await fetch(`/api/alerts/${alertId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ audio_url: uploadResult.url }),
                        });

                        if (patchResponse.ok) {
                          uploadSuccess = true;
                          break;
                        } else {
                          const patchError = await patchResponse.text();
                          console.error('[PanicButton] Erro ao vincular áudio:', patchError);
                        }
                      } else {
                        const uploadError = await uploadResponse.json();
                        console.error('[PanicButton] Erro no upload:', uploadError);
                      }
                    } catch (err) {
                      console.error(`[PanicButton] Tentativa ${attempt} falhou:`, err);
                    }
                    
                    // Wait before retry
                    if (attempt < 3) {
                      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    }
                  }
                  
                  if (!uploadSuccess) {
                    // The audio is already saved in IndexedDB, will retry later
                  }
                } else {
                  console.warn('[PanicButton] Nenhum blob de áudio retornado ou arquivo vazio');
                }
              } catch (err) {
                console.error('[PanicButton] Falha na gravação/upload:', err);
              }
            }, audioDuration * 1000);
          }).catch(err => {
            console.error('[PanicButton] Falha ao iniciar gravação:', err);
          });
        } else {
          if (!result.alertId) {
            console.error('[PanicButton] ERRO: alertId não retornado pela API!', result);
          }
        }
        
        setTimeout(() => {
          setAlertSent(false);
        }, 6000);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      setIsPressed(false);
      setCountdown(null);
      setAlertError('Erro ao enviar alerta. Por favor, tente novamente ou ligue 190 diretamente.');
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setIsPressed(true);
    
    if (!location) return;
    
    // Start countdown
    setCountdown(settings.countdownSeconds);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setCountdownInterval(null);
          // Send alert when countdown reaches 0
          sendAlert();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownInterval(interval);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Panic Button Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
        {/* Animated rings - multiple layers */}
        {!alertSent && !isPressed && location && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-4 rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}></div>
            <div className="absolute inset-8 rounded-full bg-red-500/50 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.6s' }}></div>
          </>
        )}
        
        {/* Outer glow */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          alertSent 
            ? 'bg-green-500/20 blur-3xl' 
            : isPressed 
            ? 'bg-orange-500/30 blur-3xl animate-pulse'
            : 'bg-red-500/20 blur-2xl'
        }`}></div>
        
        {/* Success rings */}
        {alertSent && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-8 rounded-full border-4 border-green-400 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.2s' }}></div>
          </>
        )}
        
        {/* Main button */}
        <Button
          onClick={handlePanicClick}
          disabled={!location || alertSent || isPressed}
          className={`
            relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full shadow-2xl border-4 sm:border-6 md:border-8 
            transition-all duration-500 
            disabled:cursor-not-allowed
            ${alertSent 
              ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-200 scale-110' 
              : isPressed
              ? 'bg-gradient-to-br from-orange-500 to-red-700 border-orange-200 scale-95 animate-pulse'
              : !location
              ? 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-200 opacity-50'
              : 'bg-gradient-to-br from-red-500 to-red-700 border-white hover:from-red-600 hover:to-red-800 hover:scale-105 hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] active:scale-95'
            }
          `}
          style={{
            boxShadow: alertSent 
              ? '0 0 80px rgba(34,197,94,0.6), inset 0 0 40px rgba(255,255,255,0.2)'
              : isPressed
              ? '0 0 60px rgba(249,115,22,0.6), inset 0 0 30px rgba(0,0,0,0.3)'
              : location
              ? '0 25px 50px rgba(0,0,0,0.3), inset 0 0 30px rgba(255,255,255,0.1)'
              : '0 10px 30px rgba(0,0,0,0.2)'
          }}
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            {alertSent ? (
              <>
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white animate-bounce" strokeWidth={2.5} />
                <span className="text-xl sm:text-2xl font-bold text-white">ENVIADO!</span>
                <span className="text-xs text-white/90">Ajuda a caminho</span>
              </>
            ) : isPressed ? (
              <>
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white animate-pulse" strokeWidth={2.5} />
                <span className="text-xl sm:text-2xl font-bold text-white animate-pulse">ENVIANDO...</span>
                <span className="text-xs text-white/90">Aguarde</span>
              </>
            ) : (
              <>
                <AlertTriangle className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white transition-transform ${location ? 'group-hover:scale-110' : ''}`} strokeWidth={2.5} />
                <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">PÂNICO</span>
                <span className="text-xs sm:text-sm text-white/90 font-medium">
                  {location ? 'Pressione para alertar' : 'Aguardando GPS...'}
                </span>
              </>
            )}
          </div>
        </Button>
        
        {/* Glow effect on hover */}
        {location && !alertSent && !isPressed && (
          <div className="absolute inset-12 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"></div>
        )}
      </div>

      {/* Status messages */}
      <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 px-2 sm:px-0">
        {!location && (
          <div className="flex items-center gap-2 sm:gap-3 text-amber-700 bg-amber-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-amber-200 shadow-lg animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0"></div>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Obtendo sua localização GPS...</span>
          </div>
        )}
        
        {countdown !== null && (
          <div className="flex flex-col items-center gap-3 sm:gap-4 text-orange-700 bg-orange-50 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl border-2 border-orange-300 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                <span className="text-3xl sm:text-4xl font-bold text-white">{countdown}</span>
              </div>
              <div className="text-left">
                <p className="text-base sm:text-lg font-bold">Enviando alerta em...</p>
                <p className="text-xs sm:text-sm text-orange-600">Clique em cancelar se foi por engano</p>
              </div>
            </div>
            <Button
              onClick={cancelCountdown}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-orange-100 border-2 border-orange-500 text-orange-700 font-semibold"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar Alerta
            </Button>
          </div>
        )}
        
        {isRecording && (
          <div className="flex flex-col gap-2 text-red-700 bg-red-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border-2 border-red-200 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0"></div>
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium">
                Gravando áudio... {recordingDuration}s / {settings.audioDurationSeconds || 60}s
              </span>
            </div>
            {/* Audio level indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Nível:</span>
              <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
              <span className="text-xs text-red-600 w-8">{Math.round(audioLevel)}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${(recordingDuration / (settings.audioDurationSeconds || 60)) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {hasPendingUpload && !isRecording && (
          <div className="flex items-center gap-2 sm:gap-3 text-amber-700 bg-amber-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-amber-200 shadow-lg">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-medium">Áudio pendente de envio</span>
              <p className="text-xs text-amber-600 mt-1">
                Há gravações que não foram enviadas. 
              </p>
            </div>
            <Button
              onClick={retryPendingUpload}
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
            >
              Reenviar
            </Button>
          </div>
        )}
        
        {alertError && (
          <div className="flex items-center gap-2 sm:gap-3 text-red-700 bg-red-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-red-300 shadow-lg">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{alertError}</span>
          </div>
        )}
        
        {audioError && (
          <div className="flex items-center gap-2 sm:gap-3 text-amber-700 bg-amber-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-amber-200 shadow-lg">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{audioError}</span>
          </div>
        )}
        
        {settings.audioRecordingEnabled && micPermission === 'denied' && !isPressed && !alertSent && (
          <div className="flex items-center gap-2 sm:gap-3 text-red-700 bg-red-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-red-200 shadow-lg">
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-medium">Microfone bloqueado</span>
              <p className="text-xs text-red-600 mt-1">
                Vá em Configurações do celular → Apps → Navegador → Permissões → Microfone → Permitir
              </p>
            </div>
          </div>
        )}
        
        {settings.audioRecordingEnabled && micPermission === 'prompt' && !isPressed && !alertSent && (
          <div className="flex items-center gap-2 sm:gap-3 text-blue-700 bg-blue-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-blue-200 shadow-lg">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-medium">Permissão do microfone necessária</span>
              <p className="text-xs text-blue-600 mt-1">
                Quando pressionar o botão, aceite a permissão para gravar áudio como prova
              </p>
            </div>
          </div>
        )}

        {alertSent && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3 text-green-700 bg-green-50 px-4 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-green-200 shadow-2xl animate-bounce">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse flex-shrink-0" />
              <span className="text-sm sm:text-base font-bold">Alerta de emergência enviado!</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs sm:text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                <span>Contatos de emergência notificados</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                <span>Localização GPS compartilhada</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                <span>Polícia (190) acionada</span>
              </p>
              {settings.audioRecordingEnabled && (
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                  <span>Áudio gravado como prova</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-red-600 text-xl">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              Confirmar Alerta de Emergência
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed pt-2">
              Você está prestes a acionar um <strong className="text-red-600">alerta de emergência</strong>.
              <br /><br />
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <strong>O que acontecerá:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ Contagem regressiva de {settings.countdownSeconds} segundos (cancelável)</li>
                  <li>✓ Seus contatos de emergência serão notificados</li>
                  <li>✓ Sua localização GPS será compartilhada</li>
                  <li>✓ As autoridades (190) receberão o alerta</li>
                  {settings.audioRecordingEnabled && (
                    <li>✓ Áudio do ambiente será gravado por {settings.audioDurationSeconds || 60} segundos (prova legal)</li>
                  )}
                </ul>
              </div>
              <br />
              <strong className="text-red-700">⚠️ Use apenas em situações de real emergência.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Sim, Enviar Alerta Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
