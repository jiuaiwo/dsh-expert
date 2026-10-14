#!/usr/bin/env node
/**
 * ⚠️ **当前未启用**（2026-09-29）：这批图标试用过一版，用户口径「还是采用系统 emoji，（太）卡了」——
 * Fluent 的 Color 档每枚 5–27 KB、带大量 SVG 滤镜，以 data URI 逐张 <img> 渲染时解码/光栅化开销明显，
 * 于是 0.4.24 回退到系统 emoji（字体字形，几乎零成本）。脚本保留下来：将来若想要统一插画风，
 * 跑一次就能重新生成 `src/client/fluent-icons.jsx`（映射表与上游 sha256 都在下面）。
 *
 * 把 **Fluent Emoji**（microsoft/fluentui-emoji，MIT）的 22 枚**彩色**分区图标下载下来，
 * 生成 `src/client/fluent-icons.jsx`（每枚一段 SVG 原文 + 运行时转 data URI）。
 *
 * 为什么用这批图标（用户 2026-09-29 口径：「有没有更好的图标库，最好带颜色的」→ 选了 Fluent Color）：
 *   · 宿主 `primitives` 那套是**单色**线性图标（`Icon*OutlineMedium`），给不出颜色；
 *   · 系统 emoji 虽然彩色，但🔍 这类天生就是灰黑的，而且各平台长相不同；
 *   · Fluent 的 Color 是彩色矢量插画（带渐变/高光），**每枚都有颜色**、跨平台一致。
 *   代价：22 枚合计约 360 KB（bundle 从 ~950 KB 涨到 ~1.3 MB），同分区共用一枚图标。
 *
 * 上游换了资产名时这个脚本会下载失败并明确报错（不静默降级成旧图）。
 * 许可：MIT，Copyright (c) Microsoft Corporation —— 全文随包在
 * `vendor/third-party-licenses/fluentui-emoji.LICENSE`，署名见 THIRD-PARTY-NOTICES。
 *
 * 用法：node tools/sync-fluent-icons.mjs
 */
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : join(SELF_DIR, "dsh-expert"));
const OUT = join(HERE, "src", "client", "fluent-icons.jsx");

/** 分区 → 上游资产（目录名 / 文件名）。名称取自 Fluent 仓库 `assets/` 的真实目录。 */
const ASSETS = {
  academic: ["Books", "books_color.svg"],
  company: ["Office building", "office_building_color.svg"],
  design: ["Artist palette", "artist_palette_color.svg"],
  engineering: ["Hammer and wrench", "hammer_and_wrench_color.svg"],
  finance: ["Money bag", "money_bag_color.svg"],
  "game-development": ["Joystick", "joystick_color.svg"],
  gis: ["Compass", "compass_color.svg"],
  healthcare: ["Hospital", "hospital_color.svg"],
  hr: ["Busts in silhouette", "busts_in_silhouette_color.svg"],
  legal: ["Balance scale", "balance_scale_color.svg"],
  marketing: ["Megaphone", "megaphone_color.svg"],
  "paid-media": ["Chart increasing", "chart_increasing_color.svg"],
  product: ["Package", "package_color.svg"],
  "project-management": ["Clipboard", "clipboard_color.svg"],
  research: ["Magnifying glass tilted left", "magnifying_glass_tilted_left_color.svg"],
  sales: ["Handshake", "handshake_color.svg"],
  security: ["Locked with key", "locked_with_key_color.svg"],
  "spatial-computing": ["Goggles", "goggles_color.svg"],
  specialized: ["Nut and bolt", "nut_and_bolt_color.svg"],
  "supply-chain": ["Delivery truck", "delivery_truck_color.svg"],
  support: ["Bellhop bell", "bellhop_bell_color.svg"],
  testing: ["Microscope", "microscope_color.svg"],
};

const rawUrl = (dir, file) => `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(dir)}/Color/${file}`;

/** 只做无损的空白折叠：去掉换行与缩进（SVG 里标签之间的空白不参与渲染），能把体积压掉一成左右。 */
function compact(svg) {
  return svg.replace(/>\s+</gu, "><").replace(/\s*\n\s*/gu, "").trim();
}

const entries = [];
let total = 0;
for (const [division, [dir, file]] of Object.entries(ASSETS)) {
  const url = rawUrl(dir, file);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败 ${division} → ${url}（HTTP ${response.status}）：上游可能改了资产名，去 assets/ 里核对后改 ASSETS 表`);
  }
  const svg = compact(await response.text());
  if (!svg.startsWith("<svg")) throw new Error(`${division} 拿到的不是 SVG：${svg.slice(0, 80)}`);
  const sha = createHash("sha256").update(svg).digest("hex").slice(0, 16);
  entries.push({ division, dir, file, svg, sha });
  total += Buffer.byteLength(svg, "utf8");
  process.stdout.write(`  ${division.padEnd(22)} ${String(Buffer.byteLength(svg, "utf8")).padStart(7)} 字节  ${dir}\n`);
}

const lines = entries.map(({ division, svg }) => `  ${JSON.stringify(division)}: ${JSON.stringify(svg)},`).join("\n");
const manifest = entries.map(({ division, dir, file, sha }) => ` *   ${division.padEnd(22)} ${file}  sha256:${sha}`).join("\n");

const out = `/**
 * Fluent Emoji（microsoft/fluentui-emoji）的 22 枚**彩色**分区图标 —— 内联成 data URI。
 *
 * ⚠️ 本文件由 \`tools/sync-fluent-icons.mjs\` 生成，**勿手改**；重跑那个脚本即可更新。
 * 为什么是它：宿主 \`primitives\` 那批 \`Icon*\` 是单色线性的（给不出颜色），系统 emoji 又各平台不同、
 * 且像 🔍 这种天生是灰黑的；Fluent Color 每枚都有颜色、跨平台一致（用户 2026-09-29 选定）。
 * 代价：22 枚合计约 ${Math.round(total / 1024)} KB，且同一分区的专家共用一枚图标。
 *
 * 许可：MIT，Copyright (c) Microsoft Corporation。全文随包在
 * \`vendor/third-party-licenses/fluentui-emoji.LICENSE\`，署名见 \`THIRD-PARTY-NOTICES\`。
 *
 * 资产清单（上游 assets/<目录>/Color/<文件>）：
${manifest}
 */
const SVG = {
${lines}
};

/**
 * 运行时转 data URI，而不是把编码结果写进文件：源码里留 SVG 原文便于审查与人工替换，
 * 体积也比预编码小（encodeURIComponent 会把 #、空格、尖括号都转义，膨胀约两成）。
 * 22 次编码只在模块加载时做一次。
 */
const toUri = (svg) => \`data:image/svg+xml;utf8,\${encodeURIComponent(svg)}\`;

/** 分区 → data URI。没有该分区时返回 undefined（调用方回退 expert.emoji → 🧩）。 */
export const FLUENT_ICONS = Object.fromEntries(Object.entries(SVG).map(([division, svg]) => [division, toUri(svg)]));
`;

await writeFile(OUT, out, "utf8");
process.stdout.write(`\n已写入 ${OUT}（${entries.length} 枚，SVG 原文合计 ${Math.round(total / 1024)} KB）\n`);
