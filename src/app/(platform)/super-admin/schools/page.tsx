import { createClient } from '@/lib/supabase/server';
import { Plus, Building, ExternalLink, Settings, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default async function SuperAdminSchoolsPage() {
  const supabase = await createClient();
  
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Schools Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all educational institutions on the platform.</p>
        </div>
        <button className="flex items-center space-x-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" />
          <span>Register School</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!schools || schools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Building className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Schools Found</h3>
                    <p className="text-slate-500">Get started by registering a new school.</p>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center font-bold text-lg">
                          {school.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {school.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ID: {school.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {school.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(school.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View School Profile" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <ExternalLink className="h-5 w-5" />
                        </button>
                        <button title="School Settings" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <Settings className="h-5 w-5" />
                        </button>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
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
