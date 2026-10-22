# Ryugi 项目接入

用户于 2026-10-22 授权安装，并要求后续 UI 修改先出原型、确认后再改。项目入口为 [AGENTS.md](../AGENTS.md)。

## 来源与范围

- 官方仓库：<https://github.com/Innei/ryugi>
- 版本：1.18.0；固定提交 `e17f3616190d32433a1caf13faba6844ce8d41d0`。
- 项目插件来源：`.agents/plugins/marketplace.json`，marketplace 名为 `duck-studio-local`。
- 插件标识：`ryugi@duck-studio-local`。
- 项目启用配置：`.codex/config.toml`。
- 安装文件使用 Codex 管理的共享缓存；本轮只为机器鸭启用工作流。
- 配置完成后，新聊天应从本项目目录开始读取插件。已打开聊天的插件热加载行为需以实际客户端为准。

## 当前设计状态

画板：`.ryugi/artifacts/artboard/duck-ui-pilot/`。

- A 是当前运行涂装台的截图。
- B 是“模型优先布局”的桌面静态概念稿。
- 状态：**待用户确认**。安装插件不表示确认 B；不能据此开始修改实际涂装台。
- 已完成的是本地画板、截图、桌面布局与放大操作检查，见 [调研记录](../outputs/Ryugi-调研与机器鸭应用建议-2026-10-22.md)。本轮不把先前检查当作当前应用的新回归证据。

后续任务应记录原型版本、源码/链接、Mock 范围、用户确认的版本和范围、实际改动位置与验证结果。简单任务直接更新现有设计记录，无需另建完整计划。

2026-10-22 新增 `focus-flow` 页：专注涂装的默认旋转联动、三种展示快速切换。用户已确认 **B：模型下方快捷条**，已接入实际工作台并完成技术验证；`verify` 页提供实际截图与录像，等待用户体验验收。详见 [专注涂装交互原型 v1](focus-flow-v1.md)。之前“模型优先布局”的概念稿仍不在已确认范围内。

## 本地画板

在本项目目录启动，使用命令返回的链接及其 `?key=` 参数：

```sh
npx --yes --package ryugi-artifacts@1.18.0 ryugi-artifacts start --json --project-dir '<project>' --artifact artboard/duck-ui-pilot
```

停止查看服务但保留设计稿：

```sh
npx --yes --package ryugi-artifacts@1.18.0 ryugi-artifacts stop --json --project-dir '<project>'
```

## 安装验证

在项目目录检查：

```sh
codex plugin marketplace list
codex plugin list --marketplace duck-studio-local --json
```

验收重点：能解析项目 marketplace，安装版本正确，项目内插件启用，项目外不启用；已安装技能可被项目技能发现机制读取。真实 UI 任务的原型确认与实现验收仍待发生。
