'use client';

import { ChatConversationList } from '@/components/chat/chat-conversation-list';

interface DesktopChatSidebarProps {
  currentSubjectId: string;
}

export function DesktopChatSidebar({ currentSubjectId }: DesktopChatSidebarProps) {
  return <ChatConversationList currentConversationId={currentSubjectId} />;
}
