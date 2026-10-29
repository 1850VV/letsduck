# 部署、数据迁移与回退

来做鸭分客户端版与服务器版，主要面向客户端使用。服务器版尚未做充分的优化与适配；本文保留自行部署所需的操作说明：

| 版本 | 代码 | 启动 | 数据库 |
| --- | --- | --- | --- |
| 客户端版 | `apps/local/`、共享 TypeScript packages | Node.js 24.20+（24.x），源码启动器或 `npm run start:local` | 本机 SQLite |
| 服务器版 | `apps/server/`、共享 TypeScript packages | `docker compose up -d --build` | MySQL 8.4（`mysql-data` 卷） |

两个 Node 入口共用构建后的 `frontend/dist/`，以及 `packages/domain`（校验）、`packages/exporter`（3MF 导出）和 `packages/storage`（数据访问）。前端读 `/api/site` 的 `edition` 决定是否显示登录、配色广场和发布。运行都需要自行合法持有完整资产包，见 `local-assets.md`。

## 客户端版

客户端仅提供 Apple 芯片 Mac 和 Windows x64；安装包与浏览器包见[客户端打包](../apps/desktop/README.md)。不提供 Intel Mac、Linux 或其他平台客户端。

- 源码启动器 `启动来做鸭.command` / `.bat` 检查 Node.js 24.20+（24.x），执行当前 TypeScript/Vite 构建后启动客户端版。首次运行先 `npm ci` 并导入合法资产。
- 命令行入口使用 Node.js 24.20+、24.x：先 `npm ci && npm run build`，再 `node apps/local/dist/main.js` 或 `npm run start:local`。普通运行和工具不需要 Python；旧引擎验证通过固定 Git 参考和显式历史回放完成。
- 只监听 `127.0.0.1`，默认端口 8876，被占用时依次尝试后面 20 个端口。`--host`、`--port`、`--no-open` 可调整。
- 方案文件：macOS `~/Library/Application Support/DoodleDuck/personal.db`，Windows `%APPDATA%\DoodleDuck\personal.db`，或环境变量 `DUCK_PERSONAL_DB`。它不在应用文件夹里，升级时解压新版本覆盖即可。备份：关闭来做鸭后复制这个文件。
- 接口：`/api/health`、`/api/site`、`/api/catalog`、`/api/schemes`（无需登录）、`/api/plan`、`/api/export`；账号、作品和评分接口返回 404，`/gallery/` 跳回首页。错误格式和校验码与服务器版相同。
- 首次启动时，若旧版个人模式数据库（`backend/data/doodleduck.db` 或 `DUCK_DB`）里有个人方案，只读地带入一次。

## 服务器版

`docker-compose.yml` 启动三个容器：`mysql`（不映射宿主机端口）、`backend`（Node 24，1 个 API 进程 + 有上限的导出 worker threads）、`frontend`（nginx：静态文件、gzip、只读 `/assets/`、反代 `/api/`）。

```sh
cp .env.example .env      # 两个不同的随机长密码；DUCK_PUBLIC_URL 等 HTTPS 就绪再填
docker compose up -d --build
```

后端从仓库根目录构建（`backend/Dockerfile`）。`.dockerignore` 只允许所需 workspace 源码和构建文件进入上下文，模型、`.env`、数据库、Git 和私有 `.ryugi` 不参与构建。运行镜像只带编译产物与生产依赖，以 UID/GID `10001:10001` 启动；`/data` 可写，资产从外部只读挂载到 `/assets`。健康检查用 Node 请求 `/api/health`，不依赖 Python。

要求 Docker Compose v2。对外端口 `DUCK_BIND:DUCK_PORT`（默认 `0.0.0.0:8080`）。HTTPS 由站点前的反向代理提供；代理在同一台机器上时可设 `DUCK_BIND=127.0.0.1`。

### HTTPS

`docker-compose.https.yml` 加一个 Caddy 容器（`deploy/Caddyfile`）：为 `DUCK_DOMAIN` 和 `www.DUCK_DOMAIN` 自动申请、续期 Let's Encrypt 证书，HTTP 跳 HTTPS，`www.` 永久跳转到主域名，再转发给 nginx。前提：两个域名的 A 记录指向服务器，80/443（含 443/udp）对外开放。`.env` 里设 `DUCK_DOMAIN`、`DUCK_PUBLIC_URL=https://<域名>`、`DUCK_BIND=127.0.0.1`、`DUCK_PORT=8080`，并用 `COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml` 让普通的 `docker compose` 命令自动带上这个文件。证书保存在 `caddy-data` 卷里，不要删除。查看申请日志：`docker compose logs caddy`。

### 小服务器（1 核 2 GB 起）

MySQL 以 `--innodb-buffer-pool-size=${DUCK_MYSQL_BUFFER_POOL:-128M} --performance-schema=OFF --max-connections=60` 启动；4 GB 内存可在 `.env` 设 `DUCK_MYSQL_BUFFER_POOL=256M`。3MF 在独立的 Node worker threads 中计算，保持 `DUCK_EXPORT_WORKERS=1`。旧 Python 后端的内存测量不能用于估算此 Node 版本；当前版本的整机容量和导出峰值尚未实测。

Vite 用 Node 构建所有前端页面和 Worker，两个版本共用 `frontend/dist/`。代码生成 `/static/name-hash.js` / `.css`，nginx 对这些内容 hash 地址保留一年 immutable 缓存；旧 `?v=` 地址继续兼容，普通代码和 HTML 重新核对。两段预绘制保持同步 classic script，以保留首屏和 `currentScript` 行为。构建只复制公开的舵机映射 JSON；独立授权资产仍从外部目录只读挂载。

模型几何另有一份传输用的 `assets/geometry.pack.bin`（`scripts/pack_geometry.ts`，导入资产时自动生成；手动复制资产后可单独运行）：位置按每个零件的包围盒量化为 16 位（约 0.002 mm），索引差分编码可精确还原，打印摆放尽量存为变换矩阵，gzip 后约 1.0 MB（原 `geometry.bin` 约 3.0 MB）。兼容路径仍保留。构建机器可再执行 `npm ci && npm run pack:positions`，生成 `geometry.positions.bin`（完整三角形、16 位位置和打印矩阵），浏览器优先在 Worker 内解码并计算法线；缺失、损坏或 Worker 不可用时回退到 DDG1 / `geometry.bin`。生成文件仍只在本地资产包中分发，不提交 Git，也不增加个人版运行依赖。当前文件约 870 KB；预压缩为 gzip 约 640 KB、Brotli 约 589 KB，nginx 根据 Accept-Encoding 优先投递预压缩 Brotli，其次 gzip；禁用的编码（q=0）不会使用，缺失的文件会回退到可用格式或原文件。响应包含 Content-Encoding、Vary: Accept-Encoding 和对应格式的 ETag；不需要 Brotli 模块。其他资产启用 gzip_static，仍可动态 gzip。本地开发服务不保证发送 Brotli。首次导出复用主视图几何和渲染器，打印法线在 Worker 中按需生成，成功路径不再下载 DDG1；兼容路径仍保留。源 3MF 及其压缩副本都禁止从静态资产路径读取，源 3MF 仍只在服务端使用。

nginx 对 `/assets/`（模型几何、色表）发送 `Cache-Control: public, max-age=604800`，过期后用 ETag / Last-Modified 重新验证。更换资产包后，7 天内访问过的浏览器可能仍用旧文件，需要强制刷新。页面和脚本仍是 `no-cache`，每次都会核对是否有新版本。

### 外部 MySQL

不用自带的 `mysql` 容器时，给 `backend` 设置以下变量（`DUCK_DATABASE_URL=mysql://...` 则优先于分项变量，兼容旧 `mysql+pymysql://...` 地址；密码中的特殊字符需 URL 编码）：

```dotenv
DUCK_DB_ENGINE=mysql
DUCK_DB_HOST=your-database-host
DUCK_DB_PORT=3306
DUCK_DB_USER=duck
DUCK_DB_PASSWORD=your-database-password
DUCK_DB_NAME=doodleduck
```

MySQL 使用 InnoDB、utf8mb4。不要把含真实凭据的配置提交到 Git。

## 从旧的 SQLite 服务器部署迁移到 MySQL

早期版本的服务器部署把数据放在 `duck-data` 卷的 `/data/doodleduck.db`。新版本仍挂载这个卷；若它里面有账号而 MySQL 为空，后端拒绝启动并提示先迁移，避免看起来像数据丢了。

1. 进入维护期，停止旧后端，启动 MySQL 并构建新后端：

   ```sh
   docker compose stop backend
   docker compose up -d mysql
   docker compose build backend
   ```

2. 在空的 MySQL 上迁移（源文件是旧卷里的 SQLite）：

   ```sh
   docker compose run --rm backend node tooling/dist/migrate-database.js /data/doodleduck.db
   ```

   工具用 SQLite backup API 做一致性快照，在单个事务内导入，比较五张业务表的全部字段、行数和 SHA-256 指纹；密码盐、哈希和会话 token 原样保留。备份放在源目录的 `backups/`。目标库有数据时拒绝合并；同一快照重复执行只核对，返回 `already_migrated`；目标导入后发生任何业务字段变化时拒绝再次覆盖。导入失败会回滚目标事务。

3. 核对输出中的 `counts`、`fingerprint`、`status` 后 `docker compose up -d`，验收登录、私有方案、作品、评分和改编关系后再开放入口。

本机文件迁往外部 MySQL：先在源码目录运行 `npm ci && npm run build`，再设置上一节的变量并运行 `node tooling/dist/migrate-database.js path/to/old.db`（`--backup` 可指定备份路径）。源文件、备份和目标必须是不同文件；工具也拒绝通过符号链接指向同一文件的路径。失败退出码为 `2`，保留源文件和已生成的快照，不要删掉它们来强行重试。

## 备份和回退

升级前记录旧镜像 ID，并给它加一个不会被本次构建覆盖的本地标签，例如 `letsduck-backend:pre-node`；同时保留对应的 Compose、`.env` 和资产配置。记录当前使用的数据库类型、连接配置、卷名和源文件，先在临时数据库副本上验证旧版本能读取 Node 新写入的数据。

1. 进入维护期，停止后端写入。MySQL 用一致性导出备份，输出到一个新的、访问受限的文件：

   ```sh
   docker compose stop backend
   (
   umask 077
   set -C
   docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump --single-transaction -u"$MYSQL_USER" "$MYSQL_DATABASE"' > backup.before-node.sql
   )
   ```

   不覆盖已有备份。SQLite 部署则在停止所有写入后保存当前数据库及仍存在的 `-wal`/`-shm` 文件；也可用 `@letsduck/storage` 的 `backupSqlite` 生成一致性快照。定期在空库里试恢复；只保留 Docker 卷不等于已经能恢复。

2. 若只回退应用，保留**当前数据库及其最新写入**。把以下内容保存为临时 `backend-rollback.yml`，将镜像换成升级前实际保存的标签：

   ```yaml
   services:
     backend:
       image: letsduck-backend:pre-node
   ```

   用原部署相同的 Compose 文件、项目名和 `.env`，叠加这个覆盖文件启动：

   ```sh
   docker compose -f docker-compose.yml -f backend-rollback.yml up -d --no-build --no-deps backend
   ```

   HTTPS 部署同时保留原来的 `-f docker-compose.https.yml`。`--no-build` 确保启动保存的旧镜像。验收健康、登录、私有方案、作品、评分和改编关系，确认新写入仍在，再开放入口。

3. 只有当前数据库损坏并决定恢复数据时，才从备份恢复到另外的空库后核对，再切换连接。恢复旧快照会丢失快照后的写入。SQLite 迁到 MySQL 后若 MySQL 已有新写入，回退应用也必须继续连接该 MySQL；本版本不提供 MySQL → SQLite 回灌。只有 MySQL 从未接收新写入时，才可选择回到原 SQLite。

不要用 `docker compose down -v` 做升级或回退，它会删除数据卷。Node 后端 SIGINT/SIGTERM 会等待已接收请求和导出任务结束，再释放 worker 和数据库；Compose 为后端设置 `stop_grace_period: 70s`，留出 60 秒的 HTTP 排空预算。

## 源码启动和镜像验收

源码环境先 `npm ci && npm run build`，再运行：

```sh
node apps/server/dist/main.js --host 127.0.0.1 --port 8880 --static frontend/dist --open
```

`--host`/`--port` 优先于 `HOST`/`PORT`。端口占用会失败，不尝试其他端口。`--static` 可选，Compose 由 nginx 提供前端，后端不需要它。`--open` 在 15 秒内轮询到健康端点返回 `200` 后才打开浏览器。服务器可在模型缺失时提供账号等 API，健康响应中的 `export: false` 表示导出不可用。

CI 运行 `npx tsx tooling/test/server-container.ts`：真正构建镜像，用无敏感值的 canary 检查构建上下文，挂载合成资产，验证 Node 24、非 root、文件权限、无 Python/ADB 可执行文件、健康检查、真实 worker 导出、SQLite 持久化、编译后的迁移命令和 MySQL API。默认启动单独的 MySQL 8.4；也可通过 `DUCK_TEST_DATABASE_URL` 指定仅限 `duck_test_*` 的临时 MySQL，此时不向非空库导入 SQLite。脚本在 `finally` 中清理其容器、卷、网络、测试镜像、canary 和临时资产。`--image TAG` 可检查已有镜像。

镜像检查需要可用 Docker daemon；只有实际构建、启动和协议检查成功才构成运行证据。CI 还构建前端 Node/Vite→nginx 镜像，公开源代码 CI 不包含独立授权模型的完整视觉、制造与物理验收。

## 广场与导出容量

`GET /api/works` 返回数组，默认最多 200 件，可选 `limit=1..200`、`offset>=0`、`author`；排序为创建时间、ID 降序。作品、评分汇总、当前用户评分和改编数量最多 4 次批量查询。

| 变量 | 默认 | 含义 |
| --- | --- | --- |
| `DUCK_EXPORT_WORKERS` | `1` | 同时计算的导出任务数 |
| `DUCK_EXPORT_QUEUE` | `2` | 最多等待的导出任务数 |
| `DUCK_HTTP_LIMIT` | `64` | 同时接收的活动 HTTP 请求上限 |

导出容量已满返回 `503`、`Retry-After: 2`。队列只在内存里，重启不恢复；当前模板运行一个后端实例。
