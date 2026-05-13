import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, Users, History, Settings, Calculator, Shield, User, CreditCard, Crown, Mic } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/react-app/components/ui/dropdown-menu';
import PanicButton from '@/react-app/components/PanicButton';
import LocationDisplay from '@/react-app/components/LocationDisplay';
import { useDisguiseMode } from '@/react-app/hooks/useDisguiseMode';
import { WelcomeTour } from '@/react-app/components/WelcomeTour';

export default function Home() {
  const navigate = useNavigate();
  const { lock } = useDisguiseMode();
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const subscription = (user as any)?.subscription;
  const isTrialActive = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const trialDaysLeft = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocationError('Não foi possível obter sua localização. Por favor, permita o acesso.');
        }
      );
    } else {
      setLocationError('Geolocalização não é suportada neste navegador.');
    }
  }, []);

  return (
    <>
      <WelcomeTour />
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                GuardianAlert
              </h1>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')} className="px-2 sm:px-3">
                <Users className="w-4 h-4" />
                <span className="ml-1 sm:ml-2 hidden xs:inline">Contatos</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="px-2 sm:px-3">
                <History className="w-4 h-4" />
                <span className="ml-1 sm:ml-2 hidden xs:inline">Histórico</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/recordings')} className="cursor-pointer">
                    <Mic className="w-4 h-4 mr-2" />
                    Gravações de Áudio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinatura
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={lock} className="cursor-pointer">
                    <Calculator className="w-4 h-4 mr-2" />
                    Ativar Modo Disfarce
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Subscription Alert */}
        {isExpired && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Assinatura Expirada</h2>
                <p className="text-orange-50 text-xs sm:text-sm mb-3 leading-relaxed">
                  Sua assinatura expirou. Renove agora para continuar usando o botão de pânico e enviar alertas.
                </p>
                <Button 
                  onClick={() => navigate('/subscription')}
                  size="sm"
                  className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
                >
                  Renovar Assinatura
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isTrialActive && trialDaysLeft <= 3 && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <div className="flex items-start gap-3 sm:gap-4">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Período de Avaliação</h2>
                <p className="text-blue-50 text-xs sm:text-sm mb-3 leading-relaxed">
                  Você tem {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''} de teste grátis. 
                  Assine por apenas R$ 14,99/ano para continuar protegida.
                </p>
                <Button 
                  onClick={() => navigate('/subscription')}
                  size="sm"
                  className="bg-white text-indigo-600 hover:bg-blue-50 font-semibold"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Emergency Banner */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-rose-500 to-purple-600 text-white border-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-1" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Sua Segurança é Nossa Prioridade</h2>
              <p className="text-rose-50 text-xs sm:text-sm leading-relaxed">
                Em caso de emergência, pressione o botão de pânico abaixo. Seus contatos de emergência e as autoridades serão notificados imediatamente com sua localização.
              </p>
            </div>
          </div>
        </Card>

        {/* Panic Button Section */}
        <div className="mb-6 sm:mb-8">
          <PanicButton location={location} />
        </div>

        {/* Location Display */}
        <div className="mb-6 sm:mb-8">
          <LocationDisplay location={location} error={locationError} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card 
            onClick={() => window.open('tel:190', '_blank')}
            className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer border-rose-200 active:scale-95"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Ligar para 190</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Contato direto com a Polícia Militar
                </p>
              </div>
            </div>
          </Card>

          <Card 
            onClick={() => window.open('tel:180', '_blank')}
            className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer border-purple-200 active:scale-95"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Ligar para 180</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Central de Atendimento à Mulher
                </p>
              </div>
            </div>
          </Card>

          <Card 
            onClick={() => navigate('/safe-places')}
            className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer border-emerald-200 active:scale-95"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Locais Seguros</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Mapa de locais de apoio
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Como funciona?</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>O botão de pânico envia sua localização em tempo real</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>Seus contatos de emergência são notificados imediatamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>Integração preparada para alertas às autoridades (190)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>Mantenha seus contatos de emergência sempre atualizados</span>
            </li>
          </ul>
        </div>

        {/* Disguise Mode Info */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 text-sm sm:text-base">Modo Disfarce Ativado</h3>
              <p className="text-xs sm:text-sm text-amber-800 mb-2">
                Para maior segurança, você pode ativar o Modo Disfarce que transforma o app em uma calculadora comum.
              </p>
              <p className="text-xs sm:text-sm text-amber-800 font-medium">
                Código secreto para desbloquear: <span className="font-mono bg-amber-100 px-2 py-0.5 rounded">911=</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
