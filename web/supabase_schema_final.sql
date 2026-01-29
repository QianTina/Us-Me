-- ==============================================================================
-- Us & Me Project - Final Consolidated Schema (V2.0)
-- This schema includes all tables, functions, and policies required for the app.
-- Updated to match V19 logic.
-- ==============================================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- 1. Tables

-- 1.1 Families
create table if not exists public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 0, 7),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.2 Profiles (Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  family_id uuid references public.families(id),
  role text check (role in ('admin', 'member')) default 'member',
  points int default 0,
  username text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  constraint username_length check (char_length(username) >= 3)
);

-- 1.3 Menu Items (Dishes)
create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) not null,
  name text not null,
  price int default 0 check (price >= 0),
  image_url text,
  tags text[],
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.4 Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) not null,
  user_id uuid references public.profiles(id) not null,
  menu_items jsonb not null, -- Stores snapshot of item details
  total_price int not null,
  status text check (status in ('pending', 'cooking', 'completed', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.5 Chores (Tasks)
create table if not exists public.chores (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) not null,
  title text not null,
  description text,
  points int not null check (points > 0),
  emoji text default '🧹',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.6 Chore Logs (Approval History)
create table if not exists public.chore_logs (
  id uuid default gen_random_uuid() primary key,
  chore_id uuid, -- Can be null if ad-hoc
  family_id uuid references public.families(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  points integer not null,
  emoji text default '✨',
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.7 Posts (Private Diary / Photos)
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) not null,
  owner_id uuid references public.profiles(id) not null,
  type text check (type in ('diary', 'photo', 'wish')) default 'wish',
  content text,
  visibility text check (visibility in ('public', 'private')) default 'private',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Row Level Security (RLS) Policies

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.chores enable row level security;
alter table public.chore_logs enable row level security;
alter table public.posts enable row level security;

-- Helper function to avoid infinite recursion in policies
create or replace function get_my_family_id()
returns uuid
language sql
stable
security definer
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

-- 2.1 Family Policies
drop policy if exists "Users can view own family" on public.families;
create policy "Users can view own family"
  on public.families for select
  using (id = get_my_family_id());

drop policy if exists "Users can update own family" on public.families;
create policy "Users can update own family"
  on public.families for update
  using (id = get_my_family_id());

-- 2.2 Profile Policies
drop policy if exists "Users can view family members" on public.profiles;
create policy "Users can view family members"
  on public.profiles for select
  using (
    id = auth.uid() or family_id = get_my_family_id()
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- 2.3 Menu Item Policies
drop policy if exists "Users can view family menu" on public.menu_items;
create policy "Users can view family menu"
  on public.menu_items for select
  using (family_id = get_my_family_id());

drop policy if exists "Users can manage family menu" on public.menu_items;
create policy "Users can manage family menu"
  on public.menu_items for all
  using (family_id = get_my_family_id());

-- 2.4 Order Policies
drop policy if exists "Users can view family orders" on public.orders;
create policy "Users can view family orders"
  on public.orders for select
  using (family_id = get_my_family_id());

drop policy if exists "Users can create orders" on public.orders;
create policy "Users can create orders"
  on public.orders for insert
  with check (family_id = get_my_family_id());

drop policy if exists "Users can update family orders" on public.orders;
create policy "Users can update family orders"
  on public.orders for update
  using (family_id = get_my_family_id());

-- 2.5 Chore Policies
drop policy if exists "Users can view family chores" on public.chores;
create policy "Users can view family chores"
  on public.chores for select
  using (family_id = get_my_family_id());

drop policy if exists "Users can manage family chores" on public.chores;
create policy "Users can manage family chores"
  on public.chores for all
  using (family_id = get_my_family_id());

-- 2.6 Chore Log Policies
drop policy if exists "Users can view family chore logs" on public.chore_logs;
create policy "Users can view family chore logs"
  on public.chore_logs for select
  using (family_id = get_my_family_id());

drop policy if exists "Users can insert chore logs" on public.chore_logs;
create policy "Users can insert chore logs"
  on public.chore_logs for insert
  with check (family_id = get_my_family_id());

drop policy if exists "Users can update family chore logs" on public.chore_logs;
create policy "Users can update family chore logs"
  on public.chore_logs for update
  using (family_id = get_my_family_id());

-- 2.7 Post Policies
drop policy if exists "Users can view posts" on public.posts;
create policy "Users can view posts"
  on public.posts for select
  using (
    (visibility = 'public' and family_id = get_my_family_id())
    or owner_id = auth.uid()
  );

drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts"
  on public.posts for insert
  with check (owner_id = auth.uid() and family_id = get_my_family_id());

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update
  using (owner_id = auth.uid());

-- 3. Business Logic Functions (RPC)

-- 3.1 Place Order (Transaction: Deduct Points + Create Order)
-- Drop ambiguous functions first
DROP FUNCTION IF EXISTS public.place_order(uuid, integer);
DROP FUNCTION IF EXISTS public.place_order(uuid, integer, text);

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

  -- Create order
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

-- 3.2 Submit Chore (Apply for points)
-- Updated to allow flexible input (V19 style)
create or replace function public.submit_chore(
  chore_id uuid,
  title text,
  points integer,
  emoji text default '✨'
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_family_id uuid;
begin
  v_user_id := auth.uid();
  
  select family_id into v_family_id
  from public.profiles
  where id = v_user_id;

  if v_family_id is null then
    return json_build_object('success', false, 'error', 'User has no family');
  end if;

  insert into public.chore_logs (
    chore_id,
    family_id,
    applicant_id,
    title,
    points,
    status,
    emoji,
    created_at
  ) values (
    chore_id,
    v_family_id,
    v_user_id,
    title,
    points,
    'pending',
    emoji,
    now()
  );

  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 3.3 Approve Chore (Grant points)
-- Updated with stronger checks (V19 style)
create or replace function public.approve_chore(log_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_log record;
  v_reviewer_family_id uuid;
begin
  -- Get reviewer's family_id
  select family_id into v_reviewer_family_id
  from public.profiles
  where id = auth.uid();

  -- Get log details
  select * into v_log
  from public.chore_logs
  where id = log_id;

  if v_log is null then
    return json_build_object('success', false, 'error', 'Log not found');
  end if;

  -- Verify family match
  if v_log.family_id != v_reviewer_family_id then
    return json_build_object('success', false, 'error', 'Permission denied: Different family');
  end if;

  -- Verify status
  if v_log.status != 'pending' then
    return json_build_object('success', false, 'error', 'Chore is already processed');
  end if;

  -- Update log status
  update public.chore_logs
  set status = 'approved',
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = log_id;

  -- Add points to applicant
  update public.profiles
  set points = coalesce(points, 0) + v_log.points
  where id = v_log.applicant_id;

  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 3.4 Reject Chore
create or replace function public.reject_chore(log_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_log record;
  v_reviewer_family_id uuid;
begin
  select family_id into v_reviewer_family_id from public.profiles where id = auth.uid();

  select * into v_log from public.chore_logs where id = log_id;
  if v_log is null then return json_build_object('success', false, 'error', 'Log not found'); end if;

  if v_log.family_id != v_reviewer_family_id then return json_build_object('success', false, 'error', 'Permission denied'); end if;
  if v_log.status != 'pending' then return json_build_object('success', false, 'error', 'Processed'); end if;

  update public.chore_logs
  set status = 'rejected', reviewed_by = auth.uid(), updated_at = now()
  where id = log_id;

  return json_build_object('success', true);
end;
$$;

-- 3.5 Update Family Name
create or replace function public.update_family_name(new_name text)
returns boolean
language plpgsql
security definer
as $$
declare
  user_family_id uuid;
begin
  select family_id into user_family_id from public.profiles where id = auth.uid();
  if user_family_id is null then raise exception 'User does not belong to a family'; end if;

  update public.families set name = new_name where id = user_family_id;
  return true;
end;
$$;
