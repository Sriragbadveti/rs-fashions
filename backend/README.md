# RS Fashions Backend API & Supabase Architecture

A modern, robust Node.js backend powering RS Fashions e-Commerce, Inventory Management, Order Tracking, Promo Code Generation, and Website Media CMS.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database / BaaS**: [Supabase](https://supabase.com) (PostgreSQL)
- **Client SDK**: `@supabase/supabase-js`
- **Utilities**: CORS, Dotenv, Nanoid

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Supabase project credentials when ready:
```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLIENT_URL=http://localhost:5173
```

> **Note**: If you have not configured your Supabase project yet, the server will automatically run using its built-in in-memory fallback store so your frontend and admin dashboard work seamlessly!

### 3. Setup Supabase Database Schema
1. Open your Supabase Dashboard.
2. Navigate to **SQL Editor** -> **New query**.
3. Copy the entire contents of [`src/database/schema.sql`](./src/database/schema.sql) and click **Run**.
4. All tables (`products`, `orders`, `coupons`, `cms_content`), indexes, and seed data will be created instantly.

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on: `http://localhost:5000`

---

## 📡 API Endpoints

### 1. Products & Inventory (`/api/products`)
- `GET /api/products` — Retrieve all products (Supports filters: `?category=SiCo+Gadwal+Sarees&material=SiCo&minPrice=2000&maxPrice=5000&sort=price_asc&search=kanjivaram`)
- `GET /api/products/:id` — Get single product details
- `POST /api/products` — Add a new product (Admin inventory)
- `PUT /api/products/:id` — Update product details / stock
- `DELETE /api/products/:id` — Remove product from inventory

### 2. Orders Management (`/api/orders`)
- `GET /api/orders` — List all existing and new orders (Supports `?status=new|processing|shipped|delivered`)
- `GET /api/orders/:id` — Get complete order breakdown & snapshot
- `POST /api/orders` — Create a new order (Checkout)
- `PATCH /api/orders/:id/status` — Update order status (Admin)

### 3. Promo Codes / Coupons (`/api/coupons`)
- `GET /api/coupons` — List all active and past coupons
- `POST /api/coupons/generate` — Generate new promo code with percentage/fixed discount, expiration, and usage limits
- `POST /api/coupons/validate` — Validate a promo code against current order subtotal
- `DELETE /api/coupons/:id` — Delete / deactivate coupon

### 4. CMS & Website Images (`/api/cms`)
- `GET /api/cms` — Fetch all website section images and banner content
- `GET /api/cms/:sectionKey` — Fetch specific section (`hero_banner`, `festive_banner`, `story_banner`)
- `PUT /api/cms/:sectionKey` — Update section image URLs and copy in real-time

### 5. Payments (`/api/payments`)
- `POST /api/payments/create-order` — Prepared placeholder for backend Razorpay/Stripe order generation
- `POST /api/payments/verify` — Prepared placeholder for backend signature verification
