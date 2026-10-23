# 前端发布构建

服务器版的 nginx 镜像在构建时运行 `frontend/build.mjs`（esbuild，版本锁定在 `frontend/package-lock.json`）。个人版、开发服务器和 Node 测试仍直接使用源码，不需要 Node 或任何构建步骤。

## 构建做什么

- **打包和压缩**：涂装台和配色广场的入口脚本打包、去掉未用代码并压缩，输出到 `build/`，文件名带内容哈希；两个页面共用同一批代码块。
- **按语言加载**：`locales/load.mjs` 在源码里一次给出全部语言；发布构建把它换成每种语言一个代码块。页面只加载英语（兜底）和当前语言，其他语言在第一次选择时下载。页面头部的一小段内联脚本按与 `i18n.mjs` 相同的规则（已保存的选择，否则浏览器首选语言）提前预加载这两个块，避免多一次往返。
- **推迟非首屏模块**：二维码编码器（只用于已发布作品的分享海报）、超进化发布仪式、兼容几何路径用的 BufferGeometryUtils，都改为第一次用到时再加载。源码里也是同样的按需加载。
- **Worker**：模型 Worker 单独打包为一个带哈希的文件（含 meshopt 解码器），模型加载器指向这个文件名。
- **页面**：每个页面只有一个压缩后的样式表，保持原来的层叠顺序；对静态依赖的代码块和三个模型文件做预加载。
- **预压缩**：`build/` 中每个文件都写一份 `.br`（q11）和 `.gz`（9 级）。nginx 按 `Accept-Encoding` 先发 Brotli、再发 gzip，与模型文件规则相同，不需要 Brotli 模块；`build/` 下文件缓存一年（`immutable`），页面每次核对。

本地构建：

```sh
npm ci --prefix frontend
node frontend/build.mjs <输出目录>
```

## 前后对比

`tests/load-timing-browser.js` 用原生 nginx 分别服务改动前的源码（按当时的 `stamp.py` 处理）和本次的发布构建，`/api` 转给使用临时数据库的个人版后端。每次访问都启动一个全新的 Chromium（HTTP 缓存和着色器缓存都是空的），语言为简体中文，视口 1440×900，两边交替先后，每种网络条件各 7 次，表中为中位数。第一帧是 `duck:first-frame` 标记，即主视图第一次提交渲染的时间（从导航开始计）。

环境：Apple M4、macOS、Playwright 1.58.2 自带的 Chromium、nginx 1.31.8（Homebrew）。网络和 CPU 由 Chrome DevTools 协议模拟，不是真实的公网或手机测量。

| 条件 | 改动前第一帧 | 改动后第一帧 | 改动前 DOMContentLoaded | 改动后 DOMContentLoaded |
| --- | --- | --- | --- | --- |
| 桌面：40 ms 延迟、50 Mbps、CPU 不降速 | 695 ms（p95 793） | 410 ms（p95 424） | 448 ms | 157 ms |
| 慢速：150 ms 延迟、9 Mbps、CPU 降速 4 倍 | 2422 ms（p95 2435） | 1324 ms（p95 1365） | 1792 ms | 591 ms |

| 第一次打开涂装台的传输量（响应体） | 改动前 | 改动后 |
| --- | --- | --- |
| JS | 716.9 KiB（39 个请求，nginx 动态 gzip） | 200.7 KiB（10 个请求，预压缩 Brotli，含 Worker） |
| CSS | 24.5 KiB（7 个请求） | 16.4 KiB（1 个请求） |
| 模型 | 583.0 KiB | 583.0 KiB（未改动） |
| 第一帧前合计 | 1329.2 KiB | 804.3 KiB |

复现（需要单独授权的本地资产包、`geometry.positions.bin` 及其 `.br/.gz`、原生 nginx）：

```sh
npm ci && npm ci --prefix frontend
DUCK_NGINX_BIN=/path/to/nginx node tests/load-timing-browser.js --before <含 duck:first-frame 标记的改动前提交> --rounds 7
```

原始样本写入被忽略的 `output/load-timing/`。

## 等价性检查

- 计算样式：在桌面（1440 宽）和手机（390 宽）下逐元素比较涂装台和广场的 26 个计算样式属性，改动前后差异为 0（只排除了改为按需创建的超进化仪式节点）。
- 构建契约（`tests/test_frontend_build.mjs`，公开 CI 运行）：页面只引用存在的带哈希文件；每个语言块与源码合并后的字典逐键相同；内联预加载与 `i18n.mjs` 选出同一种语言；`.br/.gz` 解压后与原文件一致；Worker 是自包含的单个文件。
- nginx 契约（`tests/test_nginx_assets.py`）：`build/` 下的 Brotli、gzip、原文件回退，`q=0`，类型、一年缓存、304 和 404。
- 本地浏览器：语言切换（按需下载新语言后焦点回到语言按钮）、发布作品、超进化仪式、带二维码的分享海报、广场、3MF 导出（13 张缩略图，HTTP 200）、手机布局；`tests/delivery-browser.js`、导出和回退路径的浏览器测试，以及在源码上运行的 i18n 浏览器脚本（279 项验收等）。

## 限制

- three.js 仍占首屏 JS 的一半左右（Brotli 约 104 KiB）。它在 vendor 目录里没有 `package.json`，esbuild 只能按语句做 tree-shaking，即使标记为无副作用，体积也没有变化。
- 动作库和叫声合成器在启动时就要用到它们的列表和播放器，这次没有拆分。
- 没有测 Windows、真实手机和公网。
