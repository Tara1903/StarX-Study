import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MessageSquare, ShieldCheck, Zap, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chats | StarX Study',
  description: 'Your class cohort and personal messaging hub on StarX Study.',
};

export default async function ChatHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      {/* Mobile Root View: Conversation List taking full mobile screen (Hidden on Desktop) */}
      <div className="lg:hidden flex flex-col w-full h-full relative">
        <ChatConversationList className="border-r-0 pb-16" />
        <MobileNav />
      </div>

      {/* Desktop View: Premium Restrained Empty Conversation Placeholder (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#08110B] p-8 text-center select-none">
        <div className="max-w-md flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
            <MessageSquare className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Select a conversation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose a subject room or peer direct message from the left to start messaging.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2.5 w-full pt-4 text-left">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Subject Rooms</p>
                <p className="text-[11px] text-muted-foreground">Class cohorts & notes</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Realtime Speed</p>
                <p className="text-[11px] text-muted-foreground">Instant delivery & typing</p>
              </div>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 pt-6">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Protected by cohort-level permissions & AI content moderation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
