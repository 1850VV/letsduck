# 桌面端与离线浏览器包

Electron 窗口使用 `duck://app`、默认 `letsduck` profile 和一套共享 `@letsduck/host`。它直接服务主线 `frontend/dist`；个人数据库、设备控制、耗材规则和导出都来自 `packages/`。源码运行与打包需要 Node 24.20+（24.x）。用户包内已带运行时。

## 开发

```sh
npm ci
npm run setup:electron
npm run start:desktop
```

先按根 README 导入有权使用的素材。`DUCK_ASSETS`、`DUCK_FRONTEND`、`DUCK_ASSEMBLY_MANIFEST` 可指定资源；默认使用工作区内的素材、构建前端及组装清单。`DUCK_DESKTOP_DATA` 只改桌面 profile 目录。正式数据库继续使用根 README 中的 `DoodleDuck/personal.db`，`DUCK_PERSONAL_DB` 可显式覆盖。测试必须使用自有临时目录与数据库。浏览器 `http://127.0.0.1:8876` 与桌面 `duck://app` 的草稿、语言和偏好属于各自来源，不会随 SQLite 自动互转。

开发与打包环境若设置了 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`，需清空该变量再运行 `setup:electron`。服务器和前端 Docker 构建不下载桌面二进制。

## 桌面候选

```sh
npm run package:desktop -- --mac --arm64
# Intel Mac：--mac --x64；Windows：--win --x64
```

构建在 `apps/desktop/build/` 暂存生产依赖、同一 Web 产物与授权素材，安装器输出到 `apps/desktop/release/`。`DUCK_DISTRIBUTABLE_ASSETS` 可指定打包素材目录。暂存不修改源素材，也不复制符号链接。设置 `DUCK_PACKAGE_WITHOUT_ASSETS=1` 可构建不含模型的源码候选；它不能完成模型操作。

默认无更新源，不发起更新轮询。更新代码只在用户点击后下载；安装等待当前保存、导出和下载。发行者可配置 `DUCK_UPDATE_URL` 或 `DUCK_UPDATE_REPOSITORY`，以及 `DUCK_RELEASE_VERSION`；地址仅接受不含凭据、查询参数和片段的 HTTPS。Mac 自动安装渠道要求发行签名，不能用 ad-hoc 候选替代签名、公证和真实 A→B 验收。打包命令使用 `--publish never`，不会发布 Release。

## 随附 Node 的浏览器包

在目标平台执行以下构建，选择对应架构：

```sh
npm run fetch:node -- --platform darwin --arch arm64 --output output/node-runtime
npm run package:browser -- --node-dir output/node-runtime --platform darwin --arch arm64 --output output/letsduck-browser.zip
```

支持 `darwin/arm64`、`darwin/x64`、`win32/x64`。下载工具核对 Node 官方 `SHASUMS256.txt`，只提取 Node 24.20.0 二进制与许可证。打包前实际执行该二进制核实版本与架构。Windows 使用 `node.exe`，macOS 使用 `bin/node`。打包可用 `--assets DIR` 或 `--without-assets`；输出必须为新文件。

解压后双击包内启动器。它直接运行随包 Node、共享本机入口和同一 Web，不安装或要求系统 Node、npm、Python。数据库默认位置和端口选择与源码个人版相同。退出会排空当前工作；Windows 关闭控制台受系统约十秒的终止上限约束，不能把强制关闭当作正常排空通过，见 [Node 信号说明](https://nodejs.org/docs/latest-v24.x/api/process.html#signal-events)。没有授权素材的包只能作源码候选，不能代替完整产品安装验收。

## 检查

```sh
npm run verify:phase7
node --import tsx apps/desktop/test/shell.browser.ts
node --import tsx apps/desktop/scripts/smoke.ts
node --import tsx apps/desktop/scripts/update-smoke.ts
node --import tsx apps/desktop/scripts/installed-smoke.ts --installer /path/to/candidate
```

完整 smoke 需要已授权素材。公共 CI 使用 `installed-smoke.ts --synthetic`，只验证协议、保存、profile、重启和退出子集，明确列出未执行的真实模型、海报、视频等检查。各脚本使用自有 profile/数据库，并清理所属进程；不会连接真实设备。ADB 仍使用共享宿主的 `DUCK_ADB`、系统 PATH 或 Arduino App Lab 工具查找规则。终端可找到 ADB 不能证明安装版 GUI 的设备功能可用。

`installed-upgrade.ts` 的真实 Windows A→B 验收需要隔离 Actions runner 和可匿名下载的已发布版本；它不模拟升级，也不发布安装包。`benchmark.ts` 默认使用共享 Node 基线采集，只有显式历史模式才调用旧 Python 对照。

Windows x64、Apple Silicon 和 Intel Mac 分别报告安装、保存、3MF/BOM、海报、剪贴板、视频、重启和退出结果；Rosetta 不能替代原生 Intel。签名、公证、自动更新、完整进程组 CPU/RSS、下载/安装大小、真实菜单和设备检查各自保留证据，普通单元测试不能替代这些验收。运行上述命令不表示这些条件已经通过。
