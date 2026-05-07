import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Framer-motion: render children without animation overhead
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag) => {
      const Component = ({ children, ...rest }) => {
        const validProps = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !['initial','animate','transition','whileInView','viewport','variants'].includes(k))
        );
        return React.createElement(tag, validProps, children);
      };
      Component.displayName = `motion.${tag}`;
      return Component;
    },
  }),
}));

// Default hook state — overridden per test
const mockHookState = { count: null, loading: true, error: false };

vi.mock('../../../hooks/useVisitorCount', () => ({
  useVisitorCount: () => mockHookState,
}));

import { VisitorBadge } from './VisitorBadge';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VisitorBadge', () => {
  beforeEach(() => {
    // Reset to loading state before each test
    mockHookState.count = null;
    mockHookState.loading = true;
    mockHookState.error = false;
  });

  it('renders the "people used QuickPDF" label at all times', () => {
    render(<VisitorBadge />);
    expect(screen.getByText(/people used quickpdf/i)).toBeTruthy();
  });

  it('shows the loading placeholder while Firestore is pending', () => {
    mockHookState.loading = true;
    render(<VisitorBadge />);
    // The "· · ·" placeholder text should be present
    expect(screen.getByText('· · ·')).toBeTruthy();
  });

  it('shows "unavailable" when there is a Firestore error', () => {
    mockHookState.loading = false;
    mockHookState.error = true;
    render(<VisitorBadge />);
    expect(screen.getByText(/unavailable/i)).toBeTruthy();
  });

  it('renders individual digit reels for each digit when count is loaded', () => {
    mockHookState.loading = false;
    mockHookState.error = false;
    mockHookState.count = 42;

    render(<VisitorBadge />);

    // OdometerDisplay renders each 0-9 strip for every digit position.
    // For count=42 (2 digits), every digit 0-9 appears in each reel.
    // We just verify the component doesn't crash and renders something numeric.
    const digits = screen.getAllByText('4');
    expect(digits.length).toBeGreaterThan(0);
  });

  it('does not show loading placeholder once count is available', () => {
    mockHookState.loading = false;
    mockHookState.count = 7;
    render(<VisitorBadge />);
    expect(screen.queryByText('· · ·')).toBeNull();
  });

  it('does not show error message when count is successfully loaded', () => {
    mockHookState.loading = false;
    mockHookState.count = 100;
    render(<VisitorBadge />);
    expect(screen.queryByText(/unavailable/i)).toBeNull();
  });

  it('renders a comma separator for counts >= 1000', () => {
    mockHookState.loading = false;
    mockHookState.count = 1247;
    render(<VisitorBadge />);
    // The comma character is rendered as a static span in OdometerDisplay
    expect(screen.getByText(',')).toBeTruthy();
  });

  it('does not render a comma for counts below 1000', () => {
    mockHookState.loading = false;
    mockHookState.count = 999;
    render(<VisitorBadge />);
    expect(screen.queryByText(',')).toBeNull();
  });
});
