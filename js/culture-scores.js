/**
 * Culture Class -> MRJ Classroom Metrics.
 * Load mrj-auth.js, culture-auth-boot.js and mrj-scores.js before this file.
 * One finished activity -> one row. Same activity in the same page load posts once.
 */
(function (root) {
  "use strict";

  var SLUG = {
    "01": "01-january",
    "02": "02-february",
    "03": "03-march",
    "04": "04-april",
    "05": "05-may",
    "06": "06-june",
    "07": "07-july",
    "08": "08-august",
    "09": "09-september",
    "10": "10-october",
    "11": "11-november",
    "12": "12-december",
  };
  var NAME = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };
  var LABEL = {
    video: "Video",
    quiz: "Daily quiz",
    meet: "Meet the words",
    learn: "Learn",
    memory: "Memory",
    climb: "Mountain climb",
    "climb-quiz": "Feature quiz",
    cp: "CP speak",
    bingo: "Bingo",
    craft: "Craft",
  };

  var posted = {};

  /* Try number for this activity on this device: 1 for the first finished try,
     2 for the next, and so on. The client writes it to attempt_index, so a
     report can tell a retry from a first pass. */
  var ATTEMPT_KEY = "culture-class-attempts";

  function attempts() {
    try {
      var raw = root.localStorage.getItem(ATTEMPT_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function nextAttempt(key) {
    var all = attempts();
    var day = "";
    try {
      day = root.localStorage.getItem(key + ":day") || "";
    } catch (e) {}
    if (day !== today()) {
      all[key] = 0;
      try {
        root.localStorage.setItem(key + ":day", today());
      } catch (e) {}
    }
    var n = (Number(all[key]) || 0) + 1;
    all[key] = n;
    try {
      root.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all));
    } catch (e) {}
    return n;
  }

  function today() {
    var d = new Date();
    return (
      d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
    );
  }

  function pad2(v) {
    var s = String(v == null ? "" : v).trim();
    if (!/^\d{1,2}$/.test(s)) return "";
    var n = parseInt(s, 10);
    return n >= 1 && n <= 12 ? (n < 10 ? "0" : "") + n : "";
  }

  /** Month id "01".."12" from the query string, the page path, or a page hook. */
  function monthId() {
    try {
      var q = new URLSearchParams(root.location.search).get("month");
      var fromQuery = pad2(q);
      if (fromQuery) return fromQuery;
    } catch (e) {}
    var fromGlobal = pad2(root.CULTURE_MONTH_ID);
    if (fromGlobal) return fromGlobal;
    var m = /\/months\/(\d{2})-[a-z]+\//.exec(root.location.pathname || "");
    if (m && pad2(m[1])) return m[1];
    var c = /\/craft\/([a-z]+)\//.exec(root.location.pathname || "");
    if (c) {
      var found = "";
      Object.keys(SLUG).forEach(function (id) {
        if (SLUG[id].slice(3) === c[1]) found = id;
      });
      if (found) return found;
    }
    return "";
  }

  function num(v) {
    var n = Number(v);
    return isFinite(n) ? Math.round(n) : undefined;
  }

  /**
   * record("cp", { scoreValue: 4, scoreMax: 5, durationSeconds: 90, metadata: {} })
   * Resolves with the receiver answer, or a status word when nothing is sent.
   */
  function record(activity, opts) {
    opts = opts || {};
    var id = pad2(opts.month) || monthId();
    var slug = SLUG[id] || "";
    var key = (slug || "unknown") + ":" + activity;
    if (posted[key]) return Promise.resolve({ status: "duplicate" });
    posted[key] = true;

    if (!root.MRJ_SCORES || typeof root.MRJ_SCORES.post !== "function") {
      return Promise.resolve({ status: "skipped", error: "no score client" });
    }
    var student = "";
    try {
      student =
        root.MRJ_AUTH && typeof root.MRJ_AUTH.student === "function"
          ? String(root.MRJ_AUTH.student() || "").trim()
          : "";
    } catch (e) {}
    if (!student) return Promise.resolve({ status: "skipped", error: "no student" });

    var attempt = nextAttempt(key);

    var meta = opts.metadata || {};
    meta.month = slug || id;
    meta.month_id = id;
    meta.activity = activity;
    meta.page = (root.location.pathname || "").replace(/^\/culture-class/, "");

    return root.MRJ_SCORES.post({
      program: "culture-class",
      appName: "Culture Class",
      source: "culture-class",
      bookTitle: "Culture Class " + (NAME[id] || ""),
      unitTitle: (NAME[id] || "Culture Class") + " — " + (LABEL[activity] || activity),
      itemId: "culture-class/" + (slug || "unknown") + "/" + activity,
      itemType: "activity",
      eventKind: "learning_result",
      attemptIndex: attempt,
      scoreValue: num(opts.scoreValue),
      scoreMax: num(opts.scoreMax),
      durationSeconds: num(opts.durationSeconds),
      completed: true,
      metadata: meta,
    });
  }

  function flush() {
    if (root.MRJ_SCORES && typeof root.MRJ_SCORES.flush === "function") {
      try {
        root.MRJ_SCORES.flush();
      } catch (e) {}
    }
  }

  root.CC_SCORES = { record: record, monthId: monthId, flush: flush };

  if (root.addEventListener) {
    root.addEventListener("load", flush);
    root.addEventListener("online", flush);
  }
})(window);
