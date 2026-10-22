# 涂鸭 DoodleDuck

给 XGO Duck V2 机器鸭涂装的小工具，几个朋友一起玩：三步配好颜色，摆姿势、生成海报，发布到配色广场，互相打分、「做同款」接着改。配好的方案可以导出保留打印结构的改色 3MF 和耗材清单。

**这是源码发行版。仓库不附带模型、3MF、衍生网格或耗材数据包。** 它们有独立的第三方授权；MIT 不覆盖这些资产。运行需要自行合法持有完整本地资产包，单独一份 3MF 还不足以复现装配预览。详见 [本地资产说明](docs/local-assets.md)。

## 能做什么

- **涂装台（三步）**：① 选个起点（白胚、经典配色、可锁定/单张重掷的灵感骰子、我的方案）→ ② 细调部位（点模型选部位，耗材色卡或自由调色，刷子、吸管、聚焦、并排放大、A/B 对比、锁定部位）→ ③ 展示分享（姿势与 MicroDuck 经典动作和叫声、背景、海报、发布、打印导出）。
- **真实耗材**：拓竹 PLA Basic / TPU 90A 色表；其他品牌色卡只是示意，发布和导出前会提示换成真实耗材。
- **配色广场**：官方配色 + 所有人发布的作品；热门/最新/高分、色系与标签筛选、作品详情、评分、改编家族树、配色码粘贴预览、分享海报。
- **账号**：昵称 + 简单密码。登录后「我的方案」存到服务器，换台电脑也能找回；不登录也能玩，方案先存在浏览器里，登录时自动同步进账号。
- **导出**：服务器核对 35 个零件的耗材分配，生成改色 3MF（重新渲染 6 块打印板缩略图）和 BOM。
- **12 种语言**：简中、繁中、英、日、韩、法、德、西、巴西葡语、俄、阿拉伯语和印地语。右上角切换，默认跟随浏览器语言；手动选择保存在当前浏览器。不会翻译用户填写的名称，也不使用 IP 定位。见 [翻译维护](docs/i18n.md)。

屏幕颜色不是实物色差保证；踝轴等装配位置有示意成分，尚未验证装配公差。已发布作品和官方配色的海报使用真实作品二维码；复制链接与二维码指向同一作品。未发布草稿仍可保存海报、复制配色码，不生成作品二维码。

## 结构

前后端分离。后端使用 FastAPI + Uvicorn，前端是不需要构建的静态文件。数据库有两种模式：本地默认 SQLite，服务器可切换 MySQL 8.4。

```
frontend/   静态前端：index.html（涂装台）、gallery/（配色广场）、shared/、lib/、vendor/（Three.js）
backend/    API：server.py（路由）、store.py（双数据库：账号、方案、作品、评分）、exporter.py（3MF 导出）
assets/     本地资产包（被 Git 忽略，部署时只读挂载）
```

接口都在 `/api/` 下：`auth/register|login|logout`、`me`、`schemes`、`works`（含 `works/<id>/rating`）、`plan`、`export`、`health`。

## 轻量部署（默认 SQLite）

需要 Python 3.12+。不需要安装 MySQL，SQLite 数据仍在 `backend/data/doodleduck.db`，保留旧版 `DUCK_DB` 配置。首次打开旧数据库前会自动生成一致性备份，再补充索引与昵称查询字段。

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
python3 scripts/import_local_assets.py /path/to/assets
.venv/bin/python run.py --no-open
```

打开 `http://127.0.0.1:8876/`。本地运行仍需要前述独立资产包。数据库模式不会改变模型授权与复现边界。

## Docker 部署与服务器模式

```sh
git clone git@github.com:1850VV/duck-palette.git
cd duck-palette
python3 scripts/import_local_assets.py /path/to/assets   # 把资产包放进 ./assets
docker compose up -d --build
```

公开分享前，在 HTTPS 反向代理就绪后设置 `DUCK_PUBLIC_URL=https://你的正式域名`，并重新创建 backend 容器（例如 `DUCK_PUBLIC_URL=https://你的正式域名 docker compose up -d`）。只填写站点根地址，不含子路径、账号、查询或 hash。配置通过只读 `/api/site` 提供，复制链接和海报统一使用 `<DUCK_PUBLIC_URL>/gallery/#d/<作品ID>`；不会使用当前浏览器地址或代理请求头猜测正式域名。

未配置、非 HTTPS、localhost 或 IP 地址均不生成作品链接与二维码。尚未部署时仍可本机涂色和保存普通海报，界面明确提示分享地址未配置。部署后请用另一台手机扫描保存的海报，核对作品标题、作者和配色；浏览器手机尺寸和 QR 解码不能替代此项实机验收。

以上 Docker 命令也默认使用 SQLite。服务器使用 MySQL 时，先在被 Git 忽略的 `.env` 中设置 `DUCK_MYSQL_PASSWORD` 和 `DUCK_MYSQL_ROOT_PASSWORD`，再运行：

```sh
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

**切换配置不会自动搬迁数据。已有 SQLite 数据时，先按 [部署与迁移说明](docs/deployment.md) 停止写入、备份、迁移并核对，再启动 MySQL 模式。**

打开 `http://<服务器地址>:8080/`。端口可用 `DUCK_PORT=80 docker compose up -d` 修改。

- `frontend`（nginx）提供静态页面和只读的 `/assets/`（不对外提供源 3MF），并把 `/api/` 转发给 `backend`。
- SQLite 在 `duck-data` 卷的 `/data/doodleduck.db`；MySQL 在独立 `mysql-data` 卷。备份、回退和单机外部 MySQL 配置见 [部署与迁移说明](docs/deployment.md)。
- 资产包只挂载、不打进镜像。没有 HTTPS；要公网访问，建议放在已有的反向代理（Caddy / nginx + 证书）后面。

## 本地开发

需要 Python 3.12+ 和支持 WebGL 2 的浏览器；跑前端测试还需要 Node.js 22+。先安装 `requirements-dev.txt`，不需要 npm 安装。

```sh
python3 scripts/import_local_assets.py /path/to/assets
.venv/bin/python run.py
```

`run.py` 用 Uvicorn 提供前端、资产和 API；导出在独立进程运行（默认 `http://127.0.0.1:8876/`，`--port` 可改，`--no-open` 不自动开浏览器）。开发数据库在 `backend/data/`（被 Git 忽略），可用环境变量 `DUCK_DB` 指到别处。

## 验证

不需要资产包的检查（CI 同时提供真实 MySQL 服务）：

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
```

```sh
.venv/bin/python scripts/publication_audit.py
.venv/bin/python -m unittest discover -s tests -p test_local_assets.py -v
.venv/bin/python -m unittest discover -s tests -p test_store.py -v
.venv/bin/python -m unittest discover -s tests -p test_api.py -v
.venv/bin/python -m unittest discover -s tests -p test_store_scaling.py -v
.venv/bin/python -m unittest discover -s tests -p test_export_queue.py -v
.venv/bin/python -m unittest discover -s tests -p test_migration.py -v
.venv/bin/python -m unittest discover -s tests -p test_startup.py -v
```

导入资产包后的完整检查：

```sh
.venv/bin/python -m unittest discover -s tests -v
node --test tests/*.mjs
```

真实 MySQL 回归使用环境变量 `DUCK_TEST_DATABASE_URL`，目标库名必须以 `duck_test_` 开头；未配置时相关测试明确跳过。它覆盖相同的账号、接口、广场、配额和迁移场景。

导出默认同时执行 1 个任务，最多等待 2 个；超过容量返回 `503`、`Retry-After` 和原有 `{error: ...}` 格式。可用 `DUCK_EXPORT_WORKERS` / `DUCK_EXPORT_QUEUE` 调整。广场仍返回原有数组，可选 `limit=1..200&offset=0..`；评分和改编统计改为批量查询。

CI 不持有模型资产，不能替代真实模型、导出和浏览器验收。

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
