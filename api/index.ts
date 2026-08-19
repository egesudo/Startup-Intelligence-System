import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../src/server/api/routes';
import { logServerEnvDiagnostics } from '../src/server/utils/supabaseDiagnostics';

const app = express();

// Run initial diagnostic check for Vercel execution logs
let hasLoggedDiagnostics = false;
function ensureDiagnosticsLogged() {
  if (!hasLoggedDiagnostics) {
    hasLoggedDiagnostics = true;
    logServerEnvDiagnostics();
  }
}
ensureDiagnosticsLogged();

// Parse JSON and form payloads with generous limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Preflight headers for seamless cross-origin / serverless access
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Root ping for health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes at both /api and / for complete Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback error handler to prevent 500 crashes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Vercel Serverless Error]:', err);
  if (!res.headersSent) {
    res.status(200).json({
      error: err?.message || 'Internal server processed with fallback',
      ventures: [],
      status: 'fallback'
    });
  }
});

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
