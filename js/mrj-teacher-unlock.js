/**
 * Teacher session for Culture Class — follows the shared mrj-auth chip only
 * (.mrj-auth-teacher-btn → study_teacher_check / MRJ_AUTH.isTeacher / mrj-teacher).
 */
(function (root) {
  "use strict";

  var pinUnlocked = false;

  function auth() {
    return root.MRJ_AUTH || root.MRJSignin || null;
  }

  function isMrjTeacher() {
    try {
      var api = auth();
      return !!(api && typeof api.isTeacher === "function" && api.isTeacher());
    } catch (ignore) {
      return false;
    }
  }

  function bodyTeacherClass() {
    try {
      return !!(
        root.document &&
        root.document.body &&
        root.document.body.classList.contains("mrj-teacher")
      );
    } catch (ignore2) {
      return false;
    }
  }

  function isUnlocked() {
    return isMrjTeacher() || bodyTeacherClass() || pinUnlocked;
  }

  function teacherCheck(pin) {
    var a = auth();
    if (a && a.preview) {
      return Promise.resolve(
        a.teacherCheck
          ? a.teacherCheck(pin)
          : { ok: false, message: "Preview has no teacher check." }
      );
    }
    if (!a || !a.ENDPOINT) {
      return Promise.resolve({ ok: false, message: "Sign-in is not loaded." });
    }
    var body = {
      action: "study_teacher_check",
      pin: pin,
      id: a.student && a.student(),
      token: a.token && a.token(),
    };
    return fetch(a.ENDPOINT, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return { ok: false, message: "Network error." };
      })
      .then(function (r) {
        if (r && r.error === "bad_action") {
          return {
            ok: false,
            message: "Teacher check is not on the server yet.",
          };
        }
        return r || { ok: false };
      });
  }

  function installRefresh(onRefresh) {
    if (!root.document || typeof onRefresh !== "function") return;
    root.document.addEventListener("mrj-teacher", function () {
      try {
        onRefresh();
      } catch (ignore) {}
    });
    if (isUnlocked()) {
      try {
        onRefresh();
      } catch (ignore2) {}
    }
  }

  function applyUnlockState() {
    if (root.document && root.document.body) {
      root.document.body.classList.toggle("mrj-teacher-unlock-active", isUnlocked());
    }
  }

  function syncFromAuthChip() {
    pinUnlocked = isMrjTeacher() || bodyTeacherClass();
    applyUnlockState();
  }

  root.MRJTeacherUnlock = {
    isMrjTeacher: isMrjTeacher,
    isUnlocked: isUnlocked,
    teacherCheck: teacherCheck,
    installRefresh: installRefresh,
    bindTeacherButton: function () {},
    syncTeacherButton: function () {},
    lock: function () {
      pinUnlocked = false;
      applyUnlockState();
    },
  };

  if (root.document) {
    root.document.addEventListener("mrj-teacher", function () {
      syncFromAuthChip();
    });
    root.document.addEventListener("mrj-auth-ready", function () {
      syncFromAuthChip();
    });
    syncFromAuthChip();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
