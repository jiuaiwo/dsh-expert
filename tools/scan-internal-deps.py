#!/usr/bin/env python3
"""扫描专家包，找出**依赖腾讯内部系统**的那些 —— 它们导进 T专家 也没法用。

## 为什么需要它

从 WorkBuddy 专家市场导入的专家里，有一部分**本质上是内部系统的客户端**：脚本把 API
端点指向腾讯内网域名（`*.woa.com`）或内部服务（`pacs.qq.com`、`andon.qq.com`…）。
在腾讯内网之外，这些专家的核心功能不可用 —— 用户照正文操作只会拿到连接失败。

2026-09-29 手工清过一批（22 位），但那是**一次性的**：腾讯上新后同步一遍，同类专家会
原样灌回来。所以判定必须变成**规则**，每次导入前自动跑。

## 判定规则（这里每一条都是踩过坑换来的）

**算**（命中即剔除）：
  - 代码文件里作为 **API base / MCP URL / 鉴权端点 / 真实 https 地址** 出现的腾讯内网域名

**不算**（曾经据此误判过，务必保留这三条排除）：
  - **遥测**：`otlp.j.woa.com`、`gocp.woa.com` 是 OpenTelemetry / GalileoTrace 上报端点，
    多份 SDK 内嵌了它；上报失败**不影响功能**。一度把 7 个正常专家判成了内部依赖。
  - **公开服务**：`qyapi.weixin.qq.com`（企业微信）、`doc.weixin.qq.com`（腾讯文档）、
    `wj.qq.com`（问卷）、`beacon.qq.com`（埋点）、`cloud.tencent.com`（文档链接）。
  - **只出现在 `.md` 里的链接**：安全类专家的正文里有 `10.0.0.4` 这类**示例数据**，
    按纯文本扫描会把 `security/soe` 误判掉。

## 用法

    python3 tools/scan-internal-deps.py                     # 扫 data/experts
    python3 tools/scan-internal-deps.py --src <目录>        # 扫别处（如刚拉下来的 WorkBuddy 导出）
    python3 tools/scan-internal-deps.py --json              # 机器可读，供导入脚本调用
    python3 tools/scan-internal-deps.py --exit-code         # 有命中就退 2（给 CI / 编排用）
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

#: 只看这些扩展名 —— 判定依据是**代码里的真实调用**，不是文档措辞。
CODE_EXT = (
    ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".sh", ".bash", ".zsh",
    ".go", ".java", ".rb", ".php", ".ps1", ".cmd", ".bat",
)

#: 腾讯内网域名。`woa.com` 是腾讯办公网域名，不出现在公网。
INTERNAL_DOMAIN = re.compile(r"\b((?:[a-z0-9][a-z0-9-]*\.)+(?:woa\.com|oa\.com))\b", re.I)

#: 腾讯对外、但属于**内部服务**的域名（需要内网或内部账号）。
#: ⚠️ 前缀必须写 `*` 而不是 `+`：这些锚定串**自带子域**（`omics.qq.com`），若要求「至少一个前缀」，
#: `(?:x\.)+` 会贪婪吃掉 `omics.`，剩 `qq.com` 去匹配锚定串 —— **必然漏检**。
#: 2026-09-29 实测：omics / andon 系列一个都没抓到，而 woa.com 因为前缀与锚定串不重叠才侥幸正常。
INTERNAL_SERVICE = re.compile(
    r"\b((?:[a-z0-9][a-z0-9-]*\.)*(?:pacs|inlong|omics|genomics|andon)\.qq\.com)\b",
    re.I,
)

#: 遥测 / 可观测性 —— 上报失败不影响功能，**不算**。
TELEMETRY = re.compile(r"(?:otlp|gocp|galileo|telemetry|tracing|monitor\.)", re.I)

#: 公开的腾讯服务 —— 用户配自己的凭据就能用，**不算**。
PUBLIC_SERVICE = re.compile(
    r"^(?:"
    r"qyapi\.weixin\.qq\.com|doc\.weixin\.qq\.com|wj\.qq\.com|beacon\.qq\.com|"
    r"cloud\.tencent\.com|console\.cloud\.tencent\.com|cloudcache\.qq\.com|"
    r"map\.qq\.com|lbs\.qq\.com|api\.weixin\.qq\.com|open\.weixin\.qq\.com|"
    r"gaokao\.search\.qq\.com|img\.qq\.com|static\.qq\.com"
    r")$",
    re.I,
)

#: 单行超过这个长度就跳过 —— 是压缩过的打包产物（几万字符一行），里面什么都有，判不准。
MAX_LINE = 3000


def iter_code_files(pack_dir: Path):
    """产出包内所有代码文件。"""
    for base, dirs, files in os.walk(pack_dir):
        dirs[:] = [d for d in dirs if d not in {"node_modules", ".git", "__pycache__"}]
        for f in files:
            if f.endswith(CODE_EXT):
                yield Path(base) / f


def scan_pack(pack_dir: Path) -> dict[str, list[tuple[str, str, int]]]:
    """扫一个包，返回 `{域名: [(文件, 行号, 该行片段), ...]}`（已排除遥测与公开服务）。"""
    found: dict[str, list[tuple[str, str, int]]] = defaultdict(list)
    for fp in iter_code_files(pack_dir):
        try:
            lines = fp.read_text(encoding="utf-8", errors="replace").split("\n")
        except OSError:
            continue
        for lineno, line in enumerate(lines[:5000], 1):
            if len(line) > MAX_LINE:
                continue
            # 注释里的域名是**说明**（如「鉴权方案参考 https://iwiki.woa.com/...」），不是依赖。
            # 这一条替代了早先「必须像在配端点」的写法 —— 那个写法会漏掉直接写进字符串的调用，
            # 实测漏掉 8 个（omics/andon 系列）。注释判定更准，也更少误杀。
            if line.lstrip().startswith(("#", "//", "*", "/*", '"""', "'''")):
                continue
            for rx in (INTERNAL_DOMAIN, INTERNAL_SERVICE):
                for m in rx.finditer(line):
                    dom = m.group(1).lower()
                    if TELEMETRY.search(dom) or PUBLIC_SERVICE.match(dom):
                        continue
                    found[dom].append((fp.name, lineno, line.strip()[:110]))
    return dict(found)


def main() -> int:
    ap = argparse.ArgumentParser(description="扫描依赖腾讯内部系统的专家包")
    ap.add_argument("--src", default=str(REPO / "data" / "experts"), help="要扫的目录")
    ap.add_argument("--json", action="store_true", help="输出 JSON（供导入脚本消费）")
    ap.add_argument("--exit-code", action="store_true", help="有命中则退 2")
    args = ap.parse_args()

    root = Path(os.path.expanduser(args.src))
    if not root.is_dir():
        print(f"目录不存在：{root}", file=sys.stderr)
        return 2

    # 兼容两种布局：`<分区>/<slug>/`（T专家名册）与 `<slug>/`（WorkBuddy 导出）
    #
    # ⚠️ 判序很重要：**先看它自己是不是专家包**。
    # `<dir>/persona.md` 存在就说明这一层已经是专家包本体，绝不能因为它内部还有
    # `agents/`、`skills/` 子目录就把它当成「分区」再往下遍历 —— 那样产出的 key 会是
    # `<slug>/skills`，而调用方按 key 末段取专家名时只会拿到 `skills`，
    # 拦截名单就变成一堆 `skills`、`agents`，**一个专家都拦不住**（2026-09-29 实测：
    # 因此把删过的 24 个内部依赖专家又导回了名册）。
    packs: list[tuple[str, str, Path]] = []
    for d1 in sorted(p for p in root.iterdir() if p.is_dir()):
        # `persona.md` 是**导入时生成**的，上游 WorkBuddy 包里没有；上游的标志是
        # `.codebuddy-plugin/plugin.json`。两个都要认，否则扫上游目录时每一层都被
        # 当成「分区」，key 变成 `<slug>/skills`（2026-09-29）。
        if (d1 / "persona.md").is_file() or (d1 / ".codebuddy-plugin").is_dir():
            packs.append((root.name, d1.name, d1))
            continue
        if (d1 / "agents").is_dir() or (d1 / ".codebuddy-plugin").is_dir():
            for d2 in sorted(p for p in d1.iterdir() if p.is_dir()):
                packs.append((d1.name, d2.name, d2))
        else:
            packs.append((root.name, d1.name, d1))

    hits: dict[str, dict] = {}
    for division, slug, pack_dir in packs:
        found = scan_pack(pack_dir)
        if found:
            key = f"{division}/{slug}" if division != root.name else slug
            hits[key] = {
                "domains": sorted(found),
                "evidence": {d: v[:2] for d, v in list(found.items())[:3]},
            }

    if args.json:
        print(json.dumps({"scanned": len(packs), "hits": hits}, ensure_ascii=False, indent=2))
    else:
        print(f"扫描 {len(packs)} 个专家包（{root}）\n")
        if not hits:
            print("  ✓ 没有发现依赖腾讯内部系统的专家")
        else:
            print(f"  发现 {len(hits)} 个 —— 导入时应剔除：\n")
            for key, info in sorted(hits.items()):
                print(f"  ● {key}")
                for dom in info["domains"][:5]:
                    ev = info["evidence"].get(dom, [])
                    where = f"  {ev[0][0]}:{ev[0][1]}" if ev else ""
                    print(f"      {dom}{where}")
                print()
    return 2 if (hits and args.exit_code) else 0


if __name__ == "__main__":
    raise SystemExit(main())
