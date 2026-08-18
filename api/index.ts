import express from 'express';
import { apiRouter } from '../src/server/api/routes';

const app = express();

app.use(express.json());

app.use('/', apiRouter);

export default app;
