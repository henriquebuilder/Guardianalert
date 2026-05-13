# Todo

## Sistema de Assinaturas (NOVA PRIORIDADE)
- #35: ✓ REMOVIDO - Mocha Auth (não era o desejado)
- #42: ✓ Sistema próprio de autenticação (email/senha com bcrypt + JWT) - COMPLETO
- #43: ✓ Páginas de Signup e Login - COMPLETO
- #44: ✓ Vincular dados ao usuário (alerts, contacts, profile por user_id) - COMPLETO
- #45: ✓ Bloquear envio de alertas se assinatura expirada - COMPLETO
- #46: ✓ Reduzir/remover countdown do botão de pânico - COMPLETO (padrão 0s)
- #47: ✓ Página de áudios gravados acessível para usuários - COMPLETO
- #48: Integração de pagamento (PIX/Cartão)
- #49: Recuperação de senha por e-mail

## Backlog (opcional)
- #27: Shake-to-activate - ativar botão de pânico ao sacudir o celular
- #28: SMS fallback - enviar SMS mesmo quando internet falhar
- #29: Locais seguros por usuários - permitir adicionar novos locais
- #30: Filtros avançados no mapa - busca por nome, raio de distância

## Painel Administrativo (em progresso)
- #17: ✓ Base de autenticação JWT (admin_users, municipalities, audit_logs, login/logout)
- #18: ✓ Central de alertas - Dashboard com lista de alertas em tempo real
- #19: ✓ Sistema de atribuição e workflow de alertas (assign, in_progress, resolved)
- #20: ✓ Métricas e analytics - Dashboard com gráficos e estatísticas
- #21: Gestão de municípios e usuários administrativos (CRUD completo)
- #22: ✓ Segurança avançada - Rate limiting, MFA, política de senhas
- #23: ✓ Hardening de segurança - ProtectedRoute, JWT 1h, headers CSP/HSTS/X-Frame-Options
- #24: ✓ Migração completa para httpOnly cookies
- #25: ✓ Refresh Token implementado (7 dias)
- #26: ✓ Melhorias de feedback - Permissão do microfone, erros de alerta, lista de locais seguros
- #27: ✓ Error handling aprimorado - try/catch em todos endpoints, logs detalhados, endpoint de debug
- #28: ✓ CSRF Protection para rotas admin
- #29: ✓ Rate limiting em rotas públicas (5 alertas/min por IP)
- #30: ✓ Anti-bot protection (honeypot, timing, user-agent)
- #31: ✓ Audit logs avançados (severidade, geo, metadados JSON)
- #32: ✓ CSP estrito em produção (sem unsafe-eval/unsafe-inline)
- #33: ✓ Auto-refresh e botões de atualização em todas as páginas

## Funcionalidades opcionais do app
- #9: Adicionar shake-to-activate como opção alternativa
- #13: ✓ Modo de simulação de SMS para testes (sem gastar créditos)
- #15: Adicionar sistema de adicionar novos locais seguros
- #16: Adicionar filtros avançados no mapa (busca por CEP, raio de distância)
