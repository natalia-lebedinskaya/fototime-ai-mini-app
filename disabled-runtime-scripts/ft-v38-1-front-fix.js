
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-213000-v38-1-front-fix";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  if (!window.__FT_V381_LOGGED__) {
    window.__FT_V381_LOGGED__ = true;
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
    return String((el && (el.innerText || el.textContent)) || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugify(value) {
    var map = {
      "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y",
      "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
      "х":"h","ц":"c","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"
    };

    return String(value || "style")
      .toLowerCase()
      .split("")
      .map(function (ch) { return map[ch] || ch; })
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "style";
  }

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function styleNameFromText(text) {
    text = textOf({ textContent: text });

    for (var i = 0; i < STYLE_NAMES.length; i += 1) {
      if (text.indexOf(STYLE_NAMES[i]) !== -1) return STYLE_NAMES[i];
    }

    return "";
  }

  function svgPreview(name) {
    var title = escapeXml(name || "Стиль");
    var initials = escapeXml(
      String(name || "FT")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(function (x) { return x[0]; })
        .join("")
        .toUpperCase() || "FT"
    );

    var slug = slugify(name);
    var p = ["#74f0d1", "#baff14", "#11362f"];

    if (slug.indexOf("barbi") !== -1 || slug.indexOf("bablgam") !== -1) {
      p = ["#ff8fd3", "#ffd1ec", "#4b1f3a"];
    } else if (slug.indexOf("kiber") !== -1 || slug.indexOf("gta") !== -1) {
      p = ["#0f172a", "#48ffe0", "#ecfeff"];
    } else if (slug.indexOf("rozhdestvo") !== -1) {
      p = ["#ff4f4f", "#46e18c", "#ffffff"];
    } else if (slug.indexOf("biznes") !== -1) {
      p = ["#c9b18a", "#f7f4ef", "#2d3430"];
    } else if (slug.indexOf("atlantida") !== -1) {
      p = ["#32d6ff", "#6ff0c8", "#17342f"];
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + p[0] + '"/>' +
      '<stop offset="58%" stop-color="' + p[1] + '"/>' +
      '<stop offset="100%" stop-color="' + p[0] + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="r" cx="20%" cy="12%" r="82%">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity=".82"/>' +
      '<stop offset="48%" stop-color="#ffffff" stop-opacity=".12"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity=".16"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="900" height="1200" rx="54" fill="url(#g)"/>' +
      '<rect width="900" height="1200" rx="54" fill="url(#r)"/>' +
      '<circle cx="720" cy="170" r="118" fill="#ffffff" opacity=".22"/>' +
      '<circle cx="145" cy="1020" r="170" fill="#ffffff" opacity=".16"/>' +
      '<rect x="95" y="120" width="710" height="830" rx="44" fill="#ffffff" opacity=".42"/>' +
      '<text x="450" y="488" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="148" font-weight="900" fill="' + p[2] + '">' + initials + '</text>' +
      '<text x="450" y="1012" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="' + p[2] + '">' + title + '</text>' +
      '<text x="450" y="1082" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="800" fill="' + p[2] + '" opacity=".72">FOTOTIME AI STYLE</text>' +
      '</svg>';

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function removeOldBadges() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      if (!el || el.id === "ftV381VersionBadge") return;

      var t = textOf(el);
      var s = window.getComputedStyle(el);

      var isOld =
        s.position === "fixed" &&
        /fototime-prod-|PhotoTime prod|2026-06-10|141454|v31|v32|v33|v35|v36|v37|v38-real/i.test(t);

      if (isOld) {
        try { el.remove(); } catch (e) {}
      }
    });

    if (!document.getElementById("ftV381VersionBadge")) {
      var badge = document.createElement("div");
      badge.id = "ftV381VersionBadge";
      badge.textContent = VERSION;
      badge.style.cssText = [
        "position:fixed",
        "left:10px",
        "bottom:78px",
        "z-index:99999",
        "padding:7px 11px",
        "border-radius:999px",
        "font-size:11px",
        "font-weight:900",
        "line-height:1",
        "background:rgba(20,30,25,.74)",
        "color:#d7ff36",
        "border:1px solid rgba(215,255,54,.42)",
        "pointer-events:none"
      ].join(";");
      document.body.appendChild(badge);
    }
  }

  function looksLikeStyleCard(el) {
    if (!el || el === document.body) return false;

    var t = textOf(el);
    if (!t || t.length > 320) return false;
    if (!(t.indexOf("SDXL") !== -1 || t.indexOf("FLUX") !== -1 || t.indexOf("Nano Banana") !== -1)) return false;
    if (t.indexOf("Результат") !== -1 || t.indexOf("Списано") !== -1) return false;

    return !!styleNameFromText(t);
  }

  function patchStylePreviews() {
    Array.from(document.querySelectorAll("button, article, li, div")).forEach(function (card) {
      if (!looksLikeStyleCard(card)) return;

      var rect = card.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80 || rect.height > 900) return;

      var name = styleNameFromText(textOf(card));
      if (!name) return;

      var url = svgPreview(name);
      card.classList.add("ft-v381-style-card");

      var existingImg = card.querySelector("img");
      if (existingImg) {
        existingImg.src = url;
        existingImg.classList.add("ft-v381-preview-img");
        return;
      }

      var target = null;

      Array.from(card.querySelectorAll("div, span")).some(function (node) {
        var nodeText = textOf(node);
        var r = node.getBoundingClientRect();

        if (
          r.width >= 55 &&
          r.height >= 55 &&
          r.height <= 360 &&
          nodeText.length <= 4
        ) {
          target = node;
          return true;
        }

        return false;
      });

      if (!target) {
        target = document.createElement("div");
        card.insertBefore(target, card.firstChild);
      }

      target.textContent = "";
      target.classList.add("ft-v381-preview-box");
      target.style.backgroundImage = "url('" + url + "')";
    });
  }

  function clearDefaultAtlantis() {
    if (manualStyleSelected) return;

    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      var t = textOf(el);

      if (/Выбран стиль:\s*Атлантида/i.test(t)) {
        el.textContent = "Стиль не выбран. Выберите стиль обработки вручную.";
        el.classList.add("ft-v381-style-warning");
      }
    });

    Array.from(document.querySelectorAll("button, article, li, div")).forEach(function (el) {
      var t = textOf(el);
      if (/Атлантида/i.test(t) && /SDXL/i.test(t) && looksLikeStyleCard(el)) {
        el.classList.remove("active", "selected", "is-active", "is-selected");
        el.removeAttribute("aria-selected");
      }
    });
  }

  function hideAutoResult() {
    if (generatedInThisSession) return;

    var body = textOf(document.body);
    var isMain = /Участник/i.test(body) && /Стиль обработки/i.test(body) && /Фото/i.test(body);
    if (!isMain) return;

    Array.from(document.querySelectorAll("section, article, div")).forEach(function (el) {
      var t = textOf(el);
      var rect = el.getBoundingClientRect();

      if (
        (/Результат/i.test(t) && /Списано:\s*40/i.test(t) && /Скачать|Поделиться/i.test(t) && rect.height > 100) ||
        (/^04\s*Результат/i.test(t) && rect.height > 100)
      ) {
        el.classList.add("ft-v381-hidden");
      }
    });

    Array.from(document.querySelectorAll("button, a, span, div")).forEach(function (el) {
      var t = textOf(el);
      var rect = el.getBoundingClientRect();

      if (
        (/^Списано:\s*40 кредитов$/i.test(t) || /^Скачать$/i.test(t) || /^Поделиться$/i.test(t)) &&
        rect.width < 260 &&
        rect.height < 90
      ) {
        el.classList.add("ft-v381-hidden");
      }
    });
  }

  function fixAvito() {
    Array.from(document.querySelectorAll("a, button, [role='button']")).forEach(function (el) {
      var t = textOf(el);
      if (!/avito|авито/i.test(t)) return;

      if (el.tagName.toLowerCase() === "a") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }

      if (!el.dataset.ftV381AvitoClick) {
        el.dataset.ftV381AvitoClick = "1";
        el.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        }, true);
      }
    });
  }

  function improveSocialIcons() {
    var items = [
      [/telegram/i, "✈"],
      [/vk|вк/i, "VK"],
      [/max/i, "M"],
      [/сайт|site/i, "⌂"],
      [/avito|авито/i, "A"]
    ];

    Array.from(document.querySelectorAll("a, button, [role='button']")).forEach(function (el) {
      var t = textOf(el);
      if (!t || !/(telegram|vk|вк|max|сайт|site|avito|авито)/i.test(t)) return;
      if (el.querySelector(".ft-v381-social-icon")) return;

      for (var i = 0; i < items.length; i += 1) {
        if (items[i][0].test(t)) {
          var icon = document.createElement("span");
          icon.className = "ft-v381-social-icon";
          icon.textContent = items[i][1];
          el.insertBefore(icon, el.firstChild);
          el.classList.add("ft-v381-social-btn");
          break;
        }
      }
    });
  }

  function fixAdminSpam() {
    var txt = textOf(document.body);
    if (!/Админ|Админ-консоль|Пользователи/i.test(txt)) return;

    var seen = {};

    Array.from(document.querySelectorAll("button, span, div")).forEach(function (el) {
      var label = textOf(el);

      if (!/^\+?(50|120|300|700)$/.test(label) && label !== "Добавить") return;

      seen[label] = seen[label] || 0;
      seen[label] += 1;

      if (seen[label] > 1) {
        el.classList.add("ft-v381-hidden");
      }
    });

    Array.from(document.querySelectorAll("div, section, article")).forEach(function (box) {
      var t = textOf(box);
      var r = box.getBoundingClientRect();

      if (
        r.height < 140 &&
        /\+50/.test(t) &&
        /\+120/.test(t) &&
        /\+300/.test(t) &&
        /\+700/.test(t)
      ) {
        if (document.__ftV381CreditRowSeen) {
          box.classList.add("ft-v381-hidden");
        } else {
          document.__ftV381CreditRowSeen = true;
        }
      }
    });
  }

  function addGeneratedHover() {
    Array.from(document.querySelectorAll("img")).forEach(function (img) {
      var card = img.closest("article, div, li, section");
      if (!card) return;

      if (/Скачать|Поделиться|Списано|Мои сгенерированные фото/i.test(textOf(card))) {
        card.classList.add("ft-v381-generated-card");
        img.classList.add("ft-v381-generated-img");
      }
    });
  }

  function addButtonIcons() {
    var map = [
      [/скачать/i, "⬇"],
      [/поделиться/i, "↗"],
      [/создать.+ещ/i, "＋"],
      [/проблема/i, "!"]
    ];

    Array.from(document.querySelectorAll("button, a")).forEach(function (el) {
      if (el.dataset.ftV381Icon) return;

      var t = textOf(el);

      for (var i = 0; i < map.length; i += 1) {
        if (map[i][0].test(t)) {
          el.dataset.ftV381Icon = "1";
          el.innerHTML = '<span aria-hidden="true">' + map[i][1] + '</span> ' + el.innerHTML;
          break;
        }
      }
    });
  }

  function bindManualStyleClicks() {
    if (window.__FT_V381_STYLE_CLICK__) return;
    window.__FT_V381_STYLE_CLICK__ = true;

    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest("button, article, li, div, [role='button']")
        : null;

      if (!el) return;

      if (looksLikeStyleCard(el)) {
        manualStyleSelected = true;
        document.body.classList.add("ft-v381-style-selected-manually");
      }
    }, true);
  }

  function guardGenerateFetch() {
    if (!window.fetch || window.__FT_V381_FETCH_GUARD__) return;
    window.__FT_V381_FETCH_GUARD__ = true;

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

  function run() {
    if (!document.body) return;

    removeOldBadges();
    patchStylePreviews();
    clearDefaultAtlantis();
    hideAutoResult();
    fixAvito();
    improveSocialIcons();
    fixAdminSpam();
    addGeneratedHover();
    addButtonIcons();
  }

  bindManualStyleClicks();
  guardGenerateFetch();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  var observer = new MutationObserver(function () {
    clearTimeout(window.__FT_V381_TIMER__);
    window.__FT_V381_TIMER__ = setTimeout(run, 120);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
