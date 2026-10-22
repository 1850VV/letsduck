# 部署、数据迁移与回退

涂鸭分两个版本，代码和部署方式分开：

| 版本 | 代码 | 启动 | 数据库 |
| --- | --- | --- | --- |
| 个人使用版 | `personal/`，Python 标准库 | 双击 `启动涂鸭.command`（macOS）/ `启动涂鸭.bat`（Windows），或 `python3 run.py` | 本机 SQLite 文件 |
| 服务器版 | `backend/`，FastAPI + SQLAlchemy | `docker compose up -d --build` | MySQL 8.4（`mysql-data` 卷） |

两者共用 `frontend/`、`backend/rules.py`（配色校验）和 `backend/exporter.py`（3MF 导出）。前端读 `/api/site` 的 `edition` 决定是否显示登录、配色广场和发布。运行都需要自行合法持有完整资产包，见 `local-assets.md`。

## 个人使用版

- 只需要 Python 3.9+（macOS 自带的即可），不安装任何第三方包。启动脚本找不到合适的 Python 时：macOS 触发「命令行开发者工具」安装或打开 python.org；Windows 询问是否用 winget 安装 Python 3.12，或打开 python.org。
- 只监听 `127.0.0.1`，默认端口 8876，被占用时依次尝试后面 20 个端口。`--host`、`--port`、`--no-open` 可调整。
- 方案文件：macOS `~/Library/Application Support/DoodleDuck/personal.db`，Windows `%APPDATA%\DoodleDuck\personal.db`，Linux `~/.local/share/doodleduck/personal.db`，或环境变量 `DUCK_PERSONAL_DB`。它不在应用文件夹里，升级时解压新版本覆盖即可。备份：关闭涂鸭后复制这个文件。
- 接口：`/api/health`、`/api/site`、`/api/catalog`、`/api/schemes`（无需登录）、`/api/plan`、`/api/export`；账号、作品和评分接口返回 404，`/gallery/` 跳回首页。错误格式和校验码与服务器版相同。
- 首次启动时，若旧版个人模式数据库（`backend/data/doodleduck.db` 或 `DUCK_DB`）里有个人方案，只读地带入一次。

## 服务器版

`docker-compose.yml` 启动三个容器：`mysql`（不映射宿主机端口）、`backend`（FastAPI + Uvicorn，1 个 API 进程 + 独立导出进程）、`frontend`（nginx：静态文件、gzip、只读 `/assets/`、反代 `/api/`）。

```sh
cp .env.example .env      # 两个不同的随机长密码；DUCK_PUBLIC_URL 等 HTTPS 就绪再填
docker compose up -d --build
```

要求 Docker Compose v2。对外端口 `DUCK_BIND:DUCK_PORT`（默认 `0.0.0.0:8080`）。HTTPS 由站点前的反向代理提供；代理在同一台机器上时可设 `DUCK_BIND=127.0.0.1`。

### 小服务器（1 核 2 GB 起）

MySQL 以 `--innodb-buffer-pool-size=${DUCK_MYSQL_BUFFER_POOL:-128M} --performance-schema=OFF --max-connections=60` 启动；4 GB 内存可在 `.env` 设 `DUCK_MYSQL_BUFFER_POOL=256M`。测试环境（Ubuntu 24.04，Docker 29）中实测内存：MySQL 约 165 MB（128M 缓冲池，刚启动）到 265 MB（256M，跑过测试流量；缓冲池按使用逐步占满）、后端 63 MB、nginx 5 MB；每个 3MF 导出进程峰值约 60 MB。1 核 2 GB 合计约 800 MB（含系统与 Docker），建议另开 2 GB swap（命令见 README）。3MF 导出在独立进程计算，保持 `DUCK_EXPORT_WORKERS=1`。

nginx 对 `/assets/`（模型几何、色表）发送 `Cache-Control: public, max-age=604800`，过期后用 ETag / Last-Modified 重新验证。更换资产包后，7 天内访问过的浏览器可能仍用旧文件，需要强制刷新。页面和脚本仍是 `no-cache`，每次都会核对是否有新版本。

### 外部 MySQL

不用自带的 `mysql` 容器时，给 `backend` 设置以下变量（或 `DUCK_DATABASE_URL=mysql+pymysql://...`，后者优先，密码中的特殊字符需 URL 编码）：

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
   docker compose run --rm backend python migrate_database.py /data/doodleduck.db
   ```

   工具用 SQLite backup API 做一致性快照，在单个事务内导入，比较五张业务表的全部字段、行数和 SHA-256 指纹；密码盐、哈希和会话 token 原样保留。备份放在源目录的 `backups/`。目标库有数据时拒绝合并；同一快照重复执行只核对，返回 `already_migrated`。

3. 核对输出中的 `counts`、`fingerprint`、`status` 后 `docker compose up -d`，验收登录、私有方案、作品、评分和改编关系后再开放入口。

本机文件迁往外部 MySQL：设置上一节的变量后运行 `python backend/migrate_database.py path/to/old.db`（`--backup` 可指定备份路径）。

## 备份和回退

- MySQL：`docker compose exec -T mysql sh -c 'mysqldump --single-transaction -uduck -p"$MYSQL_PASSWORD" doodleduck' > backup.sql`。定期在空库里试恢复；只保留 Docker 卷不等于已经能恢复。
- MySQL 尚未接收新写入时，可以回到旧版本继续用原 SQLite。之后再切回会遗漏新数据，本版本不提供 MySQL → SQLite 回灌。
- 不要用 `docker compose down -v` 做升级或回退，它会删除数据卷。

## 广场与导出容量

`GET /api/works` 返回数组，默认最多 200 件，可选 `limit=1..200`、`offset>=0`、`author`；排序为创建时间、ID 降序。作品、评分汇总、当前用户评分和改编数量最多 4 次批量查询。

| 变量 | 默认 | 含义 |
| --- | --- | --- |
| `DUCK_EXPORT_WORKERS` | `1` | 同时计算的导出任务数 |
| `DUCK_EXPORT_QUEUE` | `2` | 最多等待的导出任务数 |
| `DUCK_HTTP_LIMIT` | `64` | Uvicorn 同时处理的连接上限 |

导出容量已满返回 `503`、`Retry-After: 2`。队列只在内存里，重启不恢复；当前模板运行一个后端实例。
