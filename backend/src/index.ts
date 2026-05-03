import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import identifyRoute from './routes/identify.js';
import diagnoseRoute from './routes/diagnose.js';
import feedbackRoute from './routes/feedback.js';
import plantsRoute from './routes/plants.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  const provider =
    explicit === 'gemini' || explicit === 'anthropic' || explicit === 'mock'
      ? explicit
      : process.env.USE_MOCK_AI === 'true'
      ? 'mock'
      : process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'mock';
  res.json({
    ok: true,
    aiProvider: provider,
    timestamp: new Date().toISOString(),
  });
});

app.use('/identify', identifyRoute);
app.use('/diagnose', diagnoseRoute);
app.use('/feedback', feedbackRoute);
app.use('/plants', plantsRoute);

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`PlantCare AI backend listening on :${PORT}`);
});

export default app;
