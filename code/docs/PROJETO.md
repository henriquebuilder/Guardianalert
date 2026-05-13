# GuardianAlert - Documentação do Projeto

**URL de Produção:** https://jiyusuhqoyiic.mocha.app

---

## 📱 Visão Geral

GuardianAlert é um aplicativo PWA de segurança pessoal para mulheres, permitindo envio rápido de alertas de emergência com localização GPS, gravação de áudio como prova legal, e notificação automática de contatos de confiança.

---

## ✅ Funcionalidades Implementadas

### 🚨 Sistema de Emergência (Core)

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Botão de Pânico** | Botão grande e pulsante para acionar emergências | ✅ Completo |
| **Countdown Cancelável** | Contagem regressiva de 3/5/10 segundos antes do envio (configurável) | ✅ Completo |
| **Localização GPS** | Captura automática de coordenadas GPS em tempo real | ✅ Completo |
| **Gravação de Áudio** | Grava 30 segundos de áudio como prova legal | ✅ Completo |
| **Upload de Áudio** | Salva gravações no R2 (storage) vinculadas ao alerta | ✅ Completo |
| **Notificação SMS** | Envia SMS para contatos via Twilio com link do mapa | ✅ Completo |
| **Mensagem Personalizada** | Inclui nome, idade e notas do perfil no SMS | ✅ Completo |

### 👥 Gestão de Contatos

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **CRUD de Contatos** | Adicionar, editar, excluir contatos de emergência | ✅ Completo |
| **Contato Principal** | Marcar contato prioritário (notificado primeiro) | ✅ Completo |
| **Relacionamento** | Campo para indicar vínculo (amiga, familiar, etc.) | ✅ Completo |

### 🗺️ Locais Seguros

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Mapa Interativo** | Mapa Leaflet com marcadores de locais seguros | ✅ Completo |
| **Filtros por Tipo** | DEAM, Delegacia, Hospital, Abrigo, ONG, Farmácia | ✅ Completo |
| **78 Locais Pré-cadastrados** | 10 capitais brasileiras com pontos de apoio | ✅ Completo |
| **Vista Lista/Mapa** | Alternar entre visualização de lista e mapa | ✅ Completo |
| **Cálculo de Distância** | Mostra distância do usuário até cada local | ✅ Completo |
| **"Como Chegar"** | Botão que abre direções no Google Maps | ✅ Completo |

### 🕵️ Modo Disfarce

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Calculadora Funcional** | App aparece como calculadora comum | ✅ Completo |
| **Código Secreto** | Digite "911=" para desbloquear o app real | ✅ Completo |
| **Ativação via Menu** | Ativar/desativar nas configurações | ✅ Completo |
| **Metadados Discretos** | Título e ícone aparecem como "Calculadora" | ✅ Completo |

### 📊 Histórico e Estatísticas

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Lista de Alertas** | Histórico completo de alertas enviados | ✅ Completo |
| **Auto-refresh 30s** | Atualização automática a cada 30 segundos | ✅ Completo |
| **Botão Atualizar** | Refresh manual com indicador de carregamento | ✅ Completo |
| **Player de Áudio** | Reproduzir gravações de emergência | ✅ Completo |
| **Link para Mapa** | Ver localização de cada alerta no Google Maps | ✅ Completo |
| **Cards de Estatísticas** | Total de alertas, pendentes, notificações | ✅ Completo |
| **Status do Alerta** | Pendente, Ativo, Em Atendimento, Resolvido | ✅ Completo |

### ⚙️ Configurações

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Toggle Gravação de Áudio** | Ativar/desativar gravação automática | ✅ Completo |
| **Tempo de Countdown** | Escolher 3, 5 ou 10 segundos | ✅ Completo |
| **Perfil do Usuário** | Nome, idade e notas para personalizar alertas | ✅ Completo |

### 📲 PWA (Progressive Web App)

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Instalável** | Pode ser instalado como app no celular | ✅ Completo |
| **Service Worker** | Cache inteligente (não cacheia /api/*) | ✅ Completo |
| **Manifesto** | Ícones, cores, nome do app | ✅ Completo |
| **Guia de Instalação** | Instruções para Android e iOS | ✅ Completo |
| **Tour de Boas-vindas** | Tutorial interativo para novos usuários | ✅ Completo |

---

## 🔐 Painel Administrativo (Municipal)

### Autenticação e Segurança

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **httpOnly Cookies** | Tokens JWT armazenados em cookies seguros (proteção XSS) | ✅ Completo |
| **Refresh Token** | Token de renovação (7 dias) para sessões longas sem re-login | ✅ Completo |
| **Access Token 15min** | Token de acesso curto para segurança máxima | ✅ Completo |
| **CSRF Protection** | Tokens CSRF em cookies + headers para rotas admin | ✅ Completo |
| **bcrypt Password Hash** | Senhas criptografadas com bcrypt (cost 12) | ✅ Completo |
| **MFA (2FA)** | Autenticação de dois fatores com TOTP | ✅ Completo |
| **Rate Limiting Admin** | 5 tentativas por 15 minutos (bloqueio automático) | ✅ Completo |
| **Rate Limiting Público** | 5 alertas/min, 30 requisições/min por IP | ✅ Completo |
| **Anti-bot Protection** | Honeypot + timing check + user-agent validation | ✅ Completo |
| **Política de Senhas** | Mínimo 12 caracteres com complexidade | ✅ Completo |
| **Audit Logs Avançados** | Logs com severidade, geolocalização, metadados JSON | ✅ Completo |
| **Security Headers** | CSP estrito (sem unsafe-eval em prod), HSTS preload, X-Frame-Options | ✅ Completo |
| **Rotas Protegidas** | Verificação de JWT + CSRF em todas rotas admin | ✅ Completo |
| **Logout Seguro** | Endpoint que limpa todos os cookies de autenticação | ✅ Completo |

### Central de Alertas

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Lista em Tempo Real** | Alertas com auto-refresh a cada 30s | ✅ Completo |
| **Botão Atualizar** | Refresh manual com indicador de carregamento | ✅ Completo |
| **Filtros por Status** | Todos, Pendentes, Em Progresso, Resolvidos | ✅ Completo |
| **Modal de Detalhes** | Ver GPS, usuário, áudio de cada alerta | ✅ Completo |
| **Atribuir Operador** | Designar responsável pelo alerta | ✅ Completo |
| **Workflow de Status** | Pendente → Em Progresso → Resolvido | ✅ Completo |
| **Player de Áudio** | Ouvir gravações de emergência | ✅ Completo |

### Métricas e Analytics

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **KPIs em Tempo Real** | Total de alertas, pendentes, tempo médio | ✅ Completo |
| **Gráfico de Tendência** | Alertas por dia (últimos 7 dias) | ✅ Completo |
| **Pizza de Status** | Distribuição de alertas por status | ✅ Completo |
| **Ranking de Municípios** | Alertas por município | ✅ Completo |
| **Performance de Operadores** | Alertas resolvidos por operador | ✅ Completo |

---

## 🛤️ Rotas do Projeto

### Rotas Públicas (Usuário)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/#/` | Landing | Página inicial com apresentação do app |
| `/#/app` | Home | Botão de pânico principal |
| `/#/contacts` | Contatos | Gerenciar contatos de emergência |
| `/#/history` | Histórico | Ver alertas enviados |
| `/#/safe-places` | Locais Seguros | Mapa de pontos de apoio |
| `/#/settings` | Configurações | Ajustes do app |
| `/#/profile` | Perfil | Dados pessoais |

### Rotas Administrativas

| Rota | Página | Proteção |
|------|--------|----------|
| `/#/admin/setup` | Setup Inicial | Pública (criar primeiro admin) |
| `/#/admin/login` | Login Admin | Pública |
| `/#/admin/dashboard` | Dashboard | 🔒 JWT Required |
| `/#/admin/alerts` | Central de Alertas | 🔒 JWT Required |
| `/#/admin/metrics` | Métricas | 🔒 JWT Required |
| `/#/admin/mfa` | Configurar MFA | 🔒 JWT Required |

### Endpoints da API

#### Contatos
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts` - Criar contato
- `PUT /api/contacts/:id` - Atualizar contato
- `DELETE /api/contacts/:id` - Excluir contato

#### Alertas
- `POST /api/alerts` - Criar alerta de emergência
- `GET /api/alerts` - Listar alertas (histórico)
- `PATCH /api/alerts/:id` - Atualizar alerta (ex: vincular áudio)

#### Áudio
- `POST /api/audio/upload` - Upload de gravação
- `GET /api/audio/:alertId` - Baixar gravação

#### Locais Seguros
- `GET /api/safe-places` - Listar locais seguros
- `POST /api/safe-places` - Criar local seguro

#### Perfil
- `GET /api/profile` - Obter perfil do usuário
- `PUT /api/profile` - Atualizar perfil

#### Admin - Autenticação
- `POST /api/admin/auth/setup` - Criar primeiro admin
- `POST /api/admin/auth/login` - Login (retorna cookie httpOnly)
- `POST /api/admin/auth/logout` - Logout (limpa cookies)
- `GET /api/admin/auth/me` - Verificar sessão (via cookie)

#### Admin - Alertas
- `GET /api/admin/alerts` - Listar todos alertas
- `POST /api/admin/alerts/:id/assign` - Atribuir operador
- `POST /api/admin/alerts/:id/status` - Alterar status

#### Admin - Métricas
- `GET /api/admin/metrics` - Obter estatísticas

#### MFA
- `POST /api/mfa/setup` - Gerar QR code para TOTP
- `POST /api/mfa/verify` - Verificar código MFA
- `POST /api/mfa/disable` - Desativar MFA
- `GET /api/mfa/status` - Status do MFA

---

## 🗄️ Banco de Dados (SQLite/D1)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `emergency_contacts` | Contatos de emergência do usuário |
| `alerts` | Alertas de emergência enviados |
| `alert_notifications` | Notificações SMS enviadas por alerta |
| `safe_places` | Locais seguros (DEAMs, delegacias, hospitais) |
| `user_profile` | Perfil do usuário (nome, idade, notas) |
| `municipalities` | Municípios cadastrados no sistema |
| `admin_users` | Usuários administrativos |
| `audit_logs` | Logs de auditoria |
| `login_attempts` | Tentativas de login (rate limiting) |

---

## 🔌 Integrações

| Serviço | Uso | Status |
|---------|-----|--------|
| **Twilio** | Envio de SMS para contatos | ✅ Configurado |
| **R2 (Cloudflare)** | Armazenamento de gravações de áudio | ✅ Configurado |
| **Leaflet/OpenStreetMap** | Mapas interativos | ✅ Integrado |
| **Google Maps** | Links "Como Chegar" | ✅ Integrado |
| **speakeasy/qrcode** | MFA com TOTP | ✅ Integrado |

---

## 🚧 Funcionalidades Pendentes (Backlog)

### Alta Prioridade
| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| #21 | CRUD de Municípios | Gestão completa de municípios e admins |
| #25 | Refresh Tokens | Melhor UX com renovação automática de sessão |

### Média Prioridade
| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| #9 | Shake-to-Activate | Chacoalhar celular para acionar alerta |
| #15 | Adicionar Locais | Usuários sugerem novos locais seguros |
| #16 | Filtros Avançados | Busca por CEP, raio de distância |

### Ideias Futuras
| Funcionalidade | Descrição |
|----------------|-----------|
| Rede P2P | Usuárias próximas recebem alertas |
| Heat Maps | Mapa de calor de incidentes |
| Check-in | Marcar presença em locais seguros |
| Offline SMS | Enviar SMS mesmo sem internet |
| App Nativo | Versão Android/iOS com Capacitor |
| Integração 190 | Conexão direta com polícia (requer parceria) |

---

## 📁 Estrutura de Arquivos Principais

```
src/
├── react-app/
│   ├── components/
│   │   ├── Calculator.tsx       # Modo disfarce
│   │   ├── ContactForm.tsx      # Formulário de contatos
│   │   ├── DebugPanel.tsx       # Debug (só em dev)
│   │   ├── InstallPrompt.tsx    # Banner de instalação PWA
│   │   ├── LocationDisplay.tsx  # Exibe GPS
│   │   ├── PanicButton.tsx      # Botão de emergência
│   │   └── ProtectedAdminRoute.tsx # Proteção de rotas admin
│   ├── hooks/
│   │   ├── useAudioRecorder.tsx # Gravação de áudio
│   │   ├── useDisguiseMode.tsx  # Modo calculadora
│   │   └── useSettings.tsx      # Configurações
│   ├── pages/
│   │   ├── admin/               # Páginas administrativas
│   │   ├── Contacts.tsx
│   │   ├── History.tsx
│   │   ├── Home.tsx
│   │   ├── Landing.tsx
│   │   ├── Profile.tsx
│   │   ├── SafePlaces.tsx
│   │   └── Settings.tsx
│   └── App.tsx                  # Roteamento principal
├── worker/
│   ├── index.ts                 # API principal
│   ├── admin.ts                 # Rotas admin
│   ├── auth.ts                  # Middleware JWT
│   ├── mfa.ts                   # Rotas MFA
│   └── profile.ts               # Rotas de perfil
└── public/
    ├── manifest.json            # PWA manifest
    └── sw.js                    # Service Worker
```

---

## 🔑 Secrets (Variáveis de Ambiente)

| Secret | Descrição |
|--------|-----------|
| `TWILIO_ACCOUNT_SID` | ID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticação Twilio |
| `TWILIO_PHONE_NUMBER` | Número de telefone Twilio |
| `JWT_SECRET` | Chave para assinar tokens JWT |

---

## 📈 Escalabilidade e Custos

### Arquitetura Atual

| Componente | Tecnologia | Limites |
|------------|------------|---------|
| **Hosting** | Cloudflare Workers | 100k req/dia (free), ilimitado (paid) |
| **Banco de Dados** | Cloudflare D1 (SQLite) | 5GB storage, 5M rows read/day (free) |
| **Armazenamento** | Cloudflare R2 | 10GB (free), $0.015/GB depois |
| **SMS** | Twilio | Pay-per-use |
| **Frontend** | React PWA | Sem limite (static) |

### Cenários de Crescimento

#### Cenário 1: MVP / Piloto Municipal (100-1.000 usuários)
| Serviço | Tier | Custo/mês |
|---------|------|-----------|
| Mocha/Cloudflare | Free | $0 |
| D1 Database | Free | $0 |
| R2 Storage | Free (10GB) | $0 |
| Twilio SMS | Pay-as-go | ~$5-20 |
| **Total** | | **$5-20/mês** |

✅ **Infraestrutura atual suporta completamente**

#### Cenário 2: Expansão Regional (1.000-10.000 usuários)
| Serviço | Tier | Custo/mês |
|---------|------|-----------|
| Mocha/Cloudflare | Paid | $5 |
| D1 Database | Free | $0 |
| R2 Storage (60GB) | Paid | $0.75 |
| Twilio SMS (2k) | Pay-as-go | ~$160 |
| **Total** | | **~$170/mês** |

**Ações:** Upgrade Mocha, limpeza de áudios antigos, cache de locais seguros

#### Cenário 3: Escala Estadual (10.000-100.000 usuários)
| Serviço | Tier | Custo/mês |
|---------|------|-----------|
| Cloudflare Workers | Pro | $25 |
| D1 Database | Pro | $25 |
| R2 Storage (600GB) | Pay-as-go | $9 |
| Twilio SMS (20k) | Volume | ~$1,400 |
| **Total** | | **~$1,500/mês** |

**Ações:** Migrar para Cloudflare próprio, negociar volume Twilio, implementar filas

#### Cenário 4: Escala Nacional (100.000-1.000.000 usuários)
| Serviço | Tier | Custo/mês |
|---------|------|-----------|
| Cloudflare Workers | Enterprise | $200 |
| Planetscale | Scaler Pro | $300 |
| R2 Storage (6TB) | Pay-as-go | $90 |
| Cloudflare Queues | Pay-as-go | $50 |
| SMS (Zenvia 200k) | Volume Brasil | ~$8,000 |
| Monitoramento | Datadog | $100 |
| Backup/DR | Multi-region | $150 |
| **Total** | | **~$9,000/mês** |

**Ações:** Reescrever para multi-região, migrar SMS para Zenvia, implementar CQRS

### Resumo de Custos por Escala

| Cenário | Usuários | Alertas/mês | Custo/mês | Custo/usuário |
|---------|----------|-------------|-----------|---------------|
| MVP | 1k | 200 | $20 | $0.02 |
| Regional | 10k | 2k | $170 | $0.017 |
| Estadual | 100k | 20k | $1,500 | $0.015 |
| Nacional | 1M | 200k | $9,000 | $0.009 |

### Gargalos e Soluções

| Funcionalidade | Problema | Solução |
|----------------|----------|---------|
| **SMS** | Custo alto em escala | Migrar para Zenvia (BR) |
| **Áudio** | 1MB × 200k = 200GB/mês | Compactar para Opus (50KB) |
| **Mapa** | Muitos marcadores = lento | Clustering + indexação geo |
| **Admin** | 200k alertas na lista | Paginação + virtualização |

### Roadmap de Escalabilidade

| Fase | Usuários | Timeline | Investimento |
|------|----------|----------|--------------|
| 1. Otimização | 1k-10k | 1-2 meses | ~$200/mês |
| 2. Resiliência | 10k-50k | 2-3 meses | ~$500/mês |
| 3. Multi-região | 50k-100k | 3-6 meses | ~$2,000/mês |
| 4. Enterprise | 100k+ | 6-12 meses | ~$10,000/mês |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Twilio fora do ar | Baixa | Crítico | Fallback WhatsApp |
| D1 throttling | Média | Alto | Cache + Read replicas |
| Ataque DDoS | Média | Alto | Cloudflare WAF (incluso) |
| Pico de alertas | Baixa | Crítico | Auto-scale + Queues |

---

## 📅 Última Atualização

**Data:** Janeiro 2025
**Versão:** 1.3.0 - Melhorias de UX com auto-refresh

**Changelog v1.3.0:**
- ✅ Auto-refresh 30s em Histórico de Alertas
- ✅ Botão "Atualizar" manual com spinner em todas páginas principais
- ✅ Service Worker v6 não cacheia mais chamadas /api/*
- ✅ Timestamp "Última atualização" visível no header
- ✅ Refresh automático após salvar/editar dados

**Changelog v1.2.0:**
- ✅ Refresh Token com renovação automática (7 dias)
- ✅ Access Token reduzido para 15 minutos
- ✅ CSRF Protection em rotas admin
- ✅ Rate limiting público (5 alertas/min por IP)
- ✅ Anti-bot protection (honeypot, timing, user-agent)
- ✅ Audit logs avançados com severidade e metadados
- ✅ CSP estrito em produção
- ✅ Endpoint /api/admin/auth/refresh

---

## 📞 Contato

Para dúvidas sobre o projeto ou parcerias com secretarias de segurança pública, entre em contato.
