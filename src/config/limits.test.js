import { describe, it, expect } from 'vitest';
import { mbToBytes, FREE_LIMITS } from './limits';

describe('limits config', () => {
  describe('mbToBytes', () => {
    it('correctly converts megabytes to bytes', () => {
      expect(mbToBytes(1)).toBe(1048576); // 1 * 1024 * 1024
      expect(mbToBytes(0)).toBe(0);
      expect(mbToBytes(2.5)).toBe(2621440);
    });

    it('handles negative values', () => {
      expect(mbToBytes(-1)).toBe(-1048576);
    });
  });

  describe('FREE_LIMITS', () => {
    it('defines global requests limit', () => {
      expect(FREE_LIMITS).toHaveProperty('globalRequests');
      expect(typeof FREE_LIMITS.globalRequests).toBe('number');
    });

    it('defines expected tool limits', () => {
      expect(FREE_LIMITS.merge).toHaveProperty('maxFiles');
      expect(FREE_LIMITS.split).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.watermark).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.imageToPdf).toHaveProperty('maxFiles');
      expect(FREE_LIMITS.compress).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.rotate).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.organize).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.pdfToImage).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.grayscale).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.pageNumbers).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.lockPdf).toHaveProperty('maxFileSizeMb');
      expect(FREE_LIMITS.editPdf).toHaveProperty('maxFileSizeMb');
    });
  });
});
