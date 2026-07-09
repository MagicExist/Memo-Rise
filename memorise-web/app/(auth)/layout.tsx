/** Centered card layout for the auth screens (U1, US-24: mobile-first, single column). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}
