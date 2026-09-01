import { createClient } from '@/lib/supabase/server';
import { Plus, ChevronRight, Layers } from 'lucide-react';

export default async function AdminClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('school_memberships')
    .select('school_id')
    .eq('user_id', user?.id)
    .in('role', ['teacher_admin', 'student_admin'])
    .limit(1)
    .maybeSingle();

  let academicYears: any[] = [];
  if (membership?.school_id) {
    const { data } = await supabase
      .from('academic_years')
      .select(`
        id,
        name,
        classes (
          id,
          name,
          sections (
            id,
            name
          )
        )
      `)
      .eq('school_id', membership.school_id)
      .order('start_date', { ascending: false });
    
    academicYears = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Classes & Sections</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage the academic structure of your school.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Class</span>
        </button>
      </div>

      {academicYears.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
          <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Classes Setup</h3>
          <p className="text-slate-500 mb-4">Start by adding an academic year and creating classes.</p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Academic Year
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {academicYears.map((year) => (
            <div key={year.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Academic Year: {year.name}
                </h2>
                <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  Edit Year
                </button>
              </div>
              
              <div className="p-0">
                {year.classes && year.classes.length > 0 ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {year.classes.map((cls: any) => (
                      <li key={cls.id} className="px-6 py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-white text-lg flex items-center">
                              {cls.name}
                            </h3>
                            
                            <div className="mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
                              {cls.sections && cls.sections.length > 0 ? (
                                cls.sections.map((sec: any) => (
                                  <div key={sec.id} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">Section {sec.name}</span>
                                    <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500 italic">No sections created yet.</p>
                              )}
                              
                              <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center mt-2">
                                <Plus className="h-3 w-3 mr-1" /> Add Section
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                              Edit
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    No classes added to this academic year yet.
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
