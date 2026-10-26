'use strict';
/* 教师预览页：?preview（只读，列出每个题型的示例题） */
(function () {
  if (!/[?&]preview\b/.test(location.search) || !window.ShuzhiQuiz) return;
  const Q = window.ShuzhiQuiz, UI = window.ShuzhiUI;
  const root = document.createElement('main');
  root.id = 'pv';
  root.innerHTML = `
    <h1>教师预览页</h1>
    <p class="pv-note">题目随机生成，重新整理会换一批。这一页只读，学生看不到。</p>
    <div class="pv-filter" id="pvFilter"></div>
    <div id="pvList"></div>`;
  document.body.appendChild(root);

  const types = [1, 2, 3, 4, 5, 6];
  const filter = root.querySelector('#pvFilter');
  const list = root.querySelector('#pvList');
  let cur = 0;

  function chip(label, t) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pv-chip' + (t === cur ? ' on' : '');
    b.textContent = label; b.dataset.t = t;
    b.addEventListener('click', () => { cur = t; draw(); });
    return b;
  }

  function draw() {
    filter.innerHTML = '';
    filter.appendChild(chip('全部题型', 0));
    types.forEach(t => filter.appendChild(chip(`${t} ${Q.TYPE_NAMES[t]}`, t)));
    list.innerHTML = '';
    types.filter(t => !cur || cur === t).forEach(t => {
      const sec = document.createElement('section');
      sec.className = 'pv-sec';
      sec.innerHTML = `<h2>${t} ${Q.TYPE_NAMES[t]}</h2>`;
      const grid = document.createElement('div');
      grid.className = 'pv-grid';
      for (let i = 0; i < 4; i++) {
        const q = Q.MAKE[t]();
        const card = document.createElement('article');
        card.className = 'pv-card';
        const vis = document.createElement('div');
        vis.className = 'q-visual pv-vis';
        if (q.visual) UI.renderVisual(vis, q.visual); else vis.hidden = true;
        const stem = document.createElement('p');
        stem.className = 'q-stem'; stem.innerHTML = q.stem;
        const ul = document.createElement('ul');
        ul.className = 'pv-opts';
        q.options.forEach(o => {
          const li = document.createElement('li');
          li.textContent = o;
          if (o === q.answer) { li.className = 'right'; li.textContent = o + '　（正确答案）'; }
          ul.appendChild(li);
        });
        const ex = document.createElement('p');
        ex.className = 'pv-ex'; ex.textContent = '解释：' + q.explain;
        card.appendChild(vis); card.appendChild(stem); card.appendChild(ul); card.appendChild(ex);
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      list.appendChild(sec);
    });
  }
  draw();
})();
