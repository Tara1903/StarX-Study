import { Metadata } from 'next';
import { ChatWorkspaceShell } from '@/components/chat/chat-workspace-shell';

export const metadata: Metadata = {
  title: 'Chats | studchat',
  description: 'Your dedicated realtime messaging workspace on studchat.',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatWorkspaceShell>{children}</ChatWorkspaceShell>;
}
