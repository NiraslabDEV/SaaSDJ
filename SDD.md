Perfeito. A escolha está registrada:

- **Linguagem / Framework**: TypeScript + Node.js + Express (monolito)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: JWT (customizada, com bcrypt)
- **Hospedagem**: Railway
- **Arquitetura**: Monolito modular

Com base nisso, inicio a **FASE 1 — SKELETON (Akita) + SPECIFY & DESIGN (SDD)** , gerando os artefatos obrigatórios que servirão como contrato inegociável para a implementação.

---

# ARTEFATOS DA FASE 1

## 1. CLAUDE.md (Visão Geral e Decisões)

```markdown
# Pulso Musical – Projeto de Booking para DJs

## Visão Geral
Plataforma premium para gestão de bookings de artistas (DJs), conectando artistas a contratantes com foco em transparência financeira, logística inteligente e automação de contratos. A experiência do usuário segue o design system "The Sonic Curator" (dark, editorial, alta tipografia).

## Stack Tecnológica
- **Backend**: Node.js + Express (TypeScript)
- **Banco de Dados**: PostgreSQL 15+
- **ORM**: Prisma
- **Autenticação**: JWT (access + refresh tokens) com bcrypt para hash de senhas
- **Hospedagem**: Railway (monolito)
- **Frontend**: HTML/CSS (Tailwind) + JavaScript (futura migração para React prevista, mas fora do escopo inicial)

## Decisões Arquiteturais (Trade-offs)

### 1. Monolito Modular
**Justificativa**: O escopo é bem definido e o time é pequeno. Um monolito bem estruturado (com módulos separados por domínio) oferece menor complexidade operacional e menor latência interna. A separação em microserviços seria prematura.  
**Trade-off**: Escalabilidade horizontal limitada, mas a Railway permite escalar verticalmente e replicar instâncias do monolito se necessário.

### 2. JWT Customizado vs OAuth
**Justificativa**: O requisito menciona sincronização com Google Agenda, mas a autenticação principal será própria com e‑mail/senha + JWT. Isso mantém o controle total sobre os fluxos de segurança e evita dependência externa para login. O acesso ao Google Agenda será feito via OAuth2 apenas para sincronização de calendário (escopo limitado).  
**Trade-off**: Maior responsabilidade na gestão de tokens e segurança (rotação de refresh tokens, blacklist).

### 3. Prisma como ORM
**Justificativa**: Type‑safe, migrations declarativas e excelente integração com TypeScript. Reduz drasticamente o risco de SQL injection e erros de consulta.  
**Trade-off**: Leve overhead de performance em consultas muito complexas, mas aceitável para o volume esperado.

### 4. Railway para Hospedagem
**Justificativa**: Deploy simplificado a partir do GitHub, suporte nativo a PostgreSQL, variáveis de ambiente e domínio customizado. Custo previsível e baixo para início.  
**Trade-off**: Menos controle sobre a infraestrutura comparado a AWS/GCP, mas suficiente para o estágio atual.

## Estrutura de Diretórios Proposta
```
backend/
├── src/
│   ├── config/           # Variáveis de ambiente, logger
│   ├── modules/
│   │   ├── auth/         # Registro, login, JWT, middlewares
│   │   ├── users/        # Perfil do DJ e do Contratante
│   │   ├── bookings/     # Propostas, contrapropostas, status
│   │   ├── calendar/     # Sincronização Google, disponibilidade
│   │   ├── logistics/    # Cálculo de distância, Uber estimado
│   │   ├── contracts/    # Geração de PDF (contrato)
│   │   ├── payments/     # Ganhos, próximos pagamentos (leitura)
│   │   └── notifications/# Emails (SendGrid/Mailgun)
│   ├── lib/
│   │   ├── prisma/       # Cliente Prisma
│   │   ├── jwt/          # Geração e validação de tokens
│   │   └── email/        # Serviço de envio de emails
│   ├── app.ts            # Configuração do Express
│   └── server.ts         # Entry point
├── prisma/
│   └── schema.prisma
├── tests/                # (Fase 2)
├── .env.example
└── package.json
```

## Instruções de Desenvolvimento
- **Ambiente**: Node.js 20.x, pnpm (recomendado)
- **Scripts**:
  - `pnpm dev` → rodar com tsx watch
  - `pnpm build` → compilar TypeScript
  - `pnpm start` → rodar build de produção
  - `pnpm test` → executar testes (futuro)
```

---

## 2. PRD.md (Product Requirements Document)

```markdown
# Product Requirements Document – Pulso Musical

## Problema a ser resolvido
DJs profissionais enfrentam dificuldades para gerenciar múltiplas propostas de eventos, calcular custos de logística de forma transparente e evitar conflitos de agenda. Contratantes (clubes, festivais) precisam de um processo simples para convidar artistas, visualizar estimativas de custo realistas e formalizar contratos rapidamente.

## User Stories

### DJ (Artista)
1. **Como DJ**, quero visualizar minha agenda mensal com eventos confirmados e bloqueios automáticos, para evitar double‑bookings.
2. **Como DJ**, quero receber propostas de booking com detalhes de local, data e duração, e poder aceitar, recusar ou enviar uma contraproposta.
3. **Como DJ**, quero que o sistema calcule automaticamente o custo total da performance (cachet base + horas + logística) com base no endereço do evento.
4. **Como DJ**, quero ver um resumo dos meus ganhos mensais e próximos pagamentos.
5. **Como DJ**, quero gerar um contrato digital em PDF a partir de uma proposta aceita, com todos os termos já preenchidos.
6. **Como DJ**, quero sincronizar minha agenda do Google para importar/exportar eventos e receber alertas de conflito.

### Contratante (Clube/Festival)
1. **Como contratante**, quero preencher um formulário de proposta informando data, local e duração, e ver imediatamente uma estimativa de custo.
2. **Como contratante**, quero acompanhar o status das minhas propostas (pendente, aprovada, contraproposta, rejeitada).
3. **Como contratante**, quero receber notificações por email quando o DJ responder à proposta.
4. **Como contratante**, quero baixar o contrato assinado digitalmente (versão futura) após a confirmação.

## Escopo (O que **não** será feito nesta versão)
- Sistema de pagamentos integrado (Stripe/PagSeguro). Os valores são apenas informativos.
- Chat em tempo real entre as partes.
- Assinatura digital de contratos (será apenas geração de PDF).
- Aplicativo mobile nativo (a interface é responsiva).
- Avaliações públicas de DJs/contratantes.
- Integração real com API da Uber (usaremos estimativa fixa baseada em distância).

## Critérios de Sucesso
- Um DJ consegue visualizar sua agenda sem conflitos e responder a uma proposta em menos de 2 minutos.
- Um contratante consegue enviar uma proposta e visualizar o custo estimado em menos de 1 minuto.
- O sistema bloqueia automaticamente 6h antes e 4h depois de um evento confirmado na agenda do DJ.
```

---

## 3. SPEC.md (Especificação Técnica)

```markdown
# Especificação Técnica – Pulso Musical

## 1. Arquitetura de Dados (Modelos Prisma)

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  passwordHash   String   // bcrypt
  name           String
  role           Role     @default(ARTIST)
  profilePicture String?
  bio            String?
  genres         String[] // Ex: ["Deep House", "Melodic Techno"]
  yearsActive    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relações
  artistBookings    Booking[]  @relation("ArtistBookings")
  clientBookings    Booking[]  @relation("ClientBookings")
  availabilitySlots AvailabilitySlot[]
  googleTokens      GoogleToken?
}

enum Role {
  ARTIST
  CLIENT
}

model GoogleToken {
  id           String   @id @default(cuid())
  userId       String   @unique
  accessToken  String   // Criptografado em repouso (aes-256)
  refreshToken String?
  expiryDate   DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AvailabilitySlot {
  id        String   @id @default(cuid())
  artistId  String
  startTime DateTime
  endTime   DateTime
  type      SlotType // FREE, BLOCKED_BY_EVENT, BLOCKED_MANUALLY
  artist    User     @relation(fields: [artistId], references: [id], onDelete: Cascade)

  @@unique([artistId, startTime, endTime])
}

enum SlotType {
  FREE                // Disponível para booking
  BOOKED              // Já tem um evento confirmado
  BUFFER_BEFORE       // Bloqueio automático (6h antes)
  BUFFER_AFTER        // Bloqueio automático (4h depois)
  MANUAL_BLOCK        // Bloqueio definido pelo artista
}

model Booking {
  id               String        @id @default(cuid())
  artistId         String
  clientId         String
  status           BookingStatus @default(PENDING)
  eventDate        DateTime
  durationHours    Int           // Em horas (ex: 3)
  locationAddress  String
  locationLat      Float?
  locationLng      Float?
  baseFee          Float         // Taxa base (fixa)
  hourlyRate       Float         // Valor por hora
  logisticsFee     Float         // Calculado com base na distância
  totalAmount      Float         // baseFee + (hourlyRate * durationHours) + logisticsFee
  counterOffer     Json?         // { totalAmount: float, durationHours?: int, notes?: string }
  contractPdfUrl   String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  artist           User          @relation("ArtistBookings", fields: [artistId], references: [id])
  client           User          @relation("ClientBookings", fields: [clientId], references: [id])
  notifications    Notification[]

  @@unique([artistId, eventDate]) // Um artista não pode ter dois bookings no mesmo horário
}

enum BookingStatus {
  PENDING           // Proposta enviada pelo cliente
  APPROVED          // DJ aceitou
  REJECTED          // DJ recusou
  COUNTER_PROPOSAL  // DJ enviou contraproposta (cliente precisa revisar)
  CANCELLED         // Cancelado por qualquer parte
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  bookingId String
  type      NotificationType
  sentAt    DateTime @default(now())
  readAt    DateTime?

  user      User     @relation(fields: [userId], references: [id])
  booking   Booking  @relation(fields: [bookingId], references: [id])
}

enum NotificationType {
  NEW_PROPOSAL
  PROPOSAL_ACCEPTED
  PROPOSAL_REJECTED
  COUNTER_PROPOSAL_RECEIVED
  CONTRACT_READY
}
```

## 2. API Specification

Todos os endpoints iniciam com `/api`.

### Autenticação

#### `POST /auth/register`
**Request Body:**
```json
{
  "email": "dj@example.com",
  "password": "SenhaForte123!",
  "name": "DJ Pulso",
  "role": "ARTIST"
}
```
**Response (201):**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "ARTIST" },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```
**Erros:** `409 Conflict` se e‑mail já existir. Senha deve ter ≥8 caracteres, 1 maiúscula, 1 número.

#### `POST /auth/login`
**Request:** `{ "email", "password" }`  
**Response (200):** `{ accessToken, refreshToken }`  
**Erros:** `401 Unauthorized` (credenciais inválidas) – **mensagem genérica**: "E‑mail ou senha incorretos."

#### `POST /auth/refresh`
**Request:** `{ "refreshToken" }`  
**Response:** Novo par de tokens.

#### `POST /auth/logout`
**Header:** `Authorization: Bearer <accessToken>`  
**Response:** 204 No Content. (Refresh token deve ser invalidado no backend.)

### Perfil do Usuário

#### `GET /users/me`
Retorna perfil do usuário autenticado.

#### `PATCH /users/me`
Atualiza bio, gêneros, foto.

### Bookings (Propostas)

#### `POST /bookings` (Cliente apenas)
**Body:**
```json
{
  "artistId": "...",
  "eventDate": "2025-06-15T22:00:00Z",
  "durationHours": 3,
  "locationAddress": "Av. Paulista, 1000, São Paulo - SP"
}
```
**Response (201):** Objeto `Booking` com `totalAmount` calculado.  
**Regras:**
- Verificar disponibilidade do artista (`AvailabilitySlot`). Conflito retorna `409 Conflict`.
- Calcular `logisticsFee`: distância estimada do endereço padrão do artista (definido no perfil) até o local. Se lat/lng não disponível, usar taxa fixa de R$ 150.
- Enviar e‑mail de notificação ao artista.

#### `GET /bookings` (com filtros)
- `?role=artist` → bookings onde `artistId = currentUser.id`
- `?role=client` → bookings onde `clientId = currentUser.id`
- `?status=PENDING,APPROVED`

#### `GET /bookings/:id`
Detalhes de um booking específico. Acesso restrito ao artista ou cliente envolvido.

#### `PATCH /bookings/:id/status` (Artista apenas)
**Body:**
```json
{
  "status": "APPROVED" | "REJECTED"
}
```
- Ao aprovar, criar slots `BOOKED` e buffers (`BUFFER_BEFORE`, `BUFFER_AFTER`) na agenda do artista.
- Disparar e‑mail para o cliente.

#### `POST /bookings/:id/counter-proposal` (Artista apenas)
**Body:**
```json
{
  "totalAmount": 3500.00,
  "durationHours": 4,
  "notes": "Valor ajustado para incluir rider técnico."
}
```
**Response:** Booking atualizado com status `COUNTER_PROPOSAL`. Cliente pode depois aceitar ou rejeitar (endpoint separado).

#### `POST /bookings/:id/contract`
Gera PDF do contrato (usando template HTML) e armazena URL em `contractPdfUrl`. Retorna link para download.

### Agenda / Disponibilidade

#### `GET /calendar/availability`
Retorna slots do artista autenticado para um intervalo de datas.

#### `POST /calendar/sync-google`
Inicia fluxo OAuth2 com Google. Retorna URL de autorização.

#### `GET /calendar/events`
Após sincronizado, retorna eventos do Google + eventos locais unificados.

### Financeiro (Somente leitura)

#### `GET /payments/earnings`
Retorna:
```json
{
  "monthly": 24850.00,
  "previousMonth": 22187.50,
  "growth": 12.0,
  "upcoming": [
    { "bookingId": "...", "eventName": "Club Neon", "date": "2025-10-15", "amount": 4200.00 }
  ]
}
```

### Caminhos Infelizes (Edge Cases)

| Cenário | Resposta |
|--------|----------|
| E‑mail já cadastrado | `409 Conflict` – "E‑mail já está em uso." |
| Login com credenciais erradas | `401 Unauthorized` – "E‑mail ou senha incorretos." (não revela se e‑mail existe) |
| Tentar acessar booking de outro usuário | `403 Forbidden` |
| Proposta com data no passado | `400 Bad Request` – "A data do evento deve ser futura." |
| Data conflita com evento existente | `409 Conflict` – "Artista já possui um compromisso neste horário." |
| Token JWT expirado | `401 Unauthorized` – "Token expirado." |
| Refresh token inválido/revogado | `401 Unauthorized` – "Sessão inválida. Faça login novamente." |

## 3. Critérios de Aceite (Verificáveis)

- **Senhas**: Armazenadas com bcrypt (custo 12).
- **Token de recuperação de senha** (futuro) deve expirar em 1 hora.
- **Bloqueio de agenda**: Ao aprovar um booking, slots de buffer (6h antes, 4h depois) são criados automaticamente e não podem ser sobrepostos por novos bookings.
- **Cálculo de logística**: Se coordenadas geográficas estiverem disponíveis, calcular distância em linha reta e multiplicar por R$ 2,50/km (ida e volta). Senão, usar valor fixo de R$ 150.
- **Rate Limiting**: 100 requisições por IP a cada 15 minutos para endpoints públicos; 1000 para autenticados.
- **Validação de Input**: E‑mail deve ser válido, senha forte, datas no formato ISO 8601.

## 4. Requisitos de Segurança Específicos

- **Autenticação**: Access token JWT com expiração de 15 minutos. Refresh token com expiração de 7 dias, armazenado em banco (HttpOnly cookie recomendado no futuro, mas inicialmente retornado no body).
- **Autorização**: Middleware que verifica `role` e `ownership` do recurso. Ex: `PATCH /bookings/:id/status` → apenas o artista dono do booking pode alterar.
- **Validação de Entrada**: Usar biblioteca `zod` para validar todos os payloads. Campos de string têm limite de tamanho (ex: bio ≤ 500 caracteres).
- **SQL Injection**: Todas as consultas via Prisma (parâmetros seguros).
- **IDOR**: Antes de qualquer operação em `booking`, verificar se `req.user.id === booking.artistId || req.user.id === booking.clientId`.
- **Upload de Arquivos**: Apenas PDFs são gerados server‑side; sem upload de usuário.
- **Segredos**: Variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.). NUNCA hardcoded.
```

---

## 4. DESIGN.md (Decisões de Design e Arquitetura)

```markdown
# Design Document – Pulso Musical (Backend)

## Diagrama de Arquitetura (Conceitual)

```
┌─────────────────────────────────────────────────────────────┐
│                      Railway (Monolito)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     Express App                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │  Auth   │ │ Bookings│ │ Calendar│ │ Notifications│  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘  │  │
│  │         │           │           │             │         │  │
│  │         └───────────┴───────────┴─────────────┘         │  │
│  │                        │                                 │  │
│  │                   ┌────▼────┐                            │  │
│  │                   │  Prisma │                            │  │
│  │                   └────┬────┘                            │  │
│  └────────────────────────┼────────────────────────────────┘  │
│                           │                                    │
│                    ┌──────▼──────┐                             │
│                    │ PostgreSQL   │                             │
│                    └──────────────┘                             │
└─────────────────────────────────────────────────────────────┘
        │                                      │
        ▼                                      ▼
   [Google OAuth]                       [Email Service]
   (Calendar Sync)                      (SendGrid/Mailgun)
```

## Padrões de Projeto Utilizados

- **Repository Pattern (via Prisma)**: O Prisma já atua como camada de abstração do banco. Consultas complexas serão encapsuladas em funções service (ex: `BookingService`).
- **Service Layer**: Lógica de negócio fica em módulos (ex: `modules/bookings/booking.service.ts`), separada dos controllers.
- **Middleware Pattern**: Autenticação (`authenticate`), autorização (`authorize`), rate limiting, validação de entrada (Zod).
- **Factory Pattern**: Para geração de contratos PDF (diferentes templates conforme tipo de evento).

## Estratégia de Autenticação e Autorização

1. **Registro/Login**: Senha hasheada com bcrypt. Geração de `accessToken` (JWT, payload: `{ userId, role }`, exp: 15min) e `refreshToken` (JWT, exp: 7d, armazenado em tabela `RefreshToken` ou no campo `refreshToken` do usuário? Por segurança, armazenaremos em tabela separada para permitir revogação).
2. **Middleware de Autenticação**:
   - Extrai token do header `Authorization: Bearer <token>`.
   - Verifica assinatura e expiração.
   - Busca usuário no banco e anexa ao `req.user`.
3. **Autorização**:
   - `requireRole(role)` → middleware que verifica `req.user.role`.
   - `requireOwnership(param, model)` → middleware que busca recurso e compara `userId` com `req.user.id`.
4. **Logout**: Invalida o refresh token no banco.

## Instruções de Segurança (Detalhamento)

### Validação de Input
- Usar **Zod** schemas em cada rota.
- Exemplo de schema para registro:
  ```ts
  z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    name: z.string().min(2).max(100),
    role: z.enum(['ARTIST', 'CLIENT'])
  })
  ```

### Proteção contra Enumeração de Usuários
- Mensagens de erro de login e recuperação de senha são idênticas, independentemente de o e‑mail existir ou não.
- Tempo de resposta artificialmente equalizado (usar `setTimeout` consistente).

### Rate Limiting
- Biblioteca `express-rate-limit`.
- Configuração:
  - Global: 100 req / 15 min por IP.
  - Rotas sensíveis (`/auth/login`, `/auth/register`): 5 req / 15 min por IP.

### Headers de Segurança
- Usar `helmet` middleware.
- Configurar CSP para permitir apenas fontes e scripts necessários (futuro frontend React).

### Tratamento de Erros
- Nunca expor stack traces em produção.
- Retornar erros padronizados:
  ```json
  { "error": "Mensagem amigável", "code": "RESOURCE_NOT_FOUND" }
  ```

## Diagrama de Sequência – Envio de Proposta (Exemplo)

```
Cliente -> POST /bookings (com token)
    -> Middleware Auth (valida JWT)
    -> Middleware Role ('CLIENT')
    -> Controller: BookingController.create
        -> Service: BookingService.createProposal
            -> Verifica disponibilidade (CalendarService)
            -> Calcula taxas (LogisticsService)
            -> Prisma: create booking
            -> Enfileira email (NotificationService)
        <- Retorna 201 com booking
    <-
<-
```

## Decisões sobre o Módulo de Logística
- A distância será calculada usando a **API de Geocoding do Google** (ou OpenStreetMap Nominatim) para converter endereço em coordenadas.
- Cálculo de distância: Haversine formula.
- Custo logístico: `(distancia_km * 2 (ida/volta) * 2.5) + taxa_fixa_uber_black`.
- Fallback: se geocoding falhar, usa R$ 150.

## Observabilidade
- Logs estruturados com `pino` (JSON).
- Métricas básicas: contagem de bookings criados, taxa de aprovação.
- Healthcheck endpoint: `/health`.

---
**Fim dos Artefatos da Fase 1.**
```

---

## Próximos Passos

Os artefatos acima constituem a especificação completa e aprovada. Conforme o processo Akita+SDD, **esta sessão se encerra aqui**. A implementação deve ocorrer em uma **nova janela/sessão limpa**, alimentada apenas com esses documentos.

Para prosseguir, utilize o comando `/test` (ou simplesmente peça "Iniciar Fase 2") na nova conversa, onde gerarei os testes automatizados e o backlog de tarefas (`TASKS.md`).


TODOS DESIGNS ESTA NA PASTA STITCH dentro de suas respectivas pastas. designe e codigo 