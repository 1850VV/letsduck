#!/bin/zsh
# 涂鸭 DoodleDuck 个人版（macOS）：双击启动。只需要 Python 3.9+，macOS 自带的就可以，不用安装其他东西。
# 第一次双击若提示「无法验证开发者」：在 Finder 里右键这个文件 → 打开。
cd -- "$(dirname -- "$0")" || exit 1
for py in python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
  if command -v "$py" >/dev/null 2>&1 && "$py" -c 'import sys; sys.exit(sys.version_info < (3, 9))' >/dev/null 2>&1; then
    "$py" run.py "$@"
    status=$?
    if [ $status -ne 0 ]; then read -k 1 "?涂鸭没有正常启动（见上面的提示）。按任意键关闭…"; fi
    exit $status
  fi
done
echo "没有找到 Python 3.9 或更新版本。"
echo "如果弹出「安装命令行开发者工具」的窗口，点「安装」，装好后再双击本文件。"
echo "也可以从 https://www.python.org/downloads/macos/ 下载安装 Python。"
xcode-select --install >/dev/null 2>&1 || open "https://www.python.org/downloads/macos/"
read -k 1 "?按任意键关闭…"
