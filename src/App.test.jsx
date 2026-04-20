import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock third-party and global components
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="mock-analytics" />
}));

vi.mock('./components/layout/Navbar', () => ({
  Navbar: () => <nav data-testid="mock-navbar" />
}));

vi.mock('./components/ui/AnimatedBackground', () => ({
  AnimatedBackground: () => <div data-testid="mock-animated-bg" />
}));

vi.mock('./components/ui/FeedbackWidget', () => ({
  FeedbackWidget: () => <div data-testid="mock-feedback-widget" />
}));

// Mock page components to isolate routing logic
vi.mock('./pages/Home/Home', () => ({ Home: () => <div data-testid="page-home" /> }));
vi.mock('./pages/Merge/Merge', () => ({ Merge: () => <div data-testid="page-merge" /> }));
vi.mock('./pages/Split/Split', () => ({ Split: () => <div data-testid="page-split" /> }));
vi.mock('./pages/Watermark/Watermark', () => ({ Watermark: () => <div data-testid="page-watermark" /> }));
vi.mock('./pages/ImageToPdf/ImageToPdf', () => ({ ImageToPdf: () => <div data-testid="page-image-to-pdf" /> }));
vi.mock('./pages/Compress/Compress', () => ({ Compress: () => <div data-testid="page-compress" /> }));
vi.mock('./pages/Rotate/Rotate', () => ({ Rotate: () => <div data-testid="page-rotate" /> }));
vi.mock('./pages/Organize/Organize', () => ({ Organize: () => <div data-testid="page-organize" /> }));
vi.mock('./pages/PDFtoImage/PDFtoImage', () => ({ PdfToImage: () => <div data-testid="page-pdf-to-image" /> }));
vi.mock('./pages/Grayscale/Grayscale', () => ({ Grayscale: () => <div data-testid="page-grayscale" /> }));
vi.mock('./pages/PageNumbers/PageNumbers', () => ({ PageNumbers: () => <div data-testid="page-page-numbers" /> }));
vi.mock('./pages/LockPdf/LockPdf', () => ({ LockPdf: () => <div data-testid="page-lock-pdf" /> }));
vi.mock('./pages/EditPdf/EditPdf', () => ({ EditPdf: () => <div data-testid="page-edit-pdf" /> }));
vi.mock('./pages/Admin/Admin', () => ({ Admin: () => <div data-testid="page-admin" /> }));

describe('App Routing', () => {
  it('renders global layout components on all routes', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-animated-bg')).toBeInTheDocument();
    expect(screen.getByTestId('mock-feedback-widget')).toBeInTheDocument();
    expect(screen.getByTestId('mock-analytics')).toBeInTheDocument();
  });

  const routes = [
    { path: '/', testId: 'page-home' },
    { path: '/merge', testId: 'page-merge' },
    { path: '/split', testId: 'page-split' },
    { path: '/watermark', testId: 'page-watermark' },
    { path: '/image-to-pdf', testId: 'page-image-to-pdf' },
    { path: '/compress', testId: 'page-compress' },
    { path: '/rotate', testId: 'page-rotate' },
    { path: '/organize', testId: 'page-organize' },
    { path: '/pdf-to-image', testId: 'page-pdf-to-image' },
    { path: '/grayscale', testId: 'page-grayscale' },
    { path: '/page-numbers', testId: 'page-page-numbers' },
    { path: '/lock-pdf', testId: 'page-lock-pdf' },
    { path: '/edit-pdf', testId: 'page-edit-pdf' },
    { path: '/admin', testId: 'page-admin' },
  ];

  routes.forEach(({ path, testId }) => {
    it(`routes to correct component for ${path}`, () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });
});
