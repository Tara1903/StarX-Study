-- 004_flagship_signup.sql
-- Implements extended academic structures and provisioning tokens for the flagship signup flow

-- 1. Extend universities with configuration flags for "Smart Skipping"
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_type') THEN
    CREATE TYPE institution_type AS ENUM ('university', 'college', 'school');
  END IF;
END $$;

ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS institution_type institution_type DEFAULT 'university',
ADD COLUMN IF NOT EXISTS has_campuses BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_departments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_programs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS uses_semesters BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS uses_years BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_classes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_sections BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_batches BOOLEAN DEFAULT false;

-- 2. Create hierarchical tables
CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Year 1", "Class 10"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Semester 1"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Section A", "Batch B"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create profile & enrollment tables
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- 4. Create Provisioning Tokens for Institute Heads
CREATE TABLE IF NOT EXISTS public.provisioning_tokens (
  token TEXT PRIMARY KEY,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS Policies
-- Enable RLS
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_tokens ENABLE ROW LEVEL SECURITY;

-- Read policies (Universities/Campuses/Programs/Levels/Semesters/Sections are visible to everyone or authenticated users)
CREATE POLICY "Public read access for campuses" ON public.campuses FOR SELECT USING (true);
CREATE POLICY "Public read access for programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Public read access for academic_levels" ON public.academic_levels FOR SELECT USING (true);
CREATE POLICY "Public read access for semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Public read access for sections" ON public.sections FOR SELECT USING (true);

-- Manage policies (Institute Heads can manage structure)
CREATE POLICY "Institute heads can manage campuses" ON public.campuses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.university_memberships WHERE user_id = auth.uid() AND university_id = campuses.university_id AND role = 'institute_head')
);
CREATE POLICY "Institute heads can manage programs" ON public.programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.university_memberships WHERE user_id = auth.uid() AND university_id = programs.university_id AND role = 'institute_head')
);
CREATE POLICY "Institute heads can manage academic_levels" ON public.academic_levels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.university_memberships WHERE user_id = auth.uid() AND university_id = academic_levels.university_id AND role = 'institute_head')
);
CREATE POLICY "Institute heads can manage semesters" ON public.semesters FOR ALL USING (
  EXISTS (SELECT 1 FROM public.university_memberships WHERE user_id = auth.uid() AND university_id = semesters.university_id AND role = 'institute_head')
);
CREATE POLICY "Institute heads can manage sections" ON public.sections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.university_memberships WHERE user_id = auth.uid() AND university_id = sections.university_id AND role = 'institute_head')
);

-- Enrollments/Teacher Profiles read access
CREATE POLICY "Users can read own student enrollments" ON public.student_enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Institute heads can read all enrollments in their univ" ON public.student_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.university_memberships m WHERE m.user_id = auth.uid() AND m.university_id = student_enrollments.university_id AND m.role = 'institute_head')
);

CREATE POLICY "Users can read own teacher profile" ON public.teacher_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Institute heads can read all teacher profiles in their univ" ON public.teacher_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.university_memberships m WHERE m.user_id = auth.uid() AND m.university_id = teacher_profiles.university_id AND m.role = 'institute_head')
);

-- Provisioning tokens can be managed by system (or super admin). Institute heads shouldn't see all tokens unless they generated them.
-- Since they are server-side checked, RLS can just block client access.
CREATE POLICY "Nobody can view provisioning tokens directly from client" ON public.provisioning_tokens FOR SELECT USING (false);
CREATE POLICY "Nobody can modify provisioning tokens directly from client" ON public.provisioning_tokens FOR ALL USING (false);
