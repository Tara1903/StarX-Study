"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Download, 
  FileText, 
  ImageIcon, 
  FileIcon, 
  ArrowLeft, 
  MessageSquare,
  Plus,
  Trash2,
  X,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadMaterial, deleteMaterial } from '@/actions/materials';

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  created_at?: string;
  category: string;
  size?: string;
  uploadedBy?: string;
}

interface MaterialsClientProps {
  subject: {
    id: string;
    uuid: string;
    name: string;
    facultyName: string;
    color?: string;
  };
  materials: MaterialItem[];
  isTeacher?: boolean;
  currentUserId?: string;
}

export function MaterialsClient({ subject, materials, isTeacher = false, currentUserId }: MaterialsClientProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'notes' | 'documents'>('all');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Lecture Notes');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        !search.trim() ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.file_name && m.file_name.toLowerCase().includes(search.toLowerCase())) ||
        (m.topic && m.topic.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (filter === 'notes') {
        matchesFilter = m.category.toLowerCase().includes('note') || m.category.toLowerCase().includes('syllabus');
      } else if (filter === 'documents') {
        matchesFilter = !m.category.toLowerCase().includes('note');
      }

      return matchesSearch && matchesFilter;
    });
  }, [materials, search, filter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for the material');
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('subject_id', subject.uuid);
      fd.append('title', title.trim());
      fd.append('topic', topic);
      if (description.trim()) fd.append('description', description.trim());
      fd.append('file_name', fileName.trim() || `${title.replace(/\s+/g, '_')}.pdf`);
      fd.append('file_type', 'application/pdf');
      fd.append('file_size', String(1024 * 1024 * 2)); // ~2MB

      const res = await uploadMaterial(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Material "${title}" uploaded`);
      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setFileName('');
    } catch {
      toast.error('Failed to upload material');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this course material?')) return;
    try {
      setDeletingId(materialId);
      const res = await deleteMaterial(materialId, subject.uuid);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Course material deleted');
    } catch {
      toast.error('Failed to delete material');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {subject.name}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Materials
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {subject.name} • {subject.facultyName}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isTeacher && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          )}

          <Link
            href={`/chat/${subject.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Class Chat</span>
          </Link>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials by title or topic..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {(['all', 'notes', 'documents'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Roster */}
      {materials.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Materials Uploaded</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTeacher
              ? 'No course materials have been shared for this subject yet. Use the "Upload Material" button above to publish reference documents, notes, or slides.'
              : 'Your instructor has not uploaded any course files for this subject yet.'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
          No materials match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {item.size || '2.0 MB'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-foreground truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                <span className="text-[11px] text-muted-foreground truncate">
                  {item.file_name || 'document.pdf'}
                </span>

                <div className="flex items-center gap-1">
                  {isTeacher && (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete material"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <a
                    href={item.file_url}
                    download={item.file_name}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Material Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-base font-bold text-foreground">Upload Course Material</h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Material Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 2 Lecture Notes, Formula Sheet"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Topic / Category</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Lab Manual">Lab Manual</option>
                  <option value="Problem Set">Problem Set</option>
                  <option value="Reference Reading">Reference Reading</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">File Name / Document</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. unit2_derivation_notes.pdf"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the material..."
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Upload Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
