import { cn } from "@/lib/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-5 items-center justify-center text-ink",
        className,
      )}
    >
      <span className="absolute h-[2px] w-5 rounded-full bg-current" />
      <span className="absolute h-[2px] w-5 rotate-90 rounded-full bg-current" />
      <span className="absolute h-[2px] w-4 rotate-45 rounded-full bg-current" />
      <span className="absolute h-[2px] w-4 -rotate-45 rounded-full bg-current" />
    </span>
  );
}
