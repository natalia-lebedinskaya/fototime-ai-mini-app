(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-164500-v32-demo-critical-guard";
  var AVITO_URL = "https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a";

  window.FT_DEPLOY_VERSION = VERSION;
  window.FT_AVITO_URL = AVITO_URL;

  console.info("[FOTOTIME DEPLOY VERSION]", VERSION);

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function socialKey(text) {
    var t = normalizeText(text).toLowerCase();

    if (t === "telegram" || t.includes("telegram")) return "telegram";
    if (t === "vk" || t === "вк") return "vk";
    if (t === "max" || t === "макс") return "max";
    if (t === "avito" || t === "авито") return "avito";
    if (t === "сайт" || t === "site") return "site";

    return null;
  }

  function setVersionText() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      if (!el || !el.textContent) return;

      var text = normalizeText(el.textContent);

      if (!/fototime-prod-\d{8}/i.test(text)) return;

      if (text.length < 180 || window.getComputedStyle(el).position === "fixed") {
        el.textContent = text.replace(/fototime-prod-\d{8}-\d{6}-v\d+-[A-Za-z0-9_-]+/g, VERSION);
      }
    });
  }

  function fixAvito() {
    Array.from(document.querySelectorAll("a, button")).forEach(function (el) {
      if (socialKey(el.textContent) !== "avito") return;

      if (el.tagName === "A") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      } else if (!el.dataset.ftV32AvitoClick) {
        el.dataset.ftV32AvitoClick = "1";
        el.addEventListener("click", function () {
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        });
      }
    });
  }

  function removeSocialDuplicates() {
    var visibleSocials = Array.from(document.querySelectorAll("a, button"))
      .filter(function (el) {
        var key = socialKey(el.textContent);
        if (!key) return false;

        var rect = el.getBoundingClientRect();
        return rect.width > 20 && rect.height > 10;
      });

    var seen = {};

    visibleSocials.forEach(function (el) {
      var key = socialKey(el.textContent);
      if (!key) return;

      if (!seen[key]) {
        seen[key] = el;
        return;
      }

      var text = normalizeText(el.textContent).toLowerCase();

      if (["telegram", "vk", "max", "avito", "сайт"].includes(text)) {
        el.remove();
      }
    });
  }

  function addProblemButtonToResult() {
    var resultHeaders = Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,b,div"))
      .filter(function (el) {
        return normalizeText(el.textContent) === "Результат";
      });

    resultHeaders.forEach(function (header) {
      var card = header.closest("section, article, div");
      if (!card || card.dataset.ftV32ProblemButton) return;

      var img = card.querySelector("img");
      var downloadButton = Array.from(card.querySelectorAll("a,button"))
        .find(function (el) {
          return normalizeText(el.textContent).toLowerCase().includes("скач");
        });

      if (!img || !downloadButton) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Проблема с результатом";
      btn.style.cssText = [
        "margin-left:6px",
        "padding:7px 10px",
        "border-radius:999px",
        "border:1px solid rgba(255,76,120,.35)",
        "background:rgba(255,76,120,.12)",
        "font-weight:800",
        "font-size:12px",
        "cursor:pointer"
      ].join(";");

      btn.addEventListener("click", async function () {
        btn.disabled = true;
        btn.textContent = "Отправляем...";

        try {
          var payload = {
            type: "USER_REPORTED_BAD_GENERATION_RESULT",
            title: "Пользователь сообщил о плохом результате генерации",
            message: "Результат генерации требует проверки: возможен watermark/demo/не тот результат.",
            details: {
              version: VERSION,
              imageSrc: img.currentSrc || img.src || null,
              pageUrl: location.href,
              pageText: document.body.innerText.slice(0, 2000)
            }
          };

          var response = await fetch("/api/fototime/critical-errors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("HTTP " + response.status);

          btn.textContent = "Отправлено в критичные";
        } catch (error) {
          console.error("[FOTOTIME report bad result failed]", error);
          btn.textContent = "Ошибка отправки";
          btn.disabled = false;
        }
      });

      downloadButton.insertAdjacentElement("afterend", btn);
      card.dataset.ftV32ProblemButton = "1";
    });
  }

  function compactAdminDuplicateUsers() {
    if (!document.body.innerText.includes("Админ-консоль")) return;
    if (!document.body.innerText.includes("Пользователи")) return;

    var candidates = Array.from(document.querySelectorAll("div, section, article"))
      .filter(function (el) {
        var text = normalizeText(el.innerText);
        return text.includes("Пользователи") &&
          text.includes("local-demo-user") &&
          text.includes("+50") &&
          text.includes("+120") &&
          text.length < 8000;
      });

    var box = candidates.sort(function (a, b) {
      return a.innerText.length - b.innerText.length;
    })[0];

    if (!box || box.dataset.ftV32Compacted) return;

    var children = Array.from(box.children);
    var seenUserBlocks = false;

    children.forEach(function (child) {
      var text = normalizeText(child.innerText);

      if (!text.includes("local-demo-user")) return;

      if (!seenUserBlocks) {
        seenUserBlocks = true;
        return;
      }

      if (text.includes("+50") || text.includes("+120") || text.includes("+300") || text.includes("+700")) {
        child.style.display = "none";
        child.dataset.ftV32HiddenDuplicate = "1";
      }
    });

    box.dataset.ftV32Compacted = "1";
  }

  async function renderCriticalErrorsInAdmin() {
    try {
      if (!document.body.innerText.includes("Критичные ошибки")) return;

      var response = await fetch("/api/fototime/critical-errors?limit=8", { cache: "no-store" });
      var data = await response.json();

      var old = document.getElementById("ftV32CriticalErrorsRuntime");
      if (old) old.remove();

      if (!data.ok || !data.items || !data.items.length) return;

      var headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,b,div"))
        .filter(function (el) {
          return normalizeText(el.textContent).includes("Критичные ошибки");
        });

      if (!headings.length) return;

      var target = headings[0].closest("section, article, div") || headings[0].parentElement;
      if (!target) return;

      var box = document.createElement("div");
      box.id = "ftV32CriticalErrorsRuntime";
      box.style.cssText = "margin-top:10px;display:grid;gap:8px;";

      data.items.forEach(function (item) {
        var card = document.createElement("div");
        card.style.cssText = [
          "border:1px solid rgba(255,76,120,.4)",
          "background:rgba(255,76,120,.1)",
          "border-radius:12px",
          "padding:10px",
          "font-size:12px",
          "line-height:1.35"
        ].join(";");

        var reasons = item.details && item.details.reasons
          ? item.details.reasons.join(", ")
          : item.type || "без деталей";

        card.innerHTML =
          "<b>" + (item.title || "Критичная ошибка") + "</b><br>" +
          "<span>" + (item.createdAt || "") + "</span><br>" +
          "<span>Причина: " + reasons + "</span>";

        box.appendChild(card);
      });

      target.appendChild(box);
    } catch (error) {
      console.warn("[FOTOTIME critical admin render failed]", error);
    }
  }

  function cleanup() {
    setVersionText();
    fixAvito();
    removeSocialDuplicates();
    addProblemButtonToResult();
    compactAdminDuplicateUsers();
    renderCriticalErrorsInAdmin();
  }

  ready(function () {
    cleanup();

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(cleanup, 250);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setInterval(cleanup, 2500);
  });
})();
