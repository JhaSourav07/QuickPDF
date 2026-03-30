export const mbToBytes = (mb) => mb * 1024 * 1024;

export const FREE_LIMITS = {
  globalRequests: 50,

  merge:      { maxFiles: 30 },
  split:      { maxFileSizeMb: 100 },
  watermark:  { maxFileSizeMb: 100 },
  imageToPdf: { maxFiles: 50 },
  compress:   { maxFileSizeMb: 200 },
  rotate:     { maxFileSizeMb: 100 },
  organize:   { maxFileSizeMb: 100 },
  pdfToImage: { maxFileSizeMb: 100 },
  grayscale:  { maxFileSizeMb: 100 },
  pageNumbers: { maxFileSizeMb: 100 },
};
