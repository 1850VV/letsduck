# 本地资产与复现边界

本项目公开的是软件源码。以下五个文件保留在本地，并被 `.gitignore` 排除：

| 文件 | 用途 |
| --- | --- |
| `assets/source.3mf` | 固定版本的原始六板项目，供导出器逐字节保留网格与参数 |
| `assets/model.json` | 35 个实例、装配配准、材料与网格偏移清单 |
| `assets/geometry.bin` | 真实装配/打印网格及参考硬件的浏览器数据 |
| `assets/catalog.json` | 36 款耗材的本地色表快照 |
| `assets/export-schema.json` | 与原项目和 Bambu 配置版本配套的导出字段描述 |

现有工作台的完整 `assets` 文件夹可以作为输入。导入器不联网、不下载模型、不修改源文件，也不覆盖不同的目标资产：

```sh
npm run import:assets -- /path/to/existing-workbench/assets
npm run start:local -- --no-open
```

**仅下载一份 3MF 不足以运行当前版本。** 还需要与它匹配的装配清单、二进制网格、目录和导出描述。本仓库暂未提供从任意 3MF 自动生成完整配准结果的生产级流程。`tools/history/` 保存了早期处理脚本，依赖当时的中间文件、第三方模型、NumPy/Trimesh/SciPy 等工具和特定版本，不是经过清洁环境验证的一键安装器。

模型持有者应自行确认所需用途的权利。软件 MIT 授权不覆盖上述资产。不要使用 `git add -f` 上传它们，也不要把完整本地运行目录打成公开 Release 附件。

导入工具要求源包中的输入是普通文件，并保留拒绝符号链接的既有约束。已有包使用链接时，可把逐文件解析后的同一授权内容复制到自有临时目录，再导入该目录；不要向已有用户资产目录覆盖写入。

## 组装教程资产

「想做鸭」的 3D 组装教程另需 26 个本地文件（约 126 MB）：整机组装模型、10 个硬件模型、10 段教程视频和 3 段音频。它们同样不进 Git，放在 `assets/assembly/`。`scripts/assembly-assets.json` 记录每个文件的大小和 SHA-256，导入器逐个核对，不覆盖不同的文件：

```sh
npm run import:assembly -- /path/to/authorized/assembly/assets
```

仅在有权使用对应资产且本机已有匹配 Git 引用时，才可使用导入器的 `--git <ref>` 选项。分支是否公开不代表其资产已获再分发许可。

没有导入时，组装和首页模型预览不可完整使用；涂装仍使用自己的资产包。当前首页提供来涂鸭、调试鸭、组装鸭三个入口，组装入口还需 15 个安装编号读回验证通过。来源与许可见 [第三方说明](../THIRD_PARTY_NOTICES.md)。

主、副舵盘可在组装模型上直接点选识别。本地资产包还可保留 `horn-reference/main.jpg` 与 `horn-reference/secondary.jpg` 两张本批实物照片，供安装时对照。它们是清单中的可选本地文件，导入时会核对大小与哈希；缺少照片不影响 3D 点选。照片不随源码分发，不能据此获得再分发许可。

## 验证含义

公开 CI 验证源码、导入工具和发布检查；完整测试使用本地资产执行。缺少资产时，启动器明确提示缺失文件，不生成替代模型，也不会将空白预览称为运行成功。

## Optional smaller display model

After importing the local assets, run `npm ci && npm run pack:positions` on a build machine with Node.js. This generates local-only `geometry.positions.bin` and precompressed variants. Package them alongside the existing assets; do not commit them. The current source application and build tools use Node.js 24.20+ (24.x). If the pack or Worker is unavailable, the browser uses the original DDG1 path.

The display pack retains DDG1's 16-bit coordinates, all triangles, and 64-bit print matrices. It does not remove the original source's existing quantization error. Normals are generated in a Worker. The accepted shared export uses the same downloaded pack, computes print normals lazily in a Worker, and reuses the view renderer and geometry. The legacy pack remains packaged as a compatibility fallback; a successful shared export does not fetch it. The source 3MF still remains on the server.

## 可选的真实耗材色库

在原有五个文件旁放置 `filament-catalog.json`，导入器会同时复制它；原 `catalog.json` 的 36 个编号、色值和预设优先保留。可选扩展记录品牌、系列、官方色号或 SKU、全部多色色值和来源链接。没有官方 HEX 的条目保留在待补充记录中，不提供选色。来涂鸭通过 `/api/catalog` 读取合并结果。没有扩展时仍可使用原色库。

`filament-profiles.json` 是可选的本地官方打印预设快照，结构为 `{"profiles":{"preset name":{"name":"…","compatibleP1P":true,"sourceUrl":"…","settings":{…}}}}`；`settings` 已展开上游继承关系。导出优先选对应品牌和系列，其次选同类通用材料预设。原 36 色及 TPU 90A 的源项目参数保持兼容。耗材清单保留完整身份与预设来源，3MF 同时填写原生品牌、材料类型、自定义系列色号名称和多色色值。缺少材料预设时仍可导出清单，3MF 会说明缺少的系列，不套用 PLA 参数。

扩展色库和打印预设属于本地资产，不随公开源码发布。它们不代表机型、喷嘴或实际打印已经验证；导出的项目仍需在切片软件中核对并重新切片。

隔离界面验证：先 `npm ci && npm run build`，再运行 `npx tsx tests/browser/run-check.ts --fixture debug --check tests/filament_browser.ts`。runner 使用自己分配的端口、临时数据库和模拟控制器，保存混合品牌方案并下载实际清单与 3MF，不连接真实舵机。需要已导入的模型和已确认 v1 色库。
