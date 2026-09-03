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

const STORAGE_KEY = 'studchat_stored_media';

const DEFAULT_STORED_MEDIA: StoredMediaItem[] = [
  {
    id: 'stored-1',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    name: 'Quantum_Mechanics_Wave_Function_Formulas.png',
    type: 'image',
    size: '1.4 MB',
    subjectId: 'chemistry',
    subjectName: 'Chemistry',
    senderName: 'Prof. Garima Pawar [GP]',
    savedAt: '2026-09-02T14:30:00Z',
  },
  {
    id: 'stored-2',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    name: 'Matrix_Eigenvalues_Diagonalization_Summary.png',
    type: 'image',
    size: '2.1 MB',
    subjectId: 'math-1',
    subjectName: 'Mathematics-I',
    senderName: 'Prof. Ruchi Shrivastava [RS]',
    savedAt: '2026-09-01T10:15:00Z',
  },
  {
    id: 'stored-3',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    name: 'Orthographic_Projection_Drawing_Sheet_Reference.jpg',
    type: 'image',
    size: '3.8 MB',
    subjectId: 'engineering-graphics',
    subjectName: 'Engineering Graphics',
    senderName: 'Prof. Vikas Bakshi [VB]',
    savedAt: '2026-08-30T16:45:00Z',
  },
];

export function getStoredMedia(): StoredMediaItem[] {
  if (typeof window === 'undefined') return DEFAULT_STORED_MEDIA;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
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
    window.dispatchEvent(new CustomEvent('studchat_media_updated', { detail: updated }));
  }

  return newItem;
}

export function removeStoredMediaItem(id: string): void {
  const current = getStoredMedia();
  const updated = current.filter((m) => m.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('studchat_media_updated', { detail: updated }));
  }
}

export function isMediaStored(urlOrName: string): boolean {
  const current = getStoredMedia();
  return current.some((m) => m.url === urlOrName || m.name === urlOrName);
}
