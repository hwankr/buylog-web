type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-hairline bg-surface-soft px-4 py-8 text-sm text-muted">
      {message}
    </div>
  );
}
