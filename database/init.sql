-- Initialize Database Schema for Solana Pay Small Business Checkout

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
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

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'cancelled'
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

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_usd NUMERIC(10, 2) NOT NULL,
    unit_price_sol NUMERIC(10, 4) NOT NULL
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_pubkey);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Seed Products for Artisan Small Business Store ("SolRoast & Craft Co.")
INSERT INTO products (slug, name, category, description, price_usd, price_sol, image_url, stock, badge, rating)
VALUES
    (
        'ethiopian-yirgacheffe',
        'Single-Origin Ethiopian Yirgacheffe (250g)',
        'Specialty Coffee',
        'Washed heirloom varietal from Gedeb, Yirgacheffe. Explosive notes of bergamot blossoms, sweet Meyer lemon, and silky black tea finish.',
        19.50,
        0.0950,
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
        35,
        'Staff Favorite',
        4.9
    ),
    (
        'tuscan-leather-cardholder',
        'Hand-Stitched Tuscan Leather Cardholder',
        'Handcrafted Leather',
        'Crafted from Badalassi Carlo vegetable-tanned Italian leather with hand-burnished edges and Japanese bonded nylon saddle stitching. Holds 6-8 cards.',
        48.00,
        0.2400,
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        18,
        'Artisan Made',
        5.0
    ),
    (
        'ceramic-pourover-set',
        'Artisan Matte Basalt Pour-Over Set',
        'Brewing Gear',
        'Individually thrown stoneware ceramic dripper with spiral extraction ridges and matching 600ml borosilicate glass serving carafe.',
        55.00,
        0.2750,
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        14,
        'Bestseller',
        4.8
    ),
    (
        'panama-geisha-reserve',
        'Panama Geisha Micro-Lot Reserve (150g)',
        'Specialty Coffee',
        'Rare Gesha varietal grown at 1,800m elevation in Boquete. Delicate aroma of white peach, jasmine, tropical mango, and honey sweetness.',
        42.00,
        0.2100,
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        12,
        'Limited Batch',
        5.0
    ),
    (
        'leather-journal-cover-a5',
        'Heritage Leather Journal Cover (A5)',
        'Handcrafted Leather',
        'Full-grain Horween Chromexcel leather with pen sleeve and twin bookmark ribbons. Includes 192-page fountain-pen-friendly dot grid refill.',
        65.00,
        0.3250,
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        22,
        'Signature',
        4.9
    ),
    (
        'cold-drip-concentrate',
        'Slow Kyoto Cold Drip Concentrate (500ml)',
        'Specialty Coffee',
        '16-hour ambient water drip through specialty roast beans. Incredibly smooth, low acidity, with dark Belgian chocolate and roasted pecan profile.',
        22.00,
        0.1100,
        'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        40,
        'Cold Brew',
        4.7
    ),
    (
        'leather-coaster-set',
        'Waxed Leather Coaster Set (Set of 4)',
        'Handcrafted Leather',
        '3.5mm thick saddle leather coasters sealed with organic beeswax to resist condensation stains. Debossed with the artisan workshop seal.',
        26.00,
        0.1300,
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        30,
        'Gift Idea',
        4.8
    ),
    (
        'barista-heavy-apron',
        'Waxed Canvas & Bridle Leather Apron',
        'Brewing Gear',
        'Water-resistant 14oz Martexin waxed duck canvas with detachable English bridle leather cross-back harness and solid brass hardware.',
        78.00,
        0.3900,
        'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
        15,
        'Durable Gear',
        4.9
    )
ON CONFLICT (slug) DO NOTHING;

