import { User, BookOpen, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import { SignupState, UserRole } from '../onboarding-wizard';

interface RoleStepProps {
  data: SignupState;
  onNext: (data: Partial<SignupState>) => void;
  onPrev: () => void;
}

export function RoleStep({ data, onNext, onPrev }: RoleStepProps) {
  const handleSelectRole = (role: UserRole) => {
    onNext({ role });
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">How will you use StarX Study?</h2>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleSelectRole('student')}
          className={`w-full flex items-center p-4 rounded-xl border transition-all text-left group ${
            data.role === 'student' ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Student</h3>
            <p className="text-sm text-muted-foreground">Join classes, chat, and access materials.</p>
          </div>
        </button>

        <button
          onClick={() => handleSelectRole('teacher')}
          className={`w-full flex items-center p-4 rounded-xl border transition-all text-left group ${
            data.role === 'teacher' ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Teacher</h3>
            <p className="text-sm text-muted-foreground">Manage subjects, assignments, and students.</p>
          </div>
        </button>

        <button
          onClick={() => handleSelectRole('institute_head')}
          className={`w-full flex items-center p-4 rounded-xl border transition-all text-left group ${
            data.role === 'institute_head' ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Institute Head</h3>
            <p className="text-sm text-muted-foreground">Manage your entire institution's workspace.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
