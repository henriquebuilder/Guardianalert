import { useState, useEffect } from "react";
import { X, Shield, Phone, MapPin, Calculator, Volume2, Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    icon: <Shield className="w-8 h-8 text-red-500" />,
    title: "Bem-vinda ao GuardianAlert",
    description: "Seu app de segurança pessoal com recursos discretos e eficientes para situações de emergência."
  },
  {
    icon: <Phone className="w-8 h-8 text-blue-500" />,
    title: "Botão de Pânico",
    description: "Pressione e segure o botão vermelho para enviar alertas SMS com sua localização GPS para seus contatos de emergência."
  },
  {
    icon: <MapPin className="w-8 h-8 text-green-500" />,
    title: "Locais Seguros",
    description: "Encontre DEAMs, delegacias, abrigos, hospitais e farmácias próximas em um mapa interativo com filtros."
  },
  {
    icon: <Volume2 className="w-8 h-8 text-purple-500" />,
    title: "Gravação de Áudio",
    description: "Ao acionar o botão de pânico, o app grava áudio automaticamente como evidência legal em caso de necessidade."
  },
  {
    icon: <Calculator className="w-8 h-8 text-orange-500" />,
    title: "Modo Disfarce - Calculadora",
    description: "Ative nas configurações para disfarçar o app como calculadora. Digite '911=' na calculadora para desbloquear o app real."
  },
  {
    icon: <Settings className="w-8 h-8 text-gray-500" />,
    title: "Personalize seu App",
    description: "Acesse Configurações para ajustar contagem regressiva, gravação de áudio e ativar o modo disfarce quando necessário."
  }
];

export function WelcomeTour() {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("guardian_tour_completed");
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem("guardian_tour_completed", "true");
    setShowTour(false);
  };

  if (!showTour) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                {step.icon}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-red-500"
                    : "w-2 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              {isLastStep ? (
                "Começar"
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-3"
            >
              Pular tour
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
