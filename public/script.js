

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

  // ローカル escape（既存にあっても干渉しないよう、関数内に閉じ込め）
  const escapeHtml = (s) => String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");

  // --- seating-only CSS（ファイル追加しないためJS注入） ---
  (function injectSeatingStyles(){
    if (document.getElementById('seating-style')) return;
    const st = document.createElement('style');
    st.id = 'seating-style';
    st.textContent = `
      [data-seating-root] .seat-controls{
        position: sticky;
        top: 12px;
        z-index: 7;
        display:flex;
        flex-direction:column;
        gap: 12px;
        margin-bottom: 16px;
      }

      [data-seating-root] .seat-card-ui{
        border: 1px solid rgba(0,0,0,.10);
        border-radius: 22px;
        background: rgba(255,255,255,.72);
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        overflow:hidden;
      }

      [data-seating-root] .mode-switch{
        display:flex;
        gap: 10px;
        padding: 14px;
      }
      [data-seating-root] .mode-btn{
        flex: 1 1 0;
        min-width: 0;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(255,255,255,.90);
        padding: 12px 14px;
        font-weight: 900;
        font-size: clamp(14px, 3.8vw, 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(0,0,0,.04);
      }
      [data-seating-root] .mode-btn.is-active{
        border-color: rgba(0,0,0,.20);
        box-shadow: 0 12px 22px rgba(0,0,0,.07);
      }

      [data-seating-root] .mode-panel{
        display:block;
        padding: 0 16px 16px;
      }
      [data-seating-root] .mode-panel[hidden]{ display:none !important; }
      [data-seating-root] .panel-title{
        font-weight: 900;
        font-size: 13px;
        opacity:.78;
        margin: 6px 0 8px;
        white-space: nowrap;
      }

      [data-seating-root] .seat-input,
      [data-seating-root] .seat-select{
        width:100%;
        padding: 12px 42px 12px 12px;
        border: 1px solid rgba(0,0,0,.14);
        border-radius: 14px;
        background: #fff;
        font-size: 16px;
        box-shadow: 0 10px 18px rgba(0,0,0,.04);
      }

      /* Selectを周りのUIに合わせる */
      [data-seating-root] .select-wrap{ position: relative; }
      [data-seating-root] .select-wrap .seat-select{
        -webkit-appearance: none;
        appearance: none;
        background-image: none;
      }
      [data-seating-root] .select-wrap::after{
        content:"";
        position:absolute;
        right: 14px;
        top: 50%;
        width: 12px;
        height: 12px;
        transform: translateY(-50%);
        opacity: .75;
        pointer-events:none;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
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
      }
      [data-seating-root] .result-name{ font-weight: 900; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
      [data-seating-root] .result-meta{ font-size: 12px; opacity:.75; white-space: nowrap; }
      [data-seating-root] .result-cta{ font-size: 12px; opacity:.7; }

      [data-seating-root] .filter-grid{
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
        box-shadow: 0 10px 18px rgba(0,0,0,.04);
      }
      [data-seating-root] .cat-k{
        width: 38px;
        height: 38px;
        display:grid;
        place-items:center;
        border-radius: 999px;
        border: 2px solid rgba(0,0,0,.16);
        font-weight: 900;
        flex: 0 0 auto;
        background: rgba(255,255,255,.9);
      }
      [data-seating-root] .cat-label{
        flex: 1 1 auto;
        min-width: 0;
        font-weight: 900;
        white-space: nowrap;
        overflow:hidden;
        text-overflow: ellipsis;
      }
      [data-seating-root] .cat-sub{
        font-size: 12px;
        opacity: .7;
        white-space: nowrap;
      }

      /* 全体（卓の位置） */
      [data-seating-root] .overview-card{
        border: 1px solid rgba(0,0,0,.10);
        border-radius: 22px;
        background: rgba(255,255,255,.72);
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        overflow:hidden;
        margin: 14px 0 18px;
      }
      [data-seating-root] .overview-headbar{
        padding: 14px 16px 0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap: 10px;
      }
      [data-seating-root] .overview-title{
        font-weight: 900;
        font-size: 16px;
        white-space: nowrap;
      }
      [data-seating-root] .overview-hint{
        font-size: 12px;
        opacity: .65;
        white-space: nowrap;
      }

      [data-seating-root] .overview-frame{
        position: relative;
        height: clamp(270px, 58vw, 480px);
        margin: 12px 12px 10px;
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
      }
      [data-seating-root] .overview-node{
        width: var(--nodeSize, 96px);
        height: var(--nodeSize, 96px);
        border-radius: 999px;
        border: 2px solid rgba(0,0,0,.16);
        background: #fff;
        box-shadow: 0 14px 26px rgba(0,0,0,.06);
        display:grid;
        place-items:center;
        cursor:pointer;
        position:absolute;
        transform: translate(-50%,-50%);
        user-select:none;
        touch-action: manipulation;
      }
      [data-seating-root] .overview-node .node-key{
        font-size: clamp(20px, 4.2vw, 34px);
        font-weight: 900;
        white-space: nowrap;
      }
      [data-seating-root] .overview-node.is-selected{
        border-color: var(--orange, #ff7a00);
        box-shadow: 0 0 0 5px rgba(255,122,0,.15), 0 18px 34px rgba(0,0,0,.10);
        animation: nodePulse 1.1s ease both;
      }
      @keyframes nodePulse{
        0%{ transform: translate(-50%,-50%) scale(1); }
        35%{ transform: translate(-50%,-50%) scale(1.03); }
        100%{ transform: translate(-50%,-50%) scale(1); }
      }

      [data-seating-root] .overview-head{
        position:absolute;
        left: 50%;
        top: 12%;
        transform: translate(-50%,-50%);
        width: clamp(160px, 56vw, 360px);
        height: 44px;
        border-radius: 16px;
        border: 2px solid rgba(0,0,0,.20);
        background: rgba(255,255,255,.80);
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight: 900;
        box-shadow: 0 12px 24px rgba(0,0,0,.08);
        white-space: nowrap;
      }

      [data-seating-root] .overview-info{
        padding: 10px 16px 16px;
        border-top: 1px solid rgba(0,0,0,.06);
        display:flex;
        flex-direction:column;
        gap: 6px;
      }
      [data-seating-root] .info-title{
        font-weight: 900;
        white-space: nowrap;
        overflow:hidden;
        text-overflow: ellipsis;
      }
      [data-seating-root] .info-names{
        font-size: 12px;
        opacity: .78;
        line-height: 1.5;
      }
      [data-seating-root] .info-hint{
        font-size: 12px;
        opacity: .65;
        white-space: nowrap;
      }

      /* 卓カードの余白・導線 */
      [data-seating-root] .seat-card{ margin: 18px 0; }
      [data-seating-root] .seat-card:first-child{ margin-top: 12px; }
      [data-seating-root] .table-tools{
        margin-left: auto;
        display:flex;
        align-items:center;
        gap: 8px;
      }
      [data-seating-root] .btn-overview{
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.14);
        background: rgba(255,255,255,.92);
        padding: 8px 10px;
        font-weight: 900;
        font-size: 12px;
        cursor:pointer;
        white-space: nowrap;
      }
      [data-seating-root] .btn-overview:hover{
        box-shadow: 0 10px 18px rgba(0,0,0,.06);
      }

      [data-seating-root] .seat-card.is-flash{
        outline: 3px solid rgba(0,0,0,.18);
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

      /* フローティング/下部：上へ戻る */
      [data-seating-root] .fab-top{
        position: fixed;
        right: 14px;
        bottom: 14px;
        width: 52px;
        height: 52px;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(255,255,255,.92);
        box-shadow: 0 14px 26px rgba(0,0,0,.10);
        display:none;
        place-items:center;
        font-weight: 900;
        cursor:pointer;
        z-index: 9;
      }
      [data-seating-root] .bottom-top{
        margin: 18px 0 40px;
        display:flex;
        justify-content:center;
      }
      [data-seating-root] .bottom-top button{
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.14);
        background: rgba(255,255,255,.92);
        padding: 10px 14px;
        font-weight: 900;
        cursor:pointer;
        white-space: nowrap;
      }

      @media (max-width: 420px){
        [data-seating-root] .overview-head{ height: 40px; }
        [data-seating-root] .mode-switch{ padding: 12px; }
      }
    `;
    document.head.appendChild(st);
  })();

  const data = (window.WEDDING_SITE || {}).seating || {};
  const tablesRaw = data.tables || {};
  const readings = data.readings || {};

  const normalize = (s) => (String(s || '').normalize('NFKC')).trim();
  const TABLE_KEYS = ['A','B','C','D','E','F','X'];

  const tables = {};
  for (const k of TABLE_KEYS){
    const t = tablesRaw[k] || {};
    tables[k] = {
      label: String(t.label || ('TABLE ' + k)),
      seats: Array.isArray(t.seats) ? t.seats : []
    };
  }

  // config.categories[].side を優先（古いconfigはlabelから推定）
  function resolveSide(cat){
    const s = String(cat?.side || '').toLowerCase();
    if (s === 'groom' || s === 'shinro') return 'groom';
    if (s === 'bride' || s === 'shinpu') return 'bride';
    const label = String(cat?.label || '');
    if (label.includes('新郎')) return 'groom';
    if (label.includes('新婦')) return 'bride';
    return 'both';
  }

  // かな検索（読み仮名があればそれもヒット）
  function kataToHira(str){
    const s = normalize(str);
    return s.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }
  function normalizeForSearch(str){
    return kataToHira(normalize(str)).toLowerCase().replace(/\s+/g, '');
  }

  const cssEscape = (s) => (window.CSS && CSS.escape)
    ? CSS.escape(String(s))
    : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

  // UI（番号なし / 選ぶ体験）
  root.innerHTML = `
    <div class="seat-controls">
      <div class="seat-card-ui">
        <div class="mode-switch" role="tablist" aria-label="探し方">
          <button type="button" class="mode-btn is-active" data-mode="name" role="tab" aria-selected="true">お名前から探す</button>
          <button type="button" class="mode-btn" data-mode="category" role="tab" aria-selected="false">カテゴリから探す</button>
        </div>

        <div class="mode-panel" data-panel="name">
          <div class="panel-title">お名前を入力すると検索できます</div>
          <input class="seat-input" type="text" inputmode="search" placeholder="例：たかはし / 右京 など" data-seat-find />
          <div class="seat-results" data-seat-results></div>
        </div>

        <div class="mode-panel" data-panel="category" hidden>
          <div class="filter-grid">
            <div class="select-wrap">
              <select class="seat-select" data-seat-side>
                <option value="groom">新郎</option>
                <option value="bride">新婦</option>
              </select>
            </div>
            <div class="select-wrap">
              <select class="seat-select" data-seat-category></select>
            </div>
          </div>
          <div class="filter-actions" data-cat-actions></div>
          <div class="panel-title" style="margin-top:10px; opacity:.6;">
            ※卓を選ぶと、下の「全体（卓の位置）」で該当卓がオレンジに光ります。もう一度タップで卓へ移動します。
          </div>
        </div>
      </div>
    </div>

    <div class="overview-card" id="seating-overview">
      <div class="overview-headbar">
        <div class="overview-title">全体（卓の位置）</div>
        <div class="overview-hint">ホバー / タップで名前表示</div>
      </div>
      <div class="overview-frame">
        <div class="overview-ring" data-seating-overview></div>
      </div>
      <div class="overview-info" data-overview-info>
        <div class="info-title">卓を選ぶと、ここに名前が表示されます</div>
        <div class="info-names"></div>
        <div class="info-hint"></div>
      </div>
    </div>

    <div class="seat-section" id="all-tables">
      <h3>卓一覧</h3>
      <div data-seating-tables></div>
      <div class="bottom-top"><button type="button" data-scroll-top>上に戻る</button></div>
    </div>

    <button type="button" class="fab-top" data-fab-top aria-label="上へ戻る">↑</button>
  `;

  // モード切替（イベント委譲で確実に動く）
const panelName = root.querySelector('[data-panel="name"]');
const panelCat  = root.querySelector('[data-panel="category"]');

function setMode(mode){
  // 毎回DOMから拾う（再描画されても壊れない）
  root.querySelectorAll('[data-mode]').forEach(b => {
    const active = b.getAttribute('data-mode') === mode;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (panelName) panelName.hidden = mode !== 'name';
  if (panelCat)  panelCat.hidden  = mode !== 'category';
}

// 初期状態（必要なら）
setMode('name');

// クリックをrootで拾う（ボタンが差し替わっても動く）
root.addEventListener('click', (e) => {
  const t = e.target;
  const btn = (t && t.nodeType === 1) ? t.closest('[data-mode]') : null;
  if (!btn) return;
  e.preventDefault();
  setMode(btn.getAttribute('data-mode'));
});
// clickが取りこぼされる端末対策（より早く反応）
root.addEventListener('pointerup', (e) => {
  const t = e.target;
  const btn = (t && t.nodeType === 1) ? t.closest('[data-mode]') : null;
  if (!btn) return;
  e.preventDefault();
  setMode(btn.getAttribute('data-mode'));
});

  // ===== 全体（卓の位置） =====
  const overview = root.querySelector('[data-seating-overview]');
  const infoBox = root.querySelector('[data-overview-info]');
  let selectedTableKey = null;

  function getNodeSize(){
    const frame = root.querySelector('.overview-frame');
    if (!frame) return 96;
    const rect = frame.getBoundingClientRect();
    const w = rect.width || 360;
    const h = rect.height || 300;
    // 枠の中の相対サイズで自動調整（スマホは小さめにして“寄せつつ重ならない”）
    const size = Math.round(Math.min(w * 0.15, h * 0.24));
    return Math.max(56, Math.min(118, size));
  }

  function tableNamesLine(key){
    const t = tables[key] || {};
    const seats = (t.seats || []).map(normalize).filter(Boolean);
    if (!seats.length) return '（お名前は後日表示されます）';
    return seats.join(' / ');
  }

  function updateInfo(key, isSelected){
    if (!infoBox) return;
    const title = infoBox.querySelector('.info-title');
    const names = infoBox.querySelector('.info-names');
    const hint  = infoBox.querySelector('.info-hint');

    const t = tables[key] || {};
    const label = t.label || ('TABLE ' + key);

    if (title) title.textContent = label;
    if (names) names.textContent = tableNamesLine(key);
    if (hint){
      // 「シングルタップで表示」＋「もう一度タップで移動」
      hint.textContent = isSelected
        ? 'もう一度タップで卓へ移動します'
        : 'タップで選択（もう一度タップで卓へ移動）';
    }
  }

  function clearSelection(){
    selectedTableKey = null;
    overview?.querySelectorAll('.overview-node').forEach(n => n.classList.remove('is-selected'));
    if (infoBox){
      const title = infoBox.querySelector('.info-title');
      const names = infoBox.querySelector('.info-names');
      const hint  = infoBox.querySelector('.info-hint');
      if (title) title.textContent = '卓を選ぶと、ここに名前が表示されます';
      if (names) names.textContent = '';
      if (hint)  hint.textContent = '';
    }
  }

  function focusOverview(key){
    const node = overview?.querySelector(`[data-table="${cssEscape(key)}"]`);
    if (!node) return;

    overview.querySelectorAll('.overview-node').forEach(n => n.classList.remove('is-selected'));
    node.classList.add('is-selected');
    selectedTableKey = key;

    updateInfo(key, true);

    const card = document.getElementById('seating-overview');
    if (card){
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (overview){
    const headLabel = String(data.headTableLabel || '高砂').trim();
    const nodeSize = getNodeSize();
    overview.style.setProperty('--nodeSize', nodeSize + 'px');

    overview.innerHTML = `
      <div class="overview-head">${escapeHtml(headLabel || '高砂')}</div>
      ${TABLE_KEYS.map(k => `
        <button type="button" class="overview-node" data-table="${escapeHtml(k)}" aria-label="${escapeHtml(tables[k]?.label || ('TABLE ' + k))}">
          <div class="node-key">${escapeHtml(k)}</div>
        </button>
      `).join('')}
    `;

    // “寄せる”前提の配置（ノードサイズは枠基準で縮むので重なりづらい）
    const pos = {
      A: {x: 34, y: 32+5},
      X: {x: 24, y: 55+5},
      F: {x: 40, y: 68+5},
      B: {x: 50, y: 32+3},
      C: {x: 66, y: 32+5},
      D: {x: 76, y: 55+5},
      E: {x: 60, y: 68+5}
    };

    overview.querySelectorAll('[data-table]').forEach(btn => {
      const k = btn.getAttribute('data-table');
      const p = pos[k];
      if (p){
        btn.style.left = p.x + '%';
        btn.style.top  = p.y + '%';
      }

      // PC：ホバーで名前表示（移動はしない）
      btn.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType === 'touch') return;
        updateInfo(k, selectedTableKey === k);
      });

      // スマホ：シングルタップで表示、もう一度タップで卓へ移動
      btn.addEventListener('click', () => {
        if (selectedTableKey === k){
          jumpToTable(k);
        } else {
          focusOverview(k);
        }
      });
    });

    // ノード外タップで解除（スマホの使い勝手）
    overview.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.overview-node')) return;
      clearSelection();
    });
  }

  // ===== 卓一覧（個別） =====
  const tablesWrap = root.querySelector('[data-seating-tables]');
  if (tablesWrap){
    tablesWrap.innerHTML = TABLE_KEYS.map(k => renderTableCard(k)).join('');
  }

  // 各卓カード：全体を見る（→全体へスクロール＆オレンジ点灯）
  root.querySelectorAll('[data-go-overview]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-go-overview');
      if (!key) return;
      focusOverview(key);
    });
  });

  // ===== カテゴリ（新郎/新婦 → カテゴリ → 卓一覧） =====
  const sideSel = root.querySelector('[data-seat-side]');
  const catSel  = root.querySelector('[data-seat-category]');
  const actions = root.querySelector('[data-cat-actions]');
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const STORAGE_KEY = 'wedding:seating:lastCategoryBySide';

  function loadLastCatBySide(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch(e){ return {}; }
  }
  function saveLastCatBySide(side, catId){
    const cur = loadLastCatBySide();
    cur[side] = catId;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cur)); } catch(e){}
  }

  // 同名カテゴリ対策（idが無い/重複しても一意になる）
  const catList = categories.map((c, idx) => ({
    idx,
    id: String(c.id || 'cat') + '-' + idx,
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
    ).join('') || `<option value="">（カテゴリがありません）</option>`;

    const last = loadLastCatBySide();
    const prefer = last[side];
    if (prefer && filtered.some(x => x.id === prefer)){
      catSel.value = prefer;
    }
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
    saveLastCatBySide(side, cat.id);

    const keys = cat.tables.filter(k => TABLE_KEYS.includes(k));
    const uniq = [...new Set(keys)];

    actions.innerHTML = uniq.map(k => `
      <button type="button" class="cat-link" data-focus-overview="${escapeHtml(k)}">
        <div class="cat-k">${escapeHtml(k)}</div>
        <div style="min-width:0">
          <div class="cat-label">${escapeHtml(tables[k]?.label || ('TABLE ' + k))}</div>
          <div class="cat-sub">全体で位置を確認</div>
        </div>
      </button>
    `).join('') || `<div class="result-empty">（該当する卓がありません）</div>`;

    // 重要：カテゴリ→“全体で光らせる”まで。卓カードへは直行しない
    actions.querySelectorAll('[data-focus-overview]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-focus-overview');
        if (!k) return;
        focusOverview(k);
      });
    });
  }

  if (sideSel){
    sideSel.addEventListener('change', () => {
      buildCatOptions();
      renderCatActions();
    });
  }
  if (catSel){
    catSel.addEventListener('change', renderCatActions);
  }
  buildCatOptions();
  renderCatActions();

  // ===== 名前検索（直で自分の卓へ） =====
  const input = root.querySelector('[data-seat-find]');
  const results = root.querySelector('[data-seat-results]');
  const allSeats = buildSeatIndex();

  const renderResults = (qRaw) => {
    if (!results) return;
    const qn = normalizeForSearch(qRaw);
    if (!qn){
      results.innerHTML = `<div class="result-empty">お名前を入力すると検索できます</div>`;
      return;
    }
    const hits = allSeats.filter(it => it.searchKey.includes(qn)).slice(0, 50);

    if (!hits.length){
      results.innerHTML = `<div class="result-empty">見つかりませんでした（短く入力すると見つかる場合があります）</div>`;
      return;
    }

    results.innerHTML = `
      <div class="result-list">
        ${hits.map(h => `
          <button type="button" class="result-item" data-hit="${escapeHtml(h.id)}">
            <div style="min-width:0">
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

  // ===== フローティング/下部：上へ戻る =====
  const fab = root.querySelector('[data-fab-top]');
  const bottomTop = root.querySelector('[data-scroll-top]');
  function scrollTop(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (fab){
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      fab.style.display = y > 520 ? 'grid' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    fab.addEventListener('click', scrollTop);
  }
  if (bottomTop){
    bottomTop.addEventListener('click', scrollTop);
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
        const kana = readings[name] ? String(readings[name]) : '';
        const searchKey = normalizeForSearch(name + ' ' + kana);
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
            <img class="ico" src="../assets/icons/table.svg" alt="" aria-hidden="true">
          </span>
          <h2>${label}</h2>
          <div class="table-tools">
            <button type="button" class="btn-overview" data-go-overview="${escapeHtml(key)}">全体を見る</button>
          </div>
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
