import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PaywallModal } from './PaywallModal';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useCheckout, CHECKOUT_STAGE } from '../../hooks/useCheckout';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';

// Mock dependencies
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button data-testid="mock-connect">Connect Wallet Mock</button>
}));

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}));

vi.mock('../../hooks/useCheckout', () => ({
  useCheckout: vi.fn(),
  CHECKOUT_STAGE: {
    IDLE: 'IDLE',
    SIGNING: 'SIGNING',
    CONFIRMING: 'CONFIRMING',
    WRITING_DB: 'WRITING_DB',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
  }
}));

vi.mock('../../hooks/useCryptoPrices', () => ({
  useCryptoPrices: vi.fn(),
}));

describe('PaywallModal', () => {
  const mockClose = vi.fn();
  const defaultCheckout = { stage: 'IDLE', txHash: null, error: null, executePayment: vi.fn(), reset: vi.fn() };
  const defaultPrices = { 
    eth: { amount: '0.001', wei: 1000n }, 
    matic: { amount: '5.5', wei: 1000n },
    usdc: { amount: '5.00', wei: 1000n },
    isError: false 
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAccount.mockReturnValue({ isConnected: false });
    useChainId.mockReturnValue(1);
    useSwitchChain.mockReturnValue({ switchChainAsync: vi.fn() });
    useCheckout.mockReturnValue(defaultCheckout);
    useCryptoPrices.mockReturnValue(defaultPrices);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render anything when isOpen is false', () => {
    render(<PaywallModal isOpen={false} onClose={mockClose} />);
    expect(screen.queryByText(/File Exceeds Free Limit/i)).not.toBeInTheDocument();
  });

  it('prompts to connect wallet if disconnected and shows size limit copy', () => {
    useAccount.mockReturnValue({ isConnected: false });
    render(<PaywallModal isOpen={true} onClose={mockClose} reason="size" limitLabel="10 MB" />);
    
    expect(screen.getByText('File Exceeds Free Limit')).toBeInTheDocument();
    expect(screen.getByText(/10 MB/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-connect')).toBeInTheDocument();
  });

  it('prompts to connect wallet and shows actions limit copy', () => {
    useAccount.mockReturnValue({ isConnected: false });
    render(<PaywallModal isOpen={true} onClose={mockClose} reason="actions" />);
    
    expect(screen.getByText('Free Actions Exhausted')).toBeInTheDocument();
    expect(screen.getByText(/used all 15 free actions/)).toBeInTheDocument();
  });

  it('shows token selection when wallet is connected', () => {
    useAccount.mockReturnValue({ isConnected: true });
    render(<PaywallModal isOpen={true} onClose={mockClose} />);
    
    expect(screen.queryByTestId('mock-connect')).not.toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    
    // Check initial button state
    expect(screen.getByRole('button', { name: /Select a payment method/i })).toBeDisabled();
  });

  it('selects a token and enables payment button', () => {
    useAccount.mockReturnValue({ isConnected: true });
    render(<PaywallModal isOpen={true} onClose={mockClose} />);
    
    // The "ETH" button contains the ETH symbol text
    // There are two "ETH" texts (one in TokenIcon, one in span), both are in the button
    const ethOption = screen.getAllByText('ETH')[0].closest('button');
    fireEvent.click(ethOption);
    
    expect(screen.getByText(/~0.001 ETH/)).toBeInTheDocument();
    
    const payBtn = screen.getByRole('button', { name: /Pay \$5 in ETH/i });
    expect(payBtn).not.toBeDisabled();
  });

  it('shows processing UI when stage is SIGNING', () => {
    useCheckout.mockReturnValue({ ...defaultCheckout, stage: 'SIGNING' });
    render(<PaywallModal isOpen={true} onClose={mockClose} />);
    
    expect(screen.getByText('Awaiting Wallet Signature…')).toBeInTheDocument();
    expect(screen.getByText('Approve the transaction in your wallet.')).toBeInTheDocument();
  });

  it('shows success UI and auto-closes when stage is SUCCESS', () => {
    vi.useFakeTimers();
    useCheckout.mockReturnValue({ ...defaultCheckout, stage: 'SUCCESS' });
    
    render(<PaywallModal isOpen={true} onClose={mockClose} />);
    
    expect(screen.getByText('Lifetime Access Unlocked!')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    
    expect(mockClose).toHaveBeenCalled();
  });
});
