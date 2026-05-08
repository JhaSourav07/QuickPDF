import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPdf } from "./EditPdf";
import { applyEdits } from "../../services/pdf.service";

vi.mock("../../hooks/useSubscription", () => ({
  useSubscription: () => ({
    isPremium: true,
    isWalletConnected: false,
    hasReachedGlobalLimit: false,
    incrementUsage: vi.fn(),
  }),
}));

vi.mock("../../services/pdf.service", () => ({
  applyEdits: vi.fn(async () => new Blob(["pdf"], { type: "application/pdf" })),
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
      set textBaseline(_) {},
    }));
  });

  it("shows the add-text tool and lets users place a new text box annotation", () => {
    const { container } = render(<EditPdf />);

    const textTool = screen.getByLabelText("Add Text Box");
    expect(textTool).toBeInTheDocument();
    expect(textTool).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(textTool);
    expect(textTool).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/this adds a new text box/i)).toBeInTheDocument();
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    fireEvent.click(canvas, { clientX: 80, clientY: 120 });

    const textbox = container.querySelector("textarea");
    expect(textbox).not.toBeNull();

    fireEvent.change(textbox, { target: { value: "Hello PDF" } });
    fireEvent.keyDown(textbox, { key: "Enter" });

    expect(container.querySelector("textarea")).toBeNull();
    expect(screen.getByText("1 edit")).toBeInTheDocument();
  });

  it("saves a placed text box through annotation export", async () => {
    const { container } = render(<EditPdf />);

    fireEvent.click(screen.getByLabelText("Add Text Box"));
    fireEvent.click(container.querySelector("canvas"), { clientX: 80, clientY: 120 });

    const textbox = container.querySelector("textarea");
    fireEvent.change(textbox, { target: { value: "Hello PDF" } });
    fireEvent.keyDown(textbox, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: /save pdf/i }));

    expect(applyEdits).toHaveBeenCalledWith(
      expect.any(File),
      [
        expect.objectContaining({
          type: "text",
          text: "Hello PDF",
          pageIndex: 0,
          y: expect.any(Number),
        }),
      ],
      expect.any(Array),
    );
  });

  it("commits a new text box when the field loses focus", () => {
    const { container } = render(<EditPdf />);

    fireEvent.click(screen.getByLabelText("Add Text Box"));
    fireEvent.click(container.querySelector("canvas"), { clientX: 120, clientY: 160 });

    const textbox = container.querySelector("textarea");
    fireEvent.change(textbox, { target: { value: "Blur save" } });
    fireEvent.blur(textbox, { target: { value: "Blur save" } });

    expect(container.querySelector("textarea")).toBeNull();
    expect(screen.getByText("1 edit")).toBeInTheDocument();
  });

  it("lets users drag a placed text annotation to adjust its position", () => {
    const { container } = render(<EditPdf />);

    fireEvent.click(screen.getByLabelText("Add Text Box"));
    fireEvent.click(container.querySelector("canvas"), { clientX: 120, clientY: 160 });

    const textbox = container.querySelector("textarea");
    fireEvent.change(textbox, { target: { value: "Move me" } });
    fireEvent.keyDown(textbox, { key: "Enter" });

    const placedText = screen.getByText("Move me");
    fireEvent.mouseDown(placedText, { clientX: 126, clientY: 164 });
    fireEvent.mouseMove(container.querySelector("canvas"), { clientX: 180, clientY: 210 });
    fireEvent.mouseUp(container.querySelector("canvas"), { clientX: 180, clientY: 210 });
    fireEvent.click(screen.getByRole("button", { name: /save pdf/i }));

    expect(applyEdits).toHaveBeenCalledWith(
      expect.any(File),
      [
        expect.objectContaining({
          type: "text",
          text: "Move me",
          x: expect.any(Number),
          y: expect.any(Number),
        }),
      ],
      expect.any(Array),
    );

    const movedAnnotation = applyEdits.mock.calls.at(-1)[1][0];
    expect(movedAnnotation.x).toBeGreaterThan(120);
    expect(movedAnnotation.y).toBeGreaterThan(160);
  });
});
