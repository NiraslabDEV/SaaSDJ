# TASKS — Pulso Musical (continuar implementação)

## STACK
- Backend: TypeScript + Express + Prisma + PostgreSQL (Railway)
- Frontend: HTML + Tailwind CDN + Vanilla JS
- Auth: JWT (access 15min + refresh 7d)
- Design: dark editorial, cor primária `#e6ff00`, fonte Manrope/Inter

---

## O QUE JÁ EXISTE (não recriar)

```
backend/
├── package.json, tsconfig.json, .env.example
├── prisma/schema.prisma          ✅
├── src/config/env.ts             ✅
├── src/lib/prisma/client.ts      ✅
├── src/lib/jwt/index.ts          ✅
├── src/lib/email/index.ts        ✅
├── src/middlewares/authenticate.ts, authorize.ts, validate.ts, errorHandler.ts ✅
├── src/modules/auth/*            ✅ (schemas, service, controller, routes)
├── src/modules/users/*           ✅
├── src/modules/bookings/*        ✅ (tem bug, ver abaixo)
├── src/modules/calendar/*        ✅
├── src/modules/logistics/logistics.service.ts ✅
├── src/modules/contracts/*       ✅
├── src/modules/payments/*        ✅
├── src/modules/notifications/*   ✅
├── src/app.ts                    ✅
└── src/server.ts                 ✅
```

---

## TAREFA 1 — CORRIGIR BUG (bookings.controller.ts)

**Arquivo:** `backend/src/modules/bookings/bookings.controller.ts`

**Problema:** O TypeScript reclama de `AuthRequest` como tipo de `req` nos handlers do Express, porque o Router do Express espera `RequestHandler` com `req: Request`, não `AuthRequest`.

**Solução:** Substituir a assinatura de cada função para usar `Request` e fazer cast interno:

```typescript
// ANTES (problemático):
export async function createBooking(req: AuthRequest, res: Response, next: NextFunction) {

// DEPOIS (correto):
export async function createBooking(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  // usar authReq.user!.id ao invés de req.user!.id
```

Aplicar essa mudança nas 5 funções: `createBooking`, `listBookings`, `getBooking`, `updateStatus`, `counterProposal`.

**Import a adicionar:** `import { Request, Response, NextFunction } from 'express';`
**Import a remover:** `AuthRequest` do import (ainda importar mas não usar na assinatura).

---

## TAREFA 2 — CRIAR FRONTEND (arquivos novos)

Todos em `backend/public/`. O Express serve estáticos da pasta `public/` (já configurado em app.ts).

### 2a. `backend/public/js/api.js`
Client HTTP que todas as páginas usam. Deve:
- Ler/escrever `localStorage` para `accessToken`, `refreshToken`, `user` (JSON)
- Ter função `apiFetch(endpoint, options)` que:
  - Adiciona `Authorization: Bearer <accessToken>` automaticamente
  - Se receber 401, tenta chamar `POST /api/auth/refresh` com `{ refreshToken }` e repete
  - Se refresh falhar, redireciona para `/login.html`
- Exportar funções como `getMe()`, `login()`, `register()`, `logout()`, `listBookings()`, `getBooking(id)`, `createBooking(data)`, `updateBookingStatus(id, status)`, `sendCounterProposal(id, data)`, `getEarnings()`, `generateContract(bookingId)`, `getNotifications()`
- Todas funções retornam `Promise` com o JSON da API

### 2b. `backend/public/login.html`
Página de login. Design igual a o arquivo teladelogin.html 
- Form: email + senha + botão "Entrar"
- Link para `/register.html`
- Ao submeter: chama `api.login()`, salva tokens no localStorage, redireciona:
  - role=ARTIST → `/dashboard.html`
  - role=CLIENT → `/index.html`
- Se já logado, redirecionar automaticamente

### 2c. `backend/public/register.html`
Página de registro. Design igual ao login.
- Form: nome + email + senha + role (select: Artista/Contratante) + botão "Criar Conta"
- Ao submeter: chama `api.register()`, salva tokens, redireciona igual ao login

### 2d. `backend/public/dashboard.html`
**Adaptar** o arquivo existente em:
`stitch (1)/stitch/painel_do_dj/code.html`

Mudanças necessárias:
1. Adicionar ao `<head>`: `<script src="/js/api.js"></script>` e `<script src="/js/dashboard.js"></script>`
2. Adicionar IDs nos elementos dinâmicos:
   - `id="earnings-amount"` no span do valor mensal (R$ 24.850)
   - `id="earnings-growth"` no span de +12%
   - `id="bookings-list"` na div que contém os 3 rows de pedidos
   - `id="upcoming-payments"` na div dos próximos pagamentos
   - `id="user-name"` no div com nome "Alex Storm"
   - `id="notifications-btn"` no ícone de notificações
3. Manter todo o HTML/CSS intacto, só adicionar IDs

### 2e. `backend/public/js/dashboard.js`
Carrega dados para o dashboard:
```javascript
// Verificar auth → redirecionar para /login.html se não logado
// Carregar em paralelo: getEarnings() + listBookings()
// Preencher #earnings-amount, #earnings-growth, #user-name
// Renderizar lista de bookings no #bookings-list (cada item: nome do evento, data, status com cor)
// Renderizar #upcoming-payments
// Status colors: APPROVED=primary, PENDING=white/50, REJECTED=error, COUNTER_PROPOSAL=secondary
```

### 2f. `backend/public/booking.html`
**Adaptar** o arquivo em:
`stitch (1)/stitch/fluxo_de_reserva/code.html`

Mudanças:
1. Adicionar scripts: `api.js` + `booking.js`
2. Adicionar IDs:
   - `id="booking-form"` no form principal
   - `id="artist-id"` input hidden (pegar da URL `?artistId=xxx`)
   - `id="location-input"` no input de endereço
   - `id="duration-select"` no select de duração
   - `id="time-input"` no input de hora
   - `id="selected-date"` input hidden para data selecionada
   - `id="total-amount"` no span do valor total
   - `id="logistics-fee"` no span da logística
   - `id="set-hours-fee"` no span das horas
   - `id="submit-btn"` no botão Enviar Proposta
   - `id="artist-name"` e `id="artist-genres"` no card do artista
   - `id="calendar-grid"` na grade do calendário

### 2g. `backend/public/js/booking.js`
```javascript
// Pegar artistId da URL: new URLSearchParams(location.search).get('artistId')
// Carregar artista via GET /api/users/artists/:id e preencher card
// Calendário: gerar dias do mês atual, ao clicar num dia salvar em #selected-date
// Ao mudar localização ou duração: recalcular total (chamar logística estimada)
//   Fórmula: baseFee=1200 + hourlyRate=300 * horas + logisticsFee=150 (fallback)
// Ao submeter: validar campos, chamar api.createBooking(), redirecionar para /dashboard.html
```

### 2h. `backend/public/booking-details.html`
**Adaptar** o arquivo em:
`stitch (1)/stitch/detalhes_da_reserva/code.html`

Mudanças:
1. Adicionar scripts
2. IDs dinâmicos:
   - `id="event-title"` no h1 do título do evento
   - `id="booking-status"` no span de status
   - `id="counter-form"` no form da contraproposta
   - `id="counter-amount"` no input do valor
   - `id="counter-hours"` no input de horas
   - `id="counter-notes"` no textarea
   - `id="btn-approve"` implícito via "Enviar Contra-proposta"
   - `id="btn-reject"` no botão Recusar
   - `id="btn-contract"` no botão Gerar PDF
   - `id="summary-date"`, `id="summary-location"`, `id="summary-status"`

### 2i. `backend/public/js/booking-details.js` (novo, não existe em stitch)
```javascript
// Pegar bookingId da URL: ?bookingId=xxx
// Carregar booking via api.getBooking(id)
// Preencher todos os campos de resumo
// Se user.role=ARTIST E status=PENDING ou COUNTER_PROPOSAL: mostrar form de contraproposta
// Botão "Enviar Contra-proposta": chama api.sendCounterProposal()
// Botão "Recusar": chama api.updateBookingStatus(id, 'REJECTED')
// Botão "Gerar PDF": chama api.generateContract(), abre URL retornada em nova aba
```

### 2j. `backend/public/profile.html`
**Adaptar** `stitch (1)/stitch/perfil_do_dj/code.html`

IDs:
- `id="profile-name"` no h2
- `id="profile-bio"` no p da biografia
- `id="profile-genres"` na div das tags
- `id="profile-bookings"` no span 124
- `id="profile-years"` no span 10

### 2k. `backend/public/js/profile.js`
```javascript
// Carregar getMe(), preencher campos
// Botão "Editar Perfil": mostrar form inline e chamar PATCH /api/users/me
```

### 2l. `backend/public/index.html`
**Adaptar** `stitch (1)/stitch/p_gina_inicial_do_cliente/code.html`

- Botão "Ver Disponibilidade" → redireciona para `/booking.html?artistId=<ID_DO_DJ_DESTA_PAGINA>`
- Botão "Sair" na nav → chama `api.logout()` e redireciona para `/login.html`
- Se não logado, mostrar botões Login/Register na nav

---

## TAREFA 3 — ARQUIVO .env (setup)

Criar `backend/.env` copiando de `.env.example` e preenchendo:
```
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars aleatorio>
JWT_REFRESH_SECRET=<32+ chars aleatorio diferente>
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
# SMTP e Google Calendar: deixar vazio por ora
```

---

## TAREFA 4 — INSTALAR E RODAR

Na pasta `backend/`:
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Acessar `http://localhost:3000/login.html`

---

## REGRAS DE DESIGN (obrigatório em todo HTML novo)

```html
<!-- Sempre incluir no <head> -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

```javascript
// Tailwind config (copiar em todo HTML):
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#f7ffba",
        "on-primary": "#5a6500",
        "primary-fixed": "#e0f800",
        "background": "#0e0e0e",
        "surface-container-low": "#131313",
        "surface-container-high": "#20201f",
        "surface-container-highest": "#262626",
        "on-surface": "#ffffff",
        "on-surface-variant": "#adaaaa",
        "error": "#ff7351",
        "secondary": "#c8d8f3",
        "secondary-container": "#38485d",
        "outline-variant": "#484847",
      }
    }
  }
}
```

- Fundo: `bg-background` (`#0e0e0e`)
- Texto principal: `text-on-surface` (branco)
- Texto secundário: `text-on-surface-variant` (`#adaaaa`)
- Acento: `text-primary` ou `bg-primary` (`#f7ffba` / `#e6ff00`)
- Cards: `bg-surface-container-low` com `rounded-2xl p-6`
- Inputs: `bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary`
- Botão primário: `bg-primary text-on-primary font-bold rounded-xl px-6 py-3`
- SEM bordas visíveis (usar diferença de background)
- Fontes: `font-family: Manrope` para títulos, `Inter` para corpo

---

## PRIORIDADE DE EXECUÇÃO
1. Subir no git o projeto. e so dar outro git ao termino de cada tarefa em numero.
1. Corrigir bookings.controller.ts (TAREFA 1)
2. Criar api.js (base de tudo)
3. Criar login.html + register.html
4. Adaptar dashboard.html + criar dashboard.js
5. Adaptar booking.html + criar booking.js
6. Adaptar booking-details.html + criar booking-details.js
7. Adaptar profile.html + criar profile.js
8. Adaptar index.html
