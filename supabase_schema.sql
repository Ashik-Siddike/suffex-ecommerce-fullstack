-- ==============================================================================
-- SUFFEX E-COMMERCE DATABASE SCHEMA & SEED DATA FOR SUPABASE
-- Run this complete script in Supabase -> SQL Editor -> 'New Query' -> 'Run'
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF YOU WANT A FRESH RE-INITIALIZATION (OPTIONAL):
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS contact_messages CASCADE;
-- DROP TABLE IF EXISTS wishlists CASCADE;
-- DROP TABLE IF EXISTS product_reviews CASCADE;
-- DROP TABLE IF EXISTS customer_addresses CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 3. TABLES CREATION

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  category VARCHAR(255),
  thumbnail TEXT,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(50) NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
  max_discount NUMERIC(10, 2),
  usage_limit INTEGER DEFAULT 1000,
  used_count INTEGER DEFAULT 0,
  badge VARCHAR(50),
  description TEXT,
  expiry_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT NOT NULL,
  district VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  coupon_code VARCHAR(50),
  coupon_discount NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  product_title VARCHAR(255) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Addresses Table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_phone VARCHAR(50) NOT NULL,
  address_title VARCHAR(100) DEFAULT 'Home',
  recipient_name VARCHAR(255) NOT NULL,
  delivery_address TEXT NOT NULL,
  district VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_buyer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  subject VARCHAR(255) DEFAULT 'Order Inquiry',
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Unread',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  provider_response JSONB,
  paid_at TIMESTAMP WITHOUT TIME ZONE
);

-- 4. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);

-- 5. INITIAL SEED DATA

-- Seed Categories
INSERT INTO public.categories (name, slug, description) VALUES ('Smartphones', 'smartphones', 'Flagship & budget mobile phones from top brands') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug, description) VALUES ('Laptops', 'laptops', 'High-performance Ultrabooks and Gaming Laptops') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug, description) VALUES ('Accessories', 'accessories', 'Audio devices, smartwatches, and chargers') ON CONFLICT (slug) DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, badge, description, expiry_date, is_active) VALUES ('TECH15', 'percentage', 15.00, 1500.00, 1500.00, 1000, 'Electronics', '15% off on Tech Gadgets, Laptops & Smartphones', '2026-12-30', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, badge, description, expiry_date, is_active) VALUES ('WELCOME10', 'percentage', 10.00, 0.00, 1000.00, 1000, 'New Shopper', '10% Welcome Discount on First Order (No minimum)', '2026-12-30', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, badge, description, expiry_date, is_active) VALUES ('SUFFEX500', 'flat', 500.00, 2500.00, 500.00, 1000, 'Flat Bonus', 'Flat ৳500 Shopping Bonus on orders of ৳2,500 or more', '2026-12-30', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, badge, description, expiry_date, is_active) VALUES ('STORE20', 'percentage', 20.00, 1000.00, 2000.00, 1000, 'Most Popular', '20% Instant Discount on All Store Products (Max ৳2,000)', '2026-12-30', true) ON CONFLICT (code) DO NOTHING;

-- Seed Products
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('landing page', 'joss leveler site', 10000.00, 'website', 'https://res.cloudinary.com/dnt3plbap/image/upload/v1792320852/suffex-ecommerce/products/ul9vwarulggcrfk7vdra.jpg', 34, '{"type":"daynamic","style":"glass morphysm","Warranty":"1 Year Official","category":"ecommerce"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('AirPods Max', 'High-fidelity audio with Active Noise Cancellation.', 55000.00, 'accessories', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', 28, '{"anc":"true","type":"Over-Ear"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Sony WH-1000XM5 Wireless Noise-Canceling Headphones', 'Industry-leading noise cancelation with two processors and 8 microphones for superior calls.', 38500.00, 'audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 33, '{"Codecs":"LDAC, AAC, SBC","Driver":"30mm Precision Engineered Driver","Weight":"250g Ultra-Lightweight Comfort","Battery":"Up to 30 Hours with ANC On","Warranty":"1 Year Official Warranty"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('MacBook Pro 14', 'M1 Pro chip, Liquid Retina XDR display.', 195000.00, 'laptops', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', 12, '{"ram":"16GB","ssd":"512GB"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('iPhone 13 Pro', 'A15 Bionic chip, pro camera system with telephoto.', 105000.00, 'smartphones', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80', 24, '{"color":"Sierra Blue","storage":"256GB"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('MacBook Pro M3 Max Titanium', 'Flagship Apple Silicon M3 Max with 36GB Unified Memory', 340000.00, 'Laptops', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80', 25, '{"RAM":"48GB Unified Memory","Display":"16.2-inch Liquid Retina XDR","Storage":"1TB Superfast NVMe SSD","Warranty":"2 Years AppleCare+","Processor":"Apple M3 Max (14-Core CPU, 30-Core GPU)"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Anker 737 Power Bank PowerCore 24K 140W', 'Ultra-powerful two-way charging power bank with digital smart display and 140W output.', 20.00, 'accessories', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=80', 33, '{"Ports":"2x USB-C + 1x USB-A (PowerIQ 4.0)","Display":"Smart Digital Color Display","Capacity":"24,000 mAh Ultra-High Capacity","Warranty":"18 Months Anker Official Warranty","MaxOutput":"140W High-Speed Fast Charging"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Apple iPad Pro 13-inch M4 Ultra Retina XDR 256GB', 'Unbelievably thin design with groundbreaking Tandem OLED display and blazing Apple M4 performance.', 165000.00, 'laptops', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80', 29, '{"Chip":"Apple M4 (9-core CPU, 10-core GPU, 16-core Neural Engine)","Camera":"12MP Wide Camera + LiDAR Scanner","Display":"13-inch Tandem OLED Ultra Retina XDR with ProMotion","Storage":"256GB High-Speed Storage","Warranty":"1 Year Official Apple Warranty"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Keychron Q1 Pro Wireless Custom Mechanical Keyboard', 'Full CNC aluminum body, QMK/VIA programmable, hot-swappable double-gasket mechanical keyboard.', 23500.00, 'accessories', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', 39, '{"Layout":"75% ANSI Layout","Battery":"4000 mAh Rechargeable","Keycaps":"Double-shot KSA PBT Keycaps","Switches":"Keychron K Pro Red Mechanical Switches","Warranty":"1 Year Official Warranty","Connectivity":"Bluetooth 5.1 & Type-C Wired"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Asus ROG Zephyrus G16 OLED Gaming Laptop', 'Ultra-thin CNC aluminum gaming powerhouse with ROG Nebula 2.5K 240Hz OLED display.', 100.00, 'laptops', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', 34, '{"RAM":"32GB LPDDR5X 7467MHz","Display":"16-inch 2.5K OLED 240Hz 0.2ms G-Sync","Storage":"2TB PCIe 4.0 NVMe M.2 SSD","Graphics":"NVIDIA GeForce RTX 4080 12GB GDDR6","Warranty":"2 Years Asus Global Warranty","Processor":"Intel Core Ultra 9 185H (16 Cores, 22 Threads)"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Apple Watch Ultra 2 GPS + Cellular 49mm Titanium', 'The most rugged and capable Apple Watch ever with precision dual-frequency GPS.', 94000.00, 'accessories', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80', 30, '{"Case":"49mm Aerospace-Grade Titanium","Chip":"S9 SiP with 64-bit dual-core processor","Battery":"Up to 36 Hours Normal / 72 Hours Low Power","Display":"3000 nits Always-On Retina Display","Warranty":"1 Year Apple Warranty","WaterResistance":"100m Water Resistant / EN13319 Dive Certified"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Samsung Galaxy S24 Ultra 5G 512GB Titanium', 'Galaxy AI powerhouse with titanium frame, Snapdragon 8 Gen 3, and 200MP camera system.', 154999.00, 'smartphones', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80', 26, '{"RAM":"12GB LPDDR5X","Battery":"5,000 mAh with 45W Fast Charging","Display":"6.8-inch Dynamic AMOLED 2X 120Hz","Storage":"512GB UFS 4.0","Warranty":"1 Year Official Samsung Bangladesh","Processor":"Snapdragon 8 Gen 3 for Galaxy"}'::jsonb, true);
INSERT INTO public.products (title, description, price, category, thumbnail, stock, attributes, is_active) VALUES ('Google Pixel 8 Pro 128GB Bay Blue', 'Google Tensor G3 silicon with pro-level camera and generative AI photo editing tools.', 98500.00, 'smartphones', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80', 23, '{"RAM":"12GB LPDDR5X","Camera":"50MP Main + 48MP Ultrawide + 48MP Telephoto","Display":"6.7-inch Super Actua OLED 120Hz","Storage":"128GB UFS 3.1","Warranty":"1 Year Store Warranty","Processor":"Google Tensor G3 + Titan M2"}'::jsonb, true);

-- Seed Users & Admins
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Tanvir Hasan', 'tanvir@example.com', NULL, NULL, 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Test Customer', 'test_customer_1792227814161@example.com', '01812345678', '$2b$10$pfQi4.5v1MkOVQKE4Nl/cO..HIa0YuBg3quBkQQxn.i45z8hAOQk6', 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Ashikur Rahman', 'order_tester_1792227827139@example.com', '01712345678', '$2b$10$vE8Uzb564FVDsIaxV55rceAgEFO/WNa3b8OA5hW/VCaWiPEaYbn9a', 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Test Customer', 'customer_1792229363785@example.com', '01700000000', '$2b$10$bLdaQq66f0pQewF9KGq8J.Bm5vuLJjYtwns5iedpkYpgaUV0xHZpW', 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Test Customer', 'customer_1792229445753@example.com', '01700000000', '$2b$10$9VwsVZJiK5x5ZrGcWxvKg.heIRTLiV1TIJa2tJHOqVUudj/3k3ioO', 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Suffex Admin', 'admin@suffex.com', '01700000000', '$2b$10$/BuAXpsHB10HcUbQD.gvWecCfyQ.H5dx33s0/ZWZp3t3Pqn0BT8Mi', 'admin', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Ashik Siddike', 'ashik@example.com', NULL, '$2b$10$/BuAXpsHB10HcUbQD.gvWecCfyQ.H5dx33s0/ZWZp3t3Pqn0BT8Mi', 'admin', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Test Customer', 'customer_1792230749173@example.com', '01700000000', '$2b$10$oBJWvIOpRI7UWEXx5iCf7.bPgGulDN374ePBgtDzbuwkc7GnOCw7W', 'customer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('Ashik Siddike', 'ashiksart@gmail.com', '01918766033', '$2b$10$p9qGExlOupUuk3bZuRn7sevxCwOLUQmQLuTJhAJ73Ty3rNpNMp.6K', 'admin', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.users (name, email, phone, password_hash, role, is_active) VALUES ('shetu', 'shetu@gmail.com', NULL, '$2b$10$RpNxiswkLi0X16JK/KlJdOKSnTN1Kg2AZHAgqU73A1oa1l9jRjqs.', 'customer', true) ON CONFLICT (email) DO NOTHING;
