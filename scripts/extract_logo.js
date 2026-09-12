const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function encodePng(rgbaBuffer, w, h) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const scanlines = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const srcStart = y * w * 4;
    const destStart = y * (1 + w * 4);
    scanlines[destStart] = 0;
    rgbaBuffer.copy(scanlines, destStart + 1, srcStart, srcStart + w * 4);
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const origBuf = fs.readFileSync('C:\\Users\\PRASAD\\.gemini\\antigravity-ide\\brain\\7428fe89-4fe0-4f8b-b413-f8ba6bbc0fef\\.user_uploaded\\media_1789251539361.png');
let offset = 8;
const chunks = [];
while (offset < origBuf.length) {
  const length = origBuf.readUInt32BE(offset);
  const type = origBuf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') chunks.push(origBuf.slice(offset + 8, offset + 8 + length));
  offset += 12 + length;
}
const raw = zlib.inflateSync(Buffer.concat(chunks));

const origW = 1024;
const origH = 558;
const bpp = 4;
const rowBytes = origW * bpp;
const uncompressed = Buffer.alloc(origW * origH * 4);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

let srcOffset = 0;
for (let y = 0; y < origH; y++) {
  const filterType = raw[srcOffset++];
  const prevRowOffset = y > 0 ? (y - 1) * rowBytes : -1;
  const currentRowOffset = y * rowBytes;

  for (let x = 0; x < rowBytes; x++) {
    const rawByte = raw[srcOffset++];
    const a = x >= bpp ? uncompressed[currentRowOffset + x - bpp] : 0;
    const b = prevRowOffset >= 0 ? uncompressed[prevRowOffset + x] : 0;
    const c = prevRowOffset >= 0 && x >= bpp ? uncompressed[prevRowOffset + x - bpp] : 0;

    let val = 0;
    if (filterType === 0) val = rawByte;
    else if (filterType === 1) val = (rawByte + a) & 0xff;
    else if (filterType === 2) val = (rawByte + b) & 0xff;
    else if (filterType === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
    else if (filterType === 4) val = (rawByte + paeth(a, b, c)) & 0xff;

    uncompressed[currentRowOffset + x] = val;
  }
}

// Bounding box was minX: 115, maxX: 909, minY: 194, maxY: 364
const pad = 6;
const cropX = Math.max(0, 115 - pad);
const cropY = Math.max(0, 194 - pad);
const cropW = Math.min(origW, 909 + pad) - cropX + 1;
const cropH = Math.min(origH, 364 + pad) - cropY + 1;

function processPixel(r, g, b) {
  const blueDiff = b - (r + g) / 2;
  if (blueDiff <= 8) {
    return [0, 0, 0, 0];
  }
  let alpha = 255;
  if (blueDiff < 85) {
    alpha = Math.min(255, Math.max(0, Math.round((blueDiff / 85) * 255)));
  }
  return [26, 96, 226, alpha];
}

const fullLogoBuffer = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcIdx = ((cropY + y) * origW + (cropX + x)) * 4;
    const r = uncompressed[srcIdx];
    const g = uncompressed[srcIdx + 1];
    const b = uncompressed[srcIdx + 2];
    const [outR, outG, outB, outA] = processPixel(r, g, b);
    const destIdx = (y * cropW + x) * 4;
    fullLogoBuffer[destIdx] = outR;
    fullLogoBuffer[destIdx + 1] = outG;
    fullLogoBuffer[destIdx + 2] = outB;
    fullLogoBuffer[destIdx + 3] = outA;
  }
}

const fullPng = encodePng(fullLogoBuffer, cropW, cropH);

// Icon only
const iconMaxX = 368;
const iconCropX = Math.max(0, 115 - pad);
const iconCropY = Math.max(0, 194 - pad);
const iconCropW = iconMaxX + pad - iconCropX + 1;
const iconCropH = Math.min(origH, 364 + pad) - iconCropY + 1;

const iconBuffer = Buffer.alloc(iconCropW * iconCropH * 4);
for (let y = 0; y < iconCropH; y++) {
  for (let x = 0; x < iconCropW; x++) {
    const srcIdx = ((iconCropY + y) * origW + (iconCropX + x)) * 4;
    const r = uncompressed[srcIdx];
    const g = uncompressed[srcIdx + 1];
    const b = uncompressed[srcIdx + 2];
    const [outR, outG, outB, outA] = processPixel(r, g, b);
    const destIdx = (y * iconCropW + x) * 4;
    iconBuffer[destIdx] = outR;
    iconBuffer[destIdx + 1] = outG;
    iconBuffer[destIdx + 2] = outB;
    iconBuffer[destIdx + 3] = outA;
  }
}
const iconPng = encodePng(iconBuffer, iconCropW, iconCropH);

// Vector SVG for icon and full logo
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 170" fill="none">
  <!-- MockOra M-Arrow Icon -->
  <path d="M20 152 L78 30 L118 92 L144 54 L198 12 C198 12 188 12 188 12" stroke="#1d61eb" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M78 152 L118 92 L172 172" stroke="#1d61eb" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
  <polygon points="170,10 236,12 234,78 206,50 170,10" fill="#1d61eb" />
</svg>`;

const targets = [
  'C:\\Users\\PRASAD\\Documents\\NeuVexa\\MockVerse_New\\landing_page',
  'C:\\Users\\PRASAD\\Documents\\NeuVexa\\MockVerse_New\\user',
  'C:\\Users\\PRASAD\\Documents\\NeuVexa\\MockVerse_New\\admin'
];

for (const target of targets) {
  const publicDir = path.join(target, 'public');
  const assetsDir = path.join(target, 'src', 'assets');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'logo.png'), fullPng);
  fs.writeFileSync(path.join(publicDir, 'logo-icon.png'), iconPng);
  fs.writeFileSync(path.join(publicDir, 'mockora-logo.png'), fullPng);
  fs.writeFileSync(path.join(publicDir, 'mockora-icon.png'), iconPng);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), iconPng);

  fs.writeFileSync(path.join(assetsDir, 'logo.png'), fullPng);
  fs.writeFileSync(path.join(assetsDir, 'logo-icon.png'), iconPng);
  fs.writeFileSync(path.join(assetsDir, 'mockora-logo.png'), fullPng);
  fs.writeFileSync(path.join(assetsDir, 'mockora-icon.png'), iconPng);

  console.log('Saved logo files to: ' + target);
}
