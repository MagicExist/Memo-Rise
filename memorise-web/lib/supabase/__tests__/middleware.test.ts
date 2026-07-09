// @vitest-environment node
/**
 * Tests for the U1 route gate (layer 1). The Supabase client is mocked — we assert the redirect
 * decision and public-route exemptions, not Supabase itself (delegated I/O, no PBT — see
 * testable-properties.md).
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockUser: { id: string } | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
  }),
}));

import { isPublicPath, updateSession } from "@/lib/supabase/middleware";

beforeEach(() => {
  mockUser = null;
});

describe("isPublicPath", () => {
  it.each([
    ["/login", true],
    ["/signup", true],
    ["/reset", true],
    ["/reset/confirm", true],
    ["/", false],
    ["/dashboard", false],
    ["/decks/123", false],
  ])("%s -> %s", (path, expected) => {
    expect(isPublicPath(path)).toBe(expected);
  });
});

describe("updateSession route gate", () => {
  it("redirects unauthenticated requests on protected routes to /login, preserving target", async () => {
    mockUser = null;
    const res = await updateSession(new NextRequest("http://localhost/decks/42"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("redirectTo=%2Fdecks%2F42");
  });

  it("does not redirect unauthenticated requests on public routes", async () => {
    mockUser = null;
    const res = await updateSession(new NextRequest("http://localhost/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not redirect authenticated requests on protected routes", async () => {
    mockUser = { id: "user-1" };
    const res = await updateSession(new NextRequest("http://localhost/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
