import express from 'express';
import path from 'path';
import { apiRouter } from './src/server/api/routes';
import { logServerEnvDiagnostics } from './src/server/utils/supabaseDiagnostics';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Preflight headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// API routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Initialize server based on runtime environment (Cloud Run / Local Dev / Vercel)
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);

  if (!isProduction && !isVercel) {
    try {
      // Dynamic import to avoid bundling vite into production serverless environments
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Vite Middleware] Could not attach Vite dev server middleware:', err);
    }
  } else if (!isVercel) {
    // Production container mode (Cloud Run): serve compiled static frontend bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind listener for local/container servers
  if (!isVercel) {
    const bindPort = Number(process.env.PORT) || PORT;
    app.listen(bindPort, '0.0.0.0', () => {
      console.log(`[Startup Intelligence] Server running on http://0.0.0.0:${bindPort} (env: ${process.env.NODE_ENV || 'development'})`);
      logServerEnvDiagnostics();
    });
  } else {
    logServerEnvDiagnostics();
  }
}

startServer().catch((err) => {
  console.error('[Startup Intelligence] Failed to initialize server:', err);
});

export default app;
