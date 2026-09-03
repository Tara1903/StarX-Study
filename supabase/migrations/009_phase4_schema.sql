-- ============================================
-- PHASE 4: FLEXIBLE ACADEMIC STRUCTURE
-- ============================================
-- This migration drops the old university model and introduces the new institution model.

-- Drop old tables
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.moderation_logs CASCADE;
DROP TABLE IF EXISTS public.moderation_profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.announcement_reads CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.message_read_cursors CASCADE;
DROP TABLE IF EXISTS public.message_attachments CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.subject_members CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.institutes CASCADE;
DROP TABLE IF EXISTS public.university_memberships CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;

-- Also Drop old types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.announcement_target_type CASCADE;

-- Create New Enums
CREATE TYPE public.user_role AS ENUM ('institute_head', 'teacher', 'student');

-- New Schema
CREATE TABLE public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'university', 'college', 'school'
    settings JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.provisioning_tokens (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.institution_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.user_role NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(institution_id, user_id, role)
);

CREATE TABLE public.teacher_profiles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    designation TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(institution_id, name)
);

CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(institution_id, name)
);

CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(department_id, name)
);

CREATE TABLE public.academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(program_id, name)
);

CREATE TABLE public.academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE(institution_id, name)
);

CREATE TABLE public.academic_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(academic_level_id, name)
);

CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE NOT NULL,
    academic_group_id UUID REFERENCES public.academic_groups(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(academic_term_id, name)
);

CREATE TABLE public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE CASCADE,
    academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    academic_group_id UUID REFERENCES public.academic_groups(id) ON DELETE CASCADE,
    UNIQUE(user_id, academic_term_id)
);

CREATE TABLE public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, subject_id)
);

-- Basic announcements table for Phase 6
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    target_campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    target_department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    target_program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    target_academic_group_id UUID REFERENCES public.academic_groups(id) ON DELETE CASCADE,
    target_subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CHECK (
        (target_institution_id IS NOT NULL)::INTEGER +
        (target_campus_id IS NOT NULL)::INTEGER +
        (target_department_id IS NOT NULL)::INTEGER +
        (target_program_id IS NOT NULL)::INTEGER +
        (target_academic_group_id IS NOT NULL)::INTEGER +
        (target_subject_id IS NOT NULL)::INTEGER = 1
    )
);
