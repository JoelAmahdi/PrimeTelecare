# Prime Telecare — Complete Telehealth & Clinical Care Platform

> An enterprise-grade, offline-resilient telehealth platform compliant with Nigeria Data Protection Act (NDPA 2023), MDCN Telemedicine Guidelines, and HIPAA data standards.

---

## 🚀 Key Clinical & Architectural Capabilities

- **Fluid Multi-Breakpoint Responsive UI**: Natively adapts across 1920×1080 Full Desktop, 1440×900 Laptop, 1024×768 Tablet, and 393×852 Mobile without layout compression.
- **Encrypted HD WebRTC Video & Audio Consultation**: Real camera/mic streaming, Web Audio procedural call tones, simulated clinical ECG vitals, low-bandwidth audio fallback, and in-call document exchange.
- **Multi-Channel Payment Gateway**: Debit/Credit Card with 3D-Secure OTP challenge, Dedicated Virtual NUBAN Bank Transfer (Wema/Paystack), and Prime Wallet debits.
- **Tamper-Evident Electronic Prescribing**: SHA-256 HMAC cryptographic MDCN digital sealing, real-time penicillin & drug cross-allergy contraindication blocking, and instant QR verification.
- **Emergency Vitals Triage Engine**: Clinical rule-based & AI-assisted red-flag evaluation (diverting acute chest pain or SpO2 < 92% to physical ERs with 112 guidance).
- **NDPA Statutory Access Audit Vault**: Immutable logging of every clinical record query with accessor role, timestamp, IP, and legal care purpose.
- **IndexedDB Offline Resilience**: Local offline data caching with sync status banners for unstable connectivity.
- **Biometric Security**: WebAuthn biometric unlock (Face ID / Touch ID / Windows Hello).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Data & Storage**: Persistent JSON store, IndexedDB client-side cache, optional Firestore sync.
- **Containerization**: Multi-stage Docker (`node:20-alpine`).

---

## 📦 Local Development & Verification

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy the example environment file and configure keys:
```bash
cp .env.example .env
```

### 3. Run Development Servers
- **Full-Stack Server (API + Frontend on port 5000)**:
  ```bash
  npm start
  ```
- **Vite Hot-Reload Server (port 3000)**:
  ```bash
  npm run dev
  ```

### 4. Run Automated Test Suites
- **Backend API Suite (14 endpoints)**:
  ```bash
  npm run test:api
  ```
- **Clinical E2E Journey Suite (17 steps)**:
  ```bash
  npm run test:e2e
  ```
- **Production Build Check**:
  ```bash
  npm run build
  ```

---

## ☁️ Production Deployment Guide

### Option A: Google Cloud Run (Serverless Container) — Recommended

Prime Telecare includes a pre-configured multi-stage [`Dockerfile`](./Dockerfile) and [`cloudbuild.yaml`](./cloudbuild.yaml).

1. **Install Google Cloud SDK & Login**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
2. **Build and Deploy with Cloud Build**:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```
   *Or deploy directly with a single command:*
   ```bash
   gcloud run deploy prime-telecare \
     --source . \
     --region europe-west1 \
     --platform managed \
     --allow-unauthenticated \
     --port 5000 \
     --set-env-vars NODE_ENV=production
   ```
3. **Map Custom Domain**:
   In Google Cloud Console: `Cloud Run > prime-telecare > Manage Custom Domains` to bind `app.primetelecare.com`.

---

### Option B: Render (Automated 1-Click Git Deployment)

Prime Telecare includes [`render.yaml`](./render.yaml).

1. Push your repository to **GitHub**.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New > Blueprint** and select your repository.
4. Render will automatically detect `render.yaml`, run `npm install && npm run build`, and launch `npm start`.
5. Add your live `GEMINI_API_KEY` and `PAYSTACK_SECRET_KEY` in the Environment Variables tab.

---

### Option C: Railway or Fly.io

1. **Railway**:
   - Run `railway init` or connect your GitHub repo via [railway.app](https://railway.app).
   - Railway will build using the multi-stage [`Dockerfile`](./Dockerfile) and expose port `5000`.
2. **Fly.io**:
   ```bash
   fly launch
   fly deploy
   ```

---

### Option D: Self-Hosted Ubuntu VPS with Docker Compose

Prime Telecare includes a production [`docker-compose.yml`](./docker-compose.yml).

1. Clone repository to your server:
   ```bash
   git clone <YOUR_GIT_REPO_URL> /opt/prime-telecare
   cd /opt/prime-telecare
   ```
2. Create production `.env`:
   ```bash
   cp .env.example .env
   # Edit with production credentials:
   nano .env
   ```
3. Start the container in background:
   ```bash
   docker compose up -d --build
   ```
4. Verify health status:
   ```bash
   curl -I http://localhost:5000/api/health
   ```
5. *(Optional)* Configure Caddy or Nginx for SSL reverse proxy.

---

## 🔒 Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port for server binding | `5000` (default) or `8080` |
| `NODE_ENV` | Runtime environment | `production` |
| `APP_URL` | Canonical public application URL | `https://app.primetelecare.com` |
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash API Key | `AIzaSy...` |
| `JWT_SECRET` | Cryptographic secret for session tokens | `32-character random string` |
| `HMAC_PRESCRIPTION_SECRET` | Secret key for MDCN digital signature seal | `32-character random string` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key for card tokenize | `pk_live_...` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for transaction verification | `sk_live_...` |
| `TERMII_API_KEY` | Termii SMS gateway API key | `TM_...` |

---

## 📄 License & Regulatory Standards
- Compliance: Nigeria Data Protection Act (NDPA 2023), MDCN Telemedicine Regulations.
- Architecture: HIPAA-EHR audit ready, TLS 1.3 enforced.
