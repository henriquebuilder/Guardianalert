import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Alert, AlertDescription } from "@/react-app/components/ui/alert";
import { Shield, Mail, Lock, User, CheckCircle } from "lucide-react";

export default function AdminSetup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadySetup, setAlreadySetup] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/admin/auth/setup-status");
        if (!response.ok) return;
        const data = (await response.json()) as { configured?: boolean };
        if (data.configured) setAlreadySetup(true);
      } catch {
        // Ignore errors (offline / API unavailable)
      }
    };

    checkSetup();
  }, []);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 12) {
      return "Senha deve ter no mínimo 12 caracteres";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Senha deve conter pelo menos uma letra maiúscula";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Senha deve conter pelo menos uma letra minúscula";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Senha deve conter pelo menos um número";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return "Senha deve conter pelo menos um caractere especial";
    }
    return null;
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: "super_admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar administrador");
        if (response.status === 403) {
          setAlreadySetup(true);
        }
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sistema Já Configurado</CardTitle>
            <CardDescription className="text-slate-400">
              O administrador principal já foi criado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              O sistema já possui um super administrador configurado. Use a página de login para acessar o painel.
            </p>
            <Button
              onClick={() => navigate("/admin/login")}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-green-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Sucesso!</CardTitle>
                <CardDescription className="text-slate-400">
                  Super administrador criado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              Redirecionando para a página de login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GuardianAlert</h1>
          <p className="text-slate-400">Configuração Inicial do Sistema</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Criar Super Administrador</CardTitle>
            <CardDescription className="text-slate-400">
              Configure o primeiro usuário administrativo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-200">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João da Silva"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@municipio.gov.br"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 12 caracteres"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Deve conter maiúsculas, minúsculas, números e caracteres especiais
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar Super Administrador"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-slate-500">
          <p>Esta página só está disponível na primeira configuração</p>
        </div>
      </div>
    </div>
  );
}
