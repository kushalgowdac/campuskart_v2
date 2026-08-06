-- Supports the public marketplace and other frequent ordered lookups.
-- Safe to run more than once.

-- Required for fast case-insensitive substring searches such as
-- WHERE title ILIKE '%calculator%'. A normal B-tree cannot serve that query.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON products USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_status_created_id
  ON products (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_products_status_category_created_id
  ON products (status, category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_products_status_price_id
  ON products (status, price, id);

CREATE INDEX IF NOT EXISTS idx_products_status_category_price_id
  ON products (status, category, price, id);

-- Seller dashboard: filter by owner and return newest listings first.
CREATE INDEX IF NOT EXISTS idx_products_seller_created
  ON products (seller_id, created_at DESC);

-- Daily expiration cleanup filters by lifecycle state and expiry time.
CREATE INDEX IF NOT EXISTS idx_products_status_expires
  ON products (status, expires_at);

-- Notification inbox filters by user/read state and sorts newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at DESC);

-- Expiry-warning deduplication checks product and notification type together.
CREATE INDEX IF NOT EXISTS idx_notifications_product_type
  ON notifications (product_id, type)
  WHERE product_id IS NOT NULL;

-- Seller interest lists filter by product and sort newest first.
CREATE INDEX IF NOT EXISTS idx_contact_product_created
  ON contact_requests (product_id, created_at DESC);
