'use client';

import { ChatConversationList } from '@/components/chat/chat-conversation-list';

interface ChatWorkspaceShellProps {
  children: React.ReactNode;
}

export function ChatWorkspaceShell({ children }: ChatWorkspaceShellProps) {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#050B16] select-text">
      {/* Primary Desktop Chat Sidebar (Hidden on Mobile) */}
      <aside
        aria-label="Chat conversations"
        className="hidden lg:flex w-[320px] lg:w-[350px] xl:w-[380px] h-full shrink-0 flex-col border-r border-white/10 select-none z-10"
      >
        <ChatConversationList />
      </aside>

      {/* Main Chat Workspace: Empty State or Active Conversation */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
        {children}
      </div>
    </div>
  );
}
