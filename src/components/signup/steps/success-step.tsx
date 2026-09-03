import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';

interface SuccessStepProps {
  data: SignupState;
}

export function SuccessStep({ data }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center w-full max-w-md mx-auto">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Account Created!</h2>
        <p className="text-[#A8B2C2] max-w-[300px] mx-auto leading-relaxed">
          Welcome to studchat, <br/>
          <span className="font-semibold text-white">{data.fullName}</span>
        </p>
      </div>

      <div className="p-4 rounded-xl border border-white/5 bg-white/5 w-full text-sm text-[#A8B2C2]">
        <p>
          Your academic placement at <strong>{data.universityName}</strong> is confirmed. You can now log in and start connecting.
        </p>
      </div>

      <Link
        href="/login"
        className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#168BFF] px-4 py-3 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all mt-4"
      >
        Continue to Login
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
