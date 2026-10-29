<p align="right"><b>简体中文</b> · <a href="README.en.md">English</a></p>

# 来做鸭 / letsduck

<p align="center"><img src="frontend/shared/brand/logo.svg" width="128" alt="来做鸭 letsduck"></p>

为 XGO Duck V2 准备的涂装、舵机调试和 3D 组装工具。给机器鸭选颜色，导出改色 3MF 和物料清单；在本机连接 UNO Q，核查舵机编号与参数，再跟着教程组装。

**公开主线提供软件源码。运行需要另行准备有权使用的本地资产包，单独一份 3MF 不够。** 模型、制造数据、教程媒体及其衍生资产有独立授权，代码的 MIT 许可证不覆盖它们。先读 [本地资产说明](docs/local-assets.md) 和 [第三方声明](THIRD_PARTY_NOTICES.md)。

<p align="center"><img src="docs/media/outfits.gif" width="560" alt="在涂装台切换机器鸭配色"></p>

## 两个版本

- **客户端版（主要版本）**：在自己的电脑上涂装、调试和组装。只提供 **Apple 芯片 Mac（arm64）** 和 **Windows x64** 客户端，不提供 Intel Mac、Linux 或其他平台客户端。
- **服务器版**：供自行部署配色分享、评分和改编。尚未做充分的优化与适配，按需参考下方说明。

## 客户端版

客户端首页可以左右拖动三只鸭，也可以用方向键切换。点侧面的鸭子先转到中间，再点中间的鸭子进入功能。

| 入口 | 可以做什么 | 使用条件 |
| --- | --- | --- |
| 来涂鸭 `/paint` | 选配色、细调零件、摆姿势、制作海报、保存方案、导出 3MF + BOM | 完整涂装资产包 |
| 调试鸭 `/debug/` | 查看连接与实时反馈，自动连续编号与下一只队列，扫描、核查和修改编号与参数，微调和零位校准 | 本机 USB 连接 UNO Q；已安装 ADB 和兼容的 Duck Runtime |
| 组装鸭 `/assemble/` | 按章节查看材料、取件盘位、3D 安装步骤及参考视频 | 组装资产包；首页入口在 15 个安装编号读回验证通过后解锁 |

涂装台里的动作是屏幕预览。调试鸭中的设备操作会作用于实物，需点击对应操作按钮。打开调试界面只读取状态。

### 涂装与导出

1. **选个起点**：白胚、经典配色、灵感骰子，或自己的已存方案。
2. **细调部位**：点模型或列表选零件，再选耗材颜色或自由调色。支持刷子、吸管、聚焦、A/B 对比和部位锁定。
3. **展示与导出**：摆姿势、播放动作和叫声、换背景、生成海报，导出保留原打印结构的改色 3MF 和 BOM。

<table><tr>
<td><img src="docs/media/zh/02-refine.jpg" alt="选择零件并修改颜色"></td>
<td><img src="docs/media/zh/03-show.jpg" alt="姿势、海报与导出"></td>
</tr></table>

导出面向固定版本的 35 个零件、6 块打印板。显示姿势和散开效果不写回制造网格。它不提供任意 3MF 导入、自动切片或打印机控制。屏幕颜色不能保证实物色差，模型预览也不能证明装配公差。

首页、涂装、调试和组装的自有界面使用既有 12 种语言词典；覆盖范围和审校状态见 [翻译维护](docs/i18n.md)。

### 舵机准备与组装

- 按[厂商指引](https://www.xgorobot.com/duck.html#software)完成 Arduino App Lab、Duck OS 与板卡设置。程序复用已安装的 ADB；非标准路径可通过 `DUCK_ADB` 指定。
- 自动流程统一在调试鸭的「自动编号」页签：明确开始后才扫描并配置，可加入或移除下一只队列，暂停保留当前进度；换接上电后续跑。组装页保留教程、材料和取件。
- 首次编号时只连接一只舵机。目标编号为 `10–14`、`20–24`、`30–34`。程序匹配运行端配置档，写入后读回复核；同号舵机需分开接入，不能分别寻址。
- 换接前使用安全停机，等待至少 15 秒并确认停止，再断开 USB 和电池。不要带电换接。
- 编号验证记录与当前在线状态分别保存。断线保留记录，改号或未确认的写入会重新计算完成状态；在线数量不代表编号已验证数量。
- 组装教程提供按数量陈列的材料、单件放大旋转、主副舵盘点选和取件记录。取件盘按三排五列固定摆放，取走后留空，不补位。
- 编号、参数与机械零位是不同的事。软件不能修复装反或卡住的机构。线材规格及部分安装朝向仍需结合厂商资料和实物核对，页面完成状态不等于实物验收。

### 安装与启动

客户端有两种启动方式，功能共用同一套代码：**桌面安装包**在应用窗口中运行；**浏览器包**解压后双击启动器，在本机浏览器中运行。两者都随附运行时，无需另装 Node.js 或 Python。构建说明见[客户端打包](apps/desktop/README.md)。

[Releases](https://github.com/1850VV/letsduck/releases) 中现有文件是历史内测候选，尚无正式客户端发行。候选包不等于完整产品验收；完整功能仍需要有权使用的资产，见[本地资产说明](docs/local-assets.md)。

个人版首页的调试鸭、组装鸭首次显示为灰色内测入口，长按两秒确认后可正常进入；两项分别确认并保存在当前浏览器来源或客户端 profile。组装仍需完成原有编号校验。服务器版的调试鸭始终禁用，提示仅本地客户端可用，不受已有解锁记录影响。

从源码启动客户端，需要 Node.js 24.20+（24.x）：

```sh
git clone https://github.com/1850VV/letsduck.git
cd letsduck
npm ci
npm run setup:electron
npm run import:assets -- /path/to/authorized/assets
npm run import:assembly -- /path/to/authorized/assembly/assets
npm run start:desktop
```

如需在本机浏览器中使用，最后一步改为 `npm run start:local`。源码启动器 `启动来做鸭.command`（Mac）和 `启动来做鸭.bat`（Windows）也使用浏览器入口。默认地址为 `http://127.0.0.1:8876/`；端口被占用时尝试下一个。开发时可用 `npm run start:local -- --port 8880 --no-open` 指定端口并关闭自动打开浏览器。

命名方案、编号验证和取件进度保存在应用目录外：

| 平台 | 数据库 |
| --- | --- |
| Apple 芯片 Mac | `~/Library/Application Support/DoodleDuck/personal.db` |
| Windows x64 | `%APPDATA%\DoodleDuck\personal.db` |

可用 `DUCK_PERSONAL_DB` 指定位置。更新前备份数据库；桌面窗口与浏览器各自保存草稿、语言和偏好，不会随数据库自动互转。

## 服务器版

服务器版提供账号、私有方案、配色广场、评分与改编，不提供 USB 设备控制。部署使用 Docker Compose（nginx + Node.js + MySQL 8.4）。该版本尚未做充分的优化与适配，当前以客户端体验为主。部署、HTTPS、迁移与备份请见[服务器部署说明](docs/deployment.md)。

## 开发与文档

```sh
npm run build
npm run typecheck
npm test
npm run probe:runtime
npm run audit:typescript
npm run audit:publication
node --import tsx tests/browser/ui-system.ts
```

完整测试所需的资产、MySQL、浏览器及安装验收条件，见[开发与验证](docs/development.md)和[客户端打包与验收](apps/desktop/README.md)。技术检查不代替人工交互与实物验收。

- [项目结构](docs/project.md) · [本地资产](docs/local-assets.md) · [翻译维护](docs/i18n.md)
- [贡献指南](CONTRIBUTING.md) · [安全报告](SECURITY.md) · [公开发行范围](docs/publication.md)

## 许可证

原创代码和文档采用 [MIT](LICENSE)。Three.js、meshoptimizer、MicroDuck 等第三方代码保留各自声明，详见 [第三方声明](THIRD_PARTY_NOTICES.md)。模型、制造商数据、品牌及 README 中的模型画面不因本仓库获得新的授权。来做鸭不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品。
