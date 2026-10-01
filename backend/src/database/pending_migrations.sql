-- ==============================================================================
-- RS FASHIONS — PENDING DATABASE MIGRATIONS
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run more than once. Contains NO seed data and changes NO existing rows.
-- Only adds what your live database is missing (checked 2026-10-01).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A. Missing columns on existing tables
-- ------------------------------------------------------------------------------
-- Weaver / loom cost shown in the admin catalog (was silently not saved)
ALTER TABLE public.products  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2);
-- Customer profile fields (street address; Google sign-in link)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_google ON public.customers(google_id);

-- ------------------------------------------------------------------------------
-- B. Reviews / testimonials table (did not exist; reviews were kept in a server file)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name VARCHAR(255),
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_location VARCHAR(255),
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    verified_buyer BOOLEAN NOT NULL DEFAULT true,
    approved BOOLEAN NOT NULL DEFAULT true,
    date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

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
-- 10. SKU REGISTRY (RS0001–RS9999) — safe to re-run
-- Every product and shade-variant SKU is recorded here; the primary key makes duplicate SKUs
-- impossible across all server instances. allocate_skus() hands out numbers atomically and
-- never reuses one (rows are never deleted), so historical orders/stock logs stay unambiguous.
-- Rollback: DROP FUNCTION public.allocate_skus(TEXT, INTEGER); DROP TABLE public.sku_registry;
-- (the backend then falls back to in-process allocation automatically).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sku_registry (
    sku TEXT PRIMARY KEY CHECK (sku ~ '^RS[0-9]{4}$' AND sku <> 'RS0000'),
    product_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sku_registry_product ON public.sku_registry(product_id);
-- Only the backend (service role) may read or write the registry.
ALTER TABLE public.sku_registry ENABLE ROW LEVEL SECURITY;

-- Backfill RS SKUs already in use so they can never be issued again.
INSERT INTO public.sku_registry (sku, product_id)
SELECT id, id FROM public.products
WHERE id ~ '^RS[0-9]{4}$' AND id <> 'RS0000'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.sku_registry (sku, product_id)
SELECT DISTINCT ON (v->>'sku') v->>'sku', e.key
FROM public.settings s,
     jsonb_each(CASE WHEN jsonb_typeof(s.value) = 'object' THEN s.value ELSE '{}'::jsonb END) e,
     jsonb_array_elements(CASE WHEN jsonb_typeof(e.value) = 'array' THEN e.value ELSE '[]'::jsonb END) v
WHERE s.key = 'product_variants'
  AND (v->>'sku') ~ '^RS[0-9]{4}$' AND (v->>'sku') <> 'RS0000'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.sku_registry (sku, product_id)
SELECT DISTINCT sku, sku FROM public.stock_movements
WHERE sku ~ '^RS[0-9]{4}$' AND sku <> 'RS0000'
ON CONFLICT (sku) DO NOTHING;

CREATE OR REPLACE FUNCTION public.allocate_skus(p_product_id TEXT, p_count INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start INTEGER;
    v_result TEXT[] := '{}';
    i INTEGER;
BEGIN
    IF p_count IS NULL OR p_count < 1 OR p_count > 500 THEN
        RAISE EXCEPTION 'INVALID_SKU_COUNT: %', p_count;
    END IF;

    -- Serialise allocation across concurrent requests / server instances.
    PERFORM pg_advisory_xact_lock(hashtext('rs_sku_allocation'));

    SELECT COALESCE(MAX(substring(sku FROM 3)::INTEGER), 0) + 1 INTO v_start FROM public.sku_registry;

    IF v_start + p_count - 1 > 9999 THEN
        RAISE EXCEPTION 'SKU_RANGE_EXHAUSTED: cannot allocate % SKU(s); last issued is RS%',
            p_count, lpad((v_start - 1)::TEXT, 4, '0');
    END IF;

    FOR i IN 0..(p_count - 1) LOOP
        v_result := v_result || ('RS' || lpad((v_start + i)::TEXT, 4, '0'));
    END LOOP;

    INSERT INTO public.sku_registry (sku, product_id)
    SELECT unnest(v_result), COALESCE(NULLIF(p_product_id, ''), 'pending');

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_skus(TEXT, INTEGER) FROM PUBLIC;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.allocate_skus(TEXT, INTEGER) FROM anon, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.allocate_skus(TEXT, INTEGER) TO service_role;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 11. PAYMENT STATE (survives restarts/redeploys) — safe to re-run
-- webhook_events: PRIMARY KEY makes Cashfree webhook de-duplication atomic.
-- pending_sales : counter (POS) carts waiting for their Cashfree payment link to be paid.
-- Only the backend (service role) can read/write these tables.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
    event_id TEXT PRIMARY KEY,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pending_sales (
    order_id TEXT PRIMARY KEY,
    sale JSONB NOT NULL,
    committed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_sales ENABLE ROW LEVEL SECURITY;
