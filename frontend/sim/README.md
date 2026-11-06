# 仿真鸭

调试鸭里的「仿真」页（`/sim/`）：浏览器里的 MuJoCo（`@mujoco/mujoco`），不需要 Python。

- `model/`：官方训练仓库 [xgoduck_rl](https://github.com/LuwuDynamics/xgoduck_rl) 的 `robot_walk.xml`、`scene_walk.xml`、网格和舵机参数 `1910_m6.json`（Apache-2.0，见 `model/LICENSE`）。官方更新模型时整份替换即可。
- 走路策略 `xgoduck_walk.onnx` 没有再分发许可，页面运行时从官方运行时仓库 master 下载并缓存；下载失败时可手动选择文件。官方更新策略后，页面自动用新版本（清缓存即可）。
- `duck.ts`：训练用的舵机模型（BAM m6，和 `bam.mjlab` 一致）+ 板子同样的 50 Hz 控制循环；`policy.ts`：板子 `rl_core.py`/`policy.py` 的观测和动作滤波，直接用权重计算，不需要 ONNX Runtime。
