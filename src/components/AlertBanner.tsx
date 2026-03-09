import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSchoolDayInfo, mergeDbCalendar } from "@/lib/schoolCalendar";

interface AlertInfo {
  reason: string;
  type: string;
}

export function AlertBanner() {
  const [alert, setAlert] = useState<AlertInfo | null>(null);

  useEffect(() => {
    // Check for today and tomorrow alerts
    checkAlerts();

    // Re-check every 5 minutes for live updates (covers 4 AM rule etc.)
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkAlerts() {
    // Refresh DB calendar data
    const { data: rows } = await supabase
      .from("school_calendar")
      .select("date, reason, day_type");

    if (rows && rows.length > 0) {
      mergeDbCalendar(rows);
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInfo = getSchoolDayInfo(today);
    const tomorrowInfo = getSchoolDayInfo(tomorrow);

    // Show alert for cancellations, delays
    if (todayInfo && (todayInfo.type === "holiday" || todayInfo.type === "noschool")) {
      // Check if it's a snow day / delay type keyword
      const r = todayInfo.reason.toLowerCase();
      if (r.includes("snow") || r.includes("delay") || r.includes("cancel") || r.includes("closed") || r.includes("weather")) {
        setAlert({ reason: todayInfo.reason, type: "today" });
        return;
      }
    }

    // Also check tomorrow for advance warning
    if (tomorrowInfo && tomorrowInfo.type !== "early_dismissal") {
      const r = tomorrowInfo.reason.toLowerCase();
      if (r.includes("snow") || r.includes("delay") || r.includes("cancel") || r.includes("closed") || r.includes("weather")) {
        setAlert({ reason: `Tomorrow: ${tomorrowInfo.reason}`, type: "tomorrow" });
        return;
      }
    }

    setAlert(null);
  }

  if (!alert) return null;

  return (
    <div className="mx-5 mb-2 flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3">
      <span className="text-lg">🌨️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive truncate">{alert.reason}</p>
        <p className="text-[11px] text-destructive/70">Check school communications for details</p>
      </div>
    </div>
  );
}
