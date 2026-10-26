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
python3 scripts/import_local_assets.py /path/to/existing-workbench/assets
python3 run.py --no-open
```

**仅下载一份 3MF 不足以运行当前版本。** 还需要与它匹配的装配清单、二进制网格、目录和导出描述。本仓库暂未提供从任意 3MF 自动生成完整配准结果的生产级流程。`tools/history/` 保存了早期处理脚本，依赖当时的中间文件、第三方模型、NumPy/Trimesh/SciPy 等工具和特定版本，不是经过清洁环境验证的一键安装器。

模型持有者应自行确认所需用途的权利。软件 MIT 授权不覆盖上述资产。不要使用 `git add -f` 上传它们，也不要把完整本地运行目录打成公开 Release 附件。

## 组装教程资产

「想做鸭」的 3D 组装教程另需 26 个本地文件（约 126 MB）：整机组装模型、10 个硬件模型、10 段教程视频和 3 段音频。它们同样不进 Git，放在 `assets/assembly/`。`scripts/assembly-assets.json` 记录每个文件的大小和 SHA-256，导入器逐个核对，不覆盖不同的文件：

```sh
python3 scripts/import_assembly_assets.py --git origin/codex/assembly-tutorial   # 从本机已拉取的私有分支读取
python3 scripts/import_assembly_assets.py /path/to/assembly/assets               # 或者从一个文件夹读取
```

没有导入时，首页的「想做鸭」显示「即将开放」，其余功能不受影响。来源与许可见 [第三方说明](../THIRD_PARTY_NOTICES.md)。

主、副舵盘图解还可读取 `horn-reference/main.jpg` 与 `horn-reference/secondary.jpg` 两张本批实物照片。它们是清单中的可选本地文件，导入时会核对大小与哈希；旧资产包缺少它们仍可使用组装台和 3D 识别。照片不随源码分发，不能据此获得再分发许可。

## 验证含义

公开 CI 验证源码、导入工具和发布检查；完整测试使用本地资产执行。缺少资产时，启动器明确提示缺失文件，不生成替代模型，也不会将空白预览称为运行成功。

## Optional smaller display model

After importing the local assets, run `npm ci && npm run pack:positions` on a build machine with Node.js. This generates local-only `geometry.positions.bin` and precompressed variants. Package them alongside the existing assets; do not commit them. The installed application still needs only Python. If the pack or Worker is unavailable, the browser uses the original DDG1 path.

The display pack retains DDG1's 16-bit coordinates, all triangles, and 64-bit print matrices. It does not remove the original source's existing quantization error. Normals are generated in a Worker. The accepted shared export uses the same downloaded pack, computes print normals lazily in a Worker, and reuses the view renderer and geometry. The legacy pack remains packaged as a compatibility fallback; a successful shared export does not fetch it. The source 3MF still remains on the server.
