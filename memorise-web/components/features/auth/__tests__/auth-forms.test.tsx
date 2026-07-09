/**
 * Example-based tests for the U1 auth forms (US-01..03, Flow 1–4). Supabase and the Next router are
 * mocked — we assert the orchestration + non-enumerating error behavior, not Supabase itself
 * (delegated I/O; no PBT per testable-properties.md). Executed in Build & Test.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ALLOWED_AUTH_MESSAGES } from "@/lib/auth/errors";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));

import { LoginForm } from "@/components/features/auth/LoginForm";
import { LogoutButton } from "@/components/features/auth/LogoutButton";
import { ResetConfirmForm } from "@/components/features/auth/ResetConfirmForm";
import { ResetRequestForm } from "@/components/features/auth/ResetRequestForm";
import { SignupForm } from "@/components/features/auth/SignupForm";

beforeEach(() => {
  vi.clearAllMocks();
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
});

function type(testId: string, value: string) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

describe("LoginForm", () => {
  it("signs in and redirects on success", async () => {
    render(<LoginForm />);
    type("login-email-input", " User@Example.com ");
    type("login-password-input", "hunter2pass");
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => expect(auth.signInWithPassword).toHaveBeenCalledOnce());
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "User@Example.com",
      password: "hunter2pass",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("shows a generic error and does not redirect when Supabase rejects", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "user not found: a@b.com" },
    });
    render(<LoginForm />);
    type("login-email-input", "a@b.com");
    type("login-password-input", "whatever1");
    fireEvent.click(screen.getByTestId("login-submit-button"));

    const err = await screen.findByTestId("login-error");
    expect(ALLOWED_AUTH_MESSAGES).toContain(err.textContent);
    expect(err.textContent).not.toContain("a@b.com");
    expect(replace).not.toHaveBeenCalled();
  });

  it("rejects a malformed email before any network call", () => {
    render(<LoginForm />);
    type("login-email-input", "not-an-email");
    type("login-password-input", "whatever1");
    fireEvent.click(screen.getByTestId("login-submit-button"));

    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(screen.getByTestId("login-error")).toBeInTheDocument();
  });
});

describe("SignupForm", () => {
  it("signs up and redirects immediately on success (non-blocking verification)", async () => {
    render(<SignupForm />);
    type("signup-email-input", "new@example.com");
    type("signup-password-input", "longenough1");
    fireEvent.click(screen.getByTestId("signup-submit-button"));

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledOnce());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("blocks a too-short password before any network call", () => {
    render(<SignupForm />);
    type("signup-email-input", "new@example.com");
    type("signup-password-input", "short");
    fireEvent.click(screen.getByTestId("signup-submit-button"));

    expect(auth.signUp).not.toHaveBeenCalled();
    expect(screen.getByTestId("signup-error")).toBeInTheDocument();
  });
});

describe("ResetRequestForm", () => {
  it("shows the same confirmation whether or not the email is well-formed (no enumeration)", async () => {
    const { unmount } = render(<ResetRequestForm />);
    type("reset-email-input", "real@example.com");
    fireEvent.click(screen.getByTestId("reset-request-submit-button"));
    await screen.findByTestId("reset-request-confirmation");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledOnce();
    unmount();

    render(<ResetRequestForm />);
    type("reset-email-input", "not-an-email");
    fireEvent.click(screen.getByTestId("reset-request-submit-button"));
    await screen.findByTestId("reset-request-confirmation");
    // Malformed address → no network call, but identical confirmation is still shown.
    expect(auth.resetPasswordForEmail).toHaveBeenCalledOnce();
  });
});

describe("ResetConfirmForm", () => {
  it("updates the password and confirms on success", async () => {
    render(<ResetConfirmForm />);
    type("reset-new-password-input", "brandnew123");
    fireEvent.click(screen.getByTestId("reset-confirm-submit-button"));

    await screen.findByTestId("reset-confirm-done");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "brandnew123" });
  });

  it("shows a generic error on an expired/invalid link", async () => {
    auth.updateUser.mockResolvedValue({ error: { code: "otp_expired", message: "expired" } });
    render(<ResetConfirmForm />);
    type("reset-new-password-input", "brandnew123");
    fireEvent.click(screen.getByTestId("reset-confirm-submit-button"));

    const err = await screen.findByTestId("reset-confirm-error");
    expect(ALLOWED_AUTH_MESSAGES).toContain(err.textContent);
  });
});

describe("LogoutButton", () => {
  it("signs out locally and returns to /login", async () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByTestId("logout-button"));

    await waitFor(() => expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
