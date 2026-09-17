# Statement of Work (SOW)
## RS Fashions E-Commerce Storefront & Retail ERP Platform

---

**Project Title:** RS Fashions Unified Storefront, Real-Time Order Hub & Patron Session Management  
**Client / Brand:** RS Fashions (SiCo Gadwal Sarees & Heritage Handlooms)  
**Version:** 1.0.0  
**Effective Date:** September 2026  
**Status:** Implemented & Verified  

---

## 1. Executive Summary & Project Purpose

RS Fashions operates a unified digital commerce ecosystem encompassing a luxury customer-facing storefront, an in-store POS (Point of Sale), inventory management, and CRM ledger systems. 

Previously, when a customer authenticated or placed an order, their identity was ingested into the internal CRM database without syncing to the public-facing storefront. Consequently, patrons were greeted as anonymous visitors, lacked visibility into their order history, could not track shipments, and had no automated session persistence.

This project delivers:
1. **Patron Identity & Session Sync:** Live storefront navbar and mobile drawer displaying authenticated customer profile, and account menu.
2. **30-Day Inactivity Sliding Session Protocol:** Persistent, secure client-side authentication valid for 30 days. Any user activity (clicks, navigation, keystrokes) slides the expiration window forward by 30 days; 30 continuous days of inactivity triggers automated, graceful session termination.
3. **Enterprise-Grade Duplicate Account Prevention:** Strict validation across phone numbers (10-digit Indian standard) and email addresses at registration, preventing duplicate records in both the CRM database and storefront auth.
4. **Amazon/Flipkart/Swiggy-Grade Order Hub (`/account` and `/orders`):** Comprehensive patron self-service portal featuring:
   - Visual 5-step order progress stepper (*Order Confirmed* -> *In Production / Weaving* -> *Quality Assured* -> *Shipped & Dispatched* -> *Delivered*).
   - Dynamic carrier tracking links for top Indian logistics partners (BlueDart, Delhivery, DTDC, India Post, Shadowfax, Ekart, Xpressbees) resolving 1-click tracking using the admin-assigned AWB number.
   - Thermal & GST-compliant printable tax invoices.
   - Saved delivery addresses management with auto-fill at checkout.
   - Saved payment instruments (UPI IDs, masked cards).
   - Order history with 1-click reorder ("Buy Again") functionality.
5. **Codebase Sanitization & System Hardening:** Purge of redundant and unreferenced files, bug fixes in customer billing lookups, cross-platform image optimization, and CORS origin hardening.

---

## 2. Architectural Overview

### 2.1 System Architecture

```
                                  +-------------------------------------------------+
                                  |                 CLIENT BROWSER                  |
                                  |    React 19 + TypeScript + Vite + Tailwind CSS   |
                                  +-----------------------+-------------------------+
                                                          |
                                      +-------------------+-------------------+
                                      |                                       |
                                      v                                       v
                     +----------------------------------+   +----------------------------------+
                     |         REST API Client          |   |       Supabase Client SDK        |
                     |  (Backend Node.js / Express)     |   |   (Direct Cloud Sync / Realtime) |
                     +----------------+-----------------+   +-----------------+----------------+
                                      |                                       |
                                      v                                       v
                    +-------------------------------------+  +---------------------------------+
                    |     Express.js API Engine           |  |     Supabase PostgreSQL DB      |
                    |  - CRM Controller (Duplicate Check) |  |  - customers table              |
                    |  - Sales Controller (AWB & Orders)  |  |  - orders table                 |
                    |  - Billing Controller (Tax Invoices)|  |  - inventory table              |
                    +-----------------+-------------------+  +---------------------------------+
                                      |                                       ^
                                      +---------------------------------------+
```

### 2.2 Technology Stack

| Layer | Technologies / Frameworks |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite 8.2, Tailwind CSS v4, Lucide React, Framer Motion |
| **State & Session** | LocalStorage Sliding Window, Custom Broadcast Channel / Events (`rs_user_session_changed`), React Context |
| **Backend API** | Node.js 20+, Express.js, CORS, Multer, Sharp (Image Processing) |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Realtime Channels |
| **Deployment Target**| Vercel (Frontend SPA), Render / Railway / Node VPS (Backend API) |

---

## 3. Detailed Scope of Work

### 3.1 User State & 30-Day Sliding Inactivity Session
- **Persistence Storage:** Session stored under `rs_fashions_user_session` in `localStorage`.
- **Sliding Window:** Configured with `SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000` (30 calendar days).
- **Activity Listeners:** Debounced event listeners capture `mousedown`, `keydown`, `touchstart`, and `scroll`. Every qualifying event extends `expiresAt = Date.now() + SESSION_TTL_MS`.
- **Expired Session Invalidation:** When `Date.now() > session.expiresAt`, `getUserSession()` purges storage and triggers state updates across open browser tabs via `rs_user_session_changed` event.
- **Navbar & Drawer Representation:**
  - Authenticated: Displays customer avatar badge, initial, formatted first name, order shortcuts, and a secure 'Sign Out' action.
  - Guest: Displays 'Sign In' button leading directly to `/login`.

### 3.2 Duplicate Account Prevention Protocol
- **Dual-Layer Validation:**
  - **Backend:** `GET /api/crm/check-exists?phone={phone}&email={email}` queries Supabase `customers` table with sanitized 10-digit phone regex and lowercased email. If a match is found, the server rejects registration with HTTP 409 Conflict.
  - **Frontend:** Pre-submission check in `Auth.tsx` flags existing accounts with an immediate inline error before creating new records.

### 3.3 Real-Time Order Tracking & Customer Hub (`/account`)
- **Visual Status Stepper:** 5-state lifecycle with progress bar, active pulse glow, and status metadata:
  1. *Order Confirmed*
  2. *In Production / Weaving*
  3. *Quality Assured*
  4. *Shipped & Dispatched*
  5. *Delivered*
- **Carrier Logistics Integration:** Dynamic tracking URL generation supporting:
  - **BlueDart:** `https://www.bluedart.com/tracking?awb={awb}`
  - **Delhivery:** `https://www.delhivery.com/track/package/{awb}`
  - **DTDC:** `https://www.dtdc.in/tracking/shipment-tracking.asp?shipmentNo={awb}`
  - **India Post:** `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`
  - **Shadowfax, Ekart, Xpressbees:** Dedicated tracking portals.
- **Self-Service Order Management:**
  - Copy AWB tracking number with visual feedback.
  - 1-Click 'Track on Courier Website' redirect in a secure new tab.
  - Instant Reorder ('Buy Again'): Adds ordered saree with matching specifications directly into `CartContext`.
  - GST / Tax Invoice Print View: Clean, thermal-receipt formatted invoice including item breakdown, CGST/SGST/IGST, payment mode, and order reference.
- **Address Book & Payment Methods:**
  - Multiple saved delivery addresses (Home, Work, Other) with default address toggle.
  - Auto-injection of default address into the `/checkout` flow.
  - Saved UPI IDs and masked card references.

---

## 4. Module Breakdown & Deliverables

| Deliverable | Path | Status |
|---|---|---|
| User Session Utility | `frontend/src/utils/userSession.ts` | Completed |
| Patron Account & Tracking Page | `frontend/src/pages/Account.tsx` | Completed |
| Navigation Header & Badge | `frontend/src/components/layout/Navbar.tsx` | Completed |
| Mobile Navigation Drawer | `frontend/src/components/layout/MobileMenu.tsx` | Completed |
| Auth & Registration Pages | `frontend/src/pages/Auth.tsx`, `frontend/src/pages/Login.tsx` | Completed |
| Checkout Prefill & Address Save | `frontend/src/pages/Checkout.tsx` | Completed |
| Supabase Storefront Client | `frontend/src/services/supabase.ts` | Completed |
| CRM Duplicate Check API | `backend/src/controllers/crm.controller.js` | Completed |
| Sales & Customer Orders API | `backend/src/controllers/sales.controller.js` | Completed |
| Billing Customer Lookup Fix | `backend/src/controllers/billing.controller.js` | Completed |
| Cross-Platform Image Optimizer | `backend/scripts/optimize_existing_images.js` | Completed |
| Codebase Cleanup | Purged `src/` and `frontend/src/components/admin/` | Completed |

---

## 5. API Contracts & Data Specifications

### 5.1 CRM Duplicate Verification
- **Endpoint:** `GET /api/crm/check-exists`
- **Query Parameters:**
  - `phone` (string, required): 10-digit mobile number
  - `email` (string, optional): Email address
- **Response (200 OK):**
```json
{
  "exists": true,
  "matchType": "phone",
  "message": "A customer with this phone number already exists."
}
```

### 5.2 Customer Order History
- **Endpoint:** `GET /api/sales/customer-orders`
- **Query Parameters:**
  - `phone` (string, optional)
  - `email` (string, optional)
- **Response (200 OK):**
```json
{
  "success": true,
  "orders": [
    {
      "id": "RSF-2026-0891",
      "createdAt": "2026-09-12T10:30:00Z",
      "status": "shipped",
      "awbNumber": "BD789456123IN",
      "courierPartner": "BlueDart",
      "trackingUrl": "https://www.bluedart.com/tracking?awb=BD789456123IN",
      "totalAmount": 9998,
      "paymentMethod": "UPI",
      "paymentStatus": "Paid",
      "items": [
        {
          "id": "saree-01",
          "name": "Kupadam Silk Gadwal Saree",
          "color": "Royal Crimson",
          "quantity": 1,
          "price": 9998
        }
      ]
    }
  ]
}
```

---

## 6. Acceptance Criteria & Verification Protocol

1. **Session Lifespan & Slide:**
   - [x] Initial login creates a session with `expiresAt` equal to 30 days in the future.
   - [x] Mouse/touch activity within the 30-day period successfully resets `expiresAt` to 30 days from that moment.
   - [x] Expired sessions immediately revert UI to guest state on any subsequent load.
2. **Duplicate Prevention:**
   - [x] Attempting to register with an existing phone or email returns a descriptive rejection modal/message.
3. **Tracking & Logistics:**
   - [x] When admin assigns an AWB number and courier name, the customer orders page displays a clickable link resolving to the carrier tracking page.
   - [x] Stepper visually indicates current status with correct timeline order.
4. **Build & Syntax Integrity:**
   - [x] `npm --prefix frontend run build` completes with 0 errors (TypeScript strict check passed).
   - [x] Backend syntax verified with `node --check` across all modified controllers and routes.

---

## 7. Sign-Off & Approval

This document represents the complete, verified scope of work delivered for the RS Fashions platform modernization.

| Stakeholder | Role | Date |
|---|---|---|
| RS Fashions Technical Lead | Project Engineering | September 2026 |
| RS Fashions Product Management | Storefront & Retail Operations | September 2026 |