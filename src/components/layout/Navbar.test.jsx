import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";
import { vi } from "vitest";

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x1234567890abcdef",
    isConnected: true,
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
}));

vi.mock("../../hooks/useSubscription", () => ({
  useSubscription: () => ({
    isPremium: false,
  }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: () => <button>Connect</button>,
}));

test("opens Edit dropdown", () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByText("Edit"));

  expect(screen.getByText("Merge")).toBeInTheDocument();
});