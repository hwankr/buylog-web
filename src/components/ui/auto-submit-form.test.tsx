import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AutoSubmitForm } from "@/components/ui/auto-submit-form";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AutoSubmitForm", () => {
  it("debounces search input before submitting", () => {
    vi.useFakeTimers();

    render(
      <AutoSubmitForm action="/items" searchDebounceMs={400}>
        <label>
          검색
          <input name="q" type="search" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.input(screen.getByLabelText("검색"), {
      target: { value: "paper" },
    });

    vi.advanceTimersByTime(399);
    expect(replace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(replace).toHaveBeenCalledWith("/items?q=paper", { scroll: false });
  });

  it("submits immediately for select and checkbox changes", () => {
    render(
      <AutoSubmitForm action="/items">
        <label>
          정렬
          <select defaultValue="name" name="sort">
            <option value="name">이름</option>
            <option value="total_spent">누적 지출</option>
          </select>
        </label>
        <label>
          카테고리
          <input name="category" type="checkbox" value="cat-1" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.change(screen.getByLabelText("정렬"), {
      target: { value: "total_spent" },
    });
    expect(replace).toHaveBeenCalledWith("/items?sort=total_spent", {
      scroll: false,
    });

    fireEvent.click(screen.getByLabelText("카테고리"));
    expect(replace).toHaveBeenLastCalledWith(
      "/items?sort=total_spent&category=cat-1",
      { scroll: false },
    );
  });

  it("cancels a pending search submit when another control submits", () => {
    vi.useFakeTimers();

    render(
      <AutoSubmitForm action="/items" searchDebounceMs={400}>
        <label>
          검색
          <input name="q" type="search" />
        </label>
        <label>
          카테고리
          <input name="category" type="checkbox" value="cat-1" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.input(screen.getByLabelText("검색"), {
      target: { value: "paper" },
    });
    vi.advanceTimersByTime(200);

    fireEvent.click(screen.getByLabelText("카테고리"));
    expect(replace).toHaveBeenCalledWith("/items?q=paper&category=cat-1", {
      scroll: false,
    });

    vi.advanceTimersByTime(400);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
