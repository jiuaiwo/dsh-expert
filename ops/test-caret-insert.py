"""真机才现形的 bug：定时任务提示词里插专家芯片，总是插到**最前面**。

为什么单独留这个测试：它在 headless 里不一定复现 —— 取决于 Chromium 在 focus() 之后
是"把光标丢回开头"还是"保留旧位置"。真机（Electron/真实点击）属于前者，所以：
  · 旧策略（focus 后直接用「当前选区」）→ 芯片落到最前面；
  · 新策略（focus 后**先恢复**「失焦前记住的选区」再插）→ 芯片落在用户光标处。
需要 Playwright（维护者本机跑）：python3 ops/test-caret-insert.py

"""在真实浏览器里复现「芯片总插到最前面」，并验证修法。

场景：用户在正文中间点了光标 → 点挑选器 → 编辑器失焦 → 插入芯片。
对比两种插入策略：
  A（旧）直接聚焦编辑器、用「当前选区」插入
  B（新）聚焦后先把「失焦前记住的选区」恢复回来，再插入
"""
from playwright.sync_api import sync_playwright

PAGE = """<!doctype html><meta charset=utf-8>
<div id="box" contenteditable="true">开头文字 中间文字 结尾文字</div>
<button id="picker">挑选器</button>
<script>
window.savedRange = null;
const box = document.getElementById("box");
// 模拟「只要选区还在编辑器内就记住它」
document.addEventListener("selectionchange", () => {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const r = sel.getRangeAt(0);
  if (box.contains(r.commonAncestorContainer)) window.savedRange = r.cloneRange();
});
window.putCaretInMiddle = () => {
  box.focus();
  const node = box.firstChild;
  const r = document.createRange();
  r.setStart(node, 7);   // 「开头文字 中」之后
  r.collapse(true);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
};
window.blurToPicker = () => document.getElementById("picker").focus();
window.makeChip = () => {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.expert = "X";
  chip.textContent = "[chip]";
  return chip;
};
window.resetCaretToStart = () => {
  const r = document.createRange();
  r.setStart(box.firstChild, 0); r.collapse(true);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
};
window.insertOld = () => {                 // A：只看当前选区（focus 会把光标丢到开头）
  box.focus();
  resetCaretToStart();
  const sel = getSelection(); const space = document.createTextNode(" ");
  const chip = makeChip();
  const r = sel.getRangeAt(0);
  r.deleteContents(); r.insertNode(chip); chip.after(space);
  r.setStartAfter(space); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
};
window.insertNew = () => {                 // B：先恢复记住的选区
  box.focus();
  resetCaretToStart();
  const sel = getSelection();
  if (savedRange && box.contains(savedRange.commonAncestorContainer)) {
    sel.removeAllRanges(); sel.addRange(savedRange);
  }
  const space = document.createTextNode(" ");
  const chip = makeChip();
  const r = sel.getRangeAt(0);
  r.deleteContents(); r.insertNode(chip); chip.after(space);
  r.setStartAfter(space); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
};
</script>"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_content(PAGE)

    def run(strategy):
        page.evaluate("() => { document.getElementById('box').innerHTML = '开头文字 中间文字 结尾文字'; window.savedRange = null; }")
        page.evaluate("() => window.putCaretInMiddle()")
        page.evaluate("() => window.blurToPicker()")       # 点挑选器：编辑器失焦
        page.evaluate(f"() => window.{strategy}()")
        return page.evaluate("""() => {
          const box = document.getElementById('box');
          const chip = box.querySelector('[data-expert]');
          // 芯片前面有多少字符 → 0 表示插到了最前面
          let before = '';
          for (const node of box.childNodes) {
            if (node === chip) break;
            before += node.textContent;
          }
          return { before: before.trim(), text: box.textContent };
        }""")

    old = run("insertOld")
    new = run("insertNew")
    browser.close()

print("旧策略（只看当前选区）：芯片前面 =", repr(old["before"]))
print("   →", old["text"])
print("新策略（先恢复记住的选区）：芯片前面 =", repr(new["before"]))
print("   →", new["text"])
print()
ok_old_repro = old["before"] == ""          # 复现：插到了最前面
ok_new_fixed = new["before"] == "开头文字 中间"  # 修好：落在原来光标处（字符 7 之后）
print("复现旧 bug（芯片跑到最前面）:", "✓" if ok_old_repro else "✗")
print("新策略把它插在光标处  :", "✓" if ok_new_fixed else "✗")
