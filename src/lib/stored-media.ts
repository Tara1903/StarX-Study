export interface StoredMediaItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  size?: string;
  subjectId?: string;
  subjectName?: string;
  senderName?: string;
  savedAt: string;
}

const STORAGE_KEY = 'starx_stored_media';
const LEGACY_STORAGE_KEY = 'studchat_stored_media';

const DEFAULT_STORED_MEDIA: StoredMediaItem[] = [];

export function getStoredMedia(): StoredMediaItem[] {
  if (typeof window === 'undefined') return DEFAULT_STORED_MEDIA;
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Fallback migration from legacy key
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        saved = legacy;
      }
    }
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STORED_MEDIA));
      return DEFAULT_STORED_MEDIA;
    }
    return JSON.parse(saved);
  } catch {
    return DEFAULT_STORED_MEDIA;
  }
}

export function saveMediaItem(item: Omit<StoredMediaItem, 'id' | 'savedAt'>): StoredMediaItem {
  const current = getStoredMedia();
  
  // Check if already stored by url or name
  const existing = current.find((m) => m.url === item.url || (m.name === item.name && m.subjectId === item.subjectId));
  if (existing) {
    return existing;
  }

  const newItem: StoredMediaItem = {
    ...item,
    id: `stored_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    savedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so profile tab automatically updates if open
    window.dispatchEvent(new CustomEvent('starx_media_updated', { detail: updated }));
  }

  return newItem;
}

export function removeStoredMediaItem(id: string): void {
  const current = getStoredMedia();
  const updated = current.filter((m) => m.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('starx_media_updated', { detail: updated }));
  }
}

export function isMediaStored(urlOrName: string): boolean {
  const current = getStoredMedia();
  return current.some((m) => m.url === urlOrName || m.name === urlOrName);
}
