-- ==============================================================================
-- RS Fashions Database Schema for Supabase (v2.4 - Full Atelier & POS Suite)
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- Enable UUID Extension
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

INSERT INTO public.categories (id, name, slug, hsn, next_sequence)
VALUES ('c1', 'SiCo Gadwal Sarees', 'SGS', '5208', 1)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS / SAREE VAULT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'SiCo Gadwal Sarees',
    material VARCHAR(100) NOT NULL DEFAULT 'Silk Cotton (SiCo)',
    purchase_price NUMERIC(10, 2) DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 10 CHECK (stock >= 0),
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    colors TEXT[] NOT NULL DEFAULT '{}',
    sizes TEXT[] DEFAULT '{"Free Size"}',
    rating NUMERIC(2, 1) DEFAULT 4.8 CHECK (rating >= 1 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    description TEXT,
    long_description TEXT,
    featured BOOLEAN DEFAULT false,
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
    date VARCHAR(100) NOT NULL,
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

-- ------------------------------------------------------------------------------
-- 4. ORDERS & COMPLETED SALES (POS COUNTER & ONLINE BILLING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_number VARCHAR(50),
    billing_type VARCHAR(20) DEFAULT 'gst' CHECK (billing_type IN ('gst', 'non-gst')),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    shipping_address JSONB,
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(50),
    cgst NUMERIC(10, 2) DEFAULT 0,
    sgst NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'upi',
    payment_provider VARCHAR(50),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
    transaction_id VARCHAR(100),
    payment_link TEXT,
    order_status VARCHAR(50) NOT NULL DEFAULT 'delivered' CHECK (order_status IN ('new', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. PATRONS & CLIENT CRM DIRECTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Hyderabad',
    tier VARCHAR(50) NOT NULL DEFAULT 'Heritage Club' CHECK (tier IN ('Royal Patron', 'Heritage Club', 'Boutique Member')),
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    birthday DATE,
    anniversary DATE,
    preferred_weave VARCHAR(255),
    notes TEXT,
    gstin VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier);

-- ------------------------------------------------------------------------------
-- 6. LOOM & COURIER DISPATCH TRACKING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracked_orders (
    id TEXT PRIMARY KEY,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('OUTWARD_CUSTOMER', 'INWARD_WEAVER')),
    title VARCHAR(255) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    party_contact VARCHAR(30) NOT NULL,
    location VARCHAR(255) NOT NULL,
    sku_list TEXT[] DEFAULT '{}',
    total_pieces INTEGER NOT NULL DEFAULT 1,
    total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    courier_or_loom_partner VARCHAR(255) NOT NULL,
    current_stage VARCHAR(100) NOT NULL,
    estimated_completion VARCHAR(100) NOT NULL,
    last_update TEXT NOT NULL,
    notes TEXT,
    history_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracked_orders_number ON public.tracked_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracked_orders_direction ON public.tracked_orders(direction);

-- ------------------------------------------------------------------------------
-- 7. COUPONS / PROMO CODES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    max_discount_cap NUMERIC(10, 2),
    max_uses INTEGER DEFAULT 100,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. CMS / WEBSITE CONTENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_content (
    section_key VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255),
    subtitle TEXT,
    badge VARCHAR(100),
    image_url TEXT NOT NULL,
    secondary_image_url TEXT,
    link VARCHAR(255),
    meta JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. INITIAL SEED DATA FOR PATRONS & PROMOS
-- ------------------------------------------------------------------------------
INSERT INTO public.customers (id, name, phone, email, city, tier, total_spent, orders_count, birthday, anniversary, preferred_weave)
VALUES
    ('cust-001', 'Shailaja Reddy', '9849012345', 'shailaja.reddy@gmail.com', 'Banjara Hills, Hyderabad', 'Royal Patron', 184500, 7, '1982-09-14', '2006-11-28', 'Ma Inti Bangaram 3 Inch Borders'),
    ('cust-002', 'Dr. Ananya Rao', '9988776655', 'ananya.rao@carehospitals.com', 'Jubilee Hills, Hyderabad', 'Heritage Club', 92400, 4, '1988-12-05', '2015-09-12', 'Vintage Checks'),
    ('cust-003', 'Vani Prasanna', '9123456780', NULL, 'Secunderabad', 'Boutique Member', 38000, 2, '1994-09-16', NULL, 'Gatti Borders')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_value, max_uses, is_active)
VALUES
    ('ROYAL10', '10% off on all royal sarees', 'percentage', 10.00, 1999.00, 500, true),
    ('FESTIVE20', '20% off for festive season orders above ₹4000', 'percentage', 20.00, 4000.00, 200, true),
    ('FIRST500', 'Flat ₹500 off on your first heirloom drape', 'fixed', 500.00, 2999.00, 1000, true)
ON CONFLICT (code) DO NOTHING;
