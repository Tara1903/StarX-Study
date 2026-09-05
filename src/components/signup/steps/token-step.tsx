import { useState } from 'react';
import { Building, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';

import { validateProvisioningToken } from '@/actions/invite';

interface TokenStepProps {
  data: SignupState;
  onNext: (data: Partial<SignupState>) => void;
  onPrev: () => void;
}

export function TokenStep({ data, onNext, onPrev }: TokenStepProps) {
  const [token, setToken] = useState(data.token || '');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }
    
    setIsValidating(true);
    setError('');
    
    try {
      const res = await validateProvisioningToken(token);
      if (!res.success || !res.data) {
        setError(res.error || 'Invalid or expired provisioning token');
        return;
      }

      onNext(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to validate token');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <form onSubmit={handleValidate} className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">Provisioning Token</h2>
      </div>

      <div className="text-sm text-[#A8B2C2] mb-4">
        As an Institute Head, you need a secure provisioning token provided by the platform administrators to establish your institution.
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#F5F7FB]">Enter Token</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Building className="h-5 w-5 text-[#6F7B8E]" />
            </div>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
              } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
              placeholder="PT-XXXXXXXXXXXXXXXX"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isValidating}
        className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all group disabled:opacity-50"
      >
        {isValidating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Verify Token
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
