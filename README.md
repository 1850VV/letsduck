# 涂鸭 DoodleDuck

给 XGO Duck V2 机器鸭涂装的小工具：三步配好颜色，摆姿势、生成海报，导出保留打印结构的改色 3MF 交给代打服务商。分两个版本：双击即用的**个人使用版**，和带配色广场、评分、「做同款」的**服务器版**。

**这是源码发行版。仓库不附带模型、3MF、衍生网格或耗材数据包。** 它们有独立的第三方授权；MIT 不覆盖这些资产。运行需要自行合法持有完整本地资产包，单独一份 3MF 还不足以复现装配预览。详见 [本地资产说明](docs/local-assets.md)。

## 能做什么

- **涂装台（三步）**：① 选个起点（白胚、经典配色、可锁定/单张重掷的灵感骰子、我的方案）→ ② 细调部位（点模型选部位，耗材色卡或自由调色，刷子、吸管、聚焦、并排放大、A/B 对比、锁定部位）→ ③ 展示分享（姿势与 MicroDuck 经典动作和叫声、背景、海报、发布、打印导出）。
- **真实耗材**：拓竹 PLA Basic / TPU 90A 色表；其他品牌色卡只是示意，发布和导出前会提示换成真实耗材。
- **个人使用版**：双击就能在自己电脑上涂色，不用登录；「我的方案」保存在本机。
- **服务器版**：配色广场、评分、改编家族树和分享。昵称 + 简单密码登录后，私有方案存进账号；访客方案先存在浏览器，登录时同步。
- **导出**：服务器核对 35 个零件的耗材分配，生成改色 3MF（重新渲染 6 块打印板缩略图）和 BOM。
- **12 种语言**：简中、繁中、英、日、韩、法、德、西、巴西葡语、俄、阿拉伯语和印地语。右上角切换，默认跟随浏览器语言；手动选择保存在当前浏览器。不会翻译用户填写的名称，也不使用 IP 定位。见 [翻译维护](docs/i18n.md)。

屏幕颜色不是实物色差保证；踝轴等装配位置有示意成分，尚未验证装配公差。已发布作品和官方配色的海报使用真实作品二维码；复制链接与二维码指向同一作品。未发布草稿仍可保存海报、复制配色码，不生成作品二维码。

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
frontend/   静态前端：index.html（涂装台）、gallery/（配色广场，仅服务器版）、shared/、lib/、locales/、vendor/
personal/   个人版服务：app.py（静态文件 + 方案/导出接口）、schemes.py（本机 SQLite）
backend/    服务器版 API：server.py（FastAPI 路由）、store.py / database.py（MySQL）、rules.py、exporter.py
assets/     本地资产包（被 Git 忽略；个人版直接读取，服务器版只读挂载）
```

## 个人使用版：双击启动

1. 把资产包放进 `assets/`：`python3 scripts/import_local_assets.py /path/to/assets`（Windows：`py -3 scripts\import_local_assets.py C:\path\to\assets`）。
2. 双击启动：
   - **macOS**：`启动涂鸭.command`。用系统自带的 Python 3 就行；没有的话会弹出「安装命令行开发者工具」，点安装即可。第一次若提示无法验证开发者：在 Finder 里右键 → 打开。
   - **Windows**：`启动涂鸭.bat`。没有 Python 时会询问是否用 winget 安装 Python 3.12，或打开 python.org 下载页（安装时勾选 Add python.exe to PATH）。
3. 浏览器自动打开 `http://127.0.0.1:8876/`（端口被占用时自动换下一个）。关闭启动窗口即退出。

也可以在终端运行 `python3 run.py`（`--port` 改端口，`--no-open` 不自动开浏览器）。

- 「我的方案」保存在本机：macOS `~/Library/Application Support/DoodleDuck/personal.db`，Windows `%APPDATA%\DoodleDuck\personal.db`，Linux `~/.local/share/doodleduck/personal.db`；`DUCK_PERSONAL_DB` 可指定别的位置。放在应用文件夹之外，换新版本解压覆盖不会丢；最多 30 套。
- 草稿、语言和背景偏好在浏览器里。没有账号、配色广场和发布；可以导出 3MF、保存海报、复制或粘贴配色码。
- 只监听本机 `127.0.0.1`。旧版个人模式（`backend/data/doodleduck.db` 里的个人方案）在第一次启动时自动带入一次。

## 服务器版：Docker + MySQL

1 核 2 GB 的云服务器就够用（见下面「小服务器建议」）。三个容器空闲时合计约 250–330 MB 内存；3D 渲染和涂色都在用户浏览器里完成，服务器只存数据和导出 3MF。

```sh
git clone git@github.com:1850VV/duck-palette.git
cd duck-palette
python3 scripts/import_local_assets.py /path/to/assets   # 资产包只挂载，不打进镜像
cp .env.example .env                                      # 填两个不同的随机长密码
docker compose up -d --build
```

打开 `http://<服务器地址>:8080/`（`.env` 里 `DUCK_PORT` / `DUCK_BIND` 可改）。

- `frontend`（nginx）提供静态页面、gzip 压缩和只读的 `/assets/`（不对外提供源 3MF），并把 `/api/` 转发给 `backend`；`backend` 只在内部网络，MySQL 不映射宿主机端口。
- 本身不带 HTTPS：放在 Caddy 或 nginx + 证书的反向代理后面。HTTPS 就绪后在 `.env` 设置 `DUCK_PUBLIC_URL=https://你的域名`，再 `docker compose up -d`，复制链接和海报二维码才会生成（指向 `<DUCK_PUBLIC_URL>/gallery/#d/<作品ID>`）。未配置、非 HTTPS、localhost 或 IP 地址都不会生成分享链接。部署后请用另一台手机扫一下海报核对。
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
- **带宽比 CPU 和内存更关键**：新用户第一次打开约下载 3.8 MB（gzip 后，其中模型 3 MB），5 Mbps 大约每分钟能承受 10 个新用户首次打开，30 Mbps 约 60 个。模型文件在浏览器缓存 7 天，老用户再来基本不用重新下载；更换资产包后，7 天内已访问过的浏览器可能需要强制刷新。

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
- [项目结构与边界](docs/project.md)
- [本地资产与复现边界](docs/local-assets.md)
- [第三方来源与许可证](THIRD_PARTY_NOTICES.md)
- [公开发行检查与排除项](docs/publication.md)
- [设计与研究历史](docs/history/README.md)
- [贡献指南](CONTRIBUTING.md) / [安全报告](SECURITY.md)

## 开源范围

原创代码和文档采用 [MIT](LICENSE)。Three.js 保留其 [MIT 声明](frontend/vendor/THREE-LICENSE.txt)；MicroDuck 叫声合成器移植保留 [Apache-2.0 声明](frontend/shared/MICRODUCK-LICENSE.txt)。模型、制造商数据和品牌名称不因本仓库而获得新的授权。涂鸭不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品，也不表示这些项目认可本工具。
