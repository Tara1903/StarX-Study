import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';

interface AcademicReviewStepProps {
  data: SignupState;
  onNext: () => void;
  onPrev: () => void;
}

export function AcademicReviewStep({ data, onNext, onPrev }: AcademicReviewStepProps) {
  return (
    <div className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">Review your details</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[#A8B2C2] text-sm">Account Type</span>
            <span className="text-white font-medium capitalize">{data.role?.replace('_', ' ')}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[#A8B2C2] text-sm">Full Name</span>
            <span className="text-white font-medium">{data.fullName}</span>
          </div>

          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[#A8B2C2] text-sm">Institution</span>
            <span className="text-white font-medium">{data.universityName}</span>
          </div>

          {data.campusId && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[#A8B2C2] text-sm">Campus</span>
              <span className="text-white font-medium capitalize">{data.campusId}</span>
            </div>
          )}

          {data.departmentId && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[#A8B2C2] text-sm">Department</span>
              <span className="text-white font-medium uppercase">{data.departmentId}</span>
            </div>
          )}

          {data.role === 'teacher' && data.designation && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[#A8B2C2] text-sm">Designation</span>
              <span className="text-white font-medium">{data.designation}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all group"
      >
        Confirm & Continue
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
