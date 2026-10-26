#!/usr/bin/env python3
"""从名册里移除专家（目录形态的专家包）。

名册的真源就是 `data/experts/**` 这套目录本身，`source.json` / `zh/COVERAGE.json`
只是**统计产物**，所以删除要同时照顾四处，漏一处就会留下悬挂引用：

  1. `data/experts/<分区>/<slug>/`        专家包本体
  2. `data/zh/<分区>-<slug>.md`           中文正文侧车
  3. `data/zh/descriptions.json`          中文简介清单（列表，按 slug）
  4. `data/roster.json`                   云端附件清单（这些专家若有附件已上 OBS）

`source.json` 与 `COVERAGE.json` 不在这里手改 —— 跑 `node tools/sync-data.mjs`
与 `node tools/pack-assets.mjs` 会按目录重算。

用法：
    # 先看会删什么（不落盘）
    python3 tools/remove-experts.py --dry-run sales/cpq hr/txzhaopin

    # 真删
    python3 tools/remove-experts.py sales/cpq hr/txzhaopin

    # 从文件读清单（每行一个 `<分区>/<slug>`，`#` 开头跳过）
    python3 tools/remove-experts.py --from tools/remove-list.txt

删完记得：sync-data → pack-assets → verify → 升版本 + CHANGELOG。
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"
EXPERTS = DATA / "experts"
ZH = DATA / "zh"
ROSTER = DATA / "roster.json"
DESCRIPTIONS = ZH / "descriptions.json"


def load_slugs(args: argparse.Namespace) -> list[str]:
    """把命令行参数与 --from 文件合并成一份去重后的 `<分区>/<slug>` 清单。"""
    items: list[str] = list(args.pairs or [])
    if args.from_file:
        for line in Path(args.from_file).read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                items.append(line)
    seen, out = set(), []
    for it in items:
        it = it.strip().strip("/")
        if it and it not in seen:
            seen.add(it)
            out.append(it)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="从名册里移除专家包")
    ap.add_argument("pairs", nargs="*", help="`<分区>/<slug>`，可给多个")
    ap.add_argument("--from", dest="from_file", help="清单文件（每行一个 `<分区>/<slug>`）")
    ap.add_argument("--dry-run", action="store_true", help="只报告，不落盘")
    args = ap.parse_args()

    slugs = load_slugs(args)
    if not slugs:
        print("没有给出要删的专家（用法见文件头）。", file=sys.stderr)
        return 2

    roster = json.loads(ROSTER.read_text(encoding="utf-8")) if ROSTER.is_file() else {"packs": {}}
    packs: dict = roster.get("packs", {})
    descriptions = json.loads(DESCRIPTIONS.read_text(encoding="utf-8")) if DESCRIPTIONS.is_file() else []
    desc_set = set(descriptions) if isinstance(descriptions, list) else set()

    plan: list[tuple[str, list[str]]] = []
    for slug in slugs:
        division, _, name = slug.partition("/")
        if not name:
            print(f"  跳过（格式应为 <分区>/<slug>）：{slug}", file=sys.stderr)
            continue
        actions = []
        pkg = EXPERTS / division / name
        if pkg.is_dir():
            actions.append(f"删包 {pkg.relative_to(REPO)}（{sum(1 for _ in pkg.rglob('*') if _.is_file())} 个文件）")
        else:
            actions.append("（包不存在）")
        zh_file = ZH / division / f"{name}.md"
        if zh_file.is_file():
            actions.append(f"删中文 {zh_file.relative_to(REPO)}")
        if name in desc_set:
            actions.append("从 zh/descriptions.json 摘除")
        if slug in packs:
            actions.append(f"从 roster.json 摘除（{packs[slug].get('bytes', 0)} 字节）")
        plan.append((slug, actions))

    print("=== 待删除清单 ===" if not args.dry_run else "=== 预演（不会落盘）===")
    for slug, actions in plan:
        print(f"  {slug}")
        for a in actions:
            print(f"      {a}")
    print(f"\n共 {len(plan)} 位")

    if args.dry_run:
        return 0

    removed = 0
    for slug, _ in plan:
        division, _, name = slug.partition("/")
        if not name:
            continue
        pkg = EXPERTS / division / name
        if pkg.is_dir():
            shutil.rmtree(pkg)
        zh_file = ZH / division / f"{name}.md"
        if zh_file.is_file():
            zh_file.unlink()
        packs.pop(slug, None)   # key 是「分区/slug」，不是裸 slug
        removed += 1

    if isinstance(descriptions, list):
        keep = [s for s in descriptions if s not in {x.partition("/")[2] for x in slugs}]
        DESCRIPTIONS.write_text(json.dumps(keep, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 清掉空的分区目录（删光了的分区不该留个空壳）
    for d in sorted(EXPERTS.iterdir(), reverse=True):
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()
            print(f"  分区已空，一并移除：{d.relative_to(REPO)}")

    ROSTER.write_text(json.dumps(roster, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n已移除 {removed} 位。")
    print("下一步：node tools/verify.mjs（数字类期望要跟着改）")
    print("⚠️  **不要**跑 node tools/pack-assets.mjs：它按「本地还能打包的包」重算 roster.json，")
    print("    而附件事先已在云端、本地没有可打包内容，会把这份清单清成空的（2026-09-29 踩过）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
