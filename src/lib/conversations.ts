import type { AvatarType } from '@/types';

export type ConversationType = 'subject' | 'personal';

export interface ChatConversation {
  id: string;
  type: ConversationType;
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarType?: AvatarType;
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  color?: string;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTime?: string;
  lastActivityTimestamp: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  onlineStatus?: 'online' | 'offline' | 'typing';
  facultyName?: string;
  facultyAbb?: string;
  subjectUuid?: string;
  room?: string;
  code?: string;
  bio?: string;
  role?: string;
}

export type ConversationFilterCategory = 'all' | 'unread' | 'friends' | 'studmates' | 'subjects' | 'personal' | 'pinned';

export function filterConversations(
  conversations: ChatConversation[],
  query: string,
  category: ConversationFilterCategory = 'all'
): ChatConversation[] {
  let list = conversations;

  if (category === 'unread') {
    list = list.filter((c) => (c.unreadCount || 0) > 0);
  } else if (category === 'subjects') {
    list = list.filter((c) => c.type === 'subject');
  } else if (category === 'personal' || category === 'friends' || category === 'studmates') {
    list = list.filter((c) => c.type === 'personal');
  } else if (category === 'pinned') {
    list = list.filter((c) => c.isPinned);
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q)) ||
        (c.facultyName && c.facultyName.toLowerCase().includes(q))
    );
  }

  return list;
}

export function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastActivityTimestamp).getTime() - new Date(a.lastActivityTimestamp).getTime();
  });
}

// ============================================================
// TEST ONLY FIXTURES (Used strictly by vitest unit tests)
// Never imported by production app components
// ============================================================
export const _TEST_FIXTURE_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'math-1',
    type: 'subject',
    name: 'Mathematics-I',
    subtitle: 'RS • Prof. Ruchi',
    color: '#3B82F6',
    lastMessage: 'Problem Set 4 solutions uploaded',
    lastActivityTimestamp: new Date().toISOString(),
    unreadCount: 3,
    isPinned: true,
  },
  {
    id: 'chemistry',
    type: 'subject',
    name: 'Chemistry',
    subtitle: 'GP • Prof. Garima',
    color: '#10B981',
    lastMessage: 'Lab practical notes available',
    lastActivityTimestamp: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 1,
    isPinned: false,
  },
  {
    id: 'p-aarav',
    type: 'personal',
    name: 'Aarav Sharma',
    subtitle: 'Direct Message',
    lastMessage: 'Can you send notes?',
    lastActivityTimestamp: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 2,
    isPinned: false,
  },
  {
    id: 'p-priya',
    type: 'personal',
    name: 'Priya Patel',
    subtitle: 'Direct Message',
    lastMessage: 'See you tomorrow in Room 03',
    lastActivityTimestamp: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 0,
    isPinned: false,
  },
  {
    id: 'graphics',
    type: 'subject',
    name: 'Engineering Graphics',
    subtitle: 'VB • Prof. Bakshi',
    color: '#EC4899',
    lastMessage: 'Drawing sheet 2 guidelines',
    lastActivityTimestamp: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
    isPinned: false,
  },
  {
    id: 'basic-electrical',
    type: 'subject',
    name: 'Basic Electrical',
    subtitle: 'RT • Prof. Ranu',
    color: '#F59E0B',
    lastMessage: 'KVL KCL sheet review',
    lastActivityTimestamp: new Date(Date.now() - 90000000).toISOString(),
    unreadCount: 0,
    isPinned: false,
  },
];

export function getAllConversations(): ChatConversation[] {
  return sortConversations(_TEST_FIXTURE_CONVERSATIONS);
}

export function getConversationById(id: string): ChatConversation | null {
  if (!id) return null;
  const direct = _TEST_FIXTURE_CONVERSATIONS.find((c) => c.id.toLowerCase() === id.toLowerCase());
  if (direct) return direct;

  if (id.startsWith('p-') || id.startsWith('personal-')) {
    const rawName = id.replace(/^(p-|personal-)/i, '').replace(/[-_]/g, ' ');
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      id,
      type: 'personal',
      name: formattedName,
      subtitle: 'Personal Chat',
      role: 'student',
      lastActivityTimestamp: new Date().toISOString(),
      unreadCount: 0,
    };
  }

  return null;
}
