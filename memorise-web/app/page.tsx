export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 data-testid="home-title" className="text-3xl font-bold">
        MemoRise
      </h1>
      <p data-testid="home-tagline" className="text-gray-600">
        Learn anything, and actually remember it.
      </p>
    </main>
  );
}
