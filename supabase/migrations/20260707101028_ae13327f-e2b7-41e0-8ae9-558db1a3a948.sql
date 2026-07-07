CREATE TABLE public.builder_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Без названия',
  prompt TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_projects TO anon, authenticated;
GRANT ALL ON public.builder_projects TO service_role;
ALTER TABLE public.builder_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public builder projects readable" ON public.builder_projects FOR SELECT USING (true);
CREATE POLICY "public builder projects insertable" ON public.builder_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "public builder projects deletable" ON public.builder_projects FOR DELETE USING (true);
CREATE INDEX builder_projects_session_idx ON public.builder_projects(session_id, created_at DESC);