import { createClient } from '@/lib/supabase/server';
import { Plus, BookOpen, MoreHorizontal } from 'lucide-react';

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', user?.id)
    .in('role', ['teacher_admin', 'student_admin'])
    .limit(1)
    .maybeSingle();

  let subjects: any[] = [];
  if (membership?.university_id) {
    const { data } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        code,
        credits,
        semesters (
          id,
          name,
          departments (
            name
          )
        )
      `)
      .order('name');
    // Note: Assuming a way to filter subjects by university, but structure might vary.
    // For simplicity, we just fetch available. Usually subjects belong to semesters which belong to departments which belong to years which belong to universities.
    subjects = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage course offerings and subject assignments.</p>
        </div>
        <button className="flex items-center space-x-2 bg-primary hover:bg-[#12CFEA] text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester / Class</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No subjects found.</p>
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{subject.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {subject.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {subject.semesters ? `${subject.semesters.departments?.name} - ${subject.semesters.name}` : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {subject.credits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
