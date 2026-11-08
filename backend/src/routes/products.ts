import { Router, Request, Response } from 'express';
import { query, initializeAndSeedDatabase, SEED_PRODUCTS } from '../db.js';
import { getCached, setCached } from '../redis.js';

export const productsRouter = Router();

// GET /api/products - List all products with Redis caching & guaranteed seeding
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const cacheKey = category && category !== 'All' ? `products:cat:${category}` : 'products:all';

    const cached = await getCached<any[]>(cacheKey);
    if (cached && cached.length > 0) {
      return res.json({ success: true, data: cached, source: 'cache' });
    }

    let sql = 'SELECT * FROM products';
    const params: any[] = [];

    if (category && category !== 'All') {
      sql += ' WHERE category = $1';
      params.push(category);
    }

    sql += ' ORDER BY id ASC';

    let result = await query(sql, params);

    // If database table is empty, auto-seed it immediately
    if (result.rows.length === 0) {
      console.log('Detected empty products table, seeding database now...');
      await initializeAndSeedDatabase();
      result = await query(sql, params);
    }

    // In case the DB is still initializing, provide seed items fallback with IDs
    let productsList = result.rows;
    if (productsList.length === 0) {
      productsList = SEED_PRODUCTS.map((p, idx) => ({
        id: idx + 1,
        ...p,
      }));
      if (category && category !== 'All') {
        productsList = productsList.filter((p) => p.category === category);
      }
    }

    await setCached(cacheKey, productsList, 300); // 5 minutes TTL

    return res.json({ success: true, data: productsList, source: 'database' });
  } catch (err: any) {
    console.error('Error fetching products from DB, serving fallback catalog:', err.message);
    const category = req.query.category as string | undefined;
    let fallback = SEED_PRODUCTS.map((p, idx) => ({ id: idx + 1, ...p }));
    if (category && category !== 'All') {
      fallback = fallback.filter((p) => p.category === category);
    }
    return res.json({ success: true, data: fallback, source: 'fallback' });
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
      // Check fallback
      const found = isNumeric
        ? SEED_PRODUCTS.find((_, i) => i + 1 === parseInt(id, 10))
        : SEED_PRODUCTS.find((p) => p.slug === id);

      if (found) {
        return res.json({ success: true, data: { id: 1, ...found }, source: 'fallback' });
      }

      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await setCached(cacheKey, result.rows[0], 600);

    return res.json({ success: true, data: result.rows[0], source: 'database' });
  } catch (err: any) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
