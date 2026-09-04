import type { AvatarType } from '@/types';

export interface ResolvedSubject {
  id: string; // The URL slug or DB id
  uuid: string; // Deterministic RFC4122 UUID for DB / message queries
  name: string;
  shortName: string;
  code: string;
  facultyName: string;
  facultyAbb: string;
  credits: number;
  color: string;
  description: string;
  room: string;
  academicContext: string;
  universityName: string;
  departmentName: string;
  semesterInfo: string;
  type: 'theory' | 'lab' | 'hybrid';
  icon: string;
}

export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function getSubjectUuid(idOrSlug: string): string {
  return idOrSlug;
}

export async function resolveSubject(
  idOrSlug: string,
  supabase?: any
): Promise<ResolvedSubject | null> {
  if (!idOrSlug) return null;

  if (supabase) {
    try {
      let query = supabase
        .from('subjects')
        .select(`
          id,
          name,
          color,
          icon,
          description,
          university:universities(id, name),
          semester:semesters(
            id,
            name,
            department:departments(
              id,
              name,
              code,
              institute:institutes(id, name)
            )
          ),
          subject_members(
            role,
            profile:profiles(id, full_name)
          )
        `);

      if (isUuid(idOrSlug)) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.ilike('name', idOrSlug.replace(/[-_]/g, ' '));
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const teacherMember = Array.isArray(data.subject_members)
          ? data.subject_members.find((sm: any) => sm.role === 'teacher')
          : null;
        const facultyName = teacherMember?.profile?.full_name || 'Course Faculty';
        const facultyAbb = facultyName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 3)
          .toUpperCase() || 'CF';

        const deptName = data.semester?.department?.name || 'Academic Department';
        const semName = data.semester?.name || 'Current Semester';
        const uniName = data.university?.name || 'University';

        return {
          id: data.id,
          uuid: data.id,
          name: data.name,
          shortName: data.name.substring(0, 4).toUpperCase(),
          code: data.semester?.department?.code
            ? `${data.semester.department.code}-${data.name.substring(0, 3).toUpperCase()}`
            : data.id.substring(0, 8).toUpperCase(),
          facultyName,
          facultyAbb,
          credits: 4,
          color: data.color || '#3B82F6',
          description: data.description || `${data.name} academic course.`,
          room: 'Room No. 03',
          academicContext: `${deptName} • ${semName}`,
          universityName: uniName,
          departmentName: deptName,
          semesterInfo: semName,
          type: 'theory',
          icon: data.icon || 'BookOpen',
        };
      }
    } catch {
      // Supabase lookup error
    }
  }

  return null;
}
