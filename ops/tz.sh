#!/usr/bin/env bash
# T专家 运维台 —— **唯一入口**。所有运维动作都在这个文件里。
#
#   bash ~/web/t-team/tz.sh              # 交互菜单
#   bash ~/web/t-team/tz.sh 1            # 直接执行第 1 项（可脚本化）
#   bash ~/web/t-team/tz.sh --help
#
# 也接受子命令（等价于菜单项，可带自己的参数）：
#   status | experts [add|remove|stats|check] | roster | open | verify | build
#   install [--profile NAME|PATH] [--dry-run] | uninstall [--profile ...]
#     --profile 不写时**自动探测**：profiles/ 下有 web 就用 web，否则回退 desktop。
#     本机只用 dsh web，所以装/卸都不必再手写 --profile web。
#   publish-dry | publish [--current|--patch|--minor|--major|--version X.Y.Z|--retry|--no-push]
#     --current  直接发布 package.json 里的当前版本（不升版）—— 版本号在开发期已经写好
#     推送只发**无父提交的发布快照**到远端 main，tag 也落在那条快照上；本地 main 的完整开发
#     历史（数百条）永不出本机 —— 为什么必须这么做，见「4/6」段前的注释。
#
# 目录约定（脚本住在中间，插件仓库与数据目录都是它的同级子目录）：
#   ~/web/t-team/tz.sh               ← 唯一运维脚本（本文件）
#   ~/web/t-team/*.mjs  *.py         ← 构建链与名册工具（被本脚本调用）
#   ~/web/t-team/add-expert.py       ← 名册工具：新增/删除/统计/校验专家
#   ~/web/t-team/dsh-expert/ ← 插件仓库（data/experts 是**名册真源**）
#   ~/web/t-team/data/                ← 运行时数据（experts/ zh/ …）
#   ~/web/t-team/plugin/              ← 插件运行副本（安装时生成，profile 的 file: 依赖指向它）
#   数据目录与运行副本**必须分家**：运行副本住运维台顶层，data/ 只放运行时数据。
#
# **上游同步已整体移除**（2026-09-12）：名册不再从任何上游拉取或镜像，`data/experts/` 就是真源，
# 增删都走 `add-expert.py`（同时写源码与运行时）。
#   可用 T_TEAM_REPO / T_TEAM_DATA / T_TEAM_STAGE 覆盖以上路径。
set -uo pipefail

# 自定位（本脚本现在随仓库走，见 ops/README 的说明）：
#   · 从**仓库内**（`<repo>/ops/tz.sh`）运行 → 仓库 = 上一级，工作区（数据/运行副本）= 仓库的上一级
#   · 从**旧运维目录**（`<ws>/tz.sh`，或指向本文件的软链）运行 → 仓库 = 同级 dsh-expert/
# 两种布局都支持，所以把它挪进仓库不会打断已有的菜单/肌肉记忆。
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SELF_PARENT="$(cd "$SELF_DIR/.." && pwd -P)"
REPO="${T_TEAM_REPO:-}"
if [ -z "$REPO" ]; then
  # 注意排除"候选就是仓库自己"的情况，否则会把数据目录建进仓库里。
  if [ -f "$SELF_DIR/package.json" ] && [ -d "$SELF_DIR/data/experts" ]; then
    REPO="$SELF_DIR"                       # 仓库内布局：ops/ 的上一级
  elif [ -f "$SELF_PARENT/dsh-expert/package.json" ]; then
    REPO="$SELF_PARENT/dsh-expert" # 旧布局：与仓库同级
  else
    REPO="$SELF_PARENT"
  fi
fi
# 工作区（放 data/ 与运行副本 plugin/）：仓库在旧布局下与数据同级，在新布局下则是数据目录的兄弟。
_ws="$SELF_PARENT"
[ "$REPO" = "$SELF_PARENT" ] && _ws="$(cd "$SELF_PARENT/.." && pwd -P)"
# 数据目录：插件的真实数据根是 `~/.t-team`（`lib/index.js` 的 root/zhRoot/customRoot 默认值就是它），
# 所以**优先用它**；只有它不存在时才回退旧布局 `<工作区>/data`。
# 2026-09-15 修：此前默认只看 `$_ws/data`，于是脚本与插件指向两棵不同的树 ——
# `tz.sh experts check` 会拿旧那棵报"不一致"，`experts add` 也会写错地方。
_legacy_data="$_ws/data"
DATA="${T_TEAM_DATA:-$HOME/.t-team}"
[ -d "$DATA/experts" ] || DATA="$_legacy_data"
# 运行副本刻意**不放**数据目录内部：否则清空/迁移数据目录会连累 profile 的 file: 依赖解析。
STAGE="${T_TEAM_STAGE:-$_ws/plugin}"
OPS_DIR="$_ws"
# DSH 家目录：宿主认 `DSH_HOME`，所以装机目标也必须认 —— 写死 `$HOME/.dsh` 会让
# 「装进去的位置」与「DSH 实际读的位置」在设了该变量的机器上错开（装完像没装）。
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
# 默认目标 profile：**按实际存在的目录自动选**。
# 2026-09-20 起本机只用 `dsh web`（profiles/ 下只剩 web），所以 web 优先；
# desktop 回退仅为兼容旧布局。两者都不在时返回空串，由调用方提示用 --profile 指定。
WEB_PROFILE="$DSH_HOME_DIR/profiles/web"
DESKTOP_PROFILE="$DSH_HOME_DIR/profiles/desktop"
default_profile() {
  if [ -d "$WEB_PROFILE" ]; then printf '%s' "$WEB_PROFILE"
  elif [ -d "$DESKTOP_PROFILE" ]; then printf '%s' "$DESKTOP_PROFILE"
  fi
}
# 默认 profile 的短名（没有可用 profile 时给 web，与报错提示同一口径）。
default_profile_name() {
  local picked
  picked="$(default_profile)"
  if [ -n "$picked" ]; then basename "$picked"; else printf 'web'; fi
}
# 「改完怎么生效」的人话：dsh web 与 DSH Desktop 的启动方式不同，提示必须分开说。
# 装到盘上 ≠ 正在跑的实例立刻生效：HMR 只会重载**已有插件**的配置变化，不会把
# 新增的插件拉进运行中的进程（2026-09-20 实测：装完 lsof 对插件零命中），所以必须重启。
restart_hint() {
  case "$(basename "${1:-}")" in
    web) printf '重启 dsh web（在跑它的终端 Ctrl+C 后重新启动）' ;;
    desktop) printf '重启 DSH Desktop（⌘Q 后重新打开）' ;;
    *) printf '重启承载该 profile 的入口' ;;
  esac
}
PKG_NAME="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['name'])" "$REPO/package.json" 2>/dev/null || echo "dsh-expert")"

if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; OK=$'\033[32m'; WARN=$'\033[33m'; BAD=$'\033[31m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; OK=""; WARN=""; BAD=""; RESET=""
fi
rule()  { printf '%s\n' "────────────────────────────────────────────────────────────"; }
info()  { printf '  %s\n' "$*"; }
step()  { printf '\n%s── %s%s\n' "$BOLD" "$*" "$RESET"; }
die()   { printf '\n%s✗ %s%s\n' "$BAD" "$*" "$RESET" >&2; exit 1; }
warn()  { printf '%s%s%s\n' "$WARN" "$*" "$RESET"; }
need_repo() { [ -d "$REPO" ] || die "找不到插件仓库：${REPO}（用 T_TEAM_REPO 指定）"; }

# ---------------------------------------------------------------- 状态头
status() {
  printf '%sT专家 运维台%s  %s\n' "$BOLD" "$RESET" "$OPS_DIR"
  rule
  local experts divisions zhline roster
  # 名册规模必须与插件**同口径**：catalog.countExperts = 「递归 .md，遇到专家包剪枝计 1」。
  # 早先这里用 `find -name '*.md'` 数，把专家包内的附件（skills/**、references/**）也算成了
  # 专家 —— 623 位的名册被显示成 5633 位。改用插件自己的实现，两处数字再也不会各说各话。
  roster=$(node --input-type=module -e "
import { countExperts } from '$REPO/lib/catalog.js';
const r = await countExperts('$DATA/experts');
console.log(r.experts + ' ' + r.divisions);
" 2>/dev/null)
  experts=${roster%% *}
  divisions=${roster##* }
  [ -n "$experts" ] || { experts="?"; divisions="?"; }
  zhline=$(python3 - "$DATA/zh/COVERAGE.json" <<'PY' 2>/dev/null || echo "n/a"
import json, sys
try:
    c = json.load(open(sys.argv[1], encoding="utf-8"))
    gaps = sum(len(v) for v in (c.get("gaps") or {}).values())
    print(f"{c.get('names')}/{c.get('experts')} 名 · {c.get('descriptions')}/{c.get('experts')} 简介 · {c.get('bodies')}/{c.get('experts')} 正文 · 缺口 {gaps}")
except Exception:
    print("n/a")
PY
)
  local pver pstate iver
  pver=$(python3 -c "import json;print(json.load(open('$REPO/package.json'))['version'])" 2>/dev/null || echo "?")
  if [ -d "$REPO/.git" ]; then
    pstate=$([ -z "$(git -C "$REPO" status --porcelain --untracked-files=no 2>/dev/null)" ] && echo "${OK}干净${RESET}" || echo "${WARN}有未提交${RESET}")
  else
    pstate="（不是 git 仓库）"
  fi
  # 读**默认 profile** 里装的版本（不再写死 desktop —— 本机现在只有 web）。
  # 路径不存在时 python 直接失败，正好落到「未安装」。
  local _default_prof
  _default_prof="$(default_profile)"
  iver=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['version'])" "$_default_prof/node_modules/$PKG_NAME/package.json" 2>/dev/null || echo "未安装")
  printf '  名册    %s 位 / %s 分类  %s（源码 data/experts 是真源）%s\n' "$experts" "$divisions" "$DIM" "$RESET"
  local zh_frozen
  zh_frozen=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['experts'])" "$DATA/zh/COVERAGE.json" 2>/dev/null || echo "?")
  printf '  中文    %s %s（该表已冻结，停在 %s 位时代，不随名册更新）%s\n' "$zhline" "$DIM" "$zh_frozen" "$RESET"
  printf '  插件    v%s（%s） · %s 里装的是 v%s\n' "$pver" "$pstate" "$(default_profile_name)" "$iver"
  rule
}

# ---------------------------------------------------------------- 名册（本机真源）
# 上游同步已整体移除（2026-09-12）：data/experts 不再是镜像产物，而是本仓**真源**。
# 名册的增删都走 add-expert.py —— 它同时写源码（data/experts）与运行时（~/.t-team/experts），
# 所以不存在「源码加了、运行时没加」或反过来的半成品状态。
EXPERT_TOOL="$SELF_DIR/add-expert.py"
need_expert_tool() { [ -f "$EXPERT_TOOL" ] || die "找不到名册工具：$EXPERT_TOOL"; }

do_expert_add()    { need_repo; need_expert_tool; python3 "$EXPERT_TOOL" add    --repo "$REPO" --runtime "$DATA" "$@"; }
do_expert_remove() { need_repo; need_expert_tool; python3 "$EXPERT_TOOL" remove --repo "$REPO" --runtime "$DATA" "$@"; }
do_roster()        { need_repo; need_expert_tool; python3 "$EXPERT_TOOL" stats  --repo "$REPO" --runtime "$DATA" "$@"; }
do_roster_check()  { need_repo; need_expert_tool; python3 "$EXPERT_TOOL" check  --repo "$REPO" --runtime "$DATA" "$@"; }

# 中文覆盖（zh/ 默认不动：不再从上游补译；与源仓库对齐时可按用户决策破例，见 skill 铁律 5）
do_zh_coverage() {
  python3 - "$DATA/zh/COVERAGE.json" <<'PYCOV'
import json, sys
try:
    c = json.load(open(sys.argv[1], encoding="utf-8"))
except Exception as error:
    print(f"读不到 {sys.argv[1]}：{error}")
    raise SystemExit(0)
experts = c.get("experts", 0)
gaps = c.get("gaps") or {}
print(f"  专家 {experts} 位 · 名字 {c.get('names')} · 简介 {c.get('descriptions')} · 正文 {c.get('bodies')}")
print(f"  缺口分类 {len(gaps)} 个 · 合计 {sum(len(v) for v in gaps.values())} 条")
if gaps:
    for division, items in list(gaps.items())[:10]:
        print(f"    {division}: {len(items)} 条")
    print("  （zh/ 默认不动；要补就写 data/zh/<分类>/<slug>.md 并重算 COVERAGE.json）")
PYCOV
}

do_verify() {
  echo "${BOLD}名册一致性（源码 data/experts ↔ 运行时 ~/.t-team/experts ↔ 清单）${RESET}"
  do_roster_check || true
  echo
  printf '%s插件自检%s\n' "$BOLD" "$RESET"
  ( cd "$REPO" && node "$REPO/tools/verify.mjs" | tail -3 )
}

# ---------------------------------------------------------------- 安装 / 卸载（原 install-desktop.sh）
INSTALL_MODE=""; PROFILE_SPEC=""; DRY_RUN=0   # 空 = install；子命令可先把 INSTALL_MODE 设成 remove；DRY_RUN 独立记录「只看不做」

# --profile 收两种写法：profile 名（在 $DSH_HOME/profiles 下解析）或目录路径
resolve_profile() {
  local spec="${1:-}"
  if [ -z "$spec" ]; then
    # 不给 --profile 就用自动探测到的默认 profile（本机是 web）。
    PROFILE="$(default_profile)"
    [ -n "$PROFILE" ] || die "找不到可用 profile（$DSH_HOME_DIR/profiles 下既没有 web 也没有 desktop）；用 --profile NAME 指定"
    return 0
  fi
  case "$spec" in
    */*|.*) PROFILE="$spec" ;;
    *)
      local root="$DSH_HOME_DIR/profiles"
      [ -d "$root/$spec" ] || die "找不到 profile「${spec}」（$root 下没有这个名字的目录；也可以直接传路径）"
      PROFILE="$root/$spec"
      ;;
  esac
}

do_install() {
  need_repo
  resolve_profile "$PROFILE_SPEC"
  local manifest="$PROFILE/package.json"
  [ -d "$PROFILE" ] || die "profile 不存在：$PROFILE"
  [ -f "$manifest" ] || die "找不到 $manifest"
  local backup=""

  echo "插件包名    : $PKG_NAME"
  echo "源码目录    : $REPO"
  echo "运行副本    : $STAGE"
  echo "目标 profile: $PROFILE"
  echo

  [ -n "$INSTALL_MODE" ] || INSTALL_MODE="install"
  if [ "$INSTALL_MODE" = "remove" ]; then
    # 卸载也要尊重 --dry-run：这条分支在下面的 run_dry 逻辑**之前**，
    # 过去 `uninstall --dry-run` 会真的删掉插件（与"只看不做"的承诺不符）。
    if [ "$DRY_RUN" = 1 ]; then
      echo "${DIM}[dry-run] 以下动作不会真正执行（模式：remove）${RESET}"
      info "[dry-run] rm -rf $PROFILE/node_modules/$PKG_NAME"
      info "[dry-run] rm -rf ${STAGE}（运行副本）"
      info "[dry-run] 从 ${manifest} 移除 dependency 与 dsh.profile.bundles 里的 ${PKG_NAME}"
      echo
      echo "dry-run 结束，未做任何改动。"
      return 0
    fi
    rm -rf "$PROFILE/node_modules/$PKG_NAME"
    rm -rf "$STAGE"
    python3 - "$manifest" "$PKG_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
data = json.load(open(path, encoding="utf-8"))
data.get("dependencies", {}).pop(name, None)
bundles = data.get("dsh", {}).get("profile", {}).get("bundles")
if isinstance(bundles, list) and name in bundles:
    bundles.remove(name)
json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(path, "a", encoding="utf-8").write("\n")
PY
    echo "已卸载（$(restart_hint "$PROFILE") 后生效）。"
    return 0
  fi

  local f
  for f in lib/index.js lib/remote.js lib/client.js lib/skill.js skills/t-expert-manager/SKILL.md cordis.patch.yml package.json icon.svg locale/en.json locale/zh.json; do
    [ -f "$REPO/$f" ] || die "缺少 ${f}（先跑 tz.sh build）"
  done
  [ -d "$REPO/data/experts" ] || die "缺少 data/experts（名册快照，先跑 tz.sh 10 里的 sync-data）"

  if [ "$DRY_RUN" = 1 ]; then
    echo "${DIM}[dry-run] 以下动作不会真正执行（模式：${INSTALL_MODE:-install}）${RESET}"
  fi
  local run_dry=0
  [ "$DRY_RUN" = 1 ] && run_dry=1

  # 1) 运行副本：只带运行需要的文件，并去掉 devDependencies
  if [ "$run_dry" = 0 ]; then
    rm -rf "$STAGE"; mkdir -p "$STAGE/lib"
    cp -R "$REPO/lib/." "$STAGE/lib/"
    cp -R "$REPO/data" "$STAGE/data"
    # skills/ 必须**一起**进运行副本：插件会从包内读 SKILL.md 注册运维 skill，
    # 少拷这一层不会报错，只会静默没有 skill —— 这类"安静失效"专门由 verify.mjs 盯着。
    [ -d "$REPO/skills" ] && cp -R "$REPO/skills" "$STAGE/skills"
    # 图标同理：设置页插件列表读的是 package.json.icon 指向的这份文件（宿主转成 data URL），
    # 少拷它不报错，只会静默退回 DSH 的默认插件图标。
    [ -f "$REPO/icon.svg" ] && cp "$REPO/icon.svg" "$STAGE/"
    # 插件列表里的名称/简介由宿主读包内 locale/*.json（多语言表）；少拷这一层不会报错，
    # 只会静默退回 package.json 的英文描述。这类"安静失效"同样交给 verify.mjs 盯着。
    [ -d "$REPO/locale" ] && cp -R "$REPO/locale" "$STAGE/locale"
    cp "$REPO/cordis.patch.yml" "$STAGE/"
    [ -f "$REPO/README.md" ] && cp "$REPO/README.md" "$STAGE/"
    [ -f "$REPO/LICENSE" ] && cp "$REPO/LICENSE" "$STAGE/"
    [ -f "$REPO/THIRD-PARTY-NOTICES" ] && cp "$REPO/THIRD-PARTY-NOTICES" "$STAGE/"
    [ -d "$REPO/vendor/third-party-licenses" ] && { mkdir -p "$STAGE/vendor/third-party-licenses"; cp -R "$REPO/vendor/third-party-licenses/." "$STAGE/vendor/third-party-licenses/"; }
    python3 - "$REPO/package.json" "$STAGE/package.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
for key in ("devDependencies", "scripts", "private"):
    data.pop(key, None)
json.dump(data, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(dst, "a", encoding="utf-8").write("\n")
PY
    info "运行副本已写入 $STAGE"
  else
    info "[dry-run] cp -R $REPO/lib|data|skills|vendor → $STAGE"
  fi

  # 2) profile manifest：备份 + 写入 dependency + bundles
  backup="$manifest.t-team.bak.$(date +%Y%m%d-%H%M%S)"
  if [ "$run_dry" = 0 ]; then
    cp "$manifest" "$backup"
    python3 - "$manifest" "$PKG_NAME" "$STAGE" <<'PY'
import json, sys
path, name, stage = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.load(open(path, encoding="utf-8"))
data.setdefault("dependencies", {})[name] = f"file:{stage}"
profile = data.setdefault("dsh", {}).setdefault("profile", {})
bundles = profile.setdefault("bundles", [])
if name not in bundles:
    bundles.append(name)
json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(path, "a", encoding="utf-8").write("\n")
PY
    info "manifest 更新：dependencies + dsh.profile.bundles（备份 ${backup}）"
  else
    info "[dry-run] 更新 manifest 的 dependencies 与 dsh.profile.bundles，并备份到 $backup"
  fi

  # 3) profile node_modules：真目录拷贝（不能符号链接：ESM 按 realpath 解析会够不到宿主依赖闭包）
  if [ "$run_dry" = 0 ]; then
    rm -rf "$PROFILE/node_modules/$PKG_NAME"
    mkdir -p "$PROFILE/node_modules"
    cp -R "$STAGE" "$PROFILE/node_modules/$PKG_NAME"
  else
    info "[dry-run] cp -R $STAGE → $PROFILE/node_modules/$PKG_NAME"
  fi

  echo
  if [ "$run_dry" = 1 ]; then
    echo "dry-run 结束，未做任何改动。"
  else
    echo "安装完成。"
    echo "下一步：$(restart_hint "$PROFILE")。"
    echo "        正在运行的实例**不会**自动加载它 —— 只刷新页面也没用（HMR 只重载已有插件的配置变化）。"
    echo "        起来后到 插件列表 → T专家 看名册与管理面板；卡片副标题的 · v<版本> 可确认页面跑的是哪一版。"
  fi
}

do_build() {
  need_repo
  ( cd "$REPO" && node "$REPO/tools/build-client.mjs" )
}

do_sync_data() {
  need_repo
  node "$REPO/tools/sync-data.mjs" "$@"
}

# ---------------------------------------------------------------- 发布到 npm（原 publish-npm.sh）
PUBLISH_BUMP=""; PUBLISH_DRY=0; PUBLISH_RETRY=0; PUBLISH_PUSH=""; PUBLISH_KEEP=0
do_publish() {
  need_repo
  cd "$REPO" || die "进不去 $REPO"
  local dry_run=$PUBLISH_DRY retry=$PUBLISH_RETRY no_prompt=0 bump="$PUBLISH_BUMP" push="$PUBLISH_PUSH" keep_version=$PUBLISH_KEEP
  [ -n "$bump" ] && no_prompt=1

  step "0/6 环境与仓库前置"
  command -v npm >/dev/null 2>&1 || die "PATH 里没有 npm"
  local pkg local_version who branch dirty untracked
  pkg="$(python3 -c "import json;print(json.load(open('package.json'))['name'])")"
  local_version="$(python3 -c "import json;print(json.load(open('package.json'))['version'])")"
  info "包名   : $pkg"
  info "本地版本: $local_version"
  # 未登录时**就地提示并登录**，而不是直接 die 让人回去重跑整条菜单。
  #
  # 为什么区分两种原因：`npm whoami` 只要失败就返回空，但失败有两种——
  #   ① 根本没有凭据（ENEEDAUTH）→ 跑 npm login 就好；
  #   ② `~/.npmrc` 里有 token 但被**服务端拒绝**（401）→ 典型是 token 过期/被吊销，
  #      这时重跑 login 才有效，光看"未登录"三个字会让人以为配置丢了。
  # 所以这里把 npm 自己的错误也打出来，并给出对应的处置。
  who="$(npm whoami 2>/dev/null || true)"
  if [ -z "$who" ]; then
    local auth_err
    auth_err="$(npm whoami 2>&1 | grep -m1 -E 'code E[0-9]+|401|Unauthorized|ENEEDAUTH' || true)"
    printf '\n%s✗ npm 未登录%s' "$BAD" "$RESET"
    [ -n "$auth_err" ] && printf '（%s）' "$auth_err"
    printf '\n'
    if printf '%s' "$auth_err" | grep -q '401'; then
      info "${WARN}你的 ~/.npmrc 里有 token，但被 npm 服务端拒绝（401）——通常是 token 过期或被吊销。${RESET}"
      info "${DIM}重跑一次 npm login 换新凭据即可；长期建议用网页生成的 Automation token。${RESET}"
    fi
    info "发布必须过 2FA；下面会调用 npm login，登录后自动继续。"
    local logged_in=0 attempts=0
    while [ "$attempts" -lt 2 ]; do
      attempts=$((attempts + 1))
      if [ -t 0 ]; then
        printf '  现在登录吗？[Y/n]: '
        local answer; read -r answer || answer="n"
        case "$answer" in
          n|N|no|NO) break ;;
        esac
      else
        # 非交互（管道/CI）：不能替人输密码，如实说明并退出，不要卡住。
        die "非交互环境无法登录，请先手动跑 npm login 再重试。"
      fi
      npm login || info "${WARN}npm login 未成功${RESET}"
      who="$(npm whoami 2>/dev/null || true)"
      if [ -n "$who" ]; then logged_in=1; break; fi
      info "${WARN}仍然未登录${RESET}"
    done
    [ "$logged_in" = 1 ] || die "未登录，已中止发布（登录后重跑本菜单即可）。"
  fi
  info "npm 账号: $who"
  git rev-parse --git-dir >/dev/null 2>&1 || die "不是 git 仓库，无法用 npm version 打 tag"
  branch="$(git rev-parse --abbrev-ref HEAD)"
  dirty="$(git status --porcelain --untracked-files=no)"
  if [ -n "$dirty" ]; then
    printf '%s\n' "$dirty" | sed 's/^/    /' >&2
    die "有已跟踪文件未提交 —— npm version 会拒绝。先提交或 stash。"
  fi
  info "分支    : ${branch}（已跟踪文件全部已提交 ✓）"
  untracked="$(git ls-files --others --exclude-standard)"
  if [ -n "$untracked" ]; then
    printf '%s\n' "$untracked" | sed 's/^/    /' | head -10
    info "${WARN}↑ 未跟踪文件${RESET}：不会进提交。"
    # 未跟踪文件**会**进 npm 包（只要落在 files 白名单里）——从 tag 重建就会缺文件、
    # 得到一个静态 import 失败的坏包。所以白名单内的未跟踪文件必须硬失败，不能只告警。
    local packable
    packable="$(printf '%s\n' "$untracked" | node -e '
      const { readFileSync } = require("node:fs");
      const path = require("node:path");
      const files = (JSON.parse(readFileSync("package.json", "utf8")).files ?? [])
        .filter((f) => typeof f === "string");
      const input = readFileSync(0, "utf8").split("\n").filter(Boolean);
      const hit = input.filter((f) => files.some((w) =>
        f === w || f.startsWith(w.endsWith("/") ? w : w + "/")));
      process.stdout.write(hit.join("\n"));
    ' 2>/dev/null || true)"
    if [ -n "$packable" ]; then
      printf '%s\n' "$packable" | sed 's/^/    /' >&2
      die "以上未跟踪文件落在 package.json files 白名单内 —— npm pack 会把它们打进包，而 git tag 里没有它们：从 tag 重建即得到坏包。先 git add + commit 再发布。"
    fi
    if [ "$dry_run" = 0 ] && [ "$no_prompt" = 0 ]; then
      printf '  确认继续？[y/N]: '; local a; read -r a || a=""
      case "$a" in y|Y|yes|YES) ;; *) info "已取消"; return 0 ;; esac
    fi
  fi

  step "1/6 选择版本"
  bump_version() {
    python3 - "$1" "$2" <<'PY'
import sys
cur, kind = sys.argv[1], sys.argv[2]
parts = (cur.split(".") + ["0", "0"])[:3]
try:
    major, minor, patch = (int(p) for p in parts)
except ValueError:
    sys.exit(1)
if kind == "major":   major, minor, patch = major + 1, 0, 0
elif kind == "minor": minor, patch = minor + 1, 0
else:                 patch += 1
print(f"{major}.{minor}.{patch}")
PY
  }
  local target="" skip_bump=0
  if [ "$retry" = 1 ] || [ "$keep_version" = 1 ]; then
    target="$local_version"; skip_bump=1
    if [ "$retry" = 1 ]; then
      info "重试模式：沿用当前版本 ${target}，不升版"
    else
      info "沿用 package.json 里的当前版本 ${target}（不升版）"
    fi
  elif [ -n "$bump" ]; then
    case "$bump" in
      patch|minor|major) target="$(bump_version "$local_version" "$bump" || true)" ;;
      *) target="$bump" ;;
    esac
    [ -n "$target" ] || die "算不出目标版本（当前 ${local_version}，参数 ${bump}）"
  else
    local p m j can_retry=0 choice
    p="$(bump_version "$local_version" patch)"; m="$(bump_version "$local_version" minor)"; j="$(bump_version "$local_version" major)"
    if git rev-parse -q --verify "refs/tags/v$local_version" >/dev/null \
       && [ -z "$(npm view "$pkg@$local_version" version 2>/dev/null || true)" ]; then
      can_retry=1
    fi
    # 版本号在开发期就写进了 package.json（客户端构建版本也跟它一致），所以把它作为**默认选项**：
    # 按 1 即发布当前版本、不升版。想升版再按 2/3/4/5 —— 注意**回车仍是取消**，
    # 发布不可逆，不给"回车即发"的默认。
    printf '%s\n' "  当前版本：$local_version  ${DIM}（读自 package.json）${RESET}"
    [ "$can_retry" = 1 ] && printf '%s\n' "  ${WARN}注意：v$local_version 已提交并打过 tag，但 registry 上还没有 —— 多半是上次发布没成功。${RESET}"
    printf '%s\n' \
      "  1) 直接发布当前版本 ${local_version}（不升版）" \
      "  2) patch → $p" \
      "  3) minor → $m" \
      "  4) major → $j" \
      "  5) 手动输入版本"
    printf '%s\n' "  0) 取消"
    printf '选一个 [1-5,0]（1 = 发布当前版本 %s）: ' "$local_version"
    read -r choice || choice=""
    case "$choice" in
      1) keep_version=1; skip_bump=1; target="$local_version" ;;
      2) target="$p" ;;
      3) target="$m" ;;
      4) target="$j" ;;
      5) printf '输入版本（如 1.2.3）: '; read -r target || target="" ;;
      0|"") info "已取消"; return 0 ;;
      *) die "无效选择：$choice" ;;
    esac
  fi
  # 兜底（踩过）：无论从哪条路径定出目标版本，**只要它等于当前版本就走不升版** ——
  # 否则会去执行 npm version <同版本>，npm 直接 "Version not changed" 失败。
  if [ -n "$target" ] && [ "$target" = "$local_version" ]; then skip_bump=1; fi
  printf '%s' "$target" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || die "版本号格式不对：${target}（要 x.y.z）"

  step "2/6 预检（全部通过才会升版）"
  if [ "$skip_bump" = 0 ]; then
    git rev-parse -q --verify "refs/tags/v$target" >/dev/null && die "tag v$target 已存在。换一个版本号，或用 --retry。"
    info "tag v$target 未被占用 ✓"
  elif [ "$retry" = 1 ]; then
    info "重试模式：跳过 tag 检查"
  else
    info "不升版：跳过 tag 检查（沿用 package.json 里的当前版本）"
  fi
  local published
  published="$(npm view "$pkg@$target" version 2>/dev/null || true)"
  [ -n "$published" ] && die "$pkg@$target 已经发布过了。换版本号。"
  info "$pkg@$target 在 registry 上尚不存在 ✓"

  printf '  npm run build ... '
  local build_log
  build_log="$(npm run build 2>&1)" || { printf '\n%s\n' "$build_log" | tail -20; die "构建失败，未升版、未发布。"; }
  printf '%s\n' "$(printf '%s' "$build_log" | tail -1)"
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    printf '%s\n' "$(git status --porcelain --untracked-files=no)" | sed 's/^/    /' >&2
    die "构建改动了已提交文件 —— 源码与已提交产物不同步。先提交再发布。"
  fi
  info "构建后工作树仍干净 ✓（产物不落后于源码）"
  printf '  npm run verify ... '
  local verify_log
  verify_log="$(npm run verify 2>&1)" || { printf '\n%s\n' "$verify_log" | tail -25; die "自检未通过，未升版、未发布。"; }
  printf '%s\n' "$(printf '%s' "$verify_log" | tail -1)"
  printf '  sync-data.mjs --check ... '
  local snap_log
  snap_log="$(node "$REPO/tools/sync-data.mjs" --check 2>&1)" || { printf '\n%s\n' "$snap_log"; die "包内快照与数据目录不一致，先跑 tz.sh 里的数据快照同步。"; }
  printf '%s\n' "$(printf '%s' "$snap_log" | tail -1)"
  printf '  打包预览 ... '
  local pack_json
  pack_json="$(npm pack --dry-run --json 2>/dev/null)"
  printf '\n'
  python3 - "$pack_json" "$target" <<'PY'
import json, sys
try:
    data = json.loads(sys.argv[1])[0]
except Exception:
    print("    （打包预览解析失败，不影响发布）"); raise SystemExit(0)
mb = 1024 * 1024
version = data["version"] if data["version"] == sys.argv[2] else f"{data['version']} → 升版后 {sys.argv[2]}"
print(f"    {data['entryCount']} 文件 · 解包 {data['unpackedSize']/mb:.2f} MB / 打包 {data['size']/mb:.2f} MB · 版本 {version}")
PY

  if [ "$dry_run" = 1 ]; then
    printf '\n%s预检全部通过（dry-run，未升版、未发布）。%s\n' "$OK" "$RESET"
    return 0
  fi

  if [ "$skip_bump" = 0 ]; then
    step "3/6 升版：$local_version → $target"
    local spec
    case "$target" in
      "$(bump_version "$local_version" patch)") spec="patch" ;;
      "$(bump_version "$local_version" minor)") spec="minor" ;;
      "$(bump_version "$local_version" major)") spec="major" ;;
      *) spec="$target" ;;
    esac
    npm version "$spec" -m "chore: 发布 v%s" >/dev/null \
      || die "npm version 失败（${spec}）：版本号没变或 tag 冲突。已中止 —— 未推送、未发布。"
    info "已提交并打 tag：$(git describe --tags --exact-match 2>/dev/null || echo '(未取到 tag)')"
    info "$(git log -1 --format='%h %s  （%an）')"
    # 客户端构建版本号必须跟上升版（2026-09-26 踩过）：`package.json` 由 npm version 升，
    # 而 `src/client/state.js` 里的 CLIENT_BUILD_VERSION 是**另一处**来源。预检阶段两者还是
    # 同一份旧值、看不出问题，等这里升完、再跑 prepublishOnly 的 build + verify 时才炸 ——
    # 而那时 tag 已经打好、甚至已被「4/6 推送」推上去，于是留下「远端有 tag、registry 上没有包」
    # 的分裂（v0.3.91 就是这么卡住的）。补救必须发生在**推送之前**：同步源码常量 → 重建产物 →
    # 把这次同步并进刚才那次版本提交（amend，此时 tag 还没推出去）→ 把 tag 重指到 amend 后的提交。
    local sync_log
    sync_log="$(node "$REPO/tools/build-client.mjs" 2>&1)" \
      || { printf '\n%s\n' "$sync_log" | tail -20; die "升版后重建客户端产物失败。已中止 —— 未推送、未发布。"; }
    printf '%s\n' "$sync_log" | grep -F '构建版本' | sed 's/^/    /' || true
    if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
      git add src/client/state.js lib/client.js \
        || die "暂存版本同步改动失败。已中止 —— 未推送、未发布。"
      git commit --amend --no-edit >/dev/null \
        || die "把版本同步并进发布提交失败。已中止 —— 未推送、未发布。"
      # tag 是 npm version 打的，amend 之后必须重指：否则 tag 停在旧提交上，
      # 「tag 对应的提交」与「实际发布出去的包」就差一次同步。
      git tag -fa "v$target" -m "v$target" >/dev/null \
        || die "重打 tag v$target 失败。已中止 —— 未推送、未发布。"
      info "已同步客户端构建版本并重打 tag：v$target → $(git rev-parse --short HEAD)"
      local leftover
      leftover="$(git status --porcelain --untracked-files=no)"
      [ -z "$leftover" ] || warn "发布提交之外还有未提交改动：$(printf '%s' "$leftover" | tr '\n' ' ')"
    else
      info "客户端构建版本已与 $target 一致（无需同步）"
    fi
  elif [ "$retry" = 1 ]; then
    step "3/6 跳过升版（重试模式）"
  else
    step "3/6 不升版：直接发布 package.json 里的 $target"
    # 发出去的版本必须有 tag 对应：可追溯「0.3.6 是哪个提交」，失败后也才能用 --retry（
    # 它的判定就是「tag 在、registry 上没有」）。这里只补 tag，不新增提交、不动版本号。
    #
    # 必须用 **annotated tag（-a）**：发布 tag 要与 GitHub 上的 Release、npm 上的号一一对应。
    # 历史上还踩过一次更直接的：2026-09-15 靠 `git push --follow-tags` 推送时，轻量 tag 会被
    # **静默忽略** —— 提交推上去了、tag 全留在本地（v0.3.6 / v0.3.24 / v0.3.25 远端一个都没有），
    # npm 上却有包。（现在改成推快照 + 显式推 tag，不再依赖 --follow-tags，但 annotated 不变。）
    if [ -z "$(git tag -l "v$target")" ]; then
      git tag -a "v$target" -m "v$target" && info "已补 tag（annotated）：v$target → $(git rev-parse --short HEAD)"
    else
      info "tag v$target 已存在，沿用（指向 $(git rev-list -n1 "v$target" 2>/dev/null | cut -c1-7)）"
    fi
  fi

  # ---- 发布快照：远端只收这一条，本地开发历史不出本机 ----
  # 为什么必须造快照（2026-10-06 实测踩过）：远端 main 只有一条 `--orphan` 起点的无父提交，
  # 而 **tag 是带父链的** —— 只要 tag 落在本地 main 的提交上，`git push --follow-tags` 就会把
  # 整条开发历史（当时 288 条）连同对象一起送上 GitHub。更阴的是：分支推送会被
  # non-fast-forward 拒绝，脚本于是打印「推送失败」，看起来像什么都没推上去，可实测命令退出码
  # 为 1 的同时，tag 已经推成功了 —— 从远端 clone 下来顺着那个 tag 就能看到全部开发提交。
  # 所以两件事一起做：tag 落到快照上，推的也只能是快照。
  local snap
  snap="$(git commit-tree "$(git rev-parse 'HEAD^{tree}')" \
    -m "$pkg $target" -m "发布快照：文件树与本地提交 $(git rev-parse --short HEAD) 一致；开发历史只在本机。")" \
    || die "生成发布快照失败（git commit-tree）。已中止 —— 未推送、未发布。"
  git update-ref refs/heads/github "$snap" \
    || die "更新本地 github 分支失败。已中止 —— 未推送、未发布。"
  git tag -fa "v$target" -m "v$target" "$snap" >/dev/null \
    || die "把 tag v$target 落到发布快照上失败。已中止 —— 未推送、未发布。"
  info "发布快照已就绪：$(git rev-parse --short "$snap")（无父提交，tag v$target 已指向它）"

  step "4/6 推送到 GitHub（只推发布快照；--no-push 可跳过）"
  if [ "$push" = "no" ]; then
    info "按 --no-push 跳过推送。要补推时跑这两条（顺序无所谓）："
    info "    git push -f origin refs/heads/github:refs/heads/main"
    info "    git push origin refs/tags/v$target"
  else
    # 2026-09-15 用户定：发布 npm 时**同时**把快照与 tag 推上去，默认不再询问（过去这里问一句
    # 「要推吗 [y/N]」、回车即跳过，于是留下过「npm 上有包、远端连 tag 都没有」的分裂）。
    # 推送失败不影响已完成的 npm 发布，只出声。
    if git push -f origin refs/heads/github:refs/heads/main; then
      info "已推送发布快照 → origin/main（远端仍是 1 条，不含开发历史）"
    else
      warn "快照推送失败（npm 发布不受影响）：请手动 git push -f origin refs/heads/github:refs/heads/main"
    fi
    if git push origin "refs/tags/v$target"; then
      info "已推送 tag：v$target → 快照 $(git rev-parse --short "$snap")"
    else
      warn "tag 推送失败（npm 发布不受影响）：请手动 git push origin refs/tags/v$target"
    fi
  fi

  step "5/6 发布到 npm"
  info "即将发布 $pkg@$target"
  info "${DIM}npm 会在发布前重跑 build + verify + sync-data --check；任何一项不过就中止发布。${RESET}"
  printf '  2FA 六位码（直接回车 = 交给 npm 自己提示输入）: '
  local otp; read -rs otp || otp=""
  printf '\n'
  local code=0
  if [ -n "$otp" ]; then npm publish --otp="$otp" || code=$?; else npm publish || code=$?; fi
  otp=""
  if [ "$code" != "0" ]; then
    printf '\n%s✗ 发布失败（exit %s）%s\n' "$BAD" "$code" "$RESET"
    if [ "$skip_bump" = 0 ]; then
      printf '%s\n' \
        "  版本提交与 tag 已经在了（v${target}），但**没有**发布出去 —— registry 上的版本号不会被占用。" \
        "" \
        "  怎么办：" \
        "    · OTP 输错/过期 → 重跑：bash $SELF_DIR/tz.sh publish --retry" \
        "    · 不想发这个版本 → 回滚：git tag -d v$target && git reset --hard HEAD~1" \
        "      （若已推送过，还要 git push --delete origin v${target}）"
    fi
    return "$code"
  fi

  step "6/6 确认发布结果"
  info "查询 registry（packument 有缓存，刚发完可能还显示旧版本）..."
  local found="" attempt
  for attempt in 1 2 3 4 5; do
    found="$(npm view "$pkg@$target" version 2>/dev/null || true)"
    [ -n "$found" ] && break
    sleep 3
  done
  if [ -n "$found" ]; then
    printf '\n%s✓ 已发布：%s@%s%s\n' "$OK" "$pkg" "$found" "$RESET"
  else
    printf '\n%s⚠ 发布命令成功，但 registry 查询还没看到 %s@%s%s\n' "$WARN" "$pkg" "$target" "$RESET"
    printf '  再等一会儿用这条确认：\n    curl -sI https://registry.npmjs.org/%s/-/%s-%s.tgz | head -1\n' "$pkg" "$pkg" "$target"
  fi
  printf '\n  陌生人现在可以装：\n    dsh plugin --profile web add %s@%s\n' "$pkg" "$target"
}

# ---------------------------------------------------------------- 菜单动作分发
action() {
  case "$1" in
    1)  echo "${BOLD}[1] 名册统计（分类 / 专家数 / 中文覆盖）${RESET}";                  do_roster ;;
    2)  echo "${BOLD}[2] 安装/重装插件到 profile（默认 $(default_profile_name)）${RESET}"
        [ -n "$INSTALL_MODE" ] || INSTALL_MODE="install"
        do_install; INSTALL_MODE="" ;;
    3)  echo "${BOLD}[3] 卸载插件（保留 experts/ 与 zh/ 数据）${RESET}"
        INSTALL_MODE="remove"; do_install; INSTALL_MODE="" ;;
    4)  echo "${BOLD}[4] 构建插件产物（client bundle）${RESET}";          do_build ;;
    5)  echo "${BOLD}[5] 校验：名册一致性 + 插件自检${RESET}";            do_verify ;;
    6)  echo "${BOLD}[6] 发布预演（dry-run：只跑预检与打包预览）${RESET}"
        local saved_dry=$PUBLISH_DRY
        PUBLISH_DRY=1; PUBLISH_BUMP="${2:-patch}"; PUBLISH_KEEP=0; do_publish
        PUBLISH_DRY=$saved_dry; PUBLISH_BUMP="" ;;
    7)  echo "${BOLD}[7] 一键发布到 npm${RESET}"
        PUBLISH_DRY=0; PUBLISH_BUMP=""; PUBLISH_KEEP=0
        do_publish ;;
    *)  warn "无效选项：$1"; return 2 ;;
  esac
}

# ---------------------------------------------------------------- 入口
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  sed -n '2,20p' "$0"
  exit 0
fi

# 子命令 → 参数
if [ $# -gt 0 ] && [[ "${1}" =~ ^[a-z] ]]; then
  cmd="$1"; shift
  case "$cmd" in
    status) status; exit 0 ;;
    experts)
      # 名册增删：参数透传给 add-expert.py（无参数 = 交互式）
      case "${1:-}" in
        add)    shift; do_expert_add "$@" ;;
        remove) shift; do_expert_remove "$@" ;;
        stats)  shift; do_roster "$@" ;;
        check)  shift; do_roster_check "$@" ;;
        "")     do_expert_add ;;
        *)      die "未知的 experts 子命令：$1（用 add | remove | stats | check）" ;;
      esac
      exit $? ;;
    roster) do_roster; exit $? ;;
    open|verify|build|sync-data)
      case "$cmd" in
        open) open "$REPO/data/experts" ;;
        verify) action 5 ;;
        build) action 4 ;;
        sync-data) do_sync_data ;;
      esac
      exit $? ;;
    install|uninstall)
      case "$cmd" in
        install) INSTALL_MODE="install" ;;
        uninstall) INSTALL_MODE="remove" ;;
      esac
      while [ $# -gt 0 ]; do case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        --profile) PROFILE_SPEC="$2"; shift 2 ;;
        *) die "未知参数：$1" ;; esac; done
      action 2; exit $? ;;
    publish-dry|publish)
      [ "$cmd" = "publish-dry" ] && PUBLISH_DRY=1
      while [ $# -gt 0 ]; do case "$1" in
        --patch) PUBLISH_BUMP="patch"; shift ;;
        --minor) PUBLISH_BUMP="minor"; shift ;;
        --major) PUBLISH_BUMP="major"; shift ;;
        --version) PUBLISH_BUMP="$2"; shift 2 ;;
        --current) PUBLISH_KEEP=1; shift ;;
        --dry-run) PUBLISH_DRY=1; shift ;;
        --retry) PUBLISH_RETRY=1; shift ;;
        --push) PUBLISH_PUSH="yes"; shift ;;
        --no-push) PUBLISH_PUSH="no"; shift ;;
        *) die "未知参数：$1" ;; esac; done
      do_publish; exit $? ;;
    *) die "未知子命令：${cmd}（试试 --help）" ;;
  esac
fi

# 非交互：直接执行给定菜单编号
if [ $# -gt 0 ]; then
  status
  # 只把菜单号之后的参数透传（否则 "tz.sh 14" 会把 14 当成版本号传进去）
  action "$1" "${@:2}"
  exit $?
fi

# 交互菜单
while true; do
  clear 2>/dev/null || true
  status
  # 这个 heredoc **不带引号**：下面第 2 行要展开 $(default_profile_name)。
  # 因此正文里若要写字面量 $ 或反引号，必须转义（目前正文没有这类字符）。
  cat <<MENU
  1) 名册统计（分类 / 专家数 / 中文覆盖）
  2) 安装 / 重装插件到 profile（默认 $(default_profile_name)）
  3) 卸载插件（保留数据）
  4) 构建插件产物（client bundle）
  5) 校验：名册一致性 + 插件自检
  6) 发布预演（dry-run，不动仓库、不发布）
  7) 一键发布到 npm（升版 → 预检 → 提交/发布快照+tag → 2FA → 发布）
  0) 退出
MENU
  printf '选一个 [0-7]: '
  read -r choice || break
  case "$choice" in
    0|"") break ;;
    *) action "$choice" || true; printf '\n按回车继续…'; read -r _ || true ;;
  esac
done
