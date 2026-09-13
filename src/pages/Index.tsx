import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { DayScheduleView } from "@/components/DayScheduleView";
import { WeekBar } from "@/components/WeekBar";
import { EditScheduleSheet } from "@/components/EditScheduleSheet";
import { LunchMenu } from "@/components/LunchMenu";
import { MorePage } from "@/components/MorePage";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { AlertBanner } from "@/components/AlertBanner";
import { WhatsNextTicker } from "@/components/WhatsNextTicker";
import { BottomTabs, AppTab } from "@/components/BottomTabs";
import { useUserData } from "@/hooks/useUserData";
import { getDaySchedule, getBlocksForDate, getRotationDayNumber, ClassType } from "@/lib/schedule";
import { getSchoolDayInfo, mergeDbCalendar } from "@/lib/schoolCalendar";
import { supabase } from "@/integrations/supabase/client";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("schedule");
  const [calendarRevision, setCalendarRevision] = useState(0);
  const { data, updateBlockName, setClassType, setOnboarded, setBlockLunchOverride, resetAll } = useUserData();

  // Fetch DB calendar overrides on mount
  useEffect(() => {
    supabase
      .from("school_calendar")
      .select("date, reason, day_type")
      .then(({ data: rows, error }) => {
        if (error) {
          console.warn("Live calendar updates are unavailable; using the built-in calendar.", error.message);
          return;
        }
        if (rows && rows.length > 0) {
          mergeDbCalendar(rows);
          setCalendarRevision((revision) => revision + 1);
        }
      });
  }, []);

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const slots = useMemo(
    () => getDaySchedule(selectedDate, data.classType, data.blockLunchOverrides),
    [selectedDate, data.classType, data.blockLunchOverrides, calendarRevision]
  );
  const blocks = useMemo(() => getBlocksForDate(selectedDate), [selectedDate, calendarRevision]);
  const dayNumber = useMemo(() => getRotationDayNumber(selectedDate), [selectedDate, calendarRevision]);

  const navigate = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }, []);

  // Swipe left/right to move one day
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    setTouchStart({ x: t.clientX, y: t.clientY });
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navigate(dx < 0 ? 1 : -1);
        if (navigator.vibrate) navigator.vibrate(8);
      }
      setTouchStart(null);
    },
    [touchStart, navigate]
  );

  // Onboarding: if not yet onboarded, show selection screen
  if (!data.onboarded) {
    return (
      <OnboardingScreen
        onSelect={(type: ClassType) => {
          setClassType(type);
          setOnboarded(true);
        }}
      />
    );
  }

  const schoolInfo = getSchoolDayInfo(selectedDate);
  const today = new Date();
  const isToday = today.toDateString() === selectedDate.toDateString();

  const dayLabel = isWeekend
    ? "Weekend"
    : ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][dayOfWeek];

  const monthDay = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const noSchoolInfo = schoolInfo && schoolInfo.type !== "early_dismissal" && slots.length === 0 ? schoolInfo : null;

  const greeting = noSchoolInfo
    ? noSchoolInfo.reason
    : isToday
    ? "Today"
    : dayLabel;

  const subtitle = noSchoolInfo
    ? monthDay
    : isToday
    ? monthDay
    : `${dayLabel}, ${monthDay}`;

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-background safe-top">
      <div className="h-[env(safe-area-inset-top)]" />

      {activeTab === "schedule" ? (
        <>
          {/* Top Bar */}
          <header className="px-5 pb-1 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl leading-tight truncate">{greeting}</h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground font-sans truncate">
                    {subtitle}
                    {blocks.length > 0 && (
                      <span className="ml-2 text-xs tracking-wider text-muted-foreground/70">
                        {blocks.join(" · ")}
                      </span>
                    )}
                  </p>
                  {dayNumber && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Day {dayNumber}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary transition-colors active:bg-border ml-3"
                aria-label="Edit schedule"
              >
                <Pencil className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </header>

          {/* Week Navigation */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate(-7)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
              >
                <span className="sr-only">Previous week</span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <WeekBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              </div>
              <button
                type="button"
                onClick={() => navigate(7)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
              >
                <span className="sr-only">Next week</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {!isToday && (
              <div className="mt-1.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs font-medium text-accent active:opacity-70"
                >
                  Back to today
                </button>
              </div>
            )}
          </div>

          {/* Alert Banner (snow days, delays) */}
          <AlertBanner />

          {/* What's Next Ticker */}
          <WhatsNextTicker
            slots={slots}
            blockNames={data.blockNames}
            selectedDate={selectedDate}
          />

          {/* Schedule */}
          <main
            className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <DayScheduleView
              slots={slots}
              blockNames={data.blockNames}
              isWeekend={isWeekend}
              selectedDate={selectedDate}
              classType={data.classType}
              blockLunchOverrides={data.blockLunchOverrides}
            />
          </main>
        </>
      ) : activeTab === "lunch" ? (
        <LunchMenu />
      ) : (
        <MorePage
          onOpenEditSchedule={() => setEditOpen(true)}
        />
      )}

      <BottomTabs active={activeTab} onChange={setActiveTab} />

      <EditScheduleSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        data={data}
        onUpdateBlockName={updateBlockName}
        onSetClassType={setClassType}
        onSetBlockLunchOverride={setBlockLunchOverride}
        onReset={resetAll}
      />
    </div>
  );
}
