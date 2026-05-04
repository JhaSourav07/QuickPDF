import { describe, it, expect, vi, beforeEach } from 'vitest';

const getDefaultConfigMock = vi.fn();

// Mock all the Web3 libraries to prevent infinite background network polling
vi.mock('@rainbow-me/rainbowkit', () => ({
  getDefaultConfig: (args) => {
    getDefaultConfigMock(args);
    return { connectors: [] }; // Return a dummy object so Wagmi doesn't crash
  },
  RainbowKitProvider: ({ children }) => children,
  darkTheme: vi.fn(),
}));

vi.mock('wagmi', () => ({
  WagmiProvider: ({ children }) => children,
  createConfig: vi.fn(),
  http: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// CRITICAL: Mock Reown/AppKit/Web3Modal to stop background network requests!
vi.mock('@reown/appkit/react', () => ({
  createAppKit: vi.fn(),
}));
vi.mock('@web3modal/wagmi/react', () => ({
  createWeb3Modal: vi.fn(),
}));

describe('Web3Provider Fallback', () => {
  beforeEach(() => {
    // Reset modules ensures the dynamic import runs fresh every time
    vi.resetModules(); 
    vi.restoreAllMocks();
  });

  it('should trigger the NSoC Dev Tip warning when no Project ID is provided', async () => {
    // 1. Force the environment variable to be empty so the fallback triggers
    vi.stubEnv('VITE_WALLETCONNECT_PROJECT_ID', '');

    // 2. Hide the console.warn output but spy on it
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 3. Dynamically import the provider to execute top-level logic
    await import('./Web3Provider');

    // 4. Verify the fallback warning was printed to the console
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("NSoC Dev Tip")
    );

    // 5. Verify the fallback ID was properly passed into the RainbowKit config
    const lastCall = getDefaultConfigMock.mock.calls[0][0];
    expect(lastCall.projectId).toBe("3324687d602334057884d59a72179836");

    // 6. Clean up the mocked environment
    vi.unstubAllEnvs();
  });
});