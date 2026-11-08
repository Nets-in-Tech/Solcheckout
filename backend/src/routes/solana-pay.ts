import { Router, Request, Response } from 'express';
import { query, pool } from '../db.js';
import { inMemoryOrders } from './orders.js';
import { config } from '../config.js';
import { buildSolanaPayTransaction } from '../solana.js';
import { PublicKey } from '@solana/web3.js';

export const solanaPayRouter = Router();

/**
 * Solana Pay Transaction Request Specification
 * Specification reference: https://github.com/solana-labs/solana-pay/blob/master/SPEC.md
 *
 * 1. GET /api/solana-pay/tx
 * Returns merchant branding (label and icon)
 */
solanaPayRouter.get('/tx', (req: Request, res: Response) => {
  return res.json({
    label: config.merchantName,
    icon: config.merchantIcon,
  });
});

/**
 * 2. POST /api/solana-pay/tx?orderId=...
 * Accepts buyer's account and constructs the transaction
 */
solanaPayRouter.post('/tx', async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    const orderId = req.query.orderId as string;

    if (!account) {
      return res.status(400).json({ error: 'Missing account in body' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    // Validate account public key
    try {
      new PublicKey(account);
    } catch {
      return res.status(400).json({ error: 'Invalid account public key' });
    }

    // Fetch order
    let order: any = null;
    if (pool) {
      try {
        const orderRes = await query('SELECT * FROM orders WHERE id::text = $1 OR order_number = $1', [orderId]);
        if (orderRes.rows.length > 0) {
          order = orderRes.rows[0];
        }
      } catch {}
    }

    if (!order) {
      order = inMemoryOrders.get(orderId);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'confirmed') {
      return res.status(400).json({ error: 'Order already paid and confirmed' });
    }

    // Build the Solana Pay compliant transaction
    const tx = await buildSolanaPayTransaction({
      account,
      recipient: new PublicKey(order.recipient_pubkey),
      amountSol: parseFloat(order.total_sol),
      reference: new PublicKey(order.reference_pubkey),
      memoText: `Order ${order.order_number} - ${config.merchantName}`,
    });

    // Serialize transaction without signatures for client wallet signing
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const base64Tx = serialized.toString('base64');

    return res.json({
      transaction: base64Tx,
      message: `Complete payment of ${order.total_sol} SOL for ${order.order_number}`,
    });
  } catch (err: any) {
    console.error('Error generating transaction request:', err);
    return res.status(500).json({ error: err.message || 'Internal error building transaction' });
  }
});

