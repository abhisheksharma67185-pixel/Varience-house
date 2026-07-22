import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import https from 'node:https';

const root = resolve(import.meta.dirname, '..');

function fetchBuffer(url) {
  return new Promise((resolvePromise, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolvePromise(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

const zoom = 12;
const centerTileX = lon2tile(77.5946, zoom);
const centerTileY = lat2tile(12.9716, zoom);

console.log(`Bangalore Tile at zoom ${zoom}: X=${centerTileX}, Y=${centerTileY}`);

const tilesX = 6;
const tilesY = 4;
const startX = centerTileX - Math.floor(tilesX / 2);
const startY = centerTileY - Math.floor(tilesY / 2);

const tileUrls = [];
for (let y = 0; y < tilesY; y++) {
  for (let x = 0; x < tilesX; x++) {
    const tx = startX + x;
    const ty = startY + y;
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
    tileUrls.push({ x, y, url });
  }
}

async function downloadTiles() {
  const images = [];
  for (const item of tileUrls) {
    console.log(`Fetching tile (${item.x}, ${item.y}): ${item.url}`);
    const buffer = await fetchBuffer(item.url);
    images.push({ ...item, buffer });
  }

  const width = tilesX * 256;
  const height = tilesY * 256;

  let svgImages = '';
  for (const img of images) {
    const base64 = img.buffer.toString('base64');
    const posX = img.x * 256;
    const posY = img.y * 256;
    svgImages += `  <image x="${posX}" y="${posY}" width="256" height="256" href="data:image/jpeg;base64,${base64}" />\n`;
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
${svgImages}
</svg>`;

  await writeFile(resolve(root, 'images/bangalore-satellite-aerial.svg'), svgContent, 'utf8');
  await writeFile(resolve(root, 'public/images/bangalore-satellite-aerial.svg'), svgContent, 'utf8');
  await writeFile(resolve(root, 'assets/bangalore-satellite-aerial.svg'), svgContent, 'utf8');

  await writeFile(resolve(root, 'images/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');
  await writeFile(resolve(root, 'public/images/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');
  await writeFile(resolve(root, 'assets/bangalore-satellite-aerial.jpg'), svgContent, 'utf8');

  console.log('Successfully created real satellite photography map asset!');
}

downloadTiles().catch(console.error);
