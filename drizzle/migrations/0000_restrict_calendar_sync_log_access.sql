DROP POLICY IF EXISTS "Sync log is publicly readable" ON public.calendar_sync_log;
REVOKE ALL PRIVILEGES ON TABLE public.calendar_sync_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.calendar_sync_log TO service_role;
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.calendar_sync_log IS 'Private operational calendar synchronization log. Access restricted to trusted service operations.';