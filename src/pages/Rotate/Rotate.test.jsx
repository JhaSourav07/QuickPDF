import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Rotate } from './Rotate';
import { useFileStore } from '../../hooks/useFileStore';
import { useSubscription } from '../../hooks/useSubscription';
import { rotatePdfPerPage } from '../../services/pdf.service';
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
  rotatePdfPerPage: vi.fn(),
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

// Mock pdfjsLib to avoid canvas issues in jsdom
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn(() => Promise.resolve({
        getViewport: vi.fn(() => ({ width: 100, height: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  }))
}));

// Mock HTMLCanvasElement.toDataURL for pdf rendering fallback
HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock');

describe('Rotate Page', () => {
  let mockSetFile;
  let mockIncrement;

  beforeAll(() => {
    // Mock IntersectionObserver
    window.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

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
    render(<Rotate />);
    expect(screen.getByTestId('mock-dropzone')).toBeInTheDocument();
  });

  it('loads valid pdf, renders pages, and handles individual rotation', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(8)) });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    render(<Rotate />);
    
    // Wait for pages to be rendered (pdfjs getDocument mocked to return 2 pages)
    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
    
    // Initially Download button should be disabled because no rotation applied
    const downloadBtn = screen.getByRole('button', { name: /Apply & Download/i });
    expect(downloadBtn).toBeDisabled();
    
    // The first +90 button is "All +90", the second is Page 1's +90, the third is Page 2's +90
    const rotateRightBtns = screen.getAllByRole('button', { name: /\+90°/i });
    
    // Rotate Page 1 by +90
    fireEvent.click(rotateRightBtns[1]);
    
    await waitFor(() => {
      expect(screen.getByText('1 page(s) rotated')).toBeInTheDocument();
      expect(downloadBtn).not.toBeDisabled();
    });
    
    rotatePdfPerPage.mockResolvedValueOnce(new Blob(['rotated'], { type: 'application/pdf' }));
    
    // Download
    fireEvent.click(downloadBtn);
    
    // verify the rotations mapping array passed to service: [90, 0]
    expect(rotatePdfPerPage).toHaveBeenCalledWith(file, [90, 0]);
    
    await waitFor(() => {
      expect(mockIncrement).toHaveBeenCalled();
      expect(screen.getByText('Downloaded!')).toBeInTheDocument();
    });
  });

  it('handles rotate all functionality', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(8)) });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    render(<Rotate />);
    
    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
    
    // Click "All -90" (the first −90 button)
    const rotateLeftBtns = screen.getAllByRole('button', { name: /−90°/i });
    fireEvent.click(rotateLeftBtns[0]);
    
    await waitFor(() => {
      expect(screen.getByText('2 page(s) rotated')).toBeInTheDocument();
    });
    
    const downloadBtn = screen.getByRole('button', { name: /Apply & Download/i });
    rotatePdfPerPage.mockResolvedValueOnce(new Blob(['rotated'], { type: 'application/pdf' }));
    
    fireEvent.click(downloadBtn);
    
    // verify the rotations mapping array passed to service: [-90 % 360 = 270 or -90]
    // Note JS modulo for negative numbers keeps the sign, so it might pass -90.
    expect(rotatePdfPerPage).toHaveBeenCalledWith(file, [-90, -90]);
  });

  it('shows UpgradeButton if free size limit is exceeded', () => {
    const file = new File([''], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: mbToBytes(FREE_LIMITS.rotate.maxFileSizeMb) + 1 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    render(<Rotate />);
    
    // "File exceeds X MB free limit."
    expect(screen.getByText(/File exceeds.*free limit/i)).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
  });
  
  it('shows UpgradeButton if global limit is reached', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    useFileStore.mockReturnValue([file, mockSetFile]);
    
    useSubscription.mockReturnValue({
      isPremium: false,
      hasReachedGlobalLimit: true,
      incrementUsage: mockIncrement,
      isWalletConnected: false
    });
    
    render(<Rotate />);
    
    expect(screen.getByText('Free limit reached.')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet to Unlock')).toBeInTheDocument();
  });
});
