import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, BookOpen, Layers } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';

interface AcademicBranchStepProps {
  data: SignupState;
  onNext: (data: Partial<SignupState>) => void;
  onPrev: () => void;
}

export function AcademicBranchStep({ data, onNext, onPrev }: AcademicBranchStepProps) {
  const [selections, setSelections] = useState({
    campusId: data.campusId || '',
    departmentId: data.departmentId || '',
    programId: data.programId || '',
    semesterId: data.semesterId || '',
    designation: data.designation || ''
  });

  const isTeacher = data.role === 'teacher';

  const handleChange = (field: string, value: string) => {
    setSelections(p => ({ ...p, [field]: value }));
  };

  const handleNext = () => {
    onNext(selections);
  };

  const canProceed = () => {
    if (data.hasCampuses && !selections.campusId) return false;
    if (data.hasDepartments && !selections.departmentId) return false;
    if (isTeacher) {
      if (!selections.designation) return false;
    } else {
      // Student specific validation
      if (data.usesSemesters && !selections.semesterId) return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Academic Details</h2>
          <p className="text-sm text-[#A8B2C2] mt-1">{data.universityName}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.hasCampuses && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]">Campus</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Building className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <select
                value={selections.campusId}
                onChange={e => handleChange('campusId', e.target.value)}
                className="block w-full h-11 rounded-lg border border-white/10 bg-[#111D31] text-white pl-10 px-3 py-2 text-sm focus:border-[#168BFF] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/20 appearance-none"
              >
                <option value="" disabled>Select Campus</option>
                <option value="main">Main Campus</option>
                <option value="north">North Campus</option>
              </select>
            </div>
          </div>
        )}

        {data.hasDepartments && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]">Department</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <BookOpen className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <select
                value={selections.departmentId}
                onChange={e => handleChange('departmentId', e.target.value)}
                className="block w-full h-11 rounded-lg border border-white/10 bg-[#111D31] text-white pl-10 px-3 py-2 text-sm focus:border-[#168BFF] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/20 appearance-none"
              >
                <option value="" disabled>Select Department</option>
                <option value="cs">Computer Science</option>
                <option value="ece">Electronics and Communication Engineering (ECE)</option>
              </select>
            </div>
          </div>
        )}

        {isTeacher ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]">Designation</label>
            <input
              type="text"
              value={selections.designation}
              onChange={e => handleChange('designation', e.target.value)}
              placeholder="e.g. Associate Professor"
              className="block w-full h-11 rounded-lg border border-white/10 bg-[#111D31] text-white px-3 py-2 text-sm focus:border-[#168BFF] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/20"
            />
          </div>
        ) : (
          <>
            {data.usesSemesters && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#F5F7FB]">Semester / Year</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Layers className="h-5 w-5 text-[#6F7B8E]" />
                  </div>
                  <select
                    value={selections.semesterId}
                    onChange={e => handleChange('semesterId', e.target.value)}
                    className="block w-full h-11 rounded-lg border border-white/10 bg-[#111D31] text-white pl-10 px-3 py-2 text-sm focus:border-[#168BFF] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/20 appearance-none"
                  >
                    <option value="" disabled>Select Semester</option>
                    <option value="s1">Semester 1 (Year 1)</option>
                    <option value="s2">Semester 2 (Year 1)</option>
                    <option value="s3">Semester 3 (Year 2)</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        disabled={!canProceed()}
        onClick={handleNext}
        className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
