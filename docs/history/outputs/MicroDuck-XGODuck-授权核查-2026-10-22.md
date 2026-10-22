# MicroDuck / XGO-Duck 授权核查

核查日期：2026-10-22。用途：个人运营、完全免费的机器人配色网站，包含浏览器 3D 预览、配色展示，计划提供改色 3MF 下载以及用户作品展示、排行榜。

## 结论

MicroDuck 和陆吾智能 XGO-Duck 不能统一视为“全部 Apache 2.0”。MicroDuck 明确区分代码和指定 STL 网格；XGO-Duck 硬件仓库记录的是尚未最终确定的授权意向；当前工作台使用的 3MF 还带有独立的 MakerWorld 许可标记。

现有证据不足以确认当前这份 XGO Duck V2 3MF 可在独立网站托管、交付浏览器或向公众提供改色下载。免费并不能自动补足再分发权限。此结论是“未确认取得相应用途的许可”，不是认定项目或作者已经侵权。

## 逐项核查

| 对象 | 查到的许可或声明 | 对配色服务的意义 |
| --- | --- | --- |
| `pollen-robotics/microduck` | 根目录 Apache-2.0；第三方目录另有许可 | 可依 Apache 条件复用受其覆盖的代码，不能据此推定硬件设计全部开放 |
| `pollen-robotics/microduck_rl` 的代码、MJCF/XML、配置及 `.part` 元数据 | Apache-2.0 | 与 STL 的许可不同；复制和分发时保留适用声明 |
| `microduck_rl` 指定目录中的 STL | CC BY-NC-SA 4.0 | 允许符合条件的非商业复制、分享和改编；需署名、链接许可、标注改动并按相同许可分享改编资产 |
| `LuwuDynamics/xgoduck_rl` | README 明确说代码采用 Apache-2.0；有根目录 LICENSE | 未找到与 MicroDuck 类似的独立模型许可清单，不能将代码许可直接用于证明所有 XGO 网格的权利来源 |
| `LuwuDynamics/xgoduck_hardware` | 有 `LICENSING.md`；没有完整项目级最终许可证 | 维护者表达个人/教学复刻意向，但明确写明这不是最终许可，文件范围及条款待定，并建议联系确认 |
| `LuwuDynamics/xgoduck_runtime_arduino` | 本次未找到许可证命名文件，README 未给出完整许可 | 不按“公开仓库”推定自由再分发；本次未审计每个源码头部和依赖 |
| 用户上传的 `XGO_duckV2.3mf` | 内部 `License` 字段为 `MakerWorld Exclusive License` | 不能由另一个 GitHub 仓库的 Apache 文件覆盖其许可标记 |

## MicroDuck 的模型条件

官方 `LICENSE-MODELS.md` 指定的范围是：

- `src/mjlab_microduck/robot/microduck/assets/*.stl`
- `src/mjlab_microduck/robot/xl330_test_bench/assets/*.stl`

分享这些文件或改编版本时，应标注 Pollen Robotics、链接官方仓库及 CC BY-NC-SA 4.0、说明改动，并按该许可分享改编资产。转换成网页用的网格、简化面数或更换封装格式，不会自动消除原许可义务；是否构成改编或仅格式转换，要结合实际改动，但署名和非商业等条件仍需遵守。

这为真正非商业的网页展示与模型分享提供了明确许可路径。不能只以“下载不收费”作为非商业用途的唯一判断依据。相同方式共享针对受许可约束的改编资产，不等于独立编写的整个网站程序都必须采用 CC 许可。

这些网格用于仿真；本次没有核实它们是否具备可打印结构、公差和装配条件。不能用它们直接替换目前的六板 3MF 并声称仍是相同打印项目。

来源：[官方模型许可证，固定版本](https://github.com/pollen-robotics/microduck_rl/blob/b02fdea4902c2b93b7d34a83a6f05da4ececb7d3/LICENSE-MODELS.md)、[CC BY-NC-SA 4.0 法律文本](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en)、[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)。

## XGO-Duck 的关键不确定项

硬件仓库的 `LICENSING.md` 明确将个人、教学复刻表述为维护者意向，并说明尚未形成最终许可。`UPSTREAM.md` 承认项目对 MicroDuck 的参考和适配关系，同时注明逐文件来源、版本和权限仍待记录。这些说明不能证明某个具体文件无权使用，也不能当成已经完成权利审计。

授权应按实际文件及取得它时的版本核查。后续仓库更新或当前许可声明，不足以自动判断所有历史副本的许可；本次没有完成历史版本的逐文件比对。

可联系仓库列出的维护者邮箱 `hello@xgorobot.com`，说明不是仅个人打印，而是运营公开的免费配色服务，并具体确认：

1. 是否可以在服务器存储指定版本模型，并向用户浏览器提供网格用于交互预览。
2. 是否可以生成并公开展示配色渲染图、用户作品卡和排行榜。
3. 是否可以生成并向用户提供保留原网格的改色 3MF 下载。
4. 适用的署名、修改说明、再分发许可证，以及其有权授权的文件范围；MakerWorld 独占安排是否允许这些用途，涉及上游资产时应遵守哪些许可。

本次只整理联系范围，没有发送邮件或 GitHub 消息。

来源：[XGO 硬件授权说明，固定版本](https://github.com/LuwuDynamics/xgoduck_hardware/blob/cd3358d96945c6ff2b713c7c2f3084321b9537ca/LICENSING.md)、[来源与适配说明，固定版本](https://github.com/LuwuDynamics/xgoduck_hardware/blob/cd3358d96945c6ff2b713c7c2f3084321b9537ca/UPSTREAM.md)、[XGO RL README](https://github.com/LuwuDynamics/xgoduck_rl/blob/afd091be041caf5e6d4f44102c959e7571b82a37/README.md)。

## 直接读取用户 3MF 得到的证据

读取对象：当前工作台的 `assets/source.3mf`，对应上传的 `XGO_duckV2.3mf`。

SHA-256：`731b5be439edd589d2c46330e4ed8c9bc3bd6d4ddcb7bebbc02026a6a740c58c`

来源条目：ZIP 内 `3D/3dmodel.model` 的顶层 metadata。

| 字段 | 值 |
| --- | --- |
| Title | XGO-Duck｜打造属于你的双足机器鸭 |
| Designer | 陆吾智能LuwuDynamics |
| License | MakerWorld Exclusive License |
| DesignModelId | CN1dd29ab947e6e7 |
| DesignProfileId | 206240006 |
| CreationDate | 2026-10-21 |

文件内未发现按 license/licence/copyright/readme/notice 命名的独立许可文件。两个 Copyright metadata 为 `[]`，这不表示放弃著作权。描述中允许选择外观配色，也不等于完整授予第三方公开托管及再分发模型的权利。

本次未成功读取 MakerWorld 当前完整独占许可页面，也未核实该模型线上页面当前显示的条款。因此不把历史论坛转述的 Standard Digital File License 当作这份 MakerWorld Exclusive License 的完整文本。需要结合模型页面、取得文件时的条款及权利人的有效授权进一步确认。

尝试核查的官方页面：[MakerWorld Exclusive Model Policy](https://makerworld.com/en/exclusive-model-policy)。读取失败已记录，不作为已读条款引用。

## 对当前工作台的影响

- 现有工具保留的 `XGODUCK-RL-LICENSE.txt` 是参考仓库根目录的 Apache 文本，不能据此确认原始 3MF、全部模型和品牌素材的公开发布权限。
- 浏览器加载 `geometry.bin` 本身就涉及向用户交付模型数据。仅关闭“下载 3MF”按钮，不能等同于消除了模型再分发问题。
- 技术上的改色导出测试只说明文件结构和材料映射，不是知识产权授权验收。
- 授权明确后，模型及导出文件应携带适用来源、作者、许可证和修改说明；改色不能擅自替换原许可。
- 若先做方案社区，可考虑只存颜色参数和具有展示授权的作品卡。用户自行取得模型、在本地导入，可以减少网站再分发原模型的范围，但仍需核实原许可允许相应处理和展示。

本次未修改工作台、模型或现有许可证，也未进行公网部署。

## 核查版本及边界

| 仓库 | 固定提交 |
| --- | --- |
| pollen-robotics/microduck | `942e58e3aa6dbb28e7037203fff11866122c7567` |
| pollen-robotics/microduck_rl | `b02fdea4902c2b93b7d34a83a6f05da4ececb7d3` |
| LuwuDynamics/xgoduck_rl | `afd091be041caf5e6d4f44102c959e7571b82a37` |
| LuwuDynamics/xgoduck_hardware | `cd3358d96945c6ff2b713c7c2f3084321b9537ca` |
| LuwuDynamics/xgoduck_runtime_arduino | `9dc36787bc61b102c2da0f97c9c758e639e90ab8` |

通过已认证 GitHub API 读取仓库树及许可/README 文件，仓库树响应均未截断。证据记录了提交、文件哈希和源 3MF 元数据。没有完成每个二进制资产的作者权属调查、全部第三方依赖审计、专利/商标检索或历史许可审计；以上结论不替代对争议事实的法律认定。
