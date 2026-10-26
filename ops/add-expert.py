#!/usr/bin/env python3
"""名册工具：新增 / 删除 / 统计 / 校验专家。

背景（2026-09-12 起）：**上游同步已整体移除**。`data/experts/` 不再是镜像产物，而是本仓真源；
插件的名册从此只由本工具维护。同一份逻辑必须同时落在两个地方：

    <repo>/data/experts/<分类>/<slug>.md     ← 源码（随 npm 包发布，别人装上就有）
    <runtime>/experts/<分类>/<slug>.md       ← 运行时（插件真正读的那棵树）

只写其中一边都会出问题：只写源码 → 插件重启也看不到（运行期读运行时那棵）；
只写运行时 → 别人装了你的插件没有这位专家。

用法（tz.sh experts add/remove/stats/check 就是在调它；菜单里已不单列）：

    add-expert.py add    --repo DIR --runtime DIR [--category KEY] [--file PATH] [--slug SLUG]
                         [--label 显示名] [--name 名称] [--description 简介] [--emoji 🧩]
                         [--force] [--dry-run]
    add-expert.py remove --repo DIR --runtime DIR [--category KEY] [--slug SLUG] [--yes] [--dry-run]
    add-expert.py stats  --repo DIR --runtime DIR
    add-expert.py check  --repo DIR --runtime DIR [--fix]

不带参数就是交互式：先选分类（或新建分类），再给专家 .md 的路径，最后确认落盘。
分类名与插件扫描口径保持一致：`^[a-z0-9][a-z0-9.-]{0,127}$` 且不含 `..`。
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import unicodedata
from datetime import datetime, timezone, timedelta

DIVISION_RE = re.compile(r"^[a-z0-9][a-z0-9.-]{0,127}$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,127}$")
CST = timezone(timedelta(hours=8))

BOLD, DIM, OK, WARN, BAD, RESET = "", "", "", "", "", ""
if sys.stdout.isatty():
    BOLD, DIM, OK, WARN, BAD, RESET = "\033[1m", "\033[2m", "\033[32m", "\033[33m", "\033[31m", "\033[0m"


def say(msg=""):
    print(msg)


def head(title):
    print(f"\n{BOLD}── {title}{RESET}")


def die(msg):
    print(f"\n{BAD}✗ {msg}{RESET}", file=sys.stderr)
    sys.exit(1)


def warn(msg):
    print(f"{WARN}{msg}{RESET}")


# ---------------------------------------------------------------- 路径与校验

def experts_root(repo):
    return os.path.join(repo, "data", "experts")


def zh_root(repo):
    return os.path.join(repo, "data", "zh")


def runtime_experts(runtime):
    """运行时名册树：`<runtime>/experts`（runtime 一般就是 ~/.t-team，即 ~/web/t-team/data）。"""
    return os.path.join(runtime, "experts")


def md_files(root):
    """root 下**递归**所有 .md：{相对路径: 绝对路径}。

    必须递归：名册里有嵌套子目录（如 `game-development/unreal-engine/…`），
    插件的扫描是递归的（walkMarkdown），只数顶层会得出 300 而不是实际的 316。
    跳过以 . 开头的目录，与插件 walkMarkdown 的口径一致。
    """
    out = {}
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in files:
            if name.endswith(".md"):
                path = os.path.join(base, name)
                out[os.path.relpath(path, root)] = path
    return out


def divisions_of(root):
    """root 下"含专家（含嵌套）"的直接子目录 —— 与插件 discoverDivisions 同口径。"""
    try:
        names = sorted(os.listdir(root))
    except OSError:
        return []
    found = []
    for name in names:
        path = os.path.join(root, name)
        if not os.path.isdir(path) or name.startswith("."):
            continue
        if md_files(path):
            found.append(name)
    return found


def declare_divisions(root):
    """root 下**所有**合法子目录（含暂时空的分类），用于统计与下拉。"""
    try:
        names = sorted(os.listdir(root))
    except OSError:
        return []
    return [name for name in names
            if os.path.isdir(os.path.join(root, name)) and not name.startswith(".") and valid_division(name)]


def division_label(labels, key):
    """取分类显示名。`zh/divisions.json` 的值允许两种形态：纯字符串，或 `{en, zh}` 对象。

    插件的 `divisionOf()` 吃这两种形态（lib/catalog.js:64-68），所以本工具也必须都认：
    只当字符串处理时，`f"{dict:<14}"` 会抛 TypeError —— 真实数据现在是 `{en, zh}` 形态，
    `stats` 与选分类菜单会直接崩，而临时夹具里的字符串形态却看不出问题。
    """
    value = labels.get(key) if isinstance(labels, dict) else None
    if isinstance(value, str) and value != "":
        return value
    if isinstance(value, dict):
        label = value.get("zh") or value.get("en")
        if isinstance(label, str) and label != "":
            return label
    return key


def valid_division(key):
    return bool(DIVISION_RE.match(key or "")) and ".." not in key


def valid_slug(slug):
    return bool(SLUG_RE.match(slug or ""))


def read_json(path):
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    temp = f"{path}.tmp-{os.getpid()}"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(temp, path)


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()[:12]


# ---------------------------------------------------------------- frontmatter

FRONTMATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---", re.S)


def parse_frontmatter(text):
    match = FRONTMATTER_RE.match(text)
    if match is None:
        return None
    meta = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        meta[key.strip()] = value
    return meta


def build_frontmatter(name, description, emoji=""):
    def scalar(value):
        text = str(value).replace("\n", " ").strip()
        if text and (text[0] in "\"'" or text[-1] in "\"'" or text[0] in "#-?:!,&*|>%@`[]{}"):
            return '"' + text.replace('"', "”") + '"'
        return text

    lines = ["---", f"name: {scalar(name)}", f"description: {scalar(description)}"]
    if emoji:
        lines.append(f"emoji: {scalar(emoji)}")
    lines += ["---", ""]
    return "\n".join(lines)


# ---------------------------------------------------------------- 交互输入

def ask(prompt, default=""):
    suffix = f" [{default}]" if default else ""
    try:
        value = input(f"  {prompt}{suffix}: ").strip()
    except EOFError:
        value = ""
    return value or default


def ask_yes(prompt):
    try:
        return input(f"  {prompt} [y/N]: ").strip().lower() in ("y", "yes")
    except EOFError:
        return False


def pick_category(repo, runtime, category, label, allow_new=True):
    """选分类：给编号选现有的，或输入 n 新建。返回 (key, 显示名 or "")。"""
    root = experts_root(repo)
    existing = sorted(set(declare_divisions(root)) | set(divisions_of(root)))
    labels = {**read_json(os.path.join(zh_root(repo), "divisions.json")),
              **read_json(os.path.join(runtime, "zh", "divisions.json"))}

    if category:
        if not valid_division(category):
            die(f"分类名不合法：{category!r}（只允许 a-z 0-9 . -，且不以 . 开头）")
        # 已存在的分类**不回填显示名**：显示名只在新建分类时才有意义。旧实现会把
        # `divisions.json` 里的现值原样返回、再被 write_label 写回去，而该文件已经
        # 升级成 `{en, zh}` 形态 —— 那样会把对象压成纯字符串，英文名丢掉。
        return category, ""

    head("选择分类")
    if existing:
        for index, key in enumerate(existing, 1):
            count = len([f for f in os.listdir(os.path.join(root, key)) if f.endswith(".md")])
            print(f"   {index:>2}) {division_label(labels, key):<12} {DIM}{key} · {count} 位{RESET}")
    else:
        say("   （源码里还没有任何分类）")
    if allow_new:
        say(f"    n) 新建分类")
    while True:
        answer = ask("编号或 n").lower()
        if answer == "n" and allow_new:
            key = ask("新分类目录名（小写字母/数字/连字符）")
            if not valid_division(key):
                warn("分类名不合法（只允许 a-z 0-9 . -，且不以 . 开头）")
                continue
            if key in existing:
                warn(f"分类 {key} 已存在")
                return key, labels.get(key, "")
            display = ask("显示名（中文，可留空）")
            return key, display
        if answer.isdigit() and 1 <= int(answer) <= len(existing):
            key = existing[int(answer) - 1]
            return key, labels.get(key, "")
        warn("输入不对：填编号，或 n 新建分类")


def pick_file(path):
    head("专家文件")
    say(f"   {DIM}要求：Markdown，开头 frontmatter 里至少有 name 与 description{RESET}")
    while True:
        if path:
            raw = path
        elif sys.stdin.isatty():
            raw = ask("专家 .md 的路径（可拖进来，支持 ~）")
        else:
            die("没有专家文件可读：用 --file 指定一个存在的 .md")
        expanded = os.path.expanduser(str(raw).strip().strip("\"'"))
        if os.path.isfile(expanded):
            return expanded
        warn(f"找不到文件：{expanded}")
        path = ""


# ---------------------------------------------------------------- 落盘

def update_source_json(repo, runtime):
    """名册清单：计数 + 分类 + 时间。插件把它当热重载指纹的一部分，所以两边都要写。"""
    root = experts_root(repo)
    divisions = divisions_of(root)
    count = len(md_files(root))
    now = datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S %z")
    manifest = {
        "updatedAt": now,
        "expertFiles": count,
        "divisions": divisions,
        "note": "本仓名册清单：data/experts 是真源，由 add-expert.py 维护（上游同步已移除）",
    }
    write_json(os.path.join(repo, "data", "source.json"), manifest)
    write_json(os.path.join(runtime, "source.json"), manifest)
    return manifest


def write_label(repo, runtime, key, label):
    """写分类显示名（只在新建分类，或调用方显式给 `--label` 时发生）。

    已存在的键要按**原形态**更新：现在是 `{en, zh}` 对象就只换 `zh`、保住 `en`
    （插件的 `divisionOf()` 两种形态都吃，但把对象压成字符串会丢掉英文名）。
    """
    if not label:
        return
    for base in (os.path.join(repo, "data", "zh"), os.path.join(runtime, "zh")):
        path = os.path.join(base, "divisions.json")
        data = read_json(path)
        current = data.get(key)
        if isinstance(current, dict):
            data[key] = {**current, "zh": label, "en": current.get("en") or label}
        else:
            data[key] = label
        write_json(path, data)


def copy_into_runtime(repo, runtime, category, slug):
    source = os.path.join(experts_root(repo), category, f"{slug}.md")
    target = os.path.join(runtime_experts(runtime), category, f"{slug}.md")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.copyfile(source, target)
    return target


def describe_targets(repo, runtime, category, slug):
    return (os.path.join(experts_root(repo), category, f"{slug}.md"),
            os.path.join(runtime_experts(runtime), category, f"{slug}.md"))


# ---------------------------------------------------------------- 命令：add

def cmd_add(args):
    repo, runtime = os.path.abspath(args.repo), os.path.abspath(args.runtime)
    if not os.path.isdir(experts_root(repo)):
        die(f"源码名册目录不存在：{experts_root(repo)}")

    category, label = pick_category(repo, runtime, args.category, args.label)
    label = args.label or label          # --label 优先（新建分类时它才是显示名来源）
    source = pick_file(args.file)
    slug = (args.slug or os.path.splitext(os.path.basename(source))[0]).lower()
    if not valid_slug(slug):
        die(f"slug 不合法：{slug!r}（文件名要能当 slug：a-z 0-9 -；中文名请用 --slug 指定英文）")

    with open(source, encoding="utf-8") as handle:
        text = handle.read()
    meta = parse_frontmatter(text)
    if meta is None or not meta.get("name") or not meta.get("description"):
        # 没有 frontmatter / 缺字段：非交互时用 --name/--description 补，交互时问出来
        name = args.name
        description = args.description
        if not name and not description and sys.stdin.isatty() and not args.force:
            head("这个文件没有 frontmatter（或缺 name/description）")
            name = ask("专家名称（中文）")
            description = ask("一句话简介")
        if not name or not description:
            die("缺 frontmatter 的 name/description：补上，或用 --name/--description 让本工具生成")
        emoji = args.emoji or (meta or {}).get("emoji", "")
        body = text if meta is None else FRONTMATTER_RE.sub("", text, count=1)
        text = build_frontmatter(name, description, emoji) + "\n" + body.lstrip("\n")
        meta = parse_frontmatter(text)

    repo_path, runtime_path = describe_targets(repo, runtime, category, slug)
    head("确认写入")
    say(f"   分类      {label or category}（{category}）")
    say(f"   专家      {meta.get('name')}  {DIM}slug={slug}{RESET}")
    say(f"   源码      {repo_path}")
    say(f"   运行时    {runtime_path}")
    say(f"   来源      {source}  {DIM}({len(text)} 字节){RESET}")
    if os.path.exists(repo_path) or os.path.exists(runtime_path):
        warn("   目标已存在：")
        if os.path.exists(repo_path):
            say(f"     · 源码  {repo_path}")
        if os.path.exists(runtime_path):
            say(f"     · 运行时 {runtime_path}")
        if not args.force and not (sys.stdin.isatty() and ask_yes("覆盖它？")):
            die("已取消（目标已存在；要覆盖加 --force）")
    elif not args.force and sys.stdin.isatty() and not ask_yes("落盘？"):
        die("已取消")

    if args.dry_run:
        say(f"\n{DIM}[dry-run] 以上动作都没有真正执行{RESET}")
        return 0

    os.makedirs(os.path.dirname(repo_path), exist_ok=True)
    with open(repo_path, "w", encoding="utf-8") as handle:
        handle.write(text if text.endswith("\n") else text + "\n")
    copy_into_runtime(repo, runtime, category, slug)
    write_label(repo, runtime, category, label)
    manifest = update_source_json(repo, runtime)

    say(f"\n{OK}✓ 已写入{RESET}")
    say(f"   源码      {repo_path}")
    say(f"   运行时    {runtime_path}")
    say(f"   名册      {manifest['expertFiles']} 位 / {len(manifest['divisions'])} 个分类")
    say(f"\n   面板按 mtime 指纹自动重载，不用重启；发布时随 npm 包一起带上。")
    return 0


# ---------------------------------------------------------------- 命令：remove

def cmd_remove(args):
    repo, runtime = os.path.abspath(args.repo), os.path.abspath(args.runtime)
    root = experts_root(repo)
    category = args.category
    if not category:
        category, _ = pick_category(repo, runtime, None, None, allow_new=False)
    if not valid_division(category):
        die(f"分类名不合法：{category!r}")
    directory = os.path.join(root, category)
    files = sorted(md_files(directory)) if os.path.isdir(directory) else []
    if not files:
        die(f"分类 {category} 下没有专家")

    slug = args.slug
    if not slug:
        head(f"选择要删除的专家（{category}）")
        for index, rel in enumerate(files, 1):
            print(f"   {index:>2}) {rel[:-3]}")
        answer = ask("编号")
        if not answer.isdigit() or not 1 <= int(answer) <= len(files):
            die("输入不对")
        slug = os.path.basename(files[int(answer) - 1])[:-3]
    if not valid_slug(slug):
        die(f"slug 不合法：{slug!r}")

    # slug 就是文件名：在分类树下递归找它的相对路径（可能有嵌套子目录）
    relative = next((rel for rel in files if os.path.basename(rel)[:-3] == slug), f"{slug}.md")
    slug_dir = os.path.dirname(relative)
    repo_path = os.path.join(root, category, relative)
    runtime_path = os.path.join(runtime_experts(runtime), category, relative)
    _ = slug_dir  # 相对路径已经带上了子目录
    head("确认删除")
    say(f"   分类      {category}")
    say(f"   专家      {slug}")
    say(f"   源码      {repo_path}  {'（存在）' if os.path.exists(repo_path) else '（不存在）'}")
    say(f"   运行时    {runtime_path}  {'（存在）' if os.path.exists(runtime_path) else '（不存在）'}")
    if not args.yes and sys.stdin.isatty() and not ask_yes("真的删？"):
        die("已取消")
    if args.dry_run:
        say(f"\n{DIM}[dry-run] 什么都没删{RESET}")
        return 0

    removed = []
    for path in (repo_path, runtime_path):
        if os.path.exists(path):
            os.unlink(path)
            removed.append(path)
    if not removed:
        die("两处都没有这个文件")
    for base in (root, runtime_experts(runtime)):
        directory = os.path.join(base, category)
        if os.path.isdir(directory) and not md_files(directory):
            shutil.rmtree(directory, ignore_errors=True)   # 只收掉没有任何专家的空分类（含空子目录）
    manifest = update_source_json(repo, runtime)
    say(f"\n{OK}✓ 已删除{RESET}")
    for path in removed:
        say(f"   {path}")
    say(f"   名册      {manifest['expertFiles']} 位 / {len(manifest['divisions'])} 个分类")
    return 0


# ---------------------------------------------------------------- 命令：stats / check

def zh_coverage(repo, runtime):
    for base in (os.path.join(repo, "data", "zh"), os.path.join(runtime, "zh")):
        data = read_json(os.path.join(base, "COVERAGE.json"))
        if data:
            return data
    return {}


def cmd_stats(args):
    repo, runtime = os.path.abspath(args.repo), os.path.abspath(args.runtime)
    root = experts_root(repo)
    labels = read_json(os.path.join(zh_root(repo), "divisions.json"))
    divisions = sorted(set(declare_divisions(root)) | set(divisions_of(root)))
    total = 0
    head(f"名册（源码 {root}）")
    for key in divisions:
        directory = os.path.join(root, key)
        files = md_files(directory) if os.path.isdir(directory) else {}
        total += len(files)
        print(f"   {division_label(labels, key):<14} {DIM}{key:<22}{RESET} {len(files):>3} 位")
    say(f"   {'合计':<14} {DIM}{len(divisions)} 个分类{RESET}          {total:>3} 位")

    head("运行时")
    say(f"   源码名册  {total} 位")
    say(f"   运行时    {runtime_prefix_count(runtime_experts(runtime))} 位（含你自建/手工加的）")
    say(f"   自建根    {runtime_prefix_count(os.path.join(runtime, 'custom'))} 位（<runtime>/custom，面板里建的）")

    coverage = zh_coverage(repo, runtime)
    if coverage:
        gaps = sum(len(v) for v in (coverage.get("gaps") or {}).values())
        head("中文覆盖（zh/，已冻结不再从上游更新）")
        say(f"   名字 {coverage.get('names')}/{coverage.get('experts')}"
            f" · 简介 {coverage.get('descriptions')}/{coverage.get('experts')}"
            f" · 正文 {coverage.get('bodies')}/{coverage.get('experts')} · 缺口 {gaps}")
    return 0


def runtime_prefix_count(root):
    if not os.path.isdir(root):
        return 0
    return sum(1 for _, _, files in os.walk(root) for name in files if name.endswith(".md"))


def cmd_check(args):
    """源码 ↔ 运行时 ↔ 清单 ↔ 中文侧车：四处必须一致。退出码 1 表示漂移（给 CI/脚本用）。"""
    repo, runtime = os.path.abspath(args.repo), os.path.abspath(args.runtime)
    source_root, target_root = experts_root(repo), runtime_experts(runtime)
    problems = []

    def listing(root):
        return dict(sorted(md_files(root).items()))

    source_files, target_files = listing(source_root), listing(target_root)
    for key, path in sorted(source_files.items()):
        if key not in target_files:
            problems.append(("运行时缺", key))
        elif sha256(path) != sha256(target_files[key]):
            problems.append(("内容不同", key))
    for key in sorted(target_files):
        if key not in source_files:
            problems.append(("运行时多出", key))

    manifest = read_json(os.path.join(repo, "data", "source.json"))
    if manifest.get("expertFiles") != len(source_files):
        problems.append(("清单不符", f"source.json 说 {manifest.get('expertFiles')}，实际 {len(source_files)}"))

    # 中文侧车对账：names/descriptions 必须覆盖名册里的每一份 .md，COVERAGE 的数字必须等于磁盘实数。
    # 少了这一步时，「加了专家但没补中文」会被判成「三处一致」（假绿）—— 面板上那位是英文名 +
    # 英文简介，中文覆盖数字也已经过期，一直要等到 verify.mjs 才变红。
    #
    # 侧车是否启用由它自己的清单 `COVERAGE.json` 决定：没有它就说明这个仓库根本没接中文侧车
    # （夹具/精简仓库就是这样），此时**不做**对账，只打印一行说明 —— 否则「没有侧车」会被误报成漂移。
    zh_base = zh_root(repo)
    coverage = read_json(os.path.join(zh_base, "COVERAGE.json"))
    zh_enabled = bool(coverage)
    names = read_json(os.path.join(zh_base, "names.json")) if zh_enabled else {}
    descriptions = read_json(os.path.join(zh_base, "descriptions.json")) if zh_enabled else {}
    slugs = {os.path.splitext(os.path.basename(relative))[0] for relative in source_files}
    zh_bodies = {os.path.splitext(os.path.basename(relative))[0]
                 for relative in md_files(zh_base)
                 if not relative.startswith("manual-bodies" + os.sep)} if zh_enabled else set()
    if zh_enabled:
        for kind, table in (("中文名", names), ("中文简介", descriptions)):
            blank = sorted(slug for slug in slugs if not str(table.get(slug, "")).strip())
            if blank:
                problems.append((f"{kind}缺", f"{len(blank)} 位（如 {blank[0]}）"))
        for key, actual in (("experts", len(slugs)), ("names", len(names)),
                            ("descriptions", len(descriptions)), ("bodies", len(zh_bodies))):
            if coverage.get(key) != actual:
                problems.append(("中文覆盖不符", f"COVERAGE.{key}={coverage.get(key)}，实际 {actual}"))
        declared_missing = sorted(coverage.get("gaps", {}).get("missingBody") or [])
        actual_missing = sorted(slugs - zh_bodies)
        if declared_missing != actual_missing:
            problems.append(("中文覆盖不符",
                             f"gaps.missingBody 列了 {len(declared_missing)} 位，实际缺正文 {len(actual_missing)} 位"
                             f"（{actual_missing[0] if actual_missing else '-'}）"))

    head("名册一致性（源码 ↔ 运行时 ↔ 清单 ↔ 中文侧车）")
    say(f"   源码   {len(source_files)} 位 / {len(divisions_of(source_root))} 个分类")
    say(f"   运行时 {len(target_files)} 位 / {len(divisions_of(target_root))} 个分类")
    say(f"   清单   {manifest.get('expertFiles', '未记录')} 位")
    if zh_enabled:
        say(f"   中文   名 {len(names)} · 简介 {len(descriptions)} · 正文 {len(zh_bodies)}"
            f"（名册 {len(slugs)} 位；正文缺口 {len(slugs - zh_bodies)} 位属预期）")
    else:
        say(f"   中文   未启用（无 {os.path.join('data', 'zh', 'COVERAGE.json')}），跳过对账")
    if not problems:
        say(f"\n{OK}✓ {'四处一致' if zh_enabled else '一致（本仓库未接中文侧车）'}{RESET}")
        return 0
    say("")
    for kind, detail in problems[:40]:
        warn(f"   ✗ {kind}：{detail}")
    if len(problems) > 40:
        warn(f"   … 还有 {len(problems) - 40} 条")
    say(f"\n{BAD}✗ 有 {len(problems)} 处不一致{RESET}  用 `tz.sh experts add` 新增 / `tz.sh experts remove` 删除，或 `sync-data` 重新快照")
    return 1


# ---------------------------------------------------------------- 入口

def main():
    parser = argparse.ArgumentParser(description="T专家 名册工具（新增 / 删除 / 统计 / 校验）")
    parser.add_argument("command", choices=["add", "remove", "stats", "check"])
    parser.add_argument("--repo", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "dsh-expert"))
    parser.add_argument("--runtime", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
    parser.add_argument("--category")
    parser.add_argument("--slug")
    parser.add_argument("--file")
    parser.add_argument("--label")
    parser.add_argument("--name")
    parser.add_argument("--description")
    parser.add_argument("--emoji")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--yes", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not os.path.isdir(args.repo):
        die(f"找不到插件仓库：{args.repo}")
    handler = {"add": cmd_add, "remove": cmd_remove, "stats": cmd_stats, "check": cmd_check}[args.command]
    return handler(args)


if __name__ == "__main__":
    sys.exit(main())
