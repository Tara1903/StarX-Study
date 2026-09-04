import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { MessageSquare, ShieldCheck, Zap, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chats | studchat',
  description: 'Your class cohort and personal messaging hub on studchat.',
};

export default async function ChatHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated and not demo, redirect
  // (Demo user is handled in platform layout)

  return (
    <div className="h-[calc(100vh-4.25rem)] lg:h-[calc(100vh-4rem)] flex w-full overflow-hidden bg-[#050B16]">
      {/* WhatsApp Web-Style Left Conversation List */}
      <div className="w-full lg:w-[360px] xl:w-[400px] h-full shrink-0 flex flex-col">
        <ChatConversationList />
      </div>

      {/* Desktop WhatsApp Web-Style Right Calm Placeholder (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#070E1B] p-8 text-center border-l border-white/10 select-none">
        <div className="max-w-md flex flex-col items-center space-y-4">
          <div className="w-18 h-18 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xl shadow-primary/10 animate-in zoom-in-75">
            <MessageSquare className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              StudChat for Web
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect instantly with your subject rooms, cohort peers, and faculty. Select a conversation on the left to start messaging.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 w-full pt-4 text-left">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Subject Cohorts</p>
                <p className="text-[11px] text-muted-foreground">Classroom groups & notes</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Realtime Speed</p>
                <p className="text-[11px] text-muted-foreground">Instant delivery & typing</p>
              </div>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 pt-6">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by cohort-level permissions & AI content moderation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
