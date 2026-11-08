import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { connection } from '../solana.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const merchantRouter = Router();

// GET /api/merchant - Returns merchant wallet details, balance and store metrics
merchantRouter.get('/', async (req: Request, res: Response) => {
  try {
    let balanceSol = 0;
    try {
      const lamports = await connection.getBalance(config.merchantWallet);
      balanceSol = lamports / LAMPORTS_PER_SOL;
    } catch (e: any) {
      console.warn('Could not fetch merchant devnet balance:', e.message);
    }

    // Query metrics from PostgreSQL
    const statsRes = await query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COALESCE(SUM(total_usd) FILTER (WHERE status = 'confirmed'), 0) as total_revenue_usd,
        COALESCE(SUM(total_sol) FILTER (WHERE status = 'confirmed'), 0) as total_revenue_sol
      FROM orders
    `);

    const stats = statsRes.rows[0];

    return res.json({
      success: true,
      data: {
        merchantName: config.merchantName,
        merchantWallet: config.merchantWallet.toBase58(),
        merchantIcon: config.merchantIcon,
        network: config.solanaNetwork,
        rpcUrl: config.solanaRpcUrl,
        balanceSol,
        metrics: {
          totalOrders: parseInt(stats.total_orders, 10),
          confirmedOrders: parseInt(stats.confirmed_orders, 10),
          pendingOrders: parseInt(stats.pending_orders, 10),
          totalRevenueUsd: parseFloat(stats.total_revenue_usd),
          totalRevenueSol: parseFloat(stats.total_revenue_sol),
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching merchant details:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/merchant/airdrop - Request devnet airdrop to merchant wallet
merchantRouter.post('/airdrop', async (req: Request, res: Response) => {
  try {
    console.log(`Requesting 1 SOL airdrop for merchant wallet: ${config.merchantWallet.toBase58()}...`);
    const sig = await connection.requestAirdrop(config.merchantWallet, 1 * LAMPORTS_PER_SOL);
    const bh = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: sig,
      blockhash: bh.blockhash,
      lastValidBlockHeight: bh.lastValidBlockHeight,
    });

    const newBalance = await connection.getBalance(config.merchantWallet);

    return res.json({
      success: true,
      message: 'Airdrop successful',
      txSignature: sig,
      newBalanceSol: newBalance / LAMPORTS_PER_SOL,
    });
  } catch (err: any) {
    console.error('Airdrop failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'Devnet airdrop request failed' });
  }
});

