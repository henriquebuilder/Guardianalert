import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Alert, AlertDescription } from "@/react-app/components/ui/alert";
import { Shield, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Required for httpOnly cookies
        body: JSON.stringify({ 
          email, 
          password,
          mfa_code: showMfaInput ? mfaCode : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error || "Muitas tentativas. Tente novamente mais tarde.");
        } else {
          setError(data.error || "Erro ao fazer login");
        }
        return;
      }

      // Check if MFA is required
      if (data.mfa_required) {
        setShowMfaInput(true);
        setError("");
        return;
      }

      // Check if password change is required
      if (data.must_change_password) {
        // TODO: Redirect to password change page
        setError("Você deve alterar sua senha antes de continuar");
        return;
      }

      // Token is now stored in httpOnly cookie automatically
      // Store user info only for display purposes (not sensitive)
      sessionStorage.setItem("admin_user", JSON.stringify(data.user));

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GuardianAlert</h1>
          <p className="text-slate-400">Painel Administrativo</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Login do Administrador</CardTitle>
            <CardDescription className="text-slate-400">
              Acesse o painel de controle municipal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                    placeholder="••••••••••••"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {showMfaInput && (
                <div className="space-y-2">
                  <Label htmlFor="mfa" className="text-slate-200">Código de Autenticação</Label>
                  <Input
                    id="mfa"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-slate-400">Digite o código de 6 dígitos do seu aplicativo</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading || (showMfaInput && mfaCode.length !== 6)}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center">
                Sistema de segurança municipal
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-slate-500">
          <p>Acesso restrito a funcionários autorizados</p>
        </div>
      </div>
    </div>
  );
}
