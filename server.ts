import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api/routes';

const app = express();
const PORT = 3000;

// Body parser middleware with generous size limit for analysis payloads and reports
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes at both /api and root level for maximum hosting compatibility (Vercel Serverless & Express container)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Initialize server based on runtime environment (Cloud Run / Local Dev / Vercel)
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);

  if (!isProduction && !isVercel) {
    // Development mode: mount Vite middleware for instant HMR and client assets
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Vite Middleware] Could not attach Vite dev server middleware:', err);
    }
  } else if (!isVercel) {
    // Production container mode (Cloud Run / Docker): serve compiled static bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only bind port if not running in a serverless environment like Vercel
  if (!isVercel) {
    const bindPort = Number(process.env.PORT) || PORT;
    app.listen(bindPort, '0.0.0.0', () => {
      console.log(`[Startup Intelligence] Server running on http://0.0.0.0:${bindPort} (env: ${process.env.NODE_ENV || 'development'})`);
    });
  }
}

startServer().catch((err) => {
  console.error('[Startup Intelligence] Failed to initialize server:', err);
});

export default app;
