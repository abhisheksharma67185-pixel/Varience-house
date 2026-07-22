import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1600" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sat-base" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071210"/>
      <stop offset="35%" stop-color="#0c201a"/>
      <stop offset="65%" stop-color="#143027"/>
      <stop offset="90%" stop-color="#0f261f"/>
      <stop offset="100%" stop-color="#06120e"/>
    </linearGradient>

    <radialGradient id="city-core" cx="44%" cy="48%" r="40%">
      <stop offset="0%" stop-color="#2a4a3e" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#1c362d" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#0c201a" stop-opacity="0.2"/>
    </radialGradient>

    <radialGradient id="whitefield-core" cx="72%" cy="58%" r="25%">
      <stop offset="0%" stop-color="#28463a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0c201a" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="water-bellandur" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#04121a" stop-opacity="0.98"/>
      <stop offset="70%" stop-color="#0a2230" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#12364a" stop-opacity="0.6"/>
    </radialGradient>

    <radialGradient id="water-ulsoor" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#081e2b" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0f3448" stop-opacity="0.7"/>
    </radialGradient>

    <radialGradient id="sat-sunlight" cx="65%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.14"/>
      <stop offset="50%" stop-color="#93c5fd" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </radialGradient>

    <pattern id="urban-blocks" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="12" height="8" fill="#3a5e50" opacity="0.28" rx="1"/>
      <rect x="16" y="2" width="10" height="12" fill="#2d4c40" opacity="0.22" rx="1"/>
      <rect x="4" y="14" width="20" height="10" fill="#446e5e" opacity="0.18" rx="1"/>
    </pattern>
  </defs>

  <rect width="2400" height="1600" fill="url(#sat-base)"/>
  <rect width="2400" height="1600" fill="url(#urban-blocks)"/>
  <rect width="2400" height="1600" fill="url(#city-core)"/>
  <rect width="2400" height="1600" fill="url(#whitefield-core)"/>

  <g fill="#166534" opacity="0.55">
    <path d="M 820,540 C 860,520 920,530 940,580 C 950,630 900,680 840,670 C 800,660 790,580 820,540 Z"/>
    <ellipse cx="1060" cy="720" rx="95" ry="65" transform="rotate(-22 1060 720)"/>
    <ellipse cx="1040" cy="910" rx="120" ry="85" transform="rotate(15 1040 910)"/>
    <path d="M 750,1200 C 850,1100 950,1250 1100,1450 C 1200,1600 800,1600 700,1400 Z" opacity="0.7"/>
  </g>

  <path d="M 1480,910 C 1580,880 1720,930 1680,1010 C 1620,1070 1450,1050 1400,990 C 1380,950 1420,920 1480,910 Z" fill="url(#water-bellandur)"/>
  <text x="1510" y="970" fill="rgba(147,197,253,0.6)" font-family="monospace" font-size="13" letter-spacing="2">BELLANDUR LAKE</text>

  <path d="M 1820,940 C 1910,920 1980,960 1950,1010 C 1900,1050 1810,1020 1820,940 Z" fill="url(#water-bellandur)"/>

  <ellipse cx="1210" cy="700" rx="65" ry="45" fill="url(#water-ulsoor)" transform="rotate(-15 1210 700)"/>
  <text x="1230" y="705" fill="rgba(147,197,253,0.55)" font-family="monospace" font-size="11" letter-spacing="1">ULSOOR LAKE</text>

  <ellipse cx="940" cy="380" rx="110" ry="55" fill="url(#water-ulsoor)" transform="rotate(10 940 380)"/>
  <text x="960" y="385" fill="rgba(147,197,253,0.55)" font-family="monospace" font-size="11" letter-spacing="1">HEBBAL LAKE</text>

  <g fill="none" stroke="#475569" opacity="0.5" stroke-linecap="round">
    <path d="M 350,-100 C 650,250 880,500 1080,750 C 1180,900 1350,1200 1500,1700" stroke-width="7" stroke="#64748b"/>
    <path d="M 500,350 C 1100,280 1850,550 1750,1150 C 1650,1450 1000,1400 650,1000 C 500,800 450,500 500,350 Z" stroke-width="5" stroke-dasharray="14 8"/>
    <path d="M 1080,750 C 1350,780 1650,850 2200,950" stroke-width="6"/>
    <path d="M 1120,850 C 1220,1020 1380,1280 1550,1700" stroke-width="6.5" stroke="#64748b"/>
    <path d="M 1020,780 C 850,900 600,1100 -100,1350" stroke-width="5.5"/>
  </g>

  <g stroke="rgba(240,253,244,0.18)" stroke-width="1" fill="none">
    <line x1="1200" y1="0" x2="1200" y2="1600" stroke-dasharray="6 6"/>
    <line x1="0" y1="800" x2="2400" y2="800" stroke-dasharray="6 6"/>
    <circle cx="1080" cy="750" r="140" stroke="rgba(52,211,153,0.3)" stroke-width="1.5" stroke-dasharray="8 6"/>
    <circle cx="1080" cy="750" r="6" fill="#34d399"/>
  </g>

  <rect width="2400" height="1600" fill="url(#sat-sunlight)"/>
  <text x="80" y="1520" fill="rgba(240,253,244,0.7)" font-family="monospace" font-size="20" letter-spacing="5">BANGALORE METROPOLITAN REGION // 12.9716° N 77.5946° E // SATELLITE FIELD VIEW</text>
</svg>`;

await writeFile(resolve(root, 'images/bangalore-satellite-aerial.svg'), svgContent, 'utf8');
await writeFile(resolve(root, 'public/images/bangalore-satellite-aerial.svg'), svgContent, 'utf8');
await writeFile(resolve(root, 'assets/bangalore-satellite-aerial.svg'), svgContent, 'utf8');

await writeFile(resolve(root, 'images/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');
await writeFile(resolve(root, 'public/images/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');
await writeFile(resolve(root, 'assets/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');

process.stdout.write('Regenerated Bangalore satellite aerial SVG assets successfully.\n');
