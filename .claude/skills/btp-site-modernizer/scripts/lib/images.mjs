import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MIN_DIMENSION = 80; // filtre les icônes/pixels de tracking

function extFromContentType(contentType = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return "jpg";
}

export async function downloadAndDedupeImages({ page, urls, outDir, sectionsByImageUrl }) {
  await mkdir(outDir, { recursive: true });
  const manifest = [];
  const hashToFile = new Map();
  let counter = 0;

  for (const url of [...new Set(urls)]) {
    if (!url || url.startsWith("data:")) continue;
    try {
      const response = await page.request.get(url, { timeout: 15000 });
      if (!response.ok()) continue;
      const buffer = await response.body();
      const hash = createHash("sha1").update(buffer).digest("hex");

      const usedInSections = sectionsByImageUrl.get(url) || [];

      if (hashToFile.has(hash)) {
        const existing = manifest.find((m) => m.hash === hash);
        if (existing) {
          existing.usedInSections = [...new Set([...existing.usedInSections, ...usedInSections])];
        }
        continue;
      }

      let width = 0;
      let height = 0;
      const contentType = response.headers()["content-type"] || "";
      const ext = extFromContentType(contentType);

      if (ext !== "svg") {
        try {
          const metadata = await sharp(buffer).metadata();
          width = metadata.width || 0;
          height = metadata.height || 0;
        } catch {
          // pas une image raster décodable par sharp (svg mal typé, etc.) — on garde le fichier quand même
        }
        if (width && height && Math.min(width, height) < MIN_DIMENSION) continue;
      }

      counter += 1;
      const file = `image-${String(counter).padStart(3, "0")}.${ext}`;
      await writeFile(path.join(outDir, file), buffer);
      hashToFile.set(hash, file);

      manifest.push({
        file: path.join("images", file),
        originalUrl: url,
        width,
        height,
        hash,
        usedInSections,
        altText: null,
      });
    } catch {
      // échec de téléchargement d'une image isolée — ne bloque pas le reste de l'extraction
    }
  }

  return manifest;
}

export function buildSectionsByImageUrlMap(sections) {
  const map = new Map();
  for (const section of sections) {
    for (const url of section.images || []) {
      const list = map.get(url) || [];
      list.push(section.id);
      map.set(url, list);
    }
  }
  return map;
}
