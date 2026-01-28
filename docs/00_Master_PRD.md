# 项目名称：Us & Me (情侣生活 OS) - 主需求文档 (Master PRD)

## 1. 角色与背景 (Role & Context)
你是一名高级全栈工程师和系统架构师。你的任务是构建一个名为 "Us & Me" 的“情侣生活操作系统” Web 应用。
目标是开发一个渐进式 Web 应用 (PWA)，核心理念是平衡“亲密关系 (We Mode)”与“独立人格 (Me Mode)”。

## 2. 技术栈约束 (Tech Stack Constraints)
* **框架**: Next.js 14+ (App Router)。
* **语言**: TypeScript。
* **样式**: Tailwind CSS + Shadcn/UI (需定制为新粗野主义风格)。
* **后端/数据库**: Supabase (Postgres, Auth, Realtime, Storage)。
* **状态管理**: React Context 或 Zustand。
* **图标库**: Lucide React。

## 3. 设计系统：新粗野主义 / 波普风 (Neo-Brutalism)
UI 必须大胆、有趣且高对比度。
* **阴影**: 硬阴影，无模糊 (例如: `box-shadow: 4px 4px 0px 0px #000`)。
* **边框**: 粗黑边框 (2px 或 3px 实线 #000)。
* **圆角**: 大圆角 (`rounded-2xl` 或 `rounded-3xl`)。
* **排版**: 标题加粗，正文清晰易读的无衬线字体。
* **配色方案 (Color Palette)**:
    * `Bg-Main` (主背景): #FDFBF7 (米白/奶油色)
    * `Accent-Green` (We 模式/操作色): #B2F665 (酸橙绿)
    * `Accent-Purple` (Me 模式/私密色): #D6B3F7 (香芋紫)
    * `Accent-Yellow` (高亮/提醒): #FDE49E (奶油黄)
    * `Text` (文字): #1A1A1A (柔和黑)

## 4. 核心功能与业务逻辑

### 4.1 核心概念：双子星空间 (Twin Spaces)
* **全局开关**: 顶部导航栏有一个显眼的开关，用于切换 "We Mode" 和 "Me Mode"。
* **We Mode (我们)**: 展示共享内容（菜单、合照、共同任务）。主题色：酸橙绿。
* **Me Mode (我)**: 展示私密内容（个人日记、个人待办）。主题色：香芋紫。此处数据需加密或受 RLS (行级安全策略) 保护，仅拥有者可见。

### 4.2 功能模块：家庭小餐馆 (Bistro) - **MVP 核心**
* **菜单管理**: 用户可以录入菜品（菜名、图片、所需积分/价格）。
* **点餐流程**: 伴侣 A 可以点伴侣 B 的菜。
* **状态流转**: 待接单 (Pending) -> 烹饪中 (Accepted) -> 上菜/完成 (Served)。
* **通知**: 下单时通过 Supabase Realtime 触发实时弹窗通知。

### 4.3 功能模块：经济系统 (积分)
* **赚取**: 完成家务/任务可获得积分。
* **消费**: 点餐需要消耗积分。

## 5. 数据库设计 (Supabase)
* **profiles** (用户表): `id`, `username`, `family_id`, `points`, `avatar_url`
* **families** (家庭表): `id`, `name`, `invite_code`
* **menu_items** (菜单表): `id`, `family_id`, `name`, `price`, `image_url`, `tags`
* **orders** (订单表): `id`, `family_id`, `customer_id` (点餐人), `cook_id` (大厨), `item_id`, `status`
* **posts** (内容表): `id`, `family_id`, `owner_id`, `type` (日记/照片), `content`, `visibility` ('public'/'private')

---

## 6. 开发路线图 (分阶段执行)

**不要一次性实现所有功能。** 我们将严格按照以下 4 个阶段进行。
请等待我的指令再开始特定阶段。

### 🔴 第一阶段：骨架与菜单展示 (第 1-3 天)
**目标**: 让 App 跑起来，并能看到菜单。
1.  使用 Tailwind & Shadcn 初始化 Next.js 项目。
2.  配置 `tailwind.config.ts`，写入上述的新粗野主义颜色和阴影参数。
3.  配置 Supabase 客户端，并建立基础数据库表 (`profiles`, `menu_items`)。
4.  **功能实现**: "菜单列表页"。从 Supabase 拉取数据，并用大胆的新粗野主义卡片组件展示菜品。
5.  **功能实现**: "新增菜品弹窗"。包含图片上传 (Supabase Storage) 和表单提交。

### 🟠 第二阶段：交互与订单 (第 4-7 天)
**目标**: 让菜单能用（可以点餐）。
1.  在卡片上实现 "点餐 (Order)" 按钮。
2.  创建 `orders` 数据库表。
3.  **功能实现**: "后厨视图" (订单管理面板)。查看新订单并更改状态 (接单/完成)。
4.  **实时性**: 使用 Supabase Realtime 实现新订单到达时的 UI 弹窗提示。

### 🟡 第三阶段：双子星逻辑 (第 8-10 天)
**目标**: 实现 Me/We 切换与隐私保护。
1.  实现全局 "We/Me" 切换开关 (State)。
2.  根据模式动态切换 UI 主题色 (绿 vs 紫)。
3.  **功能实现**: 私密日记。
4.  **安全性**: 在 Supabase 中实施 RLS (行级安全策略)，确保 "Private" 内容真的只有自己能读到。

### 🟢 第四阶段：游戏化与润色 (第 11-14 天)
**目标**: 加入经济系统。
1.  **功能实现**: 点餐时的积分扣除逻辑。
2.  **功能实现**: 任务看板 (做家务赚积分)。
3.  最终 UI 润色 (检查手机端适配)。

---

## 7. 即时请求 (Immediate Request)

**我已经准备好开始第一阶段 (Phase 1) 了。**
请帮我完成以下任务：
1.  提供包含上述自定义颜色/阴影配置的 `tailwind.config.ts` 代码。
2.  提供在 Supabase 中创建 `menu_items` 表的 SQL 代码。
3.  使用新粗野主义风格 (Neo-Brutalism style) 编写 Next.js 的 `MenuCard` 组件代码。