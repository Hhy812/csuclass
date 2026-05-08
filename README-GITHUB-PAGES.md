# GitHub Pages 部署说明（静态版）

这个目录是纯静态版本，不依赖后端接口。

## 1. 本地验证

```bash
npm install
npm run build
npm run preview
```

## 2. 作为独立仓库发布（推荐）

1. 新建 GitHub 仓库（例如 `classroom-static`）。
2. 把 `app-static` 目录内所有文件上传到仓库根目录。
3. 提交后，在仓库的 `Settings -> Pages` 打开 GitHub Pages。
4. Source 选择 `GitHub Actions`。
5. 仓库里保留 `.github/workflows/deploy-pages.yml`（本目录已提供）。
6. 推送 `main` 分支后，等待 Actions 完成即会发布。

## 3. 如果放到现有仓库的子目录

如果你不想建新仓库，而是放在现有仓库 `app-static/` 子目录：

1. 需要把工作流文件移到仓库根目录 `.github/workflows/`。
2. 在工作流里把 `working-directory` 设置为 `app-static`。
3. `upload-pages-artifact` 的 `path` 设置为 `app-static/dist`。

## 4. 注意事项

1. 当前“访问人数”是浏览器本地计数（每个设备单独统计，不是全站统一）。
2. 数据来自 `public/classroom_data.json`，如需更新课表，替换此文件后重新部署。
