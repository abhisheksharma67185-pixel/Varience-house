/* Generates the animated programme-resource visuals (self-contained SVGs with embedded animation). */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'assets/visuals');

const STYLE = `<style>
.ln{fill:#0e1613;stroke:#8aa69b;stroke-width:2;opacity:.85}
.lnb{fill:none;stroke:#dcefe7;stroke-width:2;opacity:.9}
.dim{fill:none;stroke:#5c7269;stroke-width:1.5;opacity:.4}
.grn{stroke:#34d399}.cyn{stroke:#7dd3fc}.amb{stroke:#fbbf24}
.fillG{fill:#34d399}.fillC{fill:#7dd3fc}.fillA{fill:#fbbf24}
.led{animation:blink 2.4s ease-in-out infinite}
.flow{stroke-dasharray:10 14;animation:flow 2.8s linear infinite}
.scan{animation:scan 5.5s ease-in-out infinite}
.pulse{animation:pulse 3s ease-in-out infinite}
.bob{animation:bob 4.5s ease-in-out infinite}
.lbl{font-family:ui-monospace,Menlo,monospace;font-size:13px;letter-spacing:4px;fill:#5f766c}
@keyframes blink{0%,100%{opacity:.12}50%{opacity:1}}
@keyframes flow{to{stroke-dashoffset:-48}}
@keyframes scan{0%,100%{opacity:.08}50%{opacity:.85}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`;

const frame = (label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs><radialGradient id="bg" cx="50%" cy="40%" r="78%">
<stop offset="0%" stop-color="#12211a"/><stop offset="55%" stop-color="#0c1512"/><stop offset="100%" stop-color="#070c0a"/>
</radialGradient>
<linearGradient id="scanband" x1="0" y1="0" x2="1" y2="0">
<stop offset="0%" stop-color="#7dd3fc" stop-opacity="0"/><stop offset="50%" stop-color="#7dd3fc" stop-opacity=".16"/><stop offset="100%" stop-color="#7dd3fc" stop-opacity="0"/>
</linearGradient></defs>
${STYLE}
<rect width="800" height="600" fill="url(#bg)"/>
${body}
<text class="lbl" x="58" y="556">${label}</text>
</svg>
`;

const scenes = {
  /* 01 — GPU / compute infrastructure */
  'gpu-compute': frame('COMPUTE RACK / 16×GPU', `
${[150, 262, 374].map((y, r) => [70, 245, 420].map((x, c) => `
<rect class="ln" x="${x}" y="${y}" width="145" height="82" rx="7"/>
<line class="dim" x1="${x + 16}" y1="${y + 24}" x2="${x + 96}" y2="${y + 24}"/>
<line class="dim" x1="${x + 16}" y1="${y + 40}" x2="${x + 96}" y2="${y + 40}"/>
<circle class="led fillG" cx="${x + 118}" cy="${y + 22}" r="4" style="animation-delay:${(-(r * 3 + c) * 0.7).toFixed(1)}s"/>
<circle class="led fillC" cx="${x + 118}" cy="${y + 42}" r="4" style="animation-delay:${(-(r * 2 + c) * 1.1 - 0.5).toFixed(1)}s"/>
<circle class="led fillA" cx="${x + 118}" cy="${y + 62}" r="3" style="animation-delay:${(-(r + c) * 1.3 - 1).toFixed(1)}s"/>`).join('')).join('')}
<g class="pulse"><circle class="lnb" cx="655" cy="191" r="26"/><path class="lnb cyn" d="M655 191 L655 171 M655 191 L672 201 M655 191 L638 201" style="transform-origin:655px 191px;animation:spin 6s linear infinite"/></g>
<path class="flow grn" d="M190 520 V120" opacity=".35"/><path class="flow cyn" d="M400 530 V110" opacity=".3" style="animation-delay:-1.2s"/><path class="flow grn" d="M610 520 V130" opacity=".35" style="animation-delay:-2s"/>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>`),

  /* 02 — modern electronics assembly */
  'electronics-assembly': frame('PCB REV C / ASSEMBLY', `
<rect class="ln" x="70" y="110" width="660" height="380" rx="14"/>
<path class="flow grn" d="M120 180 H320 V300 H470" opacity=".8"/>
<path class="flow cyn" d="M140 410 H300 V350 H340" opacity=".7" style="animation-delay:-1s"/>
<path class="flow grn" d="M540 150 V260 H620" opacity=".7" style="animation-delay:-2s"/>
<path class="flow cyn" d="M210 140 V230" opacity=".6" style="animation-delay:-.5s"/>
<rect class="lnb" x="340" y="230" width="150" height="110" rx="8"/>
<rect class="fillC pulse" x="376" y="262" width="78" height="46" opacity=".25"/>
<rect class="dim" x="376" y="262" width="78" height="46"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<line class="dim" x1="${352 + i * 25}" y1="222" x2="${352 + i * 25}" y2="230"/><line class="dim" x1="${352 + i * 25}" y1="340" x2="${352 + i * 25}" y2="348"/>`).join('')}
<circle class="fillG" cx="120" cy="180" r="4"/><circle class="fillG" cx="470" cy="300" r="4"/><circle class="fillC" cx="620" cy="260" r="4"/><circle class="fillG" cx="210" cy="230" r="4"/>
<circle r="4" class="fillC"><animateMotion dur="3.5s" repeatCount="indefinite" path="M120 180 H320 V300 H470"/></circle>
<circle r="3" class="fillG"><animateMotion dur="4.2s" repeatCount="indefinite" path="M540 150 V260 H620"/></circle>`),

  /* 03 — CNC / precision fabrication */
  'cnc-fabrication': frame('CNC GANTRY / ±0.05 MM', `
<rect class="ln" x="110" y="404" width="580" height="26" rx="4"/>
<rect class="dim" x="250" y="334" width="300" height="70"/>
<path class="flow amb" d="M272 368 H392 V350 H528" opacity=".9"/>
<rect class="ln" x="140" y="150" width="24" height="254"/>
<rect class="ln" x="636" y="150" width="24" height="254"/>
<rect class="ln" x="140" y="150" width="520" height="22"/>
<g style="animation:carX 6s ease-in-out infinite alternate">
<rect class="lnb" x="170" y="136" width="62" height="50" rx="6"/>
<g style="animation:headY 3s ease-in-out infinite alternate">
<line class="lnb" x1="201" y1="186" x2="201" y2="300"/>
<path class="lnb" d="M192 300 L210 300 L201 322 Z"/>
<circle class="fillA pulse" cx="201" cy="326" r="5"/>
</g></g>
<line class="dim" x1="120" y1="470" x2="680" y2="470"/><circle class="fillG led" cx="150" cy="470" r="3.5"/>
<style>@keyframes carX{from{transform:translateX(0)}to{transform:translateX(380px)}}@keyframes headY{from{transform:translateY(0)}to{transform:translateY(26px)}}</style>`),

  /* 04 — clean optics and photonics */
  'optics-photonics': frame('OPTICS BENCH / PHOTONICS', `
<rect class="ln" x="80" y="268" width="100" height="64" rx="8"/>
<circle class="fillC pulse" cx="162" cy="300" r="6"/>
<path class="flow cyn" d="M186 282 H392" opacity=".8"/><path class="flow cyn" d="M186 300 H392" opacity=".9" style="animation-delay:-.8s"/><path class="flow cyn" d="M186 318 H392" opacity=".8" style="animation-delay:-1.6s"/>
<ellipse class="lnb" cx="400" cy="300" rx="16" ry="88"/>
<path class="flow cyn" d="M408 282 L636 300" opacity=".8"/><path class="flow cyn" d="M408 300 H636" opacity=".9" style="animation-delay:-.6s"/><path class="flow cyn" d="M408 318 L636 300" opacity=".8" style="animation-delay:-1.2s"/>
<path class="scan lnb" d="M226 268 Q246 300 226 332" style="animation-delay:-1s"/><path class="scan lnb" d="M262 262 Q286 300 262 338" style="animation-delay:-2.4s"/>
<rect class="ln" x="636" y="272" width="72" height="56" rx="6"/>
<circle class="fillG pulse" cx="672" cy="300" r="7" style="animation-delay:-1.4s"/>
<circle r="3.5" class="fillC"><animateMotion dur="2.6s" repeatCount="indefinite" path="M186 300 H392"/></circle>
<circle r="3" class="fillC"><animateMotion dur="1.8s" repeatCount="indefinite" path="M408 300 H636"/></circle>`),

  /* 05 — laboratory validation */
  'lab-validation': frame('LAB VALIDATION / RUN 04', `
<rect class="ln" x="120" y="100" width="560" height="400" rx="16"/>
<rect x="150" y="130" width="500" height="330" fill="#0a120e" stroke="#5c7269" stroke-width="1.5" opacity=".9"/>
${[0, 1, 2, 3].map((i) => `<line class="dim" x1="150" y1="${196 + i * 66}" x2="650" y2="${196 + i * 66}"/>`).join('')}
<path class="flow grn" d="M170 300 C 210 236, 250 236, 290 300 S 370 364, 410 300 S 490 236, 530 300 S 610 364, 632 300" stroke-width="3"/>
<line class="cyn" x1="170" y1="140" x2="170" y2="450" stroke-width="2" opacity=".7" style="animation:swp 4.4s linear infinite"/>
<circle class="led fillG" cx="628" cy="162" r="5"/>
<text class="lbl amb pulse" x="560" y="200" style="fill:#fbbf24;font-size:15px">PASS</text>
<style>@keyframes swp{from{transform:translateX(0)}to{transform:translateX(462px)}}</style>`),

  /* 06 — advanced materials */
  'advanced-materials': frame('ADVANCED MATERIALS / LATTICE', `
${[170, 250, 330, 410].map((y, r) => [0, 1, 2, 3, 4, 5, 6].map((c) => {
    const x = 128 + c * 78 + (r % 2 ? 39 : 0);
    const hot = (r === 1 && c === 2) || (r === 2 && c === 4) || (r === 0 && c === 5) || (r === 3 && c === 1);
    const defect = r === 2 && c === 5;
    if (defect) return `<circle class="fillA led" cx="${x}" cy="${y}" r="6"/>`;
    return hot ? `<circle class="fillG led" cx="${x}" cy="${y}" r="5" style="animation-delay:${(-(r + c) * 0.8).toFixed(1)}s"/>` : `<circle class="dim" cx="${x}" cy="${y}" r="5" style="opacity:.55"/>`;
  }).join('')).join('')}
<path class="dim" d="M206 250 L245 228 L284 250 L284 294 L245 316 L206 294 Z"/>
<path class="dim" d="M440 330 L479 308 L518 330 L518 374 L479 396 L440 374 Z"/>
<path class="dim" d="M323 170 L362 148 L401 170 L401 214 L362 236 L323 214 Z"/>
<rect x="40" y="120" width="100" height="360" fill="url(#scanband)" style="animation:scanX 7s ease-in-out infinite alternate"/>
<style>@keyframes scanX{from{transform:translateX(0)}to{transform:translateX(620px)}}</style>`),

  /* 07 — researchers meeting technical mentors */
  'mentor-session': frame('TECHNICAL MENTOR / REVIEW', `
<rect class="ln" x="330" y="80" width="380" height="244" rx="10"/>
<path class="flow cyn" d="M362 268 C 420 210, 462 158, 540 178 S 656 128, 688 104" stroke-width="3"/>
<line class="dim" x1="362" y1="120" x2="470" y2="120"/><line class="dim" x1="362" y1="142" x2="430" y2="142"/>
<ellipse class="ln" cx="300" cy="476" rx="240" ry="34"/>
<g class="bob"><circle class="lnb" cx="180" cy="330" r="22"/><path class="lnb" d="M146 398 Q180 358 214 398"/></g>
<g class="bob" style="animation-delay:-1.5s"><circle class="lnb" cx="266" cy="356" r="20"/><path class="lnb" d="M236 420 Q266 384 296 420"/></g>
<g class="bob" style="animation-delay:-3s"><circle class="lnb grn" cx="96" cy="380" r="18" opacity=".8"/><path class="lnb grn" d="M68 440 Q96 406 124 440" opacity=".8"/></g>
<line class="lnb amb" x1="214" y1="352" x2="330" y2="240" opacity=".6"><animate attributeName="opacity" values=".2;.7;.2" dur="3s" repeatCount="indefinite"/></line>`),

  /* 08 — founders testing hardware */
  'founders-testing': frame('HARDWARE FIELD TRIAL / 03', `
<rect class="ln" x="290" y="246" width="210" height="140" rx="10"/>
<rect x="312" y="268" width="96" height="62" fill="#0a120e" stroke="#5c7269" stroke-width="1.5"/>
<path class="flow grn" d="M318 300 C 334 276, 350 276, 366 300 S 396 322, 402 296"/>
<circle class="led fillG" cx="470" cy="272" r="5"/><circle class="led fillA" cx="470" cy="296" r="4" style="animation-delay:-1s"/>
<line class="lnb" x1="440" y1="246" x2="440" y2="168"/>
<path class="scan lnb cyn" d="M424 176 Q440 156 456 176"/><path class="scan lnb cyn" d="M414 162 Q440 132 466 162" style="animation-delay:-2s"/>
<path class="flow cyn" d="M500 316 C 556 316, 552 366, 596 366" opacity=".8"/>
<rect class="ln" x="596" y="322" width="116" height="88" rx="8"/>
<path class="dim" d="M616 386 A40 40 0 0 1 692 386"/>
<line class="lnb amb" x1="654" y1="388" x2="654" y2="352" style="transform-origin:654px 388px;animation:needle 2.6s ease-in-out infinite alternate"/>
<style>@keyframes needle{from{transform:rotate(-34deg)}to{transform:rotate(34deg)}}</style>`),

  /* 09 — design-partner / customer testing */
  'partner-testing': frame('DESIGN-PARTNER TRIAL / FEEDBACK', `
<rect class="ln" x="90" y="176" width="232" height="164" rx="10"/>
<line class="dim" x1="112" y1="212" x2="300" y2="212"/><line class="dim" x1="112" y1="240" x2="250" y2="240"/><line class="dim" x1="112" y1="266" x2="276" y2="266"/>
<rect class="pulse" x="112" y="292" width="76" height="24" rx="12" fill="none" stroke="#34d399" stroke-width="2"/>
<rect class="ln" x="478" y="252" width="232" height="164" rx="10"/>
<line class="dim" x1="500" y1="288" x2="688" y2="288"/><line class="dim" x1="500" y1="316" x2="640" y2="316"/><line class="dim" x1="500" y1="342" x2="664" y2="342"/>
<circle r="4.5" class="fillC"><animateMotion dur="2.4s" repeatCount="indefinite" path="M322 258 C 396 236, 416 296, 478 318"/></circle>
<circle r="3.5" class="fillG"><animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M478 330 C 416 308, 396 248, 322 270"/></circle>
<path class="fillC" d="M0 0 L0 26 L7 19 L12 30 L16 27 L11 16 L20 16 Z" style="animation:cur 5s ease-in-out infinite" transform="translate(150,240)"/>
<style>@keyframes cur{0%,100%{transform:translate(150px,240px)}35%{transform:translate(136px,278px)}60%{transform:translate(520px,300px)}80%{transform:translate(560px,296px)}}</style>`),

  /* 10 — legal / IP working session */
  'legal-ip': frame('IP WORKING SESSION / FILINGS', `
<rect class="ln" x="272" y="76" width="256" height="348" rx="6"/>
<line class="lnb" x1="300" y1="118" x2="440" y2="118"/>
${[0, 1, 2, 3, 4].map((i) => `<line class="dim" x1="300" y1="${156 + i * 26}" x2="${500 - (i % 3) * 42}" y2="${156 + i * 26}"/>`).join('')}
<path class="flow grn" d="M306 356 C 336 314, 356 396, 388 344 S 428 326, 452 352" stroke-width="2.5"/>
<circle class="amb pulse" cx="560" cy="390" r="34" fill="none" stroke-width="2"/>
<circle class="amb" cx="560" cy="390" r="24" fill="none" stroke-width="1.5" opacity=".5"/>
<path class="amb" d="M560 374 L564 386 L577 386 L567 394 L571 406 L560 399 L549 406 L553 394 L543 386 L556 386 Z" fill="none" stroke-width="1.5" opacity=".8"/>
<path class="lnb" d="M196 200 V262 Q196 300 166 320 Q136 300 136 262 V200 Q166 184 196 200 Z"/>
<path class="flow grn" d="M150 256 L163 271 L185 240" stroke-width="3"/>`),

  /* 11 — technical demo in front of experts */
  'demo-experts': frame('EXPERT DEMO / PANEL REVIEW', `
<polygon points="664,26 208,96 596,340" fill="#7dd3fc" opacity=".07" class="pulse"/>
<rect class="ln" x="176" y="72" width="448" height="272" rx="10"/>
<path class="dim" d="M216 296 V110 M216 296 H584"/>
<path class="flow grn" d="M228 282 L306 240 L376 256 L452 182 L540 148" stroke-width="3"/>
${[[262, 44, 0], [368, 66, -1.1], [474, 96, -2.2]].map(([x, h, d]) => `<rect class="fillC" x="${x}" y="${296 - h}" width="34" height="${h}" opacity=".55" style="transform-box:fill-box;transform-origin:50% 100%;animation:bar 3.4s ease-in-out ${d}s infinite alternate"/>`).join('')}
<circle r="4.5" class="fillA"><animateMotion dur="4s" repeatCount="indefinite" path="M228 282 L306 240 L376 256 L452 182 L540 148"/></circle>
<circle class="led fillC" cx="664" cy="26" r="6"/>
<g class="bob"><circle class="lnb" cx="270" cy="446" r="20"/><path class="lnb" d="M238 508 Q270 472 302 508"/></g>
<g class="bob" style="animation-delay:-1.4s"><circle class="lnb" cx="400" cy="456" r="20"/><path class="lnb" d="M368 518 Q400 482 432 518"/></g>
<g class="bob" style="animation-delay:-2.8s"><circle class="lnb" cx="530" cy="446" r="20"/><path class="lnb" d="M498 508 Q530 472 562 508"/></g>
<style>@keyframes bar{from{transform:scaleY(.25)}to{transform:scaleY(1)}}</style>`),
};

await mkdir(outDir, { recursive: true });
for (const [name, svg] of Object.entries(scenes)) {
  await writeFile(resolve(outDir, `${name}.svg`), svg, 'utf8');
}
process.stdout.write(`Generated ${Object.keys(scenes).length} animated visuals in ${outDir}\n`);
