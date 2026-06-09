-- Migration: Add contact fields to users + notes_to_buyer to products
-- Run this ONCE in Supabase SQL Editor

-- User contact fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meeting_note text;

-- Per-listing seller notes
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes_to_buyer text;
