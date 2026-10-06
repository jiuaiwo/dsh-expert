#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 WorkBuddy 专家包导入 T专家 名册（目录形态）。

来源：~/web/t-team/workbuddy-experts/experts/<plugin>/（fetch-workbuddy-experts.py 的导出）
目标：dsh-expert/data/experts/<分区>/<slug>/

产出的是「专家包」目录形态：

    data/experts/<分区>/<slug>/
    ├── persona.md                    ← catalog.js 读这个（T专家 frontmatter 格式）
    ├── agents/                       ← WorkBuddy 原始人格文件（溯源保留）
    ├── skills/ · references/ · …      ← 全部附件原样搬运
    └── .codebuddy-plugin/plugin.json ← 识别标志 + 原始元数据

分区策略：映射到 T专家现有的 22 个分区，不新建分类（2026-09-29 用户选定）。
categoryId 能直接映射的直接映射；「行业顾问 / 腾讯专区 / 全球发展 / 开学季」
这四个混合分类按 profession 关键词二次判定，兜底 specialized。

用法：
  python3 tools/import-workbuddy.py --dry-run        # 只报计划，不写盘
  python3 tools/import-workbuddy.py --limit 5        # 先转 5 个试点
  python3 tools/import-workbuddy.py                  # 全量
  python3 tools/import-workbuddy.py --clean          # 先清掉上次导入的（按 .imported-from 标记）
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.expanduser("~/web/t-team/workbuddy-experts")
DST = os.path.join(REPO, "data", "experts")
DUP_REPORT = os.path.expanduser("~/web/t-team/T专家-WorkBuddy-重复对照与整合范围.md")

# ── 分区映射 ────────────────────────────────────────────────────────────────
# categoryId 直接映射；值为 None 的四个混合分类走关键词判定。
CATEGORY_MAP = {
    "01-ProductDesign": "design",
    "02-Engineering": "engineering",
    "03-GameSpatial": "game-development",
    "04-DataAI": "engineering",
    "05-MarketingGrowth": "marketing",
    "06-ContentCreative": "marketing",
    "07-SalesCommerce": "sales",
    "08-FinanceInvestment": "finance",
    "09-OperationsHR": "hr",
    "10-ProjectQuality": "project-management",
    "11-SecurityCompliance": "security",
    "12-IndustryConsultant": None,
    "13-TencentZone": None,
    "14-GlobalDevelopment": None,
    "15-BackToSchool": None,
}

# 关键词 → 分区（按顺序匹配，先命中先算）。用于 categoryId 无法直接映射的专家。
KEYWORD_RULES = [
    (r"法务|法律|合规|合同|知识产权|legal|compliance", "legal"),
    (r"财税|税务|税|金融|投资|银行|外汇|审计|融资|保险|会计|估值|finance|tax", "finance"),
    (r"人力|招聘|薪酬|社保|绩效|组织|HR|培训", "hr"),
    (r"医疗|健康|临床|医药|health|医疗健康", "healthcare"),
    (r"供应链|采购|物流|仓储|supply", "supply-chain"),
    (r"客服|支持|工单|答疑|support", "support"),
    (r"测试|QA|质量|质检|testing|quality", "testing"),
    (r"GIS|地理|地图|遥感|测绘", "gis"),
    (r"游戏|Unity|Unreal|Godot|Roblox|关卡|美术", "game-development"),
    (r"XR|VR|AR|空间计算|visionOS|头显|座舱", "spatial-computing"),
    (r"广告|投放|竞价|媒体|媒体采买|paid", "paid-media"),
    (r"安全|渗透|风控|威胁|漏洞|security", "security"),
    (r"项目|排期|交付管理|项目经理|project", "project-management"),
    (r"销售|商务|客户|赢单|报价|sales", "sales"),
    (r"营销|增长|运营|内容|社媒|新媒体|品牌|短视频|直播|marketing|content", "marketing"),
    (r"产品|设计|UI|UX|交互|视觉|品牌设计|product|design", "design"),
    (r"研究|调研|分析|数据科学|数据智能|research|分析", "research"),
    (r"公司|经营|战略|管理|consultant|顾问", "company"),
    (r"教育|教学|教师|学习|课程|学术|升学|study|teach|academic", "academic"),
]

# 分区 → (emoji, 主题色)。T专家 原有的 22 个分区，配色沿用其分区语义。
DIVISION_STYLE = {
    "academic": ("🎓", "#6366F1"),
    "company": ("🏢", "#0EA5E9"),
    "design": ("🎨", "#EC4899"),
    "engineering": ("⚙️", "#3B82F6"),
    "finance": ("💰", "#10B981"),
    "game-development": ("🎮", "#8B5CF6"),
    "gis": ("🗺️", "#14B8A6"),
    "healthcare": ("🏥", "#EF4444"),
    "hr": ("👥", "#F59E0B"),
    "legal": ("⚖️", "#78716C"),
    "marketing": ("📣", "#F97316"),
    "paid-media": ("📊", "#EAB308"),
    "product": ("📦", "#06B6D4"),
    "project-management": ("📋", "#64748B"),
    "research": ("🔬", "#7C3AED"),
    "sales": ("🤝", "#22C55E"),
    "security": ("🛡️", "#DC2626"),
    "spatial-computing": ("🥽", "#A855F7"),
    "specialized": ("🧩", "#94A3B8"),
    "supply-chain": ("🚚", "#0891B2"),
    "support": ("🎧", "#0284C7"),
    "testing": ("🧪", "#059669"),
}

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,127}$")
MARK = ".imported-from-workbuddy"


def log(msg):
    print(msg, flush=True)


def pick_division(entry):
    """决定专家落在哪个分区：categoryId 优先，四个混合分类走关键词，兜底 specialized。"""
    div = CATEGORY_MAP.get(entry.get("categoryId"))
    if div:
        return div
    hay = " ".join(filter(None, [
        entry.get("profession_zh"), entry.get("name_zh"),
        entry.get("profession_en"), entry.get("name_en"),
        " ".join(entry.get("tags_zh") or []),
        (entry.get("description_zh") or "")[:200],
    ]))
    for pattern, division in KEYWORD_RULES:
        if re.search(pattern, hay, re.I):
            return division
    return "specialized"


def read_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def strip_frontmatter(text):
    return re.sub(r"^---\r?\n.*?\r?\n---\r?\n?", "", text, count=1, flags=re.S).strip()


def yaml_str(value):
    """把值写成 YAML 单行字符串（含中文/引号时用双引号并转义）。"""
    s = str(value or "").replace("\n", " ").strip()
    if s == "":
        return '""'
    if re.search(r'[:#"\'\{\}\[\],&*?|<>=!%@`]', s) or s != s.strip():
        return '"%s"' % s.replace("\\", "\\\\").replace('"', '\\"')
    return s


def truncate(text, limit):
    s = (text or "").strip().replace("\n", " ")
    return s if len(s) <= limit else s[: limit - 1] + "…"


def body_hash(text):
    """正文哈希（去掉 frontmatter、抹平空白）—— 用于识别「同一份人格换了名字再收录」。

    WorkBuddy 里有 13 个这样的包：职务名不同（所以按名字的检测全部漏过），
    正文却与 T专家 现存的某位专家一字不差。只靠 name/slug 判重抓不到它们。
    """
    body = re.sub(r"^---\r?\n.*?\r?\n---\r?\n?", "", text, count=1, flags=re.S)
    return hashlib.sha256(re.sub(r"\s+", "", body).encode("utf-8")).hexdigest()[:16]


def existing_body_hashes(dst):
    """现有名册（单文件形态）的正文哈希 → `分区/slug` 映射。"""
    out = {}
    for division in os.listdir(dst) if os.path.isdir(dst) else []:
        dpath = os.path.join(dst, division)
        if not os.path.isdir(dpath):
            continue
        for name in os.listdir(dpath):
            p = os.path.join(dpath, name)
            if os.path.isfile(p) and name.endswith(".md"):
                try:
                    out[body_hash(open(p, encoding="utf-8", errors="replace").read())] = f"{division}/{name}"
                except OSError:
                    continue
    return out


LEAK_RE = re.compile(r"(?:/Users/|/home/)[A-Za-z0-9._-]+")


def sanitize_paths(root):
    """把包内残留的打包者本机路径换成占位符，返回替换处数。

    WorkBuddy 官方包里带着 `/Users/liuxiaopai`、`/Users/xxx` 这类绝对路径（打包者机器上的），
    既泄露他人信息、又在本机必然失效；tools/verify.mjs 的「快照无本机路径残留」会拦截发布。
    """
    hits = 0
    for dp, _dirs, files in os.walk(root):
        for name in files:
            if not re.search(r"\.(?:md|json|py|txt|ya?ml)$", name):
                continue
            p = os.path.join(dp, name)
            try:
                text = open(p, encoding="utf-8").read()
            except (OSError, UnicodeDecodeError):
                continue
            new, n = LEAK_RE.subn("/Users/<redacted>", text)
            if n:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(new)
                hits += n
    return hits


def role_title(raw, fname):
    """从角色 md 的 frontmatter 里取「花名（职业）」作分节标题；取不到就退回文件名。"""
    m = re.match(r"^---\r?\n(.*?)\r?\n---", raw, re.S)
    if not m:
        return None
    fm = m.group(1)

    def zh(key):
        mm = re.search(r"^%s:\s*\n\s+zh:\s*(.+)$" % key, fm, re.M)
        return mm.group(1).strip().strip("\"'") if mm else None

    disp, prof = zh("displayName"), zh("profession")
    if disp and prof:
        return "%s（%s）" % (disp, prof)
    return disp or prof or fname[:-3].replace("-", " ").title()


def build_persona(entry, division, pack_dir):
    """生成 persona.md：T专家 frontmatter + 正文（保真搬运，不改写）。"""
    emoji, color = DIVISION_STYLE.get(division, ("🧩", "#94A3B8"))
    # T专家 的 name 语义是「职务」（现有 323 个都是 Psychologist、人类学家这类），
    # 所以取 profession —— WorkBuddy 的 displayName 是**花名**（贝安、神算子），
    # 放进 name 会让面板显示成一个人名而非职务。
    name = entry.get("profession_zh") or entry.get("name_zh") or entry["plugin"]
    name_en = entry.get("profession_en") or entry.get("name_en") or entry["plugin"]
    desc = truncate(entry.get("description_zh") or entry.get("profession_zh"), 240)
    desc_en = truncate(entry.get("description_en") or entry.get("profession_en"), 400)

    agents_dir = os.path.join(pack_dir, "agents")
    files = sorted(f for f in os.listdir(agents_dir) if f.endswith(".md")) if os.path.isdir(agents_dir) else []

    bodies = []
    for f in files:
        raw = open(os.path.join(agents_dir, f), encoding="utf-8", errors="replace").read()
        body = strip_frontmatter(raw)
        if len(files) > 1:
            # 多角色：去掉角色自带的一级标题，其余标题整体降一级，
            # 让 `## 角色名` 成为唯一的分节层级（否则角色的内部章节会和分节标题同名同层）。
            body = re.sub(r"^#\s+.*\n+", "", body, count=1)
            body = re.sub(r"^(#{1,5})\s+", lambda m: "#" * (len(m.group(1)) + 1) + " ", body, flags=re.M)
            bodies.append("## %s\n\n%s" % (role_title(raw, f), body))
        else:
            bodies.append(body)
    body = "\n\n".join(bodies)

    head = [
        "---",
        "name: %s" % yaml_str(name),
        "nameEn: %s" % yaml_str(name_en),
        "description: %s" % yaml_str(desc),
        "descriptionEn: %s" % yaml_str(desc_en),
        "emoji: %s" % emoji,
        "color: %s" % yaml_str(color),
        "vibe: %s" % yaml_str(truncate(entry.get("profession_zh") or "", 60)),
        "---",
        "",
    ]
    if len(files) > 1:
        head.append("> 本专家为多角色团队，以下按角色分节（共 %d 个角色）。\n" % len(files))
    return "\n".join(head) + body + "\n"


def load_scope():
    """从重复对照报告里取回「待整合」与「与 T专家重复」的名单。"""
    scope_path = "/tmp/scope.json"
    if os.path.exists(scope_path):
        return read_json(scope_path)
    return None


def main():
    ap = argparse.ArgumentParser(description="把 WorkBuddy 专家导入 T专家名册（目录形态）")
    ap.add_argument("--src", default=SRC, help="WorkBuddy 导出目录")
    ap.add_argument("--dst", default=DST, help="目标 experts 目录")
    ap.add_argument("--limit", type=int, default=0, help="只处理前 N 个（试点）")
    ap.add_argument("--only", default="", help="只处理指定包名，逗号分隔")
    ap.add_argument("--include-dups", action="store_true", help="连与 T专家重复的也一起导入")
    ap.add_argument("--clean", action="store_true", help="先删除此前导入的专家包（按标记文件）")
    ap.add_argument("--dry-run", action="store_true", help="只报计划")
    args = ap.parse_args()

    src_root = os.path.expanduser(args.src)
    idx = {e["plugin"]: e for e in read_json(os.path.join(src_root, "index.json"), {}).get("experts", [])}
    if not idx:
        log("找不到 %s/index.json，先跑 fetch-workbuddy-experts.py" % src_root)
        return 1

    scope = load_scope()
    dups = set(scope["w_dup"]) if scope and not args.include_dups else set()

    # 再排除「与内置名册同 slug」的。重复对照报告是按**职务名**匹配的，会漏掉
    # 「slug 同名但职务名不同」的情况（实测 2 个：prompt-engineer、sales-pipeline-analyst）；
    # 这类包一旦导入，catalog 会判定 slug 冲突并覆盖掉原有专家。
    #
    # 收集必须**覆盖两种形态**，而且要**连"去掉分区前缀"的变体一起比**：
    # T专家 存量里有一批 slug 是带分区前缀的（`engineering-ai-engineer`、`design-ui-designer`、
    # `marketing-growth-hacker`…），而 WorkBuddy 收录同一个专家时用的是**不带前缀**的名字
    # （`ai-engineer`、`ui-designer`、`growth-hacker`）。只比原名的话这一整类都判不出来 ——
    # 2026-09-29 全量同步实测产生 50+ 组 slug 冲突，两两都变成不可召唤。
    divisions = []
    existing = set()
    if os.path.isdir(args.dst):
        for division in os.listdir(args.dst):
            dpath = os.path.join(args.dst, division)
            if not os.path.isdir(dpath):
                continue
            divisions.append(division)
            for name in os.listdir(dpath):
                if name.endswith(".md") and os.path.isfile(os.path.join(dpath, name)):
                    existing.add(name[:-3])
                elif os.path.isfile(os.path.join(dpath, name, "persona.md")):
                    existing.add(name)

    # 归一化：把带分区前缀的 slug 也拆出无前缀形式，一起参与判重。
    normalized = set()
    for slug in existing:
        normalized.add(slug)
        for division in divisions:
            if slug.startswith(division + "-"):
                normalized.add(slug[len(division) + 1:])

    clash = sorted(p for p in idx if p in normalized and p not in dups)
    if clash and not args.include_dups:
        log("以下 %d 个与内置名册重名（含去掉分区前缀后同名），已跳过：%s"
            % (len(clash), ", ".join(clash)))
        dups |= set(clash)

    wanted = [p for p in idx if p not in dups]

    # WorkBuddy 名册里有「同一专家以两个 plugin 名收录」的冗余（实测两对：
    # ai-shifu / ai-shifu-expert、migraq / migraq-expert —— name 与正文完全相同）。
    # 全导会让 catalog 判定重名冲突，两个都变成不可召唤，所以按 updatedAt 保留较新的。
    updated = {}
    merged = read_json(os.path.join(src_root, "_source", "merged.json"), {})
    for e in merged.get("experts", []):
        if e.get("plugin"):
            updated[e["plugin"]] = e.get("updatedAt") or ""
    byname = {}
    for p in wanted:
        # 判重键必须用**职业**（profession），不能用花名（name_zh）—— 花名会重复
        # （omics 系列 8 个专家的花名就撞在一起），用花名去重会误杀一大批不同的专家。
        # catalog 的 markConflicts 也是按 name/nameEn（即这里的 profession）判重的。
        key = ((idx[p].get("profession_zh") or "").strip(),
               (idx[p].get("profession_en") or "").strip())
        if key == ("", ""):
            key = (p,)
        cur = byname.get(key)
        if cur is None or updated.get(p, "") > updated.get(cur, ""):
            byname[key] = p
    keep = set(byname.values())
    redundant = [p for p in wanted if p not in keep]
    if redundant:
        log("同名冗余，保留较新的、跳过 %d 个：%s" % (len(redundant), ", ".join(redundant)))
        wanted = [p for p in wanted if p in keep]

    if args.only:
        want = {s.strip() for s in args.only.split(",") if s.strip()}
        # 必须从**已经判重过的 wanted** 里取交集，不能回头从 idx 重取 ——
        # idx 是全部候选，那样会把上面算出来的 dups 整个丢掉，
        # 于是 `--only` 一用判重就形同虚设（2026-09-29 实测：全量同步产生 50+ 组 slug 冲突，
        # 而单独不带 --only 干跑却显示「跳过 300 个」，就是这个差异造成的）。
        wanted = [p for p in wanted if p in want]
    if args.limit:
        wanted = wanted[: args.limit]

    log("WorkBuddy 导出 %d 个；排除与 T专家重复的 %d 个；本次处理 %d 个"
        % (len(idx), len(dups), len(wanted)))

    if args.clean:
        removed = 0
        for division in os.listdir(args.dst) if os.path.isdir(args.dst) else []:
            dpath = os.path.join(args.dst, division)
            if not os.path.isdir(dpath):
                continue
            for name in os.listdir(dpath):
                pack = os.path.join(dpath, name)
                if os.path.isdir(pack) and os.path.exists(os.path.join(pack, MARK)):
                    if not args.dry_run:
                        shutil.rmtree(pack)
                    removed += 1
        log("已清理此前导入的专家包：%d 个" % removed)
        # --clean 是**独立操作**：清完即退出，不顺手做导入。
        # 早先的实现会继续往下跑导入循环，于是「只想清理」变成「全量重导」；
        # 再叠加调用方 `| head -2` 截断输出，真实行为被完全掩盖。
        return 0

    existing_bodies = existing_body_hashes(args.dst)
    skipped_body = []
    by_division = {}
    count = 0
    sanitized = 0
    for plugin in wanted:
        if not SLUG_RE.match(plugin):
            log("  跳过（名字不合规）：%s" % plugin)
            continue
        pack_src = os.path.join(src_root, "experts", plugin)
        if not os.path.isdir(pack_src):
            log("  跳过（源不存在）：%s" % plugin)
            continue
        entry = idx[plugin]
        division = pick_division(entry)

        # 正文与现有专家一字不差 → 跳过。WorkBuddy 里有 13 个「换了名字重复收录」的包，
        # 职务名不同所以按名字的检测抓不到；留着它们会让面板出现内容相同的影子专家。
        content = build_persona(entry, division, pack_src)
        h = body_hash(content)
        if h in existing_bodies:
            skipped_body.append("%s == %s" % (plugin, existing_bodies[h]))
            continue

        by_division[division] = by_division.get(division, 0) + 1

        if args.dry_run:
            count += 1
            continue

        pack_dst = os.path.join(args.dst, division, plugin)
        if os.path.exists(pack_dst):
            shutil.rmtree(pack_dst)
        shutil.copytree(pack_src, pack_dst, symlinks=False, ignore_dangling_symlinks=True)
        with open(os.path.join(pack_dst, "persona.md"), "w", encoding="utf-8") as f:
            f.write(content)
        existing_bodies[h] = "%s/%s" % (division, plugin)
        with open(os.path.join(pack_dst, MARK), "w", encoding="utf-8") as f:
            f.write(json.dumps({
                "plugin": plugin,
                "division": division,
                "categoryId": entry.get("categoryId"),
                "importedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
                "source": "workbuddy expert marketplace (COS)",
            }, ensure_ascii=False, indent=2))
        sanitized += sanitize_paths(pack_dst)
        count += 1
        if count % 50 == 0:
            log("  已导入 %d/%d…" % (count, len(wanted)))

    if skipped_body:
        log("")
        log("正文与现有专家一字不差、已跳过 %d 个：" % len(skipped_body))
        for line in skipped_body:
            log("  %s" % line)
    log("")
    log("=== 分区分布 ===")
    for div in sorted(by_division, key=lambda d: -by_division[d]):
        log("  %-22s %3d" % (div, by_division[div]))
    log("")
    log("%s %d 个专家包%s" % ("计划导入" if args.dry_run else "已导入", count,
                              "" if args.dry_run or sanitized == 0 else "，清洗本机路径 %d 处" % sanitized))
    if not args.dry_run:
        log("目标：%s" % args.dst)
        log("下一步：node tools/sync-data.mjs && node tools/verify.mjs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
