# 资源优化与已验收组合：本地整合记录

结论：产品代码已无冲突组合，状态、导航、资源、休眠、画质和 LOD 功能检查通过。**附加的首页严格像素相等检查未通过**，见后文；不宣称全部视觉通过或取得新的性能收益。由主控决定是否纳入预览。

## 提交与隔离范围

- 本地分支：`codex/optimization-assets-accepted-integration`，在原任务独立工作树内建立。
- 产品组合 merge：`ac713b2befbe4789751665ed55f33b8bd18ca99b`。
- 第一父提交：冻结资源优化 `cae8133316687202c4d410a72eb10277108b8ee3`。
- 第二父提交：主控验收组合 `98d925fd257cdf0ccfa32c888f8d183ed3d67e9f`（state + idle/表面深度修复 + 默认 LOD）。
- Git 自动合并成功，无文本冲突，无手工产品代码解决范围。后续本地提交仅适配旧导航测试及记录交付；完整交付 HEAD 见本任务最终回执。
- `codex/optimization-assets` 及其 origin 跟踪头保留 `cae8133`；未 push、改写 PR #13、新建 PR 或聊天。其他工作树只读，未操作 8910、8876 或真实个人库。

测试服务仅用 8904、新建 `/tmp/duck-assets-integration-20261024-1542.sqlite3`；启动后确认 `/api/site` 为 personal、assembly=true，方案数为零。之后的方案均由测试脚本生成。不使用旧 browser-runner.py，也没有指向 8910 的写入或库清空操作。

## 实际发现和局部处理

旧 `tests/personal-navigation-browser.js` 假设每次浏览器启动都是空白模型。状态恢复合入后，该假设已不成立，实际先后触发三处失败：

1. “新开一只”实际恢复模型原色，旧断言却要求等于启动时从 API 恢复的方案颜色（头部 `#FFFFFF` 与 `#345678` 不同）。
2. 已恢复的方案本来就是 theme-1，重复选择未改变颜色，旧 `notDeepEqual` 失败。
3. 最后的备份场景再次重复相同配色，没有 dirty 编辑，方案数不增加；旧断言仍要求 +1。

没有修改产品行为。测试改为从模型元数据取得“新开一只”的原色；两处编辑场景确保选择真正不同的配色，并明确断言备份前 dirty=true。原有撤销回到启动方案、颜色与步骤保持、备份数 +1 等检查仍保留。修正后该长流程通过。

失败原文分别保留在忽略目录 `output/optimization-assets/integration-navigation-before-fix.txt`、`integration-navigation-noop-theme.txt`、`integration-navigation-clean-backup.txt`。最终日志为 `integration-navigation.txt`。

## 验收证据

全部证据都在本树忽略的 `output/optimization-assets/`，不会提交模型、截图、trace 或数据库。

| 项目 | 结果与证据 |
| --- | --- |
| 全量检查 | Node `node --test tests/*.mjs tests/assembly/*.mjs`：244 通过、0 跳过；Python unittest：85 项中 67 通过、18 项真实 MySQL 因未配置跳过；系统 Python 个人版 15 通过。见 integration-node/python/personal.txt。 |
| 发行检查 | publication_audit 检查 313 个文件，findings=[]；git diff --check 通过。 |
| 冷恢复与草稿/步骤 | personal-state-browser 完整通过：API 冷恢复、刷新、浏览器重启、跨窗口进度、独立方案范围、空 API 与延迟 API；日志 integration-state.txt，截图/录像在 output/playwright/optimization-state/。 |
| 三页复用与已访问隐藏页休眠 | navigation 完整通过：三个 document/GPU 实例保持；颜色、撤销、步骤/进度保留；隐藏绘制不增长、音乐暂停；后退前进、并发导航、真实编辑备份；往返无额外模型缓冲请求。 |
| current / ultra 停绘 | 两档分别在总览、66 mm 近景及 step 12 / 65% 放大镜稳定后采样两秒，均为 0 次 WebGL draw 提交增长；原精度 fallback 也为零。不是 GPU 耗时或能耗测量。见 integration-views/result.json。 |
| LOD 与精度恢复 | 两档总览绑定 143 mesh / 3 模板，main 为 original=2、medium=2、far=139；近景与 detail pass 为 original=143、medium=far=0。两档 detail 后 mesh 几何引用均恢复；Node 单测另覆盖 pass 的 finally 恢复。独立文档 ?hardwareLod=0 显式 disabled。绑定计数包含未显示 mesh，不等于实际 draw calls。 |
| 资源压缩与 fallback | 浏览器实际 66 显示网格、35 打印网格；缺失 POS1、坏 POS1 与坏 DDG1 路径均成功回退 raw；12 语言/fallback 和首次音乐连续推进通过。integration-resources.txt。 |
| 现场 gzip / 304 | POS1 gzip 639472 B，解压 869922 B，与本地源逐字节相同；同表示条件请求返回 304。integration-http.json。没有重测整机传输收益。 |
| 延后 DOM 舞台管线 | 两个新 managed Chromium profile，首次组装都无目标管线创建；integration-raster/results.json。不是重新证明历史 259/727 ms 均消除。 |
| 截图 | integration-views/ 的 current/ultra overview、near、detail 和 original-fallback 共 7 张实页截图已查看；overview 为整机，近景可见十字槽与头部，detail 为实时放大镜。不是全 111 步或所有相机角度的视觉验收。 |

渲染探针只通过 Playwright route 给浏览器响应临时追加私有对象/LOD pass 记录，没有给产品新增测试接口。近景探针第一次使用 OrbitControls 的默认最短距离，拍到过近的裁切图；随后明确使用 66 mm、实际可见不透明螺丝和轴向视角，重跑全部七场景通过。正式源文件的相机策略未改。

## 严格截图失败：保留边界

`assembly-paint-preservation-browser.js` 的首页零差异断言失败：1440×1000 中 32 个像素、96 个颜色通道，最大通道差 10，位于 x448–479 / y448。连续两张同状态截图自身差异为零，因此未用动画噪声或容差将其算作通过。该轮在首页即停止，不能据它宣称三页严格零差异。原图、结果在 integration-paint-failure/，日志 integration-paint.txt。

单变量截图探针 `integration-pixel-probe/` 进一步得到：

- 同样式连续截图：0 差异。
- 仅隐藏下层未访问 iframe：前景 SVG 34 个像素变化，最大差 15。
- 再把 iframe 背景改为 transparent：另有 2 个像素变化。
- 单独把 z-index 改回 auto：0 新变化。
- 恢复原来的预热可见性及背景：与第一张严格 0 差异，连续截图也为 0。

已确定触发条件在下层预热 iframe 的可见性/背景与前景 SVG 绘制之间；没有页面数据、元素布局或模型变化。尚未细分到具体 Chromium/Skia 内部算子，不把推断当作浏览器 bug 的定论。没有为这些像素新增未经验证的产品绕行、等待或图层。**严格视觉一致性仍未通过，需主控审阅这一边界再决定预览。** 早期探针曾因 addStyleTag 传入空字符串失败，已改为合法空 CSS 注释；错误日志另存 integration-pixel-probe-harness-error.txt。

## 清理与未验证项

浏览器批次使用协调方实际共享锁，拿锁失败返回 75，不启动子进程；没有抢断或删除他人锁。所有直接 Playwright context/browser 均 finally 关闭，integration-cleanup.json 的自有浏览器 PID 已逐一确认不存在；无自有 daemon。8904 服务已停止、无监听，自己的锁已释放。临时测试库保留供复查，不提交。

未配置真实 MySQL；未在真实移动设备运行；未完整观看 111 步；未取得人工组合视觉验收；未清空系统 Metal/驱动缓存；没有性能前后对比或新的耗时收益结论。本任务实际测试端口仅为 8904；8910 与 8876 不切换、不重启。
