#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const APP_JS = path.join(ROOT, "app.js");

const LOCKED_MAP_HELPER =
  "function buildLockedPositionsMap(A){const V=new Map;for(const[I,U]of A){const l=new Map;U[0]&&l.set(1,U[0].teamCode),U[1]&&l.set(2,U[1].teamCode),U[2]&&l.set(3,U[2].teamCode),V.set(I,l)}return V}";

const SORT_BRACKET_HELPER =
  'function sortBracketMatches(A,V){if(!V.length)return[...A].sort((I,U)=>I.id.localeCompare(U.id));const l=new Map(A.map(W=>[W.id,W])),W=[],N=new Set;for(const a of V)for(const m of[a.homeTeam,a.awayTeam])if(m.kind==="matchWinner"){const d=l.get(m.matchId);d&&!N.has(d.id)&&(W.push(d),N.add(d.id))}for(const a of A)N.has(a.id)||W.push(a);return W}';

const LEGACY_RU_HELPER =
  "function rU(A){const V=new Map;for(const[I,U]of A){const l=new Map;U[0]&&l.set(1,U[0].teamCode),U[1]&&l.set(2,U[1].teamCode),U[2]&&l.set(3,U[2].teamCode),V.set(I,l)}return V}";

const REACT_ACTIVE_ELEMENT_HELPER =
  'function wU(A){if(A=A||(typeof document<"u"?document:void 0),typeof A>"u")return null;try{return A.activeElement||A.body}catch{return A.body}}';

const LEGACY_FORM_VERDICT_HELPER =
  "function wU(A,V,I){if(A.homeTeam.kind";

function readBundle() {
  return fs.readFileSync(APP_JS, "utf8");
}

function writeBundle(code) {
  fs.writeFileSync(APP_JS, code);
}

function sanitizeBundle(code) {
  let out = code;

  if (out.includes(LEGACY_RU_HELPER)) {
    out = out.replaceAll(LEGACY_RU_HELPER, LOCKED_MAP_HELPER);
  }
  out = out.replace(/([^a-zA-Z0-9_$])rU\(/g, "$1buildLockedPositionsMap(");

  while (out.includes(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER)) {
    out = out.replace(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER, LOCKED_MAP_HELPER);
  }

  while (out.includes(SORT_BRACKET_HELPER + SORT_BRACKET_HELPER)) {
    out = out.replace(SORT_BRACKET_HELPER + SORT_BRACKET_HELPER, SORT_BRACKET_HELPER);
  }

  out = out.replaceAll(
    "lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null)",
    "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[qN,rN]=S.useState(null)"
  );
  out = out.replaceAll(
    "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null)",
    "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[qN,rN]=S.useState(null)"
  );
  out = out.replaceAll("lockedPositions:W}=Xl()", "lockedPositions:e}=Xl()");
  out = out.replaceAll("locked:W.get(d)", "locked:e.get(d)");
  out = out.replaceAll(
    "editing:W===F.id,onClick:()=>N(W===F.id?null:F.id),onSave:h=>{U(F.id,h),N(null)},onClear:()=>{l(F.id),N(null)},onCancel:()=>N(null)",
    "editing:qN===F.id,onClick:()=>rN(qN===F.id?null:F.id),onSave:h=>{U(F.id,h),rN(null)},onClear:()=>{l(F.id),rN(null)},onCancel:()=>rN(null)"
  );

  if (out.includes(LEGACY_FORM_VERDICT_HELPER)) {
    out = out.replace(
      LEGACY_FORM_VERDICT_HELPER,
      "function computeFormVerdict(A,V,I){if(!A||!A.homeTeam||!A.awayTeam)return null;if(A.homeTeam.kind"
    );
  }
  out = out.replaceAll("!I?wU(V,U,l):null", "!I?computeFormVerdict(V,U,l):null");

  if (!out.includes(REACT_ACTIVE_ELEMENT_HELPER)) {
    out = out.replace(
      "A!==I?(V.setValue(A),!0):!1}function e1(A,V){",
      `A!==I?(V.setValue(A),!0):!1}${REACT_ACTIVE_ELEMENT_HELPER}function e1(A,V){`
    );
  }

  return out;
}

function validateModuleSyntax(code) {
  const tmp = path.join(os.tmpdir(), `wc-bundle-${process.pid}.mjs`);
  fs.writeFileSync(tmp, code);
  try {
    execSync(`node --check ${JSON.stringify(tmp)}`, { stdio: "pipe" });
    return null;
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.message;
    return msg.split("\n").pop();
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

module.exports = {
  APP_JS,
  LOCKED_MAP_HELPER,
  SORT_BRACKET_HELPER,
  LEGACY_RU_HELPER,
  REACT_ACTIVE_ELEMENT_HELPER,
  LEGACY_FORM_VERDICT_HELPER,
  readBundle,
  writeBundle,
  sanitizeBundle,
  validateModuleSyntax,
};
