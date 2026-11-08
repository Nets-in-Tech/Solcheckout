# ☕ SolRoast & Craft Co. — Solana Pay Checkout for Small Business

A high-performance, realistic, and beautifully designed e-commerce boutique dApp powered by **Solana Pay**, **React (Vite + Tailwind CSS)**, **PostgreSQL**, and **Redis** — entirely containerized with **Docker**.

---

## 🌟 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture & Design Decisions](#-system-architecture--design-decisions)
- [Solana Pay Specification & Settlement Flow](#-solana-pay-specification--settlement-flow)
- [Prerequisites](#-prerequisites)
- [Environment Configuration & Wallet Setup](#-environment-configuration--wallet-setup)
- [How to Run with Docker](#-how-to-run-with-docker)
- [Testing Payments on Solana Devnet](#-testing-payments-on-solana-devnet)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Project Directory Structure](#-project-directory-structure)

---

## 📌 Project Overview

Traditional small businesses lose **2.5% to 3.5%** of every transaction to legacy credit card processing networks, and endure multi-day payout delays and chargeback fraud.

**SolRoast & Craft Co.** solves this by deploying **Solana Pay**:
1. **Instant, Non-Custodial Settlement**: Direct peer-to-peer transaction from customer to merchant in ~400ms.
2. **Negligible Transaction Cost**: Network gas fees &lt; $0.001 (0.000005 SOL), saving merchants hundreds of dollars monthly.
3. **Frictionless UX**: No mandatory user registration, no passwords, no card numbers to type. Customers scan a QR code with their mobile wallet or click 1-button desktop checkout.
4. **Production-Ready Hybrid Performance**: Heavy relational catalog data and orders live in **PostgreSQL** and are cached in **Redis** for sub-millisecond page loads, while only legitimate cryptographic settlement lives on the Solana blockchain.

---

## 🚀 Key Features

### 🛍️ Customer Storefront
- **Artisan Catalog**: Pre-seeded with single-origin coffees, handcrafted leather goods, and brewing gear with dual pricing (SOL and USD).
- **Category Filtering & Search**: Instant client-side filtering across categories (Specialty Coffee, Handcrafted Leather, Brewing Gear).
- **Persistent Slide-over Cart**: Responsive quantity stepper, live SOL/USD conversion, and stock availability bounds.
- **Frictionless Guest Checkout**: Minimalist guest form (optional name & email for tracking) — no account creation roadblocks.

### 💳 Solana Pay Checkout Engine
- **Standard Solana Pay QR Code**: Generates official `solana:<merchant>?amount=..&reference=..&label=..&message=..` QR codes with center emblem.
- **Unique Reference Keypairs**: Every order session generates an ephemeral Solana public key attached to the transfer instruction for non-custodial on-chain verification.
- **Solana Pay Transaction Request Spec**: Complies with the Solana Pay Specification (`GET /api/solana-pay/tx` and `POST /api/solana-pay/tx`) allowing wallets to fetch and sign serialized transactions directly.
- **Multi-channel Payment**:
  - 📱 **Mobile Wallet Scan**: Phantom, Solflare, or any Solana Pay compatible wallet.
  - 💻 **Browser Extension**: 1-click signing with Phantom browser extension.
  - ⚡ **1-Click Devnet Simulator**: Instant on-chain test transfer submitted directly on Solana Devnet for quick reviews without manual wallet transfers.
- **Real-Time Verification**: Backend and frontend poll and stream confirmation status via `@solana/pay`'s `findReference` and `validateTransfer`.
- **Payment Confirmation & Receipts**: Confetti burst, on-chain transaction hash linked to Solana Explorer Devnet, and printable receipt.

### 📊 Merchant Small Business Dashboard
- **Live Revenue Metrics**: Gross settled revenue in SOL and USD, total orders count, and pending checkout sessions.
- **Merchant Wallet Devnet Balance**: Displays live balance with a **1-click "Top-up 1 Devnet SOL"** airdrop requester.
- **Live Orders Ledger**: Real-time table showing order numbers, customer name, total amount, status (`Confirmed` / `Pending`), and direct links to Solana Explorer transactions.

---

## 🏛️ System Architecture & Design Decisions

```
                           ┌──────────────────────────────┐
                           │    Customer / Small Business │
                           └──────────────┬───────────────┘
                                          │
                                   HTTP / Port 3000
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        Frontend (React + Vite)        │
                      │  Tailwind CSS • Lucide • QR Code SVG  │
                      └───────────────────┬───────────────────┘
                                          │
                           Reverse Proxy / API Requests
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │         Backend (Node.js/Express)     │
                      │   @solana/pay • @solana/web3.js • tsx │
                      └───────┬───────────────────────┬───────┘
                              │                       │
              Direct Reads/Writes        Cache & Fast Sessions
                              │                       │
                              ▼                       ▼
                  ┌──────────────────────┐ ┌──────────────────────┐
                  │ PostgreSQL (Port 5433)│ │   Redis (Port 6380)  │
                  │ Catalog • Orders •   │ │ Product Cache •      │
                  │ Auto-seeded items    │ │ Order Locks & State  │
                  └──────────────────────┘ └──────────────────────┘
                              │
                      Verification & Settlement
                              │
                              ▼
                  ┌───────────────────────────────────────────┐
                  │            Solana Devnet Cluster          │
                  │   Direct Non-Custodial Transfer via QR    │
                  └───────────────────────────────────────────┘
```

### Why This Hybrid Architecture?
1. **Decentralize What Needs Legitimacy**:
   - Settlement of funds, cryptographic receipt of payment, and payment authenticity must be decentralized and tamper-proof. That is handled on Solana.
2. **Centralize What Needs High Performance & Privacy**:
   - Storing 4K product photos, descriptions, categories, customer delivery notes, and inventory counts on-chain is expensive in rent, slow to query, and wasteful.
   - **PostgreSQL** provides relational data integrity, foreign key constraints (Orders $\rightarrow$ Order Items $\rightarrow$ Products), and atomic inventory stock reservation.
3. **Redis for Sub-millisecond UX & Race-Condition Defense**:
   - Caches the product catalog (`products:all`) with TTL, invalidated only when stock changes.
   - Holds active checkout sessions (`order:session:{orderId}`).
   - Manages distributed locks (`acquireLock('verify:' + orderId)`) to prevent duplicate fulfillment or double-spend race conditions during concurrent polling.

---

## 🔑 Solana Pay Specification & Settlement Flow

1. **Session Creation**:
   The buyer initiates checkout. The backend creates an order record in PostgreSQL with status `pending` and generates an ephemeral `reference` Keypair.
2. **URL Construction**:
   The backend encodes the standard Solana Pay URL:
   ```
   solana:<MERCHANT_WALLET>?amount=0.0950&reference=<REFERENCE_PUBKEY>&label=SolRoast%20%26%20Craft%20Co.&message=Order%20ORD-78193&memo=ORD-78193
   ```
3. **On-Chain Transaction**:
   The buyer signs the transaction with their wallet. The transaction includes:
   - A `SystemProgram.transfer` instruction to the merchant wallet.
   - The order's `reference` public key added as a non-signer, non-writable account.
   - An SPL Memo instruction encoding the order number.
4. **Verification**:
   The backend checks the Solana Devnet RPC using `findReference(connection, reference)` and `validateTransfer(...)`:
   - Confirms the transaction signature is finalized/confirmed.
   - Confirms the transfer recipient equals the merchant wallet.
   - Confirms the transfer amount matches or exceeds the expected order total.
5. **Fulfillment**:
   Once verified, the backend atomically transitions the order status in PostgreSQL to `'confirmed'`, stores the `signature`, updates stock counts, and invalidates the Redis cache.

---

## ⚙️ Environment Configuration & Wallet Setup

The project uses `.env` located at `solana-pay-checkout/.env`.

### Do I need to provide a wallet address to deploy?
**No, it is 100% plug-and-play out of the box!**
- If `MERCHANT_WALLET` is left empty in `.env`, the backend **automatically generates a dedicated Devnet merchant keypair** on startup.
- You can immediately receive Devnet payments and check your live merchant balance in the **Merchant Dashboard**.

### Want to use your own Phantom / Solflare wallet?
Simply open `solana-pay-checkout/.env` and paste your Devnet public key:
```env
# Set to your Devnet wallet address:
MERCHANT_WALLET=YourSolanaDevnetPublicKeyHere111111111111111

# Optional: Set a custom store name
MERCHANT_NAME=SolRoast & Craft Co.

# Optional: Solana network (defaults to devnet)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

---

## 🐳 How to Run with Docker

The entire stack is orchestrated through Docker Compose. **Zero host tools or global packages required.**

### 1. Start All Services
Inside the `solana-pay-checkout` directory, run:
```bash
docker-compose up --build
```
Or in detached mode (background):
```bash
docker-compose up -d --build
```

### 2. Access the Application
Once the containers are up:
| Service | URL | Description |
|---|---|---|
| **Customer Storefront** | [http://localhost:3000](http://localhost:3000) | Browse goods, add to bag, Solana Pay checkout |
| **Merchant Portal** | [http://localhost:3000](http://localhost:3000) (Click "Merchant Portal" in top nav) | Real-time sales, order ledger, airdrop top-up |
| **Backend REST API** | [http://localhost:4000](http://localhost:4000) | Healthcheck, products, orders, Solana Pay endpoints |
| **PostgreSQL** | `localhost:5433` (internal `5432`) | Pre-seeded database (credentials from `.env`) |
| **Redis** | `localhost:6380` (internal `6379`) | Fast caching and session management |

### 3. Stop All Services
```bash
docker-compose down
```
To stop and clean volume data:
```bash
docker-compose down -v
```

---

## 🧪 Testing Payments on Solana Devnet

You can test the checkout flow using any of the following 3 methods:

### Method 1: Instant 1-Click Devnet Simulation (Recommended for Evaluation)
1. Open [http://localhost:3000](http://localhost:3000).
2. Add any artisan items to your cart (e.g., Ethiopian Yirgacheffe coffee).
3. Click **"Checkout with Solana Pay"** $\rightarrow$ **"Generate Solana Pay QR Code"**.
4. Click the **"⚡ Simulate Devnet Payment (1-Click Test)"** button.
5. The backend will broadcast a genuine transfer transaction on Solana Devnet with the order's unique reference key.
6. The app automatically detects on-chain confirmation, fires a confetti celebration, and provides a direct link to the transaction on Solana Explorer!

### Method 2: Mobile Wallet Scan (Phantom / Solflare Mobile)
1. Make sure your mobile wallet is set to **Solana Devnet** (`Settings` $\rightarrow$ `Developer Settings` $\rightarrow$ `Change Network` $\rightarrow$ `Devnet`).
2. Request free Devnet SOL from [faucet.solana.com](https://faucet.solana.com).
3. Scan the QR code displayed on the checkout modal with your mobile wallet camera.
4. Approve the payment. The checkout modal will automatically detect settlement in real time.

### Method 3: Browser Extension (Phantom Desktop)
1. Ensure the Phantom extension is installed in your browser and connected to Devnet.
2. In the checkout modal, click **"Pay with Browser Wallet (Phantom Extension)"**.
3. Approve the transaction in the extension popup.

---

## 📡 API Endpoints Reference

### Products
- `GET /api/products` — Retrieve products catalog (cached via Redis, filtered by category).
- `GET /api/products/:id` — Retrieve a single product by ID or slug.

### Orders & Checkout
- `POST /api/orders` — Create a checkout session, calculate totals, generate reference key, and return the official Solana Pay URL.
- `GET /api/orders/:id` — Get order status and line items.
- `GET /api/orders/:id/verify` — Query Solana Devnet RPC to verify on-chain settlement for the reference key.
- `POST /api/orders/:id/test-pay` — Broadcast a test transaction on Devnet to simulate payment.
- `GET /api/orders` — List latest 50 orders for the Merchant Portal.

### Solana Pay Specification
- `GET /api/solana-pay/tx` — Returns merchant branding (`label` and `icon`).
- `POST /api/solana-pay/tx?orderId=...` — Builds and serializes the Solana transaction for client wallet signing.

### Merchant
- `GET /api/merchant` — Returns merchant wallet address, devnet balance, and store metrics.
- `POST /api/merchant/airdrop` — Requests 1 Devnet SOL airdrop to the merchant wallet.

---

## 📁 Project Directory Structure

```
solana-pay-checkout/
├── docker-compose.yml          # Multi-container orchestration (Postgres, Redis, Backend, Frontend)
├── .env.example                # Template configuration variables
├── .env                        # Active environment variables
├── README.md                   # Comprehensive documentation
├── database/
│   └── init.sql                # PostgreSQL tables & pre-seeded small business products
├── backend/
│   ├── Dockerfile              # Node.js 22 container setup
│   ├── package.json            # Express, @solana/pay, @solana/web3.js, pg, redis
│   ├── tsconfig.json           # TypeScript configuration
│   └── src/
│       ├── config.ts           # Centralized configuration & wallet fallback
│       ├── db.ts               # PostgreSQL connection pool & health checks
│       ├── redis.ts            # Redis client, caching, and atomic locks
│       ├── solana.ts           # Solana Pay URL builder, verification, simulator
│       ├── server.ts           # Express HTTP server
│       └── routes/
│           ├── products.ts     # Products catalog route with Redis caching
│           ├── orders.ts       # Orders creation, verification & test simulator
│           ├── solana-pay.ts   # Solana Pay Transaction Request specification
│           └── merchant.ts     # Small business dashboard & airdrop route
└── frontend/
    ├── Dockerfile              # Vite development container
    ├── package.json            # React 18, Tailwind CSS, Lucide, QRCodeSVG, canvas-confetti
    ├── vite.config.ts          # Vite configuration with backend proxy
    ├── tailwind.config.js      # Tailwind theme with Solana aesthetic colors
    ├── index.html              # HTML shell
    └── src/
        ├── App.tsx             # Main layout & state coordinator
        ├── main.tsx            # React application entry point
        ├── index.css           # Global styles & animations
        ├── types/              # TypeScript interfaces (Product, Order, Merchant)
        ├── context/            # React Cart Context with local storage persistence
        └── components/
            ├── Navbar.tsx      # Top bar with network pill, cart button, merchant toggle
            ├── ProductCard.tsx # Product card with dual pricing & add button
            ├── ProductGrid.tsx # Category tabs, search, and responsive grid
            ├── CartDrawer.tsx  # Slide-over cart with price calculations
            ├── CheckoutModal.tsx # Solana Pay QR, real-time polling, and success screen
            └── MerchantOrdersModal.tsx # Small business owner portal & orders ledger
```

