#!/usr/bin/env python3
"""把 WorkBuddy 专家的头像压成 webp，放进 T专家名册里对应的专家包。

## 为什么需要压缩

WorkBuddy 的原图是 **1024×1024 PNG、约 1.5 MB**，而它在面板上只是个 44px 的圆形图标。
300 位专家全用原图 = **约 470 MB** 云端体积，且客户端也根本用不上那个分辨率。
压成 128px WEBP 后每张约 **5 KB**（原图的 0.3%），300 位合计约 1.4 MB。

## 只取主头像、统一命名

`plugin.json` 的 `avatar` 字段指向这一位专家的主头像（团队型是 `avatars/team.png`，
单人型是某个成员图）。这里**只取那一张**，并按 **`avatars/avatar.webp`** 的固定名字落盘 ——
运行时不用解析 plugin.json 就能拼出路径。**原图一概不保留**。

## 用法

    python3 tools/import-avatars.py --dry-run     # 只报计划
    python3 tools/import-avatars.py               # 默认 128px / quality 82
    python3 tools/import-avatars.py --size 256    # 想要更清晰（约 13 KB/张）

前置：`~/web/t-team/workbuddy-experts/experts/<slug>/` 里得有用 `--with-avatars`
拉下来的头像（`workbuddy-expert-fetch` 技能，默认是**不**保存头像的）。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path(os.path.expanduser("~/web/t-team/workbuddy-experts/experts"))
DEFAULT_DST = REPO / "data" / "experts"


def main() -> int:
    ap = argparse.ArgumentParser(description="把 WorkBuddy 头像压成 webp 放进名册")
    ap.add_argument("--src", default=str(DEFAULT_SRC), help="WorkBuddy 导出目录")
    ap.add_argument("--dst", default=str(DEFAULT_DST), help="名册 experts 目录")
    ap.add_argument("--size", type=int, default=128, help="最长边像素（默认 128）")
    ap.add_argument("--quality", type=int, default=82, help="WEBP 质量（默认 82）")
    ap.add_argument("--dry-run", action="store_true", help="只报计划，不写盘")
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print("需要 Pillow（python3 -m pip install Pillow）", file=sys.stderr)
        return 1

    # 名册里「目录形态」的专家 → 它所属分区（只有这些才可能有 WorkBuddy 头像）
    roster: dict[str, str] = {}
    dst_root = Path(args.dst)
    for div in sorted(os.listdir(dst_root)):
        dpath = dst_root / div
        if not dpath.is_dir():
            continue
        for name in sorted(os.listdir(dpath)):
            if (dpath / name / "persona.md").is_file():
                roster[name] = div

    done, no_source, no_avatar, broken = 0, 0, 0, 0
    total = 0
    failures: list[str] = []
    for slug, div in sorted(roster.items()):
        plugin_json = Path(args.src) / slug / ".codebuddy-plugin" / "plugin.json"
        if not plugin_json.is_file():
            no_source += 1
            continue
        try:
            meta = json.loads(plugin_json.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            broken += 1
            continue
        rel = meta.get("avatar")
        if not isinstance(rel, str) or rel == "":
            no_avatar += 1
            continue
        src_img = Path(args.src) / slug / rel
        if not src_img.is_file():
            failures.append(f"{slug}（plugin.json 指的 {rel} 不存在）")
            continue
        out = dst_root / div / slug / "avatars" / "avatar.webp"
        if args.dry_run:
            size = src_img.stat().st_size
            print(f"  {slug:<44} {rel:<26} {size / 1024:8.0f} KB → avatar.webp")
            done += 1
            continue
        try:
            out.parent.mkdir(parents=True, exist_ok=True)
            image = Image.open(src_img).convert("RGBA")
            image.thumbnail((args.size, args.size), Image.LANCZOS)
            image.save(out, "WEBP", quality=args.quality, method=6)
        except Exception as error:  # noqa: BLE001 - 单张失败不该中断整批
            failures.append(f"{slug}（{error}）")
            continue
        total += out.stat().st_size
        done += 1

    verb = "将处理" if args.dry_run else "已处理"
    print(f"\n  {verb} {done} 位")
    print(f"  源目录没有该专家：{no_source} 位")
    print(f"  plugin.json 没有 avatar 字段：{no_avatar} 位")
    print(f"  指的文件不存在/损坏：{len(failures)} 位")
    for line in failures[:8]:
        print(f"      {line}")
    if not args.dry_run and done > 0:
        print(f"  头像合计 {total / 1024 / 1024:.2f} MB（平均 {total / done / 1024:.1f} KB/张）")
    print("\n  头像随包发布（pack-assets.mjs 的 KEEP_LOCAL 里已含 avatars），改完跑 verify + 提交即可")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
