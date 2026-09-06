import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  StudyGroupsClient,
  type StudyGroupProgram,
  type StudyGroupSemester,
  type StudyGroupSubject,
} from './study-groups-client';

export const metadata: Metadata = {
  title: 'Study Groups | StarX Study',
  description: 'Navigate your academic program, semester, and subject communication spaces.',
};

export default async function StudyGroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Get user role and university membership
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role, university_id, university:universities(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  const userRole = membership?.role || 'student';
  const universityId = membership?.university_id || '';

  // 2. Fetch subjects according to role
  let rawSubjects: any[] = [];

  if (userRole === 'institute_head' && universityId) {
    // Institute head: see all university subjects
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        color,
        description,
        semester:semesters(
          id,
          name,
          department:departments(id, name, code)
        ),
        teachers:subject_members(
          role,
          profile:profiles(id, full_name)
        )
      `)
      .eq('university_id', universityId)
      .order('name', { ascending: true });

    rawSubjects = allSubjects || [];
  } else {
    // Student or Teacher: see enrolled / assigned subjects
    const { data: myMemberships } = await supabase
      .from('subject_members')
      .select(`
        role,
        subject:subjects!inner(
          id,
          name,
          color,
          description,
          semester:semesters(
            id,
            name,
            department:departments(id, name, code)
          ),
          teachers:subject_members(
            role,
            profile:profiles(id, full_name)
          )
        )
      `)
      .eq('user_id', user.id);

    rawSubjects = (myMemberships || []).map((m: any) => {
      const s = Array.isArray(m.subject) ? m.subject[0] : m.subject;
      return s;
    }).filter(Boolean);
  }

  // 3. Group subjects into Program -> Semester -> Subjects hierarchy
  const programsMap = new Map<string, {
    id: string;
    name: string;
    code?: string;
    semestersMap: Map<string, {
      id: string;
      name: string;
      subjects: StudyGroupSubject[];
    }>;
  }>();

  for (const s of rawSubjects) {
    const sem = Array.isArray(s.semester) ? s.semester[0] : s.semester;
    const dept = sem ? (Array.isArray(sem.department) ? sem.department[0] : sem.department) : null;

    const programId = dept?.id || 'default-program';
    const programName = dept?.name || 'Academic Program';
    const programCode = dept?.code || undefined;

    const semesterId = sem?.id || 'default-semester';
    const semesterName = sem?.name || 'Current Term';

    if (!programsMap.has(programId)) {
      programsMap.set(programId, {
        id: programId,
        name: programName,
        code: programCode,
        semestersMap: new Map(),
      });
    }

    const program = programsMap.get(programId)!;
    if (!program.semestersMap.has(semesterId)) {
      program.semestersMap.set(semesterId, {
        id: semesterId,
        name: semesterName,
        subjects: [],
      });
    }

    const teacherMember = Array.isArray(s.teachers)
      ? s.teachers.find((t: any) => t.role === 'teacher')
      : null;
    const facultyName = teacherMember?.profile?.full_name || 'Course Faculty';
    const facultyAbb = facultyName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 3)
      .toUpperCase() || 'CF';

    const deptCode = dept?.code || 'SUB';

    program.semestersMap.get(semesterId)!.subjects.push({
      id: s.id,
      name: s.name,
      code: `${deptCode}-${s.name.substring(0, 3).toUpperCase()}`,
      color: s.color || '#3B82F6',
      description: s.description || undefined,
      facultyName,
      facultyAbb,
    });
  }

  // Convert to serializable array
  const programs: StudyGroupProgram[] = Array.from(programsMap.values()).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    semesters: Array.from(p.semestersMap.values()).map((sem) => ({
      id: sem.id,
      name: sem.name,
      subjects: sem.subjects.sort((a, b) => a.name.localeCompare(b.name)),
    })),
  }));

  return <StudyGroupsClient programs={programs} userRole={userRole} />;
}
