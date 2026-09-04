'use client';

import { X, Download, ExternalLink } from 'lucide-react';
import type { SharedMediaItem } from '@/lib/group-info-data';

interface ImageViewerModalProps {
  item: SharedMediaItem | null;
  onClose: () => void;
}

export function ImageViewerModal({ item, onClose }: ImageViewerModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-150 p-4">
      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <p className="text-xs text-white/70">Shared by {item.sharedBy} • {item.sharedAt}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            download={item.name}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl">
        <img
          src={item.url}
          alt={item.name}
          className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
        />
      </div>
    </div>
  );
}
