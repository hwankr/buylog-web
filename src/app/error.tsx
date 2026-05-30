"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-md border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">오류</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <button
          className="mt-5 h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          onClick={reset}
          type="button"
        >
          다시 시도
        </button>
      </section>
    </main>
  );
}
