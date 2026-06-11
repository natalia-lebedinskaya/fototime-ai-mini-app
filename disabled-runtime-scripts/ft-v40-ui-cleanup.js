
(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-232000-v40-ui-cleanup";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  var manualStyleSelected = false;
  var generationSucceededThisSession = false;
  var runTimer = null;

  if (!window.__FT_V40_LOGGED__) {
    window.__FT_V40_LOGGED__ = true;
    console.info("[FOTOTIME DEPLOY VERSION]", VERSION);
  }

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

  function svgIcon(type) {
    var icons = {
      telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 4.4 18.3 20c-.2 1-1 1.2-1.8.7l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.6 13.2.5 11.6c-1-.3-1-1.1.2-1.6L20.3 2.4c.9-.3 1.7.2 1.3 2Z"/></svg>',
      vk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 7.2h3.1c.1 3.2 1.4 4.6 2.4 4.9V7.2h3v2.8c1-.1 2-1.5 2.3-2.8h3c-.3 1.7-1.8 3.2-2.8 3.8 1.1.5 2.9 1.8 3.6 4.5h-3.3c-.4-1.3-1.4-2.3-2.8-2.5v2.5h-.4C6.5 15.5 4.5 12.6 4.2 7.2Z"/></svg>',
      max: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V6h3.3l4.7 6.2L16.7 6H20v12h-3.4v-6.3L12 17.5l-4.6-5.8V18H4Z"/></svg>',
      site: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm6.8 9h-3.1a15 15 0 0 0-1.2-5A8 8 0 0 1 18.8 11ZM12 4.1c.8 1.1 1.5 3.6 1.7 6.9h-3.4c.2-3.3.9-5.8 1.7-6.9ZM4.3 13h3.9c.1 2 .5 3.7 1 5A8 8 0 0 1 4.3 13Zm3.9-2H4.3A8 8 0 0 1 9.2 6a17 17 0 0 0-1 5Zm3.8 8.9c-.8-1.1-1.5-3.6-1.7-6.9h3.4c-.2 3.3-.9 5.8-1.7 6.9ZM14.8 18c.5-1.3.9-3 1-5h3.9a8 8 0 0 1-4.9 5Z"/></svg>',
      avito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 1.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 21.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9.2-1.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/></svg>',
      download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v9.2l3.1-3.1 1.4 1.4L12 17l-5.5-5.5 1.4-1.4 3.1 3.1V4a1 1 0 0 1 1-1ZM5 19h14v2H5v-2Z"/></svg>',
      share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.8 0-1.5.3-2 .8L8.9 12.8a3.4 3.4 0 0 0 0-1.6L16 7.1A3 3 0 1 0 15 5l-7.1 4.1a3 3 0 1 0 0 5.8L15 19a3 3 0 1 0 3-2.9Z"/></svg>',
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>',
      warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 20H2L12 2Zm-1 7v5h2V9h-2Zm0 7v2h2v-2h-2Z"/></svg>'
    };

    return icons[type] || "";
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
      '<stop offset="60%" stop-color="' + c2 + '"/>' +
      '<stop offset="100%" stop-color="' + c1 + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="r" cx="25%" cy="15%" r="82%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity=".92"/>' +
      '<stop offset="52%" stop-color="#fff" stop-opacity=".18"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".16"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="900" height="1200" rx="54" fill="url(#g)"/>' +
      '<rect width="900" height="1200" rx="54" fill="url(#r)"/>' +
      '<circle cx="720" cy="165" r="130" fill="#fff" opacity=".22"/>' +
      '<circle cx="150" cy="1030" r="180" fill="#fff" opacity=".16"/>' +
      '<rect x="90" y="120" width="720" height="820" rx="46" fill="#fff" opacity=".38"/>' +
      '<text x="450" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="900" fill="' + c3 + '">' + initials + '</text>' +
      '<text x="450" y="1015" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="' + c3 + '">' + title + '</text>' +
      '<text x="450" y="1082" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="' + c3 + '" opacity=".72">FOTOTIME AI STYLE</text>' +
      '</svg>';

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function removeOldBadges() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      if (!el || el.id === "ftV40VersionBadge") return;

      var t = textOf(el);
      var s = window.getComputedStyle(el);

      if (
        s.position === "fixed" &&
        /fototime-prod|PhotoTime prod|141454|v37|v38|v39/i.test(t)
      ) {
        try { el.remove(); } catch (e) {}
      }
    });

    if (!document.getElementById("ftV40VersionBadge")) {
      var badge = document.createElement("div");
      badge.id = "ftV40VersionBadge";
      badge.textContent = VERSION;
      badge.style.cssText = "position:fixed;left:10px;bottom:78px;z-index:99999;padding:7px 11px;border-radius:999px;font-size:11px;font-weight:900;line-height:1;background:rgba(20,30,25,.76);color:#d7ff36;border:1px solid rgba(215,255,54,.42);pointer-events:none;";
      document.body.appendChild(badge);
    }
  }

  function looksLikeStyleCard(el) {
    if (!el || el === document.body || el.id === "app") return false;

    var t = textOf(el);
    if (!t || t.length > 300) return false;
    if (!/SDXL|FLUX|Nano Banana/i.test(t)) return false;
    if (/Результат|Списано|Скачать|Поделиться|Мои сгенерированные|Пакеты|Баланс/i.test(t)) return false;

    return !!styleNameFromText(t);
  }

  function patchStyleCards() {
    var cards = Array.from(document.querySelectorAll("button, article, li, div")).filter(looksLikeStyleCard);

    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 90 || rect.height > 640) return;

      var name = styleNameFromText(textOf(card));
      if (!name) return;

      card.classList.add("ft-v40-style-card");

      if (!manualStyleSelected) {
        card.classList.remove("active", "selected", "is-active", "is-selected", "current", "chosen");
        card.removeAttribute("aria-current");
        card.setAttribute("aria-selected", "false");
      }

      var img = card.querySelector("img");

      if (img) {
        img.classList.add("ft-v40-preview-img");

        if (!img.dataset.ftV40ErrorBound) {
          img.dataset.ftV40ErrorBound = "1";
          img.addEventListener("error", function () {
            img.src = svgPreview(name);
          });
        }

        var src = img.getAttribute("src") || "";
        if (!src || /placeholder|undefined|null|blob:$|mock|demo/i.test(src)) {
          img.src = svgPreview(name);
        }

        return;
      }

      var box = null;

      Array.from(card.children).some(function (node) {
        var nr = node.getBoundingClientRect();
        var nt = textOf(node);

        if (nr.width >= 55 && nr.height >= 70 && nr.height <= 380 && nt.length <= 12) {
          box = node;
          return true;
        }

        return false;
      });

      if (!box) return;

      box.textContent = "";
      box.classList.add("ft-v40-preview-box");
      box.style.backgroundImage = "url('" + svgPreview(name) + "')";
    });
  }

  function clearDefaultSelectedText() {
    if (manualStyleSelected) return;

    var walker = document.createTreeWalker(document.body, 4);
    var node;

    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || "");
      if (value.length < 160 && /Выбран стиль:\s*Атлантида/i.test(value)) {
        node.nodeValue = value.replace(
          /Выбран стиль:\s*Атлантида\s*·?\s*SDXL/i,
          "Стиль не выбран. Выберите стиль обработки вручную."
        );
      }
    }
  }

  function bindStyleClicks() {
    if (window.__FT_V40_STYLE_BIND__) return;
    window.__FT_V40_STYLE_BIND__ = true;

    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest("button, article, li, div, [role='button']")
        : null;

      if (looksLikeStyleCard(el)) {
        manualStyleSelected = true;
        document.body.classList.add("ft-v40-style-picked");
      }
    }, true);
  }

  function updateGenerateButtons() {
    Array.from(document.querySelectorAll("button, a, [role='button']")).forEach(function (el) {
      var t = textOf(el);

      if (/создать\s*ai|создать.*фото|сгенерировать/i.test(t)) {
        if (!manualStyleSelected) {
          el.classList.add("ft-v40-generate-disabled");
          if (el.tagName && el.tagName.toLowerCase() === "button") {
            el.disabled = true;
          }
        } else {
          el.classList.remove("ft-v40-generate-disabled");
          if (el.tagName && el.tagName.toLowerCase() === "button") {
            el.disabled = false;
          }
        }
      }
    });
  }

  function guardGenerateFetch() {
    if (!window.fetch || window.__FT_V40_FETCH_GUARD__) return;
    window.__FT_V40_FETCH_GUARD__ = true;

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

        return originalFetch(input, init).then(function (response) {
          if (response && response.ok) {
            generationSucceededThisSession = true;
            document.body.classList.add("ft-v40-generation-succeeded");
          }
          return response;
        });
      }

      return originalFetch(input, init);
    };
  }

  function findCardByHeading(label) {
    var candidates = Array.from(document.querySelectorAll("section, article, div"));

    return candidates
      .filter(function (el) {
        var t = textOf(el);
        if (!t || t.length > 2600) return false;
        return t.indexOf(label) !== -1;
      })
      .sort(function (a, b) {
        return textOf(a).length - textOf(b).length;
      })[0] || null;
  }

  function hideInitialResultSource() {
    if (generationSucceededThisSession) return;

    var card = findCardByHeading("Результат");
    if (!card) return;
    if (/Мои сгенерированные фото/i.test(textOf(card))) return;

    card.classList.add("ft-v40-result-empty");

    Array.from(card.querySelectorAll("img, video, canvas")).forEach(function (el) {
      el.classList.add("ft-v40-initial-result-media-hidden");
    });

    if (!card.querySelector(".ft-v40-result-placeholder")) {
      var placeholder = document.createElement("div");
      placeholder.className = "ft-v40-result-placeholder";
      placeholder.innerHTML = '<strong>Результат появится здесь после генерации</strong><span>Сначала выберите стиль вручную, загрузите фото и нажмите «Создать AI-фото».</span>';
      card.appendChild(placeholder);
    }
  }

  function restoreGeneratedPhotoButtons() {
    var profile = findCardByHeading("Мои сгенерированные фото");
    if (!profile) return;

    profile.classList.add("ft-v40-history-card");
    Array.from(profile.querySelectorAll(".ft-v39-hidden, .ft-v40-hidden")).forEach(function (el) {
      el.classList.remove("ft-v39-hidden", "ft-v40-hidden");
      el.style.display = "";
    });

    Array.from(profile.querySelectorAll("img")).forEach(function (img) {
      img.classList.add("ft-v40-history-img");

      var card = img.closest("article, li, div") || img.parentElement;
      if (!card || card.dataset.ftV40HistoryActions === "1") return;

      var src = img.getAttribute("src");
      if (!src) return;

      var actions = document.createElement("div");
      actions.className = "ft-v40-history-actions";
      actions.innerHTML =
        '<a class="ft-v40-action-btn" href="' + src + '" download>' + svgIcon("download") + '<span>Скачать</span></a>' +
        '<button class="ft-v40-action-btn" type="button">' + svgIcon("share") + '<span>Поделиться</span></button>';

      var shareBtn = actions.querySelector("button");
      shareBtn.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share({ title: "FOTOTIME AI", url: new URL(src, location.origin).href }).catch(function () {});
        } else {
          navigator.clipboard && navigator.clipboard.writeText(new URL(src, location.origin).href);
          alert("Ссылка на фото скопирована.");
        }
      });

      card.appendChild(actions);
      card.dataset.ftV40HistoryActions = "1";
    });
  }

  function cleanupSocialIconsAndLinks() {
    var socialRules = [
      { re: /telegram/i, type: "telegram" },
      { re: /^vk$|vk|вк/i, type: "vk" },
      { re: /^max$|max/i, type: "max" },
      { re: /сайт|site/i, type: "site" },
      { re: /avito|авито/i, type: "avito" }
    ];

    Array.from(document.querySelectorAll("a, button, [role='button']")).forEach(function (el) {
      var t = textOf(el);
      var rule = null;

      for (var i = 0; i < socialRules.length; i += 1) {
        if (socialRules[i].re.test(t)) {
          rule = socialRules[i];
          break;
        }
      }

      if (!rule) return;

      el.classList.add("ft-v40-social-btn");

      Array.from(el.querySelectorAll(".ft-v39-social-icon, .ft-v40-social-icon")).forEach(function (icon) {
        icon.remove();
      });

      Array.from(el.children).forEach(function (child) {
        var ct = textOf(child);
        if (/^(✈|VK|M|A|⌂|●)$/.test(ct) && child.children.length === 0) {
          child.remove();
        }
      });

      if (!el.querySelector(".ft-v40-social-icon")) {
        var iconWrap = document.createElement("span");
        iconWrap.className = "ft-v40-social-icon ft-v40-social-icon-" + rule.type;
        iconWrap.innerHTML = svgIcon(rule.type);
        el.insertBefore(iconWrap, el.firstChild);
      }

      if (rule.type === "avito") {
        if (el.tagName && el.tagName.toLowerCase() === "a") {
          el.href = AVITO_URL;
          el.target = "_blank";
          el.rel = "noopener noreferrer";
        }
        el.dataset.ftV40Avito = "1";
      }
    });
  }

  function bindAvitoClick() {
    if (window.__FT_V40_AVITO_BIND__) return;
    window.__FT_V40_AVITO_BIND__ = true;

    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest("a, button, [role='button']")
        : null;

      if (!el) return;

      var href = el.getAttribute && String(el.getAttribute("href") || "");
      var t = textOf(el);

      if (/avito|авито/i.test(t) || /avito\.ru/i.test(href) || el.dataset.ftV40Avito === "1") {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = AVITO_URL;
      }
    }, true);
  }

  function improveActionButtons() {
    Array.from(document.querySelectorAll("button, a, [role='button']")).forEach(function (el) {
      if (el.classList.contains("ft-v40-social-btn")) return;
      if (el.dataset.ftV40ActionIcon === "1") return;

      var t = textOf(el);
      var type = "";

      if (/скачать/i.test(t)) type = "download";
      else if (/поделиться/i.test(t)) type = "share";
      else if (/создать.+ещ|создать.+еще/i.test(t)) type = "plus";
      else if (/проблема/i.test(t)) type = "warning";

      if (!type) return;

      el.dataset.ftV40ActionIcon = "1";
      el.classList.add("ft-v40-action-btn");
      el.insertAdjacentHTML("afterbegin", '<span class="ft-v40-action-icon">' + svgIcon(type) + '</span>');
    });
  }

  function compactAdminUsers() {
    if (!/Админ|Админ-консоль|Пользователи/i.test(textOf(document.body))) return;

    var usersCard = findCardByHeading("Пользователи");
    if (!usersCard) return;

    usersCard.classList.add("ft-v40-admin-users-card");

    var seenButtons = {};
    Array.from(usersCard.querySelectorAll("button")).forEach(function (btn) {
      var t = textOf(btn);

      if (/^\+?(50|120|300|700)$/.test(t) || /^Добавить$/i.test(t) || /^сумм/i.test(t)) {
        seenButtons[t] = seenButtons[t] || 0;
        seenButtons[t] += 1;

        if (seenButtons[t] > 1) {
          btn.classList.add("ft-v40-admin-duplicate-hidden");
        }
      }
    });

    var seenRows = {};
    Array.from(usersCard.querySelectorAll("div, li, article, tr")).forEach(function (row) {
      var t = textOf(row);
      if (!/local-demo-user/i.test(t)) return;
      if (t.length > 900) return;

      var key = t.replace(/\+?(50|120|300|700)|Добавить|сумм\w*/gi, "").replace(/\s+/g, " ").trim();
      if (!key) return;

      seenRows[key] = seenRows[key] || 0;
      seenRows[key] += 1;

      if (seenRows[key] > 1) {
        row.classList.add("ft-v40-admin-row-duplicate-hidden");
      }
    });
  }

  function fixBlockSpacing() {
    Array.from(document.querySelectorAll("section, article, div")).forEach(function (el) {
      var t = textOf(el);
      if (/Мои сгенерированные фото|FOTOTIME323|Обратная связь|Пакеты кредитов|Уведомления/i.test(t) && t.length < 2500) {
        el.classList.add("ft-v40-profile-block");
      }
    });
  }

  function run() {
    if (!document.body) return;

    removeOldBadges();
    patchStyleCards();
    clearDefaultSelectedText();
    updateGenerateButtons();
    hideInitialResultSource();
    restoreGeneratedPhotoButtons();
    cleanupSocialIconsAndLinks();
    improveActionButtons();
    compactAdminUsers();
    fixBlockSpacing();
  }

  bindStyleClicks();
  bindAvitoClick();
  guardGenerateFetch();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  var observer = new MutationObserver(function () {
    clearTimeout(runTimer);
    runTimer = setTimeout(run, 160);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
