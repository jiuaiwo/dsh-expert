/**
 * 注入 <style> 的 CSS 模板字符串
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
export const CSS = `
/* 小节标题（自建分类 / 官方分类）：**不画上边线**。
   2026-09-28 用户指出两处多余的横线，这是第一处 —— 标题上方的线紧贴着上一个区块
   （输入框那一行 / 上一个小节），看着像"线贴到了按钮上"。去掉边框，靠字重与间距分层就够了。 */
.t-team-section-head{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
/* 分类页的间距（2026-09-28 用户：「自建分类 / 官方分类 里下方元素增加点间隔」）：
   页级 14px 隔开区块，小节级 8px 隔开「标题 → 说明 → 列表」。
   间距一律由容器的 gap 提供，元素自己不再写 margin —— 免得两处相加、以后改不动。 */
.t-team-cat-page{display:flex;flex-direction:column;gap:14px}
.t-team-cat-section{display:flex;flex-direction:column;gap:8px}
.t-team-tabs{display:flex;gap:6px;border-bottom:1px solid var(--dsw-alias-border-l2);padding-bottom:6px}
.t-team-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;padding:4px 10px;border-radius:6px;cursor:pointer}
.t-team-tab[data-active="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:600}
.t-team-tabbody{display:flex;flex-direction:column;gap:12px;min-height:0}
.t-team-tabbody[hidden]{display:none}
.t-team-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.t-team-label{font-size:12px;color:var(--dsw-alias-label-caption);min-width:52px}
.t-team-emoji{font-size:14px;line-height:1}
.t-team-groups{display:flex;flex-direction:column;gap:6px}
.t-team-editor{display:flex;flex-direction:column;gap:10px;border-top:1px dashed var(--dsw-alias-border-l2);padding-top:10px}
.t-team-field{display:flex;flex-direction:column;gap:4px}
.t-team-field > span{font-size:12px;color:var(--dsw-alias-label-caption)}
/* 表单里的输入框：.t-team-input 的 flex-basis 是给横向搜索条用的，竖向容器里会把它撑成 200px 高 */
.t-team-field .t-team-input{flex:0 0 auto;width:100%;min-width:0;height:30px}
.t-team-editor .t-team-input{flex:0 0 auto;height:30px}
/* 自建专家编辑器：正文是多行 Markdown，文本框要能拉高 */
.t-team-editor textarea.t-team-input{height:auto;min-height:150px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px}
.t-team-editor .t-team-editor-actions{display:flex;gap:8px;justify-content:flex-end}
.t-team-badge-custom{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;vertical-align:middle;color:var(--dsw-alias-label-caption)}
.t-team-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
/* 竖向 tab 容器里的搜索框同理：设置页「队伍」tab 的搜索框曾经被撑成 200px 高 */
.t-team-tabbody > .t-team-input{flex:0 0 auto;width:100%;min-width:0;height:30px}
.t-team-picker{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.t-team-picker-list{max-height:220px;overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px}
.t-team-picker-row{display:flex;align-items:center;gap:6px;padding:3px 4px;border-radius:6px;font-size:12px;cursor:pointer}
.t-team-picker-row:hover{background:var(--dsw-alias-bg-layer-3)}
.t-team-picker-slug{color:var(--dsw-alias-label-caption);font-family:var(--dsw-font-markdown-code-block-small);font-size:11px}
.t-team-selected-row{display:flex;align-items:center;gap:6px;font-size:12px;padding:3px 4px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.t-team-badge{font-size:11px;border-radius:999px;padding:1px 8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary)}
.t-team-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.t-team-badge[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.t-team-team-meta{font-size:12px;color:var(--dsw-alias-label-caption);display:flex;gap:10px;flex-wrap:wrap}
.t-team-note{font-size:11px;color:var(--dsw-alias-label-caption)}
.t-team-ok{font-size:12px;color:var(--dsw-alias-state-success-primary)}
/* ---- 设置面板外壳与卡片（2026-09-28）----
   面板从「设置 → T专家」搬到「插件列表 → T专家」的插件信息页，外观对齐 dsh-helper 的设置卡片：
   1px 边框 + 12px 圆角。边框刻意不用官方的 0.5px —— 浅色主题下 --dsw-alias-border-l3 只有 12% 黑，
   0.5px 在白底上几乎看不见边界，而分组全靠这条线（bg-layer-* 在浅色下全是 #fff，底色指望不上）。 */
.t-team-panel{display:flex;flex-direction:column;gap:12px;min-height:0;color:var(--dsw-alias-label-primary)}
.t-team-panel-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,12px);min-width:0}
.t-team-panel-card-head{display:flex;flex-direction:column;gap:2px}
.t-team-panel-card-title{font-size:13.5px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.t-team-panel-card-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-caption)}
/* 官方 SegmentedTabs 的底槽是 grid，落在 flex 列容器里会被拉伸到整行宽（标签挤在左边）。
   这里只让它收缩到内容宽度 —— 别的布局属性一个都别写：与官方 .tabs 特异性相同，
   我们的样式表后注入，多写一条就盖掉官方一条（第一版复用 .t-team-tabs 就是这么坏的）。 */
.t-team-panel-tabs{align-self:flex-start;width:fit-content;max-width:100%}
.t-team-settings{display:flex;flex-direction:column;gap:12px;min-height:0;color:var(--dsw-alias-label-primary)}
.t-team-head{display:flex;flex-direction:column;gap:4px}
.t-team-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}
.t-team-meta{font-size:12px;color:var(--dsw-alias-label-secondary)}
.t-team-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
/* 分类管理页「新建分类」栏的两个输入框（2026-09-28 用户报「样式不正常，太大了」，随后补一句
   「明显输入框里面的字体比别的地方大」）：
   它们原先完全吃 .t-team-input 的通用默认值 ——
     · flex:1 1 200px 让两个框在整行里对半撑开（实测各约 236px，几乎占满一行）；
     · 没有显式 height / font-size，字号与行高全部继承宿主设置页（14px / 1.6），
       padding 又是给横向搜索条用的 6px 10px。
   于是它们比同页其它控件（胶囊按钮 12px 字）大一号，窄面板下还把「创建分类」挤到第二行。
   这里按同页控件那一档钉死：28px 高 / 12px 字号、padding 4px 8px、行高 18px
   （28 - 4×2 - 1×2 = 18，正好装下）；宽度「基准 190px + 上限 280px」—— 窄面板下与按钮同排，
   宽面板下也不会被拉成大长条。
   ⚠️ 选择器**必须带 .t-team-bar 前缀**（= 特异性 0,2,0）：通用规则 .t-team-input 是 0,1,0，
   但它定义在本条**后面**，同级特异性下后者胜 —— 2026-09-28 第一版就是只用 .t-team-cat-new（0,1,0），
   结果 font:inherit / padding / flex 三样全被它盖回去：框矮了（height 生效）但字没变小，
   于是用户看到的正是「框变小了、字还是大的」。前缀一加就稳（不依赖书写顺序）。
   ⚠️ 类名写在 input 自己身上（不写容器），是本仓库 CSS 与 verify 的共同约定：
   t-team-cat-new 必须是**紧跟规则体**的类名（verify 只认「.类名 + 左花括号」）。 */
.t-team-bar .t-team-cat-new{flex:1 1 190px;min-width:0;max-width:280px;height:28px;box-sizing:border-box;padding:4px 8px;font-size:12px;line-height:18px}
/* 专家页搜索框（2026-09-28 用户报「这个输入框也修复下」）：与分类新建栏同源 —— 尺寸全靠下面的
   通用默认值。字号由基类统一钉（见 .t-team-input），这里只钉高度：28px（与同排的胶囊按钮、
   分类新建栏一致，不再是继承来的 32px）。宽度继续走基类的 flex:1 1 200px，自适应占满搜索条余量。 */
/* 筛选栏里的输入框撑开余量（类名由 ui.jsx 的 TextInput 加在官方 Input 的 wrapper 上）。
   2026-09-28 从 .t-team-search 改名：原名字暗示它只属于专家页搜索框，实际分类页新建栏、
   编辑器字段也用同一个组件 —— 名字与用途对齐，改样式时才不会误伤。 */
.t-team-bar .t-team-input-field{flex:1 1 220px;min-width:0}
/* ⚠️ font-size / line-height 必须写在 font:inherit **之后**（同一规则体内后声明者胜）：
   font 简写会把 size/line-height 一起重置成继承值。2026-09-28 的教训 —— 插件内所有没显式写
   font-size 的输入框（分类新建栏、专家页搜索框、编辑器字段、@ 召唤弹窗的搜索框…）都在继承
   宿主设置页的 14px，比旁边的胶囊按钮（12px）大一号，用户是一个一个报过来的。这里从基类
   统一钉死 12px / 18px，各处不用再各写一遍。 */
.t-team-input{flex:1 1 200px;min-width:160px;box-sizing:border-box;padding:6px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;outline:none}
.t-team-input:focus{border-color:var(--dsw-alias-button-primary-fill)}
.t-team-select{box-sizing:border-box;height:30px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;max-width:180px}
.t-team-select:hover{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-chip{padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.t-team-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-chip:disabled{opacity:.5;cursor:default}
.t-team-chip[data-active="true"]{background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-button-ghost-active-border);color:var(--dsw-alias-label-primary);font-weight:600}
/* 破坏性动作（删除自建专家 / 分类）：常态就带上错误色，别等 hover 才提示。 */
.t-team-chip[data-tone="error"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent)}
.t-team-chip[data-tone="error"]:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.t-team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px 12px}
.t-team-group{margin-top:0}
.t-team-division{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
/* 分类折叠头 = **条状卡片**（2026-09-28 用户：「折叠位置有点不明显，做一个底卡片」）：
   早先只有一行裸文本 + 一个小 chevron，14 个分类排下来像一串散开的字，看不出哪块能点。
   现在整条有边框、圆角与底色，chevron 推到右端；展开态换成白底 + 深一档边框，
   一眼能看出哪个分类是开着的。
   底色用 --dsw-alias-interactive-bg-hover 而不是 bg-layer-*：浅色主题下后者是 #fff，
   与页面同色（实测过），卡片就白做了。 */
.t-team-group-head{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:9px 12px;margin:0 0 8px;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-interactive-bg-hover);color:inherit;font:inherit;cursor:pointer;text-align:left}
.t-team-group-head:hover{border-color:var(--dsw-alias-border-l2)}
.t-team-group-head[aria-expanded="true"]{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}
.t-team-group-head:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.t-team-group-chevron{margin-left:auto;flex:none;font-size:11px;line-height:1;color:var(--dsw-alias-label-caption)}
/* 统计行与「全部展开 / 全部收起」同一行：左统计、右按钮。 */
.t-team-meta-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
/* 卡片边框（2026-09-26 用户反馈「边框太明显了，不协调」）：
   原先「已启用」的卡片用 button-primary-fill 描边，但逐专家启停开关早已下线
   （见 settings.jsx 里那段注释），名单默认全部启用 —— 于是 323 张卡无一例外都挂上
   近白主色描边（深色主题下就是 --dsw-static-neutral-bluish-50 = #f9fafb），
   在 #2c2c2e 的卡片底上亮成一条条白框，既没有区分意义又很扎眼。
   现在：常态用最淡的 border-l1，悬停才抬到 border-l2；卡片与页面的层次交给
   bg-layer-2 本身去表达。若以后恢复「按专家启停」，再按需给停用的卡片加区分
   （别再用主色描边，它是给按钮用的）。 */
.t-team-card{position:relative;display:grid;min-width:0;min-height:132px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}
.t-team-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}
/* 右上角工具位：查看提示词 + 启停开关 */
.t-team-card-tools{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:6px;z-index:1}
.t-team-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:13px;line-height:1;cursor:pointer}
.t-team-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-icon-btn:disabled{opacity:.45;cursor:not-allowed}
.t-team-card-body{display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:10px;row-gap:8px;padding:12px}
/* 提示词弹窗 */
.t-team-mask{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:32px;background:var(--dsw-alias-bg-mask-1,#0000003d)}
.t-team-modal{display:flex;flex-direction:column;width:min(720px,100%);max-height:min(70vh,640px);overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary)}
.t-team-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:14px;font-weight:600}
.t-team-modal-body{margin:0;padding:14px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:19px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary)}
/* ---- 官方 Modal 的高度约束（2026-09-28 修：提示词弹窗漫出屏幕）----
   官方 .dialog 没有 max-height —— Modal.module.css 的注释把这件事明确交给调用方
   （consumers cap growth with max-height: 100%）。它同时 createPortal 到 body，
   .root 只负责居中、不滚动，所以内容一长就整体顶出视口：用户看到的是「弹窗样式崩了、
   文字漫出屏幕」，而不是一个能滚的对话框。专家 persona 动辄上万行，必然触发。
   三层的分工（缺一层都不生效）：
     .t-team-modal-fit         → dialog 相对 .root 的 padding box 兜住高度
     .t-team-modal-fit-content → .content 允许收缩（flex 子项默认 min-height:auto，会把父级撑破）
     .content > div:last-child → 官方 .body（标题栏与 footer 的兄弟），让它自己滚，
                                 于是标题固定在顶部、关闭按钮始终可点
   ⚠️ 不要把这些规则合并进上面那套 .t-team-modal-*：那是自绘兜底 Modal 的样式，
   给官方 dialog 套上去会把官方外观（380px 宽、24px 圆角、layer-2 底色）整片覆盖掉。 */
.t-team-modal-fit{max-height:100%}
.t-team-modal-fit-content{min-height:0}
.t-team-modal-fit-content > div:last-child{min-height:0;overflow:auto}
/* 提示词弹窗的复制按钮：官方标题栏只有「标题 + 关闭」两个位置、没有插槽，所以按钮渲染在
   正文之前，靠绝对定位"落"到关闭按钮左侧。定位基准是官方 .dialog —— Modal.module.css
   给它 position: relative，因此正文滚动时按钮纹丝不动。
   top/right 是照着官方 .header 的 padding 与 .close 的尺寸算的：
     top    = header 的 padding-top 22px（与关闭按钮同高起算）；
     right  = header 的 padding-right 14px + .close 的 28px 宽 + 8px 间隔 = 50px。
   ⚠️ 这三个数值来自 Modal.module.css，官方若调整标题栏尺寸，这里要跟着改
   （verify 有一条断言盯着这条规则在不在，但算不出偏移量是否仍对齐）。 */
.t-team-prompt-tools{position:absolute;top:22px;right:50px;z-index:2;display:flex;align-items:center;height:28px}
/* ---- 两个弹窗的尺寸（2026-09-28 第二轮：用户「太长 太窄」）----
   官方 .dialog 是 min(380px,100%) 宽、高度不设限 —— 那套尺寸是给「确认框」设计的
   （一句话 + 两个按钮）。我们拿它装两类**长内容**，形状就完全不对了：
     · 提示词弹窗：专家 persona 全文，动辄上万行；
     · 编辑器弹窗：多行 Markdown 正文。
   380px 宽对长行文本意味着几乎每句都折行，再配合撑满视口的高度 = 又高又窄的窄条，
   读起来像从门缝里看。
   第一轮（0.4.10）只治了「漫出屏幕」，没有治形状。这里按内容类型给尺寸：
     · 提示词是纯阅读，给最宽的一档，行尽量不折；
     · 编辑器有表单字段，稍窄一点更聚拢。
   两档高度一致，切来切去不会跳。
   ⚠️ 必须写在 .t-team-modal-fit 之后：两组都是单类选择器、特异性相同，
   max-height 谁在后面谁生效。 */
.t-team-prompt-modal{width:min(960px,94vw);max-height:min(84vh,800px)}
.t-team-editor-modal{width:min(860px,94vw);max-height:min(84vh,800px)}
/* 提示词正文：只负责排版，滚动交给上面那层 .body，所以这里不设 padding/overflow。 */
.t-team-prompt-body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:19px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary)}
.t-team-avatar{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--dsw-alias-bg-layer-3);font-size:22px;line-height:1}
.t-team-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.t-team-cloud{border:0;background:none;padding:0;margin-inline-start:4px;cursor:pointer;font-size:inherit;line-height:1}.t-team-cloud:hover{opacity:.7}
.t-team-identity{display:flex;min-width:0;flex-direction:column;padding-right:46px}
.t-team-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.t-team-card-division{font-size:13px;line-height:18px;margin-top:2px;color:var(--dsw-alias-label-secondary)}
.t-team-card-slug{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-card-desc{grid-column:1/-1;margin:0;min-height:60px;font-size:14px;line-height:20px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
/* 分类列表 = 一张卡片。这是两轮反馈得出的结论：
   第一轮「线贴住了按钮」→ 行高放开到 40px；第二轮我把外框整个删掉 → 用户「没边框了」。
   也就是说**边框是要的**，毛病只是它离内容太近。现在恢复 1px 边框 + 10px 圆角 + 轻底色，
   并给列表加 4px 内边距：框与行之间 4px、行自己还有 6px，一共 10px 留白。
   观感与面板里其它卡片（分类折叠头、专家卡片）一致。 */
.t-team-cat-list{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-2);padding:4px 0;overflow:hidden}
.t-team-cat-list[data-scroll="true"]{max-height:300px;overflow-y:auto}
/* 2026-09-28 用户：「有 2 条横线都贴到了按钮」—— 分类列表的外框上下边紧贴行里那颗
   官方 Button（28px 高），而原先行内边距只有 3px，等于线与按钮之间没有缝。
   现在行高 40px（28 + 上下各 6），线就落在留白里了。 */
.t-team-cat-row{display:flex;flex-direction:row;align-items:center;gap:8px;min-height:40px;padding:6px 10px;box-sizing:border-box;border-top:1px solid var(--dsw-alias-border-l2)}
.t-team-cat-row:first-child{border-top:0}
.t-team-cat-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-cat-name{flex:0 1 auto;min-width:0;font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-cat-key{flex:0 1 auto;min-width:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-cat-count{flex:none;margin-left:auto;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.t-team-cat-actions{flex:none;display:flex;align-items:center;gap:6px}
.t-team-cat-row .t-team-input{flex:0 1 180px;min-width:120px;height:26px;padding:2px 8px;font-size:12px}
.t-team-cat-row .t-team-chip{flex:none;white-space:nowrap}
.t-team-cat-empty{padding:8px 10px;font-size:12px;color:var(--dsw-alias-label-caption)}
.t-team-cat-list .t-team-badge{flex:none}
.t-team-badge[data-tone="custom"]{color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);background:transparent}
/* 专家卡片上的启用开关。⚠️ 类名必须**自成一套**：它曾与设置页那个开关共用 .t-team-switch，
 * 于是后定义的这套（28×16、开启色挂在 data-enabled 上）整体覆盖了设置页那套
 * （38×22、开启色挂在 data-on 上）—— 宽度被压成 28px、开启色永不生效，
 * 界面上就变成"看不见的小胶囊"。设置页那个开关已随活跃指示迁去 dsh-helper
 * （2026-09-28），但这条教训留着：这个类名不要再被别的开关复用。 */
.t-team-card-switch{position:relative;flex:none;width:28px;height:16px;padding:0;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);cursor:pointer;transition:background .15s ease,border-color .15s ease}
.t-team-card-switch-knob{position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-label-tertiary);transition:transform .15s ease,background .15s ease}
.t-team-card-switch[data-enabled="true"]{background:var(--dsw-alias-button-primary-fill);border-color:var(--dsw-alias-button-primary-fill)}
.t-team-card-switch[data-enabled="true"] .t-team-card-switch-knob{transform:translateX(12px);background:var(--dsw-alias-label-primary-foreground)}
.t-team-card-switch:disabled{opacity:.45;cursor:not-allowed}
.t-team-conflict{font-size:11px;color:var(--dsw-alias-state-warn-primary)}
.t-team-error{font-size:12px;color:var(--dsw-alias-state-error-primary)}
/* 名册健康提示（sidecar 缺失 / 文件被跳过 / 分类读不出）：功能仍在，所以不是 error；
   但它说的都是"名册正在静默缺东西"，比 note 那种灰色说明必须醒目 —— 用警告色。 */
.t-team-warn{font-size:12px;line-height:1.6;color:var(--dsw-alias-state-warn-primary)}
/* 防御：rootRef <span> 若被父级 flex/grid 容器拉成全宽（曾见 1265px），按钮位置会漂走。
   position:relative 给 pop 提供 left/bottom 定位上下文；display:inline-flex + align-self:flex-start +
   max-width:fit-content 锁定自身宽度为按钮内容宽度。 */
.t-team-btn-wrap{position:relative;display:inline-flex;align-self:flex-start;width:auto;max-width:fit-content}
.t-team-btn{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;white-space:nowrap;cursor:pointer}
.t-team-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
/* 浮层高度上限：2026-09-20 用户要求「太高了，统一调矮一点」——590px → 460px；
   2026-09-23 用户又要「再高一些，高一个卡片多一点」——460px → 600px
   （卡片 146px + 行间距 10px = 156px，再留点余量，正好多容一整行卡片）。
   专家/技能两个标签共用这一个数字，高度取 600px 与视口高度中的小者，矮屏自动收缩。
   注意：本块注释必须闭合 —— 2026-09-23 曾因这里丢了注释结尾，把下面 .t-team-pop 与
   .t-team-pop .t-team-input 两条规则一起吞掉，弹窗退化成无样式块级元素（1265×12420），
   关闭按钮被顶出屏幕。CSS 注释不可嵌套，丢了结尾就会一路吞到下一个结束符。
   2026-09-23 用户反馈「弹窗边线太明显了，太粗了」：边框从 1px + border-l2 改为
   .5px + border-l1（浅色下 alpha 10% → 4%），边框不再抢眼。
   弹窗阴影原用 var(--dsw-shadow-lv3)，它是三层叠加：0 0 1px 均匀描边、0 0 4px 均匀柔光、
   0 12px 32px 向下偏移的大投影。用户要求去掉「底部」的投影——即第三层向下 12px 那道
   （落在输入框上很明显），故这里只保留前两层均匀描边/柔光（写死数值，宿主没有只含前两层的变量）。
   Retina 上 .5px 正好是一个物理像素；宿主自己的按钮也用 .5px。 */
/* 浮层材质（2026-09-22）：宿主 0.1.7 的视觉统一改版把 --dsw-specific-menu 从
   「= 不透明的 --dsw-alias-bg-layer-3」改成了**半透明菜单材质**
   （亮色 rgba(248,249,250,.58) / 暗色 rgba(48,49,54,.5)），并配套
   --dsw-menu-backdrop-filter = blur(40px) saturate(150%) 才有毛玻璃观感。
   所以凡是 background 用了 --dsw-specific-menu 的规则，都必须紧跟一条 backdrop-filter，
   否则在 0.1.7 上就是「弹窗半透明、能看见底下的对话」（用户实测报障）。
   ⚠️ 2026-09-29：**T专家 面板自己不再走毛玻璃**（用户口径「太卡了」→ 选「面板改成不透明实色」）：
   blur(40px) 铺满整块面板是面板上仅剩的大合成开销，而面板内容本身是实心卡片、并不需要透出背后内容。
   所以 .t-team-pop 与官方材质路径（.t-team-pop-official）都改成实色 --dsw-alias-bg-layer-3，
   并把官方 MenuSurface 内部那层材质（aria-hidden 的兄弟节点，blur 就挂在它身上）关掉。
   这条「填色必须配 filter」的规矩仍然适用于**别处**还在用菜单材质的地方（如 .t-team-expert-pick-panel）。 */
.t-team-pop{position:fixed;z-index:60;width:var(--t-team-pop-w, 720px);max-width:calc(100vw - 16px);max-height:min(600px, calc(100vh - 16px));overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:10px 0 10px 10px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3, var(--dsw-specific-menu, #fff));box-shadow:0 0 1px 0 #0003, 0 0 4px 0 #00000005;color:var(--dsw-alias-label-primary)}
/* 材质交给官方 MenuSurface 时（宿主有该组件 —— 见 ui.jsx 的 PopSurface），把上面那套自绘材质清掉。
   官方材质是**父级内部**一个 aria-hidden、absolute、z-index:-1 的兄弟层；父级自己再铺一层底色
   就会把它整个盖住，换外壳这件事就等于白做。圆角一并还给官方那一档（.surface 用 --dsw-radius-lg）。 */
.t-team-pop-official{position:fixed;border:0;background:var(--dsw-alias-bg-layer-3, var(--dsw-specific-menu, #fff));backdrop-filter:none;box-shadow:none;border-radius:var(--dsw-radius-lg,12px)}
/* 关掉官方 MenuSurface 内部那层材质（它是个 aria-hidden 的绝对定位兄弟，inset:0 铺满，
   background 与 backdrop-filter 都挂在它身上）。只把父级换成实色还不够 ——
   材质层照样在跑 blur。 */
.t-team-pop-official > [aria-hidden="true"]{display:none}
/* 不写 width:100%：它量的是容器 content 宽，再叠上「> *」的 margin-right 就会横向溢出；
   靠 flex 容器默认的 align-items:stretch 自动撑满减掉 margin 后的宽度。 */
.t-team-pop .t-team-input{flex:0 0 auto;min-width:0}
/* 弹窗右侧不设内边距（见 .t-team-pop 的 padding），是为了让下面 .t-team-pop-list 的滚动条
   贴住弹窗右边缘 —— 滚动条画在滚动容器的 padding box 边缘，父级留 10px 就会把它推进来 10px，
   也就是用户看到的「滚动条没靠边」。代价是**每个不滚动的兄弟元素**都得自己补回这 10px，
   漏一个就顶边（2026-09-23 就漏了搜索框）。所以用「> *」一把兜住，再把唯一的滚动容器排除掉：
   以后往弹窗里加新行不必再记得补。
   ⚠️ 2026-09-29 起还要排除「aria-hidden」：官方 MenuSurface 的材质层就是父级里一个 aria-hidden
   的绝对定位兄弟（inset:0 铺满）—— 它吃这 10px 的 margin-right 会让材质右边少一条，露出底色。 */
.t-team-pop > *:not([aria-hidden="true"]){margin-right:10px}
.t-team-pop > .t-team-pop-list{margin-right:0}
/* 分类标签行（2026-09-29 用户要求：搜索框下面加一行分类，附参考图）。
   对齐宽度靠的是**结构**：这一行是 .t-team-pop 的直接子元素，与搜索框吃同一条「> *」右内边距、
   左边同样由容器自己的 padding-left 提供 —— 所以这里（以及里面两个容器）**不许**再写左右内边距，
   写了这一行就会比搜索框窄一截或偏一截，那正是用户盯的"对齐"。
   横向溢出照参考图处理：一行横向滚动 + 右端一个圆形箭头。
   ⚠️ 箭头按钮必须放在外层 .t-team-divbar 上：滚动容器的绝对定位子元素会**跟着内容一起滚走**。 */
.t-team-divbar{position:relative;display:flex;align-items:center;min-width:0}
/* 给箭头让位：只在对应那一侧的箭头真的出现时才加内边距 —— 没滚动时左侧不加，
   所以第一个标签仍然与搜索框左边缘对齐（用户特别点的那条「对齐宽度」）。
   38px = 箭头直径 32px + 6px 间隙（箭头放大后这里必须跟着改，否则它会压住最后一个标签）。 */
.t-team-divbar[data-more="true"] .t-team-pop-divs{padding-right:38px}
.t-team-divbar[data-back="true"] .t-team-pop-divs{padding-left:38px}
/* ⚠️ 这里**不写** scroll-behavior:smooth（2026-09-29 加了滚轮横向滚动之后去掉的）：
   滚轮要求"转多少走多少"的即时跟手，smooth 会让每一格滚轮都变成一段动画，反而发飘。
   需要平滑的是那两颗箭头按钮 —— 它们自己传 scrollBy({behavior:"smooth"})。 */
.t-team-pop-divs{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
.t-team-pop-divs::-webkit-scrollbar{display:none}
/* 分类标签与端头的圆**同高**（32px）：圆是绝对定位、不参与布局，行高由标签决定 ——
   两者不相等时圆会上下溢出到行外，看着就不像个完整的正圆（2026-09-29 用户：「要正圆」）。 */
.t-team-div-chip{flex:0 0 auto;box-sizing:border-box;height:32px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:32px;white-space:nowrap;cursor:pointer}
.t-team-div-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-div-chip[data-active="true"]{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-label-primary);font-weight:500}
/* 分类行两端的箭头（2026-09-29 三轮用户口径合并的结果）：
   ① 「< > 最好加个边线，现在看着不明显」→ 加描边；
   ② 「这种圆形风格行吗，再大一点点」（附参考图）→ 放大到 32px、箭头 18px；
   ③ 「为什么是半透明的？还有要正圆」→ 两处都改：
      · 底色换成**实色**的「--dsw-alias-bg-layer-3」。上一版用的「interactive-bg-hover」本身就是
        alpha 色（fallback #0000000d，约 5% 黑），叠在半透明菜单材质上整个圆都是透的 ——
        那是"看起来半透明"的直接原因，不是面板的问题；
      · 垂直居中不再用「top:50% + translateY(-50%)」：半像素高度下它会落在 .5px 上，圆形边缘被
        重采样、看着就不圆。改成「top:0;bottom:0;margin:auto 0」（行高与圆同高时是整数像素对齐）。
   ⚠️ 加描边必须同时给 box-sizing:border-box，否则边框会把圆撑大、把分类行顶高。 */
.t-team-div-scroll{position:absolute;top:0;bottom:0;margin:auto 0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:50%;background:var(--dsw-alias-bg-layer-3,#f7f8fa);color:var(--dsw-alias-label-secondary);font-size:18px;line-height:1;cursor:pointer;box-shadow:0 0 1px 0 #0003, 0 0 4px 0 #00000008}
/* 两个方向各贴一边：右端「还有更多」、左端「已经滚过去了，点我回去」。 */
.t-team-div-scroll[data-dir="next"]{right:0}
.t-team-div-scroll[data-dir="prev"]{left:0}
.t-team-div-scroll:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.t-team-pop .t-team-tabs{gap:2px;padding-bottom:4px}
.t-team-pop .t-team-tab{font-size:12px;padding:3px 8px}
/* 标签上的计数：比标签小一号、稍淡，tabular-nums 让数字等宽 —— 否则 401 → 99 时标签宽度会跳。 */
.t-team-pop .t-team-tab-count{font-size:11px;opacity:.72;margin-left:2px;font-variant-numeric:tabular-nums}
.t-team-pop .t-team-tabbody{gap:8px;overflow:auto;min-height:0}
.t-team-pop .t-team-picker-list{max-height:150px}
.t-team-pop-list{display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:0;padding-right:10px}
/* 专家 tab：每行固定 4 列（2026-09-23 用户要求「卡片每行 4 个」）。
   演变：先是固定 3 列 → 弹窗宽度跟输入框对齐后卡片被拉得过宽，改成随宽度自适应的
   auto-fill(minmax(220px,1fr))（720px 弹窗仍是 3 列，约 915px 起 4 列）→ 用户明确要固定 4 个，
   于是钉死列数。固定列数后与弹窗宽度解耦，minmax(0,1fr) 让四列等分且允许收缩
   （若沿用 minmax(220px,1fr)，窄弹窗下网格会被撑出横向滚动条）。
   配套三处：分区标题横跨整行；flex 子项默认 min-width:auto 会把列撑开，所以要显式收起。 */
.t-team-pop[data-tab="experts"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;align-content:start}
.t-team-pop[data-tab="experts"] .t-team-division{grid-column:1/-1}
.t-team-pop[data-tab="experts"] .t-team-pop-item{min-width:0}
/* 技能标签用同一套卡片网格（同样是头像 + 名字 + 副标题 + 三行简介）。 */
.t-team-pop[data-tab="skills"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;align-content:start}
.t-team-pop[data-tab="skills"] .t-team-pop-item{min-width:0}
/* 专家卡片（2026-09-16 用户按参考图定的风格）：圆形头像 + 名字/对照名 + 多行简介，卡片描边。
   参考图里的底部标签按用户要求不做；「召唤」也没做成按钮 —— 整张卡片可点即召唤
   （每列只有 220px 上下，塞不下一个胶囊按钮）。
   2026-09-20 用户要求「专家标签的卡片和技能里一样大」：两个 tab 本来就共用这张卡片，
   差别全在内容 —— 专家比技能多一行对照名、简介又总是占满三行，于是比技能卡高出一截。
   现在头部高度写死（=头像高，正好容得下名字 + 对照名两行）、简介固定两行占位，
   卡片高度因此恒定，专家与技能逐个一样大。
   2026-09-23 用户反馈「卡片太紧凑了，大一点」：内边距 10→14、卡片间距 6/8→10/12、
   头像与头部 32→40、名字 13→14、副标题与简介 11→12、卡片底高 93→114（14+40+8+36+14+2）。
   这几处尺寸是联动的，改一个就得改其余的，否则两个 tab 又会不等高。 */
.t-team-pop-item{display:flex;flex-direction:column;gap:8px;min-width:0;min-height:146px;box-sizing:border-box;overflow:hidden;text-align:left;padding:14px;border-radius:16px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;cursor:pointer;content-visibility:auto;contain-intrinsic-size:auto 146px}
/* content-visibility（2026-09-29，用户报「弹窗有点卡」）：专家/技能卡片是**等高**的
   （min-height:146px，头部 44 + 简介两行 + 标签行，见下面的说明），正好是它最合适的用法 ——
   屏幕外的卡片直接跳过样式/布局/绘制，打开面板时真正要渲染的从 300+ 张降到可视区的十几张。
   contain-intrinsic-size 必须写、且要贴着真实高度（146px），否则滚动条的估算长度会跳。
   老宿主（不支持该属性）会忽略这两条，行为不变。 */
.t-team-pop-item:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
/* 卡片裁边（overflow:hidden）会把宿主默认的 focus 轮廓一起裁掉，键盘 Tab 选中就看不出来了，
   所以焦点环自己画、并压在卡片内侧（offset 负值）。 */
.t-team-pop-item:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
/* 头部高度写死 44px：卡片等高的前提。技能卡里标题只有一行，撑到 44px 的是头像；
   专家卡里标题有两行（名字 + 对照名 ≈ 34px），必须钉住，否则它会比技能卡高。
   ⚠️ 「justify-content:flex-start」是 2026-09-29 补的**修 bug**、不是排版偏好：
   「.t-team-pop-head」这个名字同时被**面板标题行**（顶栏「T专家 + 关闭」）用着，而它那条规则带
   「justify-content:space-between」—— 于是卡片里的「头像 + 名称」被推成两端对齐、名称贴到了右边。
   用户当时的口径「名称都靠左」说的就是这个。这里用更高的特异性掰回来（顺序也排在它之后）。 */
.t-team-pop-item .t-team-pop-head{height:44px;justify-content:flex-start}
.t-team-pop-head{display:flex;align-items:center;gap:10px;min-width:0}
/* 头像：44px 圆。底色默认淡灰，专家卡由 inline style 用名册 frontmatter 的「color」压成淡色圆底
   （见 ui.jsx 的 tintOf，alpha 24%）；里面是专家自己的彩色 emoji。
   2026-09-29 用户口径「给这些图标加一个淡淡的背景，现在 emoji 都很小，看着不协调」三处一起调：
     ① 淡色底 14% → 24%（14% 铺在白卡片上几乎看不出圆，圆没边、里面又是小 emoji，整体就发飘）；
     ② emoji 字号 22 → 26px（44px 的圆里更饱满，上下各留 9px）；
     ③ 没有 color 时的兜底底色从近白的 layer-3 换成淡灰的 interactive-bg-hover
        （老数据、或颜色名不被支持的宿主上，也还看得见一个圆）。 */
.t-team-pop-avatar{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:26px;line-height:1}
.t-team-pop-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
/* 技能卡头像：技能没有 color 字段，固定用同一档淡灰底 + 彩色 emoji（🧰）—— 与专家卡的淡色圆同一套观感。 */
.t-team-pop-avatar-skill{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-pop-title{display:flex;flex-direction:column;gap:3px;min-width:0}
/* 名称：15px/600（参考图里它是卡片里最大的一行）。它必须靠左 —— 靠的是 .t-team-pop-item 的
   text-align:left 加上那一行对 justify-content 的修正，见上面的说明。 */
.t-team-pop-name{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-pop-sub{font-size:12px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 简介固定两行：内容多的截断（-webkit-line-clamp:2），内容少的用 min-height 占住两行的高度 ——
   这一条是「专家卡 = 技能卡」的另一半：技能描述普遍偏短，不占位的话技能卡会比专家卡矮一截。
   两行 = 12px × 1.5 × 2 = 36px。想调行数就把 line-clamp 与 min-height 一起改。 */
.t-team-pop-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
/* 卡片底部标签行（2026-09-29 参考图）：浅灰胶囊。专家卡放「分区 [+ 自建]」、技能卡放「技能 [+ 仅用户]」。
   两卡都有这一行、高度固定 20px —— 它是"两卡等高"的最后一块。
   nowrap + overflow:hidden：列很窄，宁可截断也不要换行（换行会破坏等高与 contain-intrinsic-size 的估算）。 */
.t-team-pop-tags{display:flex;flex-wrap:nowrap;gap:6px;height:20px;overflow:hidden}
.t-team-pop-tag{flex:0 0 auto;box-sizing:border-box;height:20px;padding:0 8px;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:20px;white-space:nowrap}
.t-team-pop-empty{font-size:12px;color:var(--dsw-alias-label-tertiary);padding:6px 2px}
.t-team-pop-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
/* 键盘焦点环：官方给整页一条统一规则（.t-XoWW_page :focus-visible{outline:2px solid …;offset:2px}），
   只有大标题输入框与提示词输入区例外——它们自己有 focus 表现（下划线 / 外框变蓝）。
   照抄，免得各处按钮与输入框的焦点样式各写各的。 */
/* 左栏（列表）：flex:1 撑满，右侧有详情时自然让出一半；自己不分栏滚动，滚动交给里面的 pageScroll。
   2026-09-25 用户口径：新建/编辑改成官方那种「左列表 + 右详情」的双栏。 */
/* ⚠️ 滚动容器必须是左栏里**全宽**的这一层，内容列（.t-team-sched-page）只负责居中。
 * 2026-09-25 用户发现「滚动条不在最右边」：此前滚动挂在 960px 的居中列上，滚动条就长在
 * 那一列的右边缘、离窗口右边还有一大截空白。官方那一页也是这么分的：
 * .t-XoWW_pageScroll（flex:1 + overflow:auto + scrollbar-gutter:stable）套 .t-XoWW_pageContent
 * （max-width + margin auto）。scrollbar-gutter:stable 让有/无滚动条时内容不左右跳；
 * 9px 宽与 2px 内缩也是官方那两个值（滚动条配色走宿主的 --dsh-scrollbar-* 变量）。
 * ⚠️ 这一层是**块级**容器（不加 display:flex）：官方的 pageScroll 也没有 display，内容列因此
 * 走块级的 width:auto + max-width 规则。给它加 flex 会让子项的自动外边距改变宽度算法。 */
/* ⚠️ 内容列与官方 .t-XoWW_pageContent **逐字一致**：max-width:960px + padding，块级（不加 display:flex）、
 * **不要** box-sizing:border-box 与 width:100%（2026-09-25 用户报「区域宽和官方不一样」就是那两条来的）：
 *   · 官方 max-width 限的是**内容盒** → 整列最宽 960 + 2×padding（最大 1056）；
 *   · 加了 border-box + width:100% 就变成「内容 + padding 一共 960」→ 内容只有 864，窄了 96px。
 * 块级流里各段的间距由元素自己的 margin 提供（heading 24 / filters 14 / search 16），与官方同款；
 * 这里不用 flex + gap —— 那会让同一处间距由两套机制叠加，实测就与官方差 2px。 */
/* 右栏（详情 / 新建 / 编辑）：官方 detail 那套 —— 47% 宽、左侧 .5px 分隔线、顶部 tab 行、
   中间滚动区、底部固定动作条。左右留白统一走官方的 --detail-gutter（24 / 20 / 16 三档断点），
   窄屏（<=760px）时右栏独占整页、列表让位（官方同款断点）。 */
/* 底部动作条：官方 saveFooter 的 20px 内边距 + 最后一个按钮右移 8px（视觉右边缘与内容对齐）。 */
/* 标题行：与官方 .t-XoWW_pageHeading 同款（padding-top 28 / margin-bottom 24 / gap 16）。
   内容列改成块级流之后，24px 由它自己给，不再与 page 的 gap 叠加。 */
/* 提示文字（加载中）：官方那页没有这一句，给它一个不贴住下一段的下边距。 */
/* 空态 / 无匹配：官方 .t-XoWW_empty 是**居中**的一块（flex column + 居中 + 48px 20px 内边距）。 */
/* 页尾不再挂「安全提示」与「数据文件路径」两行（2026-09-25 用户口径）：
   tip 挪到提示词输入框下面，用 .t-team-sched-hint；路径那行整个删掉。 */
/* 列表区容器：官方 pageContent 里没有这一层（heading/filters/search/list 直接是兄弟），
   所以这里**不给任何间距**——间距由各元素自己的 margin 提供，跟官方一模一样，避免两套机制叠加。 */
/* 过滤标签行 + 搜索框：官方页面的那两行，数值照抄（28px 胶囊 / 36px 圆角 12px 输入框），
 * 连间距的**来源**也照抄：filters{margin-bottom:14px}、searchField{margin:0 0 16px}。 */
/* ⚠️ 搜索框逐条对齐官方 .t-XoWW_searchField：**content-box**（官方没写 box-sizing，加了 border-box
 * 会让外高从 37 变 36）、**不设 gap**（图标与输入框之间那 6px 属于官方的 Input 组件，
 * 由图标盒自己的 margin-right 给）、margin 0 0 16px。 */
/* 图标盒：官方 Input 的 .icon 是 16×16 的 inline-flex 居中盒（里面的 svg 14px），
   图标盒与输入框之间 6px —— 照抄，否则文字起始位置会差 2~4px。 */
/* 输入元素：官方 .input 只重置了 border/outline/background，**保留了 UA 默认的 padding:1px 2px**
 * （所以占位文字的起始位置比我们按住 padding 时多 2px）。照抄：padding 用 UA 默认值，别清零。 */
/* 清空按钮：官方 .t-XoWW_searchClear 是 28×28、右移 6px（图标 14px）。 */
/* 任务行：官方 .t-XoWW_row 的观感 —— 无边框、悬停浅灰、图标 + 主副两行；操作按钮固定在行尾。
 * 官方那行是 content-box + width:100% + padding 8px（宿主没有全局 box-sizing reset：官方在
 * instruction / zoneSearch / confirmDialog 四处都**显式**补了 border-box，正说明默认是 content-box）。
 * 于是这一行的 border box 比内容列**右出血 16px** —— 那 16px 落在内容列的 padding（≥24px）里，
 * 不会溢出到滚动层，所以照抄不会有横向滚动条。别改回 border-box，那样行会比官方窄 16px。 */
/* 图标槽：官方只有 width/height/margin-top（svg 是 inline），这里也不加 flex ——
   加了会让图标相对行标题的垂直位置差 1~2px。 */
/* 行标题前的状态图标（14px，与 23px 行高的文字对齐）：
   启用 = 绿（state-success-primary），停用 = **淡红**（state-error-secondary，用户口径「淡红才明显」）。
   颜色固定、不随行的悬停态变化 —— 悬停时标题抬回正常色，图标继续表示这条任务的状态。 */
/* 已停用的行按官方「已结束」的处理方式压暗标题与摘要（悬停时再抬回来，保证可读）。 */
/* ---- 执行记录页（右栏第二个 tab）：官方「任务运行记录」那套时间线 ----
 * 度量照抄 .t-XoWW_delivery*：每条 = 图标 + 时间（14/500）+ 结果，左侧一条 .5px 竖线把各条串起来
 * （left:15.75px 是图标中心：行 margin -8 + padding 8 → 图标中心 16）。 */
/* 状态跟在时间后面（2026-09-25 用户口径）：小图标 + 文字，成功绿、失败红。
   图标用 14px（宿主那些图标本身是 16px 的 viewBox，这里缩放一下与 14px 的时间字号更贴）。 */
/* 失败原因单独一行（别把"时间 + 状态"那一行撑长）。 */
/* 会话行：id + 后面那枚「关联会话 ›」按钮（并排，窄了自动换行）。 */
/* 「这个会话打不开」的提示行：归档走 warn 色（旁边还有一枚「恢复并打开」），已删走错误色。 */
/* 那一次提交的提示词：官方 savedPrompt 那套 —— 两行截断（line-clamp:2），点「展开」看全文。 */
/* 末尾一行：说明只留最近多少次（官方的 retentionEnd 同款小字）。 */
/* 按钮：官方那两档 —— 次级是透明胶囊（h28 / r14），主按钮按官方 Button + newButton 的规格：
 * 背景走 --dsw-alias-button-primary-fill、文字走 --dsw-alias-label-primary-foreground（不是我们自己
 * 拼的 label-primary/bg-base —— 换了品牌色就会看出差别）、h32 / r16 / padding 0 12px / gap 4px。 */
/* 右栏表单里的字段组与控件：官方详情页那套（.5px 描边 + 12px 圆角输入框、36px 高、
   聚焦换成主题蓝）；分组标题是官方 ruleCard h3 那个 13px 小标题。 */
/* cron 选择器：运行时间卡片（官方 ruleRows 那套）+ 卡片下方的常用模板 + 摘要 + 最近几次预览 */
/* 运行时间卡片：度量照抄官方 .t-XoWW_ruleRows / ruleRow / ruleLabel / ruleValue / ruleInput ——
 * .5px 描边 + 16px 圆角容器、每行 min-height 48px、行间一条 .5px 分隔线（最后一行不要），
 * 左边标签 14px、右边取值（原生 select / input 做成无边框、hover 才浮出浅灰圆角底）。 */
/* 取值面（官方 ruleValue / ruleValueFace / pickerTrigger / pickerIcon 的形态）：一行右侧是
 * 「当前值 + 一个指示图标」的可点面，hover 时整面浮浅灰，点开一个同源小面板。
 * ⚠️ 刻意不用原生 select：它的箭头与下拉弹层由浏览器画，深浅主题下都没法与官方一致。 */
/* 点开的小面板：与 ExpertPicker 同源（菜单底色 + 背景模糊，刻意不带投影）。
 * 单列用 .t-team-sched-pickerList（竖排），双列（时/分）直接是两个 .t-team-sched-pickerCol 并排。 */
/* 自定义表达式的输入框：官方 ruleInput（无框、右对齐、hover 浮浅灰） */
/* 常用模板：卡片下方的小胶囊（与列表页的过滤标签同款）。
 * ⚠️ 类名必须是 .t-team-sched-preset：.t-team-sched-chip 归提示词里的专家芯片，
 * 两边同名时后定义的那条会把前面的覆盖掉（踩过：模板按钮长成蓝色芯片）。 */
/* 提示词输入区：框内第一行是专家芯片（标签观感，与对话输入框一致），下面是正文。
 * 外框对齐官方详情页的提示词输入框：圆角 16px、.5px 描边、聚焦时换成主题蓝。 */
/* 芯片观感对齐对话输入框里的引用芯片：浅灰底、圆角矩形（不是全胶囊）、蓝色文字、
 * 左侧一个圆形线条小图标；× 平时不显示，悬停才浮出来（截图里就是没有 × 的样子）。 */
/* 悬停给一圈淡描边：让"鼠标在这枚芯片上"这件事有确定的视觉反馈（别靠浏览器默认）。 */
/* 提示词编辑区：contenteditable 的富文本流（纯文字 + 芯片），芯片因此能插在正文任意位置。
 * ⚠️ 选择器要带 .t-team-sched-promptbox 前缀（原来是 .t-team-sched-field）：否则特异性低于
 * 通用的 ".t-team-sched-group textarea/input" 那类规则，编辑区会自带一圈边框（踩过：框里套框）。 */
/* 窄屏（与官方同款断点）：详情/表单独占整页，列表让位 —— 挤成两栏两边都没法用。 */
/* 官方的三档断点（数值照抄）：右栏左右留白 24 → 20 → 16；<=760 时右栏独占整页。 */
@media (width<=1100px){
  .t-team-sched-detailForm{--detail-gutter:20px}
}
@media (width<=760px){
  .t-team-sched-listPane[data-detail="true"]{display:none}
  .t-team-sched-detailForm{flex-basis:100%;border-left:0}
  .t-team-sched-detailScroll{padding-top:20px}
}
@media (width<=400px){
  .t-team-sched-detailForm{--detail-gutter:16px}
  .t-team-sched-detailTabsBar{gap:16px}
}
/* 提示词框下方的「T专家」挑选器：按钮 + 只含专家列表的浮层（类名独立，避免与既有类互相覆盖） */
.t-team-expert-pick{position:relative;display:flex;align-items:center;gap:8px;margin-top:2px}
.t-team-expert-pick-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}
/* 同任务浮层：不带投影（深色主题下会变成外发光，见 .t-team-pop 处的说明）。 */
.t-team-expert-pick-panel{position:absolute;left:0;top:calc(100% + 6px);z-index:26;display:flex;flex-direction:column;gap:6px;width:min(420px,90vw);max-height:300px;box-sizing:border-box;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-3));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(20px) saturate(1.4))}
.t-team-expert-pick-search{box-sizing:border-box;width:100%;padding:7px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}
.t-team-expert-pick-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary))}
.t-team-expert-pick-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;overflow:auto;min-height:0}
.t-team-expert-pick-item{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:6px 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.t-team-expert-pick-item[data-active="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-expert-pick-item[data-picked="true"]{color:var(--dsw-alias-label-primary);font-weight:500}
.t-team-expert-pick-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-expert-pick-meta{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.t-team-expert-pick-empty{font-size:12px;color:var(--dsw-alias-label-tertiary);padding:6px}

/* ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入）----
   只留布局类：按钮 / 输入框 / 下拉 / 状态筛选 / 开关都换成了官方 primitives 的组件，
   那几套 sg-* 控件样式随之下线（官方的在它自己的 CSS Module 里）。 */

.sg-settings{display:flex;flex-direction:column;gap:12px;min-height:0}
.sg-head{display:flex;flex-direction:column;gap:4px}
.sg-meta{font-size:12px;color:var(--dsw-alias-label-caption)}
.sg-hint{font-size:12px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
.sg-error{font-size:12px;color:var(--dsw-alias-state-error-primary);line-height:1.4}
.sg-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.sg-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sg-filter-count{font-size:12px;color:var(--dsw-alias-label-caption);margin-left:auto}
.sg-actions{display:flex;flex-wrap:wrap;gap:6px}
.sg-groups{display:flex;flex-direction:column;gap:14px;min-height:0}
.sg-group{display:flex;flex-direction:column;gap:8px}
.sg-group-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.sg-list{display:flex;flex-direction:column;gap:8px}
.sg-row{display:flex;flex-direction:column;gap:4px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2)}
.sg-row[data-off="true"]{opacity:.72}
.sg-row-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.sg-name{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-font-markdown-code-block-small, ui-monospace, Menlo, monospace)}
.sg-desc{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-caption)}
.sg-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;vertical-align:middle;color:var(--dsw-alias-label-caption);font-weight:500}
.sg-empty{font-size:13px;color:var(--dsw-alias-label-caption);padding:16px 4px}
`;
