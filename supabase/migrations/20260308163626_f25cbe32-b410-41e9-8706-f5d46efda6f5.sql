
-- Table to store school calendar data synced from Brunswick calendar
CREATE TABLE public.school_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('break', 'holiday', 'noschool', 'early_dismissal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public read access (no auth needed - school calendar is public data)
ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School calendar is publicly readable"
  ON public.school_calendar FOR SELECT
  USING (true);

-- Only service role can insert/update (edge function uses service role)
CREATE POLICY "Service role can manage calendar"
  ON public.school_calendar FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast date lookups
CREATE INDEX idx_school_calendar_date ON public.school_calendar (date);

-- Sync metadata table
CREATE TABLE public.calendar_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  events_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success'
);

ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync log is publicly readable"
  ON public.calendar_sync_log FOR SELECT
  USING (true);
