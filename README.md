# PDF Genius 🧠📄

PDF Genius is an AI-powered PDF assistant that allows you to upload documents and ask intelligent questions about their content. It uses Google's Gemini AI to understand the context and Pinecone's vector database for ultra-fast, accurate semantic search across your documents.

Built by **Aryan Sharma**.

## 🚀 Features

- **Smart PDF Uploads:** Drag-and-drop interface for uploading PDFs up to 10MB.
- **AI-Powered Chat:** Ask questions in natural language and get precise answers based on your documents.
- **Source Citations:** Every answer includes exact references and page numbers from your original PDF.
- **Secure Authentication:** Easy and secure Google OAuth integration.
- **Modern UI:** A beautiful, responsive interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, Passport.js (Google OAuth)
- **AI & Vector DB:** Google Generative AI (Gemini `text-embedding-004` & `gemini-2.5-flash`), Pinecone Vector Database
- **Processing:** `pdf-parse` for text extraction and intelligent chunking
- **Hosting:** Vercel (static frontend + Express as a serverless function)

**Live site:** https://pdf-genius-theta.vercel.app

---

## 📁 Project Structure

```
pdf-genius/
├── api/
│   └── index.js              # Vercel serverless entry — re-exports the Express app
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # ChatInterface, Header, PDFUploader, icons
│   │   ├── context/          # AuthContext (session state, Google sign-in/out)
│   │   ├── pages/            # Home, Login
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js        # Dev server on :5173, proxies /api → :5001
├── server/                   # Express backend (also runs as a serverless function)
│   ├── config/passport.js    # Google OAuth strategy (registered only when env vars are set)
│   ├── lib/                  # gemini.js, pdfProcessor.js, pinecone.js
│   ├── middleware/auth.js    # JWT cookie verification
│   ├── routes/               # auth.js, upload.js, query.js, files.js
│   ├── env.js                # dotenv loader
│   └── server.js             # Express app (listens on :5001 locally; skipped on Vercel)
├── vercel.json               # Rewrites: /api/* → api/index.js, /* → client/dist/index.html
└── package.json              # Root scripts: build (client) and start (server)
```

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Aryns293/pdf-genius.git
cd pdf-genius
```

### 2. Install Dependencies
You need to install packages in both the `client` and `server` folders:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory and add the following:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Authentication
JWT_SECRET=generate_a_random_long_string_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback
```

### 4. Run the Application
Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser!

---

## 🌍 Deployment Guide (Vercel)

The entire app — frontend **and** backend — is deployed on **Vercel** as a single project. There is no separate backend host.

### How it works

`vercel.json` wires everything together:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- The root `npm run build` installs client dependencies and builds the Vite app into `client/dist` (served as static files).
- Every `/api/*` request is rewritten to `api/index.js`, which re-exports the Express app from `server/server.js` and runs it as a **serverless function**.
- All other routes fall through to `index.html` (SPA client-side routing).
- Because the API is same-origin in production, the frontend uses relative `/api/...` paths — no `VITE_API_URL` is needed.
- `server/server.js` skips `app.listen()` when `VERCEL=1`, so the same Express code works locally and on Vercel.

### Step 1: Deploy to Vercel

Via the dashboard or CLI:

```bash
npm i -g vercel
vercel link          # link to the "pdf-genius" project (first time only)
vercel --prod        # deploy to production
```

Pushes to `main` on GitHub also trigger automatic production deployments.

### Step 2: Set Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables** (Production scope). They mirror `server/.env` but with production URLs:

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://pdf-genius-theta.vercel.app` |
| `GOOGLE_CALLBACK_URL` | `https://pdf-genius-theta.vercel.app/api/auth/google/callback` |
| `GOOGLE_CLIENT_ID` | *(from Google Cloud Console)* |
| `GOOGLE_CLIENT_SECRET` | *(from Google Cloud Console — mark as Sensitive)* |
| `JWT_SECRET` | *(long random string)* |
| `GOOGLE_API_KEY` | *(Gemini API key)* |
| `PINECONE_API_KEY` | *(Pinecone API key)* |
| `PINECONE_INDEX_NAME` | *(Pinecone index name)* |

> ⚠️ Environment variable changes require a **redeploy** (`vercel --prod`) to take effect.

### Step 3: Google Cloud Console OAuth Setup

In the Google Cloud project that owns the OAuth client:

1. Go to **APIs & Services → Credentials → OAuth 2.0 Client ID**.
2. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (local dev)
   - `https://pdf-genius-theta.vercel.app` (production)
3. Under **Authorized redirect URIs**, add both callback URLs (they must match `GOOGLE_CALLBACK_URL` **exactly**, per environment):
   - `http://localhost:5173/api/auth/google/callback`
   - `https://pdf-genius-theta.vercel.app/api/auth/google/callback`
4. Save. New redirect URIs can take **5 minutes to a few hours** to propagate.

### Troubleshooting Google Login

| Symptom | Cause / Fix |
|---|---|
| `Error 400: redirect_uri_mismatch` | The `GOOGLE_CALLBACK_URL` the server sends doesn't exactly match a URI registered in Google Cloud Console — or the URI was just added and hasn't propagated yet. |
| `Internal Server Error` on callback | Usually `TokenError: The provided client secret is invalid` — check `vercel logs <deployment-url>` and re-set `GOOGLE_CLIENT_SECRET` (paste carefully; avoid trailing newlines: `printf '%s' "$SECRET" \| vercel env add GOOGLE_CLIENT_SECRET production`). |
| `Google OAuth is not configured on the server` | One of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_CALLBACK_URL` is missing in Vercel env vars. |

### Note on CORS

In `server/server.js`, CORS is locked to `CLIENT_URL` with credentials enabled (needed for the httpOnly JWT cookie):

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL, // http://localhost:5173 locally, https://pdf-genius-theta.vercel.app in prod
  credentials: true
}));
```

---

## 👤 Developer

**Aryan Sharma**

- **GitHub:** [github.com/Aryns293](https://github.com/Aryns293) · **Repository:** [Aryns293/pdf-genius](https://github.com/Aryns293/pdf-genius)
- **LinkedIn:** [linkedin.com/in/aryan-sharma-b88354287](https://www.linkedin.com/in/aryan-sharma-b88354287/)
