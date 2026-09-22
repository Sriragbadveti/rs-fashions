-- ==============================================================================
-- RS FASHIONS UNIFIED DATABASE SCHEMA (Supabase PostgreSQL)
-- Multi-Device Sync: Web Storefront, Web Admin, Desktop Dashboard & POS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. WEAVE CATEGORIES & HSN CODES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    hsn VARCHAR(50) NOT NULL DEFAULT '5208',
    next_sequence INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS / SAREE INVENTORY VAULT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'SiCo Gadwal Sarees',
    material VARCHAR(100) NOT NULL DEFAULT 'SiCo',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images TEXT[] NOT NULL DEFAULT '{}',
    colors TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    rating NUMERIC(2, 1) DEFAULT 4.8 CHECK (rating >= 1 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    featured BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);

-- ------------------------------------------------------------------------------
-- 3. STOCK MOVEMENTS (IMMUTABLE AUDIT TRAIL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    date VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    color VARCHAR(100) NOT NULL,
    color_slug VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('RESTOCK', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL DEFAULT 'Store Manager',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON public.stock_movements(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. ORDERS & SALES TRANSACTIONS (COUNTER POS & ONLINE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE,
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    shipping_address JSONB,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cgst NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sgst NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(50),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_status VARCHAR(50) NOT NULL DEFAULT 'new',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'gst',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. CRM CUSTOMER PROFILES & LOYALTY TIERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Hyderabad',
    tier VARCHAR(50) DEFAULT NULL,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    birthday VARCHAR(50),
    anniversary VARCHAR(50),
    preferred_weave VARCHAR(100),
    notes TEXT,
    gstin VARCHAR(50),
    google_id VARCHAR(255),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_google ON public.customers(google_id);

-- Safe migrations for existing deployments
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;

-- ------------------------------------------------------------------------------
-- 6. TRACKED ORDERS & PRODUCTION PIPELINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracked_orders (
    id TEXT PRIMARY KEY,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inward', 'outward')),
    title VARCHAR(255) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    party_contact VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    sku_list TEXT[] NOT NULL DEFAULT '{}',
    total_pieces INTEGER NOT NULL DEFAULT 1,
    total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    courier_or_loom_partner VARCHAR(255) NOT NULL,
    current_stage VARCHAR(100) NOT NULL,
    estimated_completion VARCHAR(100) NOT NULL,
    last_update VARCHAR(100) NOT NULL,
    notes TEXT,
    history_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracked_orders_direction ON public.tracked_orders(direction);

-- ------------------------------------------------------------------------------
-- 7. COUPONS & PROMOTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 100,
    times_used INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. STORE SETTINGS & CONFIGURATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. AUTHORIZED SESSIONS & TERMINALS (REAL LOGIN DEVICE TRACKING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    device_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'windows',
    ip_address VARCHAR(100),
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON public.auth_sessions(is_active, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON public.auth_sessions(user_email);

-- ------------------------------------------------------------------------------
-- SEED INITIAL CATEGORIES & PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, hsn, next_sequence)
VALUES 
    ('c1', 'SiCo Gadwal Sarees', 'SGS', '5208', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, category, material, price, original_price, stock, images, colors, tags, rating, review_count, featured, description)
VALUES 
    (
        'midnight-sico-gadwal',
        'Midnight SiCo Gadwal Saree',
        'SiCo Gadwal Sarees',
        'SiCo',
        7999,
        9999,
        8,
        ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop'],
        ARRAY['Midnight Blue', 'Gold Zari'],
        ARRAY['sico', 'gadwal', 'festive', 'zari'],
        4.9,
        18,
        true,
        'Authentic temple-border SiCo Gadwal saree woven with pure SiCo and fine gold zari.'
    ),
    (
        'emerald-sico-gadwal',
        'Emerald SiCo Gadwal Saree',
        'SiCo Gadwal Sarees',
        'SiCo',
        8499,
        11200,
        8,
        ARRAY['https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg'],
        ARRAY['Emerald Green', 'Gold Zari'],
        ARRAY['sico', 'gadwal', 'emerald', 'zari'],
        4.8,
        14,
        true,
        'Rich heritage gold zari border woven on opulent royal emerald green SiCo Gadwal drape.'
    ),
    (
        'rose-sico-gadwal',
        'Rose Pink SiCo Gadwal Saree',
        'SiCo Gadwal Sarees',
        'SiCo',
        4999,
        6499,
        9,
        ARRAY['https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847_1.jpg'],
        ARRAY['Rose Pink', 'Silver Zari'],
        ARRAY['sico', 'gadwal', 'pink', 'pastel'],
        4.7,
        11,
        true,
        'A softly luminous SiCo Gadwal saree designed around graceful drape, delicate colour and timeless elegance.'
    ),
    (
        'ivory-sico-gadwal',
        'Ivory Gold SiCo Gadwal Saree',
        'SiCo Gadwal Sarees',
        'SiCo',
        5899,
        7800,
        20,
        ARRAY['https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217.jpg'],
        ARRAY['Ivory Cream', 'Gold'],
        ARRAY['sico', 'gadwal', 'ivory', 'handloom'],
        4.8,
        22,
        false,
        'Breathable, lightweight and effortlessly graceful SiCo Gadwal handloom weave for celebrations.'
    ),
    (
        'crimson-sico-gadwal',
        'Crimson Temple SiCo Gadwal Saree',
        'SiCo Gadwal Sarees',
        'SiCo',
        6499,
        8500,
        11,
        ARRAY['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop'],
        ARRAY['Crimson Red', 'Pure Gold'],
        ARRAY['sico', 'gadwal', 'temple border', 'bridal'],
        4.8,
        19,
        false,
        'Weightless SiCo Gadwal drape with traditional interlocked temple border and rich pallu.'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_value, max_uses, times_used, is_active)
VALUES
    ('c-festive', 'FESTIVE10', '10% discount on all SiCo Gadwal sarees', 'percentage', 10, 2000, 500, 0, true),
    ('c-welcome', 'WELCOME500', 'Flat ₹500 off on first order above ₹3000', 'fixed', 500, 3000, 1000, 0, true)
ON CONFLICT (id) DO NOTHING;
