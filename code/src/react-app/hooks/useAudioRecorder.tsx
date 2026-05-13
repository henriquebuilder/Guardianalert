/**
 * Gravação de áudio de emergência com `MediaRecorder`, backup em IndexedDB e reenvio quando a rede falha.
 *
 * @module react-app/hooks/useAudioRecorder
 */
import { useState, useRef, useCallback, useEffect } from "react";

interface AudioRecorderHook {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  recordingDuration: number;
  audioLevel: number;
  isPaused: boolean;
  pauseRecording: () => void;
  resumeRecording: () => void;
  hasPendingUpload: boolean;
  retryPendingUpload: () => Promise<boolean>;
}

/** Registo em IndexedDB para reenvio posterior de áudio. */
export interface PendingUploadRecord {
  id: number;
  alertId: number;
  audioData: ArrayBuffer;
  mimeType: string;
  timestamp: number;
  retryCount: number;
}

// IndexedDB for backup storage
const DB_NAME = 'guardian-audio-backup';
const STORE_NAME = 'pending-uploads';

/**
 * Abre (ou cria) a base IndexedDB usada para fila de uploads pendentes.
 *
 * @returns `IDBDatabase` pronta para transações.
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Guarda cópia local do áudio associada a um alerta (reenvio assíncrono).
 *
 * @param alertId - ID do alerta no backend.
 * @param audioBlob - Blob gravado.
 * @param mimeType - Tipo MIME do blob.
 */
async function savePendingUpload(alertId: number, audioBlob: Blob, mimeType: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Convert blob to array buffer for storage
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    store.add({
      alertId,
      audioData: arrayBuffer,
      mimeType,
      timestamp: Date.now(),
      retryCount: 0,
    });
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    
    db.close();
  } catch (err) {
    console.error('[AudioRecorder] Erro ao salvar backup:', err);
  }
}

/**
 * Lista todos os uploads pendentes na fila local.
 *
 * @returns Array de registos ou `[]` em erro.
 */
async function getPendingUploads(): Promise<PendingUploadRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Remove um registo da fila após upload bem-sucedido.
 *
 * @param id - Chave autoincrementada no object store.
 */
async function deletePendingUpload(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    db.close();
  } catch (err) {
    console.error('[AudioRecorder] Erro ao deletar backup:', err);
  }
}

/**
 * Escolhe o primeiro `mimeType` suportado pelo `MediaRecorder` neste browser.
 *
 * @returns Par `{ mimeType, extension }`; `mimeType` pode ser string vazia (browser escolhe).
 */
function getSupportedMimeType(): { mimeType: string; extension: string } {
  const codecs = [
    // Prefer MP4/AAC for iOS compatibility
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    // WebM/Opus for Android/Desktop
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    // OGG fallback
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/ogg', extension: 'ogg' },
    // WAV as last resort (larger files but universal)
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const codec of codecs) {
    if (MediaRecorder.isTypeSupported(codec.mimeType)) {
      return codec;
    }
  }

  // Fallback to default
  return { mimeType: "", extension: "webm" };
}

/**
 * Hook de gravação: microfone, níveis de áudio, pausa/retoma, fila offline e reenvio.
 *
 * @returns API imperativa descrita em {@link AudioRecorderHook}.
 */
export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPendingUpload, setHasPendingUpload] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  // Check for pending uploads on mount
  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingUploads();
      setHasPendingUpload(pending.length > 0);
    };
    checkPending();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setRecordingDuration(0);

      // Get supported mime type
      mimeTypeRef.current = getSupportedMimeType();

      // Request microphone with optimized settings for voice
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Mono for smaller files
        } 
      });
      
      streamRef.current = stream;

      // Setup audio analyzer for level monitoring
      try {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        source.connect(analyzerRef.current);

        // Monitor audio levels
        levelIntervalRef.current = setInterval(() => {
          if (analyzerRef.current) {
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            analyzerRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(Math.min(100, (average / 128) * 100));
          }
        }, 100);
      } catch (err) {
        console.warn('[AudioRecorder] Audio analyzer não disponível:', err);
      }

      // Create MediaRecorder with optimized settings
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 64000, // 64kbps - sufficient for voice, smaller files
      };
      
      if (mimeTypeRef.current.mimeType) {
        recorderOptions.mimeType = mimeTypeRef.current.mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[AudioRecorder] Erro no MediaRecorder:', event);
        setError('Erro na gravação. Tente novamente.');
      };

      // Collect data every 500ms for smaller, more frequent chunks
      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);

      // Duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[AudioRecorder] Erro ao iniciar gravação:', err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Permissão de microfone negada. Vá em Configurações do navegador para permitir.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhum microfone encontrado no dispositivo.');
        } else if (err.name === 'NotReadableError') {
          setError('Microfone está sendo usado por outro aplicativo.');
        } else {
          setError(`Erro ao acessar microfone: ${err.message}`);
        }
      } else {
        setError('Não foi possível iniciar a gravação. Tente novamente.');
      }
      
      setIsRecording(false);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      // Cleanup intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = null;
      }
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setIsRecording(false);
        setIsPaused(false);
        setAudioLevel(0);
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        // Determine the correct mime type for the blob
        const mimeType = mimeTypeRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        setIsRecording(false);
        setIsPaused(false);
        setAudioLevel(0);
        setRecordingDuration(0);
        mediaRecorderRef.current = null;
        
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const retryPendingUpload = useCallback(async (): Promise<boolean> => {
    const pending = await getPendingUploads();
    
    if (pending.length === 0) {
      setHasPendingUpload(false);
      return true;
    }

    let allSuccess = true;

    for (const item of pending) {
      try {
        const blob = new Blob([item.audioData], { type: item.mimeType });
        const extension = item.mimeType.includes('mp4') ? 'mp4' : 
                         item.mimeType.includes('aac') ? 'aac' : 
                         item.mimeType.includes('ogg') ? 'ogg' : 'webm';
        
        const formData = new FormData();
        formData.append('audio', blob, `emergency-${item.alertId}-${Date.now()}.${extension}`);

        const uploadResponse = await fetch('/api/audio/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          
          // Update alert with audio URL
          await fetch(`/api/alerts/${item.alertId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_url: uploadResult.url }),
          });

          // Delete from pending
          await deletePendingUpload(item.id);
        } else {
          allSuccess = false;
          console.error(`[AudioRecorder] Falha ao reenviar áudio para alerta ${item.alertId}`);
        }
      } catch (err) {
        allSuccess = false;
        console.error('[AudioRecorder] Erro ao reenviar:', err);
      }
    }

    // Check remaining
    const remaining = await getPendingUploads();
    setHasPendingUpload(remaining.length > 0);
    
    return allSuccess;
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
    recordingDuration,
    audioLevel,
    isPaused,
    pauseRecording,
    resumeRecording,
    hasPendingUpload,
    retryPendingUpload,
  };
}

/**
 * Expõe {@link savePendingUpload} para componentes que gravam áudio fora deste hook.
 */
export { savePendingUpload };
