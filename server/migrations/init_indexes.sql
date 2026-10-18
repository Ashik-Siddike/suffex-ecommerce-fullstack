-- Database Migration & Indexing Setup for PostgreSQL 18
-- Ensures authentication columns and high-performance btree indexes exist

-- 1. Upgrade 'users' table to support credentials, roles, and status
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Upgrade 'orders' table to link with authenticated user accounts
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. High-Performance Database Indexes
-- Index for category-based filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);

-- Index for price-based sorting (asc/desc)
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);

-- Index for customer phone lookup during order tracking
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);

-- Index for customer order history by user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- Index for coupon code validation and checkout lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
