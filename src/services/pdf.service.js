import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import * as pdfjsLib from "pdfjs-dist";

// Let Vite point pdf.js at the bundled worker for us.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
import JSZip from "jszip";

export const mergePdfs = async (files) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for merging.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageIndices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return blob;
};

export const splitPdf = async (file, startPage, endPage) => {
  if (!file) throw new Error("Please provide a PDF file.");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();

  // The UI is 1-based, but pdf-lib expects 0-based page indexes.
  if (startPage < 1 || endPage > totalPages || startPage > endPage) {
    throw new Error(
      `Invalid range. Please select between page 1 and ${totalPages}.`,
    );
  }

  const splitPdfDoc = await PDFDocument.create();
  const indicesToExtract = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage - 1 + i,
  );

  const copiedPages = await splitPdfDoc.copyPages(pdf, indicesToExtract);
  copiedPages.forEach((page) => splitPdfDoc.addPage(page));

  const pdfBytes = await splitPdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const getPdfPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
};

export const addWatermark = async (file, watermarkText = "CONFIDENTIAL", options = {}) => {
  if (!file) throw new Error("Please provide a PDF file.");

  const {
    position = "center",
    opacity = 0.3,
    fontSize = 60,
    rotation = 45,
    offsetX = 0,
    offsetY = 0,
  } = options;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);
    
    // Convert degrees to radians for math
    const rad = (rotation * Math.PI) / 180;

    let x, y;
    const margin = 40;

    switch (position) {
      case "top-left":
        x = margin;
        y = height - margin - textHeight;
        break;
      case "top-right":
        x = width - margin - textWidth;
        y = height - margin - textHeight;
        break;
      case "bottom-left":
        x = margin;
        y = margin;
        break;
      case "bottom-right":
        x = width - margin - textWidth;
        y = margin;
        break;
      case "center":
      default:
        x = (width / 2) - (Math.cos(rad) * textWidth / 2) + (Math.sin(rad) * textHeight / 2);
        y = (height / 2) - (Math.sin(rad) * textWidth / 2) - (Math.cos(rad) * textHeight / 2);
        break;
    }

    page.drawText(watermarkText, {
      x: x + Number(offsetX),
      y: y + Number(offsetY),
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
      opacity: parseFloat(opacity),
      rotate: degrees(rotation),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const imageToPdf = async (files) => {
  if (!files || files.length === 0) {
    throw new Error("No images provided for conversion.");
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let embeddedImage;

    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === "image/png") {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      throw new Error(
        `Unsupported file type: ${file.type}. Please use JPG or PNG.`,
      );
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const compressWithQuality = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  // Some PDFs are technically readable but still carry permission flags.
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    // This keeps very large files from freezing the browser as easily.
    capNumbers: true,
  });

  const compressedDoc = await PDFDocument.create();
  const copiedPages = await compressedDoc.copyPages(
    pdfDoc,
    pdfDoc.getPageIndices(),
  );
  copiedPages.forEach((page) => compressedDoc.addPage(page));

  // Object streams usually save a noticeable amount of space on bigger PDFs.
  const compressedBytes = await compressedDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  return new Blob([compressedBytes], { type: "application/pdf" });
};

export const rotatePdf = async (file, rotationAngle) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotationAngle));
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

// pageRotations is an array of delta-degrees per page, e.g. [90, 0, -90, 180]
export const rotatePdfPerPage = async (file, pageRotations) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page, i) => {
    const delta = pageRotations[i] ?? 0;
    if (delta === 0) return;
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + delta));
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

// Options: { position: "center"|"left"|"right", fontSize, prefix, startNumber, margin }
export const addPageNumbers = async (file, options = {}) => {
  const {
    position    = "center",
    fontSize    = 11,
    prefix      = "",
    startNumber = 1,
    margin      = 24,
  } = options;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc      = await PDFDocument.load(arrayBuffer);
  const font        = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages       = pdfDoc.getPages();

  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const label     = `${prefix}${startNumber + i}`;
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x;
    if (position === "left")       x = margin;
    else if (position === "right") x = width - textWidth - margin;
    else                           x = (width - textWidth) / 2; // center

    page.drawText(label, {
      x,
      y: margin,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};



export const getPdfThumbnails = async (file) => {
  if (!file) throw new Error("No file provided.");

  const arrayBuffer = await file.arrayBuffer();

  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdfJsDoc.numPages;
  const thumbnails = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfJsDoc.getPage(pageNum);
    const SCALE = 0.3;
    const viewport = page.getViewport({ scale: SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;

    thumbnails.push({
      // Keep the id stable enough for drag/reorder animations.
      id: `page-${pageNum - 1}-${Date.now()}`,
      originalIndex: pageNum - 1,
      url: canvas.toDataURL("image/jpeg", 0.8),
    });
  }

  return thumbnails;
};

export const organizePdf = async (file, pageIndices) => {
  if (!file) throw new Error("No file provided.");
  if (!pageIndices || pageIndices.length === 0)
    throw new Error("No pages selected.");

  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const outputPdf = await PDFDocument.create();

  const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
  copiedPages.forEach((page) => outputPdf.addPage(page));

  const pdfBytes = await outputPdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const extractImagesFromPdf = async (file, onProgress) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(i, pdf.numPages);

    const page = await pdf.getPage(i);
    // A little extra scale keeps the extracted images from looking soft.
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    // Pad the page number so the files stay in order when sorted by name.
    const pageString = i
      .toString()
      .padStart(pdf.numPages.toString().length, "0");
    zip.file(`${file.name.replace(".pdf", "")}_page-${pageString}.jpg`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
};

export const convertToGrayscale = async (file, onProgress) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const bwPdf = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(i, pdf.numPages);

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.height = viewport.height;
    tempCanvas.width = viewport.width;
    await page.render({ canvasContext: tempCtx, viewport }).promise;

    const finalCanvas = document.createElement("canvas");
    const finalCtx = finalCanvas.getContext("2d");
    finalCanvas.height = viewport.height;
    finalCanvas.width = viewport.width;

    // Let the canvas pipeline handle the grayscale pass for us.
    finalCtx.filter = "grayscale(100%)";
    finalCtx.drawImage(tempCanvas, 0, 0);

    const base64Image = finalCanvas.toDataURL("image/jpeg", 0.9);
    const imageBytes = await fetch(base64Image).then((res) =>
      res.arrayBuffer(),
    );

    const embeddedImage = await bwPdf.embedJpg(imageBytes);
    const { width, height } = embeddedImage.scale(1);

    const newPage = bwPdf.addPage([width, height]);
    newPage.drawImage(embeddedImage, { x: 0, y: 0, width, height });

    // Release the canvases as we go so large files do not balloon memory use.
    tempCanvas.width = 0;
    finalCanvas.width = 0;
  }

  const pdfBytes = await bwPdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

/**
 * Password-protect a PDF file.
 * @param {File}   file          - The source PDF
 * @param {string} userPassword  - Password required to open the document
 * @param {string} [ownerPassword] - Owner password (defaults to a random token)
 * @returns {Promise<Blob>}
 */
export const lockPdf = async (file, userPassword, ownerPassword) => {
  if (!file)         throw new Error("No file provided.");
  if (!userPassword) throw new Error("A password is required.");

  // Load via pdf-lib to ensure the file is a valid, readable PDF.
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc      = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfBytes    = await pdfDoc.save();

  // Owner password defaults to a random unguessable string so the user
  // password is the only way to open the document.
  const ownerPwd = ownerPassword || crypto.randomUUID();

  const encryptedBytes = await encryptPDF(
    pdfBytes,
    userPassword,
    ownerPwd,
  );

  return new Blob([encryptedBytes], { type: "application/pdf" });
};

// ─────────────────────────────────────────────────────────────────────────────
// applyEdits — bake canvas annotations into a PDF
// annotations: [{type, pageIndex, color, opacity, strokeWidth, ...shape}]
// pages:       [{width, height, pdfWidth, pdfHeight}]  (rendered at RENDER_SCALE)
// ─────────────────────────────────────────────────────────────────────────────
export const applyEdits = async (file, annotations, pages) => {
  if (!file) throw new Error("No file provided.");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pdfPages = pdfDoc.getPages();

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? rgb(parseInt(r[1],16)/255, parseInt(r[2],16)/255, parseInt(r[3],16)/255) : rgb(0,0,0);
  }

  for (const ann of annotations) {
    const info    = pages[ann.pageIndex];
    const pdfPage = pdfPages[ann.pageIndex];
    if (!info || !pdfPage) continue;

    // Scale factors: canvas-px → PDF-points
    const sx = info.pdfWidth  / info.width;
    const sy = info.pdfHeight / info.height;
    const toX = (cx) => cx * sx;
    const toY = (cy) => info.pdfHeight - cy * sy;  // flip Y (PDF origin = bottom-left)
    const clr  = hexToRgb(ann.color);

    switch (ann.type) {
      case "draw": {
        if (!ann.points || ann.points.length < 2) break;
        const step = Math.max(1, Math.floor(ann.points.length / 300));
        const pts  = ann.points.filter((_, i) => i % step === 0);
        if (pts.length < 2) pts.push(ann.points.at(-1));
        for (let i = 1; i < pts.length; i++) {
          pdfPage.drawLine({
            start: { x: toX(pts[i-1].x), y: toY(pts[i-1].y) },
            end:   { x: toX(pts[i].x),   y: toY(pts[i].y)   },
            thickness: (ann.strokeWidth ?? 2) * sx,
            color: clr,
            opacity: ann.opacity ?? 1,
          });
        }
        break;
      }
      case "highlight": {
        const lx = Math.min(ann.x, ann.x2), ly = Math.min(ann.y, ann.y2);
        const w  = Math.abs(ann.x2 - ann.x), h = Math.abs(ann.y2 - ann.y);
        pdfPage.drawRectangle({
          x: toX(lx), y: toY(ly + h), width: w * sx, height: h * sy,
          color: clr, opacity: 0.35,
        });
        break;
      }
      case "rect": {
        const lx = Math.min(ann.x, ann.x2), ly = Math.min(ann.y, ann.y2);
        const w  = Math.abs(ann.x2 - ann.x), h = Math.abs(ann.y2 - ann.y);
        pdfPage.drawRectangle({
          x: toX(lx), y: toY(ly + h), width: w * sx, height: h * sy,
          borderColor: clr, borderWidth: (ann.strokeWidth ?? 2) * sx,
          borderOpacity: ann.opacity ?? 1, opacity: 0,
        });
        break;
      }
      case "text": {
        const ptSize = (ann.fontSize ?? 18) * sx;
        pdfPage.drawText(ann.text, {
          x: toX(ann.x), y: toY(ann.y),
          size: Math.max(4, ptSize), font, color: clr, opacity: ann.opacity ?? 1,
        });
        break;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

// ─────────────────────────────────────────────────────────────────────────────
// editPdfText — replace existing text in a PDF (cover-and-redraw strategy)
// textEdits:  { [itemId]: newText }
// textItems:  [{id, pageIndex, pdfX, pdfY, pdfW, fontSize, str}]
// ─────────────────────────────────────────────────────────────────────────────
export const editPdfText = async (file, textEdits, textItems) => {
  if (!file) throw new Error("No file provided.");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc   = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pdfPages = pdfDoc.getPages();

  for (const [itemId, newText] of Object.entries(textEdits)) {
    const item = textItems.find(t => t.id === itemId);
    if (!item || newText === item.str) continue;

    const page = pdfPages[item.pageIndex];
    if (!page) continue;

    const fs  = Math.min(Math.max(item.fontSize, 4), 144);
    const pad = 1;

    // 1. Erase original with a white rectangle
    page.drawRectangle({
      x: item.pdfX - pad,
      y: item.pdfY - pad,
      width:  Math.max(item.pdfW + pad * 2, 6),
      height: fs * 1.25 + pad * 2,
      color:   rgb(1, 1, 1),
      opacity: 1,
    });

    // 2. Draw replacement text
    if (newText.trim()) {
      try {
        page.drawText(String(newText), {
          x: item.pdfX, y: item.pdfY,
          size: fs, font,
          color: rgb(0, 0, 0),
        });
      } catch { /* skip un-drawable characters */ }
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
};
