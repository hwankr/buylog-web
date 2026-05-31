"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

type AutoSubmitFormProps = {
  action: string;
  children: ReactNode;
  className?: string;
  searchDebounceMs?: number;
};

function hrefForForm(action: string, form: HTMLFormElement) {
  const params = new URLSearchParams();
  const formData = new FormData(form);

  for (const [name, rawValue] of formData.entries()) {
    if (typeof rawValue !== "string") continue;

    const value = rawValue.trim();
    if (!name || !value) continue;

    params.append(name, value);
  }

  const query = params.toString();
  return query ? `${action}?${query}` : action;
}

function isSubmittableControl(
  target: EventTarget,
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function isSearchInput(target: EventTarget): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === "search";
}

export function AutoSubmitForm({
  action,
  children,
  className,
  searchDebounceMs = 450,
}: AutoSubmitFormProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingSubmit = useCallback(() => {
    if (!timeoutRef.current) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const submitForm = useCallback(
    (form: HTMLFormElement, delayMs = 0) => {
      clearPendingSubmit();

      if (delayMs > 0) {
        timeoutRef.current = setTimeout(() => {
          router.replace(hrefForForm(action, form), { scroll: false });
          timeoutRef.current = null;
        }, delayMs);
        return;
      }

      router.replace(hrefForForm(action, form), { scroll: false });
    },
    [action, clearPendingSubmit, router],
  );

  const handleInput = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!isSearchInput(event.target)) return;

      submitForm(event.currentTarget, searchDebounceMs);
    },
    [searchDebounceMs, submitForm],
  );

  const handleChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!isSubmittableControl(event.target) || isSearchInput(event.target)) {
        return;
      }

      submitForm(event.currentTarget);
    },
    [submitForm],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitForm(event.currentTarget);
    },
    [submitForm],
  );

  useEffect(() => clearPendingSubmit, [clearPendingSubmit]);

  return (
    <form
      action={action}
      className={className}
      onChange={handleChange}
      onInput={handleInput}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}
