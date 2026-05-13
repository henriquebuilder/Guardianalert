import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Alert, AlertDescription } from "@/react-app/components/ui/alert";
import { Shield, Smartphone, ShieldCheck, ShieldOff, AlertCircle } from "lucide-react";

export default function MFASetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [step, setStep] = useState<"status" | "setup" | "verify" | "disable">("status");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/me", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Unauthorized");
      
      await checkMFAStatus();
    } catch (err) {
      sessionStorage.removeItem("admin_user");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const checkMFAStatus = async () => {
    try {
      const response = await fetch("/api/mfa/status", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.mfa_enabled);
      }
    } catch (err) {
      console.error("Erro ao verificar status do MFA:", err);
    }
  };

  const handleSetupMFA = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/mfa/setup", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao configurar MFA");
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("verify");
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código inválido");
        return;
      }

      setSuccess("MFA ativado com sucesso!");
      setMfaEnabled(true);
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 2000);
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/mfa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código inválido");
        return;
      }

      setSuccess("MFA desativado com sucesso!");
      setMfaEnabled(false);
      setStep("status");
      setVerificationCode("");
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === "status") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Voltar ao Dashboard
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Autenticação de Dois Fatores</h1>
          <p className="text-slate-400">Adicione uma camada extra de segurança à sua conta</p>
        </div>

        {/* Status View */}
        {step === "status" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {mfaEnabled ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    MFA Ativado
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-5 h-5 text-yellow-400" />
                    MFA Desativado
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {mfaEnabled
                  ? "Sua conta está protegida com autenticação de dois fatores"
                  : "Recomendamos ativar a autenticação de dois fatores para maior segurança"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mfaEnabled ? (
                <>
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p className="font-medium mb-1">O que é MFA?</p>
                        <p className="text-slate-400">
                          A Autenticação de Dois Fatores (MFA) adiciona uma camada extra de segurança
                          exigindo um código temporário do seu celular além da senha.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep("setup")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Ativar MFA
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p className="font-medium mb-1">Sua conta está protegida</p>
                        <p className="text-slate-400">
                          O MFA está ativo. Você precisará de um código do seu aplicativo autenticador
                          sempre que fizer login.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep("disable")}
                    variant="outline"
                    className="w-full border-red-800 text-red-400 hover:bg-red-900/20"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Desativar MFA
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Setup View */}
        {step === "setup" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Configurar MFA</CardTitle>
              <CardDescription className="text-slate-400">
                Siga as instruções abaixo para configurar a autenticação de dois fatores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="text-slate-300">
                    <p className="font-medium">Instale um aplicativo autenticador</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Google Authenticator, Microsoft Authenticator, ou Authy
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="text-slate-300">
                    <p className="font-medium">Escaneie o código QR</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Use o aplicativo para escanear o código que será gerado
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="text-slate-300">
                    <p className="font-medium">Verifique o código</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Digite o código de 6 dígitos para confirmar
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("status")}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSetupMFA}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Gerando..." : "Gerar QR Code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verify View */}
        {step === "verify" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Escaneie o QR Code</CardTitle>
              <CardDescription className="text-slate-400">
                Use seu aplicativo autenticador para escanear o código
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyMFA} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-800 bg-green-900/20">
                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center bg-white p-6 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Ou digite manualmente:</p>
                  <code className="text-sm text-white font-mono break-all">{secret}</code>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-200">Código de Verificação</Label>
                  <Input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-slate-400">Digite o código de 6 dígitos do seu aplicativo</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("status");
                      setVerificationCode("");
                      setError("");
                    }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? "Verificando..." : "Ativar MFA"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Disable View */}
        {step === "disable" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Desativar MFA</CardTitle>
              <CardDescription className="text-slate-400">
                Digite um código do seu aplicativo para confirmar a desativação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDisableMFA} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-800 bg-green-900/20">
                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-medium mb-1">Atenção</p>
                      <p className="text-slate-400">
                        Desativar o MFA reduzirá a segurança da sua conta. Recomendamos manter ativado.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disable-code" className="text-slate-200">Código de Verificação</Label>
                  <Input
                    id="disable-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("status");
                      setVerificationCode("");
                      setError("");
                    }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? "Desativando..." : "Desativar MFA"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
