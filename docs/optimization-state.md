# 个人版状态可靠性（2026-10-24）

技术实现与验证已完成；用户于2026-10-24明确确认视觉对照页全部通过。没有合并、部署或切换正式服务。

## 范围与版本

- 分支：`codex/optimization-state`；PR base：`codex/personal-navigation`。
- 基线：`0699ccf96b7b101a57ab4cfb2754983f0d512a9a`；远端 base 核对相同。
- 首次实现：`b20ac49c228c230f90be345ef0db13d54064070b`。
- 最终源码提交：`e70083f6419b60c68a070af1c111ca4a60a6643b`。
- 本记录由其后的文档提交交付。最终交付 SHA 见聊天和 PR head。
- 只修改分配工作树。测试服务端口 8901，独立临时 SQLite 库。真实个人库、8876 服务、模型及制造数据未改动。
- 未增加按钮、保存文案、实物完成状态或布局。保留原观看进度含义。

## 根因与修复

组装只把步骤和进度放入隐藏表单；浏览器刷新无法可靠恢复。新增 `assemble/progress-store.mjs`，以教程版本、完整有序步骤 ID 与方案身份为键，保存步骤 ID 和 0–1 观看进度。恢复后暂停。选步、拖动和暂停立即写入；连续播放最多每 250ms 写一次，离开/隐藏/正常卸载时刷新。强制终止进程可能丢失最后一个 250ms 区间，未声称覆盖浏览器崩溃或系统断电。

命名方案按 scheme ID 隔离；未命名草稿有稳定 draftId，调色、撤销不改变身份，明确新开草稿会换身份。旧的有效未命名草稿会补身份，保留设计和编辑时间；普通HTTP缺少randomUUID时使用本地非认证标识后备生成。未知、损坏或不兼容教程记录安全回到起点，不猜测原物理组装进度。旧隐藏表单仍保留兼容事件，但不作为启动恢复来源。

相同方案的多个窗口采用最近一次写入的位置。storage 事件会取消旧窗口待写数据、同步位置并暂停；旧窗口关闭不覆盖新位置。不同方案的记录分开。清除浏览器存储不会由旧待写任务复活历史记录。存储被禁用或配额不足时保持页面可用，无法保证跨重启恢复。

首页此前只读浏览器缓存，涂装台稍后才从 API 取回已有方案。新增 `shared/personal-state.mjs` 统一只读 API 回填，首次首页渲染前完成初始化；请求期间产生的新草稿优先，不覆盖用户编辑。保留有效旧草稿。损坏草稿及可选数组有安全默认值。首页和组装监听浏览器草稿变化。组装模型构建显式等待原有 page.mjs 材质初始化，覆盖慢 API 的冷启动竞争。服务端数据层没有变更，恢复不写方案 API。

## 验收证据

所有本地证据位于 `output/playwright/optimization-state/`，被 Git 忽略，不随 PR 上传模型截图、浏览器配置或数据库。浏览器为 matching managed Chromium 151 / Playwright build 1234，桌面 1440×1000，非真实手机。仅验证状态可靠性，不宣称性能收益；未占用性能基准锁，也未使用并行负载下的导航耗时作收益。

| 验收项 | 实际证据与结果 |
| --- | --- |
| 首次方案同步、新浏览器首页与涂装台一致 | `fresh-context.txt`：独立测试库样例方案；清空浏览器上下文后首次首页即显示方案名/颜色；进入涂装台 activeId 和 colors 相同。通过。 |
| 第8阶段/第59步刷新 | `baseline-second.txt` 复现 59/.42 → 0/1；`progress-reload.txt` 修复后 59/.42 → 59/.42，暂停。通过。 |
| 关闭并重开浏览器 | 同一报告包含真实 on-disk profile：seek 59/.37 后立即关闭标签及浏览器进程，重开恢复 59/.37。另覆盖 storageState 重开路径。通过。 |
| 相机、撤销、热切换、配色同步 | `navigation.txt` 原有三页回归通过，含真实组装打印材质配色、相机、撤销、页面保留、隐藏页停止绘制；新增 browser 检查也通过。 |
| 不串方案、教程版本 | 浏览器验证切换方案身份分别恢复；Node 覆盖不同版本、损坏/越界/错误步骤 ID、非法写入、不同未命名草稿及调色保持身份。通过。 |
| 多窗口 | 第二窗口写入 60/.65 后首窗口同步；关闭首窗口，第二窗口刷新仍为 60/.65。通过。 |
| 空、损坏、旧记录 | 空 API 保留现有空态；损坏进度回起点；旧未命名草稿补稳定身份；畸形可选数组不崩溃；Node 覆盖初始化请求失败与并发编辑优先。通过。 |
| 无资产 | API assembly=false 时保留不可用入口；直接组装资源 404 时显示既有加载失败状态且不创建进度。通过。 |
| 慢 API 配色同步 | `slow-api-red.txt` 捕获初次实现时的材质竞争；`slow-api-green.txt` 修复后35个打印材质正确；最终 browser 验证每个打印件颜色与 API 样例一致。通过。 |
| 原用户方案不被改写 | 测试 API 样例的整个 schemes 响应在恢复/导航前后深度相等。代码恢复只发 GET；真实个人数据库从未打开。通过。 |
| 用户视觉/交互验收 | 前后截图与3.32秒实际录像已生成并检查帧/解码；本地 Ryugi verify 页无 warnings/pending 文件。用户于2026-10-24明确确认全部通过；画板home与reload两组均为pass，evidenceUpdated=false，无reject线程。 |

## 检查命令与结果

- `python3 -m unittest discover -s tests -p test_personal.py -v`：11/11 通过，`personal-tests.txt`。
- 已有开发虚拟环境的 Python 执行 `-m unittest discover -s tests -v`：78 项，60通过、18跳过，零失败，`python-tests.txt`。18项全部因 DUCK_TEST_DATABASE_URL 未配置；MySQL未验证。
- `node --test tests/*.mjs tests/assembly/*.mjs`：235项，232通过、3跳过，零失败，`node-tests.txt`。3项因本工作树未生成 geometry pack，属于其他资产任务范围，未在本任务生成。
- `python3 scripts/publication_audit.py`：findings=[]，`publication.txt`。
- `DUCK_BROWSER_URL=http://127.0.0.1:8901 node tests/personal-navigation-browser.js`：通过，`navigation.txt`。
- `DUCK_BROWSER_URL=http://127.0.0.1:8901 node tests/personal-state-browser.js`：通过，`browser.txt`、`progress-reload.txt`、`fresh-context.txt`，page errors=[]。可用 DUCK_PLAYWRIGHT_MODULE 指向已安装的 bundled Playwright。
- 新增 Node 测试首先验证失败（缺少状态功能），关闭边界和慢 API 另有失败复现，再修复；保留 `red*.txt` 与 slow-api red/green。
- `git diff --check`：通过。提交者与提交者邮箱均为 GitHub no-reply 身份。

## 审阅与运行清理

本地画板：`.ryugi/artifacts/artboard/verify-personal-state/`，首页、刷新两个 verify 组，含真实截图和短录像。审阅链接由最终聊天提供；没有发布云端副本。用户确认对应本轮现有首页状态与刷新恢复范围；不扩展到其他待审产品原型。画板反馈核对时间为2026-10-24 22:42（Asia/Shanghai）。审阅服务可保留供查看，与应用8901分开。

测试创建的浏览器 context/browser 均在 finally 关闭，临时 persistent profile 自动清理。任务测试服务8901和临时依赖链接在交付前关闭/移除；最终进程核对记录为 `cleanup.txt`。只关闭本任务拥有的进程，未触碰用户 Chrome 或其他任务。
