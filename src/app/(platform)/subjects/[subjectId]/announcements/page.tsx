import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Bell, AlertTriangle, Info, Plus } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectAnnouncementsPage({ params }: PageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const isTeacher = membership.role === 'teacher';

  // Fetch announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:author_id(id, full_name, avatar_url)
    `)
    .eq('target_type', 'subject')
    .eq('target_id', subjectId)
    .order('created_at', { ascending: false });

  const priorityConfig = {
    normal: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
    important: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Bell },
    urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1 text-sm">Stay updated with the latest news for this subject.</p>
        </div>
        {isTeacher && (
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create
          </button>
        )}
      </div>

      {!announcements || announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No announcements</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            There are no announcements for this subject yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const priority = announcement.priority || 'normal';
            // @ts-ignore
            const config = priorityConfig[priority] || priorityConfig.normal;
            const Icon = config.icon;

            return (
              <div key={announcement.id} className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{priority}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                        {announcement.author?.avatar_url ? (
                          <img src={announcement.author.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {announcement.author?.full_name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground">{announcement.author?.full_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
