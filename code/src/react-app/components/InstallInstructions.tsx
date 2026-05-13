import { useState } from "react";
import { Download, Smartphone, Share } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function InstallInstructions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="lg"
        className="gap-2"
      >
        <Download className="w-5 h-5" />
        Como Instalar o App
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
              Como Instalar o GuardianAlert
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Android Instructions */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Android</h3>
              </div>

              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Opção 1: Banner Automático (mais fácil)</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Quando abrir o site, aparecerá um banner perguntando se quer instalar</li>
                  <li>Clique em "Instalar" ou "Adicionar"</li>
                  <li>O app será adicionado à sua tela inicial automaticamente</li>
                </ol>

                <p className="font-semibold mt-4">Opção 2: Menu do Chrome</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Abra o site no Chrome</li>
                  <li>Toque nos 3 pontinhos (menu) no canto superior direito</li>
                  <li>Selecione "Adicionar à tela inicial" ou "Instalar app"</li>
                  <li>Confirme tocando em "Adicionar"</li>
                  <li>O ícone do GuardianAlert aparecerá na sua tela inicial</li>
                </ol>
              </div>
            </Card>

            {/* iOS Instructions */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">iPhone (iOS)</h3>
              </div>

              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-red-600 mb-2">
                  ⚠️ Importante: Use o Safari (não funciona no Chrome do iPhone)
                </p>
                
                <ol className="list-decimal list-inside space-y-3 ml-2">
                  <li>Abra o site no <span className="font-semibold">Safari</span></li>
                  <li>
                    Toque no botão de compartilhar{" "}
                    <Share className="w-4 h-4 inline text-blue-500" />{" "}
                    (geralmente na parte inferior ou superior da tela)
                  </li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Edite o nome se quiser (recomendamos deixar "GuardianAlert")</li>
                  <li>Toque em "Adicionar" no canto superior direito</li>
                  <li>O app aparecerá na sua tela inicial como qualquer outro app</li>
                </ol>

                <div className="bg-blue-100 p-3 rounded-lg mt-4">
                  <p className="text-sm font-semibold text-blue-900">
                    💡 Dica: Depois de instalado, o GuardianAlert funcionará como um app nativo, 
                    abrindo em tela cheia sem as barras do navegador.
                  </p>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Por que instalar?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Acesso instantâneo direto da tela inicial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Funciona mesmo sem internet (recursos offline)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Abre em tela cheia como um app nativo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Mais discreto - ninguém precisa saber que é um app de segurança</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Não ocupa espaço - é muito mais leve que apps tradicionais</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setOpen(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
