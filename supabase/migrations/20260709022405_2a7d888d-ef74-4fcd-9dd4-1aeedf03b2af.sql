-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop old anon-only builder_projects & recreate scoped to user
DROP TABLE IF EXISTS public.builder_projects CASCADE;

CREATE TABLE public.builder_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Новый проект',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_projects TO authenticated;
GRANT ALL ON public.builder_projects TO service_role;
ALTER TABLE public.builder_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects owner all" ON public.builder_projects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER builder_projects_updated_at BEFORE UPDATE ON public.builder_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Files per project (multi-file React/Vite project storage)
CREATE TABLE public.builder_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_files TO authenticated;
GRANT ALL ON public.builder_files TO service_role;
ALTER TABLE public.builder_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files owner all" ON public.builder_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE INDEX builder_files_project_idx ON public.builder_files(project_id);
CREATE TRIGGER builder_files_updated_at BEFORE UPDATE ON public.builder_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chat messages per project (with plan/thinking/code parts as JSON)
CREATE TABLE public.builder_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL DEFAULT '',
  plan text,
  thinking text,
  files_changed jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_messages TO authenticated;
GRANT ALL ON public.builder_messages TO service_role;
ALTER TABLE public.builder_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages owner all" ON public.builder_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE INDEX builder_messages_project_idx ON public.builder_messages(project_id, created_at);