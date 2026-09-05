import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PeopleClient, PersonItem } from './people-client';

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Verify user is institute_head
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role, university_id, university:universities(name)')
    .eq('user_id', user.id)
    .eq('role', 'institute_head')
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const universityId = membership.university_id;
  const rawUni = membership.university as any;
  const universityName = (Array.isArray(rawUni) ? rawUni[0]?.name : rawUni?.name) || 'Academic Institution';

  let teachers: PersonItem[] = [];
  let students: PersonItem[] = [];
  let availableSubjects: { id: string; name: string }[] = [];

  try {
    // 2. Fetch all members of this university
    const { data: members } = await supabase
      .from('university_memberships')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profile:profiles(id, full_name, email, avatar_url)
      `)
      .eq('university_id', universityId);

    // 3. Fetch all subjects of this university
    const { data: dbSubjects } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('university_id', universityId)
      .order('name', { ascending: true });

    availableSubjects = (dbSubjects || []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));

    const subjectIds = availableSubjects.map((s) => s.id);

    // 4. Fetch subject memberships for courses in this university
    let subjectMemberships: any[] = [];
    if (subjectIds.length > 0) {
      const { data: smData } = await supabase
        .from('subject_members')
        .select(`
          user_id,
          role,
          subject:subjects(id, name)
        `)
        .in('subject_id', subjectIds);

      subjectMemberships = smData || [];
    }

    // Map user_id to their subjects
    const userSubjectMap = new Map<string, { id: string; name: string }[]>();
    subjectMemberships.forEach((sm: any) => {
      if (!sm.user_id || !sm.subject) return;
      const cur = userSubjectMap.get(sm.user_id) || [];
      cur.push({ id: sm.subject.id, name: sm.subject.name });
      userSubjectMap.set(sm.user_id, cur);
    });

    // Partition members into teachers and students
    (members || []).forEach((m: any) => {
      const p = m.profile;
      const item: PersonItem = {
        id: m.user_id,
        membershipId: m.id,
        name: p?.full_name || 'User',
        email: p?.email || '',
        avatarUrl: p?.avatar_url,
        role: m.role,
        subjects: userSubjectMap.get(m.user_id) || [],
        joinedAt: m.joined_at,
      };

      if (m.role === 'teacher') {
        teachers.push(item);
      } else if (m.role === 'student') {
        students.push(item);
      }
    });
  } catch (err) {
    console.error('Error fetching people:', err);
  }

  return (
    <PeopleClient
      universityId={universityId}
      universityName={universityName}
      teachers={teachers}
      students={students}
      availableSubjects={availableSubjects}
    />
  );
}
