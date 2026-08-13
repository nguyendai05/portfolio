import express from 'express';
import { loadLocalEnv } from './scripts/env.mjs';
import { routeRequest } from './server/router.js';

loadLocalEnv();

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.set('trust proxy', false);
app.use(express.json({ limit: '64kb' }));
app.all('/api', (req, res) => routeRequest(req as never, res as never));
app.all('/api/*path', (req, res) => routeRequest(req as never, res as never));

app.listen(port, '127.0.0.1', () => {
  console.log(`Portfolio API adapter listening on http://127.0.0.1:${port}`);
});
