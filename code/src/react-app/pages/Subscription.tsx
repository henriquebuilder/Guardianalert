import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Check, ArrowLeft, Loader2, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setSubscription((user as any).subscription);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const isTrialActive = subscription?.status === "trial";
  const isActive = subscription?.status === "active";
  const isExpired = subscription?.status === "expired";

  const trialDaysLeft = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-lg">GuardianAlert</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Status Card */}
        <div className={`rounded-2xl p-8 mb-8 ${
          isTrialActive ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
          isActive ? "bg-gradient-to-r from-emerald-500 to-teal-600" :
          "bg-gradient-to-r from-gray-500 to-gray-600"
        } text-white shadow-xl`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm font-medium opacity-90 mb-1">Status da Assinatura</div>
              <div className="text-3xl font-bold">
                {isTrialActive && "Período de Avaliação"}
                {isActive && "Assinatura Ativa"}
                {isExpired && "Assinatura Expirada"}
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isTrialActive ? "bg-white/20" :
              isActive ? "bg-white/20" :
              "bg-white/10"
            }`}>
              {isTrialActive && `${trialDaysLeft} dias restantes`}
              {isActive && subscription?.expires_at && `Válida até ${new Date(subscription.expires_at).toLocaleDateString('pt-BR')}`}
              {isExpired && "Renovação necessária"}
            </div>
          </div>

          {isTrialActive && (
            <p className="text-white/90 text-lg">
              Você tem {trialDaysLeft} dias para testar todos os recursos gratuitamente. 
              Após o período de avaliação, assine por apenas R$ 14,99/ano.
            </p>
          )}

          {isActive && (
            <p className="text-white/90 text-lg">
              Sua assinatura está ativa e todos os recursos estão disponíveis.
            </p>
          )}

          {isExpired && (
            <p className="text-white/90 text-lg">
              Sua assinatura expirou. Renove agora para continuar usando o GuardianAlert.
            </p>
          )}
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Assinatura Anual</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">R$ 14,99</span>
              <span className="text-xl opacity-90">/ano</span>
            </div>
            <p className="mt-2 text-lg opacity-90">Apenas R$ 1,25 por mês</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h3 className="font-bold text-xl mb-4 text-gray-900">Por que essa contribuição?</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  Em momentos críticos, cada segundo importa.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Para garantir que seus alertas sejam enviados com rapidez, que suas informações 
                  estejam seguras e que o sistema esteja sempre disponível, o GuardianAlert possui 
                  uma contribuição anual de R$14,99.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Esse valor cobre exclusivamente os custos de operação do serviço, como envio de 
                  SMS e infraestrutura.
                </p>
                <p className="text-gray-700 font-semibold mt-3">
                  Nosso compromisso é simples: estar disponível quando você mais precisar.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4 text-gray-900">O que está incluído:</h3>
              <div className="space-y-3">
                {[
                  "Botão de pânico com envio de SMS ilimitado",
                  "Gravação de áudio automática em emergências",
                  "Localização GPS em tempo real",
                  "Modo disfarce (calculadora secreta)",
                  "Mapa de locais seguros atualizado",
                  "Histórico completo de alertas",
                  "Suporte prioritário",
                  "Sem anúncios",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Escolha a forma de pagamento:</h3>
              
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg"
                onClick={() => alert("Integração de pagamento será implementada em breve. Por enquanto, entre em contato com suporte.")}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Pagar com PIX
              </Button>

              <Button
                variant="outline"
                className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold py-6 text-lg"
                onClick={() => alert("Integração de pagamento será implementada em breve. Por enquanto, entre em contato com suporte.")}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar com Cartão
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Pagamento seguro • Cancelamento a qualquer momento
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="font-bold text-xl mb-6 text-gray-900">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">O que acontece se eu não renovar?</h4>
              <p className="text-gray-600 text-sm">
                Você ainda poderá acessar o app e visualizar seu histórico, mas não poderá enviar novos alertas 
                até renovar a assinatura.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Posso cancelar a qualquer momento?</h4>
              <p className="text-gray-600 text-sm">
                Sim! Você pode cancelar quando quiser. Sua assinatura continuará ativa até o final do período pago.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Por que o valor é cobrado?</h4>
              <p className="text-gray-600 text-sm">
                Cada alerta enviado custa cerca de R$ 0,90 em SMS (3 contatos). O valor anual cobre esses custos 
                operacionais e garante que o serviço esteja sempre disponível.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
