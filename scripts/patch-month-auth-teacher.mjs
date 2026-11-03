#!/usr/bin/env node
/** Add mrj-auth + culture teacher scripts to month index pages missing them. */
import fs from "node:fs";
import path from "node:path";

const V = "20261104-year-fish-voices-bake";
const AUTH_CSS =
  '  <link rel="stylesheet" href="https://mrjkorea.github.io/mrj-signin/mrj-auth.css?v=20261030-cf-login-1.7.3">\n';
const SCRIPTS = `  <script src="https://mrjkorea.github.io/mrj-signin/mrj-auth.js?v=20261030-cf-login-1.7.3"></script>
  <script src="../../js/culture-auth-boot.js?v=${V}" data-mrj-app="culture-class"></script>
  <script src="../../js/mrj-teacher-unlock.js?v=${V}"></script>
`;

const root = path.join(process.cwd(), "months");
for (let m = 1; m <= 12; m++) {
  const id = String(m).padStart(2, "0");
  const dirs = fs.readdirSync(root).filter((d) => d.startsWith(`${id}-`));
  for (const dir of dirs) {
    const file = path.join(root, dir, "index.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (!html.includes("mrj-auth.js")) {
      if (!html.includes("mrj-auth.css")) {
        html = html.replace(/<link rel="stylesheet" href="\.\.\/\.\.\/assets\/css\/site\.css">/, (m) =>
          m.includes("mrj-auth") ? m : m + "\n" + AUTH_CSS.trimEnd()
        );
      }
      html = html.replace(/<body([^>]*)>/, (match, attrs) => {
        if (match.includes("auth-wait")) return match;
        return `<body class="auth-wait${attrs.includes("class=") ? "" : ""}"${attrs.replace(/\sclass="[^"]*"/, "")}>`;
      });
      // simpler body class
      html = html.replace(/<body>/, '<body class="auth-wait">');
      html = html.replace(/<body class="([^"]*)">/, (full, cls) => {
        if (cls.includes("auth-wait")) return full;
        return `<body class="${cls} auth-wait">`;
      });
      html = html.replace(
        /(<script>window\.CULTURE_MONTH_ID)/,
        `${SCRIPTS}\n$1`
      );
    }
    html = html.replace(/20261102-unlock-all/g, V);
    if (!html.includes("mrj-teacher-unlock.js")) {
      html = html.replace(
        /culture-auth-boot\.js[^<]*<\/script>/,
        (m) => `${m}\n  <script src="../../js/mrj-teacher-unlock.js?v=${V}"></script>`
      );
    }
    html = html.replace(/month-page\.js(\?v=[^"']+)?/, `month-page.js?v=${V}`);
    fs.writeFileSync(file, html);
    console.log("patched", file);
  }
}
