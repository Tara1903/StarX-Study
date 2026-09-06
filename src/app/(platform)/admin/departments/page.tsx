import { createClient } from '@/lib/supabase/server';
import { Plus, ChevronRight, Layers } from 'lucide-react';

export default async function AdminDepartmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', user?.id)
    .eq('role', 'institute_head')
    .limit(1)
    .maybeSingle();

  let academicYears: any[] = [];
  if (membership?.university_id) {
    const { data } = await supabase
      .from('institutes')
      .select(`
        id,
        name,
        departments (
          id,
          name,
          semesters (
            id,
            name
          )
        )
      `)
      .eq('university_id', membership.university_id)
      .order('start_date', { ascending: false });
    
    academicYears = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments & Semesters</h1>
          <p className="text-muted-foreground mt-1">Manage the academic structure of your university.</p>
        </div>
        <button className="flex items-center space-x-2 bg-primary hover:bg-[#22C55E] text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Class</span>
        </button>
      </div>

      {academicYears.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Departments Setup</h3>
          <p className="text-muted-foreground mb-4">Start by adding an academic year and creating departments.</p>
          <button className="bg-primary hover:bg-[#22C55E] text-primary-foreground px-4 py-2 rounded-md font-medium inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Academic Year
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {academicYears.map((year) => (
            <div key={year.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Academic Year: {year.name}
                </h2>
                <button className="text-sm text-primary font-medium hover:underline">
                  Edit Year
                </button>
              </div>
              
              <div className="p-0">
                {year.departments && year.departments.length > 0 ? (
                  <ul className="divide-y divide-border/50">
                    {year.departments.map((cls: any) => (
                      <li key={cls.id} className="px-6 py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-foreground text-lg flex items-center">
                              {cls.name}
                            </h3>
                            
                            <div className="mt-2 pl-4 border-l-2 border-border space-y-2">
                              {cls.semesters && cls.semesters.length > 0 ? (
                                cls.semesters.map((sec: any) => (
                                  <div key={sec.id} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Semester {sec.name}</span>
                                    <button className="text-muted-foreground hover:text-primary transition-colors">
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No semesters created yet.</p>
                              )}
                              
                              <button className="text-xs text-primary font-medium hover:underline flex items-center mt-2">
                                <Plus className="h-3 w-3 mr-1" /> Add Semester
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button className="text-muted-foreground hover:text-foreground text-sm font-medium px-2 py-1 rounded hover:bg-muted">
                              Edit
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No departments added to this academic year yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
