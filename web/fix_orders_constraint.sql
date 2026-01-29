-- Fix: Remove NOT NULL constraint from menu_item_id in orders table
-- The new system uses 'menu_items' (JSONB) instead of 'menu_item_id'.
-- This script allows menu_item_id to be NULL for new orders.

ALTER TABLE public.orders 
ALTER COLUMN menu_item_id DROP NOT NULL;
