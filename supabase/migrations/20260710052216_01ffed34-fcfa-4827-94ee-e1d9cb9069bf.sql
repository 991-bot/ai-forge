
ALTER TABLE public.builder_projects ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.builder_projects ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.builder_projects ADD COLUMN IF NOT EXISTS html TEXT;
ALTER TABLE public.builder_projects ALTER COLUMN user_id DROP NOT NULL;
DROP POLICY IF EXISTS "public builder projects readable" ON public.builder_projects;
DROP POLICY IF EXISTS "public builder projects insertable" ON public.builder_projects;
DROP POLICY IF EXISTS "public builder projects deletable" ON public.builder_projects;
CREATE POLICY "public builder projects readable" ON public.builder_projects FOR SELECT USING (true);
CREATE POLICY "public builder projects insertable" ON public.builder_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "public builder projects deletable" ON public.builder_projects FOR DELETE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_projects TO anon, authenticated;
CREATE INDEX IF NOT EXISTS builder_projects_session_idx ON public.builder_projects(session_id, created_at DESC);
