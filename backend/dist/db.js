"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_PRODUCTS = exports.pool = void 0;
exports.query = query;
exports.initializeAndSeedDatabase = initializeAndSeedDatabase;
exports.waitForDatabase = waitForDatabase;
const pg_1 = __importDefault(require("pg"));
const config_js_1 = require("./config.js");
const { Pool } = pg_1.default;
exports.pool = config_js_1.config.databaseUrl
    ? new Pool({
        connectionString: config_js_1.config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
        ssl: config_js_1.config.databaseUrl.includes('localhost') || config_js_1.config.databaseUrl.includes('solanapay-postgres') || config_js_1.config.databaseUrl.includes('127.0.0.1')
            ? false
            : { rejectUnauthorized: false },
    })
    : null;
if (exports.pool) {
    exports.pool.on('error', (err) => {
        console.warn('PostgreSQL idle client error:', err.message);
    });
}
async function query(text, params) {
    if (!exports.pool) {
        return { rows: [], rowCount: 0 };
    }
    try {
        const res = await exports.pool.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    }
    catch (err) {
        console.warn('Database query failed:', err.message);
        return { rows: [], rowCount: 0 };
    }
}
// Initial seed products for the boutique store
exports.SEED_PRODUCTS = [
    {
        slug: 'ethiopian-yirgacheffe',
        name: 'Single-Origin Ethiopian Yirgacheffe (250g)',
        category: 'Specialty Coffee',
        description: 'Washed heirloom varietal from Gedeb, Yirgacheffe. Notes of bergamot blossoms, sweet Meyer lemon, and silky black tea finish.',
        price_usd: 19.50,
        price_sol: 0.0950,
        image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
        stock: 35,
        badge: 'Popular',
        rating: 4.9,
    },
    {
        slug: 'tuscan-leather-cardholder',
        name: 'Handcrafted Leather Cardholder',
        category: 'Handcrafted Leather',
        description: 'Full-grain vegetable-tanned leather with hand-burnished edges and saddle stitching. Holds 6-8 cards comfortably.',
        price_usd: 48.00,
        price_sol: 0.2400,
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        stock: 18,
        badge: 'Handmade',
        rating: 5.0,
    },
    {
        slug: 'ceramic-pourover-set',
        name: 'Ceramic Pour-Over Dripper & Carafe',
        category: 'Brewing Gear',
        description: 'Stoneware ceramic dripper with spiral extraction ridges and matching 600ml borosilicate glass serving carafe.',
        price_usd: 55.00,
        price_sol: 0.2750,
        image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        stock: 14,
        badge: 'Bestseller',
        rating: 4.8,
    },
    {
        slug: 'panama-geisha-reserve',
        name: 'Panama Geisha Reserve (150g)',
        category: 'Specialty Coffee',
        description: 'Rare Gesha varietal grown at 1,800m elevation. Delicate aroma of white peach, jasmine, tropical mango, and honey.',
        price_usd: 42.00,
        price_sol: 0.2100,
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        stock: 12,
        badge: 'Limited Lot',
        rating: 5.0,
    },
    {
        slug: 'leather-journal-cover-a5',
        name: 'Classic Leather Journal Cover (A5)',
        category: 'Handcrafted Leather',
        description: 'Full-grain leather notebook cover with pen sleeve. Includes 192-page fountain-pen-friendly dot grid refill.',
        price_usd: 65.00,
        price_sol: 0.3250,
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        stock: 22,
        badge: 'Classic',
        rating: 4.9,
    },
    {
        slug: 'cold-drip-concentrate',
        name: 'Slow Kyoto Cold Brew Concentrate (500ml)',
        category: 'Specialty Coffee',
        description: '16-hour ambient water drip through specialty roast beans. Smooth, low acidity, with dark chocolate notes.',
        price_usd: 22.00,
        price_sol: 0.1100,
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        stock: 40,
        badge: 'Cold Brew',
        rating: 4.7,
    },
    {
        slug: 'leather-coaster-set',
        name: 'Handcrafted Leather Coasters (Pack of 4)',
        category: 'Handcrafted Leather',
        description: 'Heavy 3.5mm saddle leather coasters sealed with natural beeswax to resist stains and moisture.',
        price_usd: 26.00,
        price_sol: 0.1300,
        image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        stock: 30,
        badge: 'Gift Idea',
        rating: 4.8,
    },
    {
        slug: 'barista-heavy-apron',
        name: 'Canvas & Leather Barista Apron',
        category: 'Brewing Gear',
        description: 'Durable 14oz water-resistant duck duck canvas with detachable leather cross-back harness and brass buckles.',
        price_usd: 78.00,
        price_sol: 0.3900,
        image_url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
        stock: 15,
        badge: 'Durable',
        rating: 4.9,
    },
];
// Initialize database schema and guarantee seed data exists
async function initializeAndSeedDatabase() {
    if (!exports.pool)
        return;
    try {
        await exports.pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price_usd NUMERIC(10, 2) NOT NULL,
        price_sol NUMERIC(10, 4) NOT NULL,
        image_url TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 20,
        badge VARCHAR(50),
        rating NUMERIC(2, 1) DEFAULT 4.9,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(32) UNIQUE NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        total_usd NUMERIC(10, 2) NOT NULL,
        total_sol NUMERIC(10, 4) NOT NULL,
        reference_pubkey VARCHAR(64) UNIQUE NOT NULL,
        recipient_pubkey VARCHAR(64) NOT NULL,
        payer_pubkey VARCHAR(64),
        signature VARCHAR(128),
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        shipping_address JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_usd NUMERIC(10, 2) NOT NULL,
        unit_price_sol NUMERIC(10, 4) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_pubkey);
    `);
        const countRes = await exports.pool.query('SELECT COUNT(*) FROM products');
        const count = parseInt(countRes.rows[0]?.count || '0', 10);
        if (count === 0) {
            for (const prod of exports.SEED_PRODUCTS) {
                await exports.pool.query(`
          INSERT INTO products (slug, name, category, description, price_usd, price_sol, image_url, stock, badge, rating)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (slug) DO NOTHING
        `, [
                    prod.slug,
                    prod.name,
                    prod.category,
                    prod.description,
                    prod.price_usd,
                    prod.price_sol,
                    prod.image_url,
                    prod.stock,
                    prod.badge,
                    prod.rating,
                ]);
            }
        }
    }
    catch (err) {
        console.warn('Database auto-init note:', err.message);
    }
}
async function waitForDatabase() {
    if (!exports.pool)
        return false;
    try {
        await exports.pool.query('SELECT 1');
        await initializeAndSeedDatabase();
        return true;
    }
    catch (err) {
        console.warn('PostgreSQL connection check skipped/failed:', err.message);
        return false;
    }
}
