# DuckPalette · 鸭子调色台

为 XGO Duck V2 设计的本地 3D 配色工作台：看整机、选零件、配真实耗材，并导出保留打印结构的改色 3MF。

**这是源码发行版。仓库不附带模型、3MF、衍生网格或耗材数据包。** 它们有独立的第三方授权；MIT 不覆盖这些资产。运行现有真实模型需要自行合法持有完整本地资产包，单独一份 3MF 还不足以复现当前装配预览。详见 [本地资产说明](docs/local-assets.md)。

## 已有能力

- 固定 XGO Duck V2：6 个打印板、35 个零件实例；原材料与打印结构受保护。
- 项目色盘、连续点涂、就近调色，左右单件或配对上色，锁定与撤销。
- 同一视窗显示整机和所选部件；旋转默认联动，可关闭；移动和缩放独立。
- 模型下方直接切换组装、散开和排列；收回整机恢复之前的视角。
- HSV / HEX 目标色与真实耗材绑定；PLA Basic 和 TPU 90A 分开处理。
- 命名保存、方案对比、BOM 和可编辑 3MF 导出。
- 一键套色：主色、辅色、点缀色、软垫色四个角色自动分配到 8 个部位；4 种分配方式、8 套主题预设、可锁定颜色的灵感骰子、耗材数量与相邻撞色提醒。
- 分享链接（只含零件与耗材色号，不含模型）和分享海报；打开链接即可一键带入配色。
- 模拟发布时可播放原创的「超进化」动画，画面与音效均为代码绘制/合成，不含任何动画原曲或素材。
- 本地社区演示：版本快照、评分与引用规则。**不是已上线的多用户后端。**

模型装配使用既有配准结果；踝轴等位置有示意成分。屏幕颜色不是实物色差保证，尚未验证装配公差或实物打印。MCP 尚未接入。

## 本地运行

需要 Python 3.9+、支持 WebGL 2 的浏览器；开发检查还需要 Node.js 22+。核心运行使用 Python 标准库和随仓库提供的 Three.js，不需要 npm 安装。

```sh
git clone https://github.com/1850VV/duck-palette.git
cd duck-palette
python3 scripts/import_local_assets.py /path/to/existing-workbench/assets
python3 run.py --no-open
```

访问 `http://127.0.0.1:8876/`，进入「专注涂装」。服务仅监听本机；停止终端中的程序即可停止服务。Windows 可将 `python3` 换成 `py -3`。

资产只复制到被 Git 忽略的位置；导入工具校验源文件哈希且不覆盖不同的已有资产。不要把这台本地服务直接暴露到公网。

## 开发验证

不需要模型的公开检查：

```sh
python3 -m unittest discover -s tests -p test_local_assets.py -v
python3 scripts/publication_audit.py
node --check app.js
node --check focus-workspace.mjs
```

导入完整资产后执行真实模型检查：

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_workflows.mjs tests/test_workbench.mjs tests/test_community.mjs tests/test_focus.mjs
```

浏览器回归入口为 `tests/focus-b-browser.js`，通过独立 Playwright CLI 会话运行 `run-code --filename=tests/focus-b-browser.js`；它要求 8876 上运行本项目，并只操作测试浏览器自己的存储。测试后关闭该会话。CI 不持有模型资产，不能替代完整模型、导出或浏览器验收。

## 文档导航

- [完整操作手册](docs/workbench-manual.txt)
- [项目结构与工作流](docs/project.md)
- [本地资产与复现边界](docs/local-assets.md)
- [第三方来源与许可证](THIRD_PARTY_NOTICES.md)
- [公开发行检查与排除项](docs/publication.md)
- [设计与研究历史](docs/history/README.md)
- [贡献指南](CONTRIBUTING.md) / [安全报告](SECURITY.md)

## 开源范围

原创代码和文档采用 [MIT](LICENSE)。Three.js 保留其 [MIT 声明](assets/vendor/THREE-LICENSE.txt)。模型、制造商数据和品牌名称不因本仓库而获得新的授权。DuckPalette 不是 Luwu Dynamics、Pollen Robotics、Bambu Lab 或 DeepSeek 的官方产品，也不表示这些项目认可本工具。
