import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../components/StatusBadge";

describe("StatusBadge", () => {
  it("renders human-readable text for each due status", () => {
    const { rerender } = render(<StatusBadge status="OVERDUE" />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();

    rerender(<StatusBadge status="DUE_SOON" />);
    expect(screen.getByText("Due soon")).toBeInTheDocument();

    rerender(<StatusBadge status="ON_TRACK" />);
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it("applies the status as a CSS class for color-coding", () => {
    render(<StatusBadge status="OVERDUE" />);
    expect(screen.getByText("Overdue")).toHaveClass("badge", "OVERDUE");
  });
});
