-- ============================================================
-- CampusKart v2 — Clean Schema Migration
-- Run this ONCE in Supabase SQL Editor
-- Wipes old tables and creates the new clean 4-table schema
-- ============================================================

-- STEP 0: Drop old tables if they exist (clean slate)
-- CASCADE means: also drop anything that depends on these tables
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
-- Stores every person who registers on CampusKart.
-- One row = one person.
-- ============================================================
CREATE TABLE users (
  -- uuid: a random unique ID like "a3f2c1d4-3b2a-..."
  -- gen_random_uuid() generates it automatically on INSERT
  -- This is PostgreSQL standard. MySQL used INT AUTO_INCREMENT.
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name        text NOT NULL,

  -- UNIQUE means no two users can share an email
  email       text NOT NULL UNIQUE,

  -- We store the bcrypt HASH of the password, never the plain text
  -- bcrypt hash looks like: $2b$10$xyz... (60 characters)
  password    text NOT NULL,

  -- role controls what the user can do:
  -- 'user'  → normal student (can browse, list, buy)
  -- 'admin' → can approve/reject listings
  -- DEFAULT 'user' means every new user starts as a regular user
  -- To make someone admin: go to Supabase Table Editor → users → edit their row → set role = 'admin'
  role        text NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),

  -- Contact info — optional. Stored on the USER not the product.
  -- Why? Because if seller updates their Instagram, all listings show new one automatically.
  -- This is called normalisation: store each fact in exactly one place.
  instagram   text,
  telegram    text,
  reddit      text,

  -- timestamptz = timestamp with timezone. Always store timezone-aware timestamps.
  -- now() = current time at the moment of INSERT
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 2: products
-- One row = one item a seller wants to sell.
-- ============================================================
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REFERENCES users(id): Foreign Key.
  -- This means seller_id MUST be a valid id from the users table.
  -- The database enforces this — you can't have an orphan product.
  -- ON DELETE CASCADE: if the seller's account is deleted, their products are too.
  seller_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title       text NOT NULL,
  description text,

  -- numeric(10,2) = up to 10 digits, 2 decimal places. Good for prices.
  price       numeric(10,2) NOT NULL CHECK (price >= 0),

  -- Category — what kind of item is this?
  category    text NOT NULL DEFAULT 'Other',

  -- text[] = array of text. PostgreSQL supports arrays natively.
  -- Instead of a separate prod_img table, we store URLs directly here.
  -- Example value: ARRAY['https://res.cloudinary.com/...', 'https://...']
  image_urls  text[] NOT NULL DEFAULT '{}',

  -- Cloudinary public_ids — needed to DELETE images from Cloudinary later.
  -- Every uploaded image has a public_id like "campuskart/abc123"
  -- When product is deleted/expired, we loop these to delete from Cloudinary.
  public_ids  text[] NOT NULL DEFAULT '{}',

  -- Product lifecycle status:
  -- pending  → just created, waiting for admin to review
  -- live     → admin approved, visible to buyers on browse page
  -- hidden   → seller hid it temporarily (too many messages, taking a break)
  -- sold     → deal done, seller marked it sold → removed from browse
  -- rejected → admin rejected it (spam, wrong content, etc.)
  -- expired  → 90 days passed, cleanup job removed it
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'live', 'hidden', 'sold', 'rejected', 'expired')),

  -- Which admin approved/rejected this listing (audit trail)
  -- NULL until an admin acts on it
  -- ON DELETE SET NULL: if admin account deleted, product stays but approved_by becomes NULL
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Auto-set to 90 days from creation
  -- The cleanup job checks: WHERE expires_at < now() AND status NOT IN ('sold','expired')
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '90 days'),

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index on status: makes "WHERE status = 'live'" queries fast
-- Without index, PostgreSQL scans every row. With index, it jumps directly.
-- Think of it like a book index — you don't read every page to find "JWT", you check the index.
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_seller   ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_expires  ON products(expires_at);

-- ============================================================
-- TABLE 3: contact_requests
-- Records every time a buyer clicks "I'm Interested".
-- Why needed:
--   1. Prevents duplicate notifications (UNIQUE constraint)
--   2. Lets us show "4 people are interested" to the seller
--   3. Audit trail of buyer interest
-- ============================================================
CREATE TABLE contact_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- The buyer who clicked "I'm Interested"
  buyer_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Denormalised from products.seller_id for query efficiency.
  -- Means: we store seller_id here too, even though products already has it.
  -- Why? When creating a notification, we need seller_id without an extra JOIN.
  seller_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at  timestamptz NOT NULL DEFAULT now(),

  -- UNIQUE constraint: one buyer can only express interest once per product.
  -- If they click "I'm Interested" again, DB throws a unique violation error.
  -- Our backend catches that and ignores it (no duplicate notification).
  UNIQUE(product_id, buyer_id)
);

CREATE INDEX idx_contact_product ON contact_requests(product_id);
CREATE INDEX idx_contact_buyer   ON contact_requests(buyer_id);
CREATE INDEX idx_contact_seller  ON contact_requests(seller_id);

-- ============================================================
-- TABLE 4: notifications
-- In-app notification store.
-- How realtime works:
--   Backend INSERTs a row here →
--   Supabase detects the INSERT via PostgreSQL's LISTEN/NOTIFY →
--   Pushes the new row over WebSocket to frontend →
--   React updates the bell icon instantly
-- ============================================================
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives this notification
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Type of notification — determines icon and message template in frontend
  -- 'interest'      → "Someone is interested in your [product]"
  -- 'approved'      → "Your listing [product] is now live!"
  -- 'rejected'      → "Your listing [product] was rejected: [reason]"
  -- 'expiring_soon' → "Your listing [product] expires in 7 days"
  type        text NOT NULL
                CHECK (type IN ('interest', 'approved', 'rejected', 'expiring_soon')),

  title       text NOT NULL,   -- Short heading: "New Interest!"
  message     text NOT NULL,   -- Full message text

  -- Optional: which product this notification is about
  -- SET NULL: if product deleted, notification stays but product_id becomes null
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,

  -- false = unread (shows as bold / highlighted in UI)
  -- true  = user has seen it
  is_read     boolean NOT NULL DEFAULT false,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read);

-- ============================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================
-- What is RLS?
-- Normally, your backend uses the SERVICE_ROLE_KEY which bypasses all security.
-- RLS is a PostgreSQL feature that adds per-row access rules at the DB level.
-- Even if someone gets your ANON_KEY and calls Supabase directly,
-- they can't read other users' data because RLS blocks them.
-- Our backend uses SERVICE_ROLE_KEY so it bypasses RLS (full access).
-- RLS protects against direct API abuse using the anon key.

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can read all profiles (needed for seller info display)
-- but can only update/delete their own row
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policy: live products are public, pending/hidden visible only to owner/admin
-- Our backend (service role) bypasses this — this protects direct DB access
CREATE POLICY "Live products are publicly readable"
  ON products FOR SELECT
  USING (status = 'live' OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

-- Notifications: users can only see their own
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Contact requests: buyers see their own, sellers see requests on their products
CREATE POLICY "Buyers see own contact requests"
  ON contact_requests FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================================
-- STEP 4: Enable Realtime on notifications table
-- ============================================================
-- This tells Supabase to track changes on this table
-- and broadcast them to subscribed clients via WebSocket.
-- Without this, Supabase Realtime won't push notification inserts to the frontend.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- DONE. Verify by running: SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public';
-- You should see: users, products, contact_requests, notifications
-- ============================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c 
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;





-- disable row level security




ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;


SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';




-- grant permission on core tables

GRANT ALL ON users TO anon, authenticated, service_role;
GRANT ALL ON products TO anon, authenticated, service_role;
GRANT ALL ON contact_requests TO anon, authenticated, service_role;
GRANT ALL ON notifications TO anon, authenticated, service_role;
