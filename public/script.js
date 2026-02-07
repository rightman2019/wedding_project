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

    const hide = () => {
      if (splash.classList.contains("is-hidden")) return;
      splash.classList.add("is-hidden");
      try{ sessionStorage.setItem(KEY, "1"); }catch(e){}
      window.setTimeout(() => { try{ splash.remove(); }catch(e){} }, 260);
    };

    splash.addEventListener("click", hide);
    splash.addEventListener("touchstart", hide, {passive:true});
    splash.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape"){
        e.preventDefault();
        hide();
      }
    });
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
    setupSplash();
    setupMenuImageViewer();
    if (useBackdrop) setupShapes();
  });
})();
