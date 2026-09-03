import { SignupWizard } from '@/components/signup-wizard';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join studchat</h1>
          <p className="text-slate-400">Chat. Share. Learn. Together.</p>
        </div>
        <SignupWizard />
      </div>
    </div>
  );
}
