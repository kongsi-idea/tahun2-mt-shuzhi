# 苹果果园数学（tahun2-mt-shuzhi）交接

## 现况（2026-10-26，v2.0）
- 线上：https://tahun2-mt-shuzhi.vercel.app（push main 由 GitHub Actions 自动部署）；教师预览 `?preview`。
- 对应 DSKP：二年级数学 1.4 数位（1.4.1 数位和数值、1.4.2 分析数目），课本第 1 册 p.8–12。
- 档案：`index.html`＋`style.css`＋`app.js`（出题、果园、引导、竞赛）＋`preview.js`；素材 `assets/`（Canva 风格 A 卡通贴纸），来源与封面脚本在 `tools/`（`.vercelignore` 不部署）。

## 设计决定
- 不加语音（老师定：避免 Vercel 请求量）；第一次引导用文字气泡＋手指动画，localStorage 键 `shuzhi-g-learn／solo／comp`，右上「？」重看。
- 容器里的 10 个由代码排成 2×5，不让 AI 画数量。千位栏只在 1000 时出现；不足三位不显示前导 0。
- 题库：数位题把目标那一位单独标红，避免重复数字歧义；不问不存在的数位；按数位／按数值分析与看图题的数字至少两个非零数位。
- 四人竞赛：同题 5 题三选一，不淘汰，按答对数、再按完成先后排名。

## 自检
- `app.js` 有 `selfCheck(n)`；上层 package.json 是 ESM，要先 `cp app.js /tmp/x.cjs` 再 `node -e "require('/tmp/x.cjs').selfCheck(3000)"`。

## 待课堂反馈
- 1366×768 投影第一屏可看到输入列、数字卡、分析与全部数位栏；单人挑战在下方需滚动。
- 手指图标是代码画的 SVG，风格与 Canva 素材略不同。
