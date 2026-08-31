import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, Filter, CheckCircle2 } from 'lucide-react';

export default async function GlobalAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Simplified fetch for demo purposes
  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:author_id(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Updates across all your subjects and school.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-background border rounded-md text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      {!announcements || announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            You don't have any announcements right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-card border rounded-xl p-5 shadow-sm flex gap-4 hover:border-primary/50 transition-colors">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">From: {announcement.author?.full_name || 'System'}</p>
                <p className="text-sm text-foreground/80 mt-2 line-clamp-3 whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
