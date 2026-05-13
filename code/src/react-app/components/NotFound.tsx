import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface NotFoundProps {
  type?: 'public' | 'admin';
}

export default function NotFound({ type = 'public' }: NotFoundProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate(type === 'admin' ? '/admin/dashboard' : '/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground">
            {type === 'admin' 
              ? 'Esta página do painel administrativo não existe ou foi movida.'
              : 'A página que você está procurando não existe ou foi movida.'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={handleGoHome}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            {type === 'admin' ? 'Ir para Dashboard' : 'Ir para Início'}
          </Button>
        </div>
      </div>
    </div>
  );
}
