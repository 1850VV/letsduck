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

屏幕颜色不是实物色差保证；踝轴等装配位置有示意成分，尚未验证装配公差。海报上的二维码目前只是装饰，分享靠配色码。

## 结构

前后端分离，后端只用 Python 标准库，前端是不需要构建的静态文件。

```
frontend/   静态前端：index.html（涂装台）、gallery/（配色广场）、shared/、lib/、vendor/（Three.js）
backend/    API：server.py（路由）、store.py（SQLite：账号、方案、作品、评分）、exporter.py（3MF 导出）
assets/     本地资产包（被 Git 忽略，部署时只读挂载）
```

接口都在 `/api/` 下：`auth/register|login|logout`、`me`、`schemes`、`works`（含 `works/<id>/rating`）、`plan`、`export`、`health`。

## 用 Docker 部署到自己的服务器

```sh
git clone git@github.com:1850VV/duck-palette.git
cd duck-palette
python3 scripts/import_local_assets.py /path/to/assets   # 把资产包放进 ./assets
docker compose up -d --build
```

打开 `http://<服务器地址>:8080/`。端口可用 `DUCK_PORT=80 docker compose up -d` 修改。

- `frontend`（nginx）提供静态页面和只读的 `/assets/`（不对外提供源 3MF），并把 `/api/` 转发给 `backend`。
- `backend` 的数据库在 `duck-data` 卷里（`/data/doodleduck.db`）。备份：`docker compose cp backend:/data/doodleduck.db ./backup.db`。
- 资产包只挂载、不打进镜像。没有 HTTPS；要公网访问，建议放在已有的反向代理（Caddy / nginx + 证书）后面。

## 本地开发

需要 Python 3.9+ 和支持 WebGL 2 的浏览器；跑前端测试还需要 Node.js 22+。不需要 npm 安装。

```sh
python3 scripts/import_local_assets.py /path/to/assets
python3 run.py
```

`run.py` 用一个进程同时提供前端、资产和 API（默认 `http://127.0.0.1:8876/`，`--port` 可改，`--no-open` 不自动开浏览器）。开发数据库在 `backend/data/`（被 Git 忽略），可用环境变量 `DUCK_DB` 指到别处。

## 验证

不需要资产包的检查（CI 会跑）：

```sh
python3 scripts/publication_audit.py
python3 -m unittest discover -s tests -p test_local_assets.py -v
python3 -m unittest discover -s tests -p test_store.py -v
```

导入资产包后的完整检查：

```sh
python3 -m unittest discover -s tests -v
node --test tests/*.mjs
```

CI 不持有模型资产，不能替代真实模型、导出和浏览器验收。

## 文档

- [项目结构与边界](docs/project.md)
- [本地资产与复现边界](docs/local-assets.md)
- [第三方来源与许可证](THIRD_PARTY_NOTICES.md)
- [公开发行检查与排除项](docs/publication.md)
- [设计与研究历史](docs/history/README.md)
- [贡献指南](CONTRIBUTING.md) / [安全报告](SECURITY.md)

## 开源范围

原创代码和文档采用 [MIT](LICENSE)。Three.js 保留其 [MIT 声明](frontend/vendor/THREE-LICENSE.txt)；MicroDuck 叫声合成器移植保留 [Apache-2.0 声明](frontend/shared/MICRODUCK-LICENSE.txt)。模型、制造商数据和品牌名称不因本仓库而获得新的授权。涂鸭不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品，也不表示这些项目认可本工具。
