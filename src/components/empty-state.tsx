type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
      {message}
    </div>
  );
}
