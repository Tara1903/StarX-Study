"use client";

import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Smile, 
  Trash2, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { 
  STUDCHAT_PRESETS, 
  APPROVED_EMOJIS, 
  APPROVED_AVATAR_STYLES,
  type AvatarPreset,
  type ApprovedEmoji,
  type AvatarStyle
} from '@/lib/avatar-presets';
import { updateAvatar } from '@/actions/profile';
import { toast } from 'sonner';
import type { Profile, AvatarType } from '@/types';

interface AvatarSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Partial<Profile>;
  onAvatarSaved: (updatedData: Partial<Profile>) => void;
}

export function AvatarSelectorDialog({
  isOpen,
  onClose,
  currentProfile,
  onAvatarSaved,
}: AvatarSelectorDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'emoji'>('preset');
  const [isSaving, setIsSaving] = useState(false);

  // Draft Avatar State
  const [draftType, setDraftType] = useState<AvatarType>(
    currentProfile.avatar_type || (currentProfile.avatar_url ? 'uploaded' : 'initials')
  );
  const [draftUrl, setDraftUrl] = useState<string | null>(currentProfile.avatar_url || null);
  const [draftPresetId, setDraftPresetId] = useState<string | null>(
    currentProfile.avatar_preset_id || STUDCHAT_PRESETS[0].id
  );
  const [draftEmoji, setDraftEmoji] = useState<string>(
    currentProfile.avatar_emoji || '🎓'
  );
  const [draftStyle, setDraftStyle] = useState<string>(
    currentProfile.avatar_style || APPROVED_AVATAR_STYLES[0].id
  );

  // Preset Category Filter
  const [presetCategory, setPresetCategory] = useState<string>('all');
  
  // File upload drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are supported.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setDraftUrl(result);
      setDraftType('uploaded');
      toast.success('Image loaded. Click "Save Avatar" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        avatar_type: draftType,
        avatar_url: draftType === 'uploaded' ? draftUrl : null,
        avatar_preset_id: draftType === 'preset' ? draftPresetId : null,
        avatar_emoji: draftType === 'emoji' ? draftEmoji : null,
        avatar_style: draftType === 'emoji' ? draftStyle : null,
      };

      const result = await updateAvatar(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onAvatarSaved(payload);
      toast.success('Profile avatar updated successfully!');
      onClose();
    } catch {
      toast.error('Failed to save avatar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsSaving(true);
      const payload = {
        avatar_type: 'initials' as AvatarType,
        avatar_url: null,
        avatar_preset_id: null,
        avatar_emoji: null,
        avatar_style: null,
      };

      const result = await updateAvatar(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setDraftType('initials');
      setDraftUrl(null);
      onAvatarSaved(payload);
      toast.success('Avatar removed. Restored initials fallback.');
      onClose();
    } catch {
      toast.error('Failed to remove avatar.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPresets = presetCategory === 'all'
    ? STUDCHAT_PRESETS
    : STUDCHAT_PRESETS.filter((p) => p.category === presetCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div 
        className="bg-card border-t sm:border border-border/80 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Personalize Your Avatar</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Choose an identity representation across StudChat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="p-4 bg-gradient-to-b from-muted/40 to-background border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={currentProfile.full_name || 'User'}
              avatarType={draftType}
              avatarUrl={draftUrl}
              avatarPresetId={draftPresetId}
              avatarEmoji={draftEmoji}
              avatarStyle={draftStyle}
              size="xl"
              className="ring-4 ring-primary/20 shadow-xl"
            />
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Live Preview
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                Type: <strong className="text-foreground">{draftType}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={draftType === 'initials'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Initials</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border px-4 bg-muted/10">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preset'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Avatars</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'emoji'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emoji Badge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: STUDIO AVATARS */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                {['all', 'academic', 'tech', 'minimal', 'abstract', 'creative'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all capitalize cursor-pointer ${
                      presetCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Preset Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {filteredPresets.map((preset) => {
                  const isSelected = draftType === 'preset' && draftPresetId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDraftPresetId(preset.id);
                        setDraftType('preset');
                      }}
                      className={`group relative p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-lg'
                          : 'border-border bg-card/60 hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                        dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                      />
                      <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] shadow-sm">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EMOJI BADGE */}
          {activeTab === 'emoji' && (
            <div className="space-y-5">
              {/* Select Style Background */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  1. Choose Brand Gradient Background:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {APPROVED_AVATAR_STYLES.map((st) => {
                    const isSelected = draftStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setDraftStyle(st.id);
                          setDraftType('emoji');
                        }}
                        className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: st.gradient, borderColor: st.border }}
                        title={st.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Emoji */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  2. Select StudChat Icon:
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {APPROVED_EMOJIS.map((emoji) => {
                    const isSelected = draftType === 'emoji' && draftEmoji === emoji;

                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setDraftEmoji(emoji);
                          setDraftType('emoji');
                        }}
                        className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/20 border-primary ring-2 ring-primary/40 scale-110 shadow-md'
                            : 'bg-muted/40 border-border hover:bg-muted hover:border-primary/40'
                        }`}
                      >
                        <span>{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD CUSTOM PHOTO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Click to select or drag photo here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JPG, PNG, or WEBP up to 5 MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
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
            type="button"
            onClick={handleSave}
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
                <span>Save Avatar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
