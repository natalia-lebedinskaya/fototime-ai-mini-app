
/* FT_V37_PREVIEW_ADMIN_FIX_START */
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-201500-v37-preview-admin-fix";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  if (!window.__FT_V37_LOGGED__) {
    window.__FT_V37_LOGGED__ = true;
    console.info("[FOTOTIME DEPLOY VERSION]", VERSION);
  }

  var KNOWN_STYLE_NAMES = [
    "Атлантида", "Барби", "Баблгам", "Бизнес", "Рождество", "Комикс",
    "Киберпанк", "Дубай", "Лесная сказка", "Цветы", "GTA", "Гангстеры",
    "Поле боя", "Кабаре", "Алхимик", "Пираты", "Diamonds", "Luxor", "Biker NB",
    "Киберпанк", "Рождество", "Atlantis", "Barbie", "Business", "Cyberpunk"
  ];

  var styleTouched = false;

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

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function firstRealPreview(style) {
    if (!style || typeof style !== "object") return "";
    var keys = [
      "previewUrl", "preview_url", "preview", "image", "imageUrl", "image_url",
      "thumbnail", "thumb", "thumbUrl", "cover", "coverUrl", "url"
    ];

    for (var i = 0; i < keys.length; i += 1) {
      var v = style[keys[i]];
      if (typeof v === "string" && v.trim()) {
        if (!/^data:/i.test(v) && !/^https?:\/\//i.test(v) && v.charAt(0) !== "/") {
          continue;
        }
        if (/adobe|stock|demo|placeholder|source/i.test(v)) {
          continue;
        }
        return v.trim();
      }
    }

    return "";
  }

  function styleName(style) {
    return cleanText(
      style && (
        style.name ||
        style.title ||
        style.label ||
        style.styleName ||
        style.styleTitle ||
        style.id ||
        style.styleId
      )
    ) || "Стиль";
  }

  function fallbackPreviewUrl(name) {
    return "/api/fototime/style-preview/" + encodeURIComponent(slugify(name)) + ".svg?title=" + encodeURIComponent(name || "Стиль") + "&v=" + encodeURIComponent(VERSION);
  }

  function normalizeStyle(style) {
    if (!style || typeof style !== "object") return style;

    var name = styleName(style);
    var real = firstRealPreview(style);
    var preview = real || fallbackPreviewUrl(name);

    style.name = style.name || style.title || style.label || name;
    style.title = style.title || style.name;
    style.previewUrl = preview;
    style.preview = preview;
    style.image = preview;
    style.imageUrl = preview;
    style.thumbnail = preview;
    style.thumb = preview;
    style.thumbUrl = preview;
    style.cover = preview;
    style.coverUrl = preview;

    return style;
  }

  function normalizeStylesPayload(data) {
    if (Array.isArray(data)) {
      return data.map(normalizeStyle);
    }

    if (data && typeof data === "object") {
      ["styles", "items", "data", "result", "results"].forEach(function (key) {
        if (Array.isArray(data[key])) {
          data[key] = data[key].map(normalizeStyle);
        }
      });
    }

    return data;
  }

  function patchFetchForPreviews() {
    if (!window.fetch || window.__FT_V37_FETCH_PATCHED__) return;
    window.__FT_V37_FETCH_PATCHED__ = true;

    var originalFetch = window.fetch;

    window.fetch = function (input, init) {
      return originalFetch(input, init).then(function (response) {
        var url = String(typeof input === "string" ? input : (input && input.url) || "");

        if (!/\/api\/(styles|fototime\/styles|catalog|fototime\/catalog)/i.test(url)) {
          return response;
        }

        return response.clone().json().then(function (data) {
          var normalized = normalizeStylesPayload(data);

          return new Response(JSON.stringify(normalized), {
            status: response.status,
            statusText: response.statusText,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Fototime-Preview-Fix": "v37"
            }
          });
        }).catch(function () {
          return response;
        });
      });
    };
  }

  function removeOldBadges() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("body *"));
    nodes.forEach(function (el) {
      if (!el || el.id === "ftV37VersionBadge") return;

      var txt = cleanText(el.textContent);
      var style = window.getComputedStyle(el);

      var isFixedBadge =
        style.position === "fixed" &&
        (txt.indexOf("fototime-prod-") !== -1 ||
         txt.indexOf("PhotoTime prod") !== -1 ||
         txt.indexOf("FOTOTIME DEPLOY VERSION") !== -1);

      var isOldVersion =
        txt.indexOf("2026-06-10-141454") !== -1 ||
        txt.indexOf("20260610-141454") !== -1 ||
        txt.indexOf("v24-stabilizer") !== -1 ||
        txt.indexOf("v31-money-guard") !== -1 ||
        txt.indexOf("v32-demo-critical-guard") !== -1 ||
        txt.indexOf("v33-product-ux") !== -1 ||
        txt.indexOf("v35") !== -1 ||
        txt.indexOf("v36-emergency-front-restore") !== -1;

      if (isFixedBadge || isOldVersion) {
        try { el.remove(); } catch (e) {}
      }
    });

    var badge = document.getElementById("ftV37VersionBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "ftV37VersionBadge";
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
        "backdrop-filter:blur(10px)",
        "border:1px solid rgba(215,255,54,.42)",
        "box-shadow:0 10px 30px rgba(0,0,0,.14)",
        "pointer-events:none"
      ].join(";");
      document.body.appendChild(badge);
    }
  }

  function findStyleNameInCard(card) {
    var txt = cleanText(card && card.textContent);
    if (!txt) return "";

    for (var i = 0; i < KNOWN_STYLE_NAMES.length; i += 1) {
      if (txt.indexOf(KNOWN_STYLE_NAMES[i]) !== -1) {
        return KNOWN_STYLE_NAMES[i];
      }
    }

    return "";
  }

  function looksLikePreviewBox(el) {
    if (!el) return false;
    var txt = cleanText(el.textContent);
    var rect = el.getBoundingClientRect();

    return (
      rect.width >= 70 &&
      rect.height >= 70 &&
      txt.length <= 4 &&
      /^[A-Za-zА-Яа-я0-9БПКАМСДЛРГЦ]+$/.test(txt || "A")
    );
  }

  function patchStyleCard(card) {
    if (!card || card.__ftV37PreviewPatched) return;

    var name = findStyleNameInCard(card);
    if (!name) return;

    card.__ftV37PreviewPatched = true;
    card.classList.add("ft-v37-style-card");

    var imgUrl = fallbackPreviewUrl(name);

    var imgs = Array.prototype.slice.call(card.querySelectorAll("img"));
    imgs.forEach(function (img) {
      if (!img.getAttribute("src") || /placeholder|demo|source|adobe/i.test(img.getAttribute("src"))) {
        img.setAttribute("src", imgUrl);
      }
      img.classList.add("ft-v37-real-preview");
    });

    var previewTarget = null;
    var children = Array.prototype.slice.call(card.querySelectorAll("div, span"));
    for (var i = 0; i < children.length; i += 1) {
      if (looksLikePreviewBox(children[i])) {
        previewTarget = children[i];
        break;
      }
    }

    if (previewTarget) {
      previewTarget.textContent = "";
      previewTarget.classList.add("ft-v37-preview-box");
      previewTarget.style.backgroundImage = "url('" + imgUrl + "')";
      previewTarget.style.backgroundSize = "cover";
      previewTarget.style.backgroundPosition = "center";
      previewTarget.style.backgroundRepeat = "no-repeat";
    } else if (!card.querySelector(".ft-v37-preview-box")) {
      var box = document.createElement("div");
      box.className = "ft-v37-preview-box";
      box.style.backgroundImage = "url('" + imgUrl + "')";
      card.insertBefore(box, card.firstChild);
    }
  }

  function patchStylePreviews() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("button, article, li, div"));
    nodes.forEach(function (el) {
      var txt = cleanText(el.textContent);
      if (!txt || txt.length > 120) return;
      if (!/(SDXL|FLUX|Nano Banana|Атлантида|Барби|Баблгам|Бизнес|Рождество|Комикс|Киберпанк|Дубай|Лесная сказка|Цветы|GTA|Гангстеры|Пираты)/i.test(txt)) return;

      var rect = el.getBoundingClientRect();
      if (rect.width < 90 || rect.height < 90) return;

      patchStyleCard(el);
    });
  }

  function normalizeAvitoLinks() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("a, button"));
    nodes.forEach(function (el) {
      var txt = cleanText(el.textContent);
      if (!/avito|авито/i.test(txt)) return;

      if (el.tagName.toLowerCase() === "a") {
        el.setAttribute("href", AVITO_URL);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.onclick = function () {
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        };
      }
    });
  }

  function dedupeAdminButtons() {
    var bodyText = cleanText(document.body && document.body.textContent);
    if (!/Админ|Пользователи|Баланс|Чек\/оплата/i.test(bodyText)) return;

    var labels = ["+50", "+120", "+300", "+700"];
    labels.forEach(function (label) {
      var buttons = Array.prototype.slice.call(document.querySelectorAll("button"))
        .filter(function (b) { return cleanText(b.textContent) === label; });

      buttons.forEach(function (button, index) {
        if (index > 0) {
          button.classList.add("ft-v37-admin-duplicate-hidden");
          button.style.display = "none";
        }
      });
    });

    var addButtons = Array.prototype.slice.call(document.querySelectorAll("button"))
      .filter(function (b) { return cleanText(b.textContent) === "Добавить"; });

    addButtons.forEach(function (button, index) {
      if (index > 0) {
        button.classList.add("ft-v37-admin-duplicate-hidden");
        button.style.display = "none";
      }
    });
  }

  function preventAccidentalGeneration() {
    if (window.__FT_V37_GENERATION_GUARD__) return;
    window.__FT_V37_GENERATION_GUARD__ = true;

    document.addEventListener("click", function (event) {
      var target = event.target;
      var el = target && target.closest ? target.closest("button, [role='button'], article, li, div") : null;
      if (!el) return;

      var txt = cleanText(el.textContent);

      if (/(SDXL|FLUX|Nano Banana)/i.test(txt) && /(Атлантида|Барби|Баблгам|Бизнес|Рождество|Комикс|Киберпанк|Дубай|Лесная сказка|Цветы|GTA|Гангстеры|Пираты)/i.test(txt)) {
        styleTouched = true;
      }

      var isGenerateButton = /Создать/i.test(txt) && /(AI|фото|изображение)/i.test(txt);

      if (isGenerateButton && !styleTouched) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        alert("Сначала выберите стиль обработки вручную. Это защита от случайной генерации и списания кредитов.");
      }
    }, true);
  }

  function injectCss() {
    if (document.getElementById("ftV37PreviewAdminCss")) return;

    var style = document.createElement("style");
    style.id = "ftV37PreviewAdminCss";
    style.textContent = `
      .ft-v37-preview-box {
        width: 100% !important;
        min-height: 150px !important;
        aspect-ratio: 3 / 4 !important;
        border-radius: 16px !important;
        overflow: hidden !important;
        background-size: cover !important;
        background-position: center !important;
        box-shadow: inset 0 0 0 1px rgba(20, 40, 35, .12) !important;
      }

      .ft-v37-style-card {
        transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease !important;
      }

      .ft-v37-style-card:hover {
        transform: translateY(-2px) scale(1.015) !important;
        box-shadow: 0 14px 34px rgba(20, 43, 36, .16) !important;
      }

      .ft-v37-real-preview {
        width: 100% !important;
        height: auto !important;
        object-fit: cover !important;
        border-radius: 14px !important;
      }

      .ft-v37-admin-duplicate-hidden {
        display: none !important;
      }

      a[href*="avito.ru"], button {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  function runFixes() {
    if (!document.body) return;

    injectCss();
    removeOldBadges();
    patchStylePreviews();
    normalizeAvitoLinks();
    dedupeAdminButtons();
  }

  patchFetchForPreviews();
  preventAccidentalGeneration();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFixes);
  } else {
    runFixes();
  }

  var observer = new MutationObserver(function () {
    clearTimeout(window.__FT_V37_TIMER__);
    window.__FT_V37_TIMER__ = setTimeout(runFixes, 120);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
/* FT_V37_PREVIEW_ADMIN_FIX_END */
