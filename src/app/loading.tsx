export default function Loading() {
  return (
    <main className="min-h-screen bg-canvas p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-surface-card" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-lg bg-surface-card"
              key={index}
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
      </div>
    </main>
  );
}
