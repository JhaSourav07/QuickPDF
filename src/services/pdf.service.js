import {PDFDocument} from 'pdf-lib';

export const mergePdfs = async (files) => {
    if(!files || files.length === 0) {
        throw new Error('No files provided for merging.');
    }

    // created new PDFDocument
    const mergedPdf = await PDFDocument.create();

    for(const file of files) {
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
    const blob = new Blob([pdfBytes], {type: 'application/pdf'});
    return blob;
}