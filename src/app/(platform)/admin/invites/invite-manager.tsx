'use client';

import { useState } from 'react';
import { Plus, Copy, Check, Calendar, Trash2, ShieldAlert } from 'lucide-react';
import { generateInviteCode } from '@/actions/invite';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateInviteCodeSchema, GenerateInviteCodeInput } from '@/lib/validations/schemas';
import { UserRole } from '@/types/database';
import { z } from 'zod';

export function InviteManager({ universityId, initialInvites }: { universityId: string, initialInvites: any[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof generateInviteCodeSchema>>({
    resolver: zodResolver(generateInviteCodeSchema),
    defaultValues: {
      university_id: universityId,
      target_role: 'student',
      max_uses: 1,
      expires_in_days: 7,
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await generateInviteCode(data);
      if (res.success && res.data) {
        setInvites([res.data, ...invites]);
        reset();
      } else {
        alert(res.error || 'Failed to generate code');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Generate New Invite Code</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input type="hidden" {...register('university_id')} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select 
              {...register('target_role')} 
              className="w-full bg-background border border-input rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="institute_head">Institute Head</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Max Uses</label>
            <input 
              type="number" 
              {...register('max_uses', { valueAsNumber: true })} 
              className="w-full bg-background border border-input rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Expires In (Days)</label>
            <input 
              type="number" 
              {...register('expires_in_days', { valueAsNumber: true })} 
              className="w-full bg-background border border-input rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-[#12CFEA] text-primary-foreground h-10 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate</span>
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Active Invite Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Uses</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Created By</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No invite codes found. Generate one to get started.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="font-mono text-primary font-medium tracking-wider bg-primary/10 px-2 py-1 rounded inline-block">
                        {invite.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm">
                      {invite.target_role.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {invite.uses} / {invite.max_uses || '8'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {invite.created_by_profile?.full_name || 'Admin'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => copyToClipboard(invite.code)}
                        className="text-muted-foreground hover:text-foreground p-2 rounded transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === invite.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
