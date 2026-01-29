-- Fix PGRST203: Could not choose the best candidate function
-- This script drops all variations of place_order and recreates the correct one.

-- 1. Drop all potential existing versions of the function
DROP FUNCTION IF EXISTS public.place_order(uuid, integer);
DROP FUNCTION IF EXISTS public.place_order(uuid, integer, text);

-- 2. Recreate the consolidated function (matches supabase_schema_final.sql)
CREATE OR REPLACE FUNCTION public.place_order(item_id UUID, qty INT DEFAULT 1)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_user_family_id UUID;
  v_user_points INT;
  v_total_price INT;
  v_order_id UUID;
BEGIN
  -- Get user info
  SELECT family_id, points INTO v_user_family_id, v_user_points
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_family_id IS NULL THEN RAISE EXCEPTION 'No family found'; END IF;

  -- Get item info
  SELECT * INTO v_item FROM public.menu_items WHERE id = item_id;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;

  -- Calc price
  v_total_price := v_item.price * qty;

  -- Check points
  IF v_user_points < v_total_price THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Deduct points
  UPDATE public.profiles
  SET points = points - v_total_price
  WHERE id = auth.uid();

  -- Create order (including tags snapshot)
  INSERT INTO public.orders (family_id, user_id, menu_items, total_price, status)
  VALUES (
    v_user_family_id, 
    auth.uid(), 
    jsonb_build_array(jsonb_build_object(
      'id', v_item.id,
      'name', v_item.name,
      'price', v_item.price,
      'image_url', v_item.image_url,
      'tags', v_item.tags
    )), 
    v_total_price, 
    'pending'
  )
  RETURNING id INTO v_order_id;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'new_balance', v_user_points - v_total_price);
END;
$$;
