import express, { Request, Response } from 'express';
import { apiRouter } from './src/server/api/routes';

const app = express();

// Body parser middleware
app.use(express.json());

// API Rotaları
app.use('/api', apiRouter);

// Yerel geliştirme (Localhost) ortamı için
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
