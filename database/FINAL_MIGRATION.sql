-- ============================================================
-- CampusKart v2 — FINAL MIGRATION SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- Creates the full database schema from scratch
-- ============================================================

-- STEP 0: Drop old tables if they exist (clean slate)
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS reservation_cancellations CASCADE;
DROP TABLE IF EXISTS otp_tokens CASCADE;
DROP TABLE IF EXISTS admin_actions_log CASCADE;
DROP TABLE IF EXISTS user_suspensions CASCADE;
DROP TABLE IF EXISTS user_ratings CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS product_verification CASCADE;
DROP TABLE IF EXISTS prod_loc CASCADE;
DROP TABLE IF EXISTS prod_spec CASCADE;
DROP TABLE IF EXISTS prod_img CASCADE;
DROP TABLE IF EXISTS add_to_wishlist CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS product_seller CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- TABLE 1: users
-- ============================================================
CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  password    text NOT NULL,
  role        text NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  instagram   text,
  telegram    text,
  reddit      text,
  gmail       text,
  meeting_note text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 2: products
-- ============================================================
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  category    text NOT NULL DEFAULT 'Other',
  image_urls  text[] NOT NULL DEFAULT '{}',
  public_ids  text[] NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'live', 'hidden', 'sold', 'rejected', 'expired')),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  notes_to_buyer text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 3: contact_requests
-- ============================================================
CREATE TABLE contact_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, buyer_id)
);

-- ============================================================
-- TABLE 4: notifications
-- ============================================================
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL
                CHECK (type IN ('interest', 'approved', 'rejected', 'expiring_soon')),
  title       text NOT NULL,
  message     text NOT NULL,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BASE INDEXES
-- ============================================================
CREATE INDEX idx_products_status     ON products(status);
CREATE INDEX idx_products_seller     ON products(seller_id);
CREATE INDEX idx_products_category   ON products(category);
CREATE INDEX idx_products_expires    ON products(expires_at);
CREATE INDEX idx_contact_product     ON contact_requests(product_id);
CREATE INDEX idx_contact_buyer       ON contact_requests(buyer_id);
CREATE INDEX idx_contact_seller      ON contact_requests(seller_id);
CREATE INDEX idx_notifications_user  ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_live_created
  ON products(created_at DESC)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS idx_products_live_category
  ON products(category, created_at DESC)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS idx_products_live_price_asc
  ON products(price ASC)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS idx_products_live_price_desc
  ON products(price DESC)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS idx_products_seller_created
  ON products(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_pending_created
  ON products(created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_products_expired
  ON products(expires_at)
  WHERE status IN ('live', 'hidden', 'pending', 'rejected');

CREATE INDEX IF NOT EXISTS idx_contact_product_created
  ON contact_requests(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Live products are publicly readable"
  ON products FOR SELECT
  USING (status = 'live' OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers see own contact requests"
  ON contact_requests FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Disable RLS (backend uses service_role key which bypasses RLS)
ALTER TABLE users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE products         DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON users            TO anon, authenticated, service_role;
GRANT ALL ON products         TO anon, authenticated, service_role;
GRANT ALL ON contact_requests TO anon, authenticated, service_role;
GRANT ALL ON notifications    TO anon, authenticated, service_role;

-- ============================================================
-- ENABLE REALTIME on notifications table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- VERIFICATION: Run this to confirm tables were created
-- ============================================================
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns c
   WHERE c.table_name = t.table_name
     AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
