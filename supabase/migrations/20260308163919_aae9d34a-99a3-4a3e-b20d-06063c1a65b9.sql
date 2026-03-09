
-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule sync-calendar to run daily at 4 AM ET (9 AM UTC)
SELECT cron.schedule(
  'sync-brunswick-calendar',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ckqmpjiwrtdhndgoxard.supabase.co/functions/v1/sync-calendar',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcW1waml3cnRkaG5kZ294YXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODM0OTcsImV4cCI6MjA4ODU1OTQ5N30.HZsd5EoGR1I3rK1O4hduqiX3gDCJv2oJ1k1ip9wYc6k"}'::jsonb,
      body := '{"source": "cron"}'::jsonb
    ) AS request_id;
  $$
);
