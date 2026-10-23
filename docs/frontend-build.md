# 前端发布构建

服务器版的 nginx 镜像在构建时运行 `frontend/build.mjs`（esbuild，版本锁定在 `frontend/package-lock.json`）。个人版、开发服务器和 Node 测试仍直接使用源码，不需要 Node 或任何构建步骤。

## 构建做什么

- **打包和压缩**：涂装台和配色广场的入口脚本打包、去掉未用代码并压缩，输出到 `build/`，文件名带内容哈希；两个页面共用同一批代码块。
- **按语言加载**：`locales/load.mjs` 在源码里一次给出全部语言；发布构建把它换成每种语言一个代码块。页面只加载英语（兜底）和当前语言，其他语言在第一次选择时下载。页面头部的一小段内联脚本按与 `i18n.mjs` 相同的规则（已保存的选择，否则浏览器首选语言）提前预加载这两个块，避免多一次往返。
- **推迟非首屏模块**：二维码编码器（只用于已发布作品的分享海报）、超进化发布仪式、兼容几何路径用的 BufferGeometryUtils，都改为第一次用到时再加载。源码里也是同样的按需加载。
- **Worker**：模型 Worker 单独打包为一个带哈希的文件（含 meshopt 解码器），由页面 `<head>` 最先启动，并由它自己下载位置包（不再用 preload），模型加载器接管这个 Worker。
- **页面**：每个页面只有一个压缩后的样式表，保持原来的层叠顺序；对静态依赖的代码块、`model.json` 和 `catalog.json` 做预加载。两段内联脚本（语言预加载、启动 Worker）放在样式表之前，否则会等 CSS 下载完才执行。
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

## 启动流水线

第一帧之前的几件事彼此独立，现在并行进行，并各自留下 `duck:*` 标记（`performance.getEntriesByType('mark')`），测量脚本会全部汇总：

| 标记 | 含义 |
| --- | --- |
| `duck:loading` | `loadDuck()` 开始；涂装台不再等 `/api/site` 返回才开始加载模型 |
| `duck:renderer-ready` | WebGL 上下文和环境光（PMREM）已在模型下载期间建好，交给第一个视图 |
| `duck:shaders-ready` | 首帧要用的着色器（默认两种质感、硬件、阴影）已用 `compileAsync` 预编译；three.js 按缓存键共享程序，视图里的材质直接复用 |
| `duck:model-description` | `model.json` 到达，发给 Worker 做校验 |
| `duck:positions-received` | Worker 收完位置包（时间由 Worker 上报）；`detail.bytes` 是传输字节 |
| `duck:geometry-ready` | 解码和法线计算完成；Worker 边下载边解码，所以几乎与上一项同时 |
| `duck:view-ready` / `duck:first-frame` | 场景建好 / 第一次提交渲染 |

- Worker 自己下载位置包，每个网格的字节一到就解码并计算法线，下载和解码都不需要主线程。位置包先解码、后校验：`model.json` 到达后逐个网格核对 id、类型和数量，不匹配仍然报错并回退到旧几何。
- 解码超时从 Worker 收完位置包时才开始计时，慢网络不会被当成 Worker 卡死。
- Worker 脚本加载失败时直接回退到旧几何，不再白白下载新格式的位置包；位置包缺失时同样回退。

在同样的条件下与上一版（`77cb7de`，PR #5）对比，每种条件各 7 次，中位数：

| 条件 | 上一版第一帧 | 本版第一帧 |
| --- | --- | --- |
| 桌面：40 ms、50 Mbps、CPU 不降速 | 420 ms（p95 504） | 343 ms（p95 356） |
| 慢速：150 ms、9 Mbps、CPU 降速 4 倍 | 1325 ms（p95 1334） | 1233 ms（p95 1236） |

桌面的阶段中位数：`loading` 180、`renderer-ready` 227、`shaders-ready` 263、`positions-received` 318、`geometry-ready` 319、`view-ready` 324、`first-frame` 343 ms。慢速条件下位置包到 1172 ms 才收完，带宽是瓶颈，其余工作都已藏在下载期间。传输字节基本不变（多了约 1.5 KiB 的内联脚本和代码）。

画面：首屏、基础、丝绸、哑光的快照与上一版逐像素一致；半透明快照有约 200 个通道相差 1–2，上一版自己与自己比较也有完全相同的差异，与本次改动无关。

## 限制

- three.js 仍占首屏 JS 的一半左右（Brotli 约 104 KiB）。它在 vendor 目录里没有 `package.json`，esbuild 只能按语句做 tree-shaking，即使标记为无副作用，体积也没有变化。
- 动作库和叫声合成器在启动时就要用到它们的列表和播放器，这次没有拆分。
- 没有测 Windows、真实手机和公网。本地测量用 HTTP/1.1（每个主机 6 个连接）；生产环境经 Caddy 走 HTTP/2/3，请求排队情况不同，没有单独测量。
