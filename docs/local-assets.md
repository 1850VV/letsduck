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

## 验证含义

公开 CI 验证源码、导入工具和发布检查；完整测试使用本地资产执行。缺少资产时，启动器明确提示缺失文件，不生成替代模型，也不会将空白预览称为运行成功。
