import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { BookOpen, Search, Users } from 'lucide-react';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch subjects where user is a member
  const { data: subjects } = await supabase
    .from('subject_members')
    .select(`
      subject_id,
      subjects:subject_id (
        id,
        name,
        color,
        description,
        semesters (
          name,
          departments (
            name,
            institutes (
              name
            )
          )
        )
      )
    `)
    .eq('user_id', user.id);

  const mappedSubjects = subjects?.map((sm: any) => sm.subjects).filter(Boolean) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage and access your enrolled subjects.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects..."
            className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {mappedSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-card/50 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Subjects Yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            You haven't been enrolled in any subjects yet. When you are added to a subject, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mappedSubjects.map((subject: any) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md h-full">
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: subject.color || '#3b82f6' }}
                />
                <div className="flex flex-col flex-grow p-5">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {subject.semesters?.departments?.name} - {subject.semesters?.name}
                  </p>
                  
                  <div className="mt-auto pt-6 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>View details</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
