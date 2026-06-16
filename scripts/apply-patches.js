#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  LOCKED_MAP_HELPER,
  SORT_BRACKET_HELPER,
  readBundle,
  writeBundle,
  sanitizeBundle,
  validateModuleSyntax,
} = require("./bundle-sanitize");

/** @type {{ id: string, find: string, replace: string }[]} */
const patches = [
  {
    id: "favicon",
    find: '<link rel="icon" type="image/svg+xml" href="" />',
    replace:
      '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚽</text></svg>" />',
  },
  {
    id: "fc-autosave-semicolon",
    find: "},[E,g,Y,Q,lA,cA,T,k,CV])function lN(G){",
    replace: "},[E,g,Y,Q,lA,cA,T,k,CV]);function lN(G){",
  },
  {
    id: "mobile-css-link",
    find: "  </head>",
    replace: '    <link rel="stylesheet" href="mobile.css">\n  </head>',
  },
  {
    id: "english-a0",
    find: "function a0(){const[A,V]=S.useState(Sa()),{lang:I,setLang:U}=Ad();",
    replace: "function a0(){const[A,V]=S.useState(Sa());",
  },
  {
    id: "english-remove-toggle",
    find: ',C.jsxs("div",{className:"app-lang-toggle",role:"group","aria-label":"Language",children:[C.jsx("button",{className:`app-lang-btn ${I==="en"?"active":""}`,onClick:()=>U("en"),"aria-pressed":I==="en",children:"EN"}),C.jsx("button",{className:`app-lang-btn ${I==="he"?"active":""}`,onClick:()=>U("he"),"aria-pressed":I==="he",children:"עב"})]})',
    replace: "",
  },
  {
    id: "verdict-form-english",
    find: 'const OZ={verdictLabel:{en:"Verdict",he:"תחזית"},draw:{en:"Draw",he:"תיקו"},correct:{en:"✓ correct",he:"✓ צדק"},missed:{en:"✗ missed",he:"✗ פספס"}};function kU(A,V){return OZ[A][V]}function Vd({matchId:A,match:V,hasResult:I}){const{lang:U}=Ad(),[l,W]=S.useState(!1),N=IN(A);if(!N)return null;const a=N.preTournament;let m=null;if(I&&V.result){const t=V.homeTeam.kind==="team"?V.homeTeam.code:null,Z=V.awayTeam.kind==="team"?V.awayTeam.code:null;if(t&&Z){let h;if(V.stage==="group")V.result.home>V.result.away?h=t:V.result.away>V.result.home?h=Z:h="draw";else{const e=dU(V.result,t,Z);h=(e==null?void 0:e.winner)??"draw"}m=h===a.winner?"right":"wrong"}}const d=a.winner==="draw"?null:WV(a.winner),F=a.winner==="draw"?kU("draw",U):(d==null?void 0:d.name)??a.winner;return C.jsxs("div",{className:`verdict ${m??""} ${l?"open":"closed"}`,children:[C.jsxs("button",{type:"button",className:"verdict-head",onClick:()=>W(t=>!t),"aria-expanded":l,children:[C.jsx("span",{className:"verdict-label",children:kU("verdictLabel",U)}),C.jsx("span",{className:"verdict-pick",children:F}),C.jsxs("span",{className:"verdict-confidence",children:[a.confidence,"%"]}),m&&C.jsx("span",{className:`verdict-accuracy verdict-accuracy-${m}`,children:kU(m==="right"?"correct":"missed",U)}),C.jsx("span",{className:"verdict-chev","aria-hidden":"true",children:l?"▴":"▾"})]}),l&&C.jsx("div",{className:"verdict-text",dir:U==="he"?"rtl":"ltr",lang:U,children:a.text[U]})]})}',
    replace:
      'const OZ={verdictLabel:"Verdict",draw:"Draw",correct:"✓ correct",missed:"✗ missed"};function kU(A){return OZ[A]}function computeFormVerdict(A,V,I){if(!A||!A.homeTeam||!A.awayTeam)return null;if(A.homeTeam.kind!=="team"||A.awayTeam.kind!=="team")return null;const U=A.homeTeam.code,l=A.awayTeam.code,W=A.group??WV(U)?.group??WV(l)?.group;if(!W)return null;const N=V.get(W);if(!N)return null;function a(m){const d=N.find(F=>F.teamCode===m);if(!d)return{pts:0,gd:0,form:0};const F=I.filter(t=>t.stage==="group"&&t.group===W&&t.result&&(t.homeTeam.code===m||t.awayTeam.code===m)).slice(-2);let t=0;for(const Z of F){const h=Z.homeTeam.code===m?Z.result.home:Z.result.away,e=Z.homeTeam.code===m?Z.result.away:Z.result.home;t+=h>e?3:h<e?0:1}return{pts:d.points,gd:d.goalDiff,form:t}}const m=a(U),d=a(l),F=m.pts+m.gd*.4+m.form*2,t=d.pts+d.gd*.4+d.form*2;if(F+t===0)return{winner:"draw",confidence:33,text:"No tournament form yet — too close to call."};let Z,h;if(Math.abs(F-t)<1.5){Z="draw";h=42}else if(F>t){Z=U;h=Math.min(88,Math.round(52+(F-t)*7))}else{Z=l;h=Math.min(88,Math.round(52+(t-F)*7))}const e=WV(U)?.name??U,E=WV(l)?.name??l,i=Z==="draw"?"a draw":WV(Z)?.name??Z;return{winner:Z,confidence:h,text:`${e}: ${m.pts} pts (last 2: ${m.form} pts). ${E}: ${d.pts} pts (last 2: ${d.form} pts). Form favors ${i}.`}}function Vd({matchId:A,match:V,hasResult:I}){const{standings:U,matches:l}=Xl(),[W,N]=S.useState(!1),a=IN(A);if(!a)return null;const m=a.preTournament,d=!I?computeFormVerdict(V,U,l):null;let F=null;if(I&&V.result){const t=V.homeTeam.kind==="team"?V.homeTeam.code:null,Z=V.awayTeam.kind==="team"?V.awayTeam.code:null;if(t&&Z){let h;if(V.stage==="group")V.result.home>V.result.away?h=t:V.result.away>V.result.home?h=Z:h="draw";else{const e=dU(V.result,t,Z);h=(e==null?void 0:e.winner)??"draw"}F=h===m.winner?"right":"wrong"}}const e=m.winner==="draw"?null:WV(m.winner),E=m.winner==="draw"?kU("draw"):(e==null?void 0:e.name)??m.winner,i=d&&(d.winner==="draw"?kU("draw"):(WV(d.winner)?.name??d.winner));return C.jsxs("div",{className:`verdict ${F??""} ${W?"open":"closed"}`,children:[C.jsxs("button",{type:"button",className:"verdict-head",onClick:()=>N(t=>!t),"aria-expanded":W,children:[C.jsx("span",{className:"verdict-label",children:kU("verdictLabel")}),C.jsx("span",{className:"verdict-pre-label",children:"Pre-tournament"}),C.jsx("span",{className:"verdict-pick",children:E}),C.jsxs("span",{className:"verdict-confidence",children:[m.confidence,"%"]}),F&&C.jsx("span",{className:`verdict-accuracy verdict-accuracy-${F}`,children:kU(F==="right"?"correct":"missed")}),C.jsx("span",{className:"verdict-chev","aria-hidden":"true",children:W?"▴":"▾"})]}),W&&C.jsxs(C.Fragment,{children:[C.jsx("div",{className:"verdict-text",children:m.text.en}),d&&C.jsxs("div",{className:"verdict-form",children:[C.jsxs("div",{className:"verdict-head",style:{cursor:"default"},children:[C.jsx("span",{className:"verdict-form-label",children:"Form pick"}),C.jsx("span",{className:"verdict-pick",children:i}),C.jsxs("span",{className:"verdict-confidence",children:[d.confidence,"%"]})]}),C.jsx("div",{className:"verdict-text",children:d.text})]})]})]})}',
  },
  {
    id: "fc-autosave",
    find: '[cA,aV]=S.useState(m!=null&&m.pens?String(m.pens.away):"");S.useEffect(()=>{const G=ld=>{ld.key==="Escape"&&W()};return window.addEventListener("keydown",G),()=>window.removeEventListener("keydown",G)},[W]);const GA=parseInt(E,10),tA=parseInt(g,10),qA=!isNaN(GA)&&!isNaN(tA)&&GA>=0&&tA>=0,n=qA&&GA===tA,M=parseInt(Y,10),o=parseInt(Q,10),j=!isNaN(M)&&!isNaN(o)&&M>=GA&&o>=tA,y=j&&M===o,bA=parseInt(lA,10),L=parseInt(cA,10),xA=!isNaN(bA)&&!isNaN(L)&&bA!==L,CV=qA&&(!a||!n||T&&j&&(!y||k&&xA));function UN(){if(!CV)return;const G={home:GA,away:tA};T&&j&&(G.et={home:M,away:o}),k&&xA&&(G.pens={home:bA,away:L}),U(G)}',
    replace:
      '[cA,aV]=S.useState(m!=null&&m.pens?String(m.pens.away):""),[sV,jN]=S.useState(!!m);S.useEffect(()=>{const G=ld=>{ld.key==="Escape"&&W()};return window.addEventListener("keydown",G),()=>window.removeEventListener("keydown",G)},[W]);const GA=parseInt(E,10),tA=parseInt(g,10),qA=!isNaN(GA)&&!isNaN(tA)&&GA>=0&&tA>=0,n=qA&&GA===tA,M=parseInt(Y,10),o=parseInt(Q,10),j=!isNaN(M)&&!isNaN(o)&&M>=GA&&o>=tA,y=j&&M===o,bA=parseInt(lA,10),L=parseInt(cA,10),xA=!isNaN(bA)&&!isNaN(L)&&bA!==L,CV=qA&&(!a||!n||T&&j&&(!y||k&&xA));function UN(){if(!CV)return;const G={home:GA,away:tA};T&&j&&(G.et={home:M,away:o}),k&&xA&&(G.pens={home:bA,away:L}),U(G),jN(!0)}S.useEffect(()=>{const G=setTimeout(()=>{if(E===""&&g===""){A.result&&l();return}CV&&UN()},400);return()=>clearTimeout(G)},[E,g,Y,Q,lA,cA,T,k,CV]);',
  },
  {
    id: "fc-save-button",
    find: ',C.jsx("button",{type:"button",className:"inline-btn inline-btn-primary",onClick:UN,disabled:!CV,children:"Save"})',
    replace:
      ',C.jsx("span",{className:"inline-save-status",children:CV?sV?"Saved":"…":""})',
  },
  {
    id: "lz-autosave",
    find: 'o=b&&(!N||!lA||Z&&aV&&(!GA||R&&n));function j(){if(!b)return;const L={home:p,away:k};Z&&aV&&(L.et={home:BA,away:cA}),R&&n&&(L.pens={home:tA,away:qA}),U(L)}',
    replace:
      'o=b&&(!N||!lA||Z&&aV&&(!GA||R&&n)),[lN,sN]=S.useState(!!a);function j(){if(!b)return;const L={home:p,away:k};Z&&aV&&(L.et={home:BA,away:cA}),R&&n&&(L.pens={home:tA,away:qA}),U(L),sN(!0)}S.useEffect(()=>{const L=setTimeout(()=>{if(m===""&&F===""){a&&l();return}o&&j()},400);return()=>clearTimeout(L)},[m,F,e,i,c,B,Z,R,o]);return C.jsx',
  },
  {
    id: "lz-save-button",
    find: ',C.jsx("button",{className:"btn btn-primary",onClick:j,disabled:!o,children:"Save result"})',
    replace:
      ',C.jsx("span",{className:"modal-save-status",children:o?lN?"Saved":"…":""})',
  },
  {
    id: "ft-locked",
    find: 'function ft({group:A,rows:V}){return C.jsxs("div",{className:"group-table",style:{"--group-color":`var(--grp-${A})`},children:[C.jsxs("div",{className:"group-table-header",children:[C.jsx("div",{className:"group-letter",children:A}),C.jsxs("div",{className:"group-table-cols",children:[C.jsx("span",{children:"P"}),C.jsx("span",{children:"W"}),C.jsx("span",{children:"D"}),C.jsx("span",{children:"L"}),C.jsx("span",{children:"GF"}),C.jsx("span",{children:"GA"}),C.jsx("span",{children:"GD"}),C.jsx("span",{className:"pts",children:"Pts"})]})]}),C.jsx("div",{className:"group-table-body",children:V.map((I,U)=>{const l=WV(I.teamCode),W=U<2,N=U===2;return C.jsxs("div",{className:`group-row ${W?"qualified":N?"third":"eliminated"}`,children:[C.jsx("div",{className:"group-row-pos",children:U+1}),C.jsxs("div",{className:"group-row-team",children:[l&&C.jsx(wA,{code:I.teamCode,name:l.name,size:"sm"}),C.jsx("span",{className:"team-name",children:(l==null?void 0:l.name)??I.teamCode})]}),C.jsxs("div",{className:"group-row-stats",children:[C.jsx("span",{children:I.played}),C.jsx("span",{children:I.won}),C.jsx("span",{children:I.drawn}),C.jsx("span",{children:I.lost}),C.jsx("span",{children:I.goalsFor}),C.jsx("span",{children:I.goalsAgainst}),C.jsxs("span",{className:I.goalDiff>0?"gd-pos":I.goalDiff<0?"gd-neg":"",children:[I.goalDiff>0?"+":"",I.goalDiff]}),C.jsx("span",{className:"pts",children:I.points})]})]},I.teamCode)})})]})}',
    replace:
      'function ft({group:A,rows:V,locked:I}){return C.jsxs("div",{className:"group-table",style:{"--group-color":`var(--grp-${A})`},children:[C.jsxs("div",{className:"group-table-header",children:[C.jsx("div",{className:"group-letter",children:A}),C.jsxs("div",{className:"group-table-cols",children:[C.jsx("span",{children:"P"}),C.jsx("span",{children:"W"}),C.jsx("span",{children:"D"}),C.jsx("span",{children:"L"}),C.jsx("span",{children:"GF"}),C.jsx("span",{children:"GA"}),C.jsx("span",{children:"GD"}),C.jsx("span",{className:"pts",children:"Pts"})]})]}),C.jsx("div",{className:"group-table-body",children:V.map((U,l)=>{const W=WV(U.teamCode),N=I?[...I.entries()].find(([a,m])=>m===U.teamCode)?.[0]:null,a=N===1||N===2,m=N===3,d=!N&&l<2,F=!N&&l===2,t=a?"qualified":m?"third":d?"in-contention qualified":F?"third in-contention":"eliminated";return C.jsxs("div",{className:`group-row ${t}`,children:[C.jsx("div",{className:"group-row-pos",children:l+1}),C.jsxs("div",{className:"group-row-team",children:[W&&C.jsx(wA,{code:U.teamCode,name:W.name,size:"sm"}),C.jsx("span",{className:"team-name",children:(W==null?void 0:W.name)??U.teamCode}),(a||m)&&C.jsx("span",{className:"group-row-badge",children:"Qualified"})]}),C.jsxs("div",{className:"group-row-stats",children:[C.jsx("span",{children:U.played}),C.jsx("span",{children:U.won}),C.jsx("span",{children:U.drawn}),C.jsx("span",{children:U.lost}),C.jsx("span",{children:U.goalsFor}),C.jsx("span",{children:U.goalsAgainst}),C.jsxs("span",{className:U.goalDiff>0?"gd-pos":U.goalDiff<0?"gd-neg":"",children:[U.goalDiff>0?"+":"",U.goalDiff]}),C.jsx("span",{className:"pts",children:U.points})]})]},U.teamCode)})})]})}',
  },
  {
    id: "bz-locked",
    find: "function BZ(){const{matches:A,standings:V,resolved:I}=Xl(),",
    replace: "function BZ(){const{matches:A,standings:V,resolved:I,lockedPositions:e}=Xl(),",
  },
  {
    id: "bz-ft-props",
    find: "C.jsx(ft,{group:d,rows:V.get(d)??[]}),",
    replace: "C.jsx(ft,{group:d,rows:V.get(d)??[],locked:e.get(d)}),",
  },
  {
    id: "bz-editing-state",
    find: "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null)",
    replace:
      "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[qN,rN]=S.useState(null)",
  },
  {
    id: "bz-editing-state-legacy-w",
    find: "lockedPositions:W}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null)",
    replace:
      "lockedPositions:e}=Xl(),{setResult:U,clearResult:l}=hU(),[qN,rN]=S.useState(null)",
  },
  {
    id: "bz-editing-refs",
    find: "editing:W===F.id,onClick:()=>N(W===F.id?null:F.id),onSave:h=>{U(F.id,h),N(null)},onClear:()=>{l(F.id),N(null)},onCancel:()=>N(null)",
    replace:
      "editing:qN===F.id,onClick:()=>rN(qN===F.id?null:F.id),onSave:h=>{U(F.id,h),rN(null)},onClear:()=>{l(F.id),rN(null)},onCancel:()=>rN(null)",
  },
  {
    id: "mz-team-filter",
    find: 'function MZ(){const{matches:A,resolved:V}=Xl(),{setResult:I,clearResult:U}=hU(),[l,W]=S.useState(null),[N,a]=S.useState("all"),m=S.useMemo(()=>{const h=A.filter(E=>N==="group"?E.stage==="group":N==="ko"?E.stage!=="group":!0),e=new Map;for(const E of h){const i=jV(E.date,E.kickoff),g=(i==null?void 0:i.date)??E.date,R=e.get(g)??[];R.push(E),e.set(g,R)}for(const E of e.values())E.sort((i,g)=>{const R=jV(i.date,i.kickoff),T=jV(g.date,g.kickoff);return((R==null?void 0:R.time)??i.kickoff??"").localeCompare((T==null?void 0:T.time)??g.kickoff??"")});return e},[A,N]),',
    replace:
      'function MZ(){const{matches:A,resolved:V}=Xl(),{setResult:I,clearResult:U}=hU(),[l,W]=S.useState(null),[N,a]=S.useState("all"),[m,d]=S.useState(""),F=S.useMemo(()=>[...YI].sort((h,e)=>h.name.localeCompare(e.name)),[]),t=S.useMemo(()=>{if(!m)return null;const h=m.toLowerCase();return F.find(e=>e.code===m||e.name.toLowerCase().includes(h)||e.fifaCode.toLowerCase()===h)?.code??null},[m,F]),Z=S.useMemo(()=>{const h=A.filter(E=>N==="group"?E.stage==="group":N==="ko"?E.stage!=="group":!0).filter(E=>{if(!t)return!0;const i=V.get(E.id),g=(i==null?void 0:i.home)??(E.homeTeam.kind==="team"?E.homeTeam.code:null),R=(i==null?void 0:i.away)??(E.awayTeam.kind==="team"?E.awayTeam.code:null);return g===t||R===t}),e=new Map;for(const E of h){const i=jV(E.date,E.kickoff),g=(i==null?void 0:i.date)??E.date,R=e.get(g)??[];R.push(E),e.set(g,R)}for(const E of e.values())E.sort((i,g)=>{const R=jV(i.date,i.kickoff),T=jV(g.date,g.kickoff);return((R==null?void 0:R.time)??i.kickoff??"").localeCompare((T==null?void 0:T.time)??g.kickoff??"")});return e},[A,N,t,V]),',
  },
  {
    id: "mz-rename-vars",
    find: "d=S.useMemo(()=>[...m.keys()].sort(),[m]),F=S.useMemo(()=>d.includes(zU)?zU:d.find(h=>h>=zU)??null,[d]),t=S.useRef(null),Z=S.useRef(!1);return S.useEffect(()=>{Z.current||F&&t.current&&(t.current.scrollIntoView({behavior:\"smooth\",block:\"start\"}),Z.current=!0)},[F,N]),C.jsxs(\"div\",{className:\"schedule-page\",children:[C.jsxs(\"header\",{className:\"schedule-header\",children:[C.jsx(\"h1\",{children:\"The Schedule\"}),C.jsx(\"p\",{children:\"Every match. Every kickoff. Click any fixture to enter a result.\"})]}),C.jsxs(\"div\",{className:\"schedule-filters\",children:[C.jsx(\"button\",{className:N===\"all\"?\"active\":\"\",onClick:()=>a(\"all\"),children:\"All matches\"}),C.jsx(\"button\",{className:N===\"group\"?\"active\":\"\",onClick:()=>a(\"group\"),children:\"Group stage\"}),C.jsx(\"button\",{className:N===\"ko\"?\"active\":\"\",onClick:()=>a(\"ko\"),children:\"Knockouts\"})]}),C.jsx(\"section\",{className:\"schedule-all\",children:d.map(h=>{const e=h===F,E=h===zU;return C.jsxs(\"div\",{ref:e?t:void 0,className:`schedule-day ${E?\"is-today\":\"\"}`,children:[C.jsxs(\"div\",{className:\"schedule-day-label\",children:[E&&C.jsx(\"span\",{className:\"live-dot\"}),E?`TODAY · ${Ba(h)}`:Ba(h)]}),C.jsx(\"div\",{className:\"schedule-day-matches\",children:(m.get(h)??[]).map(i=>{var g,R;return C.jsx(SZ,{match:i,homeCode:((g=V.get(i.id))==null?void 0:g.home)??null,awayCode:((R=V.get(i.id))==null?void 0:R.away)??null,editing:l===i.id,onClick:()=>W(l===i.id?null:i.id),onSave:T=>{I(i.id,T),W(null)},onClear:()=>{U(i.id),W(null)},onCancel:()=>W(null)},i.id)})})]},h)})})]})}",
    replace:
      'h=S.useMemo(()=>[...Z.keys()].sort(),[Z]),e=S.useMemo(()=>h.includes(zU)?zU:h.find(E=>E>=zU)??null,[h]),E=S.useRef(null),i=S.useRef(!1);return S.useEffect(()=>{i.current||e&&E.current&&(E.current.scrollIntoView({behavior:"smooth",block:"start"}),i.current=!0)},[e,N]),C.jsxs("div",{className:"schedule-page",children:[C.jsxs("header",{className:"schedule-header",children:[C.jsx("h1",{children:"The Schedule"}),C.jsx("p",{children:"Every match. Every kickoff. Click any fixture to enter a result."})]}),C.jsxs("div",{className:"schedule-filters",children:[C.jsx("button",{className:N==="all"?"active":"",onClick:()=>a("all"),children:"All matches"}),C.jsx("button",{className:N==="group"?"active":"",onClick:()=>a("group"),children:"Group stage"}),C.jsx("button",{className:N==="ko"?"active":"",onClick:()=>a("ko"),children:"Knockouts"})]}),C.jsx("div",{className:"schedule-team-filter",children:C.jsxs("select",{value:m,onChange:g=>d(g.target.value),children:[C.jsx("option",{value:"",children:"All teams"}),F.map(g=>C.jsx("option",{value:g.code,children:g.name},g.code))]})}),C.jsx("section",{className:"schedule-all",children:h.map(g=>{const R=g===e,T=g===zU;return C.jsxs("div",{ref:R?E:void 0,className:`schedule-day ${T?"is-today":""}`,children:[C.jsxs("div",{className:"schedule-day-label",children:[T&&C.jsx("span",{className:"live-dot"}),T?`TODAY · ${Ba(g)}`:Ba(g)]}),C.jsx("div",{className:"schedule-day-matches",children:(Z.get(g)??[]).map(c=>{var Y,B;return C.jsx(SZ,{match:c,homeCode:((Y=V.get(c.id))==null?void 0:Y.home)??null,awayCode:((B=V.get(c.id))==null?void 0:B.away)??null,editing:l===c.id,onClick:()=>W(l===c.id?null:c.id),onSave:Q=>{I(c.id,Q),W(null)},onClear:()=>{U(c.id),W(null)},onCancel:()=>W(null)},c.id)})})]},g)})})]})}',
  },
  {
    id: "teams-filter",
    find: 'function $Z(){const[A,V]=S.useState(null);return C.jsxs("div",{className:"teams-page",children:[C.jsxs("header",{className:"teams-header",children:[C.jsx("h1",{children:"The Nations"}),C.jsx("p",{children:"48 teams. 6 confederations. Every squad. Click a team to see the roster."})]}),CU.map(I=>{const U=YI.filter(l=>l.group===I);',
    replace:
      'function $Z(){const[A,V]=S.useState(null),[mN,dN]=S.useState("");return C.jsxs("div",{className:"teams-page",children:[C.jsxs("header",{className:"teams-header",children:[C.jsx("h1",{children:"The Nations"}),C.jsx("p",{children:"48 teams. 6 confederations. Every squad. Click a team to see the roster."})]}),C.jsx("div",{className:"schedule-team-filter",children:C.jsx("input",{className:"teams-search-input",type:"search",placeholder:"Search teams…",value:mN,onChange:l=>dN(l.target.value)})}),CU.map(l=>{const W=YI.filter(N=>N.group===l).filter(N=>{if(!mN)return!0;const a=mN.toLowerCase();return N.name.toLowerCase().includes(a)||N.code.includes(a)||N.fifaCode.toLowerCase().includes(a)||N.confederation.toLowerCase().includes(a)});if(W.length===0)return null;const U=W;',
  },
  {
    id: "teams-filter-map-close",
    find: 'return C.jsxs("section",{className:"teams-group",style:{"--group-color":`var(--grp-${I})`},children:[C.jsxs("div",{className:"teams-group-label",children:[C.jsx("span",{className:"teams-group-letter",children:I}),C.jsxs("span",{className:"teams-group-name",children:["Group ",I]})]}),C.jsx("div",{className:"teams-group-grid",children:U.map(l=>C.jsx(A0,{team:l,onClick:()=>V(l)},l.code))})]},I)}),A&&C.jsx(V0,{team:A,onClose:()=>V(null)})]})}',
    replace:
      'return C.jsxs("section",{className:"teams-group",style:{"--group-color":`var(--grp-${l})`},children:[C.jsxs("div",{className:"teams-group-label",children:[C.jsx("span",{className:"teams-group-letter",children:l}),C.jsxs("span",{className:"teams-group-name",children:["Group ",l]})]}),C.jsx("div",{className:"teams-group-grid",children:U.map(N=>C.jsx(A0,{team:N,onClick:()=>V(N)},N.code))})]},l)}),A&&C.jsx(V0,{team:A,onClose:()=>V(null)})]})}',
  },
  {
    id: "bracket-helper",
    find: "function zZ(){var e,E;",
    replace: `${LOCKED_MAP_HELPER}${SORT_BRACKET_HELPER}function zZ(){var e,E;`,
  },
  {
    id: "bracket-sort-helper",
    find: `${LOCKED_MAP_HELPER}function zZ`,
    replace: `${LOCKED_MAP_HELPER}${SORT_BRACKET_HELPER}function zZ`,
  },
  {
    id: "bracket-zZ",
    find: 'function zZ(){var e,E;const{matches:A,resolved:V,isGroupStageDone:I}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null),a=A.filter(i=>i.stage==="R32"),m=A.filter(i=>i.stage==="R16"),d=A.filter(i=>i.stage==="QF"),F=A.filter(i=>i.stage==="SF"),t=A.find(i=>i.stage==="final"),Z=A.find(i=>i.stage==="3rd"),h=W?A.find(i=>i.id===W):null;return C.jsxs("div",{className:"bracket-page",children:[C.jsxs("header",{className:"bracket-header",children:[C.jsx("h1",{children:"The Road to the Final"}),C.jsxs("p",{children:["32 teams. 6 rounds. 1 trophy. ",!I&&C.jsx("span",{className:"bracket-warning",children:" Bracket fills automatically once all 72 group games are entered."})]})]}),C.jsxs("div",{className:"bracket-rounds",children:[C.jsx(DV,{title:"Round of 32",matches:a,resolved:V,onClick:i=>N(i)}),C.jsx(DV,{title:"Round of 16",matches:m,resolved:V,onClick:i=>N(i)}),C.jsx(DV,{title:"Quarter-finals",matches:d,resolved:V,onClick:i=>N(i)}),C.jsx(DV,{title:"Semi-finals",matches:F,resolved:V,onClick:i=>N(i)}),C.jsx(DV,{title:"Final",matches:t?[t]:[],resolved:V,onClick:i=>N(i),highlight:!0}),Z&&C.jsx(DV,{title:"3rd Place",matches:[Z],resolved:V,onClick:i=>N(i)})]}),h&&C.jsx(LZ,{match:h,homeCode:((e=V.get(h.id))==null?void 0:e.home)??null,awayCode:((E=V.get(h.id))==null?void 0:E.away)??null,onSave:i=>{U(h.id,i),N(null)},onClear:()=>{l(h.id),N(null)},onClose:()=>N(null)})]})}',
    replace:
      'function zZ(){var e,E;const{matches:A,standings:i,lockedPositions:g,resolved:R,isGroupStageDone:T}=Xl(),{setResult:U,clearResult:l}=hU(),[W,N]=S.useState(null),[a,m]=S.useState(!1),d=S.useMemo(()=>{if(!a)return R;const c=buildLockedPositionsMap(i),Y=tZ(i);let B=new Map;const Q=TZ(A),p=Y.map(k=>k.group),b=hZ(p,Q);b&&(B=b);return eZ(A,c,B)},[a,A,i,R]),cA=A.find(c=>c.stage==="final"),aV=A.find(c=>c.stage==="3rd"),hRaw=A.filter(c=>c.stage==="SF"),h=sortBracketMatches(hRaw,cA?[cA]:[]),Z=sortBracketMatches(A.filter(c=>c.stage==="QF"),h),t=sortBracketMatches(A.filter(c=>c.stage==="R16"),Z),F=sortBracketMatches(A.filter(c=>c.stage==="R32"),t),GA=W?A.find(c=>c.id===W):null;return C.jsxs("div",{className:"bracket-page",children:[C.jsxs("header",{className:"bracket-header",children:[C.jsx("h1",{children:"The Road to the Final"}),C.jsxs("p",{children:["32 teams. 6 rounds. 1 trophy. ",!T&&C.jsx("span",{className:"bracket-warning",children:" Secured qualifiers appear as they clinch. Use preview for the full bracket from current standings."})]})]}),C.jsxs("div",{className:"bracket-controls",children:[C.jsx("button",{type:"button",className:`bracket-preview-btn ${a?"active":""}`,onClick:()=>m(c=>!c),children:a?"Hide standings preview":"Preview bracket from current standings"}),a&&C.jsx("p",{className:"bracket-preview-banner",children:"Preview only — knockout pairings change if results shift."})]}),C.jsxs("div",{className:"bracket-rounds",children:[C.jsx(DV,{title:"Round of 32",matches:F,resolved:d,locked:g,projected:a,onClick:c=>N(c)}),C.jsx(DV,{title:"Round of 16",matches:t,resolved:d,locked:g,projected:a,onClick:c=>N(c)}),C.jsx(DV,{title:"Quarter-finals",matches:Z,resolved:d,locked:g,projected:a,onClick:c=>N(c)}),C.jsx(DV,{title:"Semi-finals",matches:h,resolved:d,locked:g,projected:a,onClick:c=>N(c)}),C.jsx(DV,{title:"Final",matches:cA?[cA]:[],resolved:d,locked:g,projected:a,onClick:c=>N(c),highlight:!0}),aV&&C.jsx(DV,{title:"3rd Place",matches:[aV],resolved:d,locked:g,projected:a,onClick:c=>N(c)})]}),GA&&C.jsx(LZ,{match:GA,homeCode:((e=d.get(GA.id))==null?void 0:e.home)??null,awayCode:((E=d.get(GA.id))==null?void 0:E.away)??null,onSave:c=>{U(GA.id,c),N(null)},onClear:()=>{l(GA.id),N(null)},onClose:()=>N(null)})]})}',
  },
  {
    id: "bracket-zZ-sort",
    find: 'F=A.filter(c=>c.stage==="R32"),t=A.filter(c=>c.stage==="R16"),Z=A.filter(c=>c.stage==="QF"),h=A.filter(c=>c.stage==="SF"),cA=A.find(c=>c.stage==="final"),aV=A.find(c=>c.stage==="3rd"),',
    replace:
      'cA=A.find(c=>c.stage==="final"),aV=A.find(c=>c.stage==="3rd"),hRaw=A.filter(c=>c.stage==="SF"),h=sortBracketMatches(hRaw,cA?[cA]:[]),Z=sortBracketMatches(A.filter(c=>c.stage==="QF"),h),t=sortBracketMatches(A.filter(c=>c.stage==="R16"),Z),F=sortBracketMatches(A.filter(c=>c.stage==="R32"),t),',
  },
  {
    id: "bracket-DV",
    find: 'function DV({title:A,matches:V,resolved:I,onClick:U,highlight:l=!1}){return C.jsxs("div",{className:`bracket-col ${l?"highlight":""}`,children:[C.jsx("div",{className:"bracket-col-title",children:A}),C.jsx("div",{className:"bracket-col-matches",children:V.map(W=>C.jsx(XZ,{match:W,resolved:I,onClick:()=>U(W.id)},W.id))})]})}',
    replace:
      'function DV({title:A,matches:V,resolved:I,onClick:U,highlight:l=!1,locked:W,projected:N=!1}){return C.jsxs("div",{className:`bracket-col ${l?"highlight":""}`,children:[C.jsx("div",{className:"bracket-col-title",children:A}),C.jsx("div",{className:"bracket-col-matches",children:V.map(a=>C.jsx(XZ,{match:a,resolved:I,locked:W,projected:N,onClick:()=>U(a.id)},a.id))})]})}',
  },
  {
    id: "bracket-XZ",
    find: 'function XZ({match:A,resolved:V,onClick:I}){var h,e,E,i;const U=V.get(A.id),l=(U==null?void 0:U.home)??null,W=(U==null?void 0:U.away)??null,N=l?null:Qa(A.homeTeam),a=W?null:Qa(A.awayTeam),m=kZ(A),d=A.id.replace("M",""),F=jV(A.date,A.kickoff),t=xZ((F==null?void 0:F.date)??A.date),Z=(F==null?void 0:F.time)??((h=A.kickoff)==null?void 0:h.split(" ")[0])??"";return C.jsxs("button",{className:`bracket-match ${A.result?"done":""}`,onClick:I,children:',
    replace:
      'function XZ({match:A,resolved:V,onClick:I,locked:U,projected:l=!1}){var h,e,E,i;const W=V.get(A.id),N=(W==null?void 0:W.home)??null,a=(W==null?void 0:W.away)??null,m=N?null:Qa(A.homeTeam),d=a?null:Qa(A.awayTeam),F=kZ(A),t=A.id.replace("M",""),Z=jV(A.date,A.kickoff),c=xZ((Z==null?void 0:Z.date)??A.date),Y=(Z==null?void 0:Z.time)??((h=A.kickoff)==null?void 0:h.split(" ")[0])??"",B=!A.result&&l&&N&&a,Q=!A.result&&N&&U&&[...U.values()].includes(N)||!A.result&&a&&U&&[...U.values()].includes(a);return C.jsxs("button",{className:`bracket-match ${A.result?"done":""} ${B?"projected":""} ${Q?"locked-slot":""}`,onClick:I,children:',
  },
  {
    id: "bracket-XZ-vars",
    find: 'C.jsx("span",{className:"bracket-match-date",children:t}),C.jsx("span",{className:"bracket-match-time",children:Z}),',
    replace:
      'C.jsx("span",{className:"bracket-match-date",children:c}),C.jsx("span",{className:"bracket-match-time",children:Y}),',
  },
  {
    id: "bracket-XZ-match-num",
    find: 'children:["M",d]}),C.jsxs("div",{className:"bracket-match-when"',
    replace: 'children:["M",t]}),C.jsxs("div",{className:"bracket-match-when"',
  },
];

const INDEX = path.join(__dirname, "..", "index.html");

function patchIndexHtml(html) {
  const patches = [
    {
      id: "favicon",
      find: '<link rel="icon" type="image/svg+xml" href="" />',
      replace:
        '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚽</text></svg>" />',
    },
    {
      id: "mobile-css-link",
      find: "  </head>",
      replace: '    <link rel="stylesheet" href="mobile.css">\n  </head>',
      skipIf: (html) => html.includes('href="mobile.css"'),
    },
  ];
  let out = html;
  for (const patch of patches) {
    if (patch.skipIf?.(out)) continue;
    if (!out.includes(patch.find)) {
      if (patch.replace && out.includes(patch.replace)) continue;
      if (patch.id === "mobile-css-link" && out.includes("mobile.css")) continue;
      continue;
    }
    if (patch.replace !== "" && out.includes(patch.replace) && patch.find !== patch.replace) {
      continue;
    }
    out = out.replace(patch.find, patch.replace);
  }
  return out;
}

function main() {
  let code = readBundle();
  const before = code.length;
  const results = [];

  for (const patch of patches) {
    if (patch.id === "favicon" || patch.id === "mobile-css-link") {
      continue;
    }
    if (!code.includes(patch.find)) {
      if (patch.replace && code.includes(patch.replace)) {
        results.push({ id: patch.id, ok: true, skipped: true });
        continue;
      }
      if (patch.id === "english-remove-toggle" && !code.includes('onClick:()=>U("he")')) {
        results.push({ id: patch.id, ok: true, skipped: true });
        continue;
      }
      if (patch.id === "bracket-helper" && code.includes(LOCKED_MAP_HELPER)) {
        results.push({ id: patch.id, ok: true, skipped: true });
        continue;
      }
      if (patch.id === "bracket-sort-helper" && code.includes(SORT_BRACKET_HELPER)) {
        results.push({ id: patch.id, ok: true, skipped: true });
        continue;
      }
      if (
        patch.id === "bracket-zZ" &&
        code.includes('sortBracketMatches(A.filter(c=>c.stage==="R32"),t)')
      ) {
        results.push({ id: patch.id, ok: true, skipped: true });
        continue;
      }
      results.push({ id: patch.id, ok: false, error: "find string not found" });
      continue;
    }
    if (patch.replace !== "" && code.includes(patch.replace) && patch.find !== patch.replace) {
      results.push({ id: patch.id, ok: true, skipped: true });
      continue;
    }
    code = code.replace(patch.find, patch.replace);
    results.push({ id: patch.id, ok: true });
  }

  code = sanitizeBundle(code);
  writeBundle(code);

  let html = fs.readFileSync(INDEX, "utf8");
  html = patchIndexHtml(html);
  fs.writeFileSync(INDEX, html);

  console.log(JSON.stringify({ before, after: code.length, results }, null, 2));

  const syntaxError = validateModuleSyntax(code);
  if (syntaxError) {
    console.error("app.js syntax error after patches:", syntaxError);
    process.exit(1);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exit(1);
}

main();
