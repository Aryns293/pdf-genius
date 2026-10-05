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

## 🌍 Deployment Guide

To deploy this application to production, you will need to host the Frontend and Backend separately (or together on a VPS). Here is the recommended approach using **Render** for the backend and **Vercel** for the frontend.

### Step 1: Deploy the Backend (Render or Railway)
1. Push your code to GitHub.
2. Go to [Render](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the Root Directory to `server`.
5. Set the Build Command to `npm install`.
6. Set the Start Command to `npm start`.
7. Add all the Environment Variables from your `.env` file.
   - **Important:** Change `CLIENT_URL` to the URL where your frontend will be hosted (e.g., `https://pdf-genius.vercel.app`).
   - **Important:** Change `GOOGLE_CALLBACK_URL` to `https://your-backend-url.onrender.com/api/auth/google/callback`.
8. Deploy! Copy the backend URL provided by Render.

### Step 2: Update Google Cloud Console
1. Go to your Google Cloud Console where you created your OAuth credentials.
2. Under **Authorized redirect URIs**, add your new production callback URL: `https://your-backend-url.onrender.com/api/auth/google/callback`.

### Step 3: Deploy the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and create a new project.
2. Connect your GitHub repository.
3. Set the Root Directory to `client`.
4. Vercel will automatically detect that it's a Vite project.
5. **CRITICAL STEP:** Since Vercel doesn't use `vite.config.js` proxies in production, you need to point your frontend to your deployed backend. 
   - You will need to update your API calls in the frontend to point to your new backend URL instead of relative paths (`/api/...`).
   - *Tip:* You can use an environment variable in Vercel like `VITE_API_URL=https://your-backend-url.onrender.com` and prepend it to all `fetch()` requests in the frontend.
6. Deploy!

### Note on CORS
Ensure that in `server/server.js`, your CORS configuration allows requests from your Vercel frontend URL:
```javascript
app.use(cors({ 
  origin: process.env.CLIENT_URL, // e.g., https://pdf-genius.vercel.app
  credentials: true 
}));
```
