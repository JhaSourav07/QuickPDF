import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
} from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';

// merging multiple PDFs into one
export const mergePdfs = async (files) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for merging.");
  }

  // created new PDFDocument
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    // reading the given file
    const arrayBuffer = await file.arrayBuffer();
    // loading the file
    const pdf = await PDFDocument.load(arrayBuffer);
    // getting the page indices of the loaded PDF and copying them to the merged PDF
    const pageIndices = pdf.getPageIndices();
    // copying the pages from the loaded PDF to the merged PDF
    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
    // adding the copied pages to the merged PDF
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  // saving the merged PDF and returning it as a Blob
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return blob;
};

// splitting a PDF into a new PDF based on a page range
export const splitPdf = async (file, startPage, endPage) => {
  if (!file) throw new Error("Please provide a PDF file.");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();

  // Validate the range (Users think in 1-index, pdf-lib uses 0-index)
  if (startPage < 1 || endPage > totalPages || startPage > endPage) {
    throw new Error(
      `Invalid range. Please select between page 1 and ${totalPages}.`,
    );
  }

  // Create a new empty PDF
  const splitPdfDoc = await PDFDocument.create();

  // Create an array of the page indices we want to extract
  // Example: user wants pages 2 to 4. Array becomes [1, 2, 3] (0-indexed)
  const indicesToExtract = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage - 1 + i,
  );

  // Copy and add the pages
  const copiedPages = await splitPdfDoc.copyPages(pdf, indicesToExtract);
  copiedPages.forEach((page) => splitPdfDoc.addPage(page));

  // Save and return as a Blob
  const pdfBytes = await splitPdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

// Helper function to quickly get the page count for the UI without saving
export const getPdfPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
};

// adding a diagonal watermark to each page of a PDF
export const addWatermark = async (file, watermarkText = "CONFIDENTIAL") => {
  if (!file) throw new Error("Please provide a PDF file.");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Embed a standard font so we don't have to load external font files
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Loop through every page and stamp it
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = 60;

    // Calculate the width of the text so we can perfectly center it
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2, // Center horizontally
      y: height / 2 - textHeight / 2, // Center vertically
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5), // Gray color
      opacity: 0.3, // 30% opacity so you can read the document underneath
      rotate: degrees(45), // Diagonal slant
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

// convert various image formats (jpg, png) to PDF with each image on its own page, perfectly sized to fit the page without distortion
export const imageToPdf = async (files) => {
  if (!files || files.length === 0) {
    throw new Error("No images provided for conversion.");
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let embeddedImage;

    // Detect format and embed accordingly
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === "image/png") {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      throw new Error(
        `Unsupported file type: ${file.type}. Please use JPG or PNG.`,
      );
    }

    // Extract precise dimensions
    const { width, height } = embeddedImage;

    // Create a page matching the exact image dimensions
    const page = pdfDoc.addPage([width, height]);

    // Draw the image filling the entire page
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

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const compressWithQuality = async (file, quality = 0.5) => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document with 'ignoreEncryption' to bypass permission locks
  const pdfDoc = await PDFDocument.load(arrayBuffer, { 
    ignoreEncryption: true,
    // Using a smaller byte range helps prevent browser hangs on 100MB+ files
    capNumbers: true 
  });
  
  // Create a brand new document to force a complete re-index of the data
  const compressedDoc = await PDFDocument.create();
  const copiedPages = await compressedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
  copiedPages.forEach(page => compressedDoc.addPage(page));

  // The 'useObjectStreams' flag is the secret for large files. 
  // It zips thousands of tiny PDF objects into a few large binary chunks.
  const compressedBytes = await compressedDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });

  return new Blob([compressedBytes], { type: 'application/pdf' });
};

// Rotate all pages in a PDF
export const rotatePdf = async (file, rotationAngle) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    // Get the current rotation of the page (in case it's already rotated)
    const currentRotation = page.getRotation().angle;
    // Add the new rotation to the existing one
    page.setRotation(degrees(currentRotation + rotationAngle));
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};