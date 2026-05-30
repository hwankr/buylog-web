export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-12 w-64 animate-pulse rounded-md bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-md bg-slate-200"
              key={index}
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-md bg-slate-200" />
      </div>
    </main>
  );
}
