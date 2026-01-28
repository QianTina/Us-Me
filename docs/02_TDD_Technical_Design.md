# Technical Design Document

## 1. 架构概览
采用 Serverless 架构，降低运维成本。
* **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
* **Backend (BaaS)**: Supabase (PostgreSQL + GoTrue Auth + Realtime)
* **Deployment**: Vercel (Web)

## 2. 数据库设计 (Schema)

### Table: `profiles`
扩展 Auth 用户信息。
* `id` (uuid, pk): ref auth.users
* `family_id` (uuid): 关联 families 表
* `role` (text): 'admin' | 'member'
* `points` (int): 当前持有积分
* `avatar_url` (text): 用户头像地址 (新增)

### Table: `families`
* `id` (uuid, pk)
* `name` (text)
* `invite_code` (text)

### Table: `menu_items` (Bistro核心)
* `id` (uuid, pk)
* `family_id` (uuid): 隔离不同家庭的数据
* `name` (text)
* `price` (int)
* `image_url` (text)
* `tags` (text[]): 标签，如 ['辣', '甜点'] (新增)
* `is_public` (bool): 即使是菜单，未来也可以支持私有菜单

### Table: `orders`
* `id` (uuid, pk)
* `customer_id` (uuid): ref profiles
* `cook_id` (uuid): ref profiles
* `status` (enum): 'pending', 'cooking', 'served', 'rejected'

## 3. 存储设计 (Storage)

### Bucket: `menu-images`
用于存储菜品图片。
* **Public**: Yes (公开访问)
* **File Size Limit**: 2MB
* **Allowed MIME types**: `image/*`
* **Path**: `{family_id}/{filename}` (按家庭隔离文件夹)

### Bucket: `diary-photos` (Phase 3)
用于存储私密日记照片。
* **Public**: No (私有访问，需鉴权)
* **RLS Policy**: 仅 owner 可读写

## 4. 安全策略 (RLS - Row Level Security)
Supabase 的核心安全机制。
* **Rule 1 (Family View)**: `auth.uid() IN (SELECT id FROM profiles WHERE family_id = target.family_id)`
* **Rule 2 (Private View)**: `auth.uid() = owner_id`

## 5. 关键流程图 (点餐逻辑)
Client A (点餐) -> Insert `orders` -> Supabase Realtime -> Client B (大厨) 收到 Toast 通知
