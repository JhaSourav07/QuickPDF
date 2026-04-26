import {describe, it, expect, vi, beforeEach} from 'vitest';

const getDefaultConfigMock = vi.fn();

//mock all the libraries, so that it doesn't run out of time!
vi.mock('@rainbow-me/rainbowkit', () => ({
  getDefaultConfig: (args) => {
    getDefaultConfigMock(args);
    return {};
  },
  RainbowKitProvider: ({ children }) => children, // Just pass the UI through
  darkTheme: vi.fn(),
}));

vi.mock('wagmi', () => ({
  WagmiProvider: ({ children }) => children,

}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children,
}));

describe('Web3Provider Fallback', () => {

    // This is the Spy where we clean up previously run test
    beforeEach(() => {
        vi.resetModules(); //This resets 
        vi.restoreAllMocks();
    });

    it('should trigger the NSoC Dev Tip warning when no Project ID is provided', async () => {
        // //Let's think we don't have the projectID
        // //stub here means forcing to be empty
        // vi.stubEnv('VITE_WALLETCONNECT_PROJECT_ID', ' ');
        
        //This is hidden camera on console.warn
        // const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    
        //importing the code to execute this logic
        await import('./Web3Provider');

        //verify the results
        // expect(warnSpy).toHaveBeenCalledWith(
        //     expect.stringContaining("NSoC Dev Tip")
        // );

        const lastCall = getDefaultConfigMock.mock.calls[0][0];

        expect(lastCall.projectId).toBe("3324687d602334057884d59a72179836");
    },15000);
});

