#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  readBundle,
  LOCKED_MAP_HELPER,
  LEGACY_RU_HELPER,
  REACT_ACTIVE_ELEMENT_HELPER,
  validateModuleSyntax,
} = require("./bundle-sanitize");

const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const html = fs.readFileSync(INDEX, "utf8");
const code = readBundle();

const checks = [
  {
    name: "index.html loads app.js (not inline bundle)",
    ok: html.includes('<script type="module" src="app.js">'),
    bad: html.includes('<script type="module" crossorigin>(function()'),
  },
  {
    name: "fC autosave semicolon before lN",
    ok: code.includes("CV]);function lN(G)"),
    bad: code.includes("CV])function lN(G)"),
  },
  {
    name: "no duplicate WN state in fC",
    ok: !code.includes("[WN,cN]=S.useState(!!m)"),
  },
  {
    name: "LZ autosave semicolon before return",
    ok: code.includes("[m,F,e,i,c,B,Z,R,o]);return C.jsx"),
    bad: code.includes("[m,F,e,i,c,B,Z,R,o])return C.jsx"),
  },
  {
    name: "no xA state collision in LZ",
    ok: !code.includes("[xA,CV]=S.useState(!!a)"),
  },
  {
    name: "no ])function syntax",
    ok: !/\]\)function /.test(code),
  },
  {
    name: "form verdict present",
    ok: code.includes("function computeFormVerdict(A,V,I)") && code.includes("Form favors"),
    bad: code.includes("function wU(A,V,I){if(A.homeTeam"),
  },
  {
    name: "React activeElement helper present",
    ok: code.includes(REACT_ACTIVE_ELEMENT_HELPER),
  },
  {
    name: "mobile.css linked once",
    ok: (html.match(/href="mobile\.css"/g) || []).length === 1,
  },
  {
    name: "lang toggle removed",
    ok: !code.includes('onClick:()=>U("he")'),
  },
  {
    name: "no duplicate W in BZ",
    ok: !code.includes("lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
    bad: code.includes("lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
  },
  {
    name: "BZ editing state uses qN/rN",
    ok: code.includes("[qN,rN]=S.useState(null)") && code.includes("editing:qN===F.id"),
    bad: code.includes("lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]"),
  },
  {
    name: "locked map helper uses safe name",
    ok: code.includes(LOCKED_MAP_HELPER),
    bad: code.includes(LEGACY_RU_HELPER),
  },
  {
    name: "no duplicate locked map helper",
    ok: !code.includes(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER),
  },
  {
    name: "app.js module syntax valid",
    ok: validateModuleSyntax(code) === null,
  },
];

let failed = 0;
for (const c of checks) {
  const pass = c.ok && !c.bad;
  console.log(pass ? "OK" : "FAIL", c.name);
  if (!pass) {
    failed++;
    if (c.name === "app.js module syntax valid") {
      console.log("  ", validateModuleSyntax(code));
    }
  }
}

process.exit(failed ? 1 : 0);
