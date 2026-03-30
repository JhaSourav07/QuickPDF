import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
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

export const addWatermark = async (file, watermarkText = "CONFIDENTIAL") => {
  if (!file) throw new Error("Please provide a PDF file.");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Stick with a built-in font so we don't need extra assets.
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = 60;

    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.3,
      rotate: degrees(45),
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

export const compressWithQuality = async (file, quality = 0.5) => {
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
