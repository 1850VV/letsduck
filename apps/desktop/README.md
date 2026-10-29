# 客户端打包与验收

Electron 窗口使用 `duck://app`、默认 `letsduck` profile 和一套共享 `@letsduck/host`。它直接服务主线 `frontend/dist`；个人数据库、设备控制、耗材规则和导出都来自 `packages/`。源码运行与打包需要 Node 24.20+（24.x）。用户包内已带运行时。

桌面安装包和随附 Node 的浏览器包只维护 Windows x64（`win32/x64`）与 Apple 芯片 Mac（`darwin/arm64`）。Intel Mac 包停止维护，不再纳入交付或验收；Rosetta 运行结果不扩大支持范围。不提供 Linux 或其他平台客户端。桌面安装包与浏览器包是同一客户端版的两种启动方式；服务器版独立部署。

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
npm run package:desktop -- --win --x64
```

构建在 `apps/desktop/build/` 暂存生产依赖、同一 Web 产物与授权素材，安装器输出到 `apps/desktop/release/`。`DUCK_DISTRIBUTABLE_ASSETS` 可指定打包素材目录。暂存不修改源素材，也不复制符号链接。设置 `DUCK_PACKAGE_WITHOUT_ASSETS=1` 可构建不含模型的源码候选；它不能完成模型操作。

安装包必须由上述暂存流程构建，不接受绕过目标校验的 `--prepackaged`（含 `--pd`）模式。显式架构参数优先于 `DUCK_BUILD_ARCH`，实际打包目标须与版本、输出目录和更新源一致。

默认无更新源，不发起更新轮询。更新代码只在用户点击后下载；安装等待当前保存、导出和下载。发行者可配置 `DUCK_UPDATE_URL` 或 `DUCK_UPDATE_REPOSITORY`，以及 `DUCK_RELEASE_VERSION`；地址仅接受不含凭据、查询参数和片段的 HTTPS。Mac 自动安装渠道要求发行签名，不能用 ad-hoc 候选替代签名、公证和真实 A→B 验收。打包命令使用 `--publish never`，不会发布 Release。

## 随附 Node 的浏览器包

在目标平台执行以下构建，选择对应架构：

```sh
npm run fetch:node -- --platform darwin --arch arm64 --output output/node-runtime
npm run package:browser -- --node-dir output/node-runtime --platform darwin --arch arm64 --output output/letsduck-browser.zip

# Windows x64（在 Windows 上执行）
npm run fetch:node -- --platform win32 --arch x64 --output output/node-runtime-win32-x64
npm run package:browser -- --node-dir output/node-runtime-win32-x64 --platform win32 --arch x64 --output output/letsduck-browser-win32-x64.zip
```

仅支持 `darwin/arm64`、`win32/x64`。下载工具核对 Node 官方 `SHASUMS256.txt`，只提取 Node 24.20.0 二进制与许可证。打包前实际执行该二进制核实版本与架构。Windows 使用 `node.exe`，macOS 使用 `bin/node`。打包可用 `--assets DIR` 或 `--without-assets`；输出必须为新文件。

解压后双击包内启动器。它直接运行随包 Node、共享本机入口和同一 Web，不安装或要求系统 Node、npm、Python。数据库默认位置和端口选择与源码个人版相同。退出会排空当前工作；Windows 关闭控制台受系统约十秒的终止上限约束，不能把强制关闭当作正常排空通过，见 [Node 信号说明](https://nodejs.org/docs/latest-v24.x/api/process.html#signal-events)。没有授权素材的包只能作源码候选，不能代替完整产品安装验收。

## 检查

```sh
npm run verify:phase7
node --import tsx apps/desktop/test/shell.browser.ts
node --import tsx apps/desktop/test/experimental-access.browser.ts
node --import tsx --test apps/desktop/test/assembly-ready.browser.ts
node --import tsx apps/desktop/test/safe-trace.browser.ts
node --import tsx apps/desktop/scripts/smoke.ts
node --import tsx apps/desktop/scripts/update-smoke.ts
node --import tsx apps/desktop/scripts/installed-smoke.ts --installer /path/to/candidate
```

完整 smoke 需要已授权素材。公共 CI 使用 `installed-smoke.ts --synthetic`，只验证协议、保存、profile、重启和退出子集，明确列出未执行的真实模型、海报、视频等检查。各脚本使用自有 profile/数据库，并清理所属进程；不会连接真实设备。ADB 仍使用共享宿主的 `DUCK_ADB`、系统 PATH 或 Arduino App Lab 工具查找规则。终端可找到 ADB 不能证明安装版 GUI 的设备功能可用。

`experimental-access.browser.ts` 使用真实 Electron 窗口检查首次长按、鼠标与键盘、真实功能窗口及重启保留。它使用独立 profile、模拟编号记录和阻断的 ADB；可用 `DUCK_APP_EXECUTABLE` 检查指定候选，不能作为实机验收。首次确认在各浏览器来源和桌面 profile 中独立保存。

两个显式browser专项分别检查组装加载完成前的截图门槛，以及真实Electron启动和生成trace的环境隔离。它们使用自有数据并关闭所属进程；`safe-trace.browser.ts`需要先完成`build:desktop`。普通`test:desktop`只自动运行`*.test.ts`，不暗中启动这些GUI专项。

`installed-upgrade.ts` 的真实 Windows A→B 验收需要隔离 Actions runner 和可匿名下载的已发布版本；它不模拟升级，也不发布安装包。`benchmark.ts` 默认使用共享 Node 基线采集，只有显式历史模式才调用旧 Python 对照。

`Desktop and portable candidates` 工作流可手动启用 `full_software_acceptance`，使用固定校验的既有素材包执行完整模型安装流程。常规 push/PR 仍使用源码候选；手动验收不发布素材或安装包。该历史素材包缺少较新的可选耗材数据，不能据此宣称完整耗材数据验收。Windows 专项 `native-input-smoke.ts` 只在隔离 Actions runner 使用 Win32 原生输入检查首页 iframe、下拉菜单、键盘和真实剪贴板；`portable-browser-smoke.ts` 检查真实 BAT 启动、完整模型浏览器流程、同库重启和实际控制台 Ctrl+C 退出。这些结果不能替代用户电脑、GPU或人工视觉验收。

`Complete release packages` 是手动完整发行构建：输入持有 `letsduck-build-assets.zip` 的草稿 Release 标签和档案 SHA-256，使用包含耗材目录、打印预设及组装素材的授权包。Mac arm64、Windows x64 安装版和 Windows x64 便携版分开验证；只有成功的 job 才保存下载包 artifact。工作流不会公开 Release；发布者还需验证 Mac 便携包、最终下载文件及校验和，再将草稿转为公开发行。草稿素材下载需要该 job 的仓库写权限；常规 PR 工作流仍只读。默认构建是无自动更新源的离线 beta，Mac 使用 ad-hoc 签名，不能据此宣称 Developer ID、公证或 Windows 发行签名通过。

Windows x64 与 Apple 芯片 Mac 分别报告桌面安装包及浏览器包的安装或解压启动、保存、3MF/BOM、海报、剪贴板、视频、重启和退出结果。签名、公证、自动更新、完整进程组 CPU/RSS、下载/安装大小、真实菜单和设备检查各自保留证据，普通单元测试不能替代这些验收。运行上述命令不表示这些条件已经通过。

手动完整验收可分别以 `windows_scope=native` 和 `windows_scope=portable` 启动，两项在独立 Windows 虚拟机中并行，避免共享前景窗口。子集只要求所选检查成功，并输出各项原始 outcome；默认 `all` 仍要求完整实装及 Windows 两路专项全部成功。`console_signal_diagnostic` 和 `native_select_diagnostic` 仅运行最小控制台或标准 HTML 控件诊断，其观察不能替代产品验收。
