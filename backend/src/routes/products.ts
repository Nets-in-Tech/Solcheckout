import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { getCached, setCached } from '../redis.js';

export const productsRouter = Router();

// GET /api/products - List all products with Redis caching
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const cacheKey = category ? `products:cat:${category}` : 'products:all';

    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, source: 'cache' });
    }

    let sql = 'SELECT * FROM products';
    const params: any[] = [];

    if (category && category !== 'All') {
      sql += ' WHERE category = $1';
      params.push(category);
    }

    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    await setCached(cacheKey, result.rows, 300); // 5 minutes TTL

    return res.json({ success: true, data: result.rows, source: 'database' });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ success: false, error: 'Internal server error fetching products' });
  }
});

// GET /api/products/:id - Get single product
productsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, source: 'cache' });
    }

    const isNumeric = /^\d+$/.test(id);
    const sql = isNumeric
      ? 'SELECT * FROM products WHERE id = $1'
      : 'SELECT * FROM products WHERE slug = $1';

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await setCached(cacheKey, result.rows[0], 600);

    return res.json({ success: true, data: result.rows[0], source: 'database' });
  } catch (err: any) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

