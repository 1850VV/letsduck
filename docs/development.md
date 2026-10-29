# 开发与验证

[中文介绍](../README.md) · [English overview](../README.en.md) · [客户端打包与验收](../apps/desktop/README.md)

本文面向源码开发与自行构建。仓库的 `assets/` 已包含所需资源，直接使用下方构建程序即可，无需另备素材或导入 3MF；目录说明见[项目资源](local-assets.md)。普通客户端下载包已包含资源和运行时，无需执行开发命令。

客户端版仅面向 Apple 芯片 Mac 和 Windows x64。桌面窗口与本机浏览器入口是同一客户端的两种启动方式；服务器版独立部署。Linux 上的 CI 和服务器检查不表示提供 Linux 客户端。

应用源码、前端、工具和常规测试统一使用严格 TypeScript。`frontend/` 经 Vite 构建到 `frontend/dist/`，客户端版和服务器都服务构建产物。保留 `/paint`、`/assemble/`、`/debug/`、`/gallery/` 与各自版本的入口规则；服务器的 `/` 是涂装台，客户端版的 `/` 是三入口首页。

工作区职责：`packages/contracts` 提供 schema 与类型；`domain` 提供浏览器/Node 共用规则和精确 JSON；`exporter` 提供 3MF、BOM、预检和有界 worker；`storage` 提供个人 SQLite 与服务器 SQLite/MySQL；`devices` 提供共享总线上的异步设备控制；`host` 用 Cordis 组合 Fastify、存储和服务生命周期。`apps/local`、`apps/server`、`apps/desktop` 是各自入口。桌面窗口只管理本机协议、下载、更新与进程，共用业务代码。

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run probe:runtime
npm run audit:typescript
npm run audit:publication
```

`typecheck` 检查前端、全部测试、工具和构建配置，禁止用 JS 绕过严格检查。`audit:typescript` 检查活跃自有代码的语言、类型抑制及固定 vendor 指纹；厂商 JS 与 `tools/history/` 的归档工具有明确保留用途。`audit:publication` 检查跟踪文件中的私有路径、资产、凭据与生成物。扫描是启发式检查，不能代替人工核查。

`npm test` 使用临时数据库和假设备，包含桌面单元测试。缺少独立授权资产时，会逐文件列出未执行的资产测试；几何包测试也会明确跳过。完整迁移源码检查使用已有合法资产运行 `npm run verify:phase7`，桌面真实运行与安装专项见[打包说明](../apps/desktop/README.md)；不能把资产缺失的源代码 CI 当作完整产品验收。MySQL 测试需要专用 `duck_test_*` 库的 `DUCK_TEST_DATABASE_URL`，未配置时明确跳过；测试按序运行。

浏览器检查使用 Playwright 托管 Chromium。安装匹配版本后，设置 `DUCK_TEST_BROWSER=1` 可运行浏览器生命周期专项；需 nginx 的协议检查在没有本机 nginx 时明确跳过。原生控件、人工视觉、真实设备与安装包验收分别报告。

涂装首帧专项使用 `node --import tsx --test tests/paint_startup.browser.ts`，需要已授权模型素材及已构建前端。它用临时数据库检查首页和直接进入、延迟方案读取、旧单鸭静态图、窄屏四鸭布局，以及登录后的方案和配色码直达；不连接真实设备。

客户端版开发可使用 `npm run start:local -- --port 0 --no-open`，并显式给 `DUCK_PERSONAL_DB` 指定开发库。源码启动器会先构建。服务保留 `--host`、`--port`、`--no-open`，停止后排空自有请求、导出线程和服务，不把开发操作指向已有用户数据库。

数据库迁移：`npm run migrate:database -- SOURCE.db --backup COPY.db`。它只读源库并建立一致性备份；目标必须为空，或仍是未经修改的同一快照。该命令会写入所配置的目标，使用前核对 `DUCK_DATABASE_URL` / `DUCK_DB_ENGINE` / `DUCK_DB`。普通测试不会迁移个人或生产库。

行为与性能采集默认使用独立 Node 个人服务与临时数据库：

```sh
npm run baseline:capture -- --assets /path/to/authorized/assets --output output/baseline --browser
```

默认采集 30 次保存和 10 次真实导出，保留环境、引擎、请求/响应和 ZIP 摘要。结果含本机环境和独立授权资产信息，只放在忽略的私有目录。缺少模型的结果不能作为真实导出证据。性能比较必须使用相同输入、机器和环境。

macOS同机新旧对照使用独立的显式测试入口，自动先构建当前前端与共享宿主：

```sh
npm run baseline:compare -- --revision FULL_OLD_COMMIT --python /path/to/legacy/python --assets /path/to/authorized/assets --output output/comparison
```

它交替运行两个隔离引擎，使用同一个静态来源、相同前端字节和空库副本。默认三轮、每轮30次保存与10次导出；模型完整绘制、真实输入后的交互帧和帧间隔分别记录。浏览器冷上下文不等于清空系统文件缓存；小样本尾延迟与资源差异须按报告范围解释。该入口需要旧提交可读及明确选择的Python，仅用于历史对照，不是普通运行依赖；不要与其他GUI、导出或构建同时测量。

`--pilot`只跑一轮试跑，写入`pilot.json`并标明采样预算未完成，不能作为正式验收。测量使用有窗口的managed Chromium与默认GPU，资源采样需要POSIX `ps`；设备路由在对照中隔离，扫描/停止及实机性能须单独验收。

每次运行须使用新的空输出目录，工具拒绝复用非空目录并保留旧证据。交互时间戳要求该次可信移动的业务响应及完整模型帧；宿主启动单独统计并纳入暂停清单。采样完成与性能通过分别报告，须检查`threshold`、`pauseItems`和`timingPause`，不能只看命令成功退出。

常规构建、测试与工具不需要 Python。独立旧 Python 结果已冻结为合成 oracle。显式历史回放可用 `npm run test:historical -- --list` 查看范围，再以 `--python /path/to/legacy/python` 选择解释器；它从固定旧 Git 提交提取只读参考，所有数据和服务都在自有临时目录中。`baseline:capture -- --engine historical ...` 单独采集旧引擎，结果明确标注。浅克隆须先取得参考提交，历史模式不作为正常运行依赖。

组装姿态的跨平台诊断可显式运行 `npx tsx tooling/test/assembly-diagnostic.ts .`。它用 Node 比较固定历史 MJS 与当前 TS 的完整姿态、顺序和数值，并清理临时参考；不需要 Python，也不进入普通测试。

设备测试与模拟界面不能证明实物在线、接线、编号或校准正确。浏览器检查必须使用独立假运行端和临时数据库；完整语言、布局、导出与真实入口验收见相应测试脚本和 [翻译维护](i18n.md)。

## 源码与文档

```text
frontend/   首页、涂装台、调试鸭、组装教程、配色广场与共享模块
apps/       客户端与服务器启动入口
packages/   共用类型、规则、存储、设备、导出与 HTTP 服务
apps/server/ Node 服务器入口（账号、广场、导出）
deploy/     可选 HTTPS 配置
scripts/    本地资产导入、显示模型打包与公开发行检查
tests/      TypeScript Node 与浏览器检查
assets/     另行准备的本地资产；不应提交
```

- [项目结构与边界](project.md)
- [本地资产与复现条件](local-assets.md)
- [部署、迁移与备份](deployment.md)
- [第三方来源与许可证](../THIRD_PARTY_NOTICES.md)
- [公开发行范围](publication.md)
- [贡献指南](../CONTRIBUTING.md) · [安全报告](../SECURITY.md)
