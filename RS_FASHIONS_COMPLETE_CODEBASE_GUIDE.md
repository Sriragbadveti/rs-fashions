# RS Fashions — Complete Codebase Guide

> A professional-grade, end-to-end technical reference for developers of all experience levels.

This file is split into 24 sections. See docs/RS_FASHIONS_DEVELOPER_LEARNING_GUIDE.md for the learning path.

## 1. Project Overview

RS Fashions is a full-stack e-commerce platform AND Point-of-Sale (POS) system for premium SiCo Gadwal sarees, based in Hyderabad, India.

**Two distinct user audiences share the same codebase:**
- Customers: rsfashions25.com — browse and purchase sarees
- Admin / Store Staff: /admin-7f9a2b8e/login — manage products, billing, inventory, orders, CRM

**What IS implemented:**
- Customer storefront (shop, product detail, cart, checkout)
- Cashfree payment gateway (online purchases + in-store QR/link billing)
- Admin dashboard with 15+ sub-pages (catalog, billing, inventory, CRM, analytics, reviews)
- In-store POS billing with payment link generation
- HEIC image conversion (iPhone photos to JPEG) + Supabase Storage
- Google OAuth for customer login
- Multi-admin system with cryptographic session tokens (custom JWT-like)
- Dual persistence: Supabase (primary) + JSON file fallback (offline mode)
- Real-time order fulfillment tracking

**What is NOT implemented (UI stubs only):**
- Razorpay, PhonePe, UPI payment methods in checkout are placeholder buttons
- COD has no post-order tracking mechanism beyond status flags

## 2. Technology Stack

### Frontend
- React 19.x + TypeScript ~6.x + Vite 8.x
- React Router DOM 7.x (client-side routing)
- Tailwind CSS 4.x (styling)
- Framer Motion 13.x + GSAP 3.x (animations)
- Lenis 1.x (smooth scrolling)
- Lucide React 1.x (icons)
- Recharts 3.x (admin analytics charts)
- @supabase/supabase-js 2.116.x (browser Supabase client)
- heic2any / heic-to (iPhone HEIC image conversion)

### Backend
- Node.js + Express 4.x
- @supabase/supabase-js 2.49.x (server-side, service-role key)
- sharp 0.35.x (image compression + resize)
- heic-convert 2.x (server-side HEIC to JPEG)
- nanoid 5.x, cors 2.x, dotenv 16.x

### Infrastructure
- Supabase: PostgreSQL database + file storage + real-time
- Cashfree: Payment gateway (India)
- Google OAuth 2.0: Customer authentication
- Vercel: Frontend hosting
- Render: Backend hosting (https://rs-fashions.onrender.com)

## 3. Project Directory Structure

```
rsfashions/                          (Monorepo root)
├── package.json                     (npm workspaces: frontend, backend)
├── vercel.json                      (SPA rewrite rules)
├── RS_FASHIONS_COMPLETE_CODEBASE_GUIDE.md  (THIS FILE)
│
├── frontend/src/
│   ├── main.tsx                     (React DOM entry: BrowserRouter + CartProvider)
│   ├── App.tsx                      (Route definitions)
│   ├── config/
│   │   ├── api.ts                   (API_BASE URL resolver: dev/LAN/prod)
│   │   └── routes.ts                (Admin secret path constant)
│   ├── context/
│   │   ├── CartContext.tsx           (Global cart state + offer tiers)
│   │   ├── ModalContext.tsx          (Admin modal state)
│   │   └── OrderFulfillmentContext.tsx (Shipping/fulfillment tracking)
│   ├── pages/
│   │   (Storefront) Home, Shop, Product, Cart, Checkout, Account, Auth, OffersStore
│   │   (Admin)      Admin, Login, Dashboard, Overview, SareeStock, Billing, BulkStock,
│   │                StockHistory, CRM, TransactionHistory, SaleManager, TrendingManager,
│   │                ReviewsManager, Analysis, AutomatedLowstock, Settings, Receipt, TrackOrder
│   │   (Special)    QuickPay (/pay - POS payment completion), AuthCallback, NotFound
│   ├── components/
│   │   layout/ (SiteLayout, Navbar, MobileMenu)
│   │   home/   (Hero, TrendingProducts, ProductShowcase, MaterialCollections, etc.)
│   │   product/(ProductCard, ProductGallery, ProductInfo, ProductAccordion, etc.)
│   │   cart/   (CartDrawer)
│   │   shop/   (FilterSheet)
│   │   common/ (ErrorBoundary, CookieConsent)
│   ├── services/
│   │   supabase.ts  (Browser Supabase client + StoreService object)
│   ├── types/       (TypeScript interfaces for products, cart, inventory, etc.)
│   └── utils/
│       adminSession.ts  (Admin token localStorage management)
│       userSession.ts   (Customer session + addresses + saved payments)
│       imageConverter.ts, imageUtils.ts
│
└── backend/src/
    ├── server.js                    (Express app, CORS, middleware, startup)
    ├── config/
    │   ├── env.js                   (ENV object with cleanEnv() sanitization)
    │   └── supabase.js              (Two Supabase clients: admin + public)
    ├── routes/
    │   index.js                     (Central router: public + protected admin)
    │   auth.routes.js, catalog.routes.js, billing.routes.js, payments.routes.js
    │   inventory.routes.js, crm.routes.js, sales.routes.js, settings.routes.js
    │   tracking.routes.js, reviews.routes.js, upload.routes.js, bootstrap.routes.js
    │   adminManagement.routes.js
    ├── controllers/                 (Business logic handlers)
    │   auth.controller.js (22KB)   catalog.controller.js (27KB)
    │   payments.controller.js (26KB) billing.controller.js (9.7KB)
    │   inventory.controller.js     upload.controller.js
    │   crm.controller.js, sales.controller.js, bootstrap.controller.js
    │   tracking.controller.js, reviews.controller.js, settings.controller.js
    ├── middleware/
    │   adminAuth.js                 (Custom JWT: generate, verify, revoke)
    │   errorHandler.js, requestLogger.js
    ├── services/
    │   admin.service.js             (scrypt password hashing, admin account CRUD)
    │   cashfree.service.js          (Cashfree API calls + webhook signature verify)
    │   inventory.service.js         (Stock deduction, variant management)
    └── database/
        localStore.js                (File-based JSON persistence layer)
        schema.sql                   (Supabase PostgreSQL DDL)
        seed.js, verifyDb.js
        data/ (runtime JSON files: products.json, orders.json, payment_attempts.json, etc.)
```

## 4. Application Startup

### Frontend Startup (frontend/src/main.tsx)
1. ReactDOM.createRoot(document.getElementById('root'))
2. Wraps App in: StrictMode > BrowserRouter > CartProvider > ScrollToTop
3. CartProvider: loads cart from localStorage 'rs_fashions_cart', sets up discount tier calculations
4. App.tsx: ErrorBoundary > Routes (all pages defined here)

**API Base Resolution (frontend/src/config/api.ts):**
- VITE_API_BASE_URL env var set? → use it
- Running on localhost? → http://localhost:5001
- Running on LAN IP? → http://<lan-ip>:5001 (mobile device testing on same WiFi)
- Production? → https://rs-fashions.onrender.com

### Backend Startup (backend/src/server.js)
1. validateEnv() — checks for SUPABASE_URL + SUPABASE keys (warns if missing, does not crash)
2. Creates Express app
3. Configures CORS (whitelists rsfashions25.com, rs-fashions.vercel.app, localhost)
   ⚠️ WARNING: Fallback always returns true for ALL origins — security risk
4. express.json({ limit: '50mb' }) — large limit for base64 image uploads
5. requestLogger middleware
6. Mounts /api/health route
7. Mounts /api → apiRouter (routes/index.js)
8. errorHandler middleware
9. app.listen(PORT || 5001)

**Supabase Clients (backend/src/config/supabase.js):**
- adminClient: service-role key (bypasses Row Level Security)
- publicClient: anon key (respects RLS)
- If keys missing → both null, all controllers fall back to localStore.js

## 5. Frontend Architecture

### Component Hierarchy
```
BrowserRouter
  CartProvider (global cart state)
    ErrorBoundary
      App
        Routes
          /pay              → QuickPay   (POS payment link portal)
          /admin-7f9a2b8e   → Admin      (admin shell)
            ModalProvider
              OrderFulfillmentProvider
                Login (if not authenticated)
                Dashboard (if authenticated)
                  → Overview, SareeStock, Billing, BulkStock, etc.
          /login, /auth     → Auth       (customer Google OAuth)
          /auth/callback    → AuthCallback
          SiteLayout wrapper (Navbar + Outlet)
            /               → Home
            /shop           → Shop
            /product/:id    → Product
            /cart           → Cart
            /checkout       → Checkout
            /account        → Account
            /offers         → OffersStore
            /our-story, /privacy, /terms, /returns, /shipping
```

### State Management (No Redux/Zustand — By Design)

| State Type | Storage | Lifetime |
|---|---|---|
| Cart items | CartContext + localStorage | Persistent (no expiry) |
| Admin session token | localStorage (rs_admin_session) | 24 hours |
| Customer session | localStorage (rs_user_session) | 30 days |
| Order fulfillment | OrderFulfillmentContext + localStorage | Persistent |
| Admin modals | ModalContext (in-memory) | Page lifetime |
| Page-specific data | useState + API fetch | Component lifetime |

### CartContext (frontend/src/context/CartContext.tsx)
The most critical global state. Manages:
- items: CartItem[] — cart contents
- addToCart(product, qty, color, size), removeFromCart(itemId), clearCart()
- Pricing: subtotal, offerDiscount (tier-based: 2→5%, 3→10%, 5→15%), finalSubtotal
- Persists to localStorage on every change

**Weakness:** Pricing recalculated on every render without useMemo

### Key Pages

| Page | What It Does |
|---|---|
| Home.tsx | Assembles homepage from Hero, TrendingProducts, ProductShowcase, MaterialCollections, OfferBanner, HomeFooter |
| Shop.tsx | Product grid with client-side filters (no server pagination) |
| Product.tsx | Fetches product by ID, renders ProductGallery + ProductInfo + reviews + related |
| Checkout.tsx | 3-step wizard: Address → Payment (Cashfree SDK) → Success |
| Admin.tsx | Verifies admin token on mount, renders Login or Dashboard |
| Dashboard.tsx | Admin navigation sidebar; all 15+ admin sub-pages rendered here |
| Billing.tsx | POS counter: select products + customer → generate Cashfree payment link |
| QuickPay.tsx | Customer payment page opened from POS link (/pay?order_id=...&session_id=...) |

## 6. Backend Architecture

### Request Lifecycle
```
HTTP Request
  ↓ CORS Middleware
  ↓ express.json() body parser
  ↓ requestLogger
  ↓ Route matching (routes/index.js)
  ↓ [requireAdminAuth] (only for /api/admin/* routes)
  ↓ Controller function:
      Input validation
      Business logic
      Supabase call → localStore fallback
      Cache invalidation
      successResponse() / errorResponse()
  ↓ Response (JSON)
  ↓ errorHandler (uncaught errors)
```

### catalog.controller.js (27KB — Largest Controller)
- getProducts: memory cache → Supabase → localStore; merges variants on return
- createProduct: validates, uploads images to Supabase Storage, generates product ID, inserts to Supabase + localStore
- updateProduct: updates Supabase, uploads new images, logs RESTOCK if stock increased
- deleteProduct: deletes from Supabase + localStore + variants map
- getColors / registerColor: color palette in settings table

### payments.controller.js (26KB — Most Complex)
- createCashfreeOrder: for storefront checkout → returns payment_session_id
- verifyCashfreePayment: fetches status from Cashfree API after redirect
- createCashfreePaymentLink: for POS billing; uses in-memory distributed lock to prevent duplicates; reuses existing PENDING links
- handleCashfreeWebhook: HMAC-SHA256 signature verification, idempotency via webhook_events.json, PAID→FAILED protection, auto-records POS sales

### adminAuth.js (Middleware + Token Management)
- generateAdminToken: creates header.claims.signature with HMAC-SHA256; 24h expiry; stores jti in activeAdminSessions Map
- verifyAdminToken: checks revokedTokens Set, verifies signature with timingSafeEqual(), checks exp and role
- requireAdminAuth: middleware that extracts Bearer token and calls verifyAdminToken()
- revokeAdminToken: adds to revokedTokens Set (in-memory ONLY — cleared on server restart)

### localStore.js (Dual Persistence Layer)
All data stored as JSON in backend/src/database/data/:
- products.json (catalog mirror), orders.json, payment_attempts.json
- webhook_events.json (idempotency), colors.json, admin_accounts.json (gitignored)
- Pattern: Supabase is always tried first; localStore is always updated on writes
- Enables offline operation but risks data divergence

## 7. Database Architecture

### Supabase Tables

**products** (core catalog)
- id TEXT PK (human-readable: e.g., SGS-003, midnight-sico-gadwal)
- name, category (denormalized), material, price, original_price, stock
- images TEXT[] (array of CDN URLs)
- colors TEXT[], tags TEXT[], rating, review_count
- featured BOOLEAN (homepage), trending BOOLEAN, for_sale BOOLEAN
- description TEXT, created_at, updated_at

**categories**
- id, name, slug (e.g., SGS), hsn (GST code), next_sequence (for ID generation)

**orders**
- id, order_number UNIQUE, customer_name, phone, email
- items JSONB (array of ordered items), subtotal, cgst, sgst, shipping_fee, discount, total
- payment_method (cashfree/cod/counter_cash), payment_status, order_status
- billing_type (pos/online)

**customers**
- id, name, phone (nullable), email, city
- total_spent, orders_count (lifetime stats)
- google_id (Google OAuth sub ID), auth_provider (email/google)

**stock_movements** (immutable audit trail)
- sku (product ID), product_name, color, type (SALE/RESTOCK/ADJUSTMENT/LOOM_INTAKE)
- quantity, previous_stock, new_stock, reference_number, performed_by, note

**settings** (key-value store)
- color_palette → JSON array of {name, code} colors
- product_variants → {"product-id": [{sku, color, colorSlug, stock}]} (ALL variants as one blob)
- admin_accounts → JSON array of admin records with hashed passwords
- store_info → business name, address, GST number

**coupons**: code (UNIQUE), discount_type (percentage/fixed), discount_value, min_order_value, max_uses, times_used, is_active, expires_at

**tracked_orders**: inward (loom/supplier) and outward (courier) shipment tracking

**auth_sessions**: device/session tracking with device name, platform, IP, user agent

### Critical Architectural Decision: Variants in Settings

Product variants (color-specific stock) are stored as a JSONB blob in settings.value where settings.key = 'product_variants'. This means:
- Not directly queryable in SQL
- All variants loaded at once as one large JSON object
- Grows unboundedly with the catalog
- Should be migrated to a proper product_variants table

## 8. Complete API Inventory

### Authentication (/api/auth/)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/admin-login | No | Admin login → token |
| POST | /api/auth/admin-logout | No | Invalidate admin token |
| GET | /api/auth/admin-verify | No | Verify admin token |
| POST | /api/auth/admin-create-authorized | No | Create admin (master creds in body) |
| POST | /api/auth/google/verify | No | Verify Google ID token |
| POST | /api/auth/session | No | Register device session |
| GET | /api/auth/sessions | No | Get active sessions |
| DELETE | /api/auth/sessions/:id | No | Revoke session |

### Catalog (/api/catalog/)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/catalog/products | No | All products |
| POST | /api/catalog/products | Admin | Create product |
| PUT | /api/catalog/products/:id | Admin | Update product |
| DELETE | /api/catalog/products/:id | Admin | Delete product |
| POST | /api/catalog/products/batch-delete | Admin | Batch delete |
| GET | /api/catalog/categories | No | List categories |
| POST | /api/catalog/categories | Admin | Create category |
| GET | /api/catalog/colors | No | Color palette |
| POST | /api/catalog/colors | Admin | Register color |

### Payments (/api/payments/)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/payments/cashfree/create-order | No | Create Cashfree order (storefront) |
| POST | /api/payments/cashfree/verify | No | Verify payment |
| GET | /api/payments/cashfree/status/:orderId | No | Get payment status |
| POST | /api/payments/cashfree/create-payment-link | No | Create POS payment link |
| POST | /api/payments/cashfree/webhook | No | Cashfree webhook receiver |

### Other Route Groups
| Prefix | Purpose |
|---|---|
| /api/billing/ | POS checkout (pos-checkout), coupon validation (validate-coupon) |
| /api/admin/inventory/ | Stock movements, bulk intake, low-stock alerts, variants |
| /api/crm/ | Customer CRUD, check-exists, loyalty stats |
| /api/sales/ | Sales history, fulfillment updates, customer orders |
| /api/tracking/ | Inward/outward tracked orders |
| /api/reviews/ | Product review CRUD |
| /api/settings/ | Store configuration |
| /api/upload/ | Image upload, HEIC conversion |
| /api/admin/bootstrap/ | Pre-aggregated admin dashboard data |
| /api/admin/admins/ | Multi-admin account management |

## 9. Authentication and Authorization

### Admin Authentication (Custom JWT-like System)

**Login flow:**
1. Frontend Login.tsx → POST /api/auth/admin-login {email, password}
2. auth.controller.js → adminLogin() → authenticateAdmin()
3. admin.service.js → authenticateAdmin():
   - Loads admin list from Supabase settings (key: admin_accounts) or localStore
   - Finds admin by email (case-insensitive)
   - Verifies password: crypto.scryptSync() + timingSafeEqual() (timing-safe)
   - Legacy fallback: plain-text check against ADMIN_PASSWORD env var (then upgrades to scrypt)
4. adminAuth.js → generateAdminToken():
   - Creates: base64url(header).base64url(claims).HMAC-SHA256-signature
   - Claims: role:'admin', exp (24h), jti (unique token ID)
   - Stored in activeAdminSessions Map (in-memory)
5. Frontend: stores {token, user} in localStorage via adminSession.ts

**Per-request authorization:**
- requireAdminAuth middleware extracts Bearer token
- verifyAdminToken: checks revokedTokens Set → verifies HMAC → checks exp → checks role
- On success: req.adminUser = claims

**CRITICAL WEAKNESSES:**
- revokedTokens is in-memory Set → server restart makes all logged-out tokens valid again (up to 24h)
- AUTH_SECRET fallback to hardcoded string if env vars missing → token forgery possible

### Customer Authentication (Google OAuth + localStorage)
1. Customer clicks "Sign in with Google" → Auth.tsx
2. Google OAuth redirect → /auth/callback → AuthCallback.tsx
3. Frontend: POST /api/auth/google/verify with Google ID token
4. Backend: verifies token via Google tokeninfo endpoint (not the official SDK)
5. Creates/updates customer in Supabase customers table
6. Returns {user} → stored in localStorage via userSession.ts
7. No server-side session validation for customers on subsequent requests

### Admin Account Storage
Stored as JSON array in Supabase settings (key: admin_accounts). Passwords: crypto.scryptSync (salt:derivedKey format). Primary admin always rebuilt from ADMIN_EMAIL + ADMIN_PASSWORD env vars.

## 10. Product Management Workflow

### Product Creation (Step-by-Step)
1. Admin opens SareeStock.tsx → "Add New Product"
2. Fills form: name, category, material, price, original_price, stock, description, colors, tags
3. Uploads images (JPEG/PNG/HEIC supported):
   - HEIC: POST /api/upload/convert-heic → heic-convert → JPEG data URL → preview shown
4. Submits form → POST /api/admin/catalog/products

**Backend (catalog.controller.js → createProduct):**
1. Validate required fields
2. Generate product ID: <categorySlug>-<paddedSequence> (e.g., SGS-003) or name-based slug
3. For each image (base64 data URL):
   - heic-convert if HEIC → sharp (1200×1200, quality 82, progressive JPEG, EXIF rotate)
   - Supabase Storage upload to 'sarees' bucket → CDN URL
4. supabase.from('products').insert([record])
5. localStore products.json update
6. If variants → save to product_variants settings key
7. Increment category.next_sequence
8. invalidateCatalogCache()
9. Return {product}

### Product Variant System
- Variants stored in settings table, key: product_variants
- Format: {"product-id": [{"sku":"RSF-SGS-001-VLT","color":"Violet","colorSlug":"VLT","stock":3}]}
- Merged into product objects during getProducts response
- ⚠️ Not queryable individually; entire variant map loaded on every products fetch

## 11. Customer Shopping Workflow

**1. Discovery:** Homepage (Hero, TrendingProducts, ProductShowcase) → product cards

**2. Product Detail (Product.tsx):**
- Fetches from /api/catalog/products
- ProductGallery (image zoom), ProductInfo (color selection, quantity, add-to-cart)
- ProductReviews, RelatedProducts

**3. Cart:** CartContext.addToCart() → localStorage write (no API call)

**4. Checkout — Address Step (Checkout.tsx):**
- getUserSession() from localStorage (must be logged in)
- Load saved addresses from userSession.ts
- Fill/select address form

**5. Checkout — Payment Step:**
1. Generate stable order number (stableOrderNumberRef prevents duplicates)
2. POST /api/billing/pos-checkout → save PENDING order to Supabase
3. POST /api/payments/cashfree/create-order → payment_session_id
4. loadCashfreeScript() → CDN load of cashfree.js v3
5. cashfree.checkout({paymentSessionId}) → payment modal opens
6. Customer pays (UPI, cards, net banking)
7. Cashfree redirects to /checkout?order_id=...
8. POST /api/payments/cashfree/verify → confirm SUCCESS
9. clearCart(), save order to localStorage, show success screen

**6. Async Webhook:** POST /api/payments/cashfree/webhook → verify HMAC → update Supabase

## 12. Payment Processing

### Mode 1: Storefront Online Checkout
Customer → Checkout.tsx → create-order API → Cashfree SDK modal → payment → verify API

### Mode 2: POS Counter Billing
Admin → Billing.tsx → create-payment-link API → share link via WhatsApp → Customer → QuickPay.tsx → Cashfree SDK → webhook auto-records sale

### Cashfree Webhook Handler (Robust Implementation)
1. HMAC-SHA256 signature verification: HMAC(timestamp + rawBody, SECRET_KEY)
2. Idempotency: webhook_events.json prevents duplicate processing
3. State machine: PENDING → PAID only; PAID can NEVER become FAILED
4. Auto-records POS sale: SUCCESS on POS order → creates sale record in Supabase
5. Updates Supabase orders table

### Payment States
CREATED → PENDING → PAID (terminal/success)
                  → FAILED / CANCELLED / EXPIRED (terminal/failure)

Once PAID, protected by isAlreadyPaid check in webhook.

### Distributed Lock (Duplicate Prevention)
acquireLock(posKey) / releaseLock(posKey) in-memory lock prevents duplicate payment link creation.
⚠️ In-memory only — not safe for multi-instance deployments.

## 13. Image Upload and Storage

**Pipeline:**
1. Admin selects image → browser HEIC conversion if needed
2. POST /api/upload {image: "data:image/jpeg;base64,..."}
3. Server: parseDataUrlOrBase64() → heic-convert if HEIC → sharp:
   - .rotate() (fixes EXIF orientation from phone cameras)
   - .resize({width:1200, height:1200, fit:'inside'})
   - .jpeg({quality:82, progressive:true, mozjpeg:true})
4. supabase.storage.from('sarees').upload('uploads/<filename>', buffer)
5. getPublicUrl() → returns CDN URL
6. Fallback: if Supabase Storage fails → returns compressed JPEG data URL

**Current Weaknesses:**
- No lazy loading (loading="lazy") on frontend img tags
- No WebP conversion or srcSet
- No blur placeholders during loading
- Sequential multi-image uploads (not parallel)

## 14. External Integrations

**Supabase:** Two clients. adminClient (service-role, bypasses RLS) for all admin/backend ops. publicClient (anon key). Real-time subscriptions for cross-device sync. Storage bucket 'sarees' for images.

**Cashfree:** API v2023-08-01. Authentication via x-client-id + x-client-secret headers. Env auto-detected from key prefix (cfsk_ma_prod_ → production, cfsk_ma_test_ → sandbox). SDK loaded from CDN at runtime.

**Google OAuth 2.0:** Authorization code flow. Server-side verification via tokeninfo endpoint (not official SDK). Auto-creates customer on first login.

**Vercel:** Frontend with SPA rewrites (all routes → /index.html). Build: npm --prefix frontend run build. Output: frontend/dist/

**Render:** Backend Node.js service. URL: https://rs-fashions.onrender.com

## 15. End-to-End Data Flow Example

Customer purchases saree online:
```
1. GET /api/catalog/products → cache hit or Supabase query → product data
2. addToCart() → localStorage write (no network call)
3. getUserSession() → address selection
4. POST /api/billing/pos-checkout → Supabase INSERT orders (status:pending)
5. POST /api/payments/cashfree/create-order → Cashfree API POST /pg/orders → session_id
6. Cashfree SDK loaded → payment modal → customer pays
7. Cashfree redirect → POST /api/payments/cashfree/verify → Cashfree GET /pg/orders/:id/payments → SUCCESS
8. Backend: markOrderPaidInStore() + Supabase UPDATE orders SET payment_status='paid'
9. Frontend: clearCart() → success screen
10. ASYNC: Cashfree webhook → HMAC verify → idempotency check → Supabase UPDATE + deductStockForItem()
    → Supabase UPDATE products SET stock=stock-qty
    → Supabase INSERT stock_movements (audit log)
    → invalidateCatalogCache()
```

## 16. Code Quality Review

### GOOD Implementations
1. **adminAuth.js** — crypto.timingSafeEqual() prevents timing attacks; HMAC-SHA256; in-memory revocation; jti for instant invalidation
2. **Cashfree Webhook Idempotency** — webhook_events.json; PAID→FAILED protection; signature verification
3. **Image Pipeline (upload.controller.js)** — HEIC handling; sharp optimization; EXIF rotation; Supabase Storage fallback
4. **ENV sanitization (env.js cleanEnv())** — strips quotes/carriage-returns from env values; elegant Cashfree env detection
5. **Dual Persistence (localStore.js)** — system works even if Supabase is unreachable
6. **StoreService (supabase.ts)** — layered fallback (API → Supabase direct → localStorage)

### MESSY Implementations
1. **Route triple-mounting (routes/index.js)** — same routes mounted 3 times; authorization boundaries unclear
2. **admin_accounts in settings table** — entire credential list as one JSONB blob; 5-minute cache means deleted admin can still auth
3. **Variants in settings table** — one giant JSON blob; not queryable; grows unboundedly
4. **OrderFulfillmentContext** — manually syncs 4 localStorage keys; fragile; silent failures cause divergence
5. **No code splitting** — all 15+ admin pages eagerly loaded; customers download admin code

## 17. Performance Analysis

**Frontend Issues:**
- No code splitting (React.lazy) — large initial bundle
- No image lazy loading (loading="lazy") — images load even when off-screen
- CartContext pricing not memoized — recalculates on every render
- Admin pages load all records without pagination — will break at scale

**Backend Issues:**
- Sequential multi-image uploads (should be Promise.all)
- Stock deduction: up to 3 Supabase queries to find one product
- Bootstrap endpoint: loads ALL products + orders + customers + movements in one request

## 18. Security Review

### CRITICAL (Fix Immediately)

**CORS Permissive Fallback (server.js):**
callback(null, true) allows ALL origins. Any website can call the API.
Fix: Remove the fallback line.

**Hardcoded JWT Secret (adminAuth.js):**
const AUTH_SECRET = process.env.ADMIN_JWT_SECRET || ENV.CASHFREE.SECRET_KEY || "rs_fashions_admin_secure_key_2026"
If env vars missing, signing secret is a hardcoded string visible in source. Token forgery possible.
Fix: throw new Error() at startup if ADMIN_JWT_SECRET not set.

**No Rate Limiting:**
Admin login has unlimited brute-force attempts possible.
Fix: Add express-rate-limit to /api/auth/admin-login.

**50MB JSON Body:**
express.json({limit:'50mb'}) enables DoS via large payloads.
Fix: Use multer for file uploads; reduce JSON limit to 1-2MB.

### MEDIUM Priority
- In-memory token revocation: server restart makes logged-out tokens valid again (up to 24h)
- Google tokeninfo endpoint: use official google-auth-library instead
- Admin path security through obscurity only (real security is the token system)

## 19. Technical Debt

**High Priority:**
1. Variant storage in settings blob → create product_variants table
2. Route triple-mounting → single canonical route per operation
3. No input validation library → adopt zod or joi

**Medium Priority:**
4. No React code splitting → React.lazy() + Suspense for routes
5. Admin JWT secret not required → enforce at startup
6. Customer session in localStorage → consider Supabase Auth
7. Duplicate storeService.ts → consolidate with supabase.ts
8. Legacy static data files → frontend/src/data/products.ts and frontend/src/pages/data/products.ts

**Low Priority:**
9. No TypeScript on backend
10. No automated tests (test_security_payments.js is manual only)
11. Both GSAP and Framer Motion (bundle weight)

## 20. Architecture Diagrams

See docs/architecture/ for all generated diagrams:
- system_overview.html — High-level architecture
- frontend_components.html — Component hierarchy
- backend_mvc.html — Backend MVC flow
- auth_flow.html — Authentication sequences
- payment_lifecycle.html — Payment state machine
- image_upload_flow.html — Image upload pipeline
- data_flow.html — Complete data flow

## 21. Important Files to Understand First

1. backend/src/server.js — App bootstrap
2. backend/src/routes/index.js — URL structure (note the triple-mounting issue)
3. backend/src/middleware/adminAuth.js — generateAdminToken, verifyAdminToken, requireAdminAuth
4. backend/src/config/env.js — ENV, validateEnv, cleanEnv
5. backend/src/database/localStore.js — readJson, writeJson, all data access functions
6. frontend/src/config/api.ts — API_BASE resolution logic
7. frontend/src/main.tsx — React app bootstrap
8. frontend/src/App.tsx — All route definitions
9. frontend/src/context/CartContext.tsx — CartProvider, useCart
10. backend/src/controllers/catalog.controller.js — getProducts, createProduct
11. backend/src/controllers/payments.controller.js — createCashfreePaymentLink, handleCashfreeWebhook
12. backend/src/services/admin.service.js — authenticateAdmin, hashPassword, verifyPassword

## 22. Recommended Learning Order

Stage 1 (Big Picture): Read this doc → README files → package.json files
Stage 2 (Database): backend/src/database/schema.sql → try GET /api/catalog/products
Stage 3 (One API): Trace GET /api/catalog/products: routes/index.js → catalog.routes.js → catalog.controller.js → Supabase → response
Stage 4 (Auth): Trace admin login → trace requireAdminAuth middleware
Stage 5 (Frontend): main.tsx → App.tsx → CartContext.tsx → Home.tsx → SareeStock.tsx
Stage 6 (Payments): Checkout.tsx handlePlaceOrder → cashfree/create-order → SDK → verify → webhook

## 23. Prioritized Improvement Roadmap

### P0 — Critical Security
- P0.1: Remove CORS permissive fallback (server.js)
- P0.2: Require ADMIN_JWT_SECRET env var; throw at startup if missing (adminAuth.js)
- P0.3: Add express-rate-limit to admin login endpoint
- P0.4: Use multer for image uploads; reduce JSON body limit to 1-2MB

### P1 — High Impact
- P1.1: Persist revoked token JTIs to Supabase (persistent logout)
- P1.2: Add server-side pagination to admin list views
- P1.3: Add indexes on products.featured, products.trending, products.category
- P1.4: Limit and paginate the bootstrap endpoint

### P2 — Architectural
- P2.1: Create proper product_variants table
- P2.2: Consolidate triple-mounted routes to single canonical routes
- P2.3: Create admin_users table
- P2.4: Adopt zod for input validation

### P3 — Code Quality
- P3.1: React.lazy() + Suspense for all route-level components
- P3.2: Add loading="lazy" to all product images
- P3.3: Wrap CartContext pricing in useMemo
- P3.4: Remove legacy frontend/src/data/products.ts files

### P4 — Enhancements
- P4.1: Redis caching for product catalog
- P4.2: WebP image conversion with srcSet
- P4.3: Automated tests with Vitest
- P4.4: Google official OAuth library
- P4.5: Supabase Auth for customer sessions

## 24. Glossary

| Term | Definition |
|---|---|
| SiCo Gadwal | Silk-Cotton Gadwal saree — premium handloom from Gadwal, Telangana |
| POS | Point of Sale — in-store billing counter system |
| Cashfree | Indian payment gateway for online + in-store payments |
| payment_session_id | Cashfree token to initialize the payment modal in the browser |
| localStore | File-based JSON persistence in backend/src/database/localStore.js |
| JTI | JWT ID — unique identifier per token, used for revocation |
| HMAC | Hash-based Message Authentication Code — signs admin tokens, verifies webhooks |
| scrypt | Node.js crypto.scryptSync — password hashing algorithm for admin passwords |
| Supabase | PostgreSQL database + file storage + real-time subscriptions as a service |
| bootstrap | Pre-aggregated admin dashboard data loaded on first admin login |
| stock_movements | Immutable audit log of all inventory changes |
| variants | Color/size-specific sub-products with individual SKUs and stock counts |
| HEIC/HEIF | Apple's image format from iPhones — must be converted to JPEG for web |
| idempotent | Operation producing same result even if called multiple times — critical for webhooks |
| RLS | Row Level Security — Supabase PostgreSQL access control per user/role |
| CORS | Cross-Origin Resource Sharing — browser security for cross-domain API access |
| webhook | HTTP callback from Cashfree notifying of payment events asynchronously |
| HSN | Harmonized System of Nomenclature — product code for GST billing in India |
| AWB | Air Waybill — courier shipment tracking number |
