'use client';

import { useState, useMemo } from 'react';
import { X, FileText, ExternalLink, Image as ImageIcon, Download, Search } from 'lucide-react';
import type { SharedMediaItem } from '@/lib/group-info-data';
import { cn } from '@/lib/utils';

interface MediaBrowserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  media: SharedMediaItem[];
  groupName: string;
  onSelectImage: (item: SharedMediaItem) => void;
}

export function MediaBrowserDialog({
  isOpen,
  onClose,
  media,
  groupName,
  onSelectImage,
}: MediaBrowserDialogProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'links'>('media');
  const [searchQuery, setSearchQuery] = useState('');

  const images = useMemo(() => media.filter((m) => m.type === 'image'), [media]);
  const docs = useMemo(() => media.filter((m) => m.type === 'document'), [media]);
  const links = useMemo(() => media.filter((m) => m.type === 'link'), [media]);

  const filteredItems = useMemo(() => {
    let current = activeTab === 'media' ? images : activeTab === 'docs' ? docs : links;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      current = current.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.sharedBy.toLowerCase().includes(q) ||
          (m.domain && m.domain.toLowerCase().includes(q))
      );
    }
    return current;
  }, [activeTab, images, docs, links, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-[#08110B]/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Media, links and docs</h2>
            <p className="text-xs text-muted-foreground truncate">{groupName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close media browser"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs Controls */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-white/10 space-y-3 shrink-0">
          {/* Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                activeTab === 'media'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Media ({images.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                activeTab === 'docs'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Docs ({docs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                activeTab === 'links'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Links ({links.length})
            </button>
          </div>

          {/* Search bar inside media */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Content Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {activeTab === 'media'
                  ? 'No media shared yet'
                  : activeTab === 'docs'
                  ? 'No documents shared yet'
                  : 'No links shared yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Files and media sent in this conversation will be organized here automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Media Tab Grid */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectImage(item)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <span className="text-[10px] text-white font-medium truncate">{item.name}</span>
                        <span className="text-[9px] text-white/70">{item.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Docs Tab List */}
              {activeTab === 'docs' && (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.size} • Shared by {item.sharedBy} • {item.sharedAt}
                          </p>
                        </div>
                      </div>

                      <a
                        href={item.url}
                        download={item.name}
                        className="p-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all shrink-0 cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Links Tab List */}
              {activeTab === 'links' && (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        {item.domain && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 inline-block mb-1">
                            {item.domain}
                          </span>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.url} • {item.sharedAt}
                        </p>
                      </div>

                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
