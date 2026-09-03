'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  Shield, 
  GraduationCap, 
  Building2, 
  FolderArchive, 
  Download, 
  Trash2, 
  Search, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  X, 
  CheckCircle2, 
  Bookmark,
  Calendar,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { getStoredMedia, removeStoredMediaItem, StoredMediaItem } from '@/lib/stored-media';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { activeRole, profile } = useUser();
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Profile tabs: 'media' or 'account'
  const [activeTab, setActiveTab] = useState<'media' | 'account'>('media');

  // Stored Media state
  const [storedMedia, setStoredMedia] = useState<StoredMediaItem[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'document'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<StoredMediaItem | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        setUser({ ...authUser, ...dbProfile });
      }
      setLoading(false);
    }
    loadUser();

    // Load initial stored media
    setStoredMedia(getStoredMedia());

    // Listen to storage update events
    const handleMediaUpdated = (e: any) => {
      if (e.detail) {
        setStoredMedia(e.detail);
      } else {
        setStoredMedia(getStoredMedia());
      }
    };
    window.addEventListener('studchat_media_updated', handleMediaUpdated);
    return () => {
      window.removeEventListener('studchat_media_updated', handleMediaUpdated);
    };
  }, [supabase]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    }
  };

  const handleDeleteStoredMedia = (id: string, name: string) => {
    removeStoredMediaItem(id);
    setStoredMedia((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Removed "${name}" from stored media.`);
    if (previewImage?.id === id) {
      setPreviewImage(null);
    }
  };

  const handleDownload = (item: StoredMediaItem) => {
    // Open in new tab or trigger download
    window.open(item.url, '_blank');
    toast.success(`Opening ${item.name}`);
  };

  // Distinct subjects from stored media
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    storedMedia.forEach((item) => {
      if (item.subjectName) subjects.add(item.subjectName);
    });
    return Array.from(subjects);
  }, [storedMedia]);

  // Filtered stored media
  const filteredMedia = useMemo(() => {
    return storedMedia.filter((item) => {
      // Type filter
      if (mediaFilter === 'image' && item.type !== 'image') return false;
      if (mediaFilter === 'document' && item.type === 'image') return false;

      // Subject filter
      if (subjectFilter !== 'all' && item.subjectName !== subjectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSubject = item.subjectName?.toLowerCase().includes(q) || false;
        const matchesSender = item.senderName?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSubject && !matchesSender) return false;
      }

      return true;
    });
  }, [storedMedia, mediaFilter, subjectFilter, searchQuery]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm relative">
        <div className="h-32 sm:h-36 bg-gradient-to-r from-blue-900 via-indigo-950 to-primary/70 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-card bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-lg text-primary text-3xl font-black">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span>{(profile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Student'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
                    <Shield className="w-3 h-3" />
                    {activeRole.replace('_', ' ') || 'Student'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>B.Tech • Electronics & Communication Engineering (ECE)</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>IET, SAGE University, Indore</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-border transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Stored Media & Files</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
              {storedMedia.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Academic & Account Settings</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Stored Media & Files */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMediaFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                All Files ({storedMedia.length})
              </button>

              <button
                type="button"
                onClick={() => setMediaFilter('image')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === 'image'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Images & Diagrams ({storedMedia.filter((m) => m.type === 'image').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaFilter('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === 'document'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents & PDFs ({storedMedia.filter((m) => m.type !== 'image').length})</span>
              </button>
            </div>

            {/* Subject Selector & Search */}
            <div className="flex items-center gap-2">
              {availableSubjects.length > 0 && (
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-muted/60 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stored media..."
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stored Media Gallery Grid */}
          {filteredMedia.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-3xl bg-card/40 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FolderArchive className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-foreground">No stored media found</h3>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                {searchQuery
                  ? `No media matches "${searchQuery}". Try a different filter.`
                  : "You haven't stored any images or documents yet. When you receive a photo, formula sheet, or PDF in chat, click the 'Store Media' button to save it directly into this gallery."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMedia.map((item) => {
                const isImage = item.type === 'image';

                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-all flex flex-col group"
                  >
                    {/* Visual Preview */}
                    {isImage ? (
                      <div 
                        className="h-44 w-full relative bg-muted cursor-pointer overflow-hidden group/img"
                        onClick={() => setPreviewImage(item)}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                          <Eye className="w-5 h-5" />
                          <span className="text-xs font-semibold">Click to Preview</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-muted/40 flex flex-col items-center justify-center gap-2 p-4 border-b border-border/60">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <FileText className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-mono uppercase font-bold text-muted-foreground">
                          {item.name.split('.').pop() || 'DOCUMENT'}
                        </span>
                      </div>
                    )}

                    {/* Meta Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {/* Subject Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 truncate">
                            <Bookmark className="w-3 h-3" />
                            {item.subjectName || 'ECE Core Subject'}
                          </span>
                          {item.size && (
                            <span className="text-[10px] text-muted-foreground">{item.size}</span>
                          )}
                        </div>

                        {/* File Name */}
                        <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>

                        {/* Sender & Date */}
                        <div className="text-[11px] text-muted-foreground mt-2 space-y-0.5">
                          {item.senderName && (
                            <p className="truncate">From: <strong className="text-foreground/90">{item.senderName}</strong></p>
                          )}
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Saved on {new Date(item.savedAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStoredMedia(item.id, item.name)}
                          title="Remove from stored media"
                          className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Academic & Account Details */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Institutional Information */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b pb-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>Institutional Enrollment Details</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">University</p>
                <p className="font-medium text-foreground text-sm mt-0.5">Institute of Engineering & Technology (IET)</p>
                <p className="text-muted-foreground">SAGE University, Indore (M.P.)</p>
              </div>

              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Department</p>
                <p className="font-medium text-foreground text-sm mt-0.5">Electronics and Communication Engineering (ECE)</p>
              </div>

              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Academic Term</p>
                <p className="font-medium text-foreground text-sm mt-0.5">B.Tech 1st Year • Semester 1 (2026-2030)</p>
              </div>

              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Class & Venue</p>
                <p className="font-medium text-foreground text-sm mt-0.5">Section A • Room No. 03 (IET Block)</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b pb-3">
              <User className="w-5 h-5 text-primary" />
              <span>Contact & Security</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Registered Email</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">{user?.email || 'student@sageuniversity.edu.in'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Emergency Phone</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">{user?.phone || '+91 98765 43210'}</p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  Password changes and biometrics can be managed via the SAGE ERP Portal.
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/30">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate">{previewImage.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {previewImage.subjectName} • Saved {new Date(previewImage.savedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(previewImage)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
