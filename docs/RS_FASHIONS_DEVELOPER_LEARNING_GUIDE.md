# RS Fashions — Developer Learning Guide

A practical, stage-by-stage guide to understanding your own codebase.

> Use this guide alongside RS_FASHIONS_COMPLETE_CODEBASE_GUIDE.md (in the project root).

---

## STAGE 1: Understanding the Project Structure

### What to study
Understand what kind of application this is and how the codebase is organized before writing a single line of code.

### Files to open
1. `/rsfashions/package.json` — root monorepo config
2. `/rsfashions/frontend/package.json` — all frontend dependencies and their versions
3. `/rsfashions/backend/package.json` — all backend dependencies
4. `/rsfashions/vercel.json` — deployment configuration
5. `/rsfashions/backend/src/server.js` — backend entry point (read first)
6. `/rsfashions/frontend/src/main.tsx` — frontend entry point (read second)

### What these files tell you
- `package.json` (root): Uses npm workspaces. Two sub-projects (frontend, backend) treated as one monorepo. Run `npm run dev` to start frontend, `npm run dev:backend` for backend.
- `vercel.json`: Frontend is a React SPA deployed to Vercel. The rewrite rule `/(.*) → /index.html` means React Router handles all routing on the client.
- `backend/package.json`: Backend uses ES modules (`"type": "module"`). Main entry is `src/server.js`. Start with `node src/server.js`.
- `server.js`: Express app. Registers middleware in order: CORS → JSON body-parser → requestLogger → routes → error handler.
- `main.tsx`: React app. Wrapped in BrowserRouter → CartProvider → ScrollToTop → App.

### Questions to answer after this stage
1. What command starts the frontend dev server?
2. What command starts the backend?
3. What port does the backend run on?
4. What URL does the frontend use to talk to the backend in development?
5. What is the admin login URL path?
6. Why does vercel.json have a rewrite rule for all routes?
7. What does `"type": "module"` mean for the backend?

### Exercise
- Run `grep -r "API_BASE" frontend/src/` and trace where API_BASE is defined and how it resolves in development vs production.
- Look at `frontend/src/config/routes.ts` — what is `ADMIN_SECRET_PATH`? Why is it not `/admin`?

---

## STAGE 2: Understanding the Frontend

### What to study
- How React Router defines all the pages
- What the CartContext does and how it persists data
- How the storefront (customer pages) works
- How the admin dashboard (protected pages) works

### Files to open (in this order)
1. `frontend/src/App.tsx` — all route definitions; understand which paths lead where
2. `frontend/src/context/CartContext.tsx` — most important global state
3. `frontend/src/components/layout/SiteLayout.tsx` — storefront wrapper (Navbar + Outlet)
4. `frontend/src/pages/Home.tsx` — customer homepage; study its sub-components
5. `frontend/src/components/home/Hero.tsx` — GSAP animation example
6. `frontend/src/components/home/TrendingProducts.tsx` — data fetching from API
7. `frontend/src/pages/Product.tsx` — single product detail page
8. `frontend/src/components/product/ProductInfo.tsx` — add-to-cart logic
9. `frontend/src/pages/Cart.tsx` — uses CartContext
10. `frontend/src/pages/Admin.tsx` — admin shell (verify token on mount)
11. `frontend/src/pages/Dashboard.tsx` — admin sidebar + sub-page routing
12. `frontend/src/pages/SareeStock.tsx` — product management UI

### Important functions to understand

**CartContext.tsx:**
- `CartProvider` — wraps the app; initializes cart from localStorage
- `useCart()` hook — gives access to cart state from any component
- `addToCart(product, quantity, color, size)` — merges into existing item or creates new
- The offer tier calculation (subtotal tiers: 2 items→5%, 3→10%, 5→15%)

**Admin.tsx:**
- The `useEffect` that calls `/api/auth/admin-verify` — this is how the app checks if your stored admin token is still valid
- Conditional render: `!currentUser ? <Login> : <Dashboard>`

**TrendingProducts.tsx (example of data fetching pattern):**
- `useEffect(() => { fetch(API_BASE + '/catalog/products')... }, [])` pattern
- How loading state and error handling are managed locally

### Questions to answer
1. Which pages are inside `<SiteLayout>` and which are not?
2. What happens when a user visits `/admin` (not `/admin-7f9a2b8e`)?
3. Where is the cart state stored when the page refreshes?
4. How does the CartContext know when to apply a discount?
5. What does the `stableOrderNumberRef` in Checkout.tsx prevent?
6. When Admin.tsx mounts, what API call does it make and why?
7. How does QuickPay.tsx know the amount to display?

### Exercise
- Add `console.log(items)` inside the CartProvider render function. Add a product to the cart and observe when it re-renders.
- Look at the `useEffect` at the top of `Admin.tsx`. What happens if the fetch to `/api/auth/admin-verify` fails due to network error? (Check the `.catch` handler.)
- Find the `loadCashfreeScript` function in `Checkout.tsx`. When is it called and what does it do?

---

## STAGE 3: Understanding the Backend

### What to study
- How Express is configured and what middleware does
- How routes are organized
- How controllers handle requests
- How Supabase and localStore interact

### Files to open (in this order)
1. `backend/src/server.js` — Express setup, middleware registration
2. `backend/src/routes/index.js` — critical: understand the public vs. protected route separation
3. `backend/src/middleware/adminAuth.js` — token generation, verification, revocation
4. `backend/src/middleware/errorHandler.js` — centralized error handling
5. `backend/src/middleware/requestLogger.js` — request logging
6. `backend/src/config/env.js` — how environment variables are cleaned and accessed
7. `backend/src/config/supabase.js` — two Supabase clients explained
8. `backend/src/controllers/catalog.controller.js` — study getProducts and createProduct
9. `backend/src/utils/response.js` — successResponse and errorResponse helpers

### Important functions to understand

**routes/index.js:**
- The `adminRouter` variable — how it has `requireAdminAuth` applied once for all sub-routes
- The **triple-mounting pattern** — same routes mounted under /api/admin/, /api/, AND / — this is a known architectural issue
- Public routes (catalog read, payments) vs protected routes (catalog write, inventory management)

**adminAuth.js:**
- `generateAdminToken(payload)` — understand the header.claims.signature structure
- `verifyAdminToken(token)` — the three failure conditions (revoked, invalid signature, expired)
- `requireAdminAuth(req, res, next)` — Express middleware pattern

**catalog.controller.js:**
- `getProducts` — understand the cache-first pattern: `cachedProducts && Date.now() - lastCatalogFetch < CACHE_TTL` → return cache
- `createProduct` — understand why it calls `uploadImageToSupabaseStorage` BEFORE inserting to Supabase
- `invalidateCatalogCache()` — why is this called after every write operation?

**localStore.js:**
- `readJson(filename, defaultValue)` — try-catch around file read; returns default if file missing
- `writeJson(filename, data)` — synchronous file write to `backend/src/database/data/`
- `saveProductToStore(product)` — finds existing by ID and updates, or unshift to front
- All the `getProductsFromStore`, `saveOrderToStore`, etc. follow the same pattern

### Questions to answer
1. What HTTP methods does the CORS middleware allow?
2. What happens when a request reaches a protected route without an Authorization header?
3. What is the order of middleware applied to every request?
4. Where does `req.adminUser` get set? In which file and which function?
5. How does `getProducts` decide whether to use the cache or hit Supabase?
6. What does `invalidateCatalogCache()` actually do?
7. If Supabase is unreachable, which file does `createProduct` still write to?

### Exercise
- Start the backend locally. Make a `curl -X GET http://localhost:5001/api/health` request. Read the response. Now read `server.js` to see where this route is defined.
- Make a `curl -X POST http://localhost:5001/api/admin/catalog/products -H "Content-Type: application/json" -d '{"name":"test"}'` without an auth header. What response do you get? Find where that error response is generated.
- Read `backend/src/utils/response.js`. What shape do all successful API responses have? What about errors?

---

## STAGE 4: Understanding the Database

### What to study
- What tables exist and why
- How products, orders, and customers relate to each other
- How the dual-persistence system (Supabase + localStore) works
- Why variants are stored the way they are

### Files to open (in this order)
1. `backend/src/database/schema.sql` — the complete PostgreSQL schema
2. `backend/src/database/localStore.js` — file-based fallback system
3. `backend/src/database/seed.js` — initial data (5 sample sarees)
4. `backend/src/database/data/` directory — look at the actual JSON files created at runtime
5. `backend/src/services/inventory.service.js` — `deductStockForItem` (understand multi-step stock deduction)

### Key architectural decisions to understand

**1. The settings table as a key-value store:**
The settings table stores many different things under different key names:
- `color_palette` → JSON array of colors
- `product_variants` → JSON object mapping product IDs to variant arrays
- `admin_accounts` → JSON array of admin credentials with hashed passwords
- `store_info` → business configuration

This is flexible but not ideal for large datasets.

**2. Product ID format:**
Product IDs are human-readable strings like `midnight-sico-gadwal` or `SGS-003`. This is intentional — URLs like `/product/midnight-sico-gadwal` are readable. But it means IDs can collide if not carefully managed.

**3. Orders items as JSONB:**
The `items` column in orders is a JSONB array. This means you can't easily query "how many times was product X ordered" without a JSONB operation. It was chosen for flexibility over queryability.

**4. Denormalized category in products:**
The `category` column in products stores the category name as a string (e.g., "SiCo Gadwal Sarees"), not a foreign key to the categories table. This means if you rename a category, you have to update all products manually.

### Questions to answer
1. What are the indexes defined in schema.sql? What columns are missing indexes?
2. What happens if you delete a product — does it also delete its stock movements?
3. How does the system prevent two products from having the same ID?
4. What does `deductStockForItem` do if it can't find the product in Supabase?
5. How are webhook events deduplicated across server restarts?
6. What is the `auth_sessions` table used for?
7. If both Supabase write AND localStore write are attempted, what happens if the localStore write fails?

### Exercise
- Open `backend/src/database/data/products.json` (after running the backend once). Compare a record there to the products table schema in `schema.sql`. What fields exist in localStore that aren't in the DB schema?
- In `localStore.js`, find the `saveProductToStore` function. What happens if you call it with the same product ID twice?
- Read the `deductStockForItem` function in `inventory.service.js`. Count how many Supabase queries it might make to find a single product. Is this efficient?

---

## STAGE 5: Understanding the Complete Request Lifecycle

### What to study
Trace a complete request from frontend to backend to database and back.

### Exercise 1: GET /api/catalog/products (Read path)

Trace this request completely:

1. **Where does the fetch call originate?** (Search for "catalog/products" in the frontend)
2. **How does API_BASE resolve?** (frontend/src/config/api.ts)
3. **Which route handles it?** (backend/src/routes/index.js and catalog.routes.js)
4. **Which controller function runs?** (catalog.controller.js → getProducts)
5. **Is there a cache?** (cachedProducts variable — when is it populated? When does it expire?)
6. **What Supabase query runs?** (supabase.from('products').select('*'))
7. **What does the fallback look like?** (localStore.getProductsFromStore())
8. **How are variants merged?** (look for getPersistentVariantsMap call in getProducts)
9. **What does the response look like?** (successResponse — what shape does it return?)
10. **How does the frontend parse it?** (json.products or json.data?.products)

### Exercise 2: POST /api/auth/admin-login (Auth path)

Trace admin login:

1. Where is the login form? (frontend/src/pages/Login.tsx)
2. What data is sent in the request body?
3. Which route receives it? (auth.routes.js → adminLogin)
4. Where is authenticateAdmin called? (auth.controller.js)
5. How does authenticateAdmin load admin accounts? (admin.service.js → getAuthorizedAdmins)
6. Where are those accounts stored? (Supabase settings table, key: admin_accounts)
7. How is the password verified? (admin.service.js → verifyPassword → crypto.scryptSync → timingSafeEqual)
8. What is returned by generateAdminToken? (token string in format header.claims.signature)
9. Where does the frontend store it? (adminSession.ts → localStorage 'rs_admin_session')
10. What does the next request look like with the token? (Authorization: Bearer <token> header)

### Questions to answer
1. What happens if the Supabase products query returns an error?
2. What does `timingSafeEqual` prevent that a normal string comparison `===` doesn't?
3. If the admin account list is cached in memory for 5 minutes, what's the worst case for a deleted admin?
4. How does the frontend know to send the Authorization header? (Search for getAdminToken in the codebase)

---

## STAGE 6: Understanding the Business Workflows

### What to study
The two most important workflows: creating a product (admin) and making a payment (customer).

### Workflow 1: Admin Creates a Saree Product

**Step-by-step trace:**

1. Open `frontend/src/pages/SareeStock.tsx`
2. Find the form submission handler (search for "createProduct" or "handleSubmit" or the POST call)
3. Find what data is collected from the form
4. Find where images are processed before sending
5. Trace the API call: which endpoint? what body?
6. Open `backend/src/routes/catalog.routes.js` — which function handles POST /api/admin/catalog/products?
7. Open `backend/src/controllers/catalog.controller.js` → `createProduct` function
8. Trace: ID generation → image upload loop → Supabase insert → localStore save → cache invalidation → response

**Questions:**
- What format do images need to be in when sent to the backend?
- What happens if the Supabase image upload fails? Does the product still get created?
- What triggers category.next_sequence to increment?
- Why does createProduct call `invalidateCatalogCache()` at the end?

### Workflow 2: Customer Checkout with Cashfree

**Step-by-step trace:**

1. Open `frontend/src/pages/Checkout.tsx`
2. Find `stableOrderNumberRef` — why is it important? (hint: what happens without it on re-renders?)
3. Find the POST to `/api/billing/pos-checkout` — what data is sent?
4. Find the POST to `/api/payments/cashfree/create-order` — what data is sent?
5. Find `loadCashfreeScript()` — when is it called? What does it do to the DOM?
6. Open `backend/src/services/cashfree.service.js` → `createCashfreeOrder` — what Cashfree API does it call?
7. Find `payment_session_id` — how does the frontend use this?
8. After payment: find the verify call → `backend/src/controllers/payments.controller.js` → `verifyCashfreePayment`
9. Open `handleCashfreeWebhook` — understand the signature verification and idempotency check

**Questions:**
- What does `loadCashfreeScript` check before adding the script tag?
- What is the order: record sale first or create payment order first?
- What is the `returnUrl` parameter used for in the Cashfree order?
- How does the webhook know which product stock to deduct?

---

## STAGE 7: Understanding Authentication and Payments

### Authentication Deep Dive

**Read these files:**
1. `backend/src/middleware/adminAuth.js` — all 4 exported functions
2. `backend/src/services/admin.service.js` — all 7 exported functions
3. `frontend/src/utils/adminSession.ts` — how admin session is stored/retrieved
4. `frontend/src/utils/userSession.ts` — customer session storage (complex!)

**Key concepts to understand:**

**scrypt password hashing:**
```
hashPassword("mypassword") produces: "saltHex:derivedKeyHex"
verifyPassword("mypassword", "saltHex:derivedKeyHex") → true/false
```
The salt prevents rainbow table attacks. scryptSync is slow by design (resistance to brute-force).

**Custom JWT structure:**
```
TOKEN = base64url({"alg":"HS256","typ":"JWT"}) 
      + "." 
      + base64url({id, name, email, role, iat, exp, jti})
      + "."
      + HMAC-SHA256(header + "." + claims, AUTH_SECRET)
```

**Token revocation:** The `revokedTokens` Set and `activeAdminSessions` Map are in-memory. What are the implications for production?

**Questions:**
1. What is the difference between `timingSafeEqual` and `===` for comparing signatures?
2. Why is the admin token stored in localStorage and not a cookie?
3. What's the maximum time a revoked admin token remains valid after server restart?
4. Why does `authenticateAdmin` call `saveAuthorizedAdmins` even on successful login?
5. In `userSession.ts`, how many localStorage keys does `saveAddress` write to?

### Payment Deep Dive

**Read these files:**
1. `backend/src/services/cashfree.service.js` — all Cashfree API calls
2. `backend/src/controllers/payments.controller.js` — all payment handlers
3. `frontend/src/pages/Checkout.tsx` — frontend payment integration
4. `frontend/src/pages/QuickPay.tsx` — POS payment page

**Key concepts to understand:**

**Two payment flows:**
- Online checkout: frontend → create-order → SDK → redirect → verify
- POS billing: admin → create-payment-link → share URL → QuickPay → SDK → webhook

**Idempotency:** Why is it critical for webhooks? What happens without it? (Hint: Cashfree may send the same webhook multiple times)

**Questions:**
1. What does `verifyCashfreeWebhookSignature` verify exactly?
2. What is the `posKey` variable in `createCashfreePaymentLink` and how does the lock work?
3. How does the system know which pending POS sale to commit when the webhook arrives?
4. What is `CASHFREE_MOCK_BENCHMARK`? When would you use it?
5. If `ENV.CASHFREE.APP_ID` is empty, what does `createCashfreeOrder` return?

---

## STAGE 8: Understanding Deployment and Infrastructure

### What to study
How the application runs in production.

### Files to open
1. `rsfashions/vercel.json` — frontend deployment
2. `backend/.env.example` — required environment variables
3. `backend/src/config/env.js` — how env vars are processed

### Deployment Architecture

```
User Browser
    |
    ↓ HTTPS
Vercel CDN
    (serves frontend/dist/ static files)
    (all routes → index.html via rewrite)
    |
    ↓ API calls (HTTPS)
Render.com (rs-fashions.onrender.com)
    (runs: node backend/src/server.js)
    |
    ↓ Supabase Client (HTTPS)
Supabase (supabase.co)
    (PostgreSQL + Storage)
    |
    ↓ API calls
Cashfree (api.cashfree.com)
    (Payment processing)
```

### Environment Variables Required

**Backend (must be set on Render):**
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (bypasses RLS!)
- `SUPABASE_ANON_KEY` — anon/public key
- `ADMIN_EMAIL` — primary admin email
- `ADMIN_PASSWORD` — primary admin password
- `ADMIN_JWT_SECRET` — secret for signing admin tokens (CRITICAL — use a long random string)
- `CASHFREE_APP_ID` — Cashfree application ID
- `CASHFREE_SECRET_KEY` — Cashfree secret key
- `CLIENT_URL` — your frontend URL (e.g., https://rsfashions25.com)
- `BACKEND_URL` — your backend URL (e.g., https://rs-fashions.onrender.com)

**Frontend (set in Vercel):**
- `VITE_API_BASE_URL` — your backend URL (e.g., https://rs-fashions.onrender.com)
- `VITE_SUPABASE_URL` — your Supabase project URL (for browser client)
- `VITE_SUPABASE_ANON_KEY` — anon key (for browser client)

### Questions to answer
1. Why are there TWO Supabase keys (service role + anon)?
2. What's the difference between what the backend Supabase client can do vs the frontend client?
3. Why must `CLIENT_URL` and `BACKEND_URL` be set correctly? Where are they used?
4. If `ADMIN_JWT_SECRET` is not set, what does the backend fall back to? Why is this dangerous?
5. What does Render's free tier sleep after inactivity? How does this affect first API response time?

---

## STAGE 9: Understanding Performance and Scalability

### What to study
Current performance characteristics and where the application will struggle as it grows.

### Current state (as of today)

**What works fine at current scale:**
- 100-200 products in the catalog — no performance issues
- 10-50 admin users — no concurrency issues
- Single Render instance — no scaling concerns yet
- Supabase free tier — adequate for current traffic

**What will break at scale:**

**1. Admin bootstrap endpoint (`/api/admin/bootstrap/`):**
Currently loads ALL products + ALL orders + ALL customers + ALL stock movements in one request. At 10,000 records each, this will take 10+ seconds.

**Measure it:** Check the Network tab in browser DevTools when you load the admin dashboard. How long does the bootstrap request take?

**2. Client-side product filtering in Shop.tsx:**
The shop page downloads all products from the API and filters them in the browser. With 500+ products, this means 500 products transferred over the network even if you're only showing 20.

**Measure it:** Open DevTools → Network → load /shop → look at the products API response size.

**3. No image optimization:**
Product images are served as Supabase Storage URLs. No WebP, no CDN edge optimization, no lazy loading. Each product card loads its image immediately.

**Measure it:** Open DevTools → Network → Images. Look at the size of product images.

**4. Cart context re-renders:**
CartContext's pricing calculation runs on every render. Look at the `finalSubtotal` calculation — it iterates through all items and applies discount logic without `useMemo`.

### Practical Exercise: Performance Audit

1. Open Chrome DevTools → Lighthouse tab
2. Run a performance audit on `/` (homepage)
3. Run a performance audit on `/shop`
4. Note: Largest Contentful Paint, Total Blocking Time, Bundle size
5. Run a performance audit on the admin dashboard

**Questions:**
1. What percentage of the JavaScript bundle is actually needed for the homepage?
2. At what number of products would the Shop page likely show visible lag?
3. If 100 customers all load the homepage simultaneously, how many Supabase queries happen?
4. What is the catalog cache TTL? How long does each cache period last?
5. Why is the payment attempts deduplication done via a JSON file instead of Redis?

---

## Quick Reference: Key Patterns Used Throughout the Codebase

### Pattern 1: Try Supabase, Fall Back to LocalStore
```javascript
if (supabase) {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase notice:', err.message);
  }
}
// Fall back to local JSON file
return getProductsFromStore();
```

### Pattern 2: successResponse / errorResponse
```javascript
return successResponse(res, { products }, 'Products retrieved', 200);
return errorResponse(res, 'Product not found', 404);
```

### Pattern 3: Cache-First Pattern
```javascript
const now = Date.now();
if (cachedData && now - lastFetch < CACHE_TTL_MS) {
  return successResponse(res, { data: cachedData }, 'Cached');
}
// ... fetch from Supabase ...
cachedData = freshData;
lastFetch = now;
```

### Pattern 4: Environment-Aware API Base
```javascript
// frontend/src/config/api.ts
export const API_BASE = resolvedBackendUrl.endsWith('/api')
  ? resolvedBackendUrl
  : `${resolvedBackendUrl}/api`;
```

### Pattern 5: Layered Fallback in StoreService (Frontend)
```javascript
// Try backend API first
// If fails, try Supabase directly from browser
// If fails, fall back to localStorage
```

---

## Checklist: What You Should Be Able to Do After Each Stage

**Stage 1:** ✓ Start both frontend and backend locally ✓ Explain the monorepo structure ✓ Know what API_BASE resolves to in different environments

**Stage 2:** ✓ Explain which routes are inside SiteLayout ✓ Add an item to cart and trace what happens in CartContext ✓ Explain how Admin.tsx decides to show Login vs Dashboard

**Stage 3:** ✓ Trace a request through middleware → route → controller → response ✓ Explain the three failure conditions in verifyAdminToken ✓ Explain what invalidateCatalogCache does

**Stage 4:** ✓ List all 9 Supabase tables and their purpose ✓ Explain why variants are in the settings table ✓ Describe what happens when Supabase is unreachable

**Stage 5:** ✓ Trace GET /api/catalog/products from fetch call to rendered product card ✓ Explain the dual-persistence pattern with code references ✓ Explain what timingSafeEqual prevents

**Stage 6:** ✓ Trace the complete product creation flow ✓ Trace the complete checkout + payment flow ✓ Explain what happens between webhook receipt and stock deduction

**Stage 7:** ✓ Explain the scrypt hash format ✓ Explain what jti is used for ✓ Explain the two Cashfree payment modes

**Stage 8:** ✓ List all required environment variables ✓ Explain the difference between service-role and anon Supabase keys ✓ Explain the deployment architecture diagram

**Stage 9:** ✓ Run a Lighthouse audit and interpret results ✓ Identify the three biggest performance bottlenecks ✓ Explain what would break first as the catalog grows to 1000+ products
