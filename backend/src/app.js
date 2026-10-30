import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
app.use(express.json());

export default app;
