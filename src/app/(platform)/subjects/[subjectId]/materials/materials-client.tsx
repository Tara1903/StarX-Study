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
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  created_at?: string;
  category: string;
  size?: string;
}

interface MaterialsClientProps {
  subject: {
    id: string;
    name: string;
    facultyName: string;
    color?: string;
  };
  materials: MaterialItem[];
}

export function MaterialsClient({ subject, materials }: MaterialsClientProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'notes' | 'documents'>('all');

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        !search.trim() ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.file_name && m.file_name.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (filter === 'notes') {
        matchesFilter = m.category.toLowerCase().includes('note') || m.category.toLowerCase().includes('syllabus');
      } else if (filter === 'documents') {
        matchesFilter = !m.category.toLowerCase().includes('note');
      }

      return matchesSearch && matchesFilter;
    });
  }, [materials, search, filter]);

  const getIcon = (type?: string, cat?: string) => {
    if (type?.includes('image') || cat?.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />;
    }
    return <FileText className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {subject.name}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Materials
          </h1>
          <p className="text-sm text-muted-foreground">
            {subject.name} • {subject.facultyName}
          </p>
        </div>

        <Link
          href={`/subjects/${subject.id}/chat`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Go to Chat</span>
        </Link>
      </header>

      {/* Search & Minimal Filters (Section 31 & 32) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-9 pr-4 py-1.5 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'notes', 'documents'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* File List Rows (Section 31 standard: clean file library rows) */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            No materials found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  {getIcon(item.file_type, item.category)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.category.toUpperCase()} <span className="opacity-40">•</span> {item.size || '1.5 MB'}
                  </p>
                </div>
              </div>

              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => toast.success(`Downloading ${item.title}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
