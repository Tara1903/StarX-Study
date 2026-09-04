import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ECE_SUBJECTS } from '@/lib/ece-data';
import { SubjectsListClient } from './subjects-list-client';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch registered subjects if present in DB, merging with base curriculum
  let enrolledSubjects = [...ECE_SUBJECTS];
  try {
    const { data: dbSubjects } = await supabase
      .from('subject_members')
      .select(`
        subject_id,
        subjects:subject_id (
          id,
          name,
          color,
          description
        )
      `)
      .eq('user_id', user.id);

    if (dbSubjects && dbSubjects.length > 0) {
      const dbMapped = dbSubjects
        .map((sm: any) => sm.subjects)
        .filter(Boolean)
        .map((s: any) => ({
          id: s.id,
          code: 'UNISUB',
          name: s.name,
          shortName: s.name.substring(0, 4),
          facultyName: 'Course Faculty',
          facultyAbb: 'CF',
          credits: 4,
          color: s.color || '#3B82F6',
          description: s.description || '',
          room: 'Main Campus',
          icon: 'BookOpen',
          type: 'theory' as const,
        }));

      // Avoid duplicating ids
      const existingIds = new Set(enrolledSubjects.map((s) => s.id));
      dbMapped.forEach((sub) => {
        if (!existingIds.has(sub.id)) {
          enrolledSubjects.push(sub);
        }
      });
    }
  } catch {
    // Falls back to ECE_SUBJECTS
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-8">
      {/* Clean Page Header */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Subjects
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your enrolled subjects
        </p>
      </header>

      {/* Interactive Clean Subjects List */}
      <SubjectsListClient subjects={enrolledSubjects} />
    </div>
  );
}
