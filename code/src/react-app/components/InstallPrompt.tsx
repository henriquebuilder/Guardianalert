import { useState, useEffect } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    setIsIOS(iOS && !isInStandaloneMode);

    // Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt if on iOS Safari and not installed
    if (iOS && !isInStandaloneMode) {
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    if (isIOS) {
      localStorage.setItem('ios-install-dismissed', 'true');
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  // iOS-specific prompt
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
        <Card className="p-4 shadow-lg border-2 border-blue-500 bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Instalar GuardianAlert</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Para instalar no iPhone:
              </p>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li className="flex items-start gap-1">
                  <span>1.</span>
                  <span>Toque em <Share className="w-3 h-3 inline" /> (compartilhar)</span>
                </li>
                <li>2. Role e toque "Adicionar à Tela de Início"</li>
                <li>3. Toque "Adicionar"</li>
              </ol>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="w-full"
              >
                Entendi
              </Button>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <Card className="p-4 shadow-lg border-2 border-blue-500 bg-white dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Instalar GuardianAlert</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Adicione à tela inicial para acesso rápido e funcionamento offline
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
              >
                Instalar
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                Agora não
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
