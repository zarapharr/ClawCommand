import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../../components/ui/progress-bar";

describe("ProgressBar Component", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeTruthy();
    expect(progressBar.getAttribute("aria-valuenow")).toBe("50");
    expect(progressBar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("displays label when provided", () => {
    render(<ProgressBar value={50} label="CPU Usage" />);
    expect(screen.getByText("CPU Usage")).toBeTruthy();
  });

  it("displays percentage when showPercent is true", () => {
    render(<ProgressBar value={65} showPercent />);
    expect(screen.getByText("65%")).toBeTruthy();
  });

  it("applies correct color class", () => {
    const { container } = render(<ProgressBar value={50} color="success" />);
    const bar = container.querySelector(".bg-success-500");
    expect(bar !== null).toBe(true);
  });

  it("respects max value", () => {
    render(<ProgressBar value={75} max={150} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.getAttribute("aria-valuemax")).toBe("150");
  });

  it("caps percentage at 100", () => {
    render(<ProgressBar value={150} max={100} showPercent />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("has correct size classes", () => {
    const { container: lgContainer } = render(<ProgressBar value={50} size="lg" />);
    expect(lgContainer.querySelector(".h-3") !== null).toBe(true);

    const { container: smContainer } = render(<ProgressBar value={50} size="sm" />);
    expect(smContainer.querySelector(".h-1") !== null).toBe(true);
  });
});
