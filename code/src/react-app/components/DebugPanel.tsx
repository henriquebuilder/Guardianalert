import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Bug, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Painel de debug para diagnóstico de problemas de roteamento
 * Mostra informações sobre location, hash, e estado do router
 */
export function DebugPanel() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hashHistory, setHashHistory] = useState<string[]>([]);

  useEffect(() => {
    setHashHistory(prev => [
      `${new Date().toLocaleTimeString()} - ${window.location.hash || "(empty)"}`,
      ...prev.slice(0, 9)
    ]);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleHashChange = () => {
      setHashHistory((prev) => [
        `${new Date().toLocaleTimeString()} - ${window.location.hash || "(empty)"}`,
        ...prev.slice(0, 9),
      ]);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Only show in development - using DEV check is more secure than !PROD
  // Avoids edge cases where PROD might not be defined
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-full shadow-lg"
        title="Abrir Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-80 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-yellow-500 text-black">
        <div className="flex items-center gap-2 font-bold">
          <Bug className="w-4 h-4" />
          Debug Panel
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-yellow-600 rounded"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-yellow-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
          {/* Current Location */}
          <div>
            <h3 className="font-bold text-yellow-400 mb-1">React Router Location</h3>
            <div className="bg-gray-800 p-2 rounded font-mono text-xs space-y-1">
              <div><span className="text-gray-400">pathname:</span> {location.pathname}</div>
              <div><span className="text-gray-400">hash:</span> {location.hash || "(empty)"}</div>
              <div><span className="text-gray-400">search:</span> {location.search || "(empty)"}</div>
            </div>
          </div>

          {/* Window Location */}
          <div>
            <h3 className="font-bold text-blue-400 mb-1">Window Location</h3>
            <div className="bg-gray-800 p-2 rounded font-mono text-xs space-y-1">
              <div><span className="text-gray-400">pathname:</span> {window.location.pathname}</div>
              <div><span className="text-gray-400">hash:</span> {window.location.hash || "(empty)"}</div>
              <div className="break-all"><span className="text-gray-400">href:</span> {window.location.href}</div>
            </div>
          </div>

          {/* Hash Routing Status */}
          <div>
            <h3 className="font-bold text-green-400 mb-1">Status do HashRouter</h3>
            <div className="bg-gray-800 p-2 rounded space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${window.location.hash ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs">
                  {window.location.hash ? "Hash presente" : "Hash VAZIO - problema detectado!"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="font-bold text-purple-400 mb-1">Navegação Direta (Fallback)</h3>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => window.location.hash = "#/"}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
              >
                Landing
              </button>
              <button
                onClick={() => window.location.hash = "#/app"}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
              >
                App
              </button>
              <button
                onClick={() => window.location.hash = "#/admin/login"}
                className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              >
                Admin Login
              </button>
              <button
                onClick={() => window.location.hash = "#/admin/setup"}
                className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              >
                Admin Setup
              </button>
              <button
                onClick={() => window.location.hash = "#/admin/dashboard"}
                className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              >
                Dashboard
              </button>
              <button
                onClick={() => window.location.hash = "#/admin/alerts"}
                className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              >
                Alertas
              </button>
            </div>
          </div>

          {/* Hash History */}
          <div>
            <h3 className="font-bold text-orange-400 mb-1">Histórico de Hash</h3>
            <div className="bg-gray-800 p-2 rounded font-mono text-xs space-y-1 max-h-24 overflow-y-auto">
              {hashHistory.length === 0 ? (
                <span className="text-gray-500">Nenhuma mudança ainda</span>
              ) : (
                hashHistory.map((entry, i) => (
                  <div key={i} className="text-gray-300">{entry}</div>
                ))
              )}
            </div>
          </div>

          {/* Console Instructions */}
          <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
            <p>Abra o Console (F12) para ver logs detalhados de roteamento.</p>
          </div>
        </div>
      )}
    </div>
  );
}
