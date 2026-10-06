#!/usr/bin/env python3
"""
给 T专家里「还没有头像」的专家批量生成头像（硅基流动 Kolors，免费）。

用法（在 dsh-expert 仓库根目录跑）：

    export SILICONFLOW_API_KEY=sk-xxxx
    python3 tools/gen-avatars.py --count 10            # 生成 10 个（默认跳过已有头像的）
    python3 tools/gen-avatars.py --count 10 --force    # 覆盖重新生成（重新生成刚才那批）
    python3 tools/gen-avatars.py --count 10 --slow     # 更慢（429 严重时用）

要点：
- 模型 Kwai-Kolors/Kolors（免费），QPS 很紧，默认每次请求间隔 8 秒，`--slow` 用 15 秒。
- 生成的是 1024x1024，会**缩成 128px 方形 WEBP**，对齐既有头像（avatar.webp）。
- 同时写入 `data/experts/<division>/<slug>/avatars/` 与 `~/.t-team/experts/...` 两处。
- **风格随专家职业走**：见 STYLE_RULES，命中关键词就套对应风格，否则用通用专业风。
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.request

try:
    from PIL import Image
except ImportError:
    print("需要 Pillow：pip install Pillow", file=sys.stderr)
    sys.exit(1)

API = "https://api.siliconflow.cn/v1/images/generations"
MODEL = "Kwai-Kolors/Kolors"

# 职业关键词 → 头像风格（按顺序匹配，命中即用；想改风格直接改这里）
STYLE_RULES = [
    (r"设计|design|ui|ux|创意|美术", "modern minimalist design, clean geometric shapes, subtle gradient, elegant, refined"),
    (r"代码|开发|devops|docker|工程|架构|前端|后端|编程", "tech developer, code brackets, terminal, gear, blue-purple gradient, sharp"),
    (r"金融|财务|会计|数据|分析|建模|投研|量化", "finance analytics, rising chart, calculator, gold-green, trustworthy, professional"),
    (r"产品|管理|运营|咨询|战略", "product manager, roadmap, chess piece, user-centric, warm, approachable"),
    (r"知识|文档|wiki|写作|文案|内容|检索|研究", "knowledge, open book, lightbulb, organized, calm blue, scholarly"),
    (r"安全|合规|审计|风控|法务|律师", "shield, lock, gavel, deep navy, authoritative, secure"),
    (r"教育|教学|备考|学习|导师", "mentor, graduation cap, friendly, warm orange, approachable"),
    (r"团队|协作|多角色", "teamwork concept, geometric connected nodes, energetic, warm"),
]


def style_for(name, desc):
    text = f"{name} {desc}"
    for pat, style in STYLE_RULES:
        if re.search(pat, text):
            return style
    return "professional expert, friendly, clean, solid soft background"


def build_prompt(name, desc, style):
    """
    拼生成提示词 —— **必须极简，写成一句短的正向描述**。

    ⚠️ 2026-09-29 实测教训：往 prompt 里塞一串负向词（"no grid, no collage,
    no multiple faces, no contact sheet, no group…"）**完全适得其反** —— Kolors
    会把这些词当成正向内容，画出「一张图里排满几十个小头像」的拼贴画。
    改成一句 `Portrait of one single person…` 打头后，Kolors / Z-Image-Turbo
    都能稳定出单人肖像。**别再往这里加 negative 词。**
    """
    return f"Portrait of one single person, professional headshot, {style}, plain solid background"


def call_api(key, prompt, model=MODEL):
    body = json.dumps({
        "model": model,
        "prompt": prompt,
        "image_size": "1024x1024",
        "batch_size": 1,
    }).encode()
    req = urllib.request.Request(API, data=body, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    })
    resp = json.load(urllib.request.urlopen(req, timeout=120))
    return resp["images"][0]["url"]


def save(div, slug, png_bytes, single=False):
    """
    落盘成 128px 方形 WEBP，源码 + 运行时两处都写。

    `single=True` 表示这是「单文件专家」（`<分区>/<slug>.md`）：它没有包目录，
    头像放**分区级** `<分区>/avatars/<slug>.webp` —— 与 host 的 `avatars()`
    约定一致（2026-09-29 加的第二种形态）。
    """
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    im.thumbnail((128, 128), Image.LANCZOS)
    for base in ("data/experts", os.path.expanduser("~/.t-team/experts")):
        if single:
            outdir, fname = os.path.join(base, div, "avatars"), f"{slug}.webp"
        else:
            outdir, fname = os.path.join(base, div, slug, "avatars"), "avatar.webp"
        os.makedirs(outdir, exist_ok=True)
        im.save(os.path.join(outdir, fname), "WEBP", quality=82, method=6)


def main():
    ap = argparse.ArgumentParser(description="给 T专家批量生成头像（硅基流动 Kolors）")
    ap.add_argument("--count", type=int, default=10, help="生成几位（默认 10）")
    ap.add_argument("--force", action="store_true", help="已有头像也重新生成")
    ap.add_argument("--slow", action="store_true", help="更慢（间隔 15 秒，429 严重时用）")
    ap.add_argument("--model", default=MODEL,
                    help=f"模型（默认 {MODEL}，免费但 QPS 紧；换 Tongyi-MAI/Z-Image-Turbo 更快但要付费）")
    ap.add_argument("--key", default=os.environ.get("SILICONFLOW_API_KEY", ""), help="API Key（或用环境变量）")
    args = ap.parse_args()

    if not args.key:
        print("缺少 API Key：export SILICONFLOW_API_KEY=sk-xxxx 或 --key sk-xxxx")
        sys.exit(1)

    def read_fm(path):
        """从 frontmatter 读 name / description。"""
        name = desc = ""
        try:
            for line in open(path, encoding="utf-8"):
                if line.startswith("name:"):
                    name = line.split(":", 1)[1].strip().strip('"')
                if line.startswith("description:"):
                    desc = line.split(":", 1)[1].strip().strip('"')
                if name and desc:
                    break
        except OSError:
            pass
        return name, desc

    # 收集还没头像的专家，两种形态都要收：
    #   ① 目录形态：<分区>/<slug>/persona.md → 头像在 <分区>/<slug>/avatars/avatar.webp
    #   ② 单文件形态：<分区>/<slug>.md → 头像在 <分区>/avatars/<slug>.webp
    cands = []
    for div in sorted(os.listdir("data/experts")):
        dp = os.path.join("data/experts", div)
        if not os.path.isdir(dp):
            continue
        for entry in sorted(os.listdir(dp)):
            if entry.startswith(".") or entry == "avatars":
                continue
            if os.path.isdir(os.path.join(dp, entry)):
                persona = os.path.join(dp, entry, "persona.md")
                if not os.path.isfile(persona):
                    continue
                if not args.force and os.path.isfile(os.path.join(dp, entry, "avatars", "avatar.webp")):
                    continue
                name, desc = read_fm(persona)
                cands.append((div, entry, name, desc, False))
            elif entry.endswith(".md"):
                slug = entry[:-3]
                if not args.force and os.path.isfile(os.path.join(dp, "avatars", f"{slug}.webp")):
                    continue
                name, desc = read_fm(os.path.join(dp, entry))
                cands.append((div, slug, name, desc, True))
    cands.sort(key=lambda x: (x[0], x[1]))

    picked = cands[: args.count]
    print(f"将生成 {len(picked)} 位（候选共 {len(cands)} 位）\n")

    interval = 15 if args.slow else 8
    max_retry = 3
    ok = fail = 0
    for div, slug, name, desc, single in picked:
        style = style_for(name, desc)
        prompt = build_prompt(name, desc, style)
        done = False
        for attempt in range(max_retry + 1):
            try:
                url = call_api(args.key, prompt, args.model)
                raw = urllib.request.urlopen(url, timeout=120).read()
                save(div, slug, raw, single=single)
                print(f"  ✓ {div}/{slug}{'  (单文件)' if single else ''}  {name}")
                ok += 1
                done = True
                break
            except Exception as e:
                if attempt < max_retry:
                    wait = interval * (attempt + 1) * 2
                    print(f"  ⚠ {name}: {e} → {wait}s 后重试（{attempt + 1}/{max_retry}）")
                    time.sleep(wait)
                else:
                    print(f"  ✗ {div}/{slug}  {name}: {e}（重试 {max_retry} 次仍失败）")
        if not done:
            fail += 1
        time.sleep(interval)

    print(f"\n完成 {ok} / {len(picked)}（失败 {fail}）。")
    if fail:
        print("失败的多为 429 限流，过几分钟重跑同一条命令即可补上（会自动跳过已成功的）。")


if __name__ == "__main__":
    main()
