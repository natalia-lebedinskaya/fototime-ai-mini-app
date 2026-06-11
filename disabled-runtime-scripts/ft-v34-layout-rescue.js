(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-181000-v34-layout-rescue";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";
  var styleWasClicked = false;

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  if (!window.__FT_VERSION_LOGGED__) {
    window.__FT_VERSION_LOGGED__ = true;
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

  function toast(message) {
    var old = document.getElementById("ftV34Toast");
    if (old) old.remove();

    var node = document.createElement("div");
    node.id = "ftV34Toast";
    node.className = "ft-v34-toast";
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

    if (document.querySelector(".ft-v34-version-badge")) return;

    var badge = document.createElement("div");
    badge.className = "ft-v34-version-badge";
    badge.textContent = VERSION;
    document.body.appendChild(badge);
  }

  function fixAvitoLinks() {
    Array.from(document.querySelectorAll("a, button")).forEach(function (el) {
      var t = norm(textOf(el));
      if (!(t.includes("avito") || t.includes("авито"))) return;

      if (el.tagName === "A") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      } else if (!el.dataset.ftV34Avito) {
        el.dataset.ftV34Avito = "1";
        el.addEventListener("click", function () {
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        });
      }
    });
  }

  function findStyleCardFromTarget(target) {
    var current = target;

    for (var i = 0; i < 7 && current && current !== document.body; i++) {
      var t = textOf(current);

      var looksLikeStyle =
        (t.includes("SDXL") || t.includes("FLUX.2") || t.includes("Nano Banana")) &&
        !t.includes("Результат") &&
        !t.includes("Мои сгенерированные") &&
        t.length < 260;

      if (looksLikeStyle) return current;

      current = current.parentElement;
    }

    return null;
  }

  function bindManualStyleSelection() {
    if (document.body.dataset.ftV34StyleBound === "1") return;
    document.body.dataset.ftV34StyleBound = "1";

    document.addEventListener("click", function (event) {
      var card = findStyleCardFromTarget(event.target);
      if (!card) return;

      styleWasClicked = true;

      Array.from(document.querySelectorAll(".ft-v34-style-selected")).forEach(function (el) {
        el.classList.remove("ft-v34-style-selected");
      });

      card.classList.add("ft-v34-style-selected");
      removeStyleWarning();
    }, true);
  }

  function removeStyleWarning() {
    var warning = document.getElementById("ftV34StyleWarning");
    if (warning) warning.remove();
  }

  function showStyleWarning() {
    if (document.getElementById("ftV34StyleWarning")) return;

    var photoBlocks = Array.from(document.querySelectorAll("section, article, div"))
      .filter(function (el) {
        var t = textOf(el);
        return t.includes("Фото") && t.includes("JPG") && t.length < 1200;
      });

    var target = photoBlocks[0] || document.querySelector("main") || document.body;

    var warning = document.createElement("div");
    warning.id = "ftV34StyleWarning";
    warning.className = "ft-v34-style-warning";
    warning.textContent = "Перед генерацией выберите стиль вручную. Это защищает от случайного списания кредитов.";

    target.appendChild(warning);
  }

  function looksLikeGenerateUrl(url) {
    var u = String(url || "").toLowerCase();
    return u.includes("/api/generate") ||
      u.includes("/api/fototime/generate") ||
      u.includes("/api/generation");
  }

  function protectGenerationBeforeServer() {
    if (!window.fetch || window.__FT_V34_FETCH_GUARD__) return;

    window.__FT_V34_FETCH_GUARD__ = true;
    var originalFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();

      if (method === "POST" && looksLikeGenerateUrl(url) && !styleWasClicked) {
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

      return originalFetch(input, init);
    };
  }

  function addProblemButtonToResult() {
    Array.from(document.querySelectorAll("section, article, div")).forEach(function (card) {
      var t = textOf(card);
      if (!t.includes("Результат")) return;
      if (!card.querySelector("img")) return;
      if (card.querySelector(".ft-v34-result-problem")) return;
      if (t.length > 3000) return;

      var download = Array.from(card.querySelectorAll("button, a")).find(function (el) {
        return norm(textOf(el)).includes("скач");
      });

      if (!download) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ft-v34-result-problem";
      btn.textContent = "Проблема с результатом";

      btn.addEventListener("click", function () {
        toast("Проблема отмечена. Проверьте блок критичных ошибок в админке.");
      });

      download.insertAdjacentElement("afterend", btn);
    });
  }

  function run() {
    document.documentElement.dataset.ftVersion = VERSION;
    ensureVersionBadge();
    fixAvitoLinks();
    bindManualStyleSelection();
    protectGenerationBeforeServer();
    addProblemButtonToResult();
  }

  ready(function () {
    run();

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(run, 250);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
