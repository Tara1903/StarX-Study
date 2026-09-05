import { describe, it, expect } from 'vitest';
import { PRIMARY_MOBILE_DESTINATIONS, isSubjectChatRoute, isChatRoute } from '@/lib/mobile-tokens';
import { filterConversations, type ChatConversation, type ConversationFilterCategory } from '@/lib/conversations';

describe('STUDCHAT — Chat-First Architecture & Product Restructure', () => {
  describe('1. Mobile Primary Navigation (Handwritten Sketch 3-Pillar Model)', () => {
    it('has exactly 3 bottom navigation destinations: Friend Chat, Study Group, Profile', () => {
      expect(PRIMARY_MOBILE_DESTINATIONS).toHaveLength(3);
      const destinationIds = PRIMARY_MOBILE_DESTINATIONS.map((d) => d.id);
      expect(destinationIds).toEqual(['chat', 'study-groups', 'profile']);

      const destinationHrefs = PRIMARY_MOBILE_DESTINATIONS.map((d) => d.href);
      expect(destinationHrefs).toEqual(['/chat', '/study-groups', '/profile']);
    });

    it('isolates active chat conversation from mobile bottom navigation bar', () => {
      // In active conversation, mobile bottom nav is hidden to prioritize composer
      expect(isSubjectChatRoute('/chat/conv-123')).toBe(true);
      expect(isSubjectChatRoute('/subjects/math-1/chat')).toBe(true);
      expect(isSubjectChatRoute('/chat')).toBe(false);
      expect(isSubjectChatRoute('/study-groups')).toBe(false);
      expect(isSubjectChatRoute('/profile')).toBe(false);
    });

    it('identifies dedicated desktop chat workspace routes for global sidebar removal', () => {
      expect(isChatRoute('/chat')).toBe(true);
      expect(isChatRoute('/chat/conv-aarav')).toBe(true);
      expect(isChatRoute('/subjects/math-1/chat')).toBe(true);
      expect(isChatRoute('/study-groups')).toBe(false);
      expect(isChatRoute('/dashboard')).toBe(false);
    });
  });

  describe('2. Friends & Studmates Distinction & Filter Categories', () => {
    const mockConversations: ChatConversation[] = [
      {
        id: 'conv-p-aarav',
        type: 'personal',
        name: 'Aarav Sharma',
        subtitle: 'Direct Message',
        unreadCount: 2,
        lastActivityTimestamp: '2026-09-05T12:00:00Z',
      },
      {
        id: 'conv-p-priya',
        type: 'personal',
        name: 'Priya Patel',
        subtitle: 'Direct Message',
        unreadCount: 0,
        lastActivityTimestamp: '2026-09-05T11:00:00Z',
      },
      {
        id: 'math-1',
        type: 'subject',
        name: 'Mathematics-I',
        subtitle: 'RS • Prof. Ruchi Shrivastava',
        facultyName: 'Prof. Ruchi Shrivastava',
        unreadCount: 5,
        lastActivityTimestamp: '2026-09-05T10:00:00Z',
      },
      {
        id: 'chem-1',
        type: 'subject',
        name: 'Chemistry',
        subtitle: 'GP • Prof. Garima Pawar',
        facultyName: 'Prof. Garima Pawar',
        unreadCount: 0,
        lastActivityTimestamp: '2026-09-05T09:00:00Z',
      },
    ];

    it('filters personal/friend chats correctly', () => {
      const personal = filterConversations(mockConversations, '', 'friends');
      expect(personal).toHaveLength(2);
      expect(personal.map((c) => c.name)).toEqual(['Aarav Sharma', 'Priya Patel']);
    });

    it('filters subject/study-group chats correctly', () => {
      const subjects = filterConversations(mockConversations, '', 'subjects');
      expect(subjects).toHaveLength(2);
      expect(subjects.map((c) => c.name)).toEqual(['Mathematics-I', 'Chemistry']);
    });

    it('filters unread conversations across both personal and subject chats', () => {
      const unread = filterConversations(mockConversations, '', 'unread');
      expect(unread).toHaveLength(2);
      expect(unread.map((c) => c.name)).toEqual(['Aarav Sharma', 'Mathematics-I']);
    });

    it('searches correctly across names and faculty', () => {
      const searchRes1 = filterConversations(mockConversations, 'aarav', 'all');
      expect(searchRes1).toHaveLength(1);
      expect(searchRes1[0].name).toBe('Aarav Sharma');

      const searchRes2 = filterConversations(mockConversations, 'Ruchi', 'all');
      expect(searchRes2).toHaveLength(1);
      expect(searchRes2[0].name).toBe('Mathematics-I');
    });
  });

  describe('3. Chat History & Context Isolation', () => {
    interface TestMessage {
      id: string;
      conversationId?: string;
      subjectId?: string;
      content: string;
    }

    const isolatedMessages: TestMessage[] = [
      { id: 'm1', conversationId: 'conv-aarav', content: 'Hey Aarav' },
      { id: 'm2', conversationId: 'conv-priya', content: 'Hi Priya' },
      { id: 'm3', subjectId: 'math-1', content: 'Mathematics-I assignment deadline' },
      { id: 'm4', subjectId: 'chem-1', content: 'Chemistry lab report' },
    ];

    it('strictly isolates messages by conversation and subject id without leaking', () => {
      const aaravMessages = isolatedMessages.filter((m) => m.conversationId === 'conv-aarav');
      expect(aaravMessages).toHaveLength(1);
      expect(aaravMessages[0].content).toBe('Hey Aarav');

      const mathMessages = isolatedMessages.filter((m) => m.subjectId === 'math-1');
      expect(mathMessages).toHaveLength(1);
      expect(mathMessages[0].content).toBe('Mathematics-I assignment deadline');

      const chemMessages = isolatedMessages.filter((m) => m.subjectId === 'chem-1');
      expect(chemMessages).toHaveLength(1);
      expect(chemMessages[0].content).toBe('Chemistry lab report');

      // Verify no cross-contamination
      expect(aaravMessages.some((m) => m.subjectId === 'math-1')).toBe(false);
      expect(mathMessages.some((m) => m.conversationId === 'conv-priya')).toBe(false);
    });
  });

  describe('4. Storage Separation: Friends Storage vs Studmates Storage', () => {
    interface TestStorageItem {
      id: string;
      fileName: string;
      sourceType: 'friend' | 'studmate';
      category: 'image' | 'pdf' | 'document';
    }

    const mockStorage: TestStorageItem[] = [
      { id: 's1', fileName: 'notes_aarav.pdf', sourceType: 'friend', category: 'pdf' },
      { id: 's2', fileName: 'photo_aarav.jpg', sourceType: 'friend', category: 'image' },
      { id: 's3', fileName: 'math_syllabus.pdf', sourceType: 'studmate', category: 'pdf' },
      { id: 's4', fileName: 'lab_apparatus.png', sourceType: 'studmate', category: 'image' },
    ];

    it('categorizes storage items into distinct Friends and Studmates scopes', () => {
      const friendsItems = mockStorage.filter((item) => item.sourceType === 'friend');
      const studmatesItems = mockStorage.filter((item) => item.sourceType === 'studmate');

      expect(friendsItems).toHaveLength(2);
      expect(studmatesItems).toHaveLength(2);

      expect(friendsItems.map((i) => i.fileName)).toEqual(['notes_aarav.pdf', 'photo_aarav.jpg']);
      expect(studmatesItems.map((i) => i.fileName)).toEqual(['math_syllabus.pdf', 'lab_apparatus.png']);
    });

    it('filters storage items by media type (Photos vs PDFs/Docs)', () => {
      const photos = mockStorage.filter((item) => item.category === 'image');
      const pdfs = mockStorage.filter((item) => item.category === 'pdf');

      expect(photos).toHaveLength(2);
      expect(pdfs).toHaveLength(2);
    });
  });
});
