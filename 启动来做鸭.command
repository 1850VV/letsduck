#!/bin/zsh
# 来做鸭 letsduck 源码启动器（macOS）。先安装 Node.js 24.20+（24.x）并运行 npm ci。
cd -- "$(dirname -- "$0")" || exit 1
for duck_candidate in node /opt/homebrew/bin/node /usr/local/bin/node; do
  if command -v "$duck_candidate" >/dev/null 2>&1 && "$duck_candidate" -e 'const [major,minor]=process.versions.node.split(".").map(Number);process.exit(major!==24||minor<20)' >/dev/null 2>&1; then
    duck_node_path=$(command -v "$duck_candidate")
    export PATH="${duck_node_path:h}:$PATH"
    if [[ ! -d node_modules ]]; then
      echo '首次运行源码，请先在本目录执行 npm ci，再导入已授权的资产包。'
      [[ -t 0 ]] && read -k 1 '?按任意键关闭…'
      exit 2
    fi
    npm run start:local -- "$@"
    duck_exit_code=$?
    if [[ $duck_exit_code -ne 0 && -t 0 ]]; then read -k 1 '?来做鸭没有正常启动（见上面的提示）。按任意键关闭…'; fi
    exit $duck_exit_code
  fi
done
echo '本源码启动器需要 Node.js 24.20 或更新的 24.x 版本。'
echo '请从 https://nodejs.org/en/download 安装，然后在本目录运行 npm ci。'
[[ -t 0 ]] && read -k 1 '?按任意键关闭…'
exit 2
