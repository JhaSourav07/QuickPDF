import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradeButton } from './UpgradeButton';

// Mock the PaywallModal so we can test isolation
vi.mock('./PaywallModal', () => ({
  PaywallModal: ({ isOpen, onClose, reason, limitLabel, isPremium }) => (
    isOpen ? (
      <div data-testid="mock-paywall-modal">
        <button onClick={onClose} data-testid="mock-paywall-close">Close</button>
        <span data-testid="mock-reason">{reason}</span>
        <span data-testid="mock-limit">{limitLabel}</span>
        <span data-testid="mock-premium">{isPremium ? 'yes' : 'no'}</span>
      </div>
    ) : null
  )
}));

describe('UpgradeButton', () => {
  it('renders "Connect Wallet to Unlock" when wallet is not connected', () => {
    render(<UpgradeButton isWalletConnected={false} />);
    expect(screen.getByRole('button', { name: /connect wallet to unlock/i })).toBeInTheDocument();
  });

  it('renders "Upgrade to Premium" when wallet is connected', () => {
    render(<UpgradeButton isWalletConnected={true} />);
    expect(screen.getByRole('button', { name: /upgrade to premium/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<UpgradeButton className="my-custom-class" />);
    // The button has a span inside it with the text, but the role="button" applies to the parent
    const button = screen.getByRole('button');
    expect(button).toHaveClass('my-custom-class');
  });

  it('opens PaywallModal when clicked and passes correct props', () => {
    render(
      <UpgradeButton 
        reason="too_large" 
        limitLabel="100MB" 
        isPremium={false} 
      />
    );
    
    // Modal shouldn't be open initially
    expect(screen.queryByTestId('mock-paywall-modal')).not.toBeInTheDocument();
    
    // Click button
    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    
    // Modal should now be open
    expect(screen.getByTestId('mock-paywall-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-reason')).toHaveTextContent('too_large');
    expect(screen.getByTestId('mock-limit')).toHaveTextContent('100MB');
    expect(screen.getByTestId('mock-premium')).toHaveTextContent('no');
  });

  it('closes PaywallModal when onClose is triggered', () => {
    render(<UpgradeButton />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('mock-paywall-modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('mock-paywall-close'));
    expect(screen.queryByTestId('mock-paywall-modal')).not.toBeInTheDocument();
  });
});
