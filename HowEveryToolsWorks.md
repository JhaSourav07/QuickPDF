# 🔧 How Every Tool Works

This document provides a detailed explanation of how each tool in QuickPDF works. All operations are performed entirely in the browser, ensuring user privacy and security.

---

## 📌 Watermark Tool

The Watermark Tool allows users to add text or image watermarks to their PDF files without uploading data to any server.

### How it Works:

1. The user uploads a PDF file from their device.
2. The file is read locally using the browser’s FileReader API.
3. The user can add a text or image watermark.
4. The watermark is applied to selected pages using pdf-lib.
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

The Compress PDF tool reduces the file size of PDF documents for easier sharing and storage.

### How it Works:

1. The user uploads a PDF file.
2. The file is processed in the browser.
3. Compression techniques are applied (such as optimizing images and removing unnecessary data).
4. A smaller version of the PDF is generated.
5. The compressed file is available for download.

### Use Case:

- Reducing file size for email or uploads

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
3. Each page is converted into an image format (e.g., PNG or JPEG).
4. Images are generated in the browser.
5. The user can download images individually or as a zip file.

### Use Case:

- Extracting images from documents
- Sharing pages as images
