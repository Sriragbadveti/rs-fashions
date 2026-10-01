-- ==============================================================================
-- RS FASHIONS — ONE-TIME INVOICE NUMBER RESET
-- Renumbers existing numeric invoices 001, 002, 003 ... in the order they were created, and
-- updates everything that points at them (tracking records, stock history).
-- Unpaid/failed leftovers are renamed VOID-... so they stop using up numbers.
-- Non-numeric numbers (RSF-ORD-..., RSF-POS-...) are left alone.
-- Runs in one transaction: if anything errors, nothing changes. Run it ONCE in Supabase > SQL Editor.
-- ==============================================================================
BEGIN;

-- 1. Unpaid / failed online orders are not invoices: free their numbers.
UPDATE public.orders
SET order_number   = 'VOID-' || order_number,
    invoice_number = 'VOID-' || COALESCE(invoice_number, order_number)
WHERE lower(COALESCE(payment_status, '')) IN ('pending', 'failed')
  AND order_number ~ '^[0-9]+$';

-- 2. Old number -> new number, by creation time.
CREATE TEMP TABLE inv_map ON COMMIT DROP AS
SELECT id,
       COALESCE(invoice_number, order_number) AS old_no,
       lpad(row_number() OVER (ORDER BY created_at, id)::text, 3, '0') AS new_no
FROM public.orders
WHERE COALESCE(invoice_number, order_number) ~ '^[0-9]+$';

-- 3. Park on unique temporary values first so renumbering can never collide with itself.
UPDATE public.orders o SET order_number = 'TMP-' || o.id, invoice_number = 'TMP-' || o.id
FROM inv_map m WHERE o.id = m.id;

UPDATE public.tracked_orders t SET id = 'tmp-' || t.id
FROM inv_map m WHERE t.id = 'trk-' || m.old_no;

-- 4. Apply the new numbers everywhere.
UPDATE public.orders o SET order_number = m.new_no, invoice_number = m.new_no
FROM inv_map m WHERE o.id = m.id;

UPDATE public.tracked_orders t SET id = 'trk-' || m.new_no
FROM inv_map m WHERE t.id = 'tmp-trk-' || m.old_no;

UPDATE public.stock_movements s SET reference_number = m.new_no
FROM inv_map m WHERE s.reference_number = m.old_no;

-- 5. Check: should list 001, 002, 003 ... with no gaps.
SELECT invoice_number, customer_name, total, created_at FROM public.orders
WHERE invoice_number ~ '^[0-9]+$' ORDER BY invoice_number;

COMMIT;
