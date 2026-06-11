(function () {
  "use strict";

  var VERSION = "fototime-prod-20260611-160500-v31-money-guard";
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

  function socialName(text) {
    var t = String(text || "").toLowerCase().replace(/\s+/g, " ").trim();

    if (t.includes("telegram")) return "telegram";
    if (t === "vk" || t.includes(" vk") || t.includes("вк")) return "vk";
    if (t.includes("max") || t.includes("макс")) return "max";
    if (t.includes("avito") || t.includes("авито")) return "avito";
    if (t.includes("сайт") || t.includes("site")) return "site";

    return null;
  }

  function fixAvitoLinks() {
    Array.from(document.querySelectorAll("a, button")).forEach(function (el) {
      var name = socialName(el.textContent);

      if (name !== "avito") return;

      if (el.tagName === "A") {
        el.href = AVITO_URL;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      } else {
        el.addEventListener("click", function () {
          window.open(AVITO_URL, "_blank", "noopener,noreferrer");
        }, { once: false });
      }
    });
  }

  function cleanOldVersionBadges() {
    Array.from(document.querySelectorAll("body *")).forEach(function (el) {
      var text = String(el.textContent || "").trim();

      if (!/fototime-prod-\d{8}/i.test(text)) return;
      if (text.includes(VERSION)) return;

      var style = window.getComputedStyle(el);

      if (style.position === "fixed" || text.length < 120) {
        el.textContent = text.replace(/fototime-prod-\d{8}-\d{6}-v\d+-[A-Za-z0-9_-]+/g, VERSION);
      }
    });
  }

  function cleanSocialDuplicates() {
    var controls = Array.from(document.querySelectorAll("a, button"))
      .filter(function (el) {
        var name = socialName(el.textContent);
        if (!name) return false;

        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    var seen = {};

    controls.forEach(function (el) {
      var name = socialName(el.textContent);
      if (!name) return;

      if (!seen[name]) {
        seen[name] = el;
        return;
      }

      var text = String(el.textContent || "").trim();

      // Удаляем именно повторные соцкнопки, а не системные кнопки приложения
      if (/^(telegram|vk|max|avito|сайт)$/i.test(text) || text.toLowerCase().includes("avito")) {
        el.remove();
      }
    });
  }

  async function renderCriticalErrorsInAdmin() {
    try {
      if (!document.body.innerText.includes("Критичные ошибки")) return;

      var response = await fetch("/api/fototime/critical-errors?limit=8", { cache: "no-store" });
      var data = await response.json();

      var old = document.getElementById("ftV31CriticalErrorsRuntime");
      if (old) old.remove();

      if (!data.ok || !data.items || !data.items.length) return;

      var headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,b,div"))
        .filter(function (el) {
          return String(el.textContent || "").trim().includes("Критичные ошибки");
        });

      if (!headings.length) return;

      var target = headings[0].closest("section, article, div") || headings[0].parentElement;
      if (!target) return;

      var box = document.createElement("div");
      box.id = "ftV31CriticalErrorsRuntime";
      box.style.cssText = [
        "margin-top:10px",
        "display:grid",
        "gap:8px"
      ].join(";");

      data.items.forEach(function (item) {
        var card = document.createElement("div");
        card.style.cssText = [
          "border:1px solid rgba(255,76,120,.35)",
          "background:rgba(255,76,120,.08)",
          "border-radius:12px",
          "padding:10px",
          "font-size:12px",
          "line-height:1.35"
        ].join(";");

        var reasons = item.details && item.details.reasons
          ? item.details.reasons.join(", ")
          : "без деталей";

        card.innerHTML =
          "<b>" + (item.title || item.type || "Критичная ошибка") + "</b><br>" +
          "<span>" + (item.createdAt || "") + "</span><br>" +
          "<span>Причина: " + reasons + "</span>";

        box.appendChild(card);
      });

      target.appendChild(box);
    } catch (error) {
      console.warn("[FOTOTIME critical UI failed]", error);
    }
  }

  function runCleanup() {
    cleanOldVersionBadges();
    fixAvitoLinks();
    cleanSocialDuplicates();
    renderCriticalErrorsInAdmin();
  }

  ready(function () {
    runCleanup();

    var ticks = 0;
    var timer = setInterval(function () {
      ticks += 1;
      runCleanup();

      if (ticks > 20) clearInterval(timer);
    }, 700);

    var observer = new MutationObserver(function () {
      runCleanup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
