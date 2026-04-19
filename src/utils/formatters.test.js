import { describe, it, expect } from 'vitest';
import { formatFileSize } from './formatters';

describe('formatFileSize', () => {
  it('correctly formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('correctly formats kilobytes (KB)', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('correctly formats megabytes (MB)', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(2621440)).toBe('2.5 MB');
  });

  it('correctly formats gigabytes (GB)', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(1610612736)).toBe('1.5 GB');
  });

  it('handles 0 bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('handles negative bytes gracefully', () => {
    expect(formatFileSize(-1024)).toBe('0 Bytes');
  });

  it('handles invalid inputs gracefully', () => {
    expect(formatFileSize(null)).toBe('0 Bytes');
    expect(formatFileSize(undefined)).toBe('0 Bytes');
    expect(formatFileSize(NaN)).toBe('0 Bytes');
    expect(formatFileSize('1024')).toBe('0 Bytes'); // Strings should not be processed
  });
});
