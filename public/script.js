

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
      /* =========================================
         Seating page scoped styles
         (bodyクラスに依存せず [data-seating-root] でスコープ)
         ========================================= */

      /* ===== Panels (①〜③) ===== */
      [data-seating-root] .seat-controls{
        position: sticky;
        top: 12px;
        z-index: 6;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }
      [data-seating-root] details.seat-panel{
        border: 1px solid rgba(0,0,0,.10);
        border-radius: 22px;
        background: rgba(255,255,255,.68);
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        overflow: hidden;
      }
      [data-seating-root] details.seat-panel > summary{
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
      [data-seating-root] details.seat-panel > summary::-webkit-details-marker{ display:none; }
      [data-seating-root] details.seat-panel > summary .badge{
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
      [data-seating-root] details.seat-panel > summary .title{
        flex: 1 1 auto;
        line-height: 1.25;
      }

      /* ▽（開閉が分かるUI） */
      [data-seating-root] details.seat-panel > summary::after{
        content: "▸";
        font-size: 22px;
        opacity: .8;
        transform: translateY(1px);
        transition: transform .18s ease;
        flex: 0 0 auto;
      }
      [data-seating-root] details.seat-panel[open] > summary::after{
        transform: rotate(90deg) translateX(1px);
      }

      [data-seating-root] .panel-body{
        padding: 0 18px 18px;
      }

      /* ===== Inputs / Selects (周りに合わせて整える) ===== */
      [data-seating-root] .seat-label{
        font-size: 12px;
        opacity:.85;
        margin: 0 0 6px;
      }
      [data-seating-root] .seat-input,
      [data-seating-root] .seat-select{
        width:100%;
        padding: 12px 14px;
        border: 1px solid rgba(0,0,0,.14);
        border-radius: 14px;
        background: #fff;
        font-size: 16px;
        box-shadow: 0 6px 14px rgba(0,0,0,.05);
        outline: none;
      }
      [data-seating-root] .seat-input:focus,
      [data-seating-root] .seat-select:focus{
        border-color: rgba(0,0,0,.25);
        box-shadow: 0 8px 18px rgba(0,0,0,.08);
      }

      /* select の見た目を統一（ネイティブ感を減らす） */
      [data-seating-root] .seat-select{
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 42px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 16px 16px;
      }

      [data-seating-root] .seat-results{
        margin-top: 10px;
        border-top: 1px solid rgba(0,0,0,.06);
        padding-top: 10px;
      }
      [data-seating-root] .result-empty{ font-size: 13px; opacity:.75; padding: 8px 2px; }
      [data-seating-root] .result-list{ display:flex; flex-direction:column; gap:8px; }
      [data-seating-root] .result-item{
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
        box-shadow: 0 8px 18px rgba(0,0,0,.06);
      }
      [data-seating-root] .result-name{ font-weight: 900; }
      [data-seating-root] .result-meta{ font-size: 12px; opacity:.75; margin-top: 2px; }
      [data-seating-root] .result-cta{ font-size: 12px; opacity:.7; }

      /* ===== Filter UI ===== */
      [data-seating-root] .filter-row{
        display:flex;
        flex-direction:column;
        gap: 10px;
      }
      [data-seating-root] .filter-actions{
        margin-top: 10px;
        display:flex;
        flex-direction:column;
        gap: 8px;
      }
      [data-seating-root] .cat-link{
        display:flex;
        align-items:center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(0,0,0,.10);
        background:#fff;
        cursor:pointer;
        text-align:left;
        box-shadow: 0 8px 18px rgba(0,0,0,.06);
      }
      [data-seating-root] .cat-k{
        width: 34px;
        height: 34px;
        display:grid;
        place-items:center;
        border-radius: 999px;
        border: 2px solid rgba(0,0,0,.16);
        font-weight: 900;
        flex: 0 0 auto;
      }

      /* ===== Overview ring (枠の中で円形イメージ) ===== */
      [data-seating-root] .overview-frame{
        position: relative;
        height: clamp(300px, 46vw, 460px);
        border-radius: 22px;
        background: #fff;
        border: 1px solid rgba(0,0,0,.08);
        overflow: hidden;
      }
      [data-seating-root] .overview-frame::before{
        content:"";
        position:absolute;
        inset: 14px;
        border-radius: 999px;
        border: 2px dashed rgba(0,0,0,.10);
        pointer-events:none;
      }
      [data-seating-root] .overview-ring{
        position:absolute;
        inset: 0;
        /* ノードサイズはJS側で上書き（枠内の相対サイズを活かす） */
        --node-size: clamp(86px, 14vw, 124px);
      }
      [data-seating-root] .overview-node{
        width: var(--node-size);
        height: var(--node-size);
        border-radius: 999px;
        border: 2px solid rgba(0,0,0,.16);
        background: #fff;
        box-shadow: 0 14px 26px rgba(0,0,0,.06);
        display:grid;
        place-items:center;
        cursor:pointer;
        position:absolute;
        transform: translate(-50%,-50%);
        touch-action: manipulation;
      }
      [data-seating-root] .overview-node:active{ transform: translate(-50%,-50%) scale(.98); }
      [data-seating-root] .overview-node .node-key{
        font-size: clamp(20px, 4.2vw, 34px);
        font-weight: 900;
        letter-spacing: .02em;
      }
      [data-seating-root] .overview-head{
        position:absolute;
        left: 50%;
        top: 12%;
        transform: translate(-50%,-50%);
        width: clamp(180px, 58vw, 440px); /* 高砂：横に広げる */
        height: 46px;
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
      [data-seating-root] .seat-card{ margin: 18px 0; }
      [data-seating-root] .seat-card:first-child{ margin-top: 12px; }

      [data-seating-root] .seat-card.is-flash{
        outline: 3px solid rgba(0,0,0,.22);
        animation: seatFlash 1.2s ease both;
      }
      @keyframes seatFlash{
        0%{ transform: translateY(0); }
        25%{ transform: translateY(-2px); }
        100%{ transform: translateY(0); }
      }
      [data-seating-root] .seat-item.is-focus{
        outline: 3px solid rgba(0,0,0,.22);
        border-radius: 10px;
      }

      /* ページ下部：上へ戻るボタン */
      [data-seating-root] .seat-bottom-actions{
        margin: 18px 0 8px;
        display:flex;
        justify-content:center;
      }
      [data-seating-root] .seat-backtop{
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(255,255,255,.9);
        border-radius: 999px;
        padding: 12px 16px;
        font-weight: 900;
        cursor:pointer;
        box-shadow: 0 10px 24px rgba(0,0,0,.08);
      }

      /* フローティング：ページ上部へ戻る */
      .seat-fab{
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 40;
        width: 52px;
        height: 52px;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.16);
        background: rgba(255,255,255,.92);
        box-shadow: 0 14px 30px rgba(0,0,0,.12);
        font-weight: 900;
        cursor:pointer;
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
        transition: opacity .18s ease, transform .18s ease;
      }
      .seat-fab.is-show{
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      [data-seating-root] .seat-changelog{
        margin-top: 12px;
        font-size: 12px;
        opacity: .75;
      }
    `;
    document.head.appendChild(st);
  })();

  const data = (window.WEDDING_SITE || {}).seating || {};
  const tablesRaw = data.tables || {};
  const readingsMap = (data.readings && typeof data.readings === 'object') ? data.readings : {};

  const normalize = (s) => (String(s || '').normalize('NFKC')).trim();
  const stripSpaces = (s) => normalize(s).replace(/\s+/g, '');
  const toHiragana = (s) => stripSpaces(s).replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const normSearch = (s) => toHiragana(s).toLowerCase();

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
    // fallback（古いconfig互換）：label/idから推定
    const label = String(cat?.label || '');
    const id = String(cat?.id || '').toLowerCase();
    if (label.includes('新郎') || id.startsWith('groom')) return 'groom';
    if (label.includes('新婦') || id.startsWith('bride')) return 'bride';
    return 'both';
  }

  const cssEscape = (s) => (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

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
      <div class="seat-bottom-actions">
        <button type="button" class="seat-backtop" data-seat-backtop>↑ 上へ戻る</button>
      </div>
    </div>

    <div class="seat-changelog">
      ※カテゴリに同じ卓が含まれる場合でも卓カードは複製せず、各ボタンは同一の卓へ移動します。
    </div>
  `;

  // フローティング（上へ戻る）
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'seat-fab';
  fab.setAttribute('aria-label', 'ページ上部へ戻る');
  fab.textContent = '↑';
  document.body.appendChild(fab);

  function scrollToTop(){
    const controls = root.querySelector('.seat-controls');
    if (controls){
      // ③を開いて戻す（卓→全体へ戻る導線）
      const ov = root.querySelector('details[data-seat-panel="overview"]');
      if (ov) ov.open = true;
      controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }else{
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  fab.addEventListener('click', scrollToTop);

  const backTopBtn = root.querySelector('[data-seat-backtop]');
  if (backTopBtn) backTopBtn.addEventListener('click', scrollToTop);

  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    fab.classList.toggle('is-show', y > 220);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ===== Overview ring =====
  const overview = root.querySelector('[data-seating-overview]');
  const frame = root.querySelector('.overview-frame');
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

    overview.querySelectorAll('[data-table]').forEach(btn => {
      const k = btn.getAttribute('data-table');
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

  // 保持：新郎/新婦ごとのカテゴリ選択
  const LS_KEY = 'wedding:seating:lastCategoryBySide';
  function loadLastBySide(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; }catch(e){ return {}; }
  }
  function saveLastBySide(obj){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(obj || {})); }catch(e){}
  }
  let lastBySide = loadLastBySide();

  // 内部IDは index を含めて重複回避（config上のidはそのままでもOK）
  const catList = categories.map((c, idx) => ({
    idx,
    id: `${String(c.id || 'cat')}-${idx}`,
    rawId: String(c.id || ''),
    label: String(c.label || 'カテゴリ'),
    tables: Array.isArray(c.tables) ? c.tables.map(String) : [],
    side: resolveSide(c)
  }));

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

    // sideごとの前回選択を復元（同一side内でのみ）
    const lastId = lastBySide?.[side];
    if (lastId && filtered.some(x => x.id === lastId)){
      catSel.value = lastId;
    }else{
      catSel.value = filtered[0].id;
    }
  }

  function persistCurrentCategory(){
    if (!catSel || !sideSel) return;
    const side = sideSel.value || 'groom';
    const val = catSel.value || '';
    lastBySide = { ...(lastBySide || {}), [side]: val };
    saveLastBySide(lastBySide);
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

    persistCurrentCategory();

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

  if (sideSel){
    sideSel.addEventListener('change', () => {
      buildCatOptions();
      renderCatActions();
    });
  }
  if (catSel){
    catSel.addEventListener('change', () => {
      persistCurrentCategory();
      renderCatActions();
    });
  }

  buildCatOptions();
  renderCatActions();

  // ===== Search =====
  const input = root.querySelector('[data-seat-find]');
  const results = root.querySelector('[data-seat-results]');
  const allSeats = buildSeatIndex();

  const renderResults = (qRaw) => {
    if (!results) return;
    const q = normSearch(qRaw);
    if (!q){
      results.innerHTML = `<div class="result-empty">お名前を入力すると検索できます</div>`;
      return;
    }
    const hits = allSeats
      .filter(it => it.searchKey.includes(q))
      .slice(0, 50);

    if (!hits.length){
      results.innerHTML = `<div class="result-empty">見つかりませんでした（短く入力すると見つかる場合があります）</div>`;
      return;
    }

    results.innerHTML = `
      <div class="result-list">
        ${hits.map(h => {
          const meta = h.kana ? `${h.tableKey} / 席${h.pos} ・ ${h.kana}` : `${h.tableKey} / 席${h.pos}`;
          return `
            <button type="button" class="result-item" data-hit="${escapeHtml(h.id)}">
              <div>
                <div class="result-name">${escapeHtml(h.name)}</div>
                <div class="result-meta">${escapeHtml(meta)}</div>
              </div>
              <div class="result-cta">見る</div>
            </button>
          `;
        }).join('')}
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

  // ===== overview layout (枠内で相対的に詰める：重ならない範囲で最大限寄せる) =====
  function debounce(fn, wait){
    let t = null;
    return function(){
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function layoutOverviewRing(){
    if (!overview || !frame) return;

    const nodes = {};
    overview.querySelectorAll('.overview-node[data-table]').forEach(btn => {
      nodes[btn.getAttribute('data-table')] = btn;
    });
    const head = overview.querySelector('.overview-head');

    const w = frame.clientWidth || 1;
    const h = frame.clientHeight || 1;

    // 枠内相対サイズ：横幅からノードサイズを決める（上限/下限あり）
    const dynSize = clamp(Math.round(w / 7.2), 84, 126);
    overview.style.setProperty('--node-size', dynSize + 'px');

    // サイズ反映後に計測
    const anyNode = nodes['A'] || nodes['B'] || Object.values(nodes)[0];
    const nodeSize = anyNode ? anyNode.getBoundingClientRect().width : dynSize;
    const nodeR = nodeSize / 2;

    // なるべく寄せるが重ならない（中心距離）
    const minDist = nodeSize * 1.04;

    // 中心（高砂があるので少し下へ）
    const cx = w * 0.50;
    const cy = h * 0.60;

    // 角度（固定：配置のイメージは維持）
    const anglesDeg = { A:150, X:180, F:210, C:-30, D:0, E:30 };

    // head の下端 + gap をBの最低位置に
    let bMinY = h * 0.34;
    try{
      if (head){
        const fr = frame.getBoundingClientRect();
        const hr = head.getBoundingClientRect();
        const headBottom = (hr.bottom - fr.top);
        bMinY = headBottom + nodeR + 12;
      }
    }catch(e){}

    // 半径ベース（枠の中で相対的に）
    const pad = 14;
    const rxBase = Math.min((w/2) - nodeR - pad, w * 0.42);
    const ryBase = Math.min((h * 0.42) - nodeR - pad, h * 0.30);

    // できるだけ詰める（scale小→重なったら少し広げる）
    let scale = 0.60;
    let placed = null;

    for (let iter = 0; iter < 10; iter++){
      const rx = rxBase * scale;
      const ry = ryBase * scale;

      const p = {};
      for (const k of Object.keys(anglesDeg)){
        const rad = anglesDeg[k] * Math.PI / 180;
        p[k] = { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
      }

      // B は上寄り（輪の内側）
      p.B = { x: cx, y: Math.max(bMinY, h * 0.40) };

      // 画面外に出ないようにクランプ
      const minX = nodeR + pad, maxX = w - nodeR - pad;
      const minY = nodeR + pad, maxY = h - nodeR - pad;
      for (const k of Object.keys(p)){
        p[k].x = clamp(p[k].x, minX, maxX);
        p[k].y = clamp(p[k].y, minY, maxY);
      }

      // 重なりチェック
      const keys = Object.keys(p);
      let ok = true;
      for (let i = 0; i < keys.length && ok; i++){
        for (let j = i + 1; j < keys.length; j++){
          const a = p[keys[i]], b = p[keys[j]];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < minDist){
            ok = false;
            break;
          }
        }
      }

      if (ok){
        placed = p;
        break;
      }
      scale += 0.05; // 少し広げる（重なり回避）
    }

    if (!placed){
      // 最後の手段：一旦広めで確定
      const rx = rxBase * 0.85, ry = ryBase * 0.85;
      placed = {};
      for (const k of Object.keys(anglesDeg)){
        const rad = anglesDeg[k] * Math.PI / 180;
        placed[k] = { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
      }
      placed.B = { x: cx, y: Math.max(bMinY, h * 0.40) };
    }

    // 反映（%で持つ：リサイズ耐性）
    for (const k of Object.keys(placed)){
      const btn = nodes[k];
      if (!btn) continue;
      btn.style.left = (placed[k].x / w * 100) + '%';
      btn.style.top  = (placed[k].y / h * 100) + '%';
    }
  }

  const relayout = debounce(layoutOverviewRing, 80);
  window.addEventListener('resize', relayout);
  // 初期実行（描画後）
  setTimeout(layoutOverviewRing, 0);

  // ===== helpers =====
  function seatEntryToNameKana(entry){
    if (entry && typeof entry === 'object'){
      const name = normalize(entry.name || '');
      const kana = normalize(entry.kana || '');
      return { name, kana };
    }
    const name = normalize(entry);
    const kana = normalize(readingsMap?.[name] || '');
    return { name, kana };
  }

  function buildSeatIndex(){
    const idx = [];
    for (const k of TABLE_KEYS){
      const t = tables[k] || {};
      const seats = Array.isArray(t.seats) ? t.seats : [];
      seats.forEach((raw, i) => {
        const { name, kana } = seatEntryToNameKana(raw);
        if (!name) return;
        const pos = i + 1;
        const id = `${k}:${pos}`;
        const searchKey = (normSearch(name) + ' ' + normSearch(kana)).trim();
        idx.push({ id, tableKey: k, pos, name, kana, searchKey });
      });
    }
    return idx;
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
    const seats = (seatsRaw || []).slice(0, 8);
    const items = seats.map((raw, i) => {
      const { name } = seatEntryToNameKana(raw);
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
