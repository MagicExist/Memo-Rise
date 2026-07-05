import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import Home from "./page";

describe("Home", () => {
  it("renders the title and tagline", () => {
    render(<Home />);
    expect(screen.getByTestId("home-title")).toHaveTextContent("MemoRise");
    expect(screen.getByTestId("home-tagline")).toBeInTheDocument();
  });
});

describe("ApiError (property-based)", () => {
  // Property: an ApiError always preserves the status code it was constructed with.
  it("preserves any status code", () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 599 }), (status) => {
        const err = new ApiError(status, "x");
        expect(err.status).toBe(status);
        expect(err.name).toBe("ApiError");
      }),
    );
  });
});
