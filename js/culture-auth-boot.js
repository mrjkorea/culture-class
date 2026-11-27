/**
 * Culture Class starts the same sign-in door as the other classes.
 * Load mrj-auth.js immediately before this script.
 * The door stays up until the student finishes. No timer closes it.
 */
(function () {
  "use strict";

  var BOOT_SRC =
    "https://mrjkorea.github.io/mrj-signin/mrj-auth-boot.js?v=20261030-cf-login-1.7.3";

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

  if (guestMode) {
    var runCos = function () {
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
          detail: { guest: true, cos: cosMode, reason: "cos" },
        })
      );
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runCos);
    } else {
      runCos();
    }
    return;
  }

  document.addEventListener(
    "mrj-auth-ready",
    function () {
      clearAuthWait();
    },
    true
  );

  var boot = document.createElement("script");
  boot.src = BOOT_SRC;
  boot.setAttribute("data-mrj-app", app);
  if (script && script.parentNode) {
    script.parentNode.insertBefore(boot, script.nextSibling);
  } else {
    document.head.appendChild(boot);
  }
})();
