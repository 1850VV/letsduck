<p align="right"><b>简体中文</b> · <a href="README.en.md">English</a></p>

# 来做鸭 / letsduck

<p align="center"><img src="frontend/shared/brand/logo.svg" width="128" alt="来做鸭 letsduck"></p>

为 XGO Duck V2 准备的涂装、舵机调试和 3D 组装工具。给机器鸭选颜色，导出改色 3MF 和物料清单；在本机连接 UNO Q，核查舵机编号与参数，再跟着教程组装。

**公开主线提供软件源码。运行需要另行准备有权使用的本地资产包，单独一份 3MF 不够。** 模型、制造数据、教程媒体及其衍生资产有独立授权，代码的 MIT 许可证不覆盖它们。先读 [本地资产说明](docs/local-assets.md) 和 [第三方声明](THIRD_PARTY_NOTICES.md)。

<p align="center"><img src="docs/media/outfits.gif" width="560" alt="在涂装台切换机器鸭配色"></p>

## 三个入口

个人版首页可以左右拖动三只鸭，也可以用方向键切换。点侧面的鸭子先转到中间，再点中间的鸭子进入功能。

| 入口 | 可以做什么 | 使用条件 |
| --- | --- | --- |
| 来涂鸭 `/paint` | 选配色、细调零件、摆姿势、制作海报、保存方案、导出 3MF + BOM | 完整涂装资产包 |
| 调试鸭 `/debug/` | 查看连接与实时反馈，扫描、核查和修改舵机编号与参数，微调和零位校准 | 本机 USB 连接 UNO Q；已安装 ADB 和兼容的 Duck Runtime |
| 组装鸭 `/assemble/` | 按章节查看材料、取件盘位、3D 安装步骤及参考视频 | 组装资产包；首页入口在 15 个安装编号读回验证通过后解锁 |

涂装台里的动作是屏幕预览。调试鸭中的设备操作会作用于实物，需点击对应操作按钮。打开调试界面只读取状态。

### 涂装与导出

1. **选个起点**：白胚、经典配色、灵感骰子，或自己的已存方案。
2. **细调部位**：点模型或列表选零件，再选耗材颜色或自由调色。支持刷子、吸管、聚焦、A/B 对比和部位锁定。
3. **展示与导出**：摆姿势、播放动作和叫声、换背景、生成海报，导出保留原打印结构的改色 3MF 和 BOM。

<table><tr>
<td><img src="docs/media/zh/02-refine.jpg" alt="选择零件并修改颜色"></td>
<td><img src="docs/media/zh/03-show.jpg" alt="姿势、海报与导出"></td>
</tr></table>

导出面向固定版本的 35 个零件、6 块打印板。显示姿势和散开效果不写回制造网格。它不提供任意 3MF 导入、自动切片或打印机控制。屏幕颜色不能保证实物色差，模型预览也不能证明装配公差。

手机涂装支持底部步骤面板、双指缩放、双击聚焦和长按对比。涂装与社区提供 12 种语言词典，新增调试和组装界面仍有中文内容；见 [翻译维护](docs/i18n.md)。

### 舵机准备与组装

- 按[厂商指引](https://www.xgorobot.com/duck.html#software)完成 Arduino App Lab、Duck OS 与板卡设置。程序复用已安装的 ADB；非标准路径可通过 `DUCK_ADB` 指定。
- 首次编号时只连接一只舵机。目标编号为 `10–14`、`20–24`、`30–34`。程序匹配运行端配置档，写入后读回复核；同号舵机需分开接入，不能分别寻址。
- 换接前使用安全停机，等待至少 15 秒并确认停止，再断开 USB 和电池。不要带电换接。
- 编号验证记录与当前在线状态分别保存。断线保留记录，改号或未确认的写入会重新计算完成状态；在线数量不代表编号已验证数量。
- 组装教程提供按数量陈列的材料、单件放大旋转、主副舵盘点选和取件记录。取件盘按三排五列固定摆放，取走后留空，不补位。
- 编号、参数与机械零位是不同的事。软件不能修复装反或卡住的机构。线材规格及部分安装朝向仍需结合厂商资料和实物核对，页面完成状态不等于实物验收。

## 选择运行方式

| | 个人使用版 | 服务器版 |
| --- | --- | --- |
| 用途 | 一人在本机涂装、调试和组装 | 朋友间分享配色、评分和改编 |
| 启动 | Python 3.9+，只用标准库 | Docker Compose：nginx + FastAPI + MySQL 8.4 |
| 数据 | 本机 SQLite；草稿与偏好在浏览器 | MySQL；浏览器保存未登录草稿 |
| 账号与配色广场 | 无 | 昵称账号、私有方案、发布、评分、「做同款」和改编家族 |
| USB 设备控制 | 本机支持 | 不提供 |

两个版本共用前端、配色校验和 3MF 导出逻辑。Electron 桌面客户端仍在独立开发分支；以下启动方式对应 `main` 的 Python 个人版和 Docker 服务器版。

## 本机启动

```sh
git clone https://github.com/1850VV/letsduck.git
cd letsduck
python3 scripts/import_local_assets.py /path/to/authorized/assets
python3 scripts/import_assembly_assets.py /path/to/authorized/assembly/assets
python3 run.py
```

Windows 可以把 `python3` 换成 `py -3`。组装资产导入可以暂时跳过，组装和首页模型预览需要它们；文件要求见 [本地资产说明](docs/local-assets.md)。

也可以双击 `启动来做鸭.command`（macOS）或 `启动来做鸭.bat`（Windows）。缺少 Python 时按启动器提示安装。macOS 首次打开如被拦截，可在 Finder 中右键文件并选择「打开」。

浏览器默认打开 `http://127.0.0.1:8876/`，端口被占用时尝试下一个。`python3 run.py --port 8880 --no-open` 可指定端口并关闭自动打开浏览器。关闭启动进程即退出。

个人版只监听本机。命名方案、编号验证和取件进度保存在应用目录外的数据库：

- macOS：`~/Library/Application Support/DoodleDuck/personal.db`
- Windows：`%APPDATA%\DoodleDuck\personal.db`
- Linux：`~/.local/share/doodleduck/personal.db`

可用 `DUCK_PERSONAL_DB` 指定数据库位置。更新源码前备份该文件；浏览器草稿与偏好需另行保留。

## 服务器部署

先准备有权使用的涂装资产包，再配置数据库密码：

```sh
python3 scripts/import_local_assets.py /path/to/authorized/assets
cp .env.example .env
# 编辑 .env，设置两个不同的随机长密码
docker compose up -d --build
```

默认地址为 `http://<服务器地址>:8080/`。nginx 提供前端并转发 `/api/`；后端和 MySQL 留在容器内部网络。资产只读挂载，源 3MF 不通过静态地址提供。

配色广场支持热门、最新和高分排序、筛选、评分、「做同款」及改编家族。截图中的账号、作品和评分均为示例数据。

![配色广场示例](docs/media/zh/05-gallery.jpg)

对外部署时，按 [部署说明](docs/deployment.md) 配置 HTTPS、域名和备份。仓库提供可选的 Caddy 配置。`DUCK_PUBLIC_URL` 必须是可公开访问的 HTTPS 域名，分享链接与海报二维码才会生成。`.env` 里的 `DUCK_BIND`、`DUCK_PORT`、数据库与导出并发设置见 [.env.example](.env.example)。

## 开发与验证

TypeScript 工作区使用 Node 24.20+（24 系列），由 `packages/` 与 `tooling/` 组成。现有 Python 运行入口和前端继续独立工作；新增工具不切换服务或迁移用户数据。

`@letsduck/contracts` 提供 JSON Schema、由 schema 推导的类型和设备映射；`@letsduck/domain` 提供配色、方案、耗材兼容与打印预设规则。两个包均可用于浏览器。共享规则通过当前 Python 实现的差分用例验证；旧页面的接入按后续迁移批次完成。

```sh
npm ci
npm run build
npm run typecheck
npm run test:typescript
npm run probe:runtime
npm run verify:phase0
npm run verify:phase1
```

`verify:phase0` 执行新工作区检查、现有 Node/组装检查、README 的 Python 检查和公开发行扫描。Python 默认使用本仓库 `.venv`，也可用 `PYTHON` 指定解释器。`probe:runtime -- --electron /path/to/electron` 额外验证 Node 与 Electron 的 SQLite 互读回写；它不代替真实 MySQL、安装包或设备验收。

迁移前的行为与性能对照可在本地采集：

```sh
npm run baseline:capture -- --assets /path/to/authorized/assets --output output/baseline --browser
```

工具启动独立的旧版个人服务并使用临时数据库，默认采样 30 次保存和 10 次真实导出；`--browser` 使用匹配的 Playwright 托管 Chromium。浏览器设备请求被拦截，不接真实 USB。结果包括实际导出的 3MF、请求参数、ZIP 条目内容与原压缩记录的摘要。结果含本机环境和独立授权资产信息，仅保存在忽略的本地目录。此命令不接受现有服务地址，不使用原个人数据库；没有模型时只采集可用部分，不能作为真实导出验收。

前端为原生 ES 模块，无需构建即可开发。个人版执行 `python3 run.py`。服务器版开发使用 Python 3.11+：

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python backend/server.py --static frontend
```

未设置数据库连接时，服务器开发进程使用本地 SQLite；生产部署使用 MySQL。连接、迁移、备份和回退见 [部署说明](docs/deployment.md)。

```sh
python3 -I -m unittest discover -s tests -p test_personal.py -v
python3 scripts/publication_audit.py
.venv/bin/python -m unittest discover -s tests -v
node --test tests/*.mjs tests/assembly/*.test.mjs
```

完整测试需要本地资产和开发依赖。真实 MySQL 回归还需设置 `DUCK_TEST_DATABASE_URL`，库名必须以 `duck_test_` 开头；未配置时相关测试跳过。[公开 CI](.github/workflows/check.yml) 使用合成数据和 MySQL，不持有受限模型。它不能代替真实模型导出、浏览器交互或实物验收。

来涂鸭基础交互回归从首页功能窗口进入，使用真实点击和键盘测试系列下拉框与相邻涂装操作；只读运行，不写入个人数据库或设备。需模型资产、Playwright 及匹配的托管 Chromium：

```sh
node tests/browser/paint-basic-ui.mjs --url http://127.0.0.1:8876 --output output/playwright/paint-basic-ui
```

无本地 Node 依赖时，可用 `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs` 指定已有 Playwright。脚本保护点击时控件及部位范围不被破坏；macOS 系统菜单的鼠标选项、键盘确认/取消需补原生操作取证，不用程序化选值替代。浏览器窄屏模拟不代替实机触控验收。

调试鸭和首页浏览器回归使用 `tests/debug_browser_fixture.py` 的假运行端和临时数据库，再执行 `tests/duck_debug_browser.js` 与 `tests/home_carousel_browser.js`。这些检查需要本地组装资产；不要把自动化检查连到真实设备。

首页语言菜单另有独立只读回归，可复用上述 8896 隔离夹具。需要本地 Playwright、匹配的托管 Chromium 和模型资产：

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser/home-language-menu.mjs --url http://127.0.0.1:8896 --output output/playwright/home-language-menu
```

若 Node 环境能直接导入 `playwright`，可省略 `PLAYWRIGHT_MODULE`。脚本使用临时浏览器配置并阻止 HTTP 写入，检查入口位置、展开边界、裁切、点击、键盘退出、语言记忆及运行错误；包含桌面、响应断点、窄屏、长标签和现有 RTL 语言。默认使用无界面 Chromium 和软件 WebGL；`--headed` 可查看过程。结果及截图写入指定目录；它不代替其他页面、原生浏览器缩放或人工视觉验收。

## 源码与文档

```text
frontend/   首页、涂装台、调试鸭、组装教程、配色广场与共享模块
personal/   本机 HTTP 服务、SQLite、UNO Q / ADB 调试与舵机准备
backend/    FastAPI、账号与社区存储、共用配色规则和 3MF 导出
deploy/     可选 HTTPS 配置
scripts/    本地资产导入、显示模型打包与公开发行检查
tests/      Python、Node 与浏览器检查
assets/     另行准备的本地资产；不应提交
```

- [项目结构与边界](docs/project.md)
- [本地资产与复现条件](docs/local-assets.md)
- [部署、迁移与备份](docs/deployment.md)
- [第三方来源与许可证](THIRD_PARTY_NOTICES.md)
- [公开发行范围](docs/publication.md)
- [贡献指南](CONTRIBUTING.md) · [安全报告](SECURITY.md)

## 许可证

原创代码和文档采用 [MIT](LICENSE)。Three.js、meshoptimizer、MicroDuck 等第三方代码保留各自声明，详见 [第三方声明](THIRD_PARTY_NOTICES.md)。模型、制造商数据、品牌及 README 中的模型画面不因本仓库获得新的授权。来做鸭不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品。
