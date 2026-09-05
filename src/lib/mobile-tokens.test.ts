import { describe, it, expect } from 'vitest';
import {
  MOBILE_HEADER_HEIGHT,
  MOBILE_BOTTOM_NAV_HEIGHT,
  PRIMARY_MOBILE_DESTINATIONS,
  isSubjectChatRoute,
  isChatRoute,
  getMobileHeaderInfo,
} from './mobile-tokens';

describe('studchat Mobile Web Design System Tokens & Navigation', () => {
  it('defines the shared mobile header and bottom navigation dimensions', () => {
    expect(MOBILE_HEADER_HEIGHT).toBe(56);
    expect(MOBILE_BOTTOM_NAV_HEIGHT).toBe(64);
  });

  it('provides the 5 required primary bottom navigation destinations', () => {
    expect(PRIMARY_MOBILE_DESTINATIONS).toHaveLength(5);
    const ids = PRIMARY_MOBILE_DESTINATIONS.map((d) => d.id);
    expect(ids).toEqual(['home', 'chat', 'subjects', 'tasks', 'me']);

    const hrefs = PRIMARY_MOBILE_DESTINATIONS.map((d) => d.href);
    expect(hrefs).toEqual([
      '/dashboard',
      '/chat',
      '/subjects',
      '/assignments',
      '/profile',
    ]);
  });

  it('correctly identifies subject and personal chat routes to isolate navigation and composer', () => {
    // Valid subject chat routes
    expect(isSubjectChatRoute('/subjects/chemistry/chat')).toBe(true);
    expect(isSubjectChatRoute('/subjects/ece-math-1/chat')).toBe(true);
    expect(isSubjectChatRoute('/subjects/ece-math-1/chat/thread')).toBe(true);
    expect(isSubjectChatRoute('/subjects/3e20e10b-689e-4c3d-b4f7-7a56111fdb49/chat')).toBe(true);

    // Valid personal/direct chat routes
    expect(isSubjectChatRoute('/chat/math-1')).toBe(true);
    expect(isSubjectChatRoute('/chat/p-aarav')).toBe(true);

    // Non-chat routes should return false
    expect(isSubjectChatRoute('/chat')).toBe(false);
    expect(isSubjectChatRoute('/subjects')).toBe(false);
    expect(isSubjectChatRoute('/subjects/chemistry')).toBe(false);
    expect(isSubjectChatRoute('/subjects/chemistry/announcements')).toBe(false);
    expect(isSubjectChatRoute('/subjects/chemistry/materials')).toBe(false);
    expect(isSubjectChatRoute('/subjects/chemistry/assignments')).toBe(false);
    expect(isSubjectChatRoute('/dashboard')).toBe(false);
    expect(isSubjectChatRoute('/profile')).toBe(false);
    expect(isSubjectChatRoute('/notifications')).toBe(false);
  });

  it('correctly identifies all dedicated Chat Workspace routes for sidebar exclusion', () => {
    // Both chat hub, conversations, and subject chats belong to dedicated Chat Workspace
    expect(isChatRoute('/chat')).toBe(true);
    expect(isChatRoute('/chat/ece-math-1')).toBe(true);
    expect(isChatRoute('/chat/user-123')).toBe(true);
    expect(isChatRoute('/subjects/chemistry/chat')).toBe(true);

    // Normal application pages must NOT be identified as chat workspace
    expect(isChatRoute('/dashboard')).toBe(false);
    expect(isChatRoute('/subjects')).toBe(false);
    expect(isChatRoute('/subjects/ece-math-1')).toBe(false);
    expect(isChatRoute('/assignments')).toBe(false);
    expect(isChatRoute('/announcements')).toBe(false);
    expect(isChatRoute('/notifications')).toBe(false);
    expect(isChatRoute('/profile')).toBe(false);
  });

  it('resolves root headers correctly without back button', () => {
    const dashboardHeader = getMobileHeaderInfo('/dashboard');
    expect(dashboardHeader.isRoot).toBe(true);
    expect(dashboardHeader.showBack).toBe(false);
    expect(dashboardHeader.title).toBe('Dashboard');

    const subjectsHeader = getMobileHeaderInfo('/subjects');
    expect(subjectsHeader.isRoot).toBe(true);
    expect(subjectsHeader.showBack).toBe(false);
    expect(subjectsHeader.title).toBe('My Subjects');

    const profileHeader = getMobileHeaderInfo('/profile');
    expect(profileHeader.isRoot).toBe(true);
    expect(profileHeader.showBack).toBe(false);
    expect(profileHeader.title).toBe('My Profile');
  });

  it('resolves nested headers correctly with predictable back navigation', () => {
    // Subject detail -> backs to /subjects
    const subjectOverview = getMobileHeaderInfo('/subjects/math-1');
    expect(subjectOverview.isRoot).toBe(false);
    expect(subjectOverview.showBack).toBe(true);
    expect(subjectOverview.backHref).toBe('/subjects');

    // Subject chat -> backs to /subjects/math-1
    const subjectChat = getMobileHeaderInfo('/subjects/math-1/chat');
    expect(subjectChat.isRoot).toBe(false);
    expect(subjectChat.showBack).toBe(true);
    expect(subjectChat.backHref).toBe('/subjects/math-1');

    // Subject materials -> backs to /subjects/math-1
    const subjectMaterials = getMobileHeaderInfo('/subjects/math-1/materials');
    expect(subjectMaterials.isRoot).toBe(false);
    expect(subjectMaterials.showBack).toBe(true);
    expect(subjectMaterials.backHref).toBe('/subjects/math-1');

    // Timetable -> backs to /dashboard
    const timetable = getMobileHeaderInfo('/timetable');
    expect(timetable.isRoot).toBe(false);
    expect(timetable.showBack).toBe(true);
    expect(timetable.backHref).toBe('/dashboard');
  });
});
