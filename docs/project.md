# 项目结构与边界

来做鸭 letsduck 面向 XGO Duck V2，提供涂装、展示与分享，以及个人版的舵机调试和 3D 组装教程。不支持任意机器人或任意 3MF 导入。

当前只维护 Windows x64 EXE 与 Apple 芯片 Mac arm64 DMG 两个客户端安装包。服务器专用功能与部署暂停维护，相关代码和历史说明保留。下表是源码结构，不是各模块的持续支持承诺；客户端依赖的共用模块仍随客户端维护与验证。

| 入口 | 职责 |
| --- | --- |
| `frontend/index.html` · `frontend/studio/` | 涂装台：三步主线、方案、发布、导出 |
| `frontend/home/` | 个人版首页：三个鸭子入口、拖动切换与编号完成门槛 |
| `frontend/debug/` · `frontend/shared/servo-map.ts` | 调试鸭、关节显示与共用编号映射 |
| `frontend/assemble/` | 组装教程：章节材料、主副舵盘、取件与安装状态 |
| `frontend/studio/phone.ts` · `phone.css` | 手机竖屏（≤760px）：全屏舞台、底部标签栏、可拖动底部面板、两侧浮动工具、触屏手势；桌面不运行 |
| `frontend/gallery/` | 配色广场：作品列表、详情、评分、改编家族、我的方案 |
| `frontend/shared/duck-view.ts` | Three.js 模型视图：选择、姿势骨架、材质、布局、截图与导出缩略图 |
| `frontend/shared/duck-actions.ts` · `duck-voice.ts` | MicroDuck 经典动作与叫声合成器（TypeScript） |
| `frontend/shared/api.ts` · `profile.ts` | API 客户端、登录注册与账号资料 |
| `frontend/shared/edition.ts` | 读取服务端版本配置，个人版屏蔽账号与广场入口 |
| `frontend/shared/poster.ts` | 分享海报与配色码 |
| `frontend/lib/` | 配色规则：分区、套色与配色码、色彩工具、超进化动画 |
| `apps/local/` · `启动来做鸭.command` · `.bat` | Node 个人版启动、资产检查与自有服务生命周期 |
| `apps/desktop/` | Electron 窗口、duck 协议、受限 preload、下载与更新；复用同一宿主与前端 |
| `tooling/src/stage-runtime-assets.ts` · `package-browser.ts` | 桌面/离线浏览器包共用资源暂存与生产依赖闭包 |
| `apps/server/` · `packages/host/` | Node/Fastify 路由、版本组合与静态服务 |
| `packages/contracts/` · `packages/domain/` | 两版及浏览器共用的类型、精确 JSON 与规则 |
| `packages/storage/` | SQLite/MySQL、账号、方案、作品、评分与只读源库迁移 |
| `packages/devices/` | 异步 ADB、共享总线、编号、调试与准备记录 |
| `packages/exporter/` | 固定 3MF 的材料分配、制造校验与有界 worker |
| `docker-compose.yml` · `.env.example` | 服务器版：nginx + Node/Fastify + MySQL 8.4 |
| `docker-compose.https.yml` · `deploy/Caddyfile` | 可选 HTTPS：Caddy 自动证书 |
| `vite.config.ts` · `frontend/tsconfig.json` | 严格 TS、多页面/Worker 构建、同步预绘制与内容 hash |
| `tests/` · `tooling/test/` | Node 合约、冻结独立 oracle、资产与真实浏览器回归 |
| `docs/history/` · `tools/history/` | 脱敏研究记录与早期处理脚本 |

## 数据放在哪里

- 草稿、背景与语言偏好在浏览器本地。个人版命名方案、编号验证和取件记录存在 SQLite；服务器版未登录时方案先存浏览器，登录后同步到账号，本地保留缓存。
- 账号是昵称 + 简单密码，服务器保存加盐哈希；面向几个朋友的小圈子，没有找回密码、邮箱或权限管理。
- 发布的作品所有人可见；只有作者能删除，不能给自己评分。删除原作后，改编作品保留但不再挂在家族树下。

## 当前边界

- 组装/散开/排列和姿势只改变显示，不写入打印结构。
- 原模型中合并的双眼等部件不能凭 UI 分成独立零件。
- 软质件沿用 TPU 90A。
- 非拓竹品牌色卡是示意数据。分享链接和海报二维码需要配置可公开访问的 HTTPS 域名 `DUCK_PUBLIC_URL`。
- HTTPS 可使用仓库提供的 Caddy 配置或已有反向代理。不提供实物照片上传、自动切片或打印机控制。
- USB 设备控制仅在个人版本机开放。编号验证、当前在线状态与机械零位分别表示；软件预览不证明实物安装、接线或公差。
