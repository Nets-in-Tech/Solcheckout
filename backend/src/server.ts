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

async function startServer() {
  try {
    console.log('🚀 Initializing Solana Pay Checkout Backend...');
    
    // 1. Wait for PostgreSQL
    await waitForDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Start Express HTTP server
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`✨ Server running on http://0.0.0.0:${config.port}`);
      console.log(`💳 Merchant Store: "${config.merchantName}"`);
      console.log(`🔑 Merchant Public Key: ${config.merchantWallet.toBase58()}`);
      console.log(`🌐 Solana Network: ${config.solanaNetwork} (${config.solanaRpcUrl})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

