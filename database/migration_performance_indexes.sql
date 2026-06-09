-- ============================================================
-- CampusKart v2 — Performance Indexes Migration
-- Run this ONCE in Supabase SQL Editor
-- Adds composite and covering indexes for hot query paths
-- ============================================================

-- Composite index for browse page: WHERE status='live' ORDER BY created_at DESC
-- Without this, PostgreSQL scans all products then filters + sorts.
-- With this, it jumps directly to live products in order.
CREATE INDEX IF NOT EXISTS idx_products_live_created
  ON products(created_at DESC)
  WHERE status = 'live';

-- Composite index for category filtering: WHERE status='live' AND category=X
CREATE INDEX IF NOT EXISTS idx_products_live_category
  ON products(category, created_at DESC)
  WHERE status = 'live';

-- Price sorting index for browse page
CREATE INDEX IF NOT EXISTS idx_products_live_price_asc
  ON products(price ASC)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS idx_products_live_price_desc
  ON products(price DESC)
  WHERE status = 'live';

-- Index for seller dashboard: WHERE seller_id=X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_products_seller_created
  ON products(seller_id, created_at DESC);

-- Index for admin pending queue: WHERE status='pending'
CREATE INDEX IF NOT EXISTS idx_products_pending_created
  ON products(created_at ASC)
  WHERE status = 'pending';

-- Index for cleanup job: WHERE expires_at < now() AND status IN (...)
CREATE INDEX IF NOT EXISTS idx_products_expired
  ON products(expires_at)
  WHERE status IN ('live', 'hidden', 'pending', 'rejected');

-- Index for contact_requests interest count per product
CREATE INDEX IF NOT EXISTS idx_contact_product_created
  ON contact_requests(product_id, created_at DESC);

-- Covering index for notifications: unread count per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- Index for users email lookup (login/register)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);
