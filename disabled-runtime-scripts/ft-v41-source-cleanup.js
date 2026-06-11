
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-235900-v41-source-cleanup";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  var manualStyleSelected = false;
  var generationStarted = false;
  var runTimer = null;
  var previewMap = Object.create(null);

  var SOCIALS = [
    ["Telegram", "telegram", "https://t.me/fototime323"],
    ["VK", "vk", "https://vk.com/fototime323"],
    ["MAX", "max", "https://max.ru/join/bRIUnVt_oVplSVIoptiXlMaLOUqGk0hUYwx9WUmBY1U"],
    ["Сайт", "site", "https://fototime323.lpmotortest.com"],
    ["Avito", "avito", AVITO_URL]
  ];

  var STYLE_NAMES = [
    "Атлантида", "Барби", "Баблгам", "Бизнес", "Рождество", "Комикс",
    "Киберпанк", "Дубай", "Лесная сказка", "Цветы", "GTA", "Гангстеры",
    "Поле боя", "Кабаре", "Алхимик", "Пираты", "Diamonds", "Luxor", "Biker NB"
  ];

  if (!window.__FT_V41_LOGGED__) {
    window.__FT_V41_LOGGED__ = true;
    console.info("[FOTOTIME DEPLOY VERSION]", VERSION);
  }

  function textOf(el) {
    return String((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/g, "")
      .trim();
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

  function icon(type) {
    var map = {
      telegram: '<svg viewBox="0 0 24 24"><path d="M21.7 4.3 18.4 20c-.2 1-1 1.2-1.8.7l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.6 13.2.5 11.6c-1-.3-1-1.1.2-1.6L20.4 2.4c.9-.3 1.7.2 1.3 1.9Z"/></svg>',
      vk: '<svg viewBox="0 0 24 24"><path d="M3.8 7.1h3.4c.1 3.4 1.5 4.8 2.5 5.1V7.1H13v2.8c1.1-.1 2.1-1.5 2.5-2.8h3.3c-.4 1.8-1.9 3.4-3 4 1.2.5 3.1 1.9 3.9 4.8H16c-.4-1.4-1.5-2.5-3-2.7v2.7h-.5C6.6 15.9 4.1 12.8 3.8 7.1Z"/></svg>',
      max: '<svg viewBox="0 0 24 24"><path d="M4 18V6h3.4l4.6 6.2L16.6 6H20v12h-3.3v-6.2L12 17.6l-4.7-5.8V18H4Z"/></svg>',
      site: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm6.7 9h-3a15.6 15.6 0 0 0-1.2-5 8 8 0 0 1 4.2 5ZM12 4.1c.8 1.1 1.5 3.6 1.7 6.9h-3.4c.2-3.3.9-5.8 1.7-6.9ZM4.3 13h3.9c.1 2 .5 3.7 1 5A8 8 0 0 1 4.3 13Zm3.9-2H4.3A8 8 0 0 1 9.2 6a17 17 0 0 0-1 5Zm3.8 8.9c-.8-1.1-1.5-3.6-1.7-6.9h3.4c-.2 3.3-.9 5.8-1.7 6.9ZM14.8 18c.5-1.3.9-3 1-5h3.9a8 8 0 0 1-4.9 5Z"/></svg>',
      avito: '<svg viewBox="0 0 24 24"><path d="M7.3 9.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Zm9.3 1.4a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM7.8 22a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm9.5-1.4a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"/></svg>',
      download: '<svg viewBox="0 0 24 24"><path d="M11 3h2v9.1l3.1-3.1 1.4 1.4L12 16 6.5 10.4 7.9 9l3.1 3.1V3Zm-6 16h14v2H5v-2Z"/></svg>',
      share: '<svg viewBox="0 0 24 24"><path d="M18 16.1c-.8 0-1.6.3-2.1.9L8.9 13a3 3 0 0 0 0-2l7-4A3 3 0 1 0 15 5l-7 4a3 3 0 1 0 0 6l7 4a3 3 0 1 0 3-2.9Z"/></svg>',
      plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>'
    };

    return map[type] || "";
  }

  function fallbackPreview(name) {
    var title = escapeXml(name || "Стиль");
    var letters = escapeXml(String(name || "FT").split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0);
    }).join("").toUpperCase() || "FT");

    var c1 = "#80efd0";
    var c2 = "#d8ff67";
    var c3 = "#12342d";

    if (/барби|баблгам/i.test(name)) {
      c1 = "#ff9edb";
      c2 = "#ffe0f2";
      c3 = "#432139";
    } else if (/кибер|gta/i.test(name)) {
      c1 = "#0e1529";
      c2 = "#57ead6";
      c3 = "#ffffff";
    } else if (/рождество/i.test(name)) {
      c1 = "#ef5050";
      c2 = "#8df0a2";
      c3 = "#ffffff";
    } else if (/атлантида/i.test(name)) {
      c1 = "#31ceff";
      c2 = "#73efca";
      c3 = "#0c332d";
    }

    var svg = ''
      + '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">'
      + '<defs>'
      + '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0%" stop-color="' + c1 + '"/>'
      + '<stop offset="100%" stop-color="' + c2 + '"/>'
      + '</linearGradient>'
      + '</defs>'
      + '<rect width="900" height="1200" rx="56" fill="url(#g)"/>'
      + '<circle cx="720" cy="180" r="150" fill="#fff" opacity=".22"/>'
      + '<circle cx="140" cy="1030" r="190" fill="#fff" opacity=".16"/>'
      + '<rect x="90" y="120" width="720" height="820" rx="46" fill="#fff" opacity=".32"/>'
      + '<text x="450" y="530" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="900" fill="' + c3 + '">' + letters + '</text>'
      + '<text x="450" y="1010" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="900" fill="' + c3 + '">' + title + '</text>'
      + '<text x="450" y="1075" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" fill="' + c3 + '" opacity=".7">FOTOTIME AI STYLE</text>'
      + '</svg>';

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function collectStyles(data, list) {
    if (!data) return;

    if (Array.isArray(data)) {
      data.forEach(function (item) {
        collectStyles(item, list);
      });
      return;
    }

    if (typeof data !== "object") return;

    var name = data.name || data.title || data.label || data.styleName || data.id || data.styleId;
    var preview =
      data.previewUrl ||
      data.preview ||
      data.image ||
      data.thumbnail ||
      data.thumbUrl ||
      data.photo ||
      data.cover ||
      "";

    if (name && preview && !/style-preview|placeholder|undefined|null/i.test(String(preview))) {
      list.push([String(name), String(preview)]);
    }

    ["styles", "items", "data", "result", "catalog"].forEach(function (key) {
      if (data[key]) collectStyles(data[key], list);
    });
  }

  function loadPreviews() {
    if (window.__FT_V41_PREVIEWS_LOADING__) return;
    window.__FT_V41_PREVIEWS_LOADING__ = true;

    ["/api/styles", "/api/fototime/styles", "/api/fototime/catalog"].forEach(function (url) {
      fetch(url).then(function (res) {
        if (!res.ok) throw new Error("no styles");
        return res.json();
      }).then(function (data) {
        var list = [];
        collectStyles(data, list);
        list.forEach(function (pair) {
          previewMap[norm(pair[0])] = pair[1];
        });
        schedule();
      }).catch(function () {});
    });
  }

  function getPreview(name) {
    return previewMap[norm(name)] || fallbackPreview(name);
  }

  function removeOldDebugBadges() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      if (!el || !el.parentElement) return;

      var t = textOf(el);
      if (!/fototime-prod|PhotoTime prod|141454|v38|v39|v40/i.test(t)) return;

      var cs = window.getComputedStyle(el);
      if (cs.position === "fixed" && el.id !== "ftV41CleanVersion") {
        el.remove();
      }
    });
  }

  function isStyleCard(el) {
    if (!el || el === document.body || el.id === "app") return false;

    var t = textOf(el);
    if (!t || t.length > 360) return false;
    if (!/SDXL|FLUX|Nano Banana/i.test(t)) return false;
    if (/Результат|Списано|Скачать|Поделиться|Мои сгенерированные|Пакеты|Баланс|FOTOTIME323/i.test(t)) return false;

    return !!styleNameFromText(t);
  }

  function patchStyleCards() {
    Array.from(document.querySelectorAll("button, article, li, div, [role='button']")).forEach(function (card) {
      if (!isStyleCard(card)) return;

      var rect = card.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80 || rect.height > 700) return;

      var name = styleNameFromText(textOf(card));
      if (!name) return;

      card.classList.add("ft-v41-style-card");
      card.dataset.ftStyleName = name;

      if (!manualStyleSelected) {
        card.classList.remove("active", "selected", "is-active", "is-selected", "current", "chosen");
        card.removeAttribute("aria-current");
        card.setAttribute("aria-selected", "false");
        card.setAttribute("aria-pressed", "false");
      }

      var img = card.querySelector("img");

      if (img) {
        img.classList.add("ft-v41-style-preview-img");
        if (!img.dataset.ftV41ErrorBound) {
          img.dataset.ftV41ErrorBound = "1";
          img.addEventListener("error", function () {
            img.src = fallbackPreview(name);
          });
        }

        var current = img.getAttribute("src") || "";
        if (!current || /placeholder|undefined|null|style-preview|mock/i.test(current)) {
          img.src = getPreview(name);
        }

        return;
      }

      var boxes = Array.from(card.children).filter(function (child) {
        var r = child.getBoundingClientRect();
        var tx = textOf(child);
        return r.width >= 60 && r.height >= 80 && r.height <= 420 && tx.length <= 20;
      });

      if (!boxes.length) return;

      var box = boxes[0];
      box.textContent = "";
      box.classList.add("ft-v41-style-preview-box");
      box.style.backgroundImage = "url('" + getPreview(name) + "')";
    });
  }

  function clearAutoselectText() {
    if (manualStyleSelected) return;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;

    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || "");

      if (/Выбран стиль:\s*Атлантида/i.test(value)) {
        node.nodeValue = value.replace(
          /Выбран стиль:\s*Атлантида\s*·?\s*SDXL/i,
          "Стиль не выбран. Выберите стиль обработки вручную."
        );
      }
    }
  }

  function patchGenerateButtons() {
    Array.from(document.querySelectorAll("button, a, [role='button']")).forEach(function (el) {
      var t = textOf(el);

      if (/создать\s*ai|создать.*фото|сгенерировать/i.test(t)) {
        el.classList.add("ft-v41-generate-button");

        if (!manualStyleSelected) {
          el.classList.add("ft-v41-generate-disabled");
          if (el.tagName && el.tagName.toLowerCase() === "button") {
            el.disabled = true;
          }
        } else {
          el.classList.remove("ft-v41-generate-disabled");
          if (el.tagName && el.tagName.toLowerCase() === "button") {
            el.disabled = false;
          }
        }
      }
    });
  }

  function bindStyleAndGenerateGuard() {
    if (window.__FT_V41_BIND__) return;
    window.__FT_V41_BIND__ = true;

    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest("button, article, li, div, [role='button'], a")
        : null;

      if (!target) return;

      var t = textOf(target);

      if (/создать\s*ai|создать.*фото|сгенерировать/i.test(t) && !manualStyleSelected) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        alert("Сначала выберите стиль обработки вручную. Это защита от случайной генерации и списания кредитов.");
        return false;
      }

      if (isStyleCard(target)) {
        manualStyleSelected = true;
        document.body.classList.add("ft-v41-style-picked");
        schedule();
      }
    }, true);

    document.addEventListener("submit", function (event) {
      if (!manualStyleSelected) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        alert("Сначала выберите стиль обработки вручную.");
        return false;
      }
    }, true);
  }

  function patchFetchGuard() {
    if (!window.fetch || window.__FT_V41_FETCH__) return;
    window.__FT_V41_FETCH__ = true;

    var originalFetch = window.fetch;

    window.fetch = function (input, init) {
      var url = String(typeof input === "string" ? input : (input && input.url) || "");
      var method = String((init && init.method) || "GET").toUpperCase();

      if (/\/api\/generate|\/api\/fototime\/generate/i.test(url) && method === "POST") {
        if (!manualStyleSelected) {
          return Promise.resolve(new Response(JSON.stringify({
            code: "STYLE_NOT_SELECTED_MANUALLY",
            message: "Сначала выберите стиль обработки вручную."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          }));
        }

        generationStarted = true;
        return originalFetch(input, init);
      }

      return originalFetch(input, init);
    };
  }

  function shortestBlockContaining(label, reject) {
    var blocks = Array.from(document.querySelectorAll("section, article, div, main"));
    return blocks.filter(function (el) {
      var t = textOf(el);
      if (!t || t.length > 5000) return false;
      if (reject && reject.test(t)) return false;
      return t.indexOf(label) !== -1;
    }).sort(function (a, b) {
      return textOf(a).length - textOf(b).length;
    })[0] || null;
  }

  function patchResultBlock() {
    var result = shortestBlockContaining("Результат", /Мои сгенерированные фото|Пакеты кредитов|Обратная связь/);
    if (!result) return;

    result.classList.add("ft-v41-result-card");

    Array.from(result.querySelectorAll(".ft-v40-result-placeholder, .ft-v41-result-placeholder")).forEach(function (el) {
      el.remove();
    });

    if (!generationStarted) {
      Array.from(result.querySelectorAll("img, video, canvas")).forEach(function (el) {
        el.classList.add("ft-v41-hide-before-generation");
      });

      var placeholder = document.createElement("div");
      placeholder.className = "ft-v41-result-placeholder";
      placeholder.innerHTML =
        '<strong>Результат появится здесь после генерации</strong>' +
        '<span>Сначала выберите стиль вручную, загрузите фото и нажмите «Создать AI-фото».</span>';

      result.appendChild(placeholder);
    }
  }

  function cleanupResultPlaceholderSpam() {
    var all = Array.from(document.querySelectorAll("div, p, span, section, article"));
    var seen = false;

    all.forEach(function (el) {
      var t = textOf(el);
      if (!/Результат появится здесь после генерации/.test(t)) return;
      if (t.length > 260) return;

      if (!seen) {
        seen = true;
        return;
      }

      el.remove();
    });
  }

  function cleanupOrphanControls() {
    Array.from(document.querySelectorAll("div, p, span, section, article")).forEach(function (el) {
      var t = textOf(el);
      if (!/Списано:\s*40\s*кредитов/i.test(t)) return;
      if (!/Скачать|Поделиться/i.test(t)) return;
      if (t.length > 220) return;
      if (el.querySelector("img")) return;

      var parentText = textOf(el.parentElement);
      if (/Мои сгенерированные фото|Результат/i.test(parentText) && parentText.length < 2200) return;

      el.remove();
    });
  }

  function patchActionIcons() {
    Array.from(document.querySelectorAll("button, a, [role='button']")).forEach(function (el) {
      if (el.dataset.ftV41Icon === "1") return;

      var t = textOf(el);
      var type = "";

      if (/скачать/i.test(t)) type = "download";
      else if (/поделиться/i.test(t)) type = "share";
      else if (/создать.+ещ|создать.+еще/i.test(t)) type = "plus";

      if (!type) return;

      el.dataset.ftV41Icon = "1";
      el.classList.add("ft-v41-action-button");
      el.insertAdjacentHTML("afterbegin", '<span class="ft-v41-action-icon">' + icon(type) + '</span>');
    });
  }

  function cleanupPhotoActionDuplicates() {
    Array.from(document.querySelectorAll("article, li, div")).forEach(function (card) {
      if (!card.querySelector("img")) return;

      var t = textOf(card);
      if (!/Скачать|Поделиться/i.test(t)) return;
      if (t.length > 1100) return;

      ["скачать", "поделиться"].forEach(function (word) {
        var count = 0;
        Array.from(card.querySelectorAll("button, a")).forEach(function (btn) {
          if (textOf(btn).toLowerCase().indexOf(word) === -1) return;
          count += 1;
          if (count > 1) btn.remove();
        });
      });
    });
  }

  function rebuildSocialBlock() {
    var blocks = Array.from(document.querySelectorAll("section, article, div")).filter(function (el) {
      var t = textOf(el);
      if (!/FOTOTIME323/i.test(t)) return false;
      if (!/Telegram/i.test(t)) return false;
      if (!/Avito/i.test(t)) return false;
      if (/Обратная связь|Мои сгенерированные фото|Пакеты кредитов/i.test(t)) return false;
      return t.length < 2500;
    }).sort(function (a, b) {
      return textOf(a).length - textOf(b).length;
    });

    var block = blocks[0];
    if (!block) return;

    block.classList.add("ft-v41-social-block");

    Array.from(block.querySelectorAll(".ft-v41-social-grid")).forEach(function (el) {
      el.remove();
    });

    Array.from(block.querySelectorAll("a, button")).forEach(function (el) {
      if (!el.closest(".ft-v41-social-grid")) {
        el.classList.add("ft-v41-old-social-hidden");
      }
    });

    var grid = document.createElement("div");
    grid.className = "ft-v41-social-grid";

    SOCIALS.forEach(function (item) {
      var label = item[0];
      var type = item[1];
      var url = item[2];

      var a = document.createElement("a");
      a.className = "ft-v41-social-link ft-v41-social-" + type;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML =
        '<span class="ft-v41-social-icon">' + icon(type) + '</span>' +
        '<span class="ft-v41-social-label">' + label + '</span>' +
        '<span class="ft-v41-social-arrow">↗</span>';

      grid.appendChild(a);
    });

    block.appendChild(grid);
  }

  function bindAvitoHardLink() {
    if (window.__FT_V41_AVITO__) return;
    window.__FT_V41_AVITO__ = true;

    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest("a, button, [role='button']")
        : null;

      if (!el) return;

      var t = textOf(el);
      var href = el.getAttribute ? String(el.getAttribute("href") || "") : "";

      if (/avito|авито/i.test(t) || /avito\.ru/i.test(href)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        return false;
      }
    }, true);
  }

  function patchAdminSpam() {
    var bodyText = textOf(document.body);
    if (!/Админ|Админ-консоль|Пользователи/i.test(bodyText)) return;

    var block = shortestBlockContaining("Пользователи", null);
    if (!block) return;

    block.classList.add("ft-v41-admin-users");

    if (block.querySelector(".ft-v41-admin-compact")) return;

    var originalButtons = Array.from(block.querySelectorAll("button"));
    var originalInputs = Array.from(block.querySelectorAll("input, select"));

    originalButtons.forEach(function (btn) {
      btn.classList.add("ft-v41-admin-original-hidden");
    });

    originalInputs.forEach(function (input) {
      input.classList.add("ft-v41-admin-original-hidden");
    });

    var panel = document.createElement("div");
    panel.className = "ft-v41-admin-compact";
    panel.innerHTML =
      '<div class="ft-v41-admin-title">Пользователь: <strong>local-demo-user</strong></div>' +
      '<div class="ft-v41-admin-balance">Баланс: <input class="ft-v41-admin-balance-input" type="number" min="0" value="170"> <button type="button" class="ft-v41-admin-save">Сохранить</button></div>' +
      '<div class="ft-v41-admin-buttons">' +
      '<button type="button" data-add="+50">+50</button>' +
      '<button type="button" data-add="+120">+120</button>' +
      '<button type="button" data-add="+300">+300</button>' +
      '<button type="button" data-add="+700">+700</button>' +
      '</div>';

    block.appendChild(panel);

    panel.addEventListener("click", function (event) {
      var btn = event.target.closest("button");
      if (!btn) return;

      var add = btn.getAttribute("data-add");

      if (add) {
        var target = originalButtons.find(function (b) {
          return textOf(b) === add || textOf(b) === add.replace("+", "");
        });

        if (target) target.click();
        return;
      }

      if (btn.classList.contains("ft-v41-admin-save")) {
        var save = originalButtons.find(function (b) {
          return /сохранить/i.test(textOf(b));
        });

        if (save) save.click();
      }
    });
  }

  function fixProfileSpacing() {
    Array.from(document.querySelectorAll("section, article, div")).forEach(function (el) {
      var t = textOf(el);
      if (/Мои сгенерированные фото|FOTOTIME323|Обратная связь|Пакеты кредитов|Уведомления/i.test(t) && t.length < 3000) {
        el.classList.add("ft-v41-profile-block");
      }
    });
  }

  function run() {
    if (!document.body) return;

    removeOldDebugBadges();
    patchStyleCards();
    clearAutoselectText();
    patchGenerateButtons();
    patchResultBlock();
    cleanupResultPlaceholderSpam();
    cleanupOrphanControls();
    patchActionIcons();
    cleanupPhotoActionDuplicates();
    rebuildSocialBlock();
    patchAdminSpam();
    fixProfileSpacing();
  }

  function schedule() {
    clearTimeout(runTimer);
    runTimer = setTimeout(run, 120);
  }

  bindStyleAndGenerateGuard();
  bindAvitoHardLink();
  patchFetchGuard();
  loadPreviews();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  var observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
