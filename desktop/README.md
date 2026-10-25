# 来做鸭桌面客户端

Electron + TypeScript/Node.js，Cordis 只管理四个内部模块。界面沿用 `frontend/`；个人方案继续使用原 SQLite 格式和位置。原 Python 个人版与服务器版仍可独立运行。

## 开发与检查

构建使用 Node.js 24；客户端自带运行环境。先在仓库根目录运行 `npm ci`，再进入本目录：

```sh
npm ci
npm run setup:electron
npm test
npm start
```

`npm run setup:electron` 下载锁定版本的 Electron。代理环境可为这条命令设置 `NODE_USE_ENV_PROXY=1`。源码开发时使用仓库的 `assets/`；`DUCK_ASSETS` 可以指定完整素材目录。

- `npm test`：协议、SQLite 兼容、导出对照、HTTP/视频 Range、更新控制器检查。Python 对照测试使用 `PYTHON` 指定的解释器，默认 `python3`。
- `DUCK_REAL_ASSETS=../assets npm test`：增加真实模型的 Python/Node 逐文件导出比较。
- `npm run smoke`：用临时数据目录打开实际 Electron，检查方案保存、失败保存、配色码、复制权限、3MF/BOM 与海报下载、重启后偏好、教程视频播放和定位。根目录需先安装 Playwright 依赖。`DUCK_APP_EXECUTABLE` 可指定打包后的可执行文件，此时直接检查包内素材。
- `node scripts/update-smoke.mjs`：在实际客户端检查 Logo 右侧的更新按钮、真实当前版本号、下载进度、失败重试、重启和等待导出；覆盖首页、涂装台、教程及窄窗口，保存截图与录像。更新事件为模拟，不执行安装，不能代替真实版本升级。
- `node scripts/installed-upgrade.mjs`：只在一次性的 Windows GitHub Actions runner 中运行。匿名下载安装版本 A，操作实际更新按钮，制造一次网络下载失败后重试，由真实 NSIS 更新器安装并自动启动 B，再核对安装版本、SQLite 方案、草稿、偏好和教程进度。它不替换更新事件或安装函数；结果与截图保存在 `output/desktop-installed-upgrade/`。
- `node scripts/benchmark.mjs`：同机交替比较原 Python 与 Node 的保存和真实模型导出。设 `DUCK_BROWSER_BENCH=1` 增加相同 Chromium 的首帧与三轮 30 秒帧间隔比较。结果写入忽略的 `output/desktop-benchmark/`。这不代替打包应用的整进程资源和三平台验收。
- `npm run host`：仅运行 Node 本地服务，默认使用动态端口并输出地址；`DUCK_PORT` 可指定端口。

## 数据与运行方式

Electron 主进程管理窗口和更新；本地服务在 `utilityProcess` 中运行；3MF 导出在独立工作线程中执行。四个插件为素材、SQLite 方案、导出、HTTP。业务规则保持普通函数，不提供插件市场或运行时热换插件。

页面固定使用 `duck://app`。底层端口可以变化，草稿、背景、语言和教程进度仍属于同一来源。页面关闭 Node 集成，开启上下文隔离与沙盒，只暴露受限的更新操作。

方案位置继续使用 macOS 的 `~/Library/Application Support/DoodleDuck/personal.db`、Windows 的 `%APPDATA%/DoodleDuck/personal.db`。`DUCK_PERSONAL_DB` 可覆盖。浏览器状态保存在单独的 Electron `letsduck` 用户目录；`DUCK_DESKTOP_DATA` 仅用于隔离开发和测试。升级不删除这些目录。

原浏览器的 localStorage 与 Electron 分开。已保存方案可由原 SQLite 读取；浏览器草稿与偏好需要明确的迁入步骤，不能声称会自动从 Chrome 带入。`DUCK_LEGACY_DB` 指定早期账户版 SQLite 时，只在新建个人数据库时读取 `personal-owner` 的方案。

已有浏览器草稿可以先保存为方案，或使用现有「复制配色码」和「导入配色码」转入客户端。浏览器的语言、背景与教程进度不会自动迁入；原浏览器数据保留。

## 完整素材与安装包

应用所需素材已经获得使用与随客户端分发授权。默认构建包括原始 3MF、模型清单、三种几何数据、耗材目录、导出描述，以及组装清单列出的模型、教程视频和音频。构建前检查现有资产摘要，并复制实际文件，不把本机符号链接打进安装包。来源声明和音乐署名随包保留。

素材更新随新的客户端安装包一起分发；测试者在客户端完成版本更新后即可使用新增素材。

```sh
npm run package -- --dir             # 本机可运行的未安装目录
npm run package -- --mac --arm64     # Apple 芯片 Mac：DMG + ZIP
npm run package -- --mac --x64       # Intel Mac：DMG + ZIP，优先在 Intel runner 构建
npm run package -- --win --x64       # Windows：NSIS，优先在 Windows 构建
```

构建会复制 `assets/`，也可用 `DUCK_DISTRIBUTABLE_ASSETS` 指定完整目录。每次只构建一个平台和架构；输出在 `release/<平台>-<架构>/`。`DUCK_PACKAGE_WITHOUT_ASSETS=1` 只用于源码 CI 的外壳检查，不能作为发给朋友的完整客户端。

Windows 使用每用户安装，不要求先装 Python/Node；卸载默认保留用户数据。Mac 使用 DMG 安装，ZIP 供自动更新器使用。资源从安装包加载，日常使用与导出可以离线完成。

默认 Mac 构建仅使用本机临时签名，不自动选择钥匙串中的个人开发证书。它可用于本机检查，不等于已签名、公证的分发版本。CI 在 PR 中运行三平台测试和源码外壳构建；手动触发并提供资产 Release 标签后，才生成包含完整素材的候选安装包。授权资产 ZIP 的根目录应直接包含上述素材文件和 `assembly/`。

## 更新源与发布

当前内测选择直接发送安装包，只给受邀朋友，不创建公开发行仓库，也不要求测试者使用 GitHub 账号。`0.1.0-beta.3` 三个平台的完整包均不配置更新源；Logo 右侧按钮显示实际版本，不自动联网检查。它们不包含账号 token 或下载凭据。后续暂时手动安装新版本，保留原有个人数据；私有下载源和真实自动升级尚未验收。下面的匿名更新配置仅是后续可选方案，不代表已获公开发行许可。

打包本轮内测包时不设置 `DUCK_UPDATE_BASE`、`DUCK_UPDATE_URL`、`DUCK_UPDATE_REPOSITORY`。手动工作流只填写完整素材 Release 和版本号，三个更新源输入均留空。Windows 为每用户安装；Mac 打开 DMG 后将应用拖到「应用程序」。尚无 Windows 发布者签名或 Apple Developer ID 公证，系统可能提示开发者未验证。Mac 的逐应用「仍要打开」入口见 [Apple 安装说明](https://support.apple.com/en-us/102445)，不要关闭全局系统保护。

`node desktop/scripts/installed-smoke.mjs` 从仓库根目录执行：在临时目录实装当前平台的完整包，再运行相同的方案、导出、视频、重启数据保留检查。Windows 只允许在一次性 CI runner 运行；Mac 使用只读挂载、复制应用、卸载 DMG 后启动，结束时清理临时安装。此检查不等于带隔离标记的朋友电脑通过系统安全提示，也不等于真实自动升级。

设置 `DUCK_UPDATE_BASE` 为可匿名读取的 HTTPS 基址后构建，生成的更新地址如下：

```text
<基址>/beta/darwin/arm64/
<基址>/beta/darwin/x64/
<基址>/beta/win32/x64/
<基址>/stable/<平台>/<架构>/
```

版本包含 `-beta.` 时使用 beta 通道；正式版使用 stable 通道。每个目录放该平台的安装文件、blockmap 和 builder 生成的更新元数据；保留文件名。默认不开启自动下载或退出自动安装，不允许降级。启动后和运行期间每 10 分钟检查一次；应用关闭或离线时无法实时发现更新。

更新入口是左上角 Logo 右侧的小按钮，无更新弹窗卡片。平时显示实际安装版本；发现新版显示“有新版本待更新”，点击后在同一按钮显示下载百分比、失败重试或“重启更新”。有导出、保存或文件下载尚未完成时等待完成再重启。安装完成后重新启动，按钮读取新安装版本号。下载完成不会提前把目标版本当作当前版本。

没有配置更新源的开发包不启动联网更新检查。客户端不得放入 GitHub token。源码仓库是私有仓库时，不能直接把私有 Release 链接当作匿名更新源。可另设公开发行仓库，或使用支持 HTTPS 的对象存储。

免费 GitHub Releases 可用独立通道标签：例如 `beta-darwin-arm64`、`beta-darwin-x64`、`beta-win32-x64`。构建时用 `DUCK_UPDATE_URL` 指定该平台的完整 `https://github.com/<所有者>/<公开发行仓库>/releases/download/<通道标签>/` 地址，它优先于基址规则。把对应安装文件和元数据上传到同一 Release，文件名带版本号，最后替换通道的元数据。不要把三个架构的同名元数据覆盖到一个 Release。此做法不要求将源码仓库改为公开。

也可设置 `DUCK_UPDATE_REPOSITORY=<所有者>/<公开发行仓库>`，构建自动生成上述通道地址。优先级为 `DUCK_UPDATE_URL`、`DUCK_UPDATE_REPOSITORY`、`DUCK_UPDATE_BASE`。`DUCK_RELEASE_VERSION` 可为两版本升级验收覆盖包内版本，只接受 `X.Y.Z` 或 `X.Y.Z-beta.N`；安装后的版本号、文件名和更新通道以这个版本为准。默认版本仍来自 `package.json`。

免费测试阶段，Windows 使用未签名的每用户 NSIS 包，首次下载运行可能显示未知发布者或 SmartScreen 提示。这不等于通过 Windows 发布者认证。Mac 在没有 Developer ID 时只构建无更新源的临时签名包，手动安装测试；构建器拒绝给临时签名 Mac 包嵌入自动更新源。获得分发证书后，再完成公证和真实两版本升级验收。

`Desktop candidate` 工作流支持完整素材 Release、发行仓库、版本号和目标平台输入。素材包放在源码私有仓库的专用 Release 中，仅供构建读取；保持为非草稿，便于只读凭证的构建流程下载。客户端中不含读取私有仓库的凭证。Windows 的真实升级验收通过同一工作流的 `upgrade_from` 输入启动，`release_version` 是目标版本；运行前两个版本的安装包和目标版本的 `beta.yml` 必须已在公开发行通道可匿名读取。构建和测试工作流均不自动发布公开文件。

手动构建产物存入源码私有仓库的 `desktop-candidate-<run_id>-<平台>-<架构>` Release，真实升级证据存入 `desktop-upgrade-evidence-<run_id>` Release，不占 Actions artifact 存储配额。上传只取输出目录顶层的安装包、blockmap 和更新清单，不上传未打包目录中的 EXE。构建及验收 job 的 `contents: write` 用于保存这些私有产物；公开发行仍是独立步骤。

GitHub Releases 的下载托管不需要另租服务器；每个文件须小于 2 GiB。GitHub Actions 的私有仓库构建使用账号的免费分钟与存储额度，超出额度的费用与下载托管分开计算。只启用标准 runner，不启用额外付费服务。见 [GitHub Releases 限额](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)。

发布步骤：

1. 修改 `package.json` 版本，并更新锁文件；beta 先给测试者，验证后再发布 stable。
2. 使用相同源码与完整素材，在 Windows x64、Mac arm64、Mac x64 分别构建和检查。CI 工作流只生成候选产物，不自动创建公开 Release。
3. Mac 使用 Developer ID 签名，完成公证与 stapling；签名身份在后续更新中保持稳定。Windows 配置发布者签名；开发包的未签名状态必须明确。证书与密码只放 CI Secret 或本机受保护环境，不进安装包。
4. 先上传安装包、ZIP 和 blockmap，核对下载与摘要，再发布更新元数据。保留上一个完整版本。Git 提交或推送分支不等于发布更新。
5. 实装版本 A，在同一数据目录保存方案、草稿与教程进度；发布 B，验证发现更新、下载失败重试、导出中等待、重启安装、版本变化和数据保留。三平台分别验证。单元测试和开发态页面模拟不能替代这一步。

Mac 签名可用 electron-builder 的 `CSC_LINK`、`CSC_KEY_PASSWORD`；公证使用 `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID`，或其支持的 App Store Connect API Key 配置。Windows 使用受支持的证书或云签名配置。正式自动更新发布前，必须实际验证签名与下载源。

## 回退与兼容

本轮保持数据库结构不变。客户端不自动降级；需要回退时停止发布有问题的元数据，保留用户数据，安装已验证的上一版。后续若改变数据库格式，必须先定义备份和可回退范围，再发布需要迁移的版本。

首帧、交互帧时间、保存与导出耗时、整进程内存、空闲 CPU、下载大小均应与相同机器的原版比较。发现退步就保留为未通过项，不能用“测试通过”替代性能结论。
