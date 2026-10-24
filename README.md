<p align="right"><b>简体中文</b> · <a href="README.en.md">English</a></p>

# 来做鸭 / letsduck

<p align="center"><img src="frontend/shared/brand/logo.svg" width="128" alt="来做鸭 letsduck"></p>


给 XGO Duck V2 机器鸭涂装的小工具：三步配好颜色，让它点头、嘎嘎叫、摇摆，生成海报分享给朋友，再导出保留打印结构的改色 3MF 交给代打服务商。分两个版本：双击即用的**个人使用版**，和带配色广场、评分、「做同款」的**服务器版**。

<p align="center"><img src="docs/media/outfits.gif" width="560" alt="点一张卡片，机器鸭马上换装"></p>

**这是源码发行版。仓库不附带模型、3MF、衍生网格或耗材数据包。** 它们有独立的第三方授权；MIT 不覆盖这些资产。运行需要自行合法持有完整本地资产包，单独一份 3MF 还不足以复现装配预览。详见 [本地资产说明](docs/local-assets.md)。

## 三步涂装

**① 选个起点**：白胚、经典配色、灵感骰子（可锁定、单张重掷）或「我的方案」，点一张鸭子马上换装。

![第 1 步：选个起点](docs/media/zh/01-start.jpg)

**② 细调部位**：在模型或左侧列表点部位，再点颜色。拓竹 PLA Basic / TPU 90A 真实色表，也可以自由调色；刷子、吸管、聚焦、并排放大、A/B 对比和锁定部位都在手边。

<table><tr>
<td width="60%"><img src="docs/media/zh/02-refine.jpg" alt="第 2 步：细调部位"></td>
<td width="40%"><img src="docs/media/refine.gif" alt="点部位、点颜色"></td>
</tr></table>

**③ 展示分享**：摆姿势，播放 MicroDuck 经典动作和叫声（每套配色有自己的嗓音），换背景，生成海报，保存或发布到配色广场，或者导出 3MF。

<table><tr>
<td width="60%"><img src="docs/media/zh/03-show.jpg" alt="第 3 步：展示分享"></td>
<td width="40%"><img src="docs/media/moves.gif" alt="嘎嘎叫、摇摆、捡东西"></td>
</tr></table>

![分享海报](docs/media/zh/04-poster.jpg)

## 配色广场（服务器版）

朋友们发布的配色都在这里：热门 / 最新 / 高分、色系和标签筛选、评分。喜欢就「做同款」带回涂装台接着改，改编会挂在原作的家族树下，并标出改了什么。

![配色广场](docs/media/zh/05-gallery.jpg)

<table><tr>
<td><img src="docs/media/zh/06-detail.jpg" alt="作品详情：改编来源和改了什么"></td>
<td><img src="docs/media/zh/07-family.jpg" alt="改编家族树"></td>
</tr></table>

<p align="center"><img src="docs/media/zh/08-mobile.jpg" width="300" alt="手机上的配色广场"></p>

截图中的作者、作品和评分都是演示用的示例数据。

## 还有这些

- **真实耗材**：拓竹 PLA Basic / TPU 90A 色表；其他品牌色卡只是示意，发布和导出前会提示换成真实耗材。
- **手机**：鸭子几乎占满屏幕；三步放在底部标签栏，每步的内容在可拖动的底部面板里（上滑展开、下滑收起到一条缝）；涂装工具和视角按钮浮在两侧。双指缩放、双击聚焦所选部位、长按鸭子对比原色，支持的手机上点选会轻微震动。
- **导出**：核对 35 个零件的耗材分配，生成改色 3MF（重新渲染 6 块打印板缩略图）和 BOM，交给代打服务商。
- **账号（服务器版）**：昵称 + 简单密码。私有方案存进账号；未登录时方案先存在浏览器，登录时同步。
- **分享**：配色码随时可复制、粘贴带入；已发布作品的海报带真实二维码，与复制链接指向同一作品（需要配置 `DUCK_PUBLIC_URL`）。
- **12 种语言**：简中、繁中、英、日、韩、法、德、西、巴西葡语、俄、阿拉伯语和印地语。右上角切换，默认跟随浏览器语言。见 [翻译维护](docs/i18n.md)。

屏幕颜色不是实物色差保证；踝轴等装配位置有示意成分，尚未验证装配公差。

## 两个版本

| | 个人使用版 | 服务器版 |
| --- | --- | --- |
| 适合 | 自己在电脑上涂色 | 几个朋友一起用：账号、配色广场、评分、做同款 |
| 运行 | 双击启动，Mac / Windows | Docker：nginx 前端 + FastAPI 后端 + MySQL 8.4 |
| 依赖 | 只需要 Python 3.9+，不安装任何包 | Docker Compose（服务器上） |
| 数据 | 本机一个 SQLite 文件 | MySQL（`mysql-data` 卷） |
| 代码 | `personal/`（Python 标准库） | `backend/`（FastAPI + SQLAlchemy） |

两个版本共用同一套前端 `frontend/`，前端通过 `/api/site` 得知当前版本：个人版隐藏登录、配色广场和发布。配色校验（`backend/rules.py`）和 3MF 导出（`backend/exporter.py`）只用标准库，两个版本共用，结果一致。

```
frontend/   静态前端：index.html（涂装台）、home.html + home/（个人版首页）、gallery/（配色广场，仅服务器版）、shared/、lib/、locales/、vendor/
personal/   个人版服务：app.py（静态文件 + 方案/导出接口）、schemes.py（本机 SQLite）
backend/    服务器版 API：server.py（FastAPI 路由）、store.py / database.py（MySQL）、rules.py、exporter.py
assets/     本地资产包（被 Git 忽略；个人版直接读取，服务器版只读挂载）
```

## 个人使用版：双击启动

1. 把资产包放进 `assets/`：`python3 scripts/import_local_assets.py /path/to/assets`（Windows：`py -3 scripts\import_local_assets.py C:\path\to\assets`）。
2. 双击启动：
   - **macOS**：`启动来做鸭.command`。用系统自带的 Python 3 就行；没有的话会弹出「安装命令行开发者工具」，点安装即可。第一次若提示无法验证开发者：在 Finder 里右键 → 打开。
   - **Windows**：`启动来做鸭.bat`。没有 Python 时会询问是否用 winget 安装 Python 3.12，或打开 python.org 下载页（安装时勾选 Add python.exe to PATH）。
3. 浏览器自动打开 `http://127.0.0.1:8876/`（端口被占用时自动换下一个）：首页两张卡片，「想涂鸦」进涂装台（`/paint`），「想做鸭」进组装教程（接入前显示「即将开放」）。关闭启动窗口即退出。

也可以在终端运行 `python3 run.py`（`--port` 改端口，`--no-open` 不自动开浏览器）。

- 「我的方案」保存在本机：macOS `~/Library/Application Support/DoodleDuck/personal.db`，Windows `%APPDATA%\DoodleDuck\personal.db`，Linux `~/.local/share/doodleduck/personal.db`；`DUCK_PERSONAL_DB` 可指定别的位置。放在应用文件夹之外，换新版本解压覆盖不会丢；最多 30 套。
- 草稿、语言和背景偏好在浏览器里。没有账号、配色广场和发布；可以导出 3MF、保存海报、复制或粘贴配色码。
- 只监听本机 `127.0.0.1`。旧版个人模式（`backend/data/doodleduck.db` 里的个人方案）在第一次启动时自动带入一次。

## 服务器版：Docker + MySQL

1 核 2 GB 的云服务器就够用（见下面「小服务器建议」）。三个容器空闲时合计约 250–330 MB 内存；3D 渲染和涂色都在用户浏览器里完成，服务器只存数据和导出 3MF。

```sh
git clone git@github.com:1850VV/letsduck.git
cd letsduck
python3 scripts/import_local_assets.py /path/to/assets   # 资产包只挂载，不打进镜像；同时生成更小的 geometry.pack.bin
cp .env.example .env                                      # 填两个不同的随机长密码
docker compose up -d --build
```

打开 `http://<服务器地址>:8080/`（`.env` 里 `DUCK_PORT` / `DUCK_BIND` 可改）。

- `frontend`（nginx）提供静态页面、gzip 压缩和只读的 `/assets/`（不对外提供源 3MF），并把 `/api/` 转发给 `backend`；`backend` 只在内部网络，MySQL 不映射宿主机端口。
- **HTTPS（自动证书）**：把域名和 `www.` 都解析到服务器、放行 80 和 443 端口，然后在 `.env` 里设置：

  ```dotenv
  DUCK_DOMAIN=你的域名
  DUCK_PUBLIC_URL=https://你的域名
  DUCK_BIND=127.0.0.1
  DUCK_PORT=8080
  COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml
  ```

  再 `docker compose up -d`。`docker-compose.https.yml` 加一个 Caddy 容器，自动申请和续期 Let's Encrypt 证书，HTTP 跳转 HTTPS，`www.` 跳转到主域名。设置 `DUCK_PUBLIC_URL` 后，复制链接和海报二维码才会生成（指向 `<DUCK_PUBLIC_URL>/gallery/#d/<作品ID>`）；未配置、非 HTTPS、localhost 或 IP 地址都不会生成分享链接。也可以改用你已有的反向代理。
- 备份：`docker compose exec -T mysql sh -c 'mysqldump --single-transaction -uduck -p"$MYSQL_PASSWORD" doodleduck' > backup.sql`。从旧的 SQLite 部署升级、回退和外部 MySQL 见 [部署与迁移说明](docs/deployment.md)。

### 小服务器建议（1 核 2 GB）

- **先开 2 GB swap**，防止构建镜像或偶发高峰时内存不够、进程被系统杀掉（Ubuntu / Debian，只需做一次）：

  ```sh
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

- **MySQL 缓存**：`.env` 里 `DUCK_MYSQL_BUFFER_POOL` 默认 `128M`，几个朋友的数据量足够；4 GB 内存可改成 `256M`。改完 `docker compose up -d` 生效。
- **导出**保持 `DUCK_EXPORT_WORKERS=1`：单核每次导出约 1–2 秒，同时算 1 个、排队 2 个，再多会提示稍后重试。
- **带宽比 CPU 和内存更关键**：新用户第一次打开约下载 3.8 MB（gzip 后，其中模型 3 MB），5 Mbps 大约每分钟能承受 10 个新用户首次打开，30 Mbps 约 60 个。构建前端镜像时，`frontend/stamp.py` 给每个脚本和样式加上内容哈希、一个 import map 和预加载，所有模块和模型一打开就并行下载；带哈希的代码缓存一年，模型缓存 7 天，老用户再来基本不用联网等待。更换资产包后，7 天内访问过的浏览器可能需要强制刷新。

## 本地开发

前端无需构建。个人版用系统 Python 直接跑 `python3 run.py`。服务器版需要 Python 3.11+ 和依赖：

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
DUCK_DATABASE_URL='mysql+pymysql://user:pass@127.0.0.1:3306/doodleduck' .venv/bin/python backend/server.py --static frontend
```

不设 `DUCK_DATABASE_URL` 时服务器版开发用 `backend/data/doodleduck.db`（SQLite，仅供开发和测试；部署一律用 MySQL）。

## 验证

```sh
python3 -m unittest discover -s tests -p test_personal.py -v   # 个人版：系统 Python，不装任何包
.venv/bin/python scripts/publication_audit.py
.venv/bin/python -m unittest discover -s tests -v              # 全部 Python 测试（需资产包）
node --test tests/*.mjs
```

真实 MySQL 回归：设置 `DUCK_TEST_DATABASE_URL`（库名必须以 `duck_test_` 开头），否则相关测试跳过。CI 同时提供 MySQL。CI 不持有模型资产，不能替代真实模型、导出和浏览器验收。

导出默认同时执行 1 个任务，最多等待 2 个；超过容量返回 `503` 和 `Retry-After`。可用 `DUCK_EXPORT_WORKERS` / `DUCK_EXPORT_QUEUE` 调整。

## 文档

- [部署模式、数据迁移、备份和回退](docs/deployment.md)
- [性能集成、实测结果与待验收边界](docs/performance-integration.md)
- [项目结构与边界](docs/project.md)
- [本地资产与复现边界](docs/local-assets.md)
- [第三方来源与许可证](THIRD_PARTY_NOTICES.md)
- [公开发行检查与排除项](docs/publication.md)
- [设计与研究历史](docs/history/README.md)
- [贡献指南](CONTRIBUTING.md) / [安全报告](SECURITY.md)

## 开源范围

原创代码和文档采用 [MIT](LICENSE)。Three.js 保留其 [MIT 声明](frontend/vendor/THREE-LICENSE.txt)；MicroDuck 叫声合成器移植保留 [Apache-2.0 声明](frontend/shared/MICRODUCK-LICENSE.txt)。模型、制造商数据和品牌名称不因本仓库而获得新的授权；`docs/media/` 里的截图和动图画有该模型，同样不在 MIT 范围内。来做鸭不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品，也不表示这些项目认可本工具。
