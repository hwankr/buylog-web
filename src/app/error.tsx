"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <section className="w-full max-w-md rounded-lg border border-error/30 bg-surface-card p-6">
        <h1 className="font-display text-3xl text-ink">오류</h1>
        <p className="mt-2 text-sm text-body">{error.message}</p>
        <button
          className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary active:bg-primary-active"
          onClick={() => reset()}
          type="button"
        >
          다시 시도
        </button>
      </section>
    </main>
  );
}
