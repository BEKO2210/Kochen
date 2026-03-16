import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// Premium dark blue + gold icon: Calendar with fork & knife
function createIconSVG(size) {
  const s = size;
  const cx = s / 2;
  const f = s / 512; // Scale factor

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F1B3D"/>
      <stop offset="100%" stop-color="#1A2B5A"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#F5D574"/>
      <stop offset="50%" stop-color="#C9A234"/>
      <stop offset="100%" stop-color="#F5D574"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${2*f}" stdDeviation="${4*f}" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${s*0.18}" fill="url(#bg)"/>

  <!-- Subtle inner border -->
  <rect x="${s*0.02}" y="${s*0.02}" width="${s*0.96}" height="${s*0.96}" rx="${s*0.16}"
        fill="none" stroke="#2A3F7A" stroke-width="${1.5*f}"/>

  <!-- Calendar body -->
  <g filter="url(#shadow)">
    <rect x="${s*0.18}" y="${s*0.20}" width="${s*0.64}" height="${s*0.58}"
          rx="${12*f}" fill="url(#gold)" opacity="0.95"/>

    <!-- Calendar header bar -->
    <rect x="${s*0.18}" y="${s*0.20}" width="${s*0.64}" height="${s*0.11}"
          rx="${12*f}" fill="#C9A234"/>
    <rect x="${s*0.18}" y="${s*0.26}" width="${s*0.64}" height="${s*0.05}" fill="#C9A234"/>

    <!-- Calendar rings -->
    <rect x="${s*0.30}" y="${s*0.15}" width="${s*0.04}" height="${s*0.10}" rx="${3*f}" fill="#F5D574"/>
    <rect x="${s*0.66}" y="${s*0.15}" width="${s*0.04}" height="${s*0.10}" rx="${3*f}" fill="#F5D574"/>
  </g>

  <!-- Fork (left of center) - LARGE and centered on calendar -->
  <g transform="translate(${s*0.28}, ${s*0.34})" fill="none" stroke="#0F1B3D" stroke-width="${5*f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <!-- Fork handle -->
    <line x1="${14*f}" y1="${85*f}" x2="${14*f}" y2="${42*f}"/>
    <!-- Fork tines -->
    <line x1="${0}" y1="${22*f}" x2="${0}" y2="${0}"/>
    <line x1="${14*f}" y1="${22*f}" x2="${14*f}" y2="${0}"/>
    <line x1="${28*f}" y1="${22*f}" x2="${28*f}" y2="${0}"/>
    <!-- Fork base curve -->
    <path d="M${0},${22*f} Q${0},${36*f} ${14*f},${36*f} Q${28*f},${36*f} ${28*f},${22*f}"/>
  </g>

  <!-- Knife (right of center) - LARGE and centered on calendar -->
  <g transform="translate(${s*0.56}, ${s*0.34})" fill="none" stroke="#0F1B3D" stroke-width="${5*f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <!-- Knife handle -->
    <line x1="${10*f}" y1="${85*f}" x2="${10*f}" y2="${35*f}"/>
    <!-- Knife blade -->
    <path d="M${10*f},${35*f} Q${24*f},${28*f} ${24*f},${10*f} Q${24*f},${0} ${10*f},${0}" fill="#0F1B3D" fill-opacity="0.12"/>
    <path d="M${10*f},${35*f} Q${24*f},${28*f} ${24*f},${10*f} Q${24*f},${0} ${10*f},${0}"/>
  </g>

  <!-- "KP" text at bottom -->
  <text x="${cx}" y="${s*0.91}" text-anchor="middle"
        font-family="Georgia, serif" font-size="${22*f}" font-weight="bold"
        fill="#C9A234" letter-spacing="${3*f}" opacity="0.8">KP</text>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  for (const size of sizes) {
    const svg = createIconSVG(size);
    const outPath = join(outDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }

  // Favicon source (32x32)
  const faviconSvg = createIconSVG(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(outDir, '..', 'favicon.png'));
  console.log('Generated favicon.png');

  // Apple touch icon (180x180)
  const appleSvg = createIconSVG(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(join(outDir, '..', 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

generate().catch(console.error);
