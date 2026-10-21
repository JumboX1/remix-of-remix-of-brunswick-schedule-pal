import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SchedulePage from "@/pages/Index";
import { mergeDbCalendar } from "@/lib/schoolCalendar";

const { invoke, select } = vi.hoisted(() => ({ invoke: vi.fn(), select: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke },
    from: () => ({ select: (...args: unknown[]) => { select(...args); return { abortSignal: () => Promise.resolve({ data: [], error: null }) }; } }),
  },
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("brunswick-schedule-data", JSON.stringify({ onboarded: true, classType: "underclassman" }));
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  invoke.mockResolvedValue({ data: { events: [{ date: "2026-10-21", items: ["Chicken"] }] }, error: null });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); localStorage.clear(); mergeDbCalendar([]); });

describe("Lunch-only online school data", () => {
  it("opening Schedule, month calendar, and More does not check online", () => {
    render(<SchedulePage />);
    fireEvent.click(screen.getByRole("button", { name: "Month view" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    fireEvent.click(screen.getByRole("button", { name: "Close month view" }));
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(invoke).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it("requests live menu and calendar only after opening Lunch", async () => {
    render(<SchedulePage />);
    expect(invoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Lunch" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    expect(invoke).toHaveBeenCalledWith("fetch-lunch-menu", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(select).toHaveBeenCalledWith("date, reason, day_type");
    await waitFor(() => expect(localStorage.getItem("brunswick-lunch-cache-v2")).toContain("Chicken"));
  });

  it("offline Lunch with no saved menus makes no online request", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<SchedulePage />);
    fireEvent.click(screen.getByRole("button", { name: "Lunch" }));
    await waitFor(() => expect(screen.getByText("Connect to the internet to view lunch menus.")).toBeInTheDocument());
    expect(invoke).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it("keeps saved menus available offline without fetching", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    localStorage.setItem("brunswick-lunch-cache-v2", JSON.stringify([{ date: "2026-10-21", items: ["Chicken"] }]));
    render(<SchedulePage />);
    fireEvent.click(screen.getByRole("button", { name: "Lunch" }));
    await waitFor(() => expect(screen.getByText("Offline · Showing saved menus")).toBeInTheDocument());
    expect(invoke).not.toHaveBeenCalled();
  });

  it("does not refresh when connectivity returns outside Lunch", () => {
    render(<SchedulePage />);
    window.dispatchEvent(new Event("online"));
    expect(invoke).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });
});