# 中南大学空闲教室查询系统

> 基于真实教学楼平面图的可视化空闲教室查询系统，帮助同学快速找到空闲自习教室。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📖 目录

- [功能特点](#-功能特点)
- [在线预览](#-在线预览)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [更新教室数据](#-更新教室数据)
- [部署指南](#-部署到服务器)
- [技术栈](#-技术栈)
- [参与贡献](#-参与贡献)
- [许可证](#-许可证)

---

## 🌟 功能特点

- 📊 **真实平面图** — 按照中南大学新校区教学楼实际布局设计（A/B/C/D座）
- 🎨 **可视化展示** — 绿色（空闲）/ 红色（占用），一眼看清楚
- 🔍 **智能搜索** — 支持按教室号快速定位
- 📱 **响应式设计** — 适配电脑、平板、手机
- ⚡ **实时统计** — 显示空闲率、空闲/占用数量

---

## 🖥️ 在线预览

> https://www.ilovecsu.top

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- Python >= 3.8（用于数据转换脚本）

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/Hhy812/csu-schedule-crawler.git
cd csu-schedule-crawler

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run dev
```

浏览器访问 `http://localhost:5173` 即可看到效果。

### 构建生产版本

```bash
npm run build
# 构建产物在 dist/ 目录
```

---

## 📁 项目结构

```
csu-schedule-crawler/
├── public/
│   └── classroom_data.json    # 教室数据（JSON格式）
├── scripts/
│   └── convert_excel.py       # Excel → JSON 数据转换脚本
├── src/
│   ├── components/
│   │   ├── FloorPlanSVG.tsx   # SVG平面图组件（核心）
│   │   ├── FloorView.tsx      # 楼层视图
│   │   ├── SearchBar.tsx      # 搜索组件
│   │   ├── Sidebar.tsx        # 侧边栏
│   │   └── StatsPanel.tsx     # 统计面板
│   ├── types/
│   │   └── classroom.ts       # TypeScript 类型定义
│   ├── App.tsx                # 主应用入口
│   └── index.css              # 全局样式
├── Dockerfile
├── nginx.conf
└── README.md
```

---

## 📝 更新教室数据

每学期开始时，按以下步骤更新数据：

### 步骤 1：准备 Excel 文件

Excel 格式要求：

| 字段 | 说明 |
|------|------|
| Sheet 命名 | `第1周`、`第2周`…… |
| 行 | 时间段（1-2节、3-4节、5-6节、7-8节、9-10节）|
| 列 | 星期（周一 ~ 周五）|
| 单元格 | 空闲教室列表，空格分隔，如 `A101 A102 B203` |

### 步骤 2：运行转换脚本

```bash
cd scripts
python convert_excel.py 新学期空闲教室.xlsx ../public/classroom_data.json
```

### 步骤 3：重新构建部署

```bash
npm run build
# 将 dist/ 目录部署到服务器
```

---

## 🏗️ 教学楼布局说明

| 楼栋 | 楼层 | 每层教室数 | 备注 |
|------|------|-----------|------|
| A座 | 1–4 层 | 16–24 间 | 中间走廊，南北两侧分布，东西有楼梯/电梯 |
| B座 | 1–5 层 | 14–17 间 | 与 A 座类似布局 |
| C座 | 1–5 层 | 5–7 间   | 规模较小 |
| D座 | 1–3 层 | 1–16 间  | 3 层教室较少 |

如需修改教学楼布局，编辑 `src/components/FloorPlanSVG.tsx` 中的 `FLOOR_PLANS` 配置。

---

## 📦 部署到服务器

### 方式一：Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/classroom-query/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### 方式二：Docker

```bash
# 构建镜像
docker build -t classroom-query .

# 运行容器（映射到 8080 端口）
docker run -d -p 8080:80 classroom-query
```

### 方式三：静态托管平台

将 `dist/` 目录上传到以下任一平台均可：

- 腾讯云 COS + CDN
- 阿里云 OSS + CDN
- GitHub Pages
- Vercel / Netlify

详细步骤见 [部署指南.md](./部署指南.md)。

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | 前端框架 |
| Tailwind CSS | 样式 |
| shadcn/ui | UI 组件库 |
| Vite | 构建工具 |
| Python | 数据转换脚本 |

---

## 🤝 参与贡献

欢迎中南大学的同学一起完善这个项目！

### 方式一：成为 Collaborator（推荐校内同学）

联系仓库作者（微信/QQ 备注 GitHub 用户名），添加后即可直接克隆和推送代码。

### 方式二：Fork & Pull Request（通用方式）

```bash
# 1. Fork 本仓库（点击右上角 Fork 按钮）

# 2. 克隆你自己的 Fork
git clone https://github.com/你的用户名/csu-schedule-crawler.git

# 3. 新建功能分支（不要直接在 main 上开发）
git checkout -b feature/你的功能名称

# 4. 开发、提交
git add .
git commit -m "feat: 描述你做了什么"

# 5. 推送到你的 Fork
git push origin feature/你的功能名称

# 6. 在 GitHub 上发起 Pull Request
```

### 待完善功能（欢迎认领）

以下是还没做完的功能，可以在 [Issues](https://github.com/Hhy812/csu-schedule-crawler/issues) 中认领：

- [ ] 接入学校课表系统，实现数据自动爬取，无需手动更新 Excel
- [ ] 添加收藏/常用教室功能
- [ ] 支持更多教学楼数据
- [ ] 性能优化

### 提交规范

提交信息请遵循以下格式：

```
feat: 新增功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整（不影响功能）
refactor: 代码重构
chore: 构建/工具链相关
```

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源，欢迎自由使用和修改。