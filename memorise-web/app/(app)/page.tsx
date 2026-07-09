import { LogoutButton } from "@/components/features/auth/LogoutButton";

/**
 * Minimal authenticated landing (U1, Q6). A deliberate placeholder — the U5 dashboard replaces it.
 * Confirms the account gate works end-to-end and provides logout.
 */
export default function AppHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 data-testid="authed-placeholder-title" className="text-2xl font-bold">
        You&apos;re signed in
      </h1>
      <p data-testid="authed-placeholder-tagline" className="text-gray-600">
        Your MemoRise dashboard will appear here soon.
      </p>
      <LogoutButton />
    </main>
  );
}
