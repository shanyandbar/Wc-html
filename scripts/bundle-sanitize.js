#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const LOCKED_MAP_HELPER =
  "function buildLockedPositionsMap(A){const V=new Map;for(const[I,U]of A){const l=new Map;U[0]&&l.set(1,U[0].teamCode),U[1]&&l.set(2,U[1].teamCode),U[2]&&l.set(3,U[2].teamCode),V.set(I,l)}return V}";

const LEGACY_RU_HELPER =
  "function rU(A){const V=new Map;for(const[I,U]of A){const l=new Map;U[0]&&l.set(1,U[0].teamCode),U[1]&&l.set(2,U[1].teamCode),U[2]&&l.set(3,U[2].teamCode),V.set(I,l)}return V}";

function extractModuleCode(html) {
  const m = html.match(/<script type="module" crossorigin>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("module script not found in index.html");
  return m[1];
}

function sanitizeBundleHtml(html) {
  let out = html;

  // Legacy helper name collides with React's top-level `var rU` in ES modules.
  if (out.includes(LEGACY_RU_HELPER)) {
    out = out.replaceAll(LEGACY_RU_HELPER, LOCKED_MAP_HELPER);
  }
  out = out.replace(/([^a-zA-Z0-9_$])rU\(/g, "$1buildLockedPositionsMap(");

  // Idempotent: drop accidental double-inserts of the helper.
  while (out.includes(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER)) {
    out = out.replace(LOCKED_MAP_HELPER + LOCKED_MAP_HELPER, LOCKED_MAP_HELPER);
  }

  // BZ: lockedPositions alias must not share a name with editing state in one const chain.
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

  return out;
}

function validateModuleSyntax(html) {
  const code = extractModuleCode(html);
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
  LOCKED_MAP_HELPER,
  LEGACY_RU_HELPER,
  extractModuleCode,
  sanitizeBundleHtml,
  validateModuleSyntax,
};
