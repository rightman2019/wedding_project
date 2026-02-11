

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

    const data = (window.WEDDING_SITE || {}).seating || {};
    const tablesRaw = data.tables || {};

    const normalize = (s) => (String(s || '').normalize('NFKC')).trim();

    // 卓は固定（A/B/C/D/E/F/X）で表示を維持（入力途中でも卓自体は出す）
    const TABLE_KEYS = ['A','B','C','D','E','F','X'];
    const visibleKeys = TABLE_KEYS.slice();

    // tables を正規化（欠けていてもプレースホルダで補完）
    const tables = {};
    for (const k of visibleKeys){
      const t = tablesRaw[k] || {};
      tables[k] = {
        label: String(t.label || ('TABLE ' + k)),
        seats: Array.isArray(t.seats) ? t.seats : []
      };
    }

    const cssEscape = (s) => (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

    // --- mode toggle ---
    const modeBtns = root.querySelectorAll('[data-mode-btn]');
    const modePanels = root.querySelectorAll('[data-mode-panel]');
    const setMode = (mode) => {
      modeBtns.forEach(b => b.classList.toggle('is-active', b.getAttribute('data-mode-btn') === mode));
      modePanels.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-mode-panel') === mode));
    };
    modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.getAttribute('data-mode-btn'))));

    // --- categories / sections ---
    // 重要：同じ卓が複数カテゴリに属することがあるため、
    // ここでは「卓カード」をカテゴリごとに複製しない。カテゴリは「卓へのジャンプ」だけを提供する。
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const assigned = new Set();
    for (const c of categories){
      for (const k of (c.tables || [])) assigned.add(String(k));
    }
    const otherTables = visibleKeys.filter(k => !assigned.has(String(k)));
    const finalCats = [...categories];
    if (otherTables.length){
      finalCats.push({ id: 'other', label: 'その他', tables: otherTables });
    }

    const chips = root.querySelector('[data-seating-chips]');
    const sections = root.querySelector('[data-seating-sections]');
    if (chips && sections){
      chips.innerHTML = finalCats.map((c, idx) => {
        const id = escapeHtml(String(c.id || ('cat' + idx)));
        const label = escapeHtml(String(c.label || 'カテゴリ'));
        return `<button type="button" class="chip${idx===0?' is-active':''}" data-chip="${id}">${label}</button>`;
      }).join('');

      // 1) カテゴリセクション：卓へのジャンプボタンのみ（卓カードは出さない）
      const catSectionsHtml = finalCats.map((c, idx) => {
        const id = String(c.id || ('cat' + idx));
        const label = escapeHtml(String(c.label || 'カテゴリ'));
        const keys = (c.tables || []).map(String).filter(k => visibleKeys.includes(k));
        const uniq = [...new Set(keys)];
        const links = uniq.map(k => {
          const t = tables[k] || {};
          const tLabel = escapeHtml(String(t.label || ('TABLE ' + k)));
          return `<button type="button" class="chip" data-jump-table="${escapeHtml(k)}"><b style="margin-right:6px">${escapeHtml(k)}</b>${tLabel}</button>`;
        }).join('');
        return `
          <div class="seat-section" id="${escapeHtml(id)}">
            <h3>${label}</h3>
            ${links ? `<div class="chips">${links}</div>` : `<div class="small">（該当する卓がありません）</div>`}
          </div>
        `;
      }).join('');

      // 2) 卓カード：全卓を1回だけレンダリング（重複させない）
      const tableCardsHtml = visibleKeys.map(k => renderTableCard(k)).join('');
      const allTablesBlock = `
        <div class="seat-section" id="all-tables">
          <h3>卓一覧</h3>
          ${tableCardsHtml}
        </div>
      `;

      sections.innerHTML = catSectionsHtml + allTablesBlock;

      // カテゴリチップ → カテゴリセクションへスクロール
      chips.querySelectorAll('[data-chip]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-chip');
          setMode('overview');
          chips.querySelectorAll('[data-chip]').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
        });
      });

      // カテゴリ内の「卓」ボタン → 同一の卓カードへジャンプ（ここが今回の修正ポイント）
      sections.querySelectorAll('[data-jump-table]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-jump-table');
          const card = root.querySelector(`[data-table-card="${cssEscape(key)}"]`);
          if (card){
            setMode('overview');
            card.scrollIntoView({ behavior:'smooth', block:'start' });
            flashCard(card);
          }
        });
      });
    }

    // --- overview map ---
    const overview = root.querySelector('[data-seating-overview]');
    if (overview){
      overview.classList.add('layout-abcxdfe');
      const headLabel = escapeHtml(String(data.headTableLabel || ''));
      overview.innerHTML = `
        <div class="overview-head">${headLabel || ' '}</div>
        ${['A','B','C','X','D','F','E'].filter(k => visibleKeys.includes(k)).map(k => {
          const t = tables[k] || {};
          const label = escapeHtml(String(t.label || ('TABLE ' + k)));
          const sample = (Array.isArray(t.seats) ? t.seats : []).map(normalize).filter(Boolean).slice(0,2);
          const sampleTxt = sample.length ? escapeHtml(sample.join(' / ')) : '';
          return `<button type="button" class="overview-node" data-table="${k}" aria-label="${label}">
            <div class="node-key">${escapeHtml(k)}</div>
            <div class="node-label">${label}</div>
            ${sampleTxt ? `<div class="node-sample">${sampleTxt}</div>` : ''}
          </button>`;
        }).join('')}
      `;

      overview.querySelectorAll('[data-table]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-table');
          const card = root.querySelector(`[data-table-card="${cssEscape(key)}"]`);
          if (card){
            setMode('overview');
            card.scrollIntoView({ behavior:'smooth', block:'start' });
            flashCard(card);
          }
        });
      });
    }

    // --- find ---
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
      const hits = allSeats.filter(it => it.nameNorm.toLowerCase().includes(q)).slice(0, 40);
      if (!hits.length){
        results.innerHTML = `<div class="result-empty">見つかりませんでした（表記ゆれがある場合は短く入力してみてください）</div>`;
        return;
      }
      results.innerHTML = `<div class="result-list">${hits.map(h => {
        const name = escapeHtml(h.name);
        const meta = escapeHtml(`${h.tableLabel} / 席${h.pos}`);
        return `<button type="button" class="result-item" data-hit="${escapeHtml(h.id)}">
          <div class="result-name">${name}</div>
          <div class="result-meta">${meta}</div>
          <div class="result-cta">見る</div>
        </button>`;
      }).join('')}</div>`;

      results.querySelectorAll('[data-hit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-hit');
          const hit = allSeats.find(x => x.id === id);
          if (!hit) return;
          setMode('overview');
          const card = root.querySelector(`[data-table-card="${cssEscape(hit.tableKey)}"]`);
          if (card){
            card.scrollIntoView({ behavior:'smooth', block:'start' });
            flashCard(card);
            const seatEl = card.querySelector(`[data-seat-id="${cssEscape(hit.id)}"]`);
            if (seatEl){
              focusSeat(seatEl);
            }
          }
        });
      });
    };

    if (input){
      input.addEventListener('input', () => renderResults(input.value));
      renderResults('');
    }

    // --- helpers ---
    function buildSeatIndex(){
      const idx = [];
      for (const k of visibleKeys){
        const t = tables[k] || {};
        const label = String(t.label || ('TABLE ' + k));
        const seats = Array.isArray(t.seats) ? t.seats : [];
        const clean = seats.map(normalize);
        clean.forEach((name, i) => {
          if (!name) return;
          const pos = i + 1;
          const id = `${k}:${pos}`;
          idx.push({ id, tableKey: k, tableLabel: label, pos, name, nameNorm: name });
        });
      }
      return idx;
    }

    function renderTableCard(key){
      const t = tables[key] || {};
      const label = escapeHtml(String(t.label || ('TABLE ' + key)));
      const seats = Array.isArray(t.seats) ? t.seats : [];
      const seatEls = renderSeats(key, label, seats);
      return `
        <div class="card seat-card" data-table-card="${escapeHtml(key)}">
          <div class="h2row"><span class="h2icon"><img class="ico" src="/assets/icons/table.svg" alt="" aria-hidden="true"></span><h2>${label}</h2></div>
          <div class="table-layout" aria-label="${label}">
            <div class="seat-col" data-side="left">${seatEls.left}</div>
            <div class="table-core">${escapeHtml(key)}</div>
            <div class="seat-col" data-side="right">${seatEls.right}</div>
          </div>
        </div>
      `;
    }

    function renderSeats(tableKey, tableLabel, seatsRaw){
      // Stable layout: 2 columns (left/right) + center (table key)
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
