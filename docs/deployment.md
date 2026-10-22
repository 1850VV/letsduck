# 部署、数据迁移与回退

两种版本共用 FastAPI、Uvicorn 和方案、导出接口。服务器版保留 Bearer 登录会话、方案/作品 ID、密码哈希、时间戳、评分与改编关系。个人版屏蔽账号与广场接口，方案无需登录即可保存到本机 SQLite。

| 模式 | 启动 | 数据库 | 适用 |
| --- | --- | --- | --- |
| 个人使用版 | 安装后端依赖后 `python run.py` | SQLite，自动创建 | 单人本机使用，打开即用 |
| 服务器版 | 叠加 `docker-compose.mysql.yml` | MySQL 8.4，`mysql-data` 卷 | 账号、广场与发布 |

运行仍需自行合法持有完整资产包；参见 `local-assets.md`。本机个人版默认仅监听回环地址。Docker 服务器版对外提供 8080，HTTPS 由站点入口反向代理提供。MySQL 不映射宿主机端口。Compose 版本需 2.24.4+。

## 个人版与服务器版切换

`DUCK_EDITION=personal|server` 选择功能。默认 `personal`，要求 SQLite；MySQL Compose 预设 `server`。个人版直接运行本机 Python。部署配置仍保留，以便现有部署继续使用。

个人版的命名方案写入 SQLite，最多 30 套。清除浏览器数据、换一个浏览器或重启应用后仍可重开；草稿与界面偏好留在浏览器。保存失败时显示错误并保留未保存状态。顶部及方案菜单可以导入配色码，海报和打印导出继续可用。

个人版在现有数据库中使用独立的内部存储归属，不产生登录会话，也不公开原账号的私有方案。切换版本不会删除数据库或原有浏览器缓存。旧账号方案需用 `DUCK_EDITION=server` 访问；旧版浏览器访客方案仍留在原浏览器缓存，可在服务器版读取，再用配色码转入个人版。

若需在 SQLite 上保留原有账号功能，可运行 `DUCK_EDITION=server python run.py`。个人版只有一个本机方案空间，不能作为有账号隔离的多人服务。

## 选择数据库

不配置时使用 SQLite。旧版 `DUCK_DB=/path/to/doodleduck.db` 继续有效。也可明确设置 `DUCK_DATABASE_URL=sqlite:////absolute/path/to/doodleduck.db`。

外部 MySQL 使用以下环境变量。密码按普通字符串传递，无需 URL 转义：

```dotenv
DUCK_EDITION=server
DUCK_DB_ENGINE=mysql
DUCK_DB_HOST=your-database-host
DUCK_DB_PORT=3306
DUCK_DB_USER=duck
DUCK_DB_PASSWORD=your-database-password
DUCK_DB_NAME=doodleduck
```

`DUCK_DATABASE_URL` 若存在则优先于上述变量，MySQL 格式为 `mysql+pymysql://...`，密码中的特殊字符需要 URL 编码。不要将含真实凭据的配置提交到 Git。MySQL 使用 InnoDB、utf8mb4；JSON 文本列可容纳旧版允许的大型方案来源数据。昵称查询保留原 SQLite 的 ASCII 大小写规则。

Docker 服务器模式先在 `.env` 设置两个不同的随机长密码：

```dotenv
DUCK_MYSQL_PASSWORD=replace-with-a-random-long-password
DUCK_MYSQL_ROOT_PASSWORD=replace-with-another-random-long-password
```

新建空站点：

```sh
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

## 已有 SQLite 数据迁移到 MySQL

切换配置只选择数据库，不自动导入。先关闭旧入口或进入维护期，防止快照后继续产生写入。确认 `duck-data` 卷仍挂载在 `/data`，不要删除旧卷。

挂载的旧 SQLite 有账号而 MySQL 为空时，后端会拒绝启动并提示先运行 `migrate_database.py`，避免把模式切换误认为数据已经搬迁。

1. 停止旧后端，启动 MySQL。只操作本项目的服务：

   ```sh
   docker compose stop backend
   docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d mysql
   docker compose -f docker-compose.yml -f docker-compose.mysql.yml build backend
   ```

2. 在空目标数据库执行迁移，源文件是旧卷中的 SQLite：

   ```sh
   docker compose -f docker-compose.yml -f docker-compose.mysql.yml run --rm backend python migrate_database.py /data/doodleduck.db
   ```

   工具使用 SQLite backup API 创建一致性快照，在单个目标事务内导入，并比较五张业务表的全部原始字段、行数和 SHA-256 指纹。密码盐、密码哈希和现有会话 token 不重新生成。备份放在源目录的 `backups/`，不会覆盖源文件或同名备份。

   目标有数据时拒绝合并和覆盖。同一快照完整导入后重复执行只核对，返回 `already_migrated`；目标后来产生变化时拒绝重放。导入未确认时，保留原文件与备份，用同一源快照重跑核对，勿清空目标或换一个导入来源。

3. 核对输出中的 `counts`、`fingerprint` 和 `status` 后启动服务器模式：

   ```sh
   docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d
   ```

4. 验收旧登录会话、已有账号密码、私有方案、作品详情、评分和改编关系，然后再开放入口。

本地文件向外部 MySQL 迁移，也可设置上一节的环境变量后运行 `python backend/migrate_database.py path/to/old.db`。可用 `--backup path/to/new-backup.db` 指定新备份路径。

## 备份和回退

- SQLite：使用 backup API 或在后端停止后复制数据库。运行时直接复制 `.db` 可能遗漏 WAL 内容。首次升级旧 SQLite 结构前会自动生成一致性备份。
- MySQL：使用 `mysqldump --single-transaction` 备份 InnoDB，定期在独立空库验证恢复。密码通过环境变量或客户端配置提供。只保存 Docker 卷不等于已经验证可恢复。
- 维护期内、MySQL 尚未接收新写入时，可停止服务器模式后按原配置启动 SQLite，使用保留的原数据库。
- MySQL 已有新写入后，旧 SQLite 只是迁移时的快照。直接切回会遗漏新数据；先备份并安排反向迁移与核对。本版本不提供自动 MySQL → SQLite 回灌。
- 不使用 `docker compose down -v` 做模式切换或回退。

## 广场与导出容量

`GET /api/works` 仍返回原有数组；默认最多 200 件。可选 `limit=1..200`、`offset>=0`、原有 `author`。排序为创建时间、ID 降序，分页稳定；并发新增会改变 offset 页边界。作品、评分汇总、当前用户评分和改编数量最多使用 4 次批量查询，不按作品数逐条查询。新索引支持作者、时间和改编关系。

Uvicorn 入口固定为 **1 个 API 工作进程**，导出放在独立进程池：

| 变量 | 默认 | 含义 |
| --- | --- | --- |
| `DUCK_EXPORT_WORKERS` | `1` | 同时计算的导出任务数 |
| `DUCK_EXPORT_QUEUE` | `2` | 最多等待的导出任务数 |
| `DUCK_HTTP_LIMIT` | `64` | Uvicorn 同时处理的连接/任务上限 |

导出容量已满返回 `503`、`Retry-After: 2`、`{error: ...}`，客户端可稍后手动重试。成功时仍直接下载 3MF。客户端断开不会取消已经运行的计算，也不会提前释放容量。关机时等待已接受的导出结束。

导出队列仅在内存中，不保证重启后恢复。每个 API 实例各自限流；当前模板运行一个后端实例。扩展到多个实例前需要共享的任务调度机制。HTTP 连接达到 Uvicorn 上限时，其自身返回 503。

2 核服务器建议从 1 个导出进程开始。实际并发能力取决于模型下载、查询规模和导出频率，需在目标机器验证。
