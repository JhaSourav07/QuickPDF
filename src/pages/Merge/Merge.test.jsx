import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Merge } from './Merge';
import { useFileStore } from '../../hooks/useFileStore';
import { useSubscription } from '../../hooks/useSubscription';
import { mergePdfs } from '../../services/pdf.service';
import { FREE_LIMITS } from '../../config/limits';

// Mock hooks
vi.mock('../../hooks/useFileStore', () => ({
  useFileStore: vi.fn(),
}));

vi.mock('../../hooks/useSubscription', () => ({
  useSubscription: vi.fn(),
}));

// Mock services
vi.mock('../../services/pdf.service', () => ({
  mergePdfs: vi.fn(),
}));

// Mock components
vi.mock('../../components/pdf/Dropzone', () => ({
  Dropzone: ({ onFilesSelected }) => (
    <div data-testid="mock-dropzone">
      <button onClick={() => onFilesSelected([
        new File(['dummy'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['dummy'], 'test2.pdf', { type: 'application/pdf' })
      ])}>
        Mock Add Files
      </button>
    </div>
  )
}));

// Mock PaywallModal to prevent rainbowkit issues in DOM
vi.mock('../../components/ui/PaywallModal', () => ({
  PaywallModal: () => <div data-testid="mock-paywall-modal" />
}));

// Mock pdfjsLib to avoid canvas issues in jsdom
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      getPage: vi.fn(() => Promise.resolve({
        getViewport: vi.fn(() => ({ width: 100, height: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() }))
      })),
      numPages: 1
    })
  }))
}));

// Mock HTMLCanvasElement.toDataURL for pdf rendering fallback
HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock');

describe('Merge Page', () => {
  let mockSetItems;

  beforeEach(() => {
    vi.clearAllMocks();
    
    window.URL.createObjectURL = vi.fn(() => 'mock-url');
    window.URL.revokeObjectURL = vi.fn();
    
    mockSetItems = vi.fn();
    useFileStore.mockReturnValue([[], mockSetItems]);
    
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: false,
      incrementUsage: vi.fn(),
      isWalletConnected: false
    });
  });

  it('renders dropzone initially when no files', () => {
    render(<Merge />);
    expect(screen.getByTestId('mock-dropzone')).toBeInTheDocument();
  });

  it('shows files and disables merge if less than 2 files', () => {
    useFileStore.mockReturnValue([
      [{ id: 1, file: new File([''], 'file1.pdf', { type: 'application/pdf' }), name: 'file1.pdf', size: 100, thumb: null }],
      mockSetItems
    ]);
    
    render(<Merge />);
    
    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Add at least 2 PDFs to merge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Merge & Download/i })).toBeDisabled();
  });

  it('enables merge when 2 or more files exist and handles merge click', async () => {
    const file1 = new File([''], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File([''], 'file2.pdf', { type: 'application/pdf' });
    const mockIncrement = vi.fn();
    
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: false,
      incrementUsage: mockIncrement,
      isWalletConnected: false
    });
    
    useFileStore.mockReturnValue([
      [
        { id: 1, file: file1, name: 'file1.pdf', size: 100, thumb: null },
        { id: 2, file: file2, name: 'file2.pdf', size: 100, thumb: null }
      ],
      mockSetItems
    ]);
    
    mergePdfs.mockResolvedValueOnce(new Blob(['merged content'], { type: 'application/pdf' }));
    
    render(<Merge />);
    
    const mergeBtn = screen.getByRole('button', { name: /Merge & Download/i });
    expect(mergeBtn).not.toBeDisabled();
    
    // Test merging
    fireEvent.click(mergeBtn);
    
    expect(mergePdfs).toHaveBeenCalledWith([file1, file2]);
    
    await waitFor(() => {
      expect(screen.getByText('Downloaded!')).toBeInTheDocument();
    });
    
    expect(mockIncrement).toHaveBeenCalled();
  });

  it('shows UpgradeButton if free limits are exceeded', () => {
    const max = FREE_LIMITS.merge.maxFiles;
    // Generate enough files to exceed the standard limit
    const files = Array.from({ length: max + 1 }).map((_, i) => ({
      id: i, file: new File([''], `file${i}.pdf`, { type: 'application/pdf' }), name: `file${i}.pdf`, size: 100
    }));
    
    useFileStore.mockReturnValue([files, mockSetItems]);
    
    render(<Merge />);
    
    // The UpgradeButton should be rendered instead of the Merge button
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Merge & Download/i })).not.toBeInTheDocument();
  });

  it('shows UpgradeButton if global request limit is exceeded', () => {
    useFileStore.mockReturnValue([
      [
        { id: 1, file: new File([''], 'file1.pdf', { type: 'application/pdf' }), name: 'file1.pdf', size: 100, thumb: null },
        { id: 2, file: new File([''], 'file2.pdf', { type: 'application/pdf' }), name: 'file2.pdf', size: 100, thumb: null }
      ],
      mockSetItems
    ]);
    
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: true,
      incrementUsage: vi.fn(),
      isWalletConnected: false
    });
    
    render(<Merge />);
    
    // The UpgradeButton should be rendered instead of the Merge button due to global limit
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Merge & Download/i })).not.toBeInTheDocument();
  });
});
