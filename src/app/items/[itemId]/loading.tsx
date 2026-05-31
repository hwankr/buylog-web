export default function ItemDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-lg bg-surface-card" />
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
    </div>
  );
}
