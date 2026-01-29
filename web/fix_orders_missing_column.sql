-- Fix: Add missing menu_items column to orders table
-- Run this in Supabase SQL Editor to fix the "column menu_items does not exist" error.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]'::jsonb;

-- Optional: If you have an old 'item_id' column that is no longer used in the new schema, you might want to keep it for history or migrate data.
-- For now, just adding 'menu_items' is enough to make the code work.
