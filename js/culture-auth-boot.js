/**
 * Culture Class wrapper around mrj-auth-boot: CoS/guest bypass and fail-soft when ID check hangs.
 * Load mrj-auth.js immediately before this script.
 */
(function () {
  "use strict";

  var BOOT_SRC = "https://mrjkorea.github.io/mrj-signin/mrj-auth-boot.js";
  var CHECKING_RE = /checking your id/i;
  var MAX_CHECKING_MS = 4500;

  var params = new URLSearchParams(window.location.search);
  var cosMode = params.get("cos") === "1";
  var guestMode =
    cosMode || params.get("guest") === "1" || params.get("demo") === "1";

  var script = document.currentScript;
  var app =
    (script && script.getAttribute && script.getAttribute("data-mrj-app")) ||
    "culture-class";

  function clearAuthWait() {
    try {
      document.documentElement.classList.remove("mrj-auth-locked");
      document.body.classList.remove("auth-wait");
      var gate = document.getElementById("mrj-auth-gate");
      if (gate) gate.hidden = true;
    } catch (ignore) {}
  }

  function dispatchReady(detail) {
    if (window.__ccCultureAuthDone) return;
    window.__ccCultureAuthDone = true;
    clearAuthWait();
    if (cosMode) {
      try {
        if (!localStorage.getItem("culture-class-display-name")) {
          localStorage.setItem("culture-class-display-name", "CoS Guest");
        }
      } catch (ignore) {}
    }
    document.dispatchEvent(
      new CustomEvent("mrj-auth-ready", {
        bubbles: true,
        detail: detail || { guest: guestMode, cos: cosMode },
      })
    );
  }

  document.addEventListener(
    "mrj-auth-ready",
    function () {
      window.__ccCultureAuthDone = true;
      clearAuthWait();
    },
    true
  );

  if (guestMode) {
    var runCos = function () {
      dispatchReady({ guest: true, cos: cosMode, reason: "cos" });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runCos);
    } else {
      runCos();
    }
    return;
  }

  var boot = document.createElement("script");
  boot.src = BOOT_SRC;
  boot.setAttribute("data-mrj-app", app);
  if (script && script.parentNode) {
    script.parentNode.insertBefore(boot, script.nextSibling);
  } else {
    document.head.appendChild(boot);
  }

  var checkingSince = 0;
  var started = Date.now();

  var watchdog = window.setInterval(function () {
    if (window.__ccCultureAuthDone) {
      window.clearInterval(watchdog);
      return;
    }
    var gate = document.getElementById("mrj-auth-gate");
    if (!gate || gate.hidden) {
      checkingSince = 0;
      return;
    }
    var text = gate.textContent || "";
    if (CHECKING_RE.test(text)) {
      if (!checkingSince) checkingSince = Date.now();
      if (Date.now() - checkingSince >= MAX_CHECKING_MS) {
        window.clearInterval(watchdog);
        dispatchReady({ guest: true, reason: "checking-timeout" });
      }
      return;
    }
    checkingSince = 0;
    if (Date.now() - started > 15000 && !window.MRJ_STUDENT) {
      var doors =
        text.indexOf("I already have") !== -1 ||
        text.indexOf("I'm new") !== -1 ||
        text.indexOf("I already have an ID") !== -1;
      if (!doors) {
        window.clearInterval(watchdog);
        dispatchReady({ guest: true, reason: "gate-timeout" });
      }
    }
  }, 250);
})();
