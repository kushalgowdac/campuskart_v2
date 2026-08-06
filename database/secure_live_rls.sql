-- Harden an existing CampusKart database created by an older migration.
-- Safe to run more than once. The backend service role continues to bypass RLS.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON users, products, contact_requests, notifications
  FROM anon, authenticated;

GRANT SELECT ON users, products TO anon, authenticated;
GRANT SELECT ON contact_requests, notifications TO authenticated;
GRANT ALL ON users, products, contact_requests, notifications TO service_role;
