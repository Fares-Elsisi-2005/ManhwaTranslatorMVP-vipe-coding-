/**
 * PDF Downloader — downloads the current Webtoon episode as a PDF.
 *
 * Uses bundled jsPDF to bypass Webtoon CSP.
 */

import { jsPDF } from "jspdf";
import { detectEpisodeImages } from "./detector.js";

/** Load an image element from a URL and return the HTMLImageElement */
async function loadImage(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const img = new Image();
  img.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });

  return img;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  phase: "loading" | "rendering" | "saving";
}

type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * Download the current Webtoon episode as a PDF.
 * Sends progress updates via the callback.
 */
export async function downloadEpisodeAsPDF(
  onProgress?: ProgressCallback
): Promise<void> {
  // Settings matching the original proven script
  const CANVAS_WIDTH_PX = 800;
  const PAGE_LIMIT_PX = 13000;
  const JPEG_QUALITY = 0.32;
  const PDF_WIDTH_MM = 210;

  // Step 1: Get episode image URLs
  const detected = detectEpisodeImages();
  if (detected.length === 0) {
    throw new Error("No episode images found on this page");
  }

  const urls = detected.map((img) => img.src).filter(Boolean);
  onProgress?.({ loaded: 0, total: urls.length, phase: "loading" });

  // Step 3: Load all images
  type PageImage = { img: HTMLImageElement; widthPx: number; heightPx: number };
  type Page = { images: PageImage[]; heightPx: number };

  const pages: Page[] = [];
  let currentPageImages: PageImage[] = [];
  let currentPageHeightPx = 0;

  for (let i = 0; i < urls.length; i++) {
    onProgress?.({ loaded: i, total: urls.length, phase: "loading" });

    try {
      const img = await loadImage(urls[i]);
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;

      if (!srcW || !srcH) {
        URL.revokeObjectURL(img.src);
        continue;
      }

      let drawWidthPx = CANVAS_WIDTH_PX;
      let drawHeightPx = Math.round(srcH * (drawWidthPx / srcW));

      // Shrink oversized images to fit within the page limit
      if (drawHeightPx > PAGE_LIMIT_PX) {
        const fitScale = PAGE_LIMIT_PX / drawHeightPx;
        drawWidthPx = Math.max(1, Math.round(drawWidthPx * fitScale));
        drawHeightPx = Math.max(1, Math.round(drawHeightPx * fitScale));
      }

      // Start a new page if this image would exceed the limit
      if (
        currentPageImages.length > 0 &&
        currentPageHeightPx + drawHeightPx > PAGE_LIMIT_PX
      ) {
        pages.push({ images: currentPageImages, heightPx: currentPageHeightPx });
        currentPageImages = [];
        currentPageHeightPx = 0;
      }

      currentPageImages.push({ img, widthPx: drawWidthPx, heightPx: drawHeightPx });
      currentPageHeightPx += drawHeightPx;
    } catch (err) {
      console.warn("[WebtoonTranslate] Failed to load image:", urls[i], err);
    }
  }

  if (currentPageImages.length > 0) {
    pages.push({ images: currentPageImages, heightPx: currentPageHeightPx });
  }

  if (pages.length === 0) throw new Error("No valid images to export");

  // Step 4: Build PDF
  onProgress?.({ loaded: urls.length, total: urls.length, phase: "rendering" });

  function pxToMm(px: number) {
    return px * (PDF_WIDTH_MM / CANVAS_WIDTH_PX);
  }

  const firstPageHeightMm = pxToMm(pages[0].heightPx);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PDF_WIDTH_MM, firstPageHeightMm],
    compress: true,
  });

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH_PX;
    canvas.height = page.heightPx;

    const ctx = canvas.getContext("2d", { alpha: false })!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let y = 0;
    for (const item of page.images) {
      ctx.drawImage(item.img, 0, y, item.widthPx, item.heightPx);
      y += item.heightPx;
      URL.revokeObjectURL(item.img.src);
    }

    const imgData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const pageHeightMm = pxToMm(page.heightPx);

    if (p > 0) {
      pdf.addPage([PDF_WIDTH_MM, pageHeightMm], "portrait");
      pdf.setPage(p + 1);
    }

    // @ts-ignore - jspdf types can be tricky with complex arguments
    pdf.addImage(imgData, "JPEG", 0, 0, PDF_WIDTH_MM, pageHeightMm, undefined, "FAST");
  }

  // Step 5: Save
  onProgress?.({ loaded: urls.length, total: urls.length, phase: "saving" });

  // Build filename from page title
  const title = document.title.replace(/[^a-z0-9\s-]/gi, "").trim().slice(0, 50) || "webtoon-episode";
  pdf.save(`${title}.pdf`);
}
