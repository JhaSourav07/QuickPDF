import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Organize } from './Organize';
import { useFileStore } from '../../hooks/useFileStore';
import { useSubscription } from '../../hooks/useSubscription';
import { organizePdf } from '../../services/pdf.service';
import { mbToBytes, FREE_LIMITS } from '../../config/limits';

// Mock hooks
vi.mock('../../hooks/useFileStore', () => ({
  useFileStore: vi.fn(),
}));

vi.mock('../../hooks/useSubscription', () => ({
  useSubscription: vi.fn(),
}));

// Mock services
vi.mock('../../services/pdf.service', () => ({
  getPdfThumbnails: vi.fn(),
  organizePdf: vi.fn(),
}));

// Mock Dropzone
vi.mock('../../components/pdf/Dropzone', () => ({
  Dropzone: ({ onFilesSelected }) => (
    <div data-testid="mock-dropzone">
      <button onClick={() => onFilesSelected([new File([''], 'test.pdf', { type: 'application/pdf' })])}>
        Mock Add File
      </button>
    </div>
  )
}));

// Mock PaywallModal
vi.mock('../../components/ui/PaywallModal', () => ({
  PaywallModal: () => <div data-testid="mock-paywall-modal" />
}));

describe('Organize Page', () => {
  let mockSetFile;
  let mockSetThumbnails;
  let mockIncrement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    window.URL.createObjectURL = vi.fn(() => 'mock-url');
    window.URL.revokeObjectURL = vi.fn();
    
    mockSetFile = vi.fn();
    mockSetThumbnails = vi.fn();
    
    // Organize uses two stores
    useFileStore.mockImplementation((key) => {
      if (key === 'Organize_file') return [null, mockSetFile];
      if (key === 'Organize_thumbnails') return [[], mockSetThumbnails];
      return [null, vi.fn()];
    });
    
    mockIncrement = vi.fn();
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: false,
      incrementUsage: mockIncrement,
      isWalletConnected: false
    });
  });

  it('renders dropzone initially', () => {
    render(<Organize />);
    expect(screen.getByTestId('mock-dropzone')).toBeInTheDocument();
  });

  it('loads valid pdf, renders thumbnails, and handles download', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    
    const mockThumbnails = [
      { id: 1, originalIndex: 0, url: 'data:image/jpeg;base64,1' },
      { id: 2, originalIndex: 1, url: 'data:image/jpeg;base64,2' }
    ];
    
    useFileStore.mockImplementation((key) => {
      if (key === 'Organize_file') return [file, mockSetFile];
      if (key === 'Organize_thumbnails') return [mockThumbnails, mockSetThumbnails];
      return [null, vi.fn()];
    });
    
    render(<Organize />);
    
    // Wait for the thumbnails to show
    await waitFor(() => {
      // The component renders the page numbers (index + 1)
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    const downloadBtn = screen.getByRole('button', { name: /Download Organized PDF/i });
    expect(downloadBtn).not.toBeDisabled();
    
    organizePdf.mockResolvedValueOnce(new Blob(['organized'], { type: 'application/pdf' }));
    
    fireEvent.click(downloadBtn);
    
    expect(organizePdf).toHaveBeenCalledWith(file, [0, 1]);
    
    await waitFor(() => {
      expect(mockIncrement).toHaveBeenCalled();
    });
  });

  it('shows UpgradeButton if free size limit is exceeded', () => {
    const file = new File([''], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: mbToBytes(FREE_LIMITS.organize.maxFileSizeMb) + 1 });
    
    useFileStore.mockImplementation((key) => {
      if (key === 'Organize_file') return [file, mockSetFile];
      if (key === 'Organize_thumbnails') return [[{ id: 1, originalIndex: 0, url: '' }], mockSetThumbnails];
      return [null, vi.fn()];
    });
    
    render(<Organize />);
    
    expect(screen.getByText(/exceeds.*free limit/i)).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
  });
});
