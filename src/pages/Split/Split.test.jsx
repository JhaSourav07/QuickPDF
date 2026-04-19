import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Split } from './Split';
import { useFileStore } from '../../hooks/useFileStore';
import { useSubscription } from '../../hooks/useSubscription';
import { splitPdf, getPdfPageCount } from '../../services/pdf.service';
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
  splitPdf: vi.fn(),
  getPdfPageCount: vi.fn(),
}));

// Mock components
vi.mock('../../components/pdf/Dropzone', () => ({
  Dropzone: ({ onFilesSelected }) => (
    <div data-testid="mock-dropzone">
      <button onClick={() => onFilesSelected([new File(['dummy'], 'test.pdf', { type: 'application/pdf' })])}>
        Mock Add File
      </button>
      <button onClick={() => onFilesSelected([new File(['dummy'], 'test.txt', { type: 'text/plain' })])}>
        Mock Add Invalid
      </button>
    </div>
  )
}));

vi.mock('../../components/ui/PaywallModal', () => ({
  PaywallModal: () => <div data-testid="mock-paywall-modal" />
}));

describe('Split Page', () => {
  let mockSetFile;
  let mockIncrement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    window.URL.createObjectURL = vi.fn(() => 'mock-url');
    window.URL.revokeObjectURL = vi.fn();
    
    mockSetFile = vi.fn();
    useFileStore.mockReturnValue([null, mockSetFile]);
    
    mockIncrement = vi.fn();
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: false,
      incrementUsage: mockIncrement,
      isWalletConnected: false
    });
  });

  it('renders dropzone initially', () => {
    render(<Split />);
    expect(screen.getByTestId('mock-dropzone')).toBeInTheDocument();
  });

  it('shows error for non-pdf file', async () => {
    render(<Split />);
    
    fireEvent.click(screen.getByText('Mock Add Invalid'));
    
    await waitFor(() => {
      expect(screen.getByText('Please upload a valid PDF file.')).toBeInTheDocument();
    });
  });

  it('loads valid pdf and handles mockSetFile', async () => {
    getPdfPageCount.mockResolvedValueOnce(5);
    
    render(<Split />);
    
    fireEvent.click(screen.getByText('Mock Add File'));
    
    await waitFor(() => {
      expect(getPdfPageCount).toHaveBeenCalled();
      expect(mockSetFile).toHaveBeenCalled();
    });
  });

  it('displays split UI when file is present in store', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    render(<Split />);
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Extract Pages/i)).toBeInTheDocument();
    
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBe(2);
  });

  it('shows UpgradeButton if free limits are exceeded', () => {
    const file = new File([''], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: mbToBytes(FREE_LIMITS.split.maxFileSizeMb) + 1 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    render(<Split />);
    
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Extract Pages/i })).not.toBeInTheDocument();
  });

  it('handles splitting logic and downloads the file', async () => {
    getPdfPageCount.mockResolvedValueOnce(5);
    const { rerender } = render(<Split />);
    
    fireEvent.click(screen.getByText('Mock Add File'));
    
    // Wait for the async file loading to finish
    await waitFor(() => {
      expect(mockSetFile).toHaveBeenCalled();
    });

    // Mock store returning the file with proper state
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    splitPdf.mockResolvedValueOnce(new Blob(['split content'], { type: 'application/pdf' }));
    
    rerender(<Split />);
    
    // Wait for the processing state to end and the button to be enabled
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Extract Pages/i });
      expect(btn).not.toBeDisabled();
    });
    
    const splitBtn = screen.getByRole('button', { name: /Extract Pages/i });
    fireEvent.click(splitBtn);
    
    expect(splitPdf).toHaveBeenCalledWith(file, 1, 5); // Default range is 1 to count
    
    await waitFor(() => {
      expect(mockIncrement).toHaveBeenCalled();
    });
  });

  it('shows error if split service throws an error', async () => {
    getPdfPageCount.mockResolvedValueOnce(5);
    const { rerender } = render(<Split />);
    
    fireEvent.click(screen.getByText('Mock Add File'));
    await waitFor(() => {
      expect(mockSetFile).toHaveBeenCalled();
    });

    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    splitPdf.mockRejectedValueOnce(new Error('Corrupted PDF'));
    
    rerender(<Split />);
    
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Extract Pages/i });
      expect(btn).not.toBeDisabled();
    });
    
    const splitBtn = screen.getByRole('button', { name: /Extract Pages/i });
    fireEvent.click(splitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Corrupted PDF')).toBeInTheDocument();
    });
  });
});
