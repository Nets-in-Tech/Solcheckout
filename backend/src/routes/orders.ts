import { Router, Request, Response } from 'express';
import { query, pool } from '../db.js';
import { getCached, setCached, deleteCached, acquireLock, releaseLock } from '../redis.js';
import { config } from '../config.js';
import { generateReference, createSolanaPayUrl, verifyPayment, simulateDevnetPayment } from '../solana.js';
import { PublicKey } from '@solana/web3.js';

export const ordersRouter = Router();

// POST /api/orders - Create a new checkout order
ordersRouter.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { items, customerName, customerEmail, shippingAddress, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items list cannot be empty' });
    }

    await client.query('BEGIN');

    // 1. Fetch products & compute totals
    let totalUsd = 0;
    let totalSol = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR SHARE', [item.productId]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: `Product ID ${item.productId} not found` });
      }

      const product = prodRes.rows[0];
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (product.stock < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }

      const itemTotalUsd = parseFloat(product.price_usd) * qty;
      const itemTotalSol = parseFloat(product.price_sol) * qty;

      totalUsd += itemTotalUsd;
      totalSol += itemTotalSol;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPriceUsd: parseFloat(product.price_usd),
        unitPriceSol: parseFloat(product.price_sol),
      });
    }

    // Format totals with exact precision
    totalUsd = Math.round(totalUsd * 100) / 100;
    totalSol = Math.round(totalSol * 10000) / 10000;

    // 2. Generate Solana Pay reference public key
    const referenceKeypair = generateReference();
    const referencePubkey = referenceKeypair.publicKey.toBase58();

    // 3. Generate human-readable order number (e.g. ORD-68291)
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${randomSuffix}`;

    // 4. Insert order record in PostgreSQL
    const orderInsertSql = `
      INSERT INTO orders (
        order_number, status, total_usd, total_sol,
        reference_pubkey, recipient_pubkey,
        customer_email, customer_name, shipping_address, metadata
      )
      VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const orderRes = await client.query(orderInsertSql, [
      orderNumber,
      totalUsd,
      totalSol,
      referencePubkey,
      config.merchantWallet.toBase58(),
      customerEmail || null,
      customerName || 'Boutique Guest',
      shippingAddress ? JSON.stringify(shippingAddress) : null,
      notes ? JSON.stringify({ notes }) : null,
    ]);

    const createdOrder = orderRes.rows[0];

    // 5. Insert order items
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_usd, unit_price_sol)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [createdOrder.id, vItem.productId, vItem.productName, vItem.quantity, vItem.unitPriceUsd, vItem.unitPriceSol]
      );
    }

    await client.query('COMMIT');

    // 6. Generate the official Solana Pay transfer URL
    const solanaPayUrl = createSolanaPayUrl({
      recipient: config.merchantWallet,
      amountSol: totalSol,
      reference: referenceKeypair.publicKey,
      label: config.merchantName,
      message: `${config.merchantName} - ${orderNumber}`,
      memo: `${orderNumber}`,
    });

    // 7. Cache in Redis for ultra-fast session lookup
    const sessionData = {
      orderId: createdOrder.id,
      orderNumber,
      status: 'pending',
      totalSol,
      totalUsd,
      reference: referencePubkey,
      recipient: config.merchantWallet.toBase58(),
      solanaPayUrl,
      items: validatedItems,
      createdAt: createdOrder.created_at,
    };

    await setCached(`order:session:${createdOrder.id}`, sessionData, 1800); // 30 mins
    await setCached(`order:ref:${referencePubkey}`, createdOrder.id, 1800);

    return res.status(201).json({
      success: true,
      data: {
        order: createdOrder,
        items: validatedItems,
        reference: referencePubkey,
        recipient: config.merchantWallet.toBase58(),
        solanaPayUrl,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error creating checkout order' });
  } finally {
    client.release();
  }
});

// GET /api/orders/:id - Get order details and current status
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fast path: Redis cache
    const cached = await getCached<any>(`order:session:${id}`);
    if (cached && cached.status === 'confirmed') {
      return res.json({ success: true, data: cached });
    }

    const orderRes = await query(
      `SELECT o.*,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', oi.product_name,
            'quantity', oi.quantity,
            'unitPriceUsd', oi.unit_price_usd,
            'unitPriceSol', oi.unit_price_sol
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id::text = $1 OR o.order_number = $1
       GROUP BY o.id`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderRes.rows[0];
    return res.json({ success: true, data: order });
  } catch (err: any) {
    console.error('Error fetching order:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/orders/:id/verify - Verify on-chain payment for an order
ordersRouter.get('/:id/verify', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Fetch current order
    const orderRes = await query('SELECT * FROM orders WHERE id::text = $1 OR order_number = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Already confirmed? Return immediately
    if (order.status === 'confirmed') {
      return res.json({
        success: true,
        confirmed: true,
        order,
        signature: order.signature,
      });
    }

    // Acquire Redis lock to avoid duplicate settlement processing
    const hasLock = await acquireLock(`verify:${order.id}`, 8);
    if (!hasLock) {
      return res.json({
        success: true,
        confirmed: false,
        pending: true,
        message: 'Verification in progress...',
      });
    }

    try {
      // 2. Perform on-chain payment verification using Solana Pay & Devnet RPC
      const verification = await verifyPayment(
        order.reference_pubkey,
        order.recipient_pubkey,
        order.total_sol
      );

      if (verification.verified && verification.signature) {
        // 3. Atomically update order to confirmed in PostgreSQL
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const updateRes = await client.query(
            `UPDATE orders
             SET status = 'confirmed',
                 signature = $1,
                 payer_pubkey = $2,
                 confirmed_at = NOW()
             WHERE id = $3 AND status = 'pending'
             RETURNING *`,
            [verification.signature, verification.payer || null, order.id]
          );

          if (updateRes.rows.length > 0) {
            // Deduct stock for purchased items
            const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
            for (const item of itemsRes.rows) {
              await client.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [
                item.quantity,
                item.product_id,
              ]);
            }

            await client.query('COMMIT');

            // Invalidate products cache
            await deleteCached('products:all');

            const updatedOrder = updateRes.rows[0];

            // Update Redis session cache
            await setCached(`order:session:${order.id}`, {
              ...order,
              status: 'confirmed',
              signature: verification.signature,
              confirmedAt: updatedOrder.confirmed_at,
            }, 3600);

            return res.json({
              success: true,
              confirmed: true,
              order: updatedOrder,
              signature: verification.signature,
            });
          } else {
            await client.query('ROLLBACK');
          }
        } catch (dbErr) {
          await client.query('ROLLBACK');
          throw dbErr;
        } finally {
          client.release();
        }
      }

      return res.json({
        success: true,
        confirmed: false,
        reason: verification.reason || 'Payment transaction not yet confirmed on Solana',
      });
    } finally {
      await releaseLock(`verify:${order.id}`);
    }
  } catch (err: any) {
    console.error('Error verifying order:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error verifying order' });
  }
});

// POST /api/orders/:id/test-pay - Simulate a real Devnet payment transaction
// Allows testing the end-to-end flow with actual on-chain confirmation immediately!
ordersRouter.post('/:id/test-pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRes = await query('SELECT * FROM orders WHERE id::text = $1 OR order_number = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderRes.rows[0];
    if (order.status === 'confirmed') {
      return res.json({ success: true, message: 'Order is already confirmed', signature: order.signature });
    }

    console.log(`🚀 Simulating real Devnet payment for order ${order.order_number} (${order.total_sol} SOL)...`);

    const result = await simulateDevnetPayment({
      recipient: new PublicKey(order.recipient_pubkey),
      amountSol: parseFloat(order.total_sol),
      reference: new PublicKey(order.reference_pubkey),
      memoText: `${order.order_number}`,
    });

    console.log(`✅ Test payment broadcasted successfully! Tx: ${result.signature}`);

    // Update order in Postgres
    await query(
      `UPDATE orders
       SET status = 'confirmed',
           signature = $1,
           payer_pubkey = $2,
           confirmed_at = NOW()
       WHERE id = $3`,
      [result.signature, result.payer, order.id]
    );

    // Deduct stock
    const itemsRes = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
    for (const item of itemsRes.rows) {
      await query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [
        item.quantity,
        item.product_id,
      ]);
    }
    await deleteCached('products:all');

    return res.json({
      success: true,
      message: 'Devnet transaction simulated & verified successfully',
      signature: result.signature,
      payer: result.payer,
    });
  } catch (err: any) {
    console.error('Error in test-pay simulation:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to simulate devnet payment',
    });
  }
});

// GET /api/orders - List latest orders for merchant portal
ordersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 50);

    const result = await query(
      `SELECT o.*,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', oi.product_name,
            'quantity', oi.quantity,
            'unitPriceUsd', oi.unit_price_usd,
            'unitPriceSol', oi.unit_price_sol
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error('Error listing orders:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

