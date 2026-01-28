# Development Guidelines

## 1. 目录结构规范
* `app/` - 页面路由
* `components/ui` - 通用 UI 组件 (Buttons, Inputs)
* `components/business` - 业务组件 (MenuCard, OrderList)
* `lib/` - 工具函数与数据库 Client

## 2. Commit Message 规范
遵循 Conventional Commits：
* `feat`: 新功能 (feat: allow user to upload dish image)
* `fix`: 修补 bug (fix: login button alignment)
* `docs`: 文档修改
* `style`: 格式化，不影响代码运行
* `refactor`: 重构

## 3. 分支管理
* `main`: 随时可部署的稳定版本
* `dev`: 日常开发分支