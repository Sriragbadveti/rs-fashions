# RS Fashions — Prioritized Improvement Roadmap

This roadmap categorizes all discovered technical debt, security issues, and architectural flaws into prioritized action items.

---

## P0 — CRITICAL SECURITY (Fix Immediately)
These issues expose the application to immediate risks and must be fixed before the next production deployment.

- **[ ] P0.1: Remove CORS Permissive Fallback**
  - **Location:** `backend/src/server.js` (around line 31)
  - **Issue:** The fallback `callback(null, true)` allows ALL origins, bypassing CORS entirely.
  - **Fix:** Remove the fallback or throw a CORS error for unlisted origins.
- **[ ] P0.2: Enforce ADMIN_JWT_SECRET**
  - **Location:** `backend/src/middleware/adminAuth.js`
  - **Issue:** `AUTH_SECRET` falls back to a hardcoded string if env vars are missing. This allows token forgery.
  - **Fix:** Add a check during server startup to throw a fatal error if `ADMIN_JWT_SECRET` is undefined.
- **[ ] P0.3: Rate Limit Admin Login**
  - **Location:** `backend/src/routes/auth.routes.js`
  - **Issue:** Unlimited login attempts allow brute-forcing the admin password.
  - **Fix:** Add `express-rate-limit` middleware specifically for the `/api/auth/admin-login` endpoint.
- **[ ] P0.4: Reduce JSON Body Limit**
  - **Location:** `backend/src/server.js`
  - **Issue:** `express.json({ limit: '50mb' })` enables Denial of Service (DoS) attacks via massive payloads.
  - **Fix:** Implement `multer` for multipart form data (image uploads) and reduce the global JSON limit to `2mb`.

---

## P1 — HIGH IMPACT (Fix Soon)
These issues affect application reliability, core data integrity, or immediate scalability.

- **[ ] P1.1: Persistent Token Revocation**
  - **Location:** `backend/src/middleware/adminAuth.js`
  - **Issue:** `revokedTokens` is an in-memory Set. Server restarts clear it, reactivating revoked tokens for up to 24 hours.
  - **Fix:** Store revoked token JTIs in a Supabase table (`revoked_tokens`) or Redis.
- **[ ] P1.2: Server-Side Pagination for Admin Views**
  - **Location:** Admin dashboard pages (e.g., `SareeStock.tsx`, `TransactionHistory.tsx`) and corresponding backend controllers.
  - **Issue:** Data is fetched all at once. This will crash the browser and database at scale.
  - **Fix:** Implement `LIMIT` and `OFFSET` in backend Supabase queries and UI pagination controls.
- **[ ] P1.3: Database Indexing**
  - **Location:** `backend/src/database/schema.sql`
  - **Issue:** Missing indexes on frequently queried columns.
  - **Fix:** Add indexes for `products.featured`, `products.trending`, `products.category`, and `orders.payment_status`.
- **[ ] P1.4: Refactor Admin Bootstrap Endpoint**
  - **Location:** `backend/src/controllers/bootstrap.controller.js`
  - **Issue:** Fetches the entire database (products, orders, customers, movements) in a single request on admin login.
  - **Fix:** Break into smaller, lazy-loaded endpoints or aggregate data properly in SQL Views.

---

## P2 — ARCHITECTURAL (Refactor over time)
These are structural issues that make the codebase hard to maintain or expand.

- **[ ] P2.1: Extract Variants from Settings Table**
  - **Location:** `products` and `settings` tables, `inventory.service.js`
  - **Issue:** Product variants are stored as one massive JSONB blob in the `settings` table, making them unqueryable and unbounded.
  - **Fix:** Create a dedicated `product_variants` table (`id`, `product_id`, `color`, `size`, `stock`, `sku`).
- **[ ] P2.2: Consolidate Route Triple-Mounting**
  - **Location:** `backend/src/routes/index.js`
  - **Issue:** The same routes are mounted under `/api/admin/`, `/api/`, and `/`.
  - **Fix:** Restructure routing. Have a single canonical path for each endpoint. Use route-specific middleware arrays instead of duplicating mounts.
- **[ ] P2.3: Dedicated Admin Users Table**
  - **Location:** `settings` table, `admin.service.js`
  - **Issue:** Admin accounts are stored as a JSON array in the settings table.
  - **Fix:** Create an `admin_users` table with proper row-level management.
- **[ ] P2.4: Adopt Input Validation Library**
  - **Location:** All backend controllers
  - **Issue:** Manual `if (!req.body.name) return error` validation is inconsistent and prone to missing fields.
  - **Fix:** Integrate `Zod` or `Joi` middleware for robust schema validation.

---

## P3 — CODE QUALITY & PERFORMANCE
These improvements will enhance the developer experience and client-side performance.

- **[ ] P3.1: React Code Splitting**
  - **Location:** `frontend/src/App.tsx`
  - **Issue:** All 15+ admin pages are eagerly loaded into the main JS bundle, increasing initial load time for regular customers.
  - **Fix:** Use `React.lazy()` and `<Suspense>` for route-level components, especially the `/admin` routes.
- **[ ] P3.2: Lazy Load Product Images**
  - **Location:** `frontend/src/components/product/ProductCard.tsx` and `ProductGallery.tsx`
  - **Issue:** Images load eagerly, eating bandwidth.
  - **Fix:** Add `loading="lazy"` attribute to `<img>` tags outside the initial viewport.
- **[ ] P3.3: Memoize Cart Pricing Calculations**
  - **Location:** `frontend/src/context/CartContext.tsx`
  - **Issue:** Subtotal and discount tiers are recalculated on every render.
  - **Fix:** Wrap the pricing logic inside a `useMemo` hook with dependencies on `items`.
- **[ ] P3.4: Remove Legacy Data Files**
  - **Location:** `frontend/src/data/products.ts` and `frontend/src/pages/data/products.ts`
  - **Issue:** Obsolete static data files confuse developers.
  - **Fix:** Delete them and ensure all components rely on API data.

---

## P4 — ENHANCEMENTS (Future Roadmap)
Features and infrastructure upgrades for a more mature platform.

- **[ ] P4.1: Redis Caching**
  - Use Redis instead of in-memory Node variables for catalog caching, rate limiting, distributed locking, and session storage.
- **[ ] P4.2: WebP Image Delivery**
  - Update `upload.controller.js` to generate WebP alongside JPEG, and use `<picture>` with `srcset` on the frontend for faster image delivery.
- **[ ] P4.3: Automated Testing**
  - Introduce `Vitest` and `React Testing Library` for critical flows (Cart pricing, Auth logic, Webhook handler).
- **[ ] P4.4: Official Google Auth SDK**
  - Replace the direct HTTP call to the Google `tokeninfo` endpoint with the official `google-auth-library`.
- **[ ] P4.5: Supabase Auth Migration**
  - Migrate customer sessions from pure `localStorage` to official Supabase Authentication for better security and cross-device sync.
