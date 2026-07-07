import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const SWATCH_ROLE_MAP = {
  Vibrant: "primary",
  DarkVibrant: "secondary",
  LightVibrant: "accent",
  Muted: "dominant",
  DarkMuted: "background",
  LightMuted: "text",
};

async function vibrantSwatchesFrom(imagePathOrBuffer, source) {
  try {
    const palette = await Vibrant.from(imagePathOrBuffer).getPalette();
    const swatches = [];
    for (const [key, swatch] of Object.entries(palette)) {
      if (!swatch) continue;
      swatches.push({
        hex: swatch.hex,
        role: SWATCH_ROLE_MAP[key] || "dominant",
        source,
        population: swatch.population || 0,
      });
    }
    const totalPop = swatches.reduce((sum, s) => sum + s.population, 0) || 1;
    return swatches.map((s) => ({ ...s, population: Number((s.population / totalPop).toFixed(3)) }));
  } catch {
    return [];
  }
}

export async function extractPaletteFromLogo(logoPath) {
  if (!logoPath) return [];
  // node-vibrant ne décode pas le SVG (format vectoriel) — on le rasterise en PNG via sharp
  // (qui embarque librsvg) avant analyse, sinon la couleur du logo est silencieusement ignorée.
  if (logoPath.toLowerCase().endsWith(".svg")) {
    try {
      const svgBuffer = await readFile(logoPath);
      const pngBuffer = await sharp(svgBuffer, { density: 300 })
        .resize(512, 512, { fit: "inside" })
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer();
      return vibrantSwatchesFrom(pngBuffer, "logo");
    } catch {
      return [];
    }
  }
  return vibrantSwatchesFrom(logoPath, "logo");
}

export async function extractPaletteFromScreenshot(screenshotPath) {
  if (!screenshotPath) return [];
  return vibrantSwatchesFrom(screenshotPath, "hero-screenshot");
}

export async function extractComputedCssColors(page) {
  const colors = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    const candidates = document.querySelectorAll("body, header, nav, a, button, [class*='btn'], h1, h2");
    for (const el of candidates) {
      const style = getComputedStyle(el);
      for (const prop of ["backgroundColor", "color"]) {
        const value = style[prop];
        if (value && !seen.has(value) && !/rgba?\(0,\s*0,\s*0,\s*0\)/.test(value) && value !== "transparent") {
          seen.add(value);
          results.push(value);
        }
      }
    }
    return results.slice(0, 20);
  });

  function rgbToHex(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return null;
    return (
      "#" +
      match
        .slice(0, 3)
        .map((n) => Number(n).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  return colors
    .map((c) => rgbToHex(c))
    .filter(Boolean)
    .map((hex) => ({ hex, role: "background", source: "css", population: 0 }));
}

export function mergePalette({ fromLogo, fromScreenshot, fromCss }) {
  const method = fromLogo.length
    ? "vibrant-from-logo"
    : fromScreenshot.length
    ? "vibrant-from-screenshots"
    : fromCss.length
    ? "css-computed"
    : "mixed";

  const combined = [...fromLogo, ...fromScreenshot, ...fromCss];
  const seenHex = new Set();
  const deduped = combined.filter((s) => {
    const key = s.hex.toLowerCase();
    if (seenHex.has(key)) return false;
    seenHex.add(key);
    return true;
  });

  return { method, swatches: deduped.slice(0, 8) };
}
