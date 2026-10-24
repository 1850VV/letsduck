# 个人版螺丝显示模型优化 · 2026-10-24

状态：内部候选已实现；默认关闭；用户视觉验收未完成。不要据此开启正式服务或默认画质。

基线：`0699ccf96b7b101a57ab4cfb2754983f0d512a9a`，分支 `codex/optimization-models`。实现提交：`fb9c2adf5f8078b03f5ef9c5b0b89fd6f2006021`。后续提交仅补充交付记录。

## 改动与边界

新增 `hardware-lod.mjs`，仅对三种已批准螺丝的显示几何生成共享的中/远精度网格。杆部按 0.08/0.16 mm 网格聚类，保留上方 2 mm 的头、槽口与座面原顶点。保留法线/UV属性，保留材质批次，不重绘纹理或更改灯光。聚类有几何/UV误差，属于待审候选，不宣称无损。原 GLB、3MF、打印板、尺寸、坐标均只读。

投影直径 <28 CSS px 用远景、28–72 px 用中景，≥72 px 用原网格。近景、放大镜/剖视 detail、透明/ghost、相机后方使用原件。每个 render pass 在 `finally` 中恢复原几何，因此选择/射线检测、分步显隐及后续质量切换访问原网格。current/ultra 共用该选择；不改变 render loop 的调度、生命周期或阴影设置。默认路径不生成派生网格。

仅调试入口：个人服务的 `/assemble/index.html?hardwareLod=1`。使用独立测试数据库与端口；外层个人版壳不透传此参数，不能以 `/assemble/?hardwareLod=1` 验收候选。

没有新增相同材质实例化：现有 actor 独立透明度、分步姿态与材质所有权需要保留，本次没有足够证据在不改变这些行为的前提下降低 calls。已有 geometry 共享、板卡/舵机批处理不是本次收益。

## 可重复证据

本地证据目录：`output/playwright/opt-models-1024/`（忽略，不发布模型/截图）。包含 `probe.cjs`、`browser.cjs`、`detail.cjs`、`hardware-metrics.txt`、`render-metrics.txt`、`detail-metrics.json`、两组制造文件哈希、测试日志和 `review.md`。前两份脚本重放相同鼠标缩放输入，浏览器以 finally 关闭。

环境：Apple M4，Playwright managed Chromium 155，1440×1000、DPR 1；GPU标识详见 render-metrics.txt。同环境每个视角10次采样一致，基线/候选相机坐标逐项相同。性能锁已使用并释放，但其他任务浏览器仍有负载（benchmark-load.txt）；不报告 GPU/帧耗时改善。早期 shell 路由探针和媒体 load 等待失败已修正为独立文档、DOMContentLoaded、managed full Chromium，保留失败日志，不将它们当作有效指标。

| 同视角 current | 基线 calls / triangles | 候选 calls / triangles |
| --- | --- | --- |
| 远景 | 516 / 7,620,284 | 516 / 4,503,538 |
| 中景 | 516 / 7,620,284 | 516 / 4,518,474 |
| 近景整机 | 516 / 7,620,284 | 516 / 4,518,474 |

远景三角数实测减少40.90%；calls未减少。整机近景仍有屏幕上很小的螺丝使用LOD，不意味着全部原精度；关键局部 detail 则全部原精度。

| 螺丝模板 | 原件 triangles | 中景 | 远景 |
| --- | ---: | ---: | ---: |
| M2x6 | 47,840 | 35,648 | 25,514 |
| M3x16 | 40,348 | 35,714 | 29,026 |
| M2.3x8 | 39,850 | 32,498 | 26,836 |

候选共享派生 attributes+indices **额外** 4,569,128 bytes。143个螺丝mesh绑定共享3份模板，每模板2级；计数含隐藏mesh。运行时生成产生临时分配，JS heap为未强制GC快照，不能用其差异证明稳态内存收益；未测GPU内存。后续如默认启用，应先评估离线派生与瞬时分配。

## 验收逐项

- 同环境重复指标：已取得 calls、triangles 和派生网格精确字节数；未取得稳定 GPU/帧耗时收益。
- 远/中/近：baseline/candidate 三组截图已记录，相机相同；局部螺丝、孔位、槽口、头型与线束可见。人工视觉通过尚无，review.md 为待审对比稿。
- 近景教学：`r-tighten` 的螺丝实时放大镜可见，baseline/candidate 均1.5×；候选 detail 报告 original=143、medium=0、far=0。其他步骤仍需人工完整走查。
- 显隐/透明/ghost/选取：原有机械、姿态、硬件、穿线、剖视等Node测试通过；新增测试验证透明回退、近景回退、detail回退、异常恢复及源数组不变。未逐一浏览器走查全部111步、穿透及选取，不据测试宣称全交互已验收。
- current/ultra/阴影：两种模式实页截图与诊断已保存；不改变光照、材质、阴影参数。主观阴影外观及全部相机角度仍待审核。
- 原制造文件：`assets/source.3mf` 前后 SHA256 相同：`731b5be439edd589d2c46330e4ed8c9bc3bd6d4ddcb7bebbc02026a6a740c58c`。没有提交或生成制造文件。
- 测试：Node 230项，227通过、3项压缩资产相关跳过；个人版Python11通过；publication audit findings=[]。全部Python初次因共享环境缺少httpx2有4个模块导入错误；本树独立`.venv`安装锁定requirements-dev后重跑78项，60通过、18跳过（MySQL未配置及显式跳过项，详见日志）。
- 进程：所有任务自有CLI会话及直接Playwright浏览器已关闭；测试服务交付前停止。正式8876服务未操作。不得把浏览器技术检查视为用户视觉确认。

## 交付记录

本地 Ryugi 画板：`.ryugi/artifacts/artboard/verify-hardware-lod/canvas.json`，五组基线/候选真实截图，warnings=[]、pending=[]（文件完整状态，不代表视觉通过）。项目 auto-publish=false，未云端发布。测试服务8903及自有自动化浏览器/daemon已退出；仅本地画板预览服务保留供审核，端口50191，关闭方式：用 Ryugi launcher 对本工作树执行 `stop --json --project-dir <本工作树>`。它不是正式应用服务。
