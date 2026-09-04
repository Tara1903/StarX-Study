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
  FileText, 
  Image as ImageIcon, 
  Eye, 
  X, 
  CheckCircle2, 
  Bookmark,
  Calendar,
  Layers,
  Edit3,
  Camera,
  Sparkles,
  Lock,
  Bell,
  BellRing,
  KeyRound,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AvatarSelectorDialog } from '@/components/profile/avatar-selector-dialog';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { getStoredMedia, removeStoredMediaItem, StoredMediaItem } from '@/lib/stored-media';
import { updateUserPassword } from '@/actions/profile';
import { toast } from 'sonner';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const { activeRole, profile: initialProfile } = useUser();
  const [userProfile, setUserProfile] = useState<Partial<Profile>>(initialProfile || {});
  const [authUser, setAuthUser] = useState<any>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<{
    id: string;
    name: string;
    code?: string;
    color?: string;
    role?: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Dialog states
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Stored Media state
  const [storedMedia, setStoredMedia] = useState<StoredMediaItem[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'document'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<StoredMediaItem | null>(null);

  // Notification Preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    mainAnnouncements: true,
    subjectMessages: true,
    mentions: true,
    replies: true,
    assignments: true,
    grading: true,
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'notifications' | 'security'>('overview');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUser(user);
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (dbProfile) {
          setUserProfile((prev) => ({ ...prev, ...dbProfile }));
        }

        const { data: dbMembers } = await supabase
          .from('subject_members')
          .select(`
            role,
            subject:subjects(
              id,
              name,
              color,
              icon,
              code
            )
          `)
          .eq('user_id', user.id);

        if (dbMembers) {
          const subs = dbMembers
            .map((m: any) => ({
              id: m.subject?.id,
              name: m.subject?.name,
              color: m.subject?.color || '#3B82F6',
              code: m.subject?.code || '',
              role: m.role,
            }))
            .filter((s: any) => s.id);
          setEnrolledSubjects(subs);
        }
      }

      // Load notification preferences from localStorage if exists
      if (typeof window !== 'undefined') {
        const savedPrefs = localStorage.getItem('studchat_notif_preferences');
        if (savedPrefs) {
          try {
            setNotifPrefs(JSON.parse(savedPrefs));
          } catch {
            // fallback to default
          }
        }
      }

      setLoading(false);
    }
    loadData();

    // Load initial stored media
    setStoredMedia(getStoredMedia());

    // Listen to stored media updates
    const handleMediaUpdated = (e: any) => {
      setStoredMedia(e.detail || getStoredMedia());
    };
    window.addEventListener('studchat_media_updated', handleMediaUpdated);
    return () => {
      window.removeEventListener('studchat_media_updated', handleMediaUpdated);
    };
  }, [supabase]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out of StudChat?')) {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    }
  };

  const handleToggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('studchat_notif_preferences', JSON.stringify(updated));
      }
      return updated;
    });
    toast.success('Notification preference updated.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await updateUserPassword(newPassword);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Password updated successfully via Supabase Auth.');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password.');
    } finally {
      setIsChangingPassword(false);
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
      if (mediaFilter === 'image' && item.type !== 'image') return false;
      if (mediaFilter === 'document' && item.type === 'image') return false;
      if (subjectFilter !== 'all' && item.subjectName !== subjectFilter) return false;

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
      <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-xs text-muted-foreground font-medium">Loading your StudChat identity...</p>
      </div>
    );
  }

  const displayName = userProfile.display_name || userProfile.full_name || 'Student';
  const fullName = userProfile.full_name || authUser?.email?.split('@')[0] || 'Student';
  const email = authUser?.email || userProfile.email || 'student@sageuniversity.edu.in';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8 pb-16">
      
      {/* ============================================ */}
      {/* 1. PROFILE HEADER */}
      {/* ============================================ */}
      <div className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl relative">
        {/* Banner with Brand Glow */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-950 via-indigo-950 to-primary/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-4 sm:left-6 top-4 sm:top-6 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Verified Institutional Profile</span>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 sm:gap-5 -mt-14 sm:-mt-20 mb-4">
            {/* Avatar with Edit Badge */}
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarSelectorOpen(true)}>
              <UserAvatar
                name={fullName}
                avatarType={userProfile.avatar_type}
                avatarUrl={userProfile.avatar_url}
                avatarPresetId={userProfile.avatar_preset_id}
                avatarEmoji={userProfile.avatar_emoji}
                avatarStyle={userProfile.avatar_style}
                size="2xl"
                className="ring-4 ring-card shadow-2xl transition-transform group-hover:scale-105"
              />
              <div 
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[11px] font-bold backdrop-blur-[1px]"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5 text-primary" />
                <span>Edit</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsAvatarSelectorOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Change Avatar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Identity Info */}
          <div className="space-y-2 text-center sm:text-left pt-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {fullName}
              </h1>
              {userProfile.display_name && (
                <span className="text-sm font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-lg border border-border">
                  @{userProfile.display_name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
                <Shield className="w-3 h-3" />
                {activeRole.replace('_', ' ') || 'Student'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-foreground/90 flex items-center justify-center sm:justify-start gap-2 font-medium">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Institute of Engineering & Technology (IET) • SAGE University, Indore</span>
            </p>

            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
              <span>B.Tech • Electronics & Communication Engineering (ECE) • Sem 1 • Sec A</span>
            </p>

            {userProfile.bio ? (
              <p className="text-xs text-foreground/90 max-w-2xl pt-2 leading-relaxed italic bg-muted/30 p-3 rounded-xl border border-border/60">
                "{userProfile.bio}"
              </p>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">
                No bio added yet.{' '}
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  Add a short bio
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 2. PROFILE SECTION TABS */}
      {/* ============================================ */}
      <div className="flex items-center gap-1 border-b border-white/10 sm:border-border pb-px overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'overview', label: 'Profile', icon: User },
          { id: 'media', label: `Stored Media (${storedMedia.length})`, icon: FolderArchive },
          { id: 'notifications', label: 'Preferences', icon: BellRing },
          { id: 'security', label: 'Security', icon: KeyRound },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap active:scale-95 transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Personal Information</span>
            </h2>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Official Full Name</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{fullName}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{userProfile.display_name || 'Not configured'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registered Email</span>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium text-foreground">{email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact Phone</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{userProfile.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Academic / Professional Context */}
        <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Academic Context</span>
            </h2>
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
              Institution Managed
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">University</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">Institute of Engineering & Technology (IET)</p>
              <p className="text-muted-foreground">SAGE University, Indore (M.P.)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Department</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">ECE</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Program & Year</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">B.Tech 1st Year (2026)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Semester & Section</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">Semester 1 • Section A</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classroom Venue</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">Room No. 03 (IET Block)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 3. MY SUBJECTS SUMMARY */}
      {/* ============================================ */}
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>My Enrolled Subjects</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active curriculum courses for Electronics and Communication Engineering (Semester 1)
            </p>
          </div>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View all subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {enrolledSubjects.length === 0 ? (
            <div className="col-span-full py-8 text-center border border-dashed border-border rounded-2xl bg-muted/10">
              <p className="text-xs text-muted-foreground">No enrolled subjects found.</p>
            </div>
          ) : (
            enrolledSubjects.map((sub) => (
              <Link
                key={sub.id}
                href={`/subjects/${sub.id}`}
                className="p-3.5 rounded-2xl border border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div 
                    className="w-3 h-9 rounded-full shrink-0" 
                    style={{ backgroundColor: sub.color }} 
                  />
                  <div className="truncate">
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {sub.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {sub.code ? `${sub.code} • ` : ''}{sub.role === 'teacher' ? 'Faculty' : 'Student'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
      </>
      )}

      {/* ============================================ */}
      {/* 4. STORED MEDIA & FILES GALLERY */}
      {/* ============================================ */}
      {activeTab === 'media' && (
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-primary" />
                <span>Stored Media & Files</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                {storedMedia.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Resources, photos, and study documents you stored from your subject chats
            </p>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'image', 'document'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMediaFilter(t)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer ${
                  mediaFilter === t
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t === 'all' ? 'All Files' : t === 'image' ? 'Images' : 'Documents'}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Subject Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stored files by name or teacher..."
              className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {availableSubjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Gallery Grid */}
        {filteredMedia.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/10 flex flex-col items-center justify-center gap-2">
            <FolderArchive className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">No media stored yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm">
              Click the "Store Media" button on any image or handout in chat to save it here for quick access anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="bg-muted/20 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all flex flex-col group shadow-sm"
              >
                {item.type === 'image' ? (
                  <div 
                    className="h-36 w-full relative bg-muted cursor-pointer overflow-hidden group/img"
                    onClick={() => setPreviewImage(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-36 w-full bg-muted/40 flex flex-col items-center justify-center gap-1 p-3 border-b border-border/60">
                    <FileText className="w-8 h-8 text-primary" />
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                      {item.name.split('.').pop() || 'DOCUMENT'}
                    </span>
                  </div>
                )}

                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-primary truncate">
                        {item.subjectName || 'ECE Core'}
                      </span>
                      {item.size && (
                        <span className="text-[10px] text-muted-foreground">{item.size}</span>
                      )}
                    </div>
                    <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      From {item.senderName || 'Class'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStoredMedia(item.id, item.name)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ============================================ */}
      {/* 5. NOTIFICATION PREFERENCES */}
      {/* ============================================ */}
      {activeTab === 'notifications' && (
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
        <div className="border-b border-border pb-3">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" />
            <span>Notification Preferences</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure how and when you receive academic notifications on StudChat
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {[
            { key: 'mainAnnouncements', label: 'Main Announcements', desc: 'University-wide and department notices' },
            { key: 'subjectMessages', label: 'Subject Chat Messages', desc: 'Live messages in enrolled subject spaces' },
            { key: 'mentions', label: 'Mentions & Direct Replies', desc: 'When teachers or classmates mention you' },
            { key: 'assignments', label: 'Assignments & Deadlines', desc: 'Upcoming assignment due dates and task posts' },
            { key: 'grading', label: 'Continuous Evaluation & Grades', desc: 'Evaluation updates on submitted coursework' },
          ].map((item) => {
            const isEnabled = notifPrefs[item.key as keyof typeof notifPrefs];

            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleNotif(item.key as keyof typeof notifPrefs)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isEnabled ? 'bg-primary' : 'bg-muted border border-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      isEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ============================================ */}
      {/* 6. SECURITY & ACCOUNT MANAGEMENT */}
      {/* ============================================ */}
      {activeTab === 'security' && (
      <>
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
        <div className="border-b border-border pb-3">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span>Security & Authentication</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your password and active security sessions via Supabase Auth
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-1">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-muted/40 border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-muted/40 border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword || !newPassword}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ============================================ */}
      {/* 7. DANGER ZONE */}
      {/* ============================================ */}
      <div className="bg-card border border-destructive/30 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="border-b border-border pb-3">
          <h2 className="font-bold text-base text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Session termination and security departure
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <p className="text-xs font-semibold text-foreground">Sign Out of StudChat</p>
            <p className="text-[11px] text-muted-foreground">
              Terminates your active authentication session on this device.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* Avatar Selector Dialog */}
      <AvatarSelectorDialog
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        currentProfile={userProfile}
        onAvatarSaved={(updatedData) => {
          setUserProfile((prev) => ({ ...prev, ...updatedData }));
        }}
      />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={userProfile}
        onProfileUpdated={(updatedData) => {
          setUserProfile((prev) => ({ ...prev, ...updatedData }));
        }}
      />

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
