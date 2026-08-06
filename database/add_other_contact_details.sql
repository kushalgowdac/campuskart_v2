-- Add the free-form seller contact field to an existing CampusKart database.
-- Safe to run more than once.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS other_contact_details text;

COMMENT ON COLUMN users.other_contact_details IS
  'Optional free-form contact information shared after a buyer expresses interest.';
