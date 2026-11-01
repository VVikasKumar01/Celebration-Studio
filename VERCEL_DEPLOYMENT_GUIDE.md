# Deploying EventOS AI to Vercel

This project is fully configured for continuous deployment on **Vercel** with a Vite + React frontend and serverless Express API endpoints.

---

## 🚀 Quick Deployment Options

### Option 1: Deploy via GitHub / GitLab / Bitbucket (Recommended)

1. **Push your repository** to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and log in.
3. **Import** your repository.
4. Vercel will automatically detect the configuration from `vercel.json`:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Configure Environment Variables**:
   - Add `GEMINI_API_KEY`: Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
6. Click **Deploy**.

---

### Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI globally (or run with `npx`):
   ```bash
   npm i -g vercel
   ```
2. Log in to your Vercel account:
   ```bash
   vercel login
   ```
3. Deploy directly from the project root:
   ```bash
   vercel
   ```
4. When prompted:
   - *Set up and deploy?* **Yes**
   - *Which scope?* Select your account/team
   - *Link to existing project?* **No**
   - *Project name?* `eventos-ai` (or your choice)
   - *Directory located?* `./`
   - *Want to modify settings?* **No** (the provided `vercel.json` configures everything)
5. Add your Gemini API Key:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   *(Select Production, Preview, and Development, then paste your API key)*
6. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Architecture on Vercel

| Component | Path | Handler | Description |
|---|---|---|---|
| **Frontend** | `/` | Static (`dist/index.html`) | React SPA bundle with route-level code splitting |
| **API Endpoints** | `/api/*` | Serverless (`api/index.ts`) | Serverless Node.js Express bridge handling AI coordination |
| **Health Check** | `/api/health` | Serverless (`server.ts`) | Verifies deployment status, uptime, and Gemini API key presence |

### Vercel Routing Configuration (`vercel.json`)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ✅ Verifying Your Deployment

Once deployed, you can verify both frontend and backend functionality:

1. **Frontend:** Visit `https://<your-project>.vercel.app/` — verify that EventOS AI loads and animations/navigation work smoothly.
2. **API Health Check:** Visit `https://<your-project>.vercel.app/api/health` in your browser.
   - Expected response:
     ```json
     {
       "status": "ok",
       "service": "EventOS AI",
       "timestamp": "2026-10-30T...",
       "geminiConfigured": true,
       "environment": "vercel-serverless"
     }
     ```
3. **AI Coordination:** Open the "AI Event Coordinator" drawer or test the "Event Setup Wizard" to test live AI responses.
