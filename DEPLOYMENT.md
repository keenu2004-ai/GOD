# Production Deployment Guide: Theiakshi Enterprises HRMS

This guide outlines the deployment workflow for **Theiakshi Enterprises** on **Render** (Monolithic Express API + Vite SPA Frontend) connected to a **Neon PostgreSQL** database, along with mobile app integration.

---

## Target Architecture Overview

```text
GitHub Repository
       │
       ▼
 ┌───────────┐
 │  Render   │ ◄─── Browser (Single Origin: https://theiakshi-enterprise.onrender.com)
 │ Web       │ ◄─── Mobile App (HTTPS REST: https://theiakshi-enterprise.onrender.com/api/v1)
 │ Service   │
 └─────┬─────┘
       │ DATABASE_URL
       ▼
 ┌───────────┐
 │   Neon    │
 │PostgreSQL │
 └───────────┘
```

---

## Step-by-Step Deployment Instructions

### STEP 1: Create GitHub Repository & Push Code
1. Initialize Git and commit all project files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Production-ready Theiakshi Enterprises HRMS"
   ```
2. Create a new GitHub repository named `theiakshi-enterprise` and push:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/theiakshi-enterprise.git
   git branch -M main
   git push -u origin main
   ```

---

### STEP 2: Provision Neon PostgreSQL Database
1. Sign up / Log in to [Neon Console](https://console.neon.tech).
2. Create a new Project named `theiakshi-enterprise-db`.
3. In the Neon Dashboard, copy the connection string:
   `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`

---

### STEP 3: Deploy on Render via Blueprint
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your `theiakshi-enterprise` GitHub repository.
4. Render will automatically detect `render.yaml`.
5. Provide the required production environment variables:
   - `DATABASE_URL`: Your Neon connection string.
   - `JWT_SECRET`: A long random secret string (e.g. `openssl rand -hex 32`).
   - `JWT_REFRESH_SECRET`: A long random refresh secret string.
   - `CORS_ORIGIN`: `https://theiakshi-enterprise.onrender.com`
6. Click **Apply**. Render will automatically run:
   - `buildCommand`: `npm install && npm run build`
   - `startCommand`: `npm start`

---

### STEP 4: Verify Deployment & Health Check
1. Open the health check URL:
   `https://theiakshi-enterprise.onrender.com/api/health`
2. Verify the JSON response:
   ```json
   {
     "success": true,
     "service": "THEIAKSHI ENTERPRISE",
     "status": "healthy",
     "database": "connected",
     "timestamp": "2026-08-09T14:45:00.000Z"
   }
   ```
3. Open `https://theiakshi-enterprise.onrender.com/` in your browser.
4. Log in using seed credentials:
   - **Admin**: `admin@enterprise.com` / `admin123`
   - **HR Manager**: `hr@enterprise.com` / `hr123`
   - **Department Head**: `dept@enterprise.com` / `dept123`
   - **Employee**: `aarav.sharma@enterprise.com` / `password123`

---

### STEP 5: Mobile App Integration
1. Navigate to the `MOBILE/` directory.
2. Install Expo CLI dependencies:
   ```bash
   cd MOBILE
   npm install
   ```
3. Update `MOBILE/src/utils/apiConfig.ts` with your production Render URL:
   `const PRODUCTION_API_URL = 'https://theiakshi-enterprise.onrender.com/api/v1';`
4. Run locally on Expo Go / Emulator:
   ```bash
   npx expo start
   ```
