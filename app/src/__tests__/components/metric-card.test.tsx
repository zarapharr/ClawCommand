import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../../components/ui/metric-card";

describe("MetricCard Component", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Active Agents" value="12" />);
    expect(screen.getByText("Active Agents")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("displays unit when provided", () => {
    render(<MetricCard title="Budget" value="50000" unit="USD" />);
    expect(screen.getByText("USD")).toBeTruthy();
  });

  it("shows trend with positive value", () => {
    render(<MetricCard title="Growth" value="100" trend={15} trendLabel="vs last month" />);
    expect(screen.getByText(/\+15%/)).toBeTruthy();
    expect(screen.getByText("vs last month")).toBeTruthy();
  });

  it("shows trend with negative value", () => {
    render(<MetricCard title="Errors" value="5" trend={-20} trendLabel="vs last day" />);
    expect(screen.getByText(/-20%/)).toBeTruthy();
  });

  it("applies correct color border", () => {
    const { container } = render(
      <MetricCard title="Success" value="100" color="success" />
    );
    expect(container.querySelector(".border-success-500")).toBeTruthy();
  });

  it("renders in horizontal layout", () => {
    const { container } = render(
      <MetricCard title="Metric" value="42" layout="horizontal" />
    );
    expect(container.querySelector(".flex-row")).toBeTruthy();
  });

  it("includes icon when provided", () => {
    render(<MetricCard title="Agents" value="10" icon="⚙️" />);
    expect(screen.getByText("⚙️")).toBeTruthy();
  });
});
