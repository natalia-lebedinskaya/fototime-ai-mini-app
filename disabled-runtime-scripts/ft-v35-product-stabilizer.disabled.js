
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-191500-v35-product-stabilizer";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  var LINKS = {
    telegram: "https://t.me/fototime323",
    vk: "https://vk.com/fototime323",
    max: "https://max.ru/join/bRIUnVt_oVplSVIoptiXlMaLOUqGk0hUYwx9WUmBY1U",
    site: "https://fototime323.lpmotortest.com",
    avito: AVITO_URL
  };

  var STYLE_NAMES = [
    "Атлантида", "Барби", "Баблгам", "Бизнес", "Рождество", "Комикс",
    "Киберпанк", "Дубай", "Лесная сказка", "Цветы", "GTA", "Гангстеры",
    "Поле боя", "Кибернетика", "Алхимик", "Пираты", "Кабаре", "Diamonds",
    "Luxor", "Biker NB"
  ];

  var manualStyleSelected = false;
  var generationStartedThisSession = false;

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  if (!window.__FT_V35_LOGGED__) {
    window.__FT_V35_LOGGED__ = true;
    console.info("[FOTOTIME DEPLOY VERSION]", VERSION);
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/[&<>"']/g, function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[ch];
      });
  }

  function toast(message) {
    var old = document.getElementById("ftV35Toast");
    if (old) old.remove();

    var node = document.createElement("div");
    node.id = "ftV35Toast";
    node.className = "ft-v35-toast";
    node.textContent = message;
    document.body.appendChild(node);

    setTimeout(function () {
      if (node.parentNode) node.remove();
    }, 3200);
  }

  function ensureVersionBadge() {
    var old = document.getElementById("ftDeployVersionBadge");
    if (old) {
      old.textContent = VERSION;
      return;
    }

    if (document.querySelector(".ft-v35-version-badge")) return;

    var badge = document.createElement("div");
    badge.className = "ft-v35-version-badge";
    badge.textContent = VERSION;
    document.body.appendChild(badge);
  }

  function svgData(svg) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function previewSvg(name) {
    var n = norm(name);
    var title = escapeHtml(name || "Стиль");

    var palette = {
      bg1: "#e8fff7",
      bg2: "#baff14",
      bg3: "#5ee7d0",
      outfit1: "#ffffff",
      outfit2: "#294a43"
    };

    if (n.includes("барби") || n.includes("бабл")) {
      palette = { bg1: "#fff1f8", bg2: "#ff8fd3", bg3: "#8be9ff", outfit1: "#ffd1ec", outfit2: "#7b3d62" };
    } else if (n.includes("кибер") || n.includes("gta")) {
      palette = { bg1: "#081b2a", bg2: "#48ffe0", bg3: "#baff14", outfit1: "#182c3a", outfit2: "#9cffef" };
    } else if (n.includes("рожде")) {
      palette = { bg1: "#fff8ec", bg2: "#ff4f4f", bg3: "#46e18c", outfit1: "#e63946", outfit2: "#ffffff" };
    } else if (n.includes("атлан")) {
      palette = { bg1: "#e7fbff", bg2: "#32d6ff", bg3: "#6ff0c8", outfit1: "#ffffff", outfit2: "#2d80a0" };
    } else if (n.includes("бизнес")) {
      palette = { bg1: "#f5f0e8", bg2: "#c9b18a", bg3: "#49645e", outfit1: "#f7f4ef", outfit2: "#3f4a46" };
    } else if (n.includes("пират") || n.includes("ганг")) {
      palette = { bg1: "#f2eadf", bg2: "#a66a3f", bg3: "#2d2a25", outfit1: "#ece2d0", outfit2: "#313131" };
    } else if (n.includes("лес") || n.includes("цвет")) {
      palette = { bg1: "#efffea", bg2: "#77d68b", bg3: "#ffd36b", outfit1: "#ffffff", outfit2: "#54735c" };
    }

    return svgData(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + palette.bg1 + '"/>' +
      '<stop offset=".55" stop-color="' + palette.bg2 + '"/>' +
      '<stop offset="1" stop-color="' + palette.bg3 + '"/>' +
      '</linearGradient>' +
      '<filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity=".18"/></filter>' +
      '</defs>' +
      '<rect width="640" height="800" fill="url(#g)"/>' +
      '<circle cx="96" cy="110" r="86" fill="#fff" opacity=".35"/>' +
      '<circle cx="560" cy="140" r="130" fill="#fff" opacity=".24"/>' +
      '<circle cx="502" cy="690" r="160" fill="#fff" opacity=".18"/>' +
      '<g filter="url(#s)">' +
      '<ellipse cx="250" cy="744" rx="130" ry="28" fill="#000" opacity=".16"/>' +
      '<ellipse cx="410" cy="744" rx="130" ry="28" fill="#000" opacity=".13"/>' +
      '<path d="M190 395 C160 480 150 610 160 735 H340 C350 610 340 480 310 395 Z" fill="' + palette.outfit1 + '"/>' +
      '<path d="M340 398 C318 490 312 610 324 735 H520 C526 610 510 490 472 398 Z" fill="' + palette.outfit2 + '"/>' +
      '<circle cx="252" cy="284" r="82" fill="#f3c7a7"/>' +
      '<circle cx="412" cy="284" r="82" fill="#e9b893"/>' +
      '<path d="M174 280 C182 168 320 155 338 276 C303 230 232 224 174 280 Z" fill="#7b5338"/>' +
      '<path d="M334 280 C348 170 485 158 503 278 C465 235 393 228 334 280 Z" fill="#6b4b34"/>' +
      '<rect x="108" y="90" width="424" height="76" rx="26" fill="#fff" opacity=".58"/>' +
      '<text x="320" y="136" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#17342f">' + title + '</text>' +
      '</g>' +
      '</svg>'
    );
  }

  function knownStyleNameFromText(t) {
    for (var i = 0; i < STYLE_NAMES.length; i++) {
      if (t.includes(STYLE_NAMES[i])) return STYLE_NAMES[i];
    }
    return "";
  }

  function looksLikeStyleCard(el) {
    if (!el || el === document.body) return false;

    var t = textOf(el);
    if (!t || t.length > 260) return false;
    if (!(t.includes("SDXL") || t.includes("FLUX.2") || t.includes("Nano Banana"))) return false;
    if (t.includes("Результат") || t.includes("Мои сгенерированные") || t.includes("Списано")) return false;

    return !!knownStyleNameFromText(t);
  }

  function findStyleCardFromTarget(target) {
    var current = target;

    for (var i = 0; i < 8 && current && current !== document.body; i++) {
      if (looksLikeStyleCard(current)) return current;
      current = current.parentElement;
    }

    return null;
  }

  function decorateStylePreviews() {
    Array.from(document.querySelectorAll("div, article, section, li, button")).forEach(function (card) {
      if (!looksLikeStyleCard(card)) return;

      var name = knownStyleNameFromText(textOf(card));
      if (!name) return;

      var img = card.querySelector("img");

      if (img) {
        if (!img.dataset.ftV35FallbackBound) {
          img.dataset.ftV35FallbackBound = "1";
          img.addEventListener("error", function () {
            img.src = previewSvg(name);
          });
        }

        var src = img.getAttribute("src") || "";
        if (!src || src === "#" || src.includes("undefined") || src.includes("null")) {
          img.src = previewSvg(name);
        }

        img.classList.add("ft-v35-preview-img");
        return;
      }

      if (card.dataset.ftV35PreviewApplied === "1") return;

      var candidates = Array.from(card.querySelectorAll("div, span"))
        .filter(function (el) {
          var t = textOf(el);
          var rect = el.getBoundingClientRect();
          return /^[A-ZА-ЯЁ]{1,4}$/.test(t) && rect.height >= 70 && rect.width >= 70;
        });

      var host = candidates[0];

      if (!host) {
        host = document.createElement("div");
        card.insertBefore(host, card.firstChild);
      }

      host.classList.add("ft-v35-preview-host");
      host.innerHTML = '<img class="ft-v35-preview-img" alt="' + escapeHtml(name) + '" src="' + previewSvg(name) + '">';
      card.dataset.ftV35PreviewApplied = "1";
    });
  }

  function selectedStyleName() {
    var selected = document.querySelector(".ft-v35-style-selected");
    if (selected) return knownStyleNameFromText(textOf(selected));
    return "";
  }

  function removeStyleWarning() {
    var warning = document.getElementById("ftV35StyleWarning");
    if (warning) warning.remove();
  }

  function showStyleWarning() {
    if (document.getElementById("ftV35StyleWarning")) return;

    var photoBlocks = Array.from(document.querySelectorAll("section, article, div"))
      .filter(function (el) {
        var t = textOf(el);
        return t.includes("Фото") && t.includes("JPG") && t.length < 1200;
      });

    var target = photoBlocks[0] || document.querySelector("main") || document.body;

    var warning = document.createElement("div");
    warning.id = "ftV35StyleWarning";
    warning.className = "ft-v35-style-warning";
    warning.textContent = "Перед генерацией выберите стиль вручную. Это защищает от случайного списания кредитов.";
    target.appendChild(warning);
  }

  function updateSelectedStyleText() {
    Array.from(document.querySelectorAll("div, p, span"))
      .filter(function (el) {
        var t = textOf(el);
        return t.includes("Выбран стиль:") && t.length < 140;
      })
      .forEach(function (el) {
        if (!manualStyleSelected) {
          el.textContent = "Стиль не выбран";
        } else {
          var name = selectedStyleName();
          if (name) el.textContent = "Выбран стиль: " + name;
        }
      });
  }

  function updateGenerateButtons() {
    Array.from(document.querySelectorAll("button, a")).forEach(function (el) {
      var t = norm(textOf(el));
      var isGenerate = t.includes("создать ai") || t.includes("создать ai-фото") || t.includes("создать фото");

      if (!isGenerate) return;

      if (!manualStyleSelected) {
        el.classList.add("ft-v35-disabled-generate");
        el.setAttribute("aria-disabled", "true");
      } else {
        el.classList.remove("ft-v35-disabled-generate");
        el.removeAttribute("aria-disabled");
      }
    });
  }

  function bindManualStyleSelection() {
    if (document.body.dataset.ftV35StyleBound === "1") return;
    document.body.dataset.ftV35StyleBound = "1";

    document.addEventListener("click", function (event) {
      var card = findStyleCardFromTarget(event.target);
      if (!card) return;

      manualStyleSelected = true;

      Array.from(document.querySelectorAll(".ft-v35-style-selected")).forEach(function (el) {
        el.classList.remove("ft-v35-style-selected");
      });

      card.classList.add("ft-v35-style-selected");
      removeStyleWarning();
      updateSelectedStyleText();
      updateGenerateButtons();
    }, true);
  }

  function looksLikeGenerateUrl(url) {
    var u = String(url || "").toLowerCase();
    return u.includes("/api/generate") ||
      u.includes("/api/fototime/generate") ||
      u.includes("/api/generation");
  }

  function protectGenerationBeforeServer() {
    if (!window.fetch || window.__FT_V35_FETCH_GUARD__) return;

    window.__FT_V35_FETCH_GUARD__ = true;
    var originalFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();

      if (method === "POST" && looksLikeGenerateUrl(url)) {
        if (!manualStyleSelected) {
          showStyleWarning();
          toast("Сначала выберите стиль вручную. Запрос генерации не отправлен, кредиты не списаны.");

          return Promise.resolve(new Response(JSON.stringify({
            ok: false,
            code: "STYLE_NOT_SELECTED_BY_USER",
            message: "Сначала выберите стиль обработки"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          }));
        }

        generationStartedThisSession = true;
      }

      return originalFetch(input, init);
    };
  }

  function addIconsToButtons() {
    var iconMap = [
      { find: "скачать изображение", icon: "⬇︎" },
      { find: "скачать", icon: "⬇︎" },
      { find: "поделиться", icon: "↗" },
      { find: "создать еще", icon: "＋" },
      { find: "создать ещё", icon: "＋" },
      { find: "проблема с результатом", icon: "!" }
    ];

    Array.from(document.querySelectorAll("button, a")).forEach(function (el) {
      if (el.dataset.ftV35Icon === "1") return;

      var t = norm(textOf(el));
      var item = iconMap.find(function (x) { return t.includes(x.find); });
      if (!item) return;

      el.dataset.ftV35Icon = "1";
      el.innerHTML = '<span aria-hidden="true">' + item.icon + '</span> ' + el.innerHTML;
    });
  }

  function addProblemButtonToResult() {
    Array.from(document.querySelectorAll("section, article, div")).forEach(function (card) {
      var t = textOf(card);
      if (!t.includes("Результат")) return;
      if (!card.querySelector("img")) return;
      if (card.querySelector(".ft-v35-result-problem")) return;
      if (t.length > 3000) return;

      var download = Array.from(card.querySelectorAll("button, a")).find(function (el) {
        return norm(textOf(el)).includes("скач");
      });

      if (!download) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ft-v35-result-problem";
      btn.textContent = "! Проблема с результатом";

      btn.addEventListener("click", function () {
        toast("Проблема отмечена. Проверьте блок критичных ошибок в админке.");
      });

      download.insertAdjacentElement("afterend", btn);
    });
  }

  function hideOrphanResultButtons() {
    Array.from(document.querySelectorAll("div, section, article")).forEach(function (el) {
      var t = textOf(el);
      if (!t.includes("Списано: 40 кредитов")) return;
      if (el.querySelector("img")) return;
      if (t.length > 260) return;

      el.classList.add("ft-v35-orphan-hidden");
    });
  }

  function hideStaleMainResult() {
    if (generationStartedThisSession) return;

    var mainText = textOf(document.querySelector("main") || document.body);
    var isMainFlow = mainText.includes("Участник") && mainText.includes("Стиль обработки") && mainText.includes("Фото");

    if (!isMainFlow) return;

    Array.from(document.querySelectorAll("section, article, div")).forEach(function (card) {
      var t = textOf(card);
      if (!t.includes("Результат")) return;
      if (!card.querySelector("img")) return;
      if (t.length > 3000) return;

      card.classList.add("ft-v35-stale-result-hidden");
    });
  }

  function iconSvg(kind) {
    var label = {
      telegram: "TG",
      vk: "VK",
      max: "M",
      site: "⌂",
      avito: "A"
    }[kind] || "•";

    return '<span class="ft-v35-social-icon">' + label + '</span>';
  }

  function socialLink(kind, title) {
    return '' +
      '<a class="ft-v35-social-link" href="' + LINKS[kind] + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="ft-v35-social-left">' +
          iconSvg(kind) +
          '<span>' + title + '</span>' +
        '</span>' +
        '<span aria-hidden="true">↗</span>' +
      '</a>';
  }

  function rebuildSocialBlock() {
    var cards = Array.from(document.querySelectorAll("section, article, div"))
      .filter(function (el) {
        var t = textOf(el);
        return t.includes("FOTOTIME323") &&
          t.includes("Telegram") &&
          t.includes("VK") &&
          t.includes("Avito") &&
          !t.includes("Обратная связь") &&
          t.length < 1800;
      });

    var card = cards[0];
    if (!card || card.dataset.ftV35SocialBuilt === "1") return;

    card.dataset.ftV35SocialBuilt = "1";
    card.classList.add("ft-v35-social-card");

    card.innerHTML = '' +
      '<div class="ft-v35-social-head">' +
        '<div class="ft-v35-avatar">FT</div>' +
        '<div>' +
          '<div style="font-weight:950;font-size:18px;">FOTOTIME323</div>' +
          '<div style="font-weight:800;opacity:.72;">Поддержка, соцсети и пополнение баланса</div>' +
        '</div>' +
      '</div>' +
      '<div class="ft-v35-social-grid">' +
        socialLink("telegram", "Telegram") +
        socialLink("vk", "VK") +
        socialLink("max", "MAX") +
        socialLink("site", "Сайт") +
        socialLink("avito", "Avito") +
      '</div>';
  }

  function fixAvitoLinks() {
    Array.from(document.querySelectorAll("a, button")).forEach(function (el) {
      var t = norm(textOf(el));
      if (!(t.includes("avito") || t.includes("авито"))) return;

      if (el.tagName === "A") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      } else if (!el.dataset.ftV35Avito) {
        el.dataset.ftV35Avito = "1";
        el.addEventListener("click", function () {
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        });
      }
    });
  }

  function improveGeneratedPhotos() {
    Array.from(document.querySelectorAll("section, article, div")).forEach(function (el) {
      var t = textOf(el);
      if (!t.includes("Мои сгенерированные фото")) return;
      el.classList.add("ft-v35-photo-hover");
      Array.from(el.querySelectorAll("img")).forEach(function (img) {
        img.closest("div, article, section")?.classList.add("ft-v35-generated-card");
      });
    });
  }

  function applyTelegramAvatarFallback() {
    var tgUser = window.Telegram &&
      window.Telegram.WebApp &&
      window.Telegram.WebApp.initDataUnsafe &&
      window.Telegram.WebApp.initDataUnsafe.user;

    var displayName = "Гость FOTOTIME323";
    var photo = "";

    if (tgUser) {
      displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") ||
        tgUser.username ||
        displayName;
      photo = tgUser.photo_url || "";
    }

    Array.from(document.querySelectorAll("div, span, strong, b"))
      .filter(function (el) {
        return textOf(el).includes("local-demo-user") && textOf(el).length < 80;
      })
      .forEach(function (el) {
        el.textContent = displayName;
      });

    Array.from(document.querySelectorAll(".ft-v35-avatar")).forEach(function (avatar) {
      if (photo && !avatar.dataset.ftV35Photo) {
        avatar.dataset.ftV35Photo = "1";
        avatar.innerHTML = '<img alt="avatar" src="' + photo + '" style="width:100%;height:100%;border-radius:inherit;object-fit:cover;">';
      }
    });
  }

  function cleanupAdminSpam() {
    var bodyText = textOf(document.body);
    if (!bodyText.includes("Админ-консоль") && !bodyText.includes("Пользователи")) return;

    document.body.classList.add("ft-v35-admin-cleaned");

    var keep = {};
    Array.from(document.querySelectorAll("button")).forEach(function (btn) {
      var t = textOf(btn);
      var isCreditBtn = ["+50", "+120", "+300", "+700", "Добавить"].includes(t);

      if (!isCreditBtn) return;

      keep[t] = keep[t] || 0;
      keep[t] += 1;

      if (keep[t] > 1) {
        btn.dataset.ftV35AdminDuplicate = "1";
      }
    });

    var inputSeen = false;
    Array.from(document.querySelectorAll("input")).forEach(function (input) {
      var ph = norm(input.getAttribute("placeholder") || "");
      if (!ph.includes("сум")) return;

      if (inputSeen) {
        input.dataset.ftV35AdminDuplicate = "1";
      } else {
        inputSeen = true;
      }
    });
  }

  function run() {
    document.documentElement.dataset.ftVersion = VERSION;

    ensureVersionBadge();
    decorateStylePreviews();
    updateSelectedStyleText();
    updateGenerateButtons();
    addIconsToButtons();
    addProblemButtonToResult();
    hideOrphanResultButtons();
    hideStaleMainResult();
    rebuildSocialBlock();
    fixAvitoLinks();
    improveGeneratedPhotos();
    applyTelegramAvatarFallback();
    cleanupAdminSpam();
  }

  ready(function () {
    manualStyleSelected = false;
    generationStartedThisSession = false;

    bindManualStyleSelection();
    protectGenerationBeforeServer();
    run();

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(run, 180);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
