import { describe, it, expect } from 'vitest';
import {
  getAllConversations,
  getConversationById,
  filterConversations,
  type ChatConversation,
} from './conversations';

describe('Chat Conversations Module', () => {
  it('returns all conversations with pinned items prioritized', () => {
    const list = getAllConversations();
    expect(list.length).toBeGreaterThan(5);

    // First item should be pinned
    expect(list[0].isPinned).toBe(true);

    // Check that subjects and personal are both present
    const hasSubject = list.some((c) => c.type === 'subject');
    const hasPersonal = list.some((c) => c.type === 'personal');
    expect(hasSubject).toBe(true);
    expect(hasPersonal).toBe(true);
  });

  it('resolves conversation by ID for subjects and personal chats', () => {
    const math = getConversationById('math-1');
    expect(math).not.toBeNull();
    expect(math?.name).toBe('Mathematics-I');
    expect(math?.type).toBe('subject');

    const aarav = getConversationById('p-aarav');
    expect(aarav).not.toBeNull();
    expect(aarav?.name).toBe('Aarav Sharma');
    expect(aarav?.type).toBe('personal');
  });

  it('supports fallback resolution for dynamic personal participant IDs', () => {
    const fallback = getConversationById('p-rohit-sen');
    expect(fallback).not.toBeNull();
    expect(fallback?.name).toBe('Rohit sen');
    expect(fallback?.type).toBe('personal');
  });

  it('filters conversations by category', () => {
    const all = getAllConversations();
    const subjectsOnly = filterConversations(all, '', 'subjects');
    const personalOnly = filterConversations(all, '', 'personal');

    expect(subjectsOnly.every((c) => c.type === 'subject')).toBe(true);
    expect(personalOnly.every((c) => c.type === 'personal')).toBe(true);
  });

  it('filters conversations by search query', () => {
    const all = getAllConversations();
    const result = filterConversations(all, 'Chemistry', 'all');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((c) => c.name.toLowerCase().includes('chemistry'))).toBe(true);

    const messageQuery = filterConversations(all, 'notes', 'all');
    expect(messageQuery.length).toBeGreaterThan(0);
  });
});
