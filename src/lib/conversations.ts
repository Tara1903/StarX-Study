import { ECE_SUBJECTS } from '@/lib/ece-data';
import { ECE_UUID_MAP } from '@/lib/subject-resolver';
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

export const INITIAL_PERSONAL_CHATS: ChatConversation[] = [
  {
    id: 'p-aarav',
    type: 'personal',
    name: 'Aarav Sharma',
    subtitle: 'Student • ECE Section A',
    bio: 'B.Tech ECE 1st Year • Enthusiastic about Embedded Systems & Robotics.',
    role: 'student',
    avatarType: 'preset',
    avatarPresetId: 'tech_coder',
    avatarEmoji: '🚀',
    lastMessage: 'Can you send me the Unit 1 lecture notes please?',
    lastMessageSender: 'Aarav',
    lastMessageTime: '2:14 PM',
    lastActivityTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    unreadCount: 2,
    onlineStatus: 'online',
    isPinned: true,
  },
  {
    id: 'p-priya',
    type: 'personal',
    name: 'Priya Patel',
    subtitle: 'Student • ECE Section A',
    bio: 'B.Tech ECE 1st Year • Exploring IoT & VLSI design.',
    role: 'student',
    avatarType: 'preset',
    avatarPresetId: 'creative_mind',
    avatarEmoji: '⚡',
    lastMessage: 'Okay, sounds good! See you in Room 03 tomorrow 👍',
    lastMessageSender: 'Priya',
    lastMessageTime: '1:05 PM',
    lastActivityTimestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    unreadCount: 0,
    onlineStatus: 'online',
    isPinned: false,
  },
  {
    id: 'p-garima',
    type: 'personal',
    name: 'Prof. Garima Pawar',
    subtitle: 'Faculty • Chemistry Lab In-charge',
    bio: 'Assistant Professor, Department of Applied Chemistry, IET SAGE University.',
    role: 'teacher',
    avatarType: 'preset',
    avatarPresetId: 'scholastic',
    avatarEmoji: '🧪',
    lastMessage: 'Please submit your validated Water Technology practical log by Friday.',
    lastMessageSender: 'Prof. Garima',
    lastMessageTime: '11:30 AM',
    lastActivityTimestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    unreadCount: 1,
    onlineStatus: 'offline',
    isPinned: false,
  },
  {
    id: 'p-rahul',
    type: 'personal',
    name: 'Rahul Verma',
    subtitle: 'Student • ECE-104',
    bio: 'First Year ECE • SAGE Student Council Member.',
    role: 'student',
    avatarType: 'preset',
    avatarPresetId: 'sports_star',
    avatarEmoji: '🎯',
    lastMessage: 'Is the non-programmable scientific calculator permitted in the exam hall?',
    lastMessageSender: 'Rahul',
    lastMessageTime: 'Yesterday',
    lastActivityTimestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    unreadCount: 0,
    onlineStatus: 'offline',
    isPinned: false,
  },
  {
    id: 'p-ruchi',
    type: 'personal',
    name: 'Prof. Ruchi Shrivastava',
    subtitle: 'Faculty • Mathematics Department',
    bio: 'Associate Professor of Applied Mathematics. Specialization in Linear Algebra.',
    role: 'teacher',
    avatarType: 'preset',
    avatarPresetId: 'scholastic',
    avatarEmoji: '📐',
    lastMessage: 'Tutorial sheet 4 solutions have been posted in the materials tab.',
    lastMessageSender: 'Prof. Ruchi',
    lastMessageTime: 'Sep 2',
    lastActivityTimestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    unreadCount: 0,
    onlineStatus: 'offline',
    isPinned: false,
  },
];

export function getInitialSubjectConversations(): ChatConversation[] {
  return ECE_SUBJECTS.map((sub, index) => {
    const unread = index === 0 ? 3 : index === 1 ? 1 : 0;
    const isPinned = index === 0;

    let lastMsg = 'Classroom discussion room opened';
    let lastSender = sub.facultyName.split(' ')[0] || 'Faculty';
    let lastTime = '10:42 AM';

    if (sub.id === 'math-1') {
      lastMsg = 'Please complete Problem Set 4 on Matrices before Friday';
      lastSender = 'Prof. Sharma';
      lastTime = '2:14 PM';
    } else if (sub.id === 'chemistry') {
      lastMsg = 'New lecture notes on Spectroscopy uploaded';
      lastSender = 'Dr. Verma';
      lastTime = '12:30 PM';
    } else if (sub.id === 'graphics') {
      lastMsg = 'Bring mini-drafter and calibrated scales for Sheet 2';
      lastSender = 'Prof. Pawar';
      lastTime = 'Yesterday';
    }

    return {
      id: sub.id,
      type: 'subject',
      name: sub.name,
      subtitle: `${sub.facultyAbb} • ${sub.facultyName}`,
      color: sub.color,
      avatarType: 'initials',
      lastMessage: lastMsg,
      lastMessageSender: lastSender,
      lastMessageTime: lastTime,
      lastActivityTimestamp: new Date(Date.now() - (index + 1) * 3600 * 1000).toISOString(),
      unreadCount: unread,
      isPinned,
      onlineStatus: 'online',
      facultyName: sub.facultyName,
      facultyAbb: sub.facultyAbb,
      subjectUuid: ECE_UUID_MAP[sub.id] || sub.id,
      room: sub.room || 'Room No. 03',
      code: sub.code,
    };
  });
}

export function getAllConversations(): ChatConversation[] {
  const subjects = getInitialSubjectConversations();
  const personal = [...INITIAL_PERSONAL_CHATS];
  
  // Merge and sort: pinned first, then by timestamp descending
  return [...subjects, ...personal].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastActivityTimestamp).getTime() - new Date(a.lastActivityTimestamp).getTime();
  });
}

export function getConversationById(id: string): ChatConversation | null {
  if (!id) return null;
  const cleanId = id.toLowerCase();
  const all = getAllConversations();
  const direct = all.find((c) => c.id.toLowerCase() === cleanId);
  if (direct) return direct;

  // Check if it's an ECE subject slug or uuid
  const ece = ECE_SUBJECTS.find((s) => s.id.toLowerCase() === cleanId || s.code.toLowerCase() === cleanId);
  if (ece) {
    return {
      id: ece.id,
      type: 'subject',
      name: ece.name,
      subtitle: `${ece.facultyAbb} • ${ece.facultyName}`,
      color: ece.color,
      avatarType: 'initials',
      lastActivityTimestamp: new Date().toISOString(),
      unreadCount: 0,
      facultyName: ece.facultyName,
      facultyAbb: ece.facultyAbb,
      subjectUuid: ECE_UUID_MAP[ece.id] || ece.id,
      room: ece.room || 'Room No. 03',
      code: ece.code,
    };
  }

  // If it's a personal participant id (e.g. user uuid or handle)
  if (cleanId.startsWith('p-') || cleanId.startsWith('personal-')) {
    const rawName = id.replace(/^(p-|personal-)/i, '').replace(/[-_]/g, ' ');
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      id,
      type: 'personal',
      name: formattedName,
      subtitle: 'Personal Chat',
      role: 'student',
      avatarType: 'preset',
      avatarPresetId: 'tech_coder',
      avatarEmoji: '💬',
      lastActivityTimestamp: new Date().toISOString(),
      unreadCount: 0,
      onlineStatus: 'online',
    };
  }

  return null;
}

export type ConversationFilterCategory = 'all' | 'unread' | 'subjects' | 'personal' | 'pinned';

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
  } else if (category === 'personal') {
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

export function getInitialSeedMessages(id: string): any[] {
  const now = Date.now();
  const conv = getConversationById(id);
  if (!conv) return [];

  if (id === 'p-aarav') {
    return [
      {
        id: 'msg-aarav-1',
        subject_id: id,
        sender_id: 'user-aarav',
        content: 'Hey! Did you attend Prof. Sharma\'s tutorial on Eigenvalues today?',
        created_at: new Date(now - 25 * 60 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-aarav', full_name: 'Aarav Sharma', avatar_url: null },
        reactions: [],
        attachments: [],
      },
      {
        id: 'msg-aarav-2',
        subject_id: id,
        sender_id: 'user-aarav',
        content: 'Can you send me the Unit 1 lecture notes please? I missed the last 15 minutes.',
        created_at: new Date(now - 5 * 60 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-aarav', full_name: 'Aarav Sharma', avatar_url: null },
        reactions: [{ emoji: '👍', user_id: 'current_user' }],
        attachments: [],
      },
    ];
  }

  if (id === 'p-priya') {
    return [
      {
        id: 'msg-priya-1',
        subject_id: id,
        sender_id: 'user-priya',
        content: 'Are you working on the basic electrical lab circuit simulation?',
        created_at: new Date(now - 90 * 60 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-priya', full_name: 'Priya Patel', avatar_url: null },
        reactions: [],
        attachments: [],
      },
      {
        id: 'msg-priya-2',
        subject_id: id,
        sender_id: 'user-priya',
        content: 'Okay, sounds good! See you in Room 03 tomorrow 👍',
        created_at: new Date(now - 75 * 60 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-priya', full_name: 'Priya Patel', avatar_url: null },
        reactions: [],
        attachments: [],
      },
    ];
  }

  if (id === 'p-garima') {
    return [
      {
        id: 'msg-garima-1',
        subject_id: id,
        sender_id: 'user-garima',
        content: 'Good day. Remember that your titration observations need to be signed before submission.',
        created_at: new Date(now - 5 * 3600 * 1000).toISOString(),
        status: 'published',
        is_pinned: true,
        is_edited: false,
        sender: { id: 'user-garima', full_name: 'Prof. Garima Pawar', avatar_url: null },
        reactions: [],
        attachments: [],
      },
      {
        id: 'msg-garima-2',
        subject_id: id,
        sender_id: 'user-garima',
        content: 'Please submit your validated Water Technology practical log by Friday.',
        created_at: new Date(now - 3 * 3600 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-garima', full_name: 'Prof. Garima Pawar', avatar_url: null },
        reactions: [],
        attachments: [],
      },
    ];
  }

  if (id === 'p-rahul') {
    return [
      {
        id: 'msg-rahul-1',
        subject_id: id,
        sender_id: 'user-rahul',
        content: 'Is the non-programmable scientific calculator permitted in the exam hall?',
        created_at: new Date(now - 26 * 3600 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-rahul', full_name: 'Rahul Verma', avatar_url: null },
        reactions: [],
        attachments: [],
      },
    ];
  }

  if (id === 'p-ruchi') {
    return [
      {
        id: 'msg-ruchi-1',
        subject_id: id,
        sender_id: 'user-ruchi',
        content: 'Tutorial sheet 4 solutions have been posted in the materials tab.',
        created_at: new Date(now - 48 * 3600 * 1000).toISOString(),
        status: 'published',
        is_pinned: false,
        is_edited: false,
        sender: { id: 'user-ruchi', full_name: 'Prof. Ruchi Shrivastava', avatar_url: null },
        reactions: [],
        attachments: [],
      },
    ];
  }

  return [];
}

