
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-221500-v39-emergency-restore";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  if (!window.__FT_V39_LOGGED__) {
    window.__FT_V39_LOGGED__ = true;
    console.info("[FOTOTIME DEPLOY VERSION]", VERSION);
  }

  var manualStyleSelected = false;
  var generatedInThisSession = false;

  var STYLE_NAMES = [
    "Атлантида", "Барби", "Баблгам", "Бизнес", "Рождество", "Комикс",
    "Киберпанк", "Дубай", "Лесная сказка", "Цветы", "GTA", "Гангстеры",
    "Поле боя", "Кабаре", "Алхимик", "Пираты", "Diamonds", "Luxor", "Biker NB"
  ];

  function textOf(el) {
    return String((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
  }

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function styleNameFromText(text) {
    text = String(text || "");
    for (var i = 0; i < STYLE_NAMES.length; i += 1) {
      if (text.indexOf(STYLE_NAMES[i]) !== -1) return STYLE_NAMES[i];
    }
    return "";
  }

  function svgPreview(name) {
    var title = escapeXml(name || "Стиль");
    var initials = escapeXml(String(name || "FT").split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) {
      return x[0];
    }).join("").toUpperCase() || "FT");

    var c1 = "#74f0d1";
    var c2 = "#baff14";
    var c3 = "#17342f";

    if (/Барби|Баблгам/i.test(name)) {
      c1 = "#ff9ddc"; c2 = "#ffd6ee"; c3 = "#44223a";
    } else if (/Киберпанк|GTA/i.test(name)) {
      c1 = "#111827"; c2 = "#5ee7d0"; c3 = "#f5ffff";
    } else if (/Рождество/i.test(name)) {
      c1 = "#ff4f4f"; c2 = "#78f29b"; c3 = "#ffffff";
    } else if (/Бизнес/i.test(name)) {
      c1 = "#cab08a"; c2 = "#f7f1e6"; c3 = "#27342f";
    } else if (/Атлантида/i.test(name)) {
      c1 = "#28cfff"; c2 = "#70f0c8"; c3 = "#10342e";
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + c1 + '"/>' +
      '<stop offset="62%" stop-color="' + c2 + '"/>' +
      '<stop offset="100%" stop-color="' + c1 + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="r" cx="24%" cy="14%" r="80%">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/>' +
      '<stop offset="48%" stop-color="#ffffff" stop-opacity=".18"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity=".14"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="900" height="1200" rx="54" fill="url(#g)"/>' +
      '<rect width="900" height="1200" rx="54" fill="url(#r)"/>' +
      '<circle cx="720" cy="165" r="130" fill="#ffffff" opacity=".20"/>' +
      '<circle cx="150" cy="1030" r="180" fill="#ffffff" opacity=".16"/>' +
      '<rect x="90" y="120" width="720" height="820" rx="46" fill="#ffffff" opacity=".38"/>' +
      '<text x="450" y="490" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="148" font-weight="900" fill="' + c3 + '">' + initials + '</text>' +
      '<text x="450" y="1012" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="' + c3 + '">' + title + '</text>' +
      '<text x="450" y="1082" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="' + c3 + '" opacity=".7">FOTOTIME AI STYLE</text>' +
      '</svg>';

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function removeOnlyBadFixedBadges() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      if (!el || el.id === "ftV39VersionBadge") return;

      var t = textOf(el);
      var s = window.getComputedStyle(el);

      if (
        s.position === "fixed" &&
        /141454|2026-06-10|v37|v38-1|v38-real|PhotoTime prod/i.test(t)
      ) {
        try { el.remove(); } catch (e) {}
      }
    });

    if (!document.getElementById("ftV39VersionBadge")) {
      var badge = document.createElement("div");
      badge.id = "ftV39VersionBadge";
      badge.textContent = VERSION;
      badge.style.cssText = "position:fixed;left:10px;bottom:78px;z-index:99999;padding:7px 11px;border-radius:999px;font-size:11px;font-weight:900;line-height:1;background:rgba(20,30,25,.74);color:#d7ff36;border:1px solid rgba(215,255,54,.42);pointer-events:none;";
      document.body.appendChild(badge);
    }
  }

  function looksLikeStyleCard(el) {
    if (!el || el === document.body || el.id === "app") return false;

    var t = textOf(el);
    if (!t || t.length > 280) return false;
    if (!/SDXL|FLUX|Nano Banana/i.test(t)) return false;
    if (/Результат|Списано|Скачать|Поделиться|Мои сгенерированные/i.test(t)) return false;

    return !!styleNameFromText(t);
  }

  function patchStylePreviews() {
    Array.from(document.querySelectorAll("button, article, li, div")).forEach(function (card) {
      if (!looksLikeStyleCard(card)) return;

      var r = card.getBoundingClientRect();
      if (r.width < 80 || r.height < 90 || r.height > 600) return;

      var name = styleNameFromText(textOf(card));
      if (!name) return;

      card.classList.add("ft-v39-style-card");

      var img = card.querySelector("img");
      if (img) {
        if (!img.dataset.ftV39SafePreview) {
          img.dataset.ftV39SafePreview = "1";
          img.addEventListener("error", function () {
            img.src = svgPreview(name);
          });
        }

        if (!img.getAttribute("src") || /placeholder|undefined|null|blob:$/i.test(img.getAttribute("src"))) {
          img.src = svgPreview(name);
        }

        img.classList.add("ft-v39-preview-img");
        return;
      }

      var target = null;

      Array.from(card.children).some(function (node) {
        var nodeText = textOf(node);
        var nr = node.getBoundingClientRect();

        if (nr.width >= 50 && nr.height >= 50 && nr.height <= 360 && nodeText.length <= 8) {
          target = node;
          return true;
        }

        return false;
      });

      if (!target) return;

      target.textContent = "";
      target.classList.add("ft-v39-preview-box");
      target.style.backgroundImage = "url('" + svgPreview(name) + "')";
    });
  }

  function replaceDefaultSelectedTextSafely() {
    if (manualStyleSelected || !document.body) return;

    var walker = document.createTreeWalker(document.body, 4);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || "");
      if (value.length < 120 && /Выбран стиль:\s*Атлантида/i.test(value)) {
        nodes.push(node);
      }
    }

    nodes.forEach(function (textNode) {
      textNode.nodeValue = textNode.nodeValue.replace(
        /Выбран стиль:\s*Атлантида\s*·?\s*SDXL/i,
        "Стиль не выбран. Выберите стиль обработки вручную."
      );
    });
  }

  function bindManualStyleClicks() {
    if (window.__FT_V39_STYLE_BIND__) return;
    window.__FT_V39_STYLE_BIND__ = true;

    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest("button, article, li, div, [role='button']")
        : null;

      if (looksLikeStyleCard(el)) {
        manualStyleSelected = true;
        document.body.classList.add("ft-v39-manual-style-selected");
      }
    }, true);
  }

  function guardGenerateWithoutManualStyle() {
    if (!window.fetch || window.__FT_V39_FETCH_GUARD__) return;
    window.__FT_V39_FETCH_GUARD__ = true;

    var originalFetch = window.fetch;

    window.fetch = function (input, init) {
      var url = String(typeof input === "string" ? input : (input && input.url) || "");
      var method = String((init && init.method) || "GET").toUpperCase();

      if (/\/api\/generate/i.test(url) && method === "POST") {
        if (!manualStyleSelected) {
          alert("Сначала выберите стиль обработки вручную. Это защита от случайной генерации и списания кредитов.");

          return Promise.resolve(new Response(JSON.stringify({
            code: "STYLE_NOT_SELECTED_MANUALLY",
            message: "Сначала выберите стиль обработки вручную."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          }));
        }

        generatedInThisSession = true;
      }

      return originalFetch(input, init);
    };
  }

  function fixAvitoLinks() {
    Array.from(document.querySelectorAll("a, button, [role='button']")).forEach(function (el) {
      var t = textOf(el);
      if (!/avito|авито/i.test(t)) return;

      if (el.tagName && el.tagName.toLowerCase() === "a") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }

      if (!el.dataset.ftV39Avito) {
        el.dataset.ftV39Avito = "1";
        el.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        }, true);
      }
    });
  }

  function hideDetachedResultControlsOnly() {
    if (generatedInThisSession) return;

    Array.from(document.querySelectorAll("button, a, span, div")).forEach(function (el) {
      var t = textOf(el);
      var r = el.getBoundingClientRect();

      if (
        r.width < 280 &&
        r.height < 90 &&
        (/^Списано:\s*40 кредитов$/i.test(t) || /^Скачать$/i.test(t) || /^Поделиться$/i.test(t))
      ) {
        var parentText = textOf(el.parentElement);
        if (!/Результат/i.test(parentText) && parentText.length < 220) {
          el.classList.add("ft-v39-hidden");
        }
      }
    });
  }

  function improveButtonsAndSocials() {
    var socialMap = [
      [/telegram/i, "✈"],
      [/vk|вк/i, "VK"],
      [/max/i, "M"],
      [/сайт|site/i, "⌂"],
      [/avito|авито/i, "A"]
    ];

    Array.from(document.querySelectorAll("a, button, [role='button']")).forEach(function (el) {
      var t = textOf(el);

      for (var i = 0; i < socialMap.length; i += 1) {
        if (socialMap[i][0].test(t) && !el.querySelector(".ft-v39-social-icon")) {
          var icon = document.createElement("span");
          icon.className = "ft-v39-social-icon";
          icon.textContent = socialMap[i][1];
          el.insertBefore(icon, el.firstChild);
          el.classList.add("ft-v39-social-btn");
          break;
        }
      }

      if (!el.dataset.ftV39ActionIcon) {
        var iconText = "";
        if (/скачать/i.test(t)) iconText = "⬇";
        if (/поделиться/i.test(t)) iconText = "↗";
        if (/создать.+ещ/i.test(t)) iconText = "＋";
        if (/проблема/i.test(t)) iconText = "!";

        if (iconText) {
          el.dataset.ftV39ActionIcon = "1";
          el.insertAdjacentHTML("afterbegin", '<span aria-hidden="true">' + iconText + '</span> ');
        }
      }
    });
  }

  function limitAdminSpam() {
    if (!/Админ|Админ-консоль|Пользователи/i.test(textOf(document.body))) return;

    var counts = {};

    Array.from(document.querySelectorAll("button")).forEach(function (btn) {
      var t = textOf(btn);
      if (!/^\+?(50|120|300|700)$/.test(t) && t !== "Добавить") return;

      counts[t] = counts[t] || 0;
      counts[t] += 1;

      if (counts[t] > 1) {
        btn.classList.add("ft-v39-hidden");
      }
    });
  }

  function run() {
    if (!document.body) return;

    removeOnlyBadFixedBadges();
    patchStylePreviews();
    replaceDefaultSelectedTextSafely();
    fixAvitoLinks();
    hideDetachedResultControlsOnly();
    improveButtonsAndSocials();
    limitAdminSpam();
  }

  bindManualStyleClicks();
  guardGenerateWithoutManualStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  var observer = new MutationObserver(function () {
    clearTimeout(window.__FT_V39_RUN_TIMER__);
    window.__FT_V39_RUN_TIMER__ = setTimeout(run, 180);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
