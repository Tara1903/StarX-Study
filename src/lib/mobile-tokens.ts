/**
 * studchat Mobile Web Design System Tokens
 * Defined shared tokens for mobile header, navigation, typography, safe areas, and geometry.
 */

export const MOBILE_HEADER_HEIGHT = 56; // px (~56px visual size excluding safe area)
export const MOBILE_BOTTOM_NAV_HEIGHT = 64; // px (~64px visual size excluding safe area)
export const MOBILE_PAGE_PADDING_X = 16; // px (16px horizontal baseline)

export interface MobileNavDestination {
  id: string;
  name: string;
  href: string;
  badge?: number;
}

export const PRIMARY_MOBILE_DESTINATIONS: MobileNavDestination[] = [
  { id: 'chat', name: 'Friend Chat', href: '/chat' },
  { id: 'study-groups', name: 'Study Group', href: '/study-groups' },
  { id: 'profile', name: 'Profile', href: '/profile' },
];

/**
 * Determines whether the current path is inside an active conversation.
 * Chat requires an immersive mobile experience without the global bottom navigation.
 */
export function isImmersiveChatRoute(pathname: string): boolean {
  if (!pathname) return false;
  return /^\/subjects\/[^/]+\/chat(\/.*)?$/.test(pathname) || /^\/chat\/[^/]+/.test(pathname);
}

export function isSubjectChatRoute(pathname: string): boolean {
  return isImmersiveChatRoute(pathname);
}

/**
 * Determines whether the desktop application shell should render the Left Navigation Rail
 * and full-bleed h-screen chat layout (WhatsApp Web/Desktop architecture).
 */
export function isDesktopChatRoute(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === '/chat' ||
    pathname.startsWith('/chat/') ||
    /^\/subjects\/[^/]+\/chat(\/.*)?$/.test(pathname)
  );
}

/**
 * Determines whether the current route belongs to the dedicated Chat Workspace.
 * When true, the global application sidebar and navigation are completely absent.
 */
export function isChatRoute(pathname: string): boolean {
  return isDesktopChatRoute(pathname);
}

/**
 * Determines mobile header variant and navigation state.
 */
export function getMobileHeaderInfo(pathname: string): {
  isRoot: boolean;
  title: string;
  showBack: boolean;
  backHref: string;
} {
  if (!pathname) {
    return { isRoot: true, title: 'Dashboard', showBack: false, backHref: '/dashboard' };
  }

  // Root primary destinations
  if (pathname === '/dashboard') {
    return { isRoot: true, title: 'Dashboard', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/chat') {
    return { isRoot: true, title: 'Chats', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/study-groups') {
    return { isRoot: true, title: 'Study Groups', showBack: false, backHref: '/chat' };
  }
  if (pathname === '/subjects') {
    return { isRoot: true, title: 'My Subjects', showBack: false, backHref: '/study-groups' };
  }
  if (pathname === '/assignments') {
    return { isRoot: true, title: 'Assignments', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/notifications') {
    return { isRoot: true, title: 'Notifications', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/profile') {
    return { isRoot: true, title: 'My Profile', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/announcements') {
    return { isRoot: true, title: 'Announcements', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/people') {
    return { isRoot: true, title: 'People', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/moderation') {
    return { isRoot: true, title: 'Moderation', showBack: false, backHref: '/dashboard' };
  }
  if (pathname === '/timetable') {
    return { isRoot: false, title: 'ECE Timetable', showBack: true, backHref: '/dashboard' };
  }

  // Nested subject routes
  if (isSubjectChatRoute(pathname)) {
    // Subject chat has its own specialized immersive chat header
    const subjectIdMatch = pathname.match(/^\/subjects\/([^/]+)\/chat/);
    const subjectId = subjectIdMatch ? subjectIdMatch[1] : '';
    return {
      isRoot: false,
      title: 'Subject Chat',
      showBack: true,
      backHref: subjectId ? `/subjects/${subjectId}` : '/subjects',
    };
  }

  if (/^\/chat\/[^/]+/.test(pathname)) {
    return {
      isRoot: false,
      title: 'Conversation',
      showBack: true,
      backHref: '/chat',
    };
  }

  if (/^\/subjects\/[^/]+\/announcements/.test(pathname)) {
    const subjectId = pathname.split('/')[2];
    return {
      isRoot: false,
      title: 'Subject Notices',
      showBack: true,
      backHref: `/subjects/${subjectId}`,
    };
  }

  if (/^\/subjects\/[^/]+\/materials/.test(pathname)) {
    const subjectId = pathname.split('/')[2];
    return {
      isRoot: false,
      title: 'Study Materials',
      showBack: true,
      backHref: `/subjects/${subjectId}`,
    };
  }

  if (/^\/subjects\/[^/]+\/assignments\/.+/.test(pathname)) {
    const subjectId = pathname.split('/')[2];
    return {
      isRoot: false,
      title: 'Assignment Details',
      showBack: true,
      backHref: `/subjects/${subjectId}/assignments`,
    };
  }

  if (/^\/subjects\/[^/]+\/assignments/.test(pathname)) {
    const subjectId = pathname.split('/')[2];
    return {
      isRoot: false,
      title: 'Course Tasks',
      showBack: true,
      backHref: `/subjects/${subjectId}`,
    };
  }

  if (/^\/subjects\/[^/]+$/.test(pathname)) {
    return {
      isRoot: false,
      title: 'Course Overview',
      showBack: true,
      backHref: '/subjects',
    };
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    const sub = pathname.replace('/admin/', '');
    const capitalized = sub.charAt(0).toUpperCase() + sub.slice(1);
    return {
      isRoot: false,
      title: capitalized ? `Admin • ${capitalized}` : 'Administration',
      showBack: true,
      backHref: '/dashboard',
    };
  }

  return {
    isRoot: false,
    title: 'studchat',
    showBack: true,
    backHref: '/dashboard',
  };
}
