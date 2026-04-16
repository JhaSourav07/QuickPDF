# 🔧 How Every Tool Works

This document provides a detailed explanation of how each tool in QuickPDF works. All PDF processing is performed entirely in the browser, and files are never uploaded, helping protect user privacy and security.

---

## 📌 Watermark Tool

The Watermark Tool allows users to add text watermarks to their PDF files without uploading data to any server.

### How it Works:

1. The user uploads a PDF file from their device.
2. The file is read locally in the browser.
3. The user enters the watermark text.
4. The text watermark is applied to all pages using pdf-lib.
5. The processed PDF is generated in the browser.
6. The final file is available for download.

### Use Case:

- Adding ownership marks
- Protecting documents from unauthorized use

---

## 📌 Image to PDF

This tool converts one or multiple images into a single PDF document.

### How it Works:

1. The user uploads one or more image files.
2. Images are processed and converted into PDF pages.
3. The user can arrange images in the desired order.
4. A PDF file is generated using pdf-lib.
5. The final PDF is downloaded directly.

### Use Case:

- Creating PDFs from scanned documents or photos

---

## 📌 Compress PDF

The Compress PDF tool attempts to reduce the file size of PDF documents for easier sharing and storage.

### How it Works:

1. The user uploads a PDF file.
2. The file is processed entirely in the browser.
3. The PDF is re-saved using pdf-lib with compact serialization options where possible.
4. A new PDF is generated, which may be smaller depending on the document’s structure and contents.
5. The resulting file is available for download.

### Use Case:

- Reducing file size for email or uploads when the document can be compacted by re-saving

---

## 📌 Rotate PDF

This tool allows users to rotate specific pages or the entire PDF.

### How it Works:

1. The user uploads a PDF file.
2. Pages are rendered using pdfjs-dist.
3. The user selects pages and rotation angle (90°, 180°, 270°).
4. Changes are applied using pdf-lib.
5. The updated PDF is generated and downloaded.

### Use Case:

- Fixing incorrectly scanned or oriented documents

---

## 📌 Organize PDF

The Organize PDF tool helps users manage pages within a document.

### How it Works:

1. The user uploads a PDF file.
2. Pages are displayed visually in the browser.
3. The user can reorder, delete, or rearrange pages.
4. Changes are applied using pdf-lib.
5. A new organized PDF is generated and downloaded.

### Use Case:

- Rearranging reports or removing unwanted pages

---

## 📌 PDF to Images

This tool converts each page of a PDF into image files.

### How it Works:

1. The user uploads a PDF file.
2. Pages are rendered using pdfjs-dist.
3. Each page is converted into a JPEG image.
4. The JPEG images are generated in the browser.
5. The images are packaged into a ZIP file for download.

### Use Case:

- Extracting images from documents
- Sharing pages as images
