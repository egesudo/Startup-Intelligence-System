import express from 'express';
import { apiRouter } from '../src/server/api/routes';

const app = express();

// Parse JSON and form payloads with generous limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Preflight headers for seamless cross-origin / serverless access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Mount API routes at both /api and / for complete Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
