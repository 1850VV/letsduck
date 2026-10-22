# 项目结构与边界

涂鸭 DoodleDuck 专注 XGO Duck V2 的配色、展示与分享，不支持任意机器人或任意 3MF 导入。

| 入口 | 职责 |
| --- | --- |
| `frontend/index.html` · `frontend/studio/` | 涂装台：三步主线、方案、发布、导出 |
| `frontend/gallery/` | 配色广场：作品列表、详情、评分、改编家族、我的方案 |
| `frontend/shared/duck-view.mjs` | Three.js 模型视图：选择、姿势骨架、材质、布局、截图与导出缩略图 |
| `frontend/shared/duck-actions.mjs` · `duck-voice.mjs` | MicroDuck 经典动作与叫声合成器（JS 移植） |
| `frontend/shared/api.mjs` · `profile.mjs` | API 客户端、登录注册与账号资料 |
| `frontend/shared/poster.mjs` | 分享海报与配色码 |
| `frontend/lib/` | 配色规则：分区、套色与配色码、色彩工具、超进化动画 |
| `backend/server.py` | API 路由；开发时也提供静态文件 |
| `backend/store.py` | SQLite：账号、私有方案、作品、评分 |
| `backend/exporter.py` | 固定源 3MF 的材料分配与保留校验 |
| `docker-compose.yml` | nginx 前端 + Python 后端 + 数据卷 |
| `tests/` | 规则、导出、存储、资产导入 |
| `docs/history/` · `tools/history/` | 脱敏研究记录与早期处理脚本 |

## 数据放在哪里

- 草稿、背景偏好在浏览器本地；未登录时「我的方案」也在本地，登录后同步到服务器，本地只留缓存。
- 账号是昵称 + 简单密码，服务器保存加盐哈希；面向几个朋友的小圈子，没有找回密码、邮箱或权限管理。
- 发布的作品所有人可见；只有作者能删除，不能给自己评分。删除原作后，改编作品保留但不再挂在家族树下。

## 当前边界

- 组装/散开/排列和姿势只改变显示，不写入打印结构。
- 原模型中合并的双眼等部件不能凭 UI 分成独立零件。
- 软质件沿用 TPU 90A。
- 非拓竹品牌色卡是示意数据；海报二维码是装饰。
- 未接入 HTTPS（交给部署时的反向代理）、实物照片上传、自动切片或打印机控制。
