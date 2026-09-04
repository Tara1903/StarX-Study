'use client';

import { useState } from 'react';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getEligibleUsersToAdd, type GroupMember } from '@/lib/group-info-data';
import { addGroupMemberAction } from '@/actions/group-info';
import { toast } from 'sonner';

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentMemberIds: string[];
  onMemberAdded?: (member: GroupMember) => void;
}

export function AddMemberDialog({
  isOpen,
  onClose,
  conversationId,
  currentMemberIds,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<GroupMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const candidates = getEligibleUsersToAdd(conversationId, currentMemberIds);
  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedCandidate) return;
    try {
      setIsSubmitting(true);
      const res = await addGroupMemberAction(conversationId, selectedCandidate.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Added ${selectedCandidate.name} to the group`);
      onMemberAdded?.(selectedCandidate);
      onClose();
    } catch {
      toast.error('Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-[#070E1B] border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-base font-bold text-foreground">Add People</h3>
            <p className="text-xs text-muted-foreground">Select authorized cohort members</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add member"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search eligible students or faculty..."
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto space-y-1 py-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No eligible cohort candidates found.
            </p>
          ) : (
            filtered.map((candidate) => {
              const isSelected = selectedCandidate?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-primary/15 border-primary/40 text-foreground'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <UserAvatar
                      name={candidate.name}
                      avatarType={candidate.avatarType || 'preset'}
                      avatarPresetId={candidate.avatarPresetId}
                      avatarEmoji={candidate.avatarEmoji}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{candidate.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{candidate.subtitle}</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedCandidate || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Selected</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
