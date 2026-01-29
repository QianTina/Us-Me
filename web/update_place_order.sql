create or replace function public.place_order(item_id uuid, qty int default 1)
returns json
language plpgsql
security definer
as $$
declare
  v_item record;
  v_user_family_id uuid;
  v_user_points int;
  v_total_price int;
  v_order_id uuid;
begin
  -- Get user info
  select family_id, points into v_user_family_id, v_user_points
  from public.profiles
  where id = auth.uid();

  if v_user_family_id is null then raise exception 'No family found'; end if;

  -- Get item info
  select * into v_item from public.menu_items where id = item_id;
  if v_item is null then raise exception 'Item not found'; end if;

  -- Calc price
  v_total_price := v_item.price * qty;

  -- Check points
  if v_user_points < v_total_price then
    raise exception 'Insufficient points';
  end if;

  -- Deduct points
  update public.profiles
  set points = points - v_total_price
  where id = auth.uid();

  -- Create order (Now including tags!)
  insert into public.orders (family_id, user_id, menu_items, total_price, status)
  values (
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
  returning id into v_order_id;

  return json_build_object('success', true, 'order_id', v_order_id, 'new_balance', v_user_points - v_total_price);
end;
$$;
