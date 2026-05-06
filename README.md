# Petlyst Web

[![CI](https://github.com/PetlystHQ/Petlyst-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/PetlystHQ/Petlyst-Web/actions/workflows/ci.yml)

Web platform for Petlyst — a system connecting pet owners, veterinarians, and clinics. Includes appointment booking, clinic management, hospitalization tracking, inventory, medical examinations, and reviews.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite, Redux Toolkit, Tailwind CSS, Axios
- **Backend:** Node.js + Express, PostgreSQL (`pg`), JWT auth, AWS S3 (image storage), Nodemailer (SMTP)
- **Other:** AES-256-CBC encryption for sensitive fields (e.g. TC identity numbers), Expo push notifications

## Repository Layout

```
backend/petlyst-webapp-backend/   Express API server
frontend/petlyst-webapp-frontend/ React + Vite client
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- An AWS S3 bucket (for image uploads)
- A Google Maps Platform API key
- (Optional) An SMTP account for password-reset / verification emails

### 1. Clone

```bash
git clone https://github.com/<your-account>/Petlyst-Web.git
cd Petlyst-Web
```

### 2. Backend setup

```bash
cd backend/petlyst-webapp-backend
cp .env.example .env
# Fill in real values in .env (DB credentials, JWT_SECRET, ENCRYPTION_KEY, AWS, SMTP, etc.)
npm install
npm start
```

The API listens on `http://localhost:3000` by default.

> **ENCRYPTION_KEY** is required and must be exactly 32 characters (AES-256). The server will refuse to start without it.

### 3. Frontend setup

```bash
cd frontend/petlyst-webapp-frontend
cp .env.example .env
# Fill in VITE_API_URL and VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` to the backend.

### 4. Database

Schema bootstrapping is handled by the running backend (it auto-creates / migrates several columns on startup). For new installs you will need to create the database manually and run any migrations under `backend/petlyst-webapp-backend/scripts/`.

## Environment Variables

See [`backend/petlyst-webapp-backend/.env.example`](backend/petlyst-webapp-backend/.env.example) and [`frontend/petlyst-webapp-frontend/.env.example`](frontend/petlyst-webapp-frontend/.env.example) for the full list.

Real `.env` files are git-ignored. Never commit credentials.

## Encryption Notes

Sensitive identifiers (e.g. veterinarian TC numbers) are encrypted at rest with AES-256-CBC using `ENCRYPTION_KEY` from the environment. See [`backend/petlyst-webapp-backend/utils/encryption.js`](backend/petlyst-webapp-backend/utils/encryption.js).

If you rotate `ENCRYPTION_KEY`, existing ciphertexts will become unreadable — re-encrypt them with the new key before swapping.

## Roadmap

Planned post-launch improvements (CI, component decomposition, API client
consolidation, logging discipline, smoke tests) are tracked in
[ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
