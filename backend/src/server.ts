import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { waitForDatabase } from './db.js';
import { connectRedis } from './redis.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { solanaPayRouter } from './routes/solana-pay.js';
import { merchantRouter } from './routes/merchant.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: config.solanaNetwork,
    merchantWallet: config.merchantWallet.toBase58(),
  });
});

// Root API info
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    name: config.merchantName,
    merchantWallet: config.merchantWallet.toBase58(),
  });
});

// Mount Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/solana-pay', solanaPayRouter);
app.use('/api/merchant', merchantRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server locally when not running in Vercel Serverless environment
if (process.env.VERCEL !== '1') {
  (async () => {
    try {
      if (config.databaseUrl) {
        waitForDatabase().catch((e) => console.warn('DB init notice:', e.message));
      }
      if (config.redisUrl) {
        connectRedis().catch((e) => console.warn('Redis init notice:', e.message));
      }
      app.listen(config.port, '0.0.0.0', () => {
        console.log(`✨ Server running on http://0.0.0.0:${config.port}`);
      });
    } catch (err: any) {
      console.warn('Server start notice:', err.message);
    }
  })();
}

export default app;
