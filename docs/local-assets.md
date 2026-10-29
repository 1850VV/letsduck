# 项目资源

运行与构建所需资源已随仓库放在 `assets/`，构建程序直接使用该目录，无需另找资产包、导入 3MF 或配置外部素材路径。客户端下载包也已包含这些资源和运行时，安装或解压后即可使用。

## 目录内容

| 文件或目录 | 用途 |
| --- | --- |
| `assets/source.3mf` | 固定版本的原始六板项目，供导出器保留网格与参数 |
| `assets/model.json` | 35 个实例、装配配准、材料与网格偏移清单 |
| `assets/geometry.bin` | 装配、打印网格及参考硬件的浏览器数据 |
| `assets/geometry.pack.bin`、`assets/geometry.positions.bin` | 已打包的显示数据与兼容路径 |
| `assets/catalog.json` | 原有 36 款耗材色表 |
| `assets/export-schema.json` | 与原项目和 Bambu 配置版本配套的导出描述 |
| `assets/filament-catalog.json`、`assets/filament-profiles.json` | 扩展耗材色库与打印预设 |
| `assets/assembly/` | 组装预览模型、视频、音频与两张舵盘参考照片 |

`scripts/assembly-assets.json` 记录组装资源的文件名、大小和摘要。打包程序沿用该清单检查资源，并把实际文件复制进安装包或浏览器包；不依赖开发机器上的软链接。素材来源与独立条款见[第三方声明](../THIRD_PARTY_NOTICES.md)，代码 MIT 许可证不改变素材原有条款。

## 构建与打包

```sh
npm ci
npm run build
```

客户端打包使用同一套资源，命令见[客户端打包与验收](../apps/desktop/README.md)。正常构建不需要执行 `import:assets` 或 `import:assembly`；这些工具保留给显式替换、维护资源的场景。替换资源时需保持模型、原始 3MF 和组装清单一致。

调试鸭和组装鸭仍仅供内测预览，功能尚不可用；请勿参考组装教程或用调试鸭操作真实设备。资源已包含不表示实机或教程验收已经完成。

## 显示数据

仓库已包含打包的显示数据。需要重新生成时可使用 `npm run pack:positions`，无需 Python。显示包保留原有坐标、三角形及打印矩阵，不把显示姿势或散开效果写回制造几何；兼容路径仍保留原始几何。

## 耗材色库与预设

扩展色库记录品牌、系列、官方色号或 SKU、多色色值和来源链接；原 `catalog.json` 的 36 个编号、色值和预设优先保留。没有官方 HEX 的条目保留在待补充记录中，不提供选色。来涂鸭通过 `/api/catalog` 读取合并结果。

`filament-profiles.json` 的 `profiles` 保存预设名称、兼容性、来源和已展开继承关系的 `settings`。导出优先选择对应品牌与系列，其次使用同类通用材料预设；耗材清单保留身份与来源。缺少某系列预设时，导出会说明缺项，不套用 PLA 参数。

色库与预设已随资源提供；它们不代表任意打印机、喷嘴或实际打印已经验证。导出项目仍需在切片软件中核对并重新切片。
