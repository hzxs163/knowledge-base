# 公用工程知识库

基于 Cloudflare Pages + Functions + D1 构建的轻量级知识库系统。

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端托管 | Cloudflare Pages |
| 后端 API | Cloudflare Functions |
| 数据库 | Cloudflare D1 (SQLite) |
| 媒体存储 | GitHub public/assets/ + 第三方图床 |
| 代码托管 | GitHub |

## 功能特性

- 🔐 用户认证（管理员/普通用户）
- 📝 文章管理（发布/编辑/删除）
- 🏷️ 分类管理（供水/制冷/消防/环保/压空/制氮/污水/换算）
- 🔍 全文搜索
- 📱 移动端优先设计
- 🖼️ Markdown 编辑器（支持图片/视频）
- 📊 管理后台（文章管理/用户管理）

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourname/knowledge-base.git
cd knowledge-base