# GuardianAlert 🛡️

> A PWA safety platform for women — panic button, GPS, audio recording as legal evidence, and emergency SMS. Built to save lives.

[![Live App](https://img.shields.io/badge/Live%20App-guardianAlert-red?style=for-the-badge)](https://jiyusuhqoyiic.mocha.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)

---

## The Problem

Femicide is a critical public safety issue in Brazil and across Latin America. In emergency situations, victims often cannot call for help without alerting the aggressor. Existing solutions are too slow, require unlocking a phone, or leave no evidence.

GuardianAlert solves this with a single tap — or a phone shake.

---

## Live Demo

🔗 **[https://jiyusuhqoyiic.mocha.app](https://guardianalert.pro/)**

The app is fully functional and installable as a PWA on Android and iOS.

> **Disguise Mode:** The app can appear as a calculator. Type `911=` to unlock the real interface.

---

## Key Features

### 🚨 Emergency Core
- **Panic Button** — large, pulsing, one-tap activation
- **Cancelable Countdown** — 3/5/10 seconds before sending (prevents accidental triggers)
- **Real-time GPS** — captures coordinates automatically on alert
- **Audio Recording** — 30-second background recording uploaded as legal evidence to Cloudflare R2
- **SMS via Twilio** — instant message to emergency contacts with name, age, notes, and Google Maps link

### 🕵️ Disguise Mode
- App appears as a fully functional calculator
- Type `911=` to unlock GuardianAlert
- Metadata (title, icon) also masked as "Calculator"
- Configurable via settings

### 🗺️ Safe Places Map
- 78 pre-registered locations across 10 Brazilian capitals
- Types: DEAM, Police, Hospital, Shelter, NGO, Pharmacy
- Filter by type, toggle list/map view
- Distance calculation from user's location
- "Get Directions" button opens Google Maps

### 👥 Contact Management
- Full CRUD for emergency contacts
- Mark priority contact (notified first)
- Relationship field (friend, family, etc.)

### 📊 Alert History
- Complete history with audio player
- Status tracking: Pending → Active → In Progress → Resolved
- 30-second auto-refresh + manual refresh

---

## Security Architecture

This app handles sensitive data for vulnerable users. Security was treated as a first-class concern, not an afterthought.

| Layer | Implementation |
|-------|----------------|
| Auth tokens | httpOnly cookies (XSS protection) |
| Access token | 15-minute expiry |
| Refresh token | 7-day rotation |
| CSRF | Token in cookie + header validation |
| Passwords | bcrypt (cost 12) |
| 2FA | TOTP via speakeasy + QR code |
| Rate limiting (admin) | 5 attempts / 15 minutes |
| Rate limiting (public) | 5 alerts/min, 30 req/min per IP |
| Anti-bot | Honeypot + timing check + user-agent validation |
| Password policy | 12+ chars with complexity rules |
| Security headers | Strict CSP (no unsafe-eval in prod), HSTS preload, X-Frame-Options |
| Audit logs | Severity levels, geolocation, JSON metadata |

---

## Admin Panel (Municipal)

Designed for city-level deployment — secretarias de segurança pública, NGOs, or municipal operators.

- **Alert Center** — real-time list with 30s auto-refresh, filter by status, assign operators
- **Status Workflow** — Pending → In Progress → Resolved
- **Audio Player** — listen to emergency recordings directly in dashboard
- **Analytics** — KPIs, 7-day trend chart, status distribution, per-municipality rankings, operator performance
- **MFA Setup** — 2FA with TOTP for admin accounts
- **Full Audit Logs** — every admin action logged with severity, IP, metadata

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Cloudflare Workers (edge, serverless) |
| Database | Cloudflare D1 (SQLite at the edge) |
| Storage | Cloudflare R2 (audio recordings) |
| SMS | Twilio |
| Maps | Leaflet + OpenStreetMap |
| Auth | JWT (httpOnly) + CSRF + bcrypt + TOTP |
| PWA | Service Worker + Web App Manifest |

---

## Scalability Analysis

| Scenario | Users | Alerts/month | Cost/month |
|----------|-------|--------------|------------|
| MVP / Pilot | 1,000 | 200 | ~$20 |
| Regional | 10,000 | 2,000 | ~$170 |
| State-level | 100,000 | 20,000 | ~$1,500 |
| National | 1,000,000 | 200,000 | ~$9,000 |

Current infrastructure handles up to ~10,000 users with zero infrastructure changes. Scaling beyond that requires Twilio volume negotiation, audio compression (WAV → Opus), and geographic read replicas for D1.

---

## Architecture

```
src/
├── react-app/
│   ├── components/
│   │   ├── Calculator.tsx        # Disguise mode UI
│   │   ├── PanicButton.tsx       # Core emergency trigger
│   │   ├── LocationDisplay.tsx   # GPS display
│   │   └── ProtectedAdminRoute.tsx
│   ├── hooks/
│   │   ├── useAudioRecorder.tsx  # Background audio capture
│   │   ├── useDisguiseMode.tsx   # Calculator mode logic
│   │   └── useSettings.tsx
│   └── pages/
│       ├── admin/                # Municipal dashboard
│       ├── Home.tsx              # Panic button screen
│       ├── SafePlaces.tsx        # Map + filters
│       └── History.tsx           # Alert log
├── worker/
│   ├── index.ts                  # Main API router
│   ├── admin.ts                  # Admin routes
│   ├── auth.ts                   # JWT middleware
│   ├── mfa.ts                    # TOTP routes
│   └── profile.ts
└── public/
    ├── manifest.json             # PWA manifest
    └── sw.js                     # Service Worker
```

---

## API Endpoints

<details>
<summary>View all endpoints</summary>

**Contacts**
- `GET /api/contacts`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

**Alerts**
- `POST /api/alerts` — trigger emergency
- `GET /api/alerts` — history
- `PATCH /api/alerts/:id` — attach audio

**Audio**
- `POST /api/audio/upload`
- `GET /api/audio/:alertId`

**Safe Places**
- `GET /api/safe-places`
- `POST /api/safe-places`

**Admin — Auth**
- `POST /api/admin/auth/setup`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

**Admin — Alerts**
- `GET /api/admin/alerts`
- `POST /api/admin/alerts/:id/assign`
- `POST /api/admin/alerts/:id/status`

**Admin — Metrics**
- `GET /api/admin/metrics`

**MFA**
- `POST /api/mfa/setup`
- `POST /api/mfa/verify`
- `POST /api/mfa/disable`
- `GET /api/mfa/status`

</details>

---

## Roadmap

**High Priority**
- [ ] Municipality CRUD for multi-tenant admin management
- [ ] Shake-to-activate emergency trigger

**Medium Priority**
- [ ] User-suggested safe places
- [ ] Advanced filters (CEP, radius)

**Future**
- [ ] P2P alerts to nearby users
- [ ] Incident heat maps
- [ ] Native app (Android/iOS via Capacitor)
- [ ] Direct integration with emergency services (190)

---

## Database Schema

| Table | Description |
|-------|-------------|
| `emergency_contacts` | User's trusted contacts |
| `alerts` | Emergency events |
| `alert_notifications` | SMS delivery log |
| `safe_places` | Support locations |
| `user_profile` | Name, age, notes |
| `municipalities` | Admin-managed municipalities |
| `admin_users` | Municipal operators |
| `audit_logs` | Admin action trail |
| `login_attempts` | Rate limiting data |

---

## Environment Variables

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
JWT_SECRET=
```

---

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Windows:
```powershell
npm install
copy .env.example .env
npm run dev
```

---

## Why This Exists

Brazil registered over 1,400 femicide cases in 2023. Most victims cannot safely call for help. This app was built to give women a tool that works in silence, leaves legal evidence, and gets help moving in under 10 seconds.

It is currently in testing with real users. Municipal partnerships and NGO pilots are the next step.

---

## Contact

For partnerships with public security agencies, NGOs, or municipal governments — open an issue or reach out directly.
