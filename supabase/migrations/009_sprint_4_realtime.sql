-- Enable real-time for Sprint 4 tables

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.activity_log;
