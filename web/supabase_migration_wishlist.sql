-- Migration: Enable Wishlist (posts type 'wish')
-- Run this in Supabase SQL Editor

-- 1. Create table if not exists (in case it was missing)
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) not null,
  owner_id uuid references public.profiles(id) not null,
  type text check (type in ('diary', 'photo', 'wish')) default 'wish',
  content text,
  visibility text check (visibility in ('public', 'private')) default 'private',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. If table exists, update the check constraint for 'type'
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'posts') then
    -- Drop old constraint if exists
    alter table public.posts drop constraint if exists posts_type_check;
    
    -- Add new constraint including 'wish'
    alter table public.posts add constraint posts_type_check 
      check (type in ('diary', 'photo', 'wish'));
      
    -- Update default value
    alter table public.posts alter column type set default 'wish';
  end if;
end $$;

-- 3. Ensure RLS is enabled and policies exist
alter table public.posts enable row level security;

-- Re-create policies just in case
drop policy if exists "Users can view posts" on public.posts;
create policy "Users can view posts"
  on public.posts for select
  using (
    (visibility = 'public' and family_id = (select family_id from public.profiles where id = auth.uid()))
    or owner_id = auth.uid()
  );

drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts"
  on public.posts for insert
  with check (owner_id = auth.uid()); -- Simplified check to allow insert first

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update
  using (owner_id = auth.uid());
