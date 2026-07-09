/**
 * Property-based test (PBT-01) for the non-enumeration invariant P5, plus example-based mappings.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ALLOWED_AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";

const email = fc
  .tuple(
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
      minLength: 3,
      maxLength: 12,
    }),
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
      minLength: 2,
      maxLength: 6,
    }),
  )
  .map(([l, d]) => `${l}@${d}.com`);

describe("mapAuthError — property-based (P5 non-enumeration)", () => {
  it("returns a message from the fixed allowed set for ANY raw input", () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.constantFrom("login", "signup", "reset", "generic") as fc.Arbitrary<
          "login" | "signup" | "reset" | "generic"
        >,
        (raw, context) => {
          const out = mapAuthError(raw, context);
          expect(ALLOWED_AUTH_MESSAGES).toContain(out.message);
        },
      ),
    );
  });

  it("never echoes an email embedded in the raw error", () => {
    fc.assert(
      fc.property(email, fc.string(), (addr, extra) => {
        const raw = { message: `Auth failed for ${addr}: ${extra}`, code: "user_not_found" };
        const out = mapAuthError(raw, "login");
        expect(ALLOWED_AUTH_MESSAGES).toContain(out.message);
        expect(out.message).not.toContain(addr);
      }),
    );
  });
});

describe("mapAuthError — example-based code mapping", () => {
  it("maps known Supabase error shapes to the right generic code", () => {
    expect(mapAuthError({ code: "invalid_credentials" }, "login").code).toBe("invalid_credentials");
    expect(mapAuthError({ status: 429 }, "login").code).toBe("rate_limited");
    expect(mapAuthError({ message: "Password is too weak / pwned" }, "signup").code).toBe(
      "weak_password",
    );
    expect(mapAuthError({ code: "otp_expired" }, "reset").code).toBe("reset_link_invalid");
  });

  it("fails closed to a flow-appropriate generic for unknown errors", () => {
    expect(mapAuthError({ code: "totally_unknown" }, "login").code).toBe("invalid_credentials");
    expect(mapAuthError(null, "signup").code).toBe("signup_failed");
    expect(mapAuthError(undefined, "generic").code).toBe("generic");
  });
});
