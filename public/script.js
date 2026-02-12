

function setupNavAutoCollapse(){
  const inner = document.querySelector('.topbar-inner');
  const brand = document.querySelector('.topbar .brand');
  const nav = document.getElementById('site-nav');
  if(!inner || !brand || !nav) return;

  const measureNavWidth = () => {
    // Ensure we can measure even if the nav is currently hidden (collapsed mode).
    const prev = {
      display: nav.style.display,
      visibility: nav.style.visibility,
      position: nav.style.position,
      left: nav.style.left,
      top: nav.style.top
    };
    nav.style.display = 'flex';
    nav.style.visibility = 'hidden';
    nav.style.position = 'absolute';
    nav.style.left = '-9999px';
    nav.style.top = '-9999px';
    const w = Math.ceil(nav.scrollWidth);
    nav.style.display = prev.display;
    nav.style.visibility = prev.visibility;
    nav.style.position = prev.position;
    nav.style.left = prev.left;
    nav.style.top = prev.top;
    return w;
  };

  const apply = () => {
    const alwaysCollapse = window.innerWidth <= 760;
    const brandW = Math.ceil(brand.scrollWidth);
    const navW = measureNavWidth();
    // +16: safe gap allowance between brand and nav
    const needed = brandW + navW + 16;
    const available = Math.ceil(inner.clientWidth);

    const shouldCollapse = alwaysCollapse || (needed > available);
    const wasCollapsed = document.body.classList.contains('nav-collapsed');

    if(shouldCollapse){
      document.body.classList.add('nav-collapsed');
    }else{
      document.body.classList.remove('nav-collapsed');
      // If we just expanded, close the drawer
      if(wasCollapsed) document.body.classList.remove('nav-open');
    }
  };

  const rafApply = () => requestAnimationFrame(() => requestAnimationFrame(apply));
  window.addEventListener('resize', rafApply, { passive: true });

  if('ResizeObserver' in window){
    const ro = new ResizeObserver(rafApply);
    ro.observe(inner);
  }

  // Also re-run after fonts are ready (icon fonts / Japanese text width can change).
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(rafApply).catch(() => {});
  }

  rafApply();
}

(function(){
  function get(obj, path){
    if (!obj) return "";
    const parts = (path || "").split(".");
    let cur = obj;
    for (const p of parts){
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)){
        cur = cur[p];
      } else {
        return "";
      }
    }
    return cur ?? "";
  }

  function setText(el, value){
    if (value === undefined || value === null) return;
    el.textContent = String(value);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function hideIfEmpty(){
    document.querySelectorAll("[data-hide-if-empty]").forEach(el => {
      const path = el.getAttribute("data-hide-if-empty");
      const v = get(window.WEDDING_SITE || {}, path);
      if (!v){
        el.style.display = "none";
      }
    });
  }

  function applyBindings(){
    const data = window.WEDDING_SITE || {};

    document.querySelectorAll("[data-wedding-text]").forEach(el => {
      const path = el.getAttribute("data-wedding-text");
      setText(el, get(data, path));
    });

    const couple = data.couple || {};
    const coupleLabel = [couple.groom, couple.bride].filter(Boolean).join(" & ");
    document.querySelectorAll("[data-wedding-couple]").forEach(el => setText(el, coupleLabel));

    document.querySelectorAll("[data-wedding-href]").forEach(el => {
      const path = el.getAttribute("data-wedding-href");
      const v = get(data, path);
      if (v) el.setAttribute("href", v);
    });

    const schedule = Array.isArray(data.schedule) ? data.schedule : [];
    const scheduleBody = document.querySelector("[data-wedding-schedule-body]");
    if (scheduleBody){
      scheduleBody.innerHTML = schedule.map(item => {
        const t = escapeHtml(item.time || "");
        const title = escapeHtml(item.title || "");
        const note = escapeHtml(item.note || "");
        return `<tr><td><b>${t}</b></td><td>${title}${note ? `<div class="small">${note}</div>` : ""}</td></tr>`;
      }).join("");
    }

    const faqRoot = document.querySelector("[data-wedding-faq]");
    const faqs = Array.isArray(data.faqs) ? data.faqs : [];
    if (faqRoot){
      faqRoot.innerHTML = faqs.map(item => {
        const q = escapeHtml(item.q || "");
        const a = escapeHtml(item.a || "");
        return `<div class="sep"></div><div><b>Q.</b> ${q}</div><div class="small" style="margin-top:6px"><b>A.</b> ${a}</div>`;
      }).join("");
    }

    const titleEl = document.querySelector("title[data-wedding-title]");
    if (titleEl && coupleLabel){
      titleEl.textContent = titleEl.textContent.replace("{couple}", coupleLabel);
    }

    hideIfEmpty();
  }

  function markCurrentNav(){
    const path = location.pathname.replace(/\/+$/, "/");
    document.querySelectorAll(".nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").replace(/\/+$/, "/");
      if (href && href === path){
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function setupNavToggle(){
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav') || document.querySelector('.nav');
    if (!toggle || !nav) return;

    const close = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.body.classList.contains('nav-open')) close(); else open();
    });

    // Close when selecting a link
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) close();
    });

    // Close on outside click / escape
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (e.target.closest('.topbar')) return;
      close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // If back to desktop width, ensure closed
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) close();
    });
  }

  function setupBackdrop(){
    if (document.querySelector(".backdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.innerHTML = `
      <div class="block orange"></div>
      <div class="block green"></div>
      <div class="block frame"></div>
      <div class="shapes" data-shapes></div>
    `;
    document.body.prepend(backdrop);
  }

  function setupShapes(){
    const root = document.querySelector("[data-shapes]");
    if (!root) return;

    const specs = [
      {x: 10, y: 18, s: 110, kind:"square", fill:"var(--green)", dur: 7.2, delay: 0.2},
      {x: 84, y: 14, s: 104, kind:"circle", fill:"var(--orange)", dur: 8.6, delay: 0.9},
      {x: 22, y: 62, s: 124, kind:"circle", fill:"var(--paper)", dur: 9.4, delay: 0.4},
      {x: 78, y: 68, s: 116, kind:"tri", fill:"var(--green)", dur: 8.9, delay: 1.2},
      {x: 54, y: 82, s: 106, kind:"square", fill:"var(--orange)", dur: 10.2, delay: 0.7},
      {x: 56, y: 24, s: 92, kind:"tri", fill:"var(--paper)", dur: 7.8, delay: 1.6},
    ];

    for (const sp of specs){
      const d = document.createElement("div");
      d.className = "shape " + (sp.kind === "square" ? "kaku" : sp.kind);
      d.style.setProperty("--x", String(sp.x));
      d.style.setProperty("--y", String(sp.y));
      d.style.setProperty("--size", sp.s + "px");
      d.style.setProperty("--fill", sp.fill);
      d.style.setProperty("--dur", sp.dur + "s");
      d.style.setProperty("--delay", sp.delay + "s");
      root.appendChild(d);
    }
  }

  function setupSplash(){
    const splash = document.querySelector("[data-splash]");
    if (!splash) return;

    // Show once per tab session
    const KEY = "weddingSplashDismissed";
    try{
      if (sessionStorage.getItem(KEY) === "1"){
        splash.remove();
        return;
      }
    }catch(e){}

    // Tap-through prevention: keep a tiny hold before starting fade-out.
    const HOLD_MS = 110;
    const REMOVE_MS = 420;
    let busy = false;

    const requestHide = (e) => {
      if (busy) return;
      busy = true;
      if (e){
        try{ e.preventDefault(); }catch(_){}
        try{ e.stopPropagation(); }catch(_){}
      }
      window.setTimeout(() => {
        if (splash.classList.contains("is-hidden")) return;
        splash.classList.add("is-hidden");
        try{ sessionStorage.setItem(KEY, "1"); }catch(e){}
        window.setTimeout(() => { try{ splash.remove(); }catch(e){} }, REMOVE_MS);
      }, HOLD_MS);
    };

    splash.addEventListener("pointerdown", requestHide);
    splash.addEventListener("click", requestHide);
    splash.addEventListener("touchstart", requestHide, {passive:false});
    splash.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape"){
        e.preventDefault();
        requestHide(e);
      }
    });
  }

    function setupSeatingPage(){
      const root = document.querySelector('[data-seating-root]');
      if (!root) return;

      // --- seating-only CSS (fileを増やさないためJS注入) ---
      (function injectSeatingStyles(){
        if (document.getElementById('seating-style')) return;
        const st = document.createElement('style');
        st.id = 'seating-style';
        st.textContent = `
          /* ===== Panels (①〜③) ===== */
          body.seating-page [data-seating-root] .seat-controls{
            position: sticky;
            top: 12px;
            z-index: 6;
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
          }
          body.seating-page [data-seating-root] details.seat-panel{
            border: 1px solid rgba(0,0,0,.10);
            border-radius: 22px;
            background: rgba(255,255,255,.68);
            box-shadow: 0 10px 26px rgba(0,0,0,.06);
            overflow: hidden;
          }
          body.seating-page [data-seating-root] details.seat-panel > summary{
            display:flex;
            align-items:center;
            gap: 12px;
            padding: 18px 18px;
            cursor:pointer;
            list-style:none;
            user-select:none;
            font-weight: 900; /* タイトル太字 */
            font-size: 22px;
          }
          body.seating-page [data-seating-root] details.seat-panel > summary::-webkit-details-marker{ display:none; }
          body.seating-page [data-seating-root] details.seat-panel > summary .badge{
            width: 34px;
            height: 34px;
            display:grid;
            place-items:center;
            border-radius: 999px;
            border: 2px solid rgba(0,0,0,.22);
            background: rgba(255,255,255,.6);
            font-weight: 900;
            flex: 0 0 auto;
          }
          body.seating-page [data-seating-root] details.seat-panel > summary .title{
            flex: 1 1 auto;
            line-height: 1.25;
          }

          /* ▽（開閉が分かるUI） */
          body.seating-page [data-seating-root] details.seat-panel > summary::after{
            content: "▸";
            font-size: 22px;
            opacity: .8;
            transform: translateY(1px);
            transition: transform .18s ease;
            flex: 0 0 auto;
          }
          body.seating-page [data-seating-root] details.seat-panel[open] > summary::after{
            transform: rotate(90deg) translateX(1px);
          }

          body.seating-page [data-seating-root] .panel-body{
            padding: 0 18px 18px;
          }

          /* ===== Inputs ===== */
          body.seating-page [data-seating-root] .seat-label{
            font-size: 12px;
            opacity:.85;
            margin: 0 0 6px;
          }
          body.seating-page [data-seating-root] .seat-input,
          body.seating-page [data-seating-root] .seat-select{
            width:100%;
            padding: 12px 12px;
            border: 1px solid rgba(0,0,0,.14);
            border-radius: 12px;
            background: #fff;
            font-size: 16px;
          }
          body.seating-page [data-seating-root] .seat-results{
            margin-top: 10px;
            border-top: 1px solid rgba(0,0,0,.06);
            padding-top: 10px;
          }
          body.seating-page [data-seating-root] .result-empty{ font-size: 13px; opacity:.75; padding: 8px 2px; }
          body.seating-page [data-seating-root] .result-list{ display:flex; flex-direction:column; gap:8px; }
          body.seating-page [data-seating-root] .result-item{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap: 10px;
            padding: 12px 12px;
            border: 1px solid rgba(0,0,0,.10);
            border-radius: 14px;
            background: #fff;
            cursor: pointer;
            text-align:left;
          }
          body.seating-page [data-seating-root] .result-name{ font-weight: 800; }
          body.seating-page [data-seating-root] .result-meta{ font-size: 12px; opacity:.75; }
          body.seating-page [data-seating-root] .result-cta{ font-size: 12px; opacity:.7; }

          /* ===== Filter UI ===== */
          body.seating-page [data-seating-root] .filter-row{
            display:flex;
            flex-direction:column;
            gap: 10px;
          }
          body.seating-page [data-seating-root] .filter-actions{
            margin-top: 10px;
            display:flex;
            flex-direction:column;
            gap: 8px;
          }
          body.seating-page [data-seating-root] .cat-link{
            display:flex;
            align-items:center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 14px;
            border: 1px solid rgba(0,0,0,.10);
            background:#fff;
            cursor:pointer;
            text-align:left;
          }
          body.seating-page [data-seating-root] .cat-k{
            width: 34px;
            height: 34px;
            display:grid;
            place-items:center;
            border-radius: 999px;
            border: 2px solid rgba(0,0,0,.16);
            font-weight: 900;
            flex: 0 0 auto;
          }

          /* ===== Overview ring ===== */
          body.seating-page [data-seating-root] .overview-frame{
            position: relative;
            height: clamp(280px, 44vw, 430px);
            border-radius: 22px;
            background: #fff;
            border: 1px solid rgba(0,0,0,.08);
            overflow: hidden;
          }
          body.seating-page [data-seating-root] .overview-frame::before{
            content:"";
            position:absolute;
            inset: 14px;
            border-radius: 999px;
            border: 2px dashed rgba(0,0,0,.10);
            pointer-events:none;
          }
          body.seating-page [data-seating-root] .overview-ring{
            position:absolute;
            inset: 0;
          }
          body.seating-page [data-seating-root] .overview-node{
            --size: clamp(84px, 15vw, 122px);
            width: var(--size);
            height: var(--size);
            border-radius: 999px;
            border: 2px solid rgba(0,0,0,.16);
            background: #fff;
            box-shadow: 0 14px 26px rgba(0,0,0,.06);
            display:grid;
            place-items:center;
            cursor:pointer;
            position:absolute;
            transform: translate(-50%,-50%);
          }
          body.seating-page [data-seating-root] .overview-node .node-key{
            font-size: clamp(20px, 4.2vw, 34px);
            font-weight: 900;
          }
          body.seating-page [data-seating-root] .overview-head{
            position:absolute;
            left: 50%;
            top: 12%;
            transform: translate(-50%,-50%);
            width: clamp(160px, 46vw, 320px); /* 高砂：横に広げる */
            height: 44px;
            border-radius: 16px;
            border: 2px solid rgba(0,0,0,.20);
            background: rgba(255,255,255,.78);
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight: 900;
            box-shadow: 0 12px 24px rgba(0,0,0,.08);
          }

          /* 卓カード同士の上下マージン（見た目整える） */
          body.seating-page [data-seating-root] .seat-card{ margin: 18px 0; }
          body.seating-page [data-seating-root] .seat-card:first-child{ margin-top: 12px; }

          body.seating-page [data-seating-root] .seat-card.is-flash{
            outline: 3px solid rgba(0,0,0,.22);
            animation: seatFlash 1.2s ease both;
          }
          @keyframes seatFlash{
            0%{ transform: translateY(0); }
            25%{ transform: translateY(-2px); }
            100%{ transform: translateY(0); }
          }
          body.seating-page [data-seating-root] .seat-item.is-focus{
            outline: 3px solid rgba(0,0,0,.22);
            border-radius: 10px;
          }

          body.seating-page [data-seating-root] .seat-changelog{
            margin-top: 12px;
            font-size: 12px;
            opacity: .75;
          }
        `;
        document.head.appendChild(st);
      })();

      const data = (window.WEDDING_SITE || {}).seating || {};
      const tablesRaw = data.tables || {};

      const normalize = (s) => (String(s || '').normalize('NFKC')).trim();
      const TABLE_KEYS = ['A','B','C','D','E','F','X'];

      // tables を正規化（欠けても卓は出す）
      const tables = {};
      for (const k of TABLE_KEYS){
        const t = tablesRaw[k] || {};
        tables[k] = {
          label: String(t.label || ('TABLE ' + k)),
          seats: Array.isArray(t.seats) ? t.seats : []
        };
      }

      // 新仕様：カテゴリ側の新郎/新婦判定は config の side を優先
      function resolveSide(cat){
        const s = String(cat?.side || '').toLowerCase();
        if (s === 'groom' || s === 'shinro') return 'groom';
        if (s === 'bride' || s === 'shinpu') return 'bride';
        // fallback（古いconfig互換）：labelから推定
        const label = String(cat?.label || '');
        if (label.includes('新郎')) return 'groom';
        if (label.includes('新婦')) return 'bride';
        return 'both';
      }

      const cssEscape = (s) => (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\$&');

      // 初期状態：検索だけ open。他は閉じた状態で同じバー感。
      root.innerHTML = `
        <div class="seat-controls">
          <details class="seat-panel" open data-seat-panel="search">
            <summary><span class="badge">①</span><span class="title">お名前検索（部分一致）</span></summary>
            <div class="panel-body">
              <div class="seat-label">お名前を入力すると検索できます</div>
              <input class="seat-input" type="text" inputmode="search" placeholder="例：たかはし / 右京 など" data-seat-find />
              <div class="seat-results" data-seat-results></div>
            </div>
          </details>

          <details class="seat-panel" data-seat-panel="filter">
            <summary><span class="badge">②</span><span class="title">絞り込み（新郎 / 新婦）</span></summary>
            <div class="panel-body">
              <div class="filter-row">
                <div>
                  <div class="seat-label">新郎 / 新婦</div>
                  <select class="seat-select" data-seat-side>
                    <option value="groom">新郎</option>
                    <option value="bride">新婦</option>
                  </select>
                </div>
                <div>
                  <div class="seat-label">カテゴリ</div>
                  <select class="seat-select" data-seat-category></select>
                </div>
              </div>
              <div class="filter-actions" data-cat-actions></div>
            </div>
          </details>

          <details class="seat-panel" data-seat-panel="overview">
            <summary><span class="badge">③</span><span class="title">全体を見る（卓のみ）</span></summary>
            <div class="panel-body">
              <div class="overview-frame">
                <div class="overview-ring" data-seating-overview></div>
              </div>
            </div>
          </details>
        </div>

        <div class="seat-section" id="all-tables">
          <h3>卓一覧</h3>
          <div data-seating-tables></div>
        </div>

        <div class="seat-changelog">
          ※修正点：カテゴリに同じ卓が含まれる場合でも卓カードは複製せず、各ボタンは同一の卓へ移動します。<br>
          ※追加：②のカテゴリ選択は「新郎/新婦」それぞれで保持します（切り替えても前回の選択に戻ります）。
        </div>
      `;

      // ===== Overview ring =====
      const overview = root.querySelector('[data-seating-overview]');
      if (overview){
        const headLabel = String(data.headTableLabel || '高砂').trim();
        overview.innerHTML = `
          <div class="overview-head">${escapeHtml(headLabel || '高砂')}</div>
          ${TABLE_KEYS.map(k => `
            <button type="button" class="overview-node" data-table="${escapeHtml(k)}" aria-label="TABLE ${escapeHtml(k)}">
              <div class="node-key">${escapeHtml(k)}</div>
            </button>
          `).join('')}
        `;

        // 両サイド寄せ + 輪っか感強め（必要ならここだけ微調整）
        const pos = {
          A: {x: 18, y: 40},
          X: {x: 10, y: 57},
          F: {x: 18, y: 74},
          B: {x: 50, y: 34},
          C: {x: 82, y: 40},
          D: {x: 90, y: 57},
          E: {x: 82, y: 74}
        };

        overview.querySelectorAll('[data-table]').forEach(btn => {
          const k = btn.getAttribute('data-table');
          const p = pos[k];
          if (p){
            btn.style.left = p.x + '%';
            btn.style.top  = p.y + '%';
          }
          btn.addEventListener('click', () => jumpToTable(k));
        });
      }

      // ===== Tables render (only once; never duplicated) =====
      const tablesWrap = root.querySelector('[data-seating-tables]');
      if (tablesWrap){
        tablesWrap.innerHTML = TABLE_KEYS.map(k => renderTableCard(k)).join('');
      }

      // ===== Categories (dropdown) =====
      const sideSel = root.querySelector('[data-seat-side]');
      const catSel  = root.querySelector('[data-seat-category]');
      const actions = root.querySelector('[data-cat-actions]');
      const categories = Array.isArray(data.categories) ? data.categories : [];

      // 内部IDは index を含めて重複回避（config上のidはそのままでもOK）
      const catList = categories.map((c, idx) => ({
        idx,
        id: `${String(c.id || 'cat')}-${idx}`,
        label: String(c.label || 'カテゴリ'),
        tables: Array.isArray(c.tables) ? c.tables.map(String) : [],
        side: resolveSide(c)
      }));

      // ★ ②の追加：新郎/新婦ごとにカテゴリ選択を保持（localStorage）
      const CAT_MEM_KEY = 'wedding:seating:lastCategoryBySide';
      let lastCatBySide = {};
      try {
        lastCatBySide = JSON.parse(localStorage.getItem(CAT_MEM_KEY) || '{}') || {};
      } catch (e) {
        lastCatBySide = {};
      }
      const rememberCategory = (side, catId) => {
        if (!side || !catId) return;
        lastCatBySide[side] = catId;
        try { localStorage.setItem(CAT_MEM_KEY, JSON.stringify(lastCatBySide)); } catch (e) {}
      };

      function buildCatOptions(){
        if (!catSel) return;
        const side = (sideSel?.value || 'groom');
        const filtered = catList.filter(x => x.side === side || x.side === 'both');

        catSel.innerHTML = filtered.map(x =>
          `<option value="${escapeHtml(x.id)}">${escapeHtml(x.label)}</option>`
        ).join('');

        if (!filtered.length){
          catSel.innerHTML = `<option value="">（カテゴリがありません）</option>`;
          return;
        }

        // ★保持：そのsideの前回選択を復元（無ければ先頭）
        const remembered = lastCatBySide[side];
        const exists = remembered && filtered.some(x => x.id === remembered);
        catSel.value = exists ? remembered : filtered[0].id;
      }

      function renderCatActions(){
        if (!actions) return;
        const side = (sideSel?.value || 'groom');
        const filtered = catList.filter(x => x.side === side || x.side === 'both');
        const id = catSel?.value || (filtered[0]?.id || '');
        const cat = filtered.find(x => x.id === id) || filtered[0];

        if (!cat){
          actions.innerHTML = `<div class="result-empty">（カテゴリがありません）</div>`;
          return;
        }

        const keys = cat.tables.filter(k => TABLE_KEYS.includes(k));
        const uniq = [...new Set(keys)];

        actions.innerHTML = uniq.map(k => `
          <button type="button" class="cat-link" data-jump-table="${escapeHtml(k)}">
            <div class="cat-k">${escapeHtml(k)}</div>
            <div>${escapeHtml(tables[k]?.label || ('TABLE ' + k))}</div>
          </button>
        `).join('') || `<div class="result-empty">（該当する卓がありません）</div>`;

        // 重要：同じ卓が複数カテゴリに出ても、飛び先は同一卓カード（複製しない）
        actions.querySelectorAll('[data-jump-table]').forEach(btn => {
          btn.addEventListener('click', () => jumpToTable(btn.getAttribute('data-jump-table')));
        });
      }

      // side切り替え時：切り替え前のカテゴリを保存し、切り替え後はそのsideの前回カテゴリを復元
      let prevSide = (sideSel?.value || 'groom');
      if (sideSel){
        sideSel.addEventListener('change', () => {
          // 切り替え前の選択を保存
          if (catSel && prevSide) rememberCategory(prevSide, catSel.value);
          prevSide = (sideSel.value || 'groom');

          buildCatOptions();
          renderCatActions();

          // 切り替え後に復元された選択を保存（念のため）
          if (catSel) rememberCategory(prevSide, catSel.value);
        });
      }

      // cat切り替え時：そのsideの選択として保存
      if (catSel){
        catSel.addEventListener('change', () => {
          const side = (sideSel?.value || 'groom');
          rememberCategory(side, catSel.value);
          renderCatActions();
        });
      }

      buildCatOptions();
      renderCatActions();
      // 初期選択も保存
      if (catSel) rememberCategory(prevSide, catSel.value);

      // ===== Search =====
      const input = root.querySelector('[data-seat-find]');
      const results = root.querySelector('[data-seat-results]');
      const allSeats = buildSeatIndex();

      const renderResults = (qRaw) => {
        if (!results) return;
        const q = normalize(qRaw).toLowerCase();
        if (!q){
          results.innerHTML = `<div class="result-empty">お名前を入力すると検索できます</div>`;
          return;
        }
        const hits = allSeats
          .filter(it => it.nameNorm.toLowerCase().includes(q))
          .slice(0, 50);

        if (!hits.length){
          results.innerHTML = `<div class="result-empty">見つかりませんでした（短く入力すると見つかる場合があります）</div>`;
          return;
        }

        results.innerHTML = `
          <div class="result-list">
            ${hits.map(h => `
              <button type="button" class="result-item" data-hit="${escapeHtml(h.id)}">
                <div>
                  <div class="result-name">${escapeHtml(h.name)}</div>
                  <div class="result-meta">${escapeHtml(`${h.tableKey} / 席${h.pos}`)}</div>
                </div>
                <div class="result-cta">見る</div>
              </button>
            `).join('')}
          </div>
        `;

        results.querySelectorAll('[data-hit]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-hit');
            const hit = allSeats.find(x => x.id === id);
            if (!hit) return;
            jumpToTable(hit.tableKey, hit.id);
          });
        });
      };

      if (input){
        input.addEventListener('input', () => renderResults(input.value));
        renderResults('');
      }

      // ===== helpers =====
      function buildSeatIndex(){
        const idx = [];
        for (const k of TABLE_KEYS){
          const t = tables[k] || {};
          const seats = Array.isArray(t.seats) ? t.seats : [];
          seats.map(normalize).forEach((name, i) => {
            if (!name) return;
            const pos = i + 1;
            const id = `${k}:${pos}`;
            idx.push({ id, tableKey: k, pos, name, nameNorm: name });
          });
        }
        return idx;
      }

      function renderTableCard(key){
        const t = tables[key] || {};
        const label = escapeHtml(String(t.label || ('TABLE ' + key)));
        const seats = Array.isArray(t.seats) ? t.seats : [];
        const seatEls = renderSeats(key, seats);

        return `
          <div class="card seat-card" data-table-card="${escapeHtml(key)}">
            <div class="h2row">
              <span class="h2icon">
                <img class="ico" src="/assets/icons/table.svg" alt="" aria-hidden="true">
              </span>
              <h2>${label}</h2>
            </div>
            <div class="table-layout" aria-label="${label}">
              <div class="seat-col" data-side="left">${seatEls.left}</div>
              <div class="table-core">${escapeHtml(key)}</div>
              <div class="seat-col" data-side="right">${seatEls.right}</div>
            </div>
          </div>
        `;
      }

      function renderSeats(tableKey, seatsRaw){
        const seats = seatsRaw.map(normalize).slice(0, 8);
        const items = seats.map((name, i) => {
          const pos = i + 1;
          const id = `${tableKey}:${pos}`;
          const cls = name ? '' : ' is-empty';
          return `<div class="seat-item${cls}" data-seat-id="${escapeHtml(id)}">${escapeHtml(name)}</div>`;
        });

        const n = Math.max(1, items.length);
        const leftCount = Math.min(4, Math.ceil(n / 2));
        const left = items.slice(0, leftCount).join('');
        const right = items.slice(leftCount, 8).join('');
        return { left, right };
      }

      function jumpToTable(key, seatId){
        const card = root.querySelector(`[data-table-card="${cssEscape(key)}"]`);
        if (!card) return;

        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        flashCard(card);

        if (seatId){
          const seatEl = card.querySelector(`[data-seat-id="${cssEscape(seatId)}"]`);
          if (seatEl) focusSeat(seatEl);
        }
      }

      function flashCard(card){
        card.classList.add('is-flash');
        window.setTimeout(() => card.classList.remove('is-flash'), 1200);
      }
      function focusSeat(seatEl){
        seatEl.classList.add('is-focus');
        window.setTimeout(() => seatEl.classList.remove('is-focus'), 1400);
      }
    }

  function setupMenuImageViewer(){
    const img = document.querySelector("[data-menu-image]");
    if (!img) return;

    const open = () => {
      const viewer = document.createElement("div");
      viewer.className = "viewer";
      viewer.innerHTML = `
        <div class="viewer-toolbar">
          <div class="viewer-title">SPECIAL MENU</div>
          <button type="button" class="btn viewer-close">閉じる</button>
        </div>
        <div class="viewer-stage" aria-label="画像ビューア">
          <img src="${img.getAttribute("src")}" alt="SPECIAL MENU" />
        </div>
        <div class="viewer-hint">ホイールで拡大/縮小、ドラッグで移動（Escで閉じる）</div>
      `;

      const stage = viewer.querySelector(".viewer-stage");
      const vimg = viewer.querySelector("img");
      const closeBtn = viewer.querySelector(".viewer-close");

      let scale = 1;
      let tx = 0;
      let ty = 0;
      let dragging = false;
      let startX = 0;
      let startY = 0;

      const apply = () => {
        vimg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      };

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

      const onWheel = (e) => {
        e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        const next = clamp(scale * (dir > 0 ? 1.12 : 0.89), 1, 4);
        scale = next;
        apply();
      };

      const onDown = (e) => {
        dragging = true;
        stage.setPointerCapture?.(e.pointerId);
        startX = e.clientX - tx;
        startY = e.clientY - ty;
      };
      const onMove = (e) => {
        if (!dragging) return;
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        apply();
      };
      const onUp = () => { dragging = false; };

      const close = () => {
        try{ document.body.style.overflow = ""; }catch(e){}
        try{ viewer.remove(); }catch(e){}
      };

      closeBtn.addEventListener("click", close);
      viewer.addEventListener("click", (e) => {
        if (e.target === viewer) close();
      });
      stage.addEventListener("wheel", onWheel, {passive:false});
      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerup", onUp);
      stage.addEventListener("pointercancel", onUp);
      viewer.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });

      // double click toggles zoom
      stage.addEventListener("dblclick", () => {
        if (scale === 1){
          scale = 2;
        } else {
          scale = 1;
          tx = 0;
          ty = 0;
        }
        apply();
      });

      try{ document.body.style.overflow = "hidden"; }catch(e){}
      document.body.appendChild(viewer);
      viewer.tabIndex = -1;
      viewer.focus();
      apply();
    };

    img.style.cursor = "zoom-in";
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        open();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    const useBackdrop = !document.body.classList.contains('no-backdrop');
    if (useBackdrop) setupBackdrop();
    applyBindings();
    markCurrentNav();
    setupNavToggle();
  setupNavAutoCollapse();
    setupSplash();
    setupSeatingPage();
    setupMenuImageViewer();
    if (useBackdrop) setupShapes();
  });
})();
