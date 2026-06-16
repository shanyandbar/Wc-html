#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  LOCKED_MAP_HELPER,
  LEGACY_RU_HELPER,
  validateModuleSyntax,
} = require("./bundle-sanitize");

const INDEX = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(INDEX, "utf8");

const checks = [
  {
    name: "fC autosave semicolon before lN",
    ok: html.includes("CV]);function lN(G)"),
    bad: html.includes("CV])function lN(G)"),
  },
  {
    name: "no duplicate WN state in fC",
    ok: !html.includes("[WN,cN]=S.useState(!!m)"),
  },
  {
    name: "LZ autosave semicolon before return",
    ok: html.includes("[m,F,e,i,c,B,Z,R,o]);return C.jsx"),
    bad: html.includes("[m,F,e,i,c,B,Z,R,o])return C.jsx"),
  },
  {
    name: "no xA state collision in LZ",
    ok: !html.includes("[xA,CV]=S.useState(!!a)"),
  },
  {
    name: "no ])function syntax",
    ok: !/\]\)function /.test(html),
  },
  {
    name: "form verdict present",
    ok: html.includes("function wU(A,V,I)") && html.includes("Form favors"),
  },
  {
    name: "mobile.css linked once",
    ok: (html.match(/href="mobile\.css"/g) || []).length === 1,
  },
  {
    name: "lang toggle removed",
    ok: !html.includes('onClick:()=>U("he")'),
  },
  {
    name: "no duplicate W in BZ",
    ok: !html.includes("lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
    bad: html.includes("lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
  },
  {
    name: "BZ editing state uses qN/rN",
    ok: html.includes("[qN,rN]=S.useState(null)") && html.includes("editing:qN===F.id"),
    bad: html.includes("lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
  },
  {
    name: "locked map helper uses safe name",
    ok: html.includes(LOCKED_MAP_HELPER),
    bad: html.includes(LEGACY_RU_HELPER),
  },
  {
    name: "no duplicate locked map helper",
    ok: !html.includes(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER),
  },
  {
    name: "module script syntax valid",
    ok: validateModuleSyntax(html) === null,
  },
];

let failed = 0;
for (const c of checks) {
  const pass = c.ok && !c.bad;
  console.log(pass ? "OK" : "FAIL", c.name);
  if (!pass) {
    failed++;
    if (c.name === "module script syntax valid") {
      console.log("  ", validateModuleSyntax(html));
    }
  }
}

process.exit(failed ? 1 : 0);
