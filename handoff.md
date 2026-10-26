# 苹果果园数学 交接

⏯️ **做到哪**：2026-10-26 v2.0 全面改版已上线（工具＋点子铺 Hub 2.0、4 张新缩略图、coverage／tools-status 已同步，`npm run check` 全部通过）。设计决定见 `agents.md`。

🚦 **状态**：可运行。出题自检 `selfCheck(3000)` 全过（上层 package.json 是 ESM，先 `cp app.js /tmp/x.cjs` 再 `node -e "require('/tmp/x.cjs').selfCheck(3000)"`）。

➡️ **下一步**
1. 等老师课堂试用反馈，有问题登记到 `../tools-status.json`。
2. 老师要换封面时：Canva 再生两张候选 → `tools/make_cover.py` 排字 → 同步 og.jpg 与 Hub 第 1 张缩略图。

⚠️ **坑**
- 本仓库 `.git/refs/` 曾有 iCloud 复制出的 `main 2` 旧 ref，`git fetch` 报 `bad object refs/heads/main 2`；已移走。再出现就把带「 2」的 ref 档挪出 `.git`。
- Hub 部署时 `git worktree add` 卡住（iCloud）；改从 GitHub clone 到 `~/Library/Caches/` 再 `vercel --prod`（kongsi-idea 项目网域会自动指向，curl 已确认）。

🕐 最后更新：2026-10-26 · Claude Opus 5.5 @ mr007's Macbook Air · Git：待推
