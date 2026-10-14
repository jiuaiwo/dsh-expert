#!/usr/bin/env bash
# 发布流程「版本决策」的纯逻辑回归（verify 会调用它）。
#
# 为什么要它：这段逻辑把「用哪个版本发布」拆成了多条路径（--current / --retry / --patch / 交互菜单
# / 手输版本），而这些路径最终的产物只有一对变量 (target, skip_bump)。曾经踩过的坑是 ——
# 菜单里选了「1) 直接发布当前版本」，keep_version 确实被设上了，但 skip_bump 只在进入分支**之前**
# 的那个 if 里判定过，于是它带着 skip_bump=0 去跑 `npm version 0.3.6`，npm 报 "Version not changed"。
# 这里把 tz.sh 的那一段抽出来、注入假变量跑一遍，把每条路径的 (target, skip_bump) 钉死。
# 从 tz.sh 抽出「版本决策段」，在受控变量下跑，验证 (target, skip_bump) 是否符合预期。
# 用途：发布脚本改动的回归验证 —— 这次就是它抓出了「菜单选 1 之后 skip_bump 仍是 0」。
# 注意：抽出的段落里有 `local`/`return`，这里先把 `local ` 剥掉、并把 return 换成标记，
# 否则 eval 会提前返回、或声明到错误的层级。
set -uo pipefail
SRC="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/tz.sh}"
SEG="$(awk '/local target="" skip_bump=0/{f=1} f{print} f&&/^  fi$/{ while ((getline nxt) > 0) { if (nxt ~ /^[[:space:]]*#/ || nxt ~ /^[[:space:]]*$/) { print nxt; continue } if (nxt ~ /skip_bump=1/) print nxt; break } ; exit }' "$SRC" \
  | sed 's/^  local /  /' \
  | sed 's/return 0/cancelled=1/')"
[ -n "$SEG" ] || { echo "抽不出决策段"; exit 2; }

run_case() { # $1=keep_version $2=bump $3=retry $4=交互输入
  keep_version="$1"; bump="$2"; retry="$3"; case_choice="$4"
  local_version="0.3.6"; pkg="dsh-expert"
  DIM=""; WARN=""; OK=""; BAD=""; RESET=""
  target=""; skip_bump=0; cancelled=0; choice=""
  info() { :; }
  die() { echo "DIE:$*"; }
  # read -r choice → case_choice；read -r target → 版本串
  READ_COUNT=0; read_rest=""
  read() {
    local __var="${2:-REPLY}"
    if [ "$READ_COUNT" = 0 ]; then eval "$__var=\${case_choice%%:*}"; read_rest="${case_choice#*:}"
    else eval "$__var=\$read_rest"; fi
    READ_COUNT=$((READ_COUNT + 1))
  }
  bump_version() {
    python3 - "$1" "$2" <<'PY'
import sys
cur, kind = sys.argv[1], sys.argv[2]
major, minor, patch = (int(p) for p in (cur.split(".") + ["0","0"])[:3])
if kind == "major": major, minor, patch = major+1, 0, 0
elif kind == "minor": minor, patch = minor+1, 0
else: patch += 1
print(f"{major}.{minor}.{patch}")
PY
  }
  eval "$SEG" >/dev/null
  echo "target=$target skip_bump=$skip_bump cancelled=$cancelled"
}

fails=0
check() { # $1=说明 $2=实际 $3=期望
  if [ "$2" = "$3" ]; then echo "ok   $1 — $2"; else echo "FAIL $1 — 实际 [$2] 期望 [$3]"; fails=$((fails+1)); fi
}

check "--current（非交互）走不升版"       "$(run_case 1 "" 0 "")"        "target=0.3.6 skip_bump=1 cancelled=0"
check "交互选 1 = 发布当前版本（不升版）"  "$(run_case 0 "" 0 "1")"       "target=0.3.6 skip_bump=1 cancelled=0"
check "交互选 2 = patch"                 "$(run_case 0 "" 0 "2")"       "target=0.3.7 skip_bump=0 cancelled=0"
check "交互选 5 手输同版本 → 不升版"       "$(run_case 0 "" 0 "5:0.3.6")"   "target=0.3.6 skip_bump=1 cancelled=0"
check "交互选 5 手输新版本 → 升版"         "$(run_case 0 "" 0 "5:0.4.2")"   "target=0.4.2 skip_bump=0 cancelled=0"
check "交互选 0 → 取消"                  "$(run_case 0 "" 0 "0")"       "target= skip_bump=0 cancelled=1"
check "交互回车 → 取消（不误发）"          "$(run_case 0 "" 0 "")"        "target= skip_bump=0 cancelled=1"
check "--retry 沿用当前版本"             "$(run_case 0 "" 1 "")"        "target=0.3.6 skip_bump=1 cancelled=0"
check "--patch 参数"                     "$(run_case 0 "patch" 0 "")"   "target=0.3.7 skip_bump=0 cancelled=0"
check "--version 参数"                   "$(run_case 0 "1.2.3" 0 "")"   "target=1.2.3 skip_bump=0 cancelled=0"

echo
[ "$fails" = 0 ] && echo "全部通过" || echo "$fails 项失败"
exit $((fails > 0))
