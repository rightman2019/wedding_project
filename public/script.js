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
      }).join("") || `<div class="small">FAQは config.js で編集できます。</div>`;
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

  function setupBackdrop(){
    if (document.querySelector(".backdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.innerHTML = `
      <div class="block orange"></div>
      <div class="block green"></div>
      <div class="block frame"></div>
      <div class="obi" data-obi></div>
      <div class="shapes" data-shapes></div>
    `;
    document.body.prepend(backdrop);
  }

  function setupObi(){
    const obi = document.querySelector("[data-obi]");
    if (!obi) return;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > 12) document.body.classList.add("obi-on");
      else document.body.classList.remove("obi-on");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupShapes(){
    const root = document.querySelector("[data-shapes]");
    if (!root) return;

    // 配色は固定3色 + paper
    const fills = ["var(--orange)", "var(--green)", "var(--paper)", "transparent"];
    const kinds = ["circle", "round", "ring", "tri", "half"];

    const specs = [
      {x: 72, y: 10, s: 56, kind:"circle", fill:fills[0], dur: 6.8, delay: 0.2},
      {x: 84, y: 24, s: 44, kind:"ring",   fill:"transparent", dur: 7.4, delay: 0.9},
      {x: 12, y: 22, s: 52, kind:"round",  fill:fills[1], dur: 6.2, delay: 0.4},
      {x: 20, y: 40, s: 40, kind:"tri",    fill:fills[0], dur: 7.9, delay: 1.1},
      {x: 8,  y: 66, s: 64, kind:"circle", fill:fills[2], dur: 8.6, delay: 0.3},
      {x: 78, y: 62, s: 70, kind:"half",   fill:fills[1], dur: 9.1, delay: 1.7},
      {x: 90, y: 76, s: 42, kind:"round",  fill:fills[0], dur: 7.1, delay: 0.6},
      {x: 55, y: 86, s: 58, kind:"ring",   fill:"transparent", dur: 8.2, delay: 1.3},
    ];

    for (const sp of specs){
      const d = document.createElement("div");
      d.className = `shape ${sp.kind}`;
      d.style.setProperty("--x", String(sp.x));
      d.style.setProperty("--y", String(sp.y));
      d.style.setProperty("--size", sp.s + "px");
      d.style.setProperty("--fill", sp.fill);
      d.style.setProperty("--dur", sp.dur + "s");
      d.style.setProperty("--delay", sp.delay + "s");
      root.appendChild(d);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    setupBackdrop();
    applyBindings();
    markCurrentNav();
    setupObi();
    setupShapes();
  });
})();