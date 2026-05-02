import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPdf } from "./EditPdf";

vi.mock("../../hooks/useSubscription", () => ({
  useSubscription: () => ({
    isPremium: true,
    isWalletConnected: false,
    hasReachedGlobalLimit: false,
    incrementUsage: vi.fn(),
  }),
}));

vi.mock("../../services/pdf.service", () => ({
  applyEdits: vi.fn(),
  editPdfText: vi.fn(),
}));

vi.mock("../../components/pdf/Dropzone", () => ({
  Dropzone: () => <div data-testid="dropzone" />,
}));

vi.mock("pdfjs-dist", () => ({}));

vi.mock("../../hooks/useFileStore", async () => {
  const ReactModule = await import("react");

  const initialState = {
    EditPdf_file: new File(["pdf"], "sample.pdf", { type: "application/pdf" }),
    EditPdf_pages: [
      { imageData: "data:image/png;base64,abc", width: 320, height: 480, pdfWidth: 320, pdfHeight: 480 },
    ],
    EditPdf_textItems: [],
    EditPdf_annotations: [],
    EditPdf_textEdits: {},
  };

  return {
    useFileStore: (key, fallback) => {
      const [value, setValue] = ReactModule.useState(
        Object.prototype.hasOwnProperty.call(initialState, key) ? initialState[key] : fallback
      );
      const clearValue = () => setValue(fallback);
      return [value, setValue, clearValue];
    },
  };
});

describe("EditPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      set strokeStyle(_) {},
      set fillStyle(_) {},
      set lineWidth(_) {},
      set lineCap(_) {},
      set lineJoin(_) {},
      set globalAlpha(_) {},
      set font(_) {},
    }));
  });

  it("shows the annotation tools including text and lets users place a text box", () => {
    const { container } = render(<EditPdf />);

    const textTool = screen.getByLabelText("Text");
    expect(textTool).toBeInTheDocument();
    expect(textTool).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(textTool);
    expect(textTool).toHaveAttribute("aria-pressed", "true");
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    fireEvent.mouseDown(canvas, { clientX: 80, clientY: 120 });

    const textbox = container.querySelector("textarea");
    expect(textbox).not.toBeNull();

    fireEvent.change(textbox, { target: { value: "Hello PDF" } });
    fireEvent.keyDown(textbox, { key: "Enter" });

    expect(container.querySelector("textarea")).toBeNull();
    expect(screen.getByText("1 edit")).toBeInTheDocument();
  });
});
