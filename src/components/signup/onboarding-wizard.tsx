'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomeStep } from './steps/welcome-step';
import { RoleStep } from './steps/role-step';
import { CredentialsStep } from './steps/credentials-step';
import { TokenStep } from './steps/token-step';
import { InstitutionStep } from './steps/institution-step';
import { AcademicBranchStep } from './steps/academic-branch-step';
import { AcademicReviewStep } from './steps/academic-review-step';
import { TermsStep } from './steps/terms-step';
import { SuccessStep } from './steps/success-step';

export type UserRole = 'student' | 'teacher' | 'institute_head';

export interface SignupState {
  role?: UserRole;
  fullName?: string;
  email?: string;
  password?: string;
  // Institute Head Provisioning or Student/Teacher Invite Code
  token?: string;
  // University details resolved from token
  universityId?: string;
  universityName?: string;
  institutionType?: string;
  hasCampuses?: boolean;
  hasDepartments?: boolean;
  usesSemesters?: boolean;
  
  // Academic selections
  campusId?: string;
  campusName?: string;
  departmentId?: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  academicLevelId?: string;
  academicLevelName?: string;
  semesterId?: string;
  semesterName?: string;
  sectionId?: string;
  sectionName?: string;
  
  // Teacher specific
  designation?: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<SignupState>({});

  const nextStep = (stepData?: Partial<SignupState>) => {
    if (stepData) {
      setData(prev => ({ ...prev, ...stepData }));
    }
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  // Variants for Framer Motion
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-background text-foreground overflow-hidden p-4">
      {/* Progress Bar (hidden on welcome and success) */}
      {step > 1 && step < 7 && (
        <div className="absolute top-8 left-0 right-0 max-w-md mx-auto px-4 w-full">
          <div className="flex items-center justify-between gap-2">
            {[2, 3, 4, 5, 6].map((idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  step >= idx ? 'bg-primary' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            {step === 1 && <WelcomeStep onNext={nextStep} />}
            {step === 2 && <RoleStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === 3 && <CredentialsStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === 4 && data.role === 'institute_head' && <TokenStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === 4 && data.role !== 'institute_head' && <InstitutionStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === 5 && data.role !== 'institute_head' && <AcademicBranchStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === (data.role === 'institute_head' ? 5 : 6) && <AcademicReviewStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === (data.role === 'institute_head' ? 6 : 7) && <TermsStep data={data} onNext={nextStep} onPrev={prevStep} />}
            {step === (data.role === 'institute_head' ? 7 : 8) && <SuccessStep data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
