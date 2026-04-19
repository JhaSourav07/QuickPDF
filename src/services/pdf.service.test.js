import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs, splitPdf } from './pdf.service.js';

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
