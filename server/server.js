import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import seedRoute from './routes/seed.js';
import expandRoute from './routes/expand.js';
import diagnoseRoute from './routes/diagnose.js';

const app = express();
app.use(express.json({ limit: '256kb' }));

app.post('/api/tree/seed', seedRoute);
app.post('/api/tree/expand', expandRoute);
app.post('/api/node/diagnose', diagnoseRoute);

const here = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(here, '..', 'flourish')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`flourish → http://localhost:${port}`);
});
