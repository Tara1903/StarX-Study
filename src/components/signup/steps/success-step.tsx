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
        <h2 className="text-3xl font-bold tracking-tight text-white">Check your email</h2>
        <p className="text-[#A8B2C2] max-w-[320px] mx-auto leading-relaxed text-sm">
          Welcome to studchat, <span className="font-semibold text-white">{data.fullName}</span>! We&apos;ve sent a verification link to <span className="font-medium text-white">{data.email}</span>.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-white/5 bg-white/5 w-full text-xs text-[#A8B2C2] space-y-1 text-left">
        <p className="font-medium text-white">Next step:</p>
        <p>Click the link in the email to verify your address, then sign in to access your classes and study groups.</p>
      </div>

      <div className="w-full space-y-3 pt-2">
        <Link
          href={`/verify-email?email=${encodeURIComponent(data.email || '')}`}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#168BFF] px-4 py-3 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all shadow-sm"
        >
          View Verification Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 px-4 py-3 text-sm font-medium text-[#A8B2C2] hover:text-white transition-all"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
