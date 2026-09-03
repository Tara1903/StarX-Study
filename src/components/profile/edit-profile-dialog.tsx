"use client";

import { useState } from 'react';
import { X, Check, Loader2, User, FileText, Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/actions/profile';
import { toast } from 'sonner';
import type { Profile } from '@/types';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Partial<Profile>;
  onProfileUpdated: (updated: Partial<Profile>) => void;
}

export function EditProfileDialog({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
      };

      const result = await updateProfile(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onProfileUpdated(payload);
      toast.success('Profile updated successfully!');
      onClose();
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div 
        className="bg-card border-t sm:border border-border/80 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Edit Personal Information</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Update your display identity and bio on StudChat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {/* Full Name (Read-only / verified) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between mb-1.5">
              <span>Full Name (Official Record)</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Institution Controlled
              </span>
            </label>
            <input
              type="text"
              value={profile.full_name || ''}
              disabled
              className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Display Name (Nickname / Preferred Name)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Tara or TS"
              maxLength={50}
              className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Visible to classmates and teachers across subject chats.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
              <span>Short Academic Bio</span>
              <span className="text-[10px] text-muted-foreground">{bio.length}/300</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your academic interests, project focus, or technical skills..."
              maxLength={300}
              rows={3}
              className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none resize-none transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Emergency Contact Phone (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              maxLength={20}
              className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none text-xs rounded-xl h-10 sm:h-9"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-10 sm:h-9 shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
