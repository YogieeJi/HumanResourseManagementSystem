# 🚀 Free Deployment Guide — City Hospital HRMS

Get a public link in ~10 minutes. Zero cost. No credit card.

---

## What you'll use
| Service | Purpose | URL |
|---------|---------|-----|
| **GitHub** | Store the code | github.com |
| **Render** | Host the backend (Node.js API) | render.com |
| **Vercel** | Host the frontend (React app) | vercel.com |

---

## Step 1 — Push code to GitHub

1. Go to **github.com** → sign in → click **New repository**
2. Name it `hrms-hospital`, keep it **Public**, click **Create**
3. On your computer, open Terminal / Command Prompt:

```bash
# Inside the hrms-deploy folder:
git init
git add .
git commit -m "City Hospital HRMS"
git remote add origin https://github.com/YOUR_USERNAME/hrms-hospital.git
git push -u origin main
```

> ✅ Your code is now on GitHub

---

## Step 2 — Deploy Backend on Render (free)

1. Go to **render.com** → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your `hrms-hospital` GitHub repo
4. Fill in the settings:

| Field | Value |
|-------|-------|
| **Name** | `hrms-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Under **Environment Variables**, add:
   - `JWT_SECRET` → `cityhospital_hrms_secret_2025`
   - `NODE_ENV` → `production`

6. Click **Create Web Service**

7. Wait ~2 minutes. You'll get a URL like:
   ```
   https://hrms-backend-xxxx.onrender.com
   ```
   **Copy this URL** — you need it for Step 3.

> ⚠️ Free Render services sleep after 15 min of inactivity. First visit after sleep takes ~30 seconds to wake up. Normal for a demo.

---

## Step 3 — Deploy Frontend on Vercel (free)

1. Go to **vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import `hrms-hospital`
3. Set the configuration:

| Field | Value |
|-------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:
   - `VITE_API_URL` → paste your Render URL from Step 2
     (e.g. `https://hrms-backend-xxxx.onrender.com`)

5. Click **Deploy**

6. Wait ~1 minute. You'll get a permanent public URL like:
   ```
   https://hrms-hospital.vercel.app
   ```

> ✅ **Share this Vercel URL with anyone. It works from anywhere in the world.**

---

## Step 4 — Test it

Open your Vercel URL and log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cityhospital.in` | `admin123` |
| Manager / CNO | `meena.krishnan@cityhospital.in` | `manager123` |
| Doctor | `neha.gupta@cityhospital.in` | `emp123` |

---

## Troubleshooting

**Login fails / API error:**
- Open browser DevTools → Network tab → check the failing request
- Make sure `VITE_API_URL` in Vercel has no trailing slash
- Wait 30 sec if Render is waking up (first request after idle)

**Render keeps sleeping:**
- Use **UptimeRobot** (free) to ping your Render URL every 5 minutes → keeps it awake 24/7

**Want data to persist across restarts:**
- Upgrade to Render Starter ($7/mo) for persistent disk, or migrate to PlanetScale/Supabase free DB

---

## Re-deploying updates

Any `git push` to GitHub will **auto-redeploy** both Render and Vercel.
