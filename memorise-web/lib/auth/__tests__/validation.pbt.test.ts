/**
 * Property-based tests (PBT-01) for the pure auth validation helpers.
 * Properties P1–P4 from testable-properties.md. Framework: fast-check (seeds printed on failure).
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidPasswordLength,
  normalizeEmail,
} from "@/lib/auth/validation";

// --- Domain generators (PBT-07): construct emails, don't sample raw strings ---
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const ALNUM = LETTERS + "0123456789";
const alnum = (min: number, max: number) =>
  fc.stringOf(fc.constantFrom(...ALNUM.split("")), { minLength: min, maxLength: max });
const letters = (min: number, max: number) =>
  fc.stringOf(fc.constantFrom(...LETTERS.split("")), { minLength: min, maxLength: max });

const validEmail = fc
  .tuple(alnum(1, 12), alnum(1, 12), letters(2, 5))
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

const invalidEmail = fc.oneof(
  alnum(1, 15), // no "@" at all
  fc.tuple(alnum(1, 8), letters(2, 4)).map(([d, t]) => `@${d}.${t}`), // empty local
  fc.tuple(alnum(1, 8), letters(2, 4)).map(([l, t]) => `${l}@.${t}`), // empty domain label
  fc.tuple(alnum(1, 8), alnum(1, 8)).map(([l, d]) => `${l}@${d}`), // no dot in domain
  fc.tuple(alnum(1, 6), alnum(1, 6), letters(2, 4)).map(([l, d, t]) => `${l} x@${d}.${t}`), // whitespace
);

describe("validation — property-based (P1–P4)", () => {
  it("P1: email normalization is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(normalizeEmail(normalizeEmail(s))).toBe(normalizeEmail(s));
      }),
    );
  });

  it("P2: validity is invariant to surrounding whitespace and case", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const padded = `  ${s.toUpperCase()}  `;
        expect(isValidEmail(s)).toBe(isValidEmail(padded));
      }),
    );
  });

  it("P3: well-formed addresses accepted, malformed rejected", () => {
    fc.assert(
      fc.property(validEmail, (e) => {
        expect(isValidEmail(e)).toBe(true);
      }),
    );
    fc.assert(
      fc.property(invalidEmail, (e) => {
        expect(isValidEmail(e)).toBe(false);
      }),
    );
  });

  it("P4: password-length predicate has its boundary exactly at MIN_PASSWORD_LENGTH", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (s) => {
        expect(isValidPasswordLength(s)).toBe(s.length >= MIN_PASSWORD_LENGTH);
      }),
    );
  });
});

describe("validation — example-based boundaries (PBT-10)", () => {
  it("rejects length 7, accepts length 8", () => {
    expect(isValidPasswordLength("1234567")).toBe(false);
    expect(isValidPasswordLength("12345678")).toBe(true);
  });

  it("accepts a normal address and rejects obvious malformations", () => {
    expect(isValidEmail("  User@Example.COM ")).toBe(true);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
});
