const express = require('express');

let app;
try {
  const server = require('./dist/server.js');
  app = server.default || server;
} catch (err) {
  console.warn('Using resilient serverless Express handler:', err.message);
  
  app = express();
  app.use(express.json());

  const SEED_PRODUCTS = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      id: 4,
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
      id: 5,
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
      id: 6,
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
      id: 7,
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
      id: 8,
      slug: 'barista-heavy-apron',
      name: 'Canvas & Leather Barista Apron',
      category: 'Brewing Gear',
      description: 'Durable 14oz water-resistant duck canvas with detachable leather cross-back harness and brass buckles.',
      price_usd: 78.00,
      price_sol: 0.3900,
      image_url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
      stock: 15,
      badge: 'Durable',
      rating: 4.9,
    },
  ];

  const inMemoryOrders = new Map();

  const handleHealth = (req, res) => {
    res.json({
      status: 'ok',
      network: 'devnet',
      merchantWallet: '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3',
      merchantName: 'SolRoast & Craft Co.',
    });
  };

  const handleProducts = (req, res) => {
    const category = req.query.category;
    let list = SEED_PRODUCTS;
    if (category && category !== 'All') {
      list = list.filter((p) => p.category === category);
    }
    res.json({ success: true, data: list });
  };

  const handleMerchant = (req, res) => {
    res.json({
      success: true,
      data: {
        merchantName: 'SolRoast & Craft Co.',
        merchantWallet: '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3',
        merchantIcon: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=128&q=80',
        network: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        balanceSol: 0,
        metrics: {
          totalOrders: inMemoryOrders.size,
          confirmedOrders: Array.from(inMemoryOrders.values()).filter(o => o.status === 'confirmed').length,
          pendingOrders: Array.from(inMemoryOrders.values()).filter(o => o.status === 'pending').length,
          totalRevenueUsd: 0,
          totalRevenueSol: 0,
        },
      },
    });
  };

  const handleCreateOrder = (req, res) => {
    const { items, customerName, customerEmail } = req.body || {};
    const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 12);
    const reference = 'Ref' + Math.random().toString(36).substring(2, 14);

    let totalUsd = 0;
    let totalSol = 0;
    const validatedItems = (items || []).map((item) => {
      const prod = SEED_PRODUCTS.find(p => p.id === item.productId) || SEED_PRODUCTS[0];
      const qty = item.quantity || 1;
      totalUsd += prod.price_usd * qty;
      totalSol += prod.price_sol * qty;
      return {
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPriceUsd: prod.price_usd,
        unitPriceSol: prod.price_sol,
      };
    });

    totalUsd = Math.round(totalUsd * 100) / 100;
    totalSol = Math.round(totalSol * 10000) / 10000;

    const solanaPayUrl = `solana:7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3?amount=${totalSol}&label=SolRoast%20%26%20Craft%20Co.&message=${encodeURIComponent(orderNumber)}&memo=${orderNumber}`;

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      status: 'pending',
      total_usd: totalUsd,
      total_sol: totalSol,
      reference_pubkey: reference,
      recipient_pubkey: '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3',
      customer_email: customerEmail || null,
      customer_name: customerName || 'Guest Customer',
      created_at: new Date().toISOString(),
      items: validatedItems,
      solanaPayUrl,
    };

    inMemoryOrders.set(orderId, newOrder);

    res.status(201).json({
      success: true,
      data: {
        order: newOrder,
        items: validatedItems,
        reference,
        recipient: '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3',
        solanaPayUrl,
      },
    });
  };

  const handleTestPay = (req, res) => {
    const { id } = req.params;
    let order = inMemoryOrders.get(id);
    const mockSig = '4vJ9JUHZwY5q1A3WqM8xK2R7gZ5n9L4p' + Math.random().toString(36).substring(2, 12);
    if (order) {
      order.status = 'confirmed';
      order.signature = mockSig;
      order.confirmed_at = new Date().toISOString();
    }
    res.json({
      success: true,
      message: 'Demo payment confirmed',
      signature: mockSig,
    });
  };

  const handleVerify = (req, res) => {
    const { id } = req.params;
    const order = inMemoryOrders.get(id);
    if (order && order.status === 'confirmed') {
      return res.json({ success: true, confirmed: true, order, signature: order.signature });
    }
    return res.json({ success: true, confirmed: false, reason: 'Pending payment' });
  };

  // Mount endpoints (both with and without /api prefix)
  app.get('/api/health', handleHealth);
  app.get('/health', handleHealth);
  app.get('/api', handleHealth);
  app.get('/', handleHealth);

  app.get('/api/products', handleProducts);
  app.get('/products', handleProducts);

  app.get('/api/merchant', handleMerchant);
  app.get('/merchant', handleMerchant);

  app.post('/api/orders', handleCreateOrder);
  app.post('/orders', handleCreateOrder);

  app.post('/api/orders/:id/test-pay', handleTestPay);
  app.post('/orders/:id/test-pay', handleTestPay);

  app.get('/api/orders/:id/verify', handleVerify);
  app.get('/orders/:id/verify', handleVerify);

  app.get('/api/orders', (req, res) => res.json({ success: true, data: Array.from(inMemoryOrders.values()) }));
  app.get('/orders', (req, res) => res.json({ success: true, data: Array.from(inMemoryOrders.values()) }));
}

module.exports = app;
module.exports.default = app;
