# Us & Me - 情侣生活 OS

专为情侣打造的 gamification 生活管理系统。通过积分机制（做家务赚积分，兑换美食/愿望），增加生活情趣，减少家务推诿。

## 🌟 核心功能

- **Bistro (家庭小餐馆)**: 
  - 菜单管理：上传菜品图片，设置积分价格。
  - 点餐系统：使用积分兑换美食。
- **Kitchen (后厨管理)**:
  - 订单管理：查看待处理订单，更新状态（烹饪中 -> 完成）。
- **Chores (任务大厅)**:
  - 赚取积分：申请完成家务任务（如洗碗、拖地）。
  - 审批机制：另一半审批任务，通过后自动发放积分。
- **Profile (个人中心)**:
  - 积分账单：查看积分收支明细。
  - 历史订单：查看点过的每一顿饭。

## 🎨 设计风格

采用 **Neo-Brutalism (新粗野主义)** 设计风格：
- 高饱和度配色 (Neo-Green, Neo-Pink, Neo-Yellow)
- 粗黑边框与硬阴影
- 大圆角与夸张的 UI 元素

## 🚀 快速开始

### 1. 环境准备

- Node.js 18+
- Supabase 账号

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入 Supabase 信息：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. 数据库设置

请在 Supabase SQL Editor 中运行 `supabase_schema_final.sql` 文件中的所有 SQL 语句。这将自动创建所有必要的表、函数和安全策略。

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 📂 项目文档

- [风险评估文档 (Risk Assessment)](./RISK_ASSESSMENT.md)
- [数据库 Schema](./supabase_schema_final.sql)

## 🛠 技术栈

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
