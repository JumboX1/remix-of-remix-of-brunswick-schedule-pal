
-- Drop the overly permissive policy
DROP POLICY "Service role can manage calendar" ON public.school_calendar;

-- No INSERT/UPDATE/DELETE policies for anon/authenticated - only service_role (bypasses RLS) can write
