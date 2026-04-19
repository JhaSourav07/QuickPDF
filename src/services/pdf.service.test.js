import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs, splitPdf, getPdfPageCount, addWatermark, addPageNumbers, rotatePdf, rotatePdfPerPage, lockPdf } from './pdf.service.js';

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' }
}));

/**
 * Creates a mock PDF File object in memory using pdf-lib.
 *
 * @param {string} name - The name to give the generated file.
 * @param {number} pageCount - The number of blank pages to add to the PDF.
 * @returns {Promise<File>} A File object containing the PDF data.
 */
async function createMockPdfFile(name, pageCount) {
  // Create a new, blank PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add the specified number of blank pages
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  
  // Serialize the PDF document to bytes (Uint8Array)
  const pdfBytes = await pdfDoc.save();
  
  // Create a Blob from the bytes
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  // Simulate a File object by adding a name property (useful for browser environments)
  blob.name = name;
  
  return blob;
}

describe('mergePdfs', () => {
  it('should merge a 2-page and a 3-page PDF into a single 5-page PDF', async () => {
    // 1. Arrange: Create our mock PDF files
    const file1 = await createMockPdfFile('file1.pdf', 2);
    const file2 = await createMockPdfFile('file2.pdf', 3);
    
    // 2. Act: Merge the files using the service function
    const mergedBlob = await mergePdfs([file1, file2]);
    
    // 3. Assert: Verify the result is a Blob of type application/pdf
    expect(mergedBlob).toBeInstanceOf(Blob);
    expect(mergedBlob.type).toBe('application/pdf');
    
    // Read the merged blob back into pdf-lib to verify the total page count
    const arrayBuffer = await mergedBlob.arrayBuffer();
    const mergedPdfDoc = await PDFDocument.load(arrayBuffer);
    
    expect(mergedPdfDoc.getPageCount()).toBe(5);
  });

  it('should throw an error if passed an empty array or null', async () => {
    // We wrap the calls in an async function to gracefully handle 
    // both synchronous throws and asynchronous rejections.
    const callMergePdfs = async (input) => {
      return await mergePdfs(input);
    };

    await expect(callMergePdfs([])).rejects.toThrow('No files provided for merging.');
    await expect(callMergePdfs(null)).rejects.toThrow('No files provided for merging.');
  });
});

describe('splitPdf', () => {
  it('should extract pages 2 through 4 from a 5-page PDF', async () => {
    // 1. Arrange: Create a mock 5-page PDF
    const file = await createMockPdfFile('5-page.pdf', 5);
    
    // 2. Act: Extract pages 2 through 4
    // Assuming the signature is splitPdf(file, startPage, endPage)
    const splitBlob = await splitPdf(file, 2, 4);
    
    // 3. Assert: Verify the result is a Blob of type application/pdf
    expect(splitBlob).toBeInstanceOf(Blob);
    expect(splitBlob.type).toBe('application/pdf');
    
    // Read the split blob back into pdf-lib to verify it contains exactly 3 pages
    const arrayBuffer = await splitBlob.arrayBuffer();
    const splitPdfDoc = await PDFDocument.load(arrayBuffer);
    
    expect(splitPdfDoc.getPageCount()).toBe(3);
  });

  it('should throw an "Invalid range" error for invalid page ranges', async () => {
    // Arrange: Create a mock 5-page PDF
    const file = await createMockPdfFile('5-page.pdf', 5);

    // We wrap the call to handle synchronous or asynchronous errors
    const callSplitPdf = async (start, end) => {
      return await splitPdf(file, start, end);
    };

    // Test: start page is less than 1
    await expect(callSplitPdf(0, 3)).rejects.toThrow('Invalid range');
    
    // Test: end page is greater than total pages (5)
    await expect(callSplitPdf(2, 6)).rejects.toThrow('Invalid range');
    
    // Test: start page is greater than end page
    await expect(callSplitPdf(4, 2)).rejects.toThrow('Invalid range');
  });
});

describe('getPdfPageCount', () => {
  it('should return exactly 7 for a 7-page PDF', async () => {
    // 1. Arrange: Create a mock 7-page PDF
    const file = await createMockPdfFile('7-page.pdf', 7);
    
    // 2. Act: Call getPdfPageCount
    const pageCount = await getPdfPageCount(file);
    
    // 3. Assert: Verify the page count is strictly equal to 7
    expect(pageCount).toBe(7);
  });
});

describe('addWatermark', () => {
  it('should add a watermark and return a valid PDF Blob', async () => {
    // Arrange: Create a mock 1-page PDF
    const file = await createMockPdfFile('watermark-test.pdf', 1);
    
    // Act: Add a custom watermark
    const watermarkedBlob = await addWatermark(file, 'TEST WATERMARK');
    
    // Assert: Verify it executes successfully and returns a Blob
    expect(watermarkedBlob).toBeInstanceOf(Blob);
    expect(watermarkedBlob.type).toBe('application/pdf');
  });
});

describe('addPageNumbers', () => {
  it('should add page numbers and return a valid PDF Blob', async () => {
    // Arrange: Create a mock 2-page PDF
    const file = await createMockPdfFile('page-numbers-test.pdf', 2);
    
    // Act: Add page numbers with center position
    const numberedBlob = await addPageNumbers(file, { position: 'center' });
    
    // Assert: Verify it executes successfully and returns a Blob
    expect(numberedBlob).toBeInstanceOf(Blob);
    expect(numberedBlob.type).toBe('application/pdf');
  });
});

describe('rotatePdf', () => {
  it('should rotate all pages and return a valid PDF Blob', async () => {
    // Arrange: Create a mock 1-page PDF
    const file = await createMockPdfFile('rotate-test.pdf', 1);
    
    // Act: Rotate by 90 degrees
    const rotatedBlob = await rotatePdf(file, 90);
    
    // Assert: Verify it executes successfully and returns a Blob
    expect(rotatedBlob).toBeInstanceOf(Blob);
    expect(rotatedBlob.type).toBe('application/pdf');
  });
});

describe('rotatePdfPerPage', () => {
  it('should rotate specific pages and return a valid PDF Blob', async () => {
    // Arrange: Create a mock 3-page PDF
    const file = await createMockPdfFile('rotate-per-page-test.pdf', 3);
    
    // Act: Apply different rotations per page [90, 0, -90]
    const rotatedBlob = await rotatePdfPerPage(file, [90, 0, -90]);
    
    // Assert: Verify it executes successfully and returns a Blob
    expect(rotatedBlob).toBeInstanceOf(Blob);
    expect(rotatedBlob.type).toBe('application/pdf');
  });
});

describe('lockPdf', () => {
  it('should lock the PDF and return a valid PDF Blob', async () => {
    // Arrange: Create a mock 1-page PDF
    const file = await createMockPdfFile('lock-test.pdf', 1);
    
    // Act: Lock with a password
    const lockedBlob = await lockPdf(file, 'mysecretpassword');
    
    // Assert: Verify it executes successfully and returns a Blob
    expect(lockedBlob).toBeInstanceOf(Blob);
    expect(lockedBlob.type).toBe('application/pdf');
  });

  it('should throw an error if no password is provided', async () => {
    // Arrange: Create a mock 1-page PDF
    const file = await createMockPdfFile('lock-test.pdf', 1);

    // We wrap the call to handle synchronous or asynchronous errors
    const callLockPdf = async (pwd) => {
      return await lockPdf(file, pwd);
    };

    // Test: no password
    await expect(callLockPdf()).rejects.toThrow('A password is required.');
    
    // Test: empty string
    await expect(callLockPdf('')).rejects.toThrow('A password is required.');
  });
});
